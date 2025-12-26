import { prisma } from '@/lib/db/prisma';
import { getReglaClient } from './client';
import type { Booking, User, BookingAddon, Service, Vehicle, VehicleType, Lot } from '@prisma/client';

const DEFAULT_VAT_CODE = 'S1'; // Standard 24% VSK

const PRODUCT_CODES = {
  PARKING_SEDAN: 'PARK-SEDAN',
  PARKING_SUV: 'PARK-SUV',
  PARKING_VAN: 'PARK-VAN',
  INTERIOR_CLEAN: 'SVC-INTERIOR',
  EXTERIOR_WASH: 'SVC-EXTERIOR',
  FULL_DETAIL: 'SVC-DETAIL',
  EV_CHARGE: 'SVC-EVCHARGE',
  WINTER_SERVICE: 'SVC-WINTER',
  PREMIUM_SPOT: 'SVC-PREMIUM',
};

type BookingWithRelations = Booking & {
  user: User;
  addons: (BookingAddon & { service: Service })[];
  vehicle: Vehicle & { vehicleType: VehicleType };
  lot: Lot;
};

export async function syncBookingToRegla(bookingId: string): Promise<void> {
  const regla = getReglaClient();

  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    include: {
      user: true,
      vehicle: { include: { vehicleType: true } },
      lot: true,
      addons: { include: { service: true } },
    },
  }) as BookingWithRelations | null;

  if (!booking) {
    throw new Error(`Booking ${bookingId} not found`);
  }

  const syncLog = await prisma.reglaSyncLog.create({
    data: {
      entityType: 'invoice',
      entityId: bookingId,
      action: 'create',
      status: 'SYNCING',
    },
  });

  const startTime = Date.now();

  try {
    // 1. Ensure customer exists in Regla
    const reglaCustomerId = await ensureCustomerExists(booking.user);

    // 2. Build invoice lines
    const lines = buildInvoiceLines(booking);

    // 3. Create invoice in Regla
    const invoice = await regla.createInvoice({
      CustomerNumber: reglaCustomerId,
      InvoiceDate: new Date().toISOString().split('T')[0],
      DueDate: new Date().toISOString().split('T')[0],
      Reference: booking.reference,
      Comment: `Bílastæði - ${booking.lot.name} - ${booking.reference}`,
      Lines: lines,
    });

    // 4. Store Regla invoice reference
    await prisma.reglaInvoice.create({
      data: {
        bookingId: booking.id,
        reglaInvoiceId: invoice.InvoiceNumber,
        reglaInvoiceNo: invoice.InvoiceNumber,
        invoiceDate: new Date(),
        dueDate: new Date(),
        totalAmount: invoice.TotalWithVAT,
        vatAmount: invoice.TotalWithVAT - invoice.Total,
        syncStatus: 'SYNCED',
        lastSyncAt: new Date(),
        rawResponse: invoice as object,
      },
    });

    // 5. Update sync log
    await prisma.reglaSyncLog.update({
      where: { id: syncLog.id },
      data: {
        status: 'SYNCED',
        responsePayload: invoice as object,
        duration: Date.now() - startTime,
      },
    });

  } catch (error) {
    await prisma.reglaSyncLog.update({
      where: { id: syncLog.id },
      data: {
        status: 'FAILED',
        errorMessage: error instanceof Error ? error.message : 'Unknown error',
        duration: Date.now() - startTime,
      },
    });

    throw error;
  }
}

async function ensureCustomerExists(user: User): Promise<string> {
  const regla = getReglaClient();

  const existingMapping = await prisma.reglaCustomer.findUnique({
    where: { userId: user.id },
  });

  if (existingMapping?.reglaCustomerNo) {
    return existingMapping.reglaCustomerNo;
  }

  // Try to find by kennitala in Regla
  if (user.kennitala) {
    const existing = await regla.getCustomerByKennitala(user.kennitala);
    if (existing?.CustomerNumber) {
      await prisma.reglaCustomer.upsert({
        where: { userId: user.id },
        create: {
          userId: user.id,
          reglaCustomerId: existing.CustomerNumber,
          reglaCustomerNo: existing.CustomerNumber,
          syncStatus: 'SYNCED',
          lastSyncAt: new Date(),
        },
        update: {
          reglaCustomerId: existing.CustomerNumber,
          reglaCustomerNo: existing.CustomerNumber,
          syncStatus: 'SYNCED',
          lastSyncAt: new Date(),
        },
      });
      return existing.CustomerNumber;
    }
  }

  // Create new customer in Regla
  const customerNumber = await regla.createCustomer({
    Name: user.name || user.email,
    Email: user.email,
    Phone: user.phone || undefined,
    Kennitala: user.kennitala || undefined,
  });

  await prisma.reglaCustomer.upsert({
    where: { userId: user.id },
    create: {
      userId: user.id,
      reglaCustomerId: customerNumber,
      reglaCustomerNo: customerNumber,
      syncStatus: 'SYNCED',
      lastSyncAt: new Date(),
    },
    update: {
      reglaCustomerId: customerNumber,
      reglaCustomerNo: customerNumber,
      syncStatus: 'SYNCED',
      lastSyncAt: new Date(),
    },
  });

  return customerNumber;
}

function buildInvoiceLines(booking: BookingWithRelations) {
  const lines = [];

  // Base parking fee
  const parkingProductCode = getParkingProductCode(booking.vehicle.vehicleType.code);
  lines.push({
    ProductNumber: parkingProductCode,
    Description: `Bílastæði ${booking.totalDays} dagar - ${booking.vehicle.vehicleType.name}`,
    Quantity: booking.totalDays,
    UnitPrice: booking.basePricePerDay,
    VATCode: DEFAULT_VAT_CODE,
  });

  // Add-on services
  for (const addon of booking.addons) {
    const productCode = getServiceProductCode(addon.service.code);
    lines.push({
      ProductNumber: productCode,
      Description: addon.service.name,
      Quantity: 1,
      UnitPrice: addon.price,
      VATCode: DEFAULT_VAT_CODE,
    });
  }

  // Discount line (if any)
  if (booking.discountAmount > 0) {
    lines.push({
      Description: 'Afsláttur',
      Quantity: 1,
      UnitPrice: -booking.discountAmount,
      VATCode: DEFAULT_VAT_CODE,
    });
  }

  return lines;
}

function getParkingProductCode(vehicleTypeCode: string): string {
  const mapping: Record<string, string> = {
    sedan: PRODUCT_CODES.PARKING_SEDAN,
    suv: PRODUCT_CODES.PARKING_SUV,
    van: PRODUCT_CODES.PARKING_VAN,
  };
  return mapping[vehicleTypeCode] || PRODUCT_CODES.PARKING_SEDAN;
}

function getServiceProductCode(serviceCode: string): string {
  const mapping: Record<string, string> = {
    interior_clean: PRODUCT_CODES.INTERIOR_CLEAN,
    exterior_wash: PRODUCT_CODES.EXTERIOR_WASH,
    full_detail: PRODUCT_CODES.FULL_DETAIL,
    ev_charge: PRODUCT_CODES.EV_CHARGE,
    winter_service: PRODUCT_CODES.WINTER_SERVICE,
    premium_spot: PRODUCT_CODES.PREMIUM_SPOT,
  };
  return mapping[serviceCode] || serviceCode;
}

export async function syncPaymentToRegla(paymentId: string): Promise<void> {
  const regla = getReglaClient();

  const payment = await prisma.payment.findUnique({
    where: { id: paymentId },
    include: {
      booking: {
        include: {
          reglaInvoice: true,
        },
      },
    },
  });

  if (!payment || !payment.booking.reglaInvoice?.reglaInvoiceNo) {
    throw new Error('Payment or Regla invoice not found');
  }

  // Get payment methods from Regla
  const paymentMethods = await regla.getPaymentMethods();
  const onlinePaymentMethod = paymentMethods.find(
    (pm) => pm.Name.toLowerCase().includes('kort') || pm.Name.toLowerCase().includes('online')
  ) || paymentMethods[0];

  if (!onlinePaymentMethod) {
    throw new Error('No payment method found in Regla');
  }

  // Register payment
  await regla.registerPayment(
    payment.booking.reglaInvoice.reglaInvoiceNo,
    payment.amount,
    onlinePaymentMethod.PaymentMethodNumber,
    payment.paidAt?.toISOString().split('T')[0]
  );

  // Update payment record
  await prisma.reglaPayment.create({
    data: {
      paymentId: payment.id,
      syncStatus: 'SYNCED',
      lastSyncAt: new Date(),
    },
  });
}
