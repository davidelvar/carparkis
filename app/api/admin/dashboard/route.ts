import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth/config';
import { prisma } from '@/lib/db/prisma';

export async function GET() {
  try {
    const session = await auth();
    
    // Allow both ADMIN and OPERATOR roles to access dashboard data
    if (!session?.user?.role || !['ADMIN', 'OPERATOR'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfWeek = new Date(startOfToday);
    startOfWeek.setDate(startOfWeek.getDate() - 7);
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);

    // Get total bookings
    const totalBookings = await prisma.booking.count();

    // Get bookings this month
    const bookingsThisMonth = await prisma.booking.count({
      where: {
        createdAt: { gte: startOfMonth },
      },
    });

    // Get bookings last month for comparison
    const bookingsLastMonth = await prisma.booking.count({
      where: {
        createdAt: { gte: startOfLastMonth, lt: startOfMonth },
      },
    });

    // Calculate booking trend
    const bookingTrend = bookingsLastMonth > 0 
      ? Math.round(((bookingsThisMonth - bookingsLastMonth) / bookingsLastMonth) * 100)
      : 0;

    // Get total revenue (confirmed/completed bookings)
    const revenueResult = await prisma.booking.aggregate({
      _sum: { totalPrice: true },
      where: {
        status: { in: ['CONFIRMED', 'CHECKED_IN', 'IN_PROGRESS', 'READY', 'CHECKED_OUT'] },
      },
    });
    const totalRevenue = revenueResult._sum.totalPrice || 0;

    // Revenue this month
    const revenueThisMonthResult = await prisma.booking.aggregate({
      _sum: { totalPrice: true },
      where: {
        status: { in: ['CONFIRMED', 'CHECKED_IN', 'IN_PROGRESS', 'READY', 'CHECKED_OUT'] },
        createdAt: { gte: startOfMonth },
      },
    });
    const revenueThisMonth = revenueThisMonthResult._sum.totalPrice || 0;

    // Revenue last month
    const revenueLastMonthResult = await prisma.booking.aggregate({
      _sum: { totalPrice: true },
      where: {
        status: { in: ['CONFIRMED', 'CHECKED_IN', 'IN_PROGRESS', 'READY', 'CHECKED_OUT'] },
        createdAt: { gte: startOfLastMonth, lt: startOfMonth },
      },
    });
    const revenueLastMonth = revenueLastMonthResult._sum.totalPrice || 0;

    const revenueTrend = revenueLastMonth > 0
      ? Math.round(((revenueThisMonth - revenueLastMonth) / revenueLastMonth) * 100)
      : 0;

    // Get active bookings (cars currently on site)
    // Use same logic as lots API - vehicles that are actually parked
    const activeBookings = await prisma.booking.count({
      where: {
        status: { in: ['CONFIRMED', 'CHECKED_IN', 'IN_PROGRESS', 'READY'] },
        dropOffTime: { lte: now },
        pickUpTime: { gte: now },
      },
    });

    // Get total lot capacity
    const lotsResult = await prisma.lot.aggregate({
      _sum: { totalSpaces: true },
      where: { isActive: true },
    });
    const totalCapacity = lotsResult._sum.totalSpaces || 100;
    const occupancyRate = totalCapacity > 0 ? Math.round((activeBookings / totalCapacity) * 100) : 0;

    // Get today's arrivals (drop-offs)
    const todayArrivals = await prisma.booking.count({
      where: {
        dropOffTime: {
          gte: startOfToday,
          lt: new Date(startOfToday.getTime() + 24 * 60 * 60 * 1000),
        },
        status: { in: ['CONFIRMED', 'CHECKED_IN'] },
      },
    });

    // Get today's departures (pick-ups)
    const todayDepartures = await prisma.booking.count({
      where: {
        pickUpTime: {
          gte: startOfToday,
          lt: new Date(startOfToday.getTime() + 24 * 60 * 60 * 1000),
        },
        status: { in: ['IN_PROGRESS', 'READY'] },
      },
    });

    // Get pending bookings needing attention
    const pendingBookings = await prisma.booking.count({
      where: { status: 'PENDING' },
    });

    // Revenue by day (last 7 days)
    const revenueByDay = await Promise.all(
      Array.from({ length: 7 }, async (_, i) => {
        const date = new Date(startOfToday);
        date.setDate(date.getDate() - (6 - i));
        const nextDate = new Date(date);
        nextDate.setDate(nextDate.getDate() + 1);

        const result = await prisma.booking.aggregate({
          _sum: { totalPrice: true },
          where: {
            status: { in: ['CONFIRMED', 'CHECKED_IN', 'IN_PROGRESS', 'READY', 'CHECKED_OUT'] },
            createdAt: { gte: date, lt: nextDate },
          },
        });

        const dayNames = ['Sun', 'Mán', 'Þri', 'Mið', 'Fim', 'Fös', 'Lau'];
        return {
          date: dayNames[date.getDay()],
          revenue: result._sum.totalPrice || 0,
        };
      })
    );

    // Bookings by status
    const bookingsByStatus = await prisma.booking.groupBy({
      by: ['status'],
      _count: true,
    });

    // Recent bookings
    const recentBookings = await prisma.booking.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      include: {
        user: { select: { name: true, email: true } },
        vehicle: { select: { licensePlate: true, make: true, model: true } },
      },
    });

    // Top services
    const topServices = await prisma.bookingAddon.groupBy({
      by: ['serviceId'],
      _count: true,
      _sum: { price: true },
      orderBy: { _count: { serviceId: 'desc' } },
      take: 5,
    });

    const servicesWithNames = await Promise.all(
      topServices.map(async (s) => {
        const service = await prisma.service.findUnique({
          where: { id: s.serviceId },
          select: { name: true, nameEn: true },
        });
        return {
          name: service?.name || 'Unknown',
          nameEn: service?.nameEn || 'Unknown',
          count: s._count,
          revenue: s._sum.price || 0,
        };
      })
    );

    // Occupancy forecast for next 30 days
    const occupancyForecast = await Promise.all(
      Array.from({ length: 30 }, async (_, i) => {
        const date = new Date(startOfToday);
        date.setDate(date.getDate() + i);
        const nextDate = new Date(date);
        nextDate.setDate(nextDate.getDate() + 1);

        // Count bookings that will be on site on this day
        const bookingsOnDay = await prisma.booking.count({
          where: {
            status: { in: ['CONFIRMED', 'CHECKED_IN', 'IN_PROGRESS', 'READY', 'PENDING'] },
            dropOffTime: { lt: nextDate },
            pickUpTime: { gt: date },
          },
        });

        // Count arrivals (drop-offs) for this day
        const arrivals = await prisma.booking.count({
          where: {
            status: { in: ['CONFIRMED', 'CHECKED_IN', 'PENDING'] },
            dropOffTime: { gte: date, lt: nextDate },
          },
        });

        // Count departures (pick-ups) for this day
        const departures = await prisma.booking.count({
          where: {
            status: { in: ['CONFIRMED', 'CHECKED_IN', 'IN_PROGRESS', 'READY', 'PENDING'] },
            pickUpTime: { gte: date, lt: nextDate },
          },
        });

        const occupancy = totalCapacity > 0 ? Math.round((bookingsOnDay / totalCapacity) * 100) : 0;

        return {
          date: date.toISOString().split('T')[0],
          day: date.getDate(),
          bookings: bookingsOnDay,
          occupancy: Math.min(occupancy, 100),
          capacity: totalCapacity,
          arrivals,
          departures,
        };
      })
    );

    return NextResponse.json({
      stats: {
        totalBookings,
        bookingsThisMonth,
        bookingTrend,
        totalRevenue,
        revenueThisMonth,
        revenueTrend,
        activeBookings,
        totalCapacity,
        occupancyRate,
        todayArrivals,
        todayDepartures,
        pendingBookings,
      },
      charts: {
        revenueByDay,
        bookingsByStatus: bookingsByStatus.map((b) => ({
          status: b.status,
          count: b._count,
        })),
      },
      recentBookings: recentBookings.map((b) => ({
        id: b.id,
        reference: b.reference,
        customerName: b.user.name || b.user.email,
        licensePlate: b.vehicle.licensePlate,
        vehicle: `${b.vehicle.make || ''} ${b.vehicle.model || ''}`.trim() || 'N/A',
        status: b.status,
        dropOffTime: b.dropOffTime,
        pickUpTime: b.pickUpTime,
        totalPrice: b.totalPrice,
        createdAt: b.createdAt,
      })),
      topServices: servicesWithNames,
      occupancyForecast,
    });
  } catch (error) {
    console.error('Dashboard API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch dashboard data' },
      { status: 500 }
    );
  }
}
