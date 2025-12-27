import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { generateBookingReference } from '@/lib/utils';
import { auth } from '@/lib/auth/config';
import { z } from 'zod';
import { rateLimit, rateLimits } from '@/lib/rate-limit';

const createBookingSchema = z.object({
  licensePlate: z.string().min(1),
  vehicleTypeId: z.string().min(1),
  lotId: z.string().optional(),
  departureFlightNumber: z.string().optional(),
  departureFlightDate: z.string().optional(),
  arrivalFlightNumber: z.string().optional(),
  arrivalFlightDate: z.string().optional(),
  dropOffTime: z.string().min(1),
  pickUpTime: z.string().min(1),
  selectedAddons: z.array(z.string()).default([]),
  notes: z.string().optional(),
  totalDays: z.number().min(1),
  basePricePerDay: z.number().min(0),
  baseTotal: z.number().min(0),
  addonsTotal: z.number().min(0),
  totalPrice: z.number().min(0),
  locale: z.enum(['is', 'en']).optional().default('is'),
  // Guest contact info (for non-authenticated users)
  guestName: z.string().optional(),
  guestEmail: z.string().email().optional(),
  guestPhone: z.string().optional(),
  vehicleInfo: z.object({
    make: z.string().optional(),
    model: z.string().optional(),
    year: z.number().optional(),
    color: z.string().optional(),
    isElectric: z.boolean().optional(),
  }).optional(),
});

export async function POST(request: NextRequest) {
  // Rate limit booking creation to prevent spam
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0] || 
             request.headers.get('x-real-ip') || 
             'anonymous';
  
  const { success, remaining, reset } = rateLimit(ip, 'booking', rateLimits.booking);
  
  if (!success) {
    return NextResponse.json(
      { success: false, error: 'Too many booking requests. Please try again later.' },
      { 
        status: 429,
        headers: {
          'X-RateLimit-Remaining': '0',
          'X-RateLimit-Reset': reset.toString(),
          'Retry-After': Math.ceil((reset - Date.now()) / 1000).toString(),
        }
      }
    );
  }

  try {
    const body = await request.json();
    const data = createBookingSchema.parse(body);

    // Get or create vehicle type
    let vehicleType = await prisma.vehicleType.findUnique({
      where: { code: data.vehicleTypeId },
    });

    if (!vehicleType) {
      // Create default vehicle types if not exist
      vehicleType = await prisma.vehicleType.create({
        data: {
          code: data.vehicleTypeId,
          name: data.vehicleTypeId === 'sedan' ? 'Fólksbíll' : data.vehicleTypeId === 'suv' ? 'Jeppi/SUV' : 'Sendibíll',
          nameEn: data.vehicleTypeId === 'sedan' ? 'Sedan' : data.vehicleTypeId === 'suv' ? 'SUV/Jeep' : 'Van',
        },
      });
    }

    // Get or create vehicle
    let vehicle = await prisma.vehicle.findUnique({
      where: { licensePlate: data.licensePlate },
    });

    if (!vehicle) {
      vehicle = await prisma.vehicle.create({
        data: {
          licensePlate: data.licensePlate,
          vehicleTypeId: vehicleType.id,
          make: data.vehicleInfo?.make,
          model: data.vehicleInfo?.model,
          year: data.vehicleInfo?.year,
          color: data.vehicleInfo?.color,
          isElectric: data.vehicleInfo?.isElectric || false,
        },
      });
    }

    // Get default lot or first active lot
    let lot = await prisma.lot.findFirst({
      where: { isActive: true },
    });

    if (!lot) {
      // Create default lot if none exists
      lot = await prisma.lot.create({
        data: {
          name: 'KEF Bílastæði',
          nameEn: 'KEF Parking',
          slug: 'kef-main',
          totalSpaces: 200,
          isActive: true,
        },
      });
    }

    // Get authenticated user or create/use guest user
    const session = await auth();
    let user;
    
    if (session?.user?.id) {
      // Use authenticated user and update their locale preference
      user = await prisma.user.update({
        where: { id: session.user.id },
        data: { locale: data.locale },
      });
    }
    
    if (!user && data.guestEmail) {
      // Check if a user with this email already exists
      user = await prisma.user.findFirst({
        where: { email: data.guestEmail.toLowerCase() },
      });

      if (user) {
        // Update existing user's info if they provided new details
        user = await prisma.user.update({
          where: { id: user.id },
          data: {
            name: data.guestName || user.name,
            phone: data.guestPhone || user.phone,
            locale: data.locale,
          },
        });
      } else {
        // Create a new account for this guest
        user = await prisma.user.create({
          data: {
            email: data.guestEmail.toLowerCase(),
            name: data.guestName || 'Guest',
            phone: data.guestPhone,
            role: 'CUSTOMER',
            locale: data.locale,
          },
        });
      }
    }
    
    if (!user) {
      // Final fallback: shared guest user (shouldn't happen if guestEmail is required)
      user = await prisma.user.findFirst({
        where: { email: 'guest@carpark.is' },
      });

      if (!user) {
        user = await prisma.user.create({
          data: {
            email: 'guest@carpark.is',
            name: 'Guest User',
            role: 'CUSTOMER',
            locale: data.locale,
          },
        });
      }
    }

    // Generate unique reference
    const reference = generateBookingReference();

    // Create booking
    const booking = await prisma.booking.create({
      data: {
        reference,
        userId: user.id,
        vehicleId: vehicle.id,
        lotId: lot.id,
        // Store guest contact info if provided (for non-authenticated users)
        guestName: data.guestName || null,
        guestEmail: data.guestEmail || null,
        guestPhone: data.guestPhone || null,
        departureFlightNumber: data.departureFlightNumber,
        departureFlightTime: data.departureFlightDate ? new Date(data.departureFlightDate) : null,
        arrivalFlightNumber: data.arrivalFlightNumber,
        arrivalFlightTime: data.arrivalFlightDate ? new Date(data.arrivalFlightDate) : null,
        dropOffTime: new Date(data.dropOffTime),
        pickUpTime: new Date(data.pickUpTime),
        totalDays: data.totalDays,
        basePricePerDay: data.basePricePerDay,
        baseTotal: data.baseTotal,
        addonsTotal: data.addonsTotal,
        discountAmount: 0,
        totalPrice: data.totalPrice,
        status: 'PENDING',
        notes: data.notes,
      },
      include: {
        vehicle: { include: { vehicleType: true } },
        lot: true,
      },
    });

    // Create booking addons
    if (data.selectedAddons.length > 0) {
      for (const serviceId of data.selectedAddons) {
        // Look up service by ID
        const service = await prisma.service.findUnique({
          where: { id: serviceId },
          include: {
            lotServices: {
              where: {
                vehicleType: { code: data.vehicleTypeId },
              },
            },
          },
        });

        if (service) {
          // Get price from lotService for this vehicle type, or default to 0
          const lotService = service.lotServices[0];
          const price = lotService?.price || 0;

          await prisma.bookingAddon.create({
            data: {
              bookingId: booking.id,
              serviceId: service.id,
              price,
              status: 'PENDING',
            },
          });
        }
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        id: booking.id,
        reference: booking.reference,
        status: booking.status,
        totalPrice: booking.totalPrice,
      },
    });
  } catch (error) {
    console.error('Booking creation error:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: 'Invalid booking data', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { success: false, error: 'Failed to create booking' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const ref = searchParams.get('ref');
  const status = searchParams.get('status');
  const date = searchParams.get('date');

  try {
    // If ref is provided, return single booking
    if (ref) {
      const booking = await prisma.booking.findUnique({
        where: { reference: ref },
        include: {
          vehicle: { include: { vehicleType: true } },
          lot: true,
          addons: { include: { service: true } },
          user: { select: { id: true, name: true, email: true, phone: true } },
        },
      });

      if (!booking) {
        return NextResponse.json(
          { success: false, error: 'Booking not found' },
          { status: 404 }
        );
      }

      return NextResponse.json({ success: true, data: booking });
    }

    const where: any = {};

    if (status) {
      where.status = status;
    }

    if (date) {
      const dateStart = new Date(date);
      const dateEnd = new Date(date);
      dateEnd.setDate(dateEnd.getDate() + 1);

      where.OR = [
        { dropOffTime: { gte: dateStart, lt: dateEnd } },
        { pickUpTime: { gte: dateStart, lt: dateEnd } },
      ];
    }

    const bookings = await prisma.booking.findMany({
      where,
      include: {
        vehicle: { include: { vehicleType: true } },
        lot: true,
        addons: { include: { service: true } },
        user: { select: { id: true, name: true, email: true, phone: true } },
      },
      orderBy: { dropOffTime: 'asc' },
    });

    return NextResponse.json({ success: true, data: bookings });
  } catch (error) {
    console.error('Bookings fetch error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch bookings' },
      { status: 500 }
    );
  }
}
