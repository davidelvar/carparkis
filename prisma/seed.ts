import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

// Hash PIN for staff users
async function hashPin(pin: string): Promise<string> {
  return bcrypt.hash(pin, 10);
}

async function main() {
  console.log('🌱 Seeding database...');

  // Vehicle Types (Size-based: S, M, L, XL)
  const vehicleTypes = await Promise.all([
    prisma.vehicleType.upsert({
      where: { code: 'small' },
      update: { name: 'Lítill (S)', nameEn: 'Small (S)', sortOrder: 1 },
      create: { code: 'small', name: 'Lítill (S)', nameEn: 'Small (S)', sortOrder: 1 },
    }),
    prisma.vehicleType.upsert({
      where: { code: 'medium' },
      update: { name: 'Meðal (M)', nameEn: 'Medium (M)', sortOrder: 2 },
      create: { code: 'medium', name: 'Meðal (M)', nameEn: 'Medium (M)', sortOrder: 2 },
    }),
    prisma.vehicleType.upsert({
      where: { code: 'large' },
      update: { name: 'Stór (L)', nameEn: 'Large (L)', sortOrder: 3 },
      create: { code: 'large', name: 'Stór (L)', nameEn: 'Large (L)', sortOrder: 3 },
    }),
    prisma.vehicleType.upsert({
      where: { code: 'xlarge' },
      update: { name: 'Mjög stór (XL)', nameEn: 'Extra Large (XL)', sortOrder: 4 },
      create: { code: 'xlarge', name: 'Mjög stór (XL)', nameEn: 'Extra Large (XL)', sortOrder: 4 },
    }),
  ]);

  const vtMap: Record<string, string> = {
    small: vehicleTypes[0].id,
    medium: vehicleTypes[1].id,
    large: vehicleTypes[2].id,
    xlarge: vehicleTypes[3].id,
  };

  // Default Lot
  const lot = await prisma.lot.upsert({
    where: { slug: 'kef-main' },
    update: {},
    create: {
      name: 'KEF Bílastæði',
      nameEn: 'KEF Parking',
      slug: 'kef-main',
      address: 'Flugvallarsvæði, 235 Keflavíkurflugvöllur',
      totalSpaces: 200,
      isActive: true,
    },
  });

  // Lot Pricing: Base fee 7000 ISK + 600 ISK/day (same for all sizes)
  for (const vt of vehicleTypes) {
    await prisma.lotPricing.upsert({
      where: { lotId_vehicleTypeId: { lotId: lot.id, vehicleTypeId: vt.id } },
      update: { baseFee: 7000, pricePerDay: 600 },
      create: { lotId: lot.id, vehicleTypeId: vt.id, baseFee: 7000, pricePerDay: 600 },
    });
  }

  // Service Categories
  const categories = await Promise.all([
    prisma.serviceCategory.upsert({
      where: { code: 'charging' },
      update: { icon: 'charging' },
      create: { code: 'charging', name: 'Hleðsla', nameEn: 'Charging', icon: 'charging', sortOrder: 1 },
    }),
    prisma.serviceCategory.upsert({
      where: { code: 'cleaning' },
      update: { icon: 'cleaning' },
      create: { code: 'cleaning', name: 'Þrif', nameEn: 'Cleaning', icon: 'cleaning', sortOrder: 2 },
    }),
    prisma.serviceCategory.upsert({
      where: { code: 'deep_cleaning' },
      update: { icon: 'deep_cleaning' },
      create: { code: 'deep_cleaning', name: 'Djúphreinsun', nameEn: 'Deep Cleaning', icon: 'deep_cleaning', sortOrder: 3 },
    }),
    prisma.serviceCategory.upsert({
      where: { code: 'leather' },
      update: { icon: 'leather' },
      create: { code: 'leather', name: 'Leðurmeðferð', nameEn: 'Leather Care', icon: 'leather', sortOrder: 4 },
    }),
    prisma.serviceCategory.upsert({
      where: { code: 'detailing' },
      update: { icon: 'detailing' },
      create: { code: 'detailing', name: 'Smáatriði', nameEn: 'Detailing', icon: 'detailing', sortOrder: 5 },
    }),
    prisma.serviceCategory.upsert({
      where: { code: 'coating' },
      update: { icon: 'coating' },
      create: { code: 'coating', name: 'COAT', nameEn: 'Coating', icon: 'coating', sortOrder: 6 },
    }),
    prisma.serviceCategory.upsert({
      where: { code: 'polishing' },
      update: { icon: 'polishing' },
      create: { code: 'polishing', name: 'Mössun', nameEn: 'Polishing', icon: 'polishing', sortOrder: 7 },
    }),
  ]);

  const categoryMap: Record<string, string> = {
    charging: categories[0].id,
    cleaning: categories[1].id,
    deep_cleaning: categories[2].id,
    leather: categories[3].id,
    detailing: categories[4].id,
    coating: categories[5].id,
    polishing: categories[6].id,
  };

  // Services with size-based pricing: [S, M, L, XL]
  const serviceData = [
    { 
      code: 'ev_charge', 
      name: 'Hleðsla á Rafbíl', 
      nameEn: 'Electric Vehicle Charging', 
      description: 'Sett í samband 1-2 dögum fyrir komu sé tæki/snúra meðferðis',
      descriptionEn: 'Contact us 1-2 days before arrival if you have a device/cable with you',
      prices: { small: 3500, medium: 3500, large: 3500, xlarge: 3500 },
      category: 'charging',
    },
    { 
      code: 'general_clean', 
      name: 'Alþrif', 
      nameEn: 'General Cleaning', 
      description: 'Alþrif að innan sem utan',
      descriptionEn: 'Thorough cleaning inside and out',
      prices: { small: 17500, medium: 21000, large: 24000, xlarge: 28500 },
      category: 'cleaning',
    },
    { 
      code: 'exterior_wash', 
      name: 'Þvottur að utan', 
      nameEn: 'Exterior Washing', 
      description: 'Tjöru, sápu & bón þvottur að utan',
      descriptionEn: 'Tar, soap & wax exterior wash',
      prices: { small: 11000, medium: 13000, large: 15000, xlarge: 15000 },
      category: 'cleaning',
    },
    { 
      code: 'hand_wax', 
      name: 'Handbón', 
      nameEn: 'Hand Wax', 
      description: 'Bæta handbóni við alþrif / þvott að utan',
      descriptionEn: 'Add hand wax to general cleaning/exterior washing',
      prices: { small: 5000, medium: 6000, large: 7000, xlarge: 8000 },
      category: 'detailing',
    },
    { 
      code: 'interior_clean', 
      name: 'Ryksugun og þrif að innan', 
      nameEn: 'Interior Cleaning', 
      description: 'Ryksugað, þrifið og borið á innréttingu',
      descriptionEn: 'Vacuumed, cleaned and applied to interior',
      prices: { small: 11000, medium: 13000, large: 14000, xlarge: 15000 },
      category: 'cleaning',
    },
    { 
      code: 'deep_clean_seats', 
      name: 'Djúphreinsun sæta', 
      nameEn: 'Deep Cleaning of Seats', 
      description: 'Djúphreinsun á stólum/sætum',
      descriptionEn: 'Deep cleaning of chairs/seats',
      prices: { small: 11000, medium: 13000, large: 15000, xlarge: 15000 },
      category: 'deep_cleaning',
    },
    { 
      code: 'deep_clean_carpets', 
      name: 'Djúphreinsun gólfteppa', 
      nameEn: 'Deep Cleaning of Carpets', 
      description: 'Djúphreinsun á gólfteppum',
      descriptionEn: 'Deep cleaning of carpets',
      prices: { small: 10000, medium: 11500, large: 13000, xlarge: 14500 },
      category: 'deep_cleaning',
    },
    { 
      code: 'leather_seats', 
      name: 'Leður hreinsun á sætum', 
      nameEn: 'Leather Seat Cleaning', 
      description: 'Leður hreinsun og næring borin á (Dr. leður)',
      descriptionEn: 'Leather cleaning and nourishment applied (Dr. Leather)',
      prices: { small: 12000, medium: 14000, large: 16000, xlarge: 18000 },
      category: 'leather',
    },
    { 
      code: 'leather_interior', 
      name: 'Leður hreinsun á innréttingu', 
      nameEn: 'Leather Interior Cleaning', 
      description: 'Hurðarspjöld, mælaborð og miðju stokkur',
      descriptionEn: 'Door panels, dashboard and center console',
      prices: { small: 8000, medium: 9000, large: 10000, xlarge: 11000 },
      category: 'leather',
    },
    { 
      code: 'rim_wash', 
      name: 'Felguþvottur', 
      nameEn: 'Rim Washing', 
      description: 'Sýruþvottur á felgum',
      descriptionEn: 'Acid washing of rims',
      prices: { small: 5500, medium: 6000, large: 6500, xlarge: 7000 },
      category: 'detailing',
    },
    { 
      code: 'engine_wash', 
      name: 'Vélarþvottur', 
      nameEn: 'Engine Wash', 
      description: 'Tjöru/olíu háþrýstiþvottur á vélarými',
      descriptionEn: 'Tar/oil high-pressure washing of engine compartment',
      prices: { small: 4000, medium: 4500, large: 5000, xlarge: 5500 },
      category: 'detailing',
    },
    { 
      code: 'm1_polish', 
      name: 'M1 mössun á lakki', 
      nameEn: 'M1 Polish', 
      description: 'M1 mössun á lakki',
      descriptionEn: 'M1 polishing of paint',
      prices: { small: 55000, medium: 65000, large: 70000, xlarge: 85000 },
      category: 'polishing',
    },
    { 
      code: 'm2_polish', 
      name: 'M2 mössun á lakki', 
      nameEn: 'M2 Polish', 
      description: 'M2 mössun á lakki',
      descriptionEn: 'M2 polishing of paint',
      prices: { small: 75000, medium: 90000, large: 105000, xlarge: 115000 },
      category: 'polishing',
    },
    { 
      code: 'm3_polish', 
      name: 'M3 mössun á lakki', 
      nameEn: 'M3 Polish', 
      description: 'M3 mössun á lakki',
      descriptionEn: 'M3 polishing of paint',
      prices: { small: 105000, medium: 125000, large: 145000, xlarge: 155000 },
      category: 'polishing',
    },
    { 
      code: 'coat_body', 
      name: 'COAT á yfirbyggingu', 
      nameEn: 'COAT on Bodywork', 
      description: 'COAT á yfirbyggingu',
      descriptionEn: 'COAT protective coating on bodywork',
      prices: { small: 25000, medium: 35000, large: 40000, xlarge: 45000 },
      category: 'coating',
    },
    { 
      code: 'coat_windows', 
      name: 'COAT á rúður', 
      nameEn: 'COAT on Windows', 
      description: 'COAT á rúður',
      descriptionEn: 'COAT protective coating on windows',
      prices: { small: 18000, medium: 21000, large: 22000, xlarge: 24000 },
      category: 'coating',
    },
    { 
      code: 'coat_rims', 
      name: 'COAT á felgur', 
      nameEn: 'COAT on Rims', 
      description: 'COAT á felgur',
      descriptionEn: 'COAT protective coating on rims',
      prices: { small: 18000, medium: 21000, large: 22000, xlarge: 24000 },
      category: 'coating',
    },
  ];

  for (let i = 0; i < serviceData.length; i++) {
    const s = serviceData[i];
    const service = await prisma.service.upsert({
      where: { code: s.code },
      update: { 
        name: s.name, 
        nameEn: s.nameEn, 
        description: s.description,
        descriptionEn: s.descriptionEn,
        categoryId: categoryMap[s.category],
        sortOrder: i + 1 
      },
      create: { 
        code: s.code, 
        name: s.name, 
        nameEn: s.nameEn, 
        description: s.description,
        descriptionEn: s.descriptionEn,
        categoryId: categoryMap[s.category],
        sortOrder: i + 1 
      },
    });
    
    // Create pricing for each vehicle size
    for (const [size, price] of Object.entries(s.prices)) {
      await prisma.lotService.upsert({
        where: { 
          lotId_serviceId_vehicleTypeId: { 
            lotId: lot.id, 
            serviceId: service.id,
            vehicleTypeId: vtMap[size],
          } 
        },
        update: { price },
        create: { 
          lotId: lot.id, 
          serviceId: service.id, 
          vehicleTypeId: vtMap[size],
          price, 
          isAvailable: true 
        },
      });
    }
  }

  // Users (with PIN for staff)
  const staffPin = await hashPin('1234'); // Default PIN: 1234

  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@carpark.is' },
    update: { pin: staffPin },
    create: { email: 'admin@carpark.is', name: 'Admin', role: 'ADMIN', pin: staffPin },
  });
  const operatorUser = await prisma.user.upsert({
    where: { email: 'operator@carpark.is' },
    update: { pin: staffPin },
    create: { email: 'operator@carpark.is', name: 'Operator', role: 'OPERATOR', pin: staffPin },
  });

  // Test Customers
  const customers = await Promise.all([
    prisma.user.upsert({
      where: { email: 'jon@example.is' },
      update: {},
      create: { email: 'jon@example.is', name: 'Jón Jónsson', phone: '+354 661 1234', role: 'CUSTOMER' },
    }),
    prisma.user.upsert({
      where: { email: 'anna@example.is' },
      update: {},
      create: { email: 'anna@example.is', name: 'Anna Sigurðardóttir', phone: '+354 772 5678', role: 'CUSTOMER' },
    }),
    prisma.user.upsert({
      where: { email: 'olafur@example.is' },
      update: {},
      create: { email: 'olafur@example.is', name: 'Ólafur Guðmundsson', phone: '+354 883 9012', role: 'CUSTOMER' },
    }),
    prisma.user.upsert({
      where: { email: 'helga@example.is' },
      update: {},
      create: { email: 'helga@example.is', name: 'Helga Þorsteinsdóttir', phone: '+354 554 3456', role: 'CUSTOMER' },
    }),
    prisma.user.upsert({
      where: { email: 'magnus@example.is' },
      update: {},
      create: { email: 'magnus@example.is', name: 'Magnús Einarsson', phone: '+354 665 7890', role: 'CUSTOMER' },
    }),
    prisma.user.upsert({
      where: { email: 'kristin@example.is' },
      update: {},
      create: { email: 'kristin@example.is', name: 'Kristín Pálsdóttir', phone: '+354 776 2345', role: 'CUSTOMER' },
    }),
    prisma.user.upsert({
      where: { email: 'siggi@example.is' },
      update: {},
      create: { email: 'siggi@example.is', name: 'Sigurður Björnsson', phone: '+354 887 6789', role: 'CUSTOMER' },
    }),
    prisma.user.upsert({
      where: { email: 'gudrun@example.is' },
      update: {},
      create: { email: 'gudrun@example.is', name: 'Guðrún Ólafsdóttir', phone: '+354 558 0123', role: 'CUSTOMER' },
    }),
  ]);

  // Test Vehicles
  const vehicles = await Promise.all([
    prisma.vehicle.upsert({
      where: { licensePlate: 'AB123' },
      update: {},
      create: { licensePlate: 'AB123', make: 'Toyota', model: 'Yaris', year: 2022, color: 'White', isElectric: false, vehicleTypeId: vtMap.small },
    }),
    prisma.vehicle.upsert({
      where: { licensePlate: 'CD456' },
      update: {},
      create: { licensePlate: 'CD456', make: 'Tesla', model: 'Model 3', year: 2023, color: 'Black', isElectric: true, vehicleTypeId: vtMap.medium },
    }),
    prisma.vehicle.upsert({
      where: { licensePlate: 'EF789' },
      update: {},
      create: { licensePlate: 'EF789', make: 'Volkswagen', model: 'ID.4', year: 2023, color: 'Blue', isElectric: true, vehicleTypeId: vtMap.medium },
    }),
    prisma.vehicle.upsert({
      where: { licensePlate: 'GH012' },
      update: {},
      create: { licensePlate: 'GH012', make: 'Toyota', model: 'Land Cruiser', year: 2021, color: 'Silver', isElectric: false, vehicleTypeId: vtMap.xlarge },
    }),
    prisma.vehicle.upsert({
      where: { licensePlate: 'IJ345' },
      update: {},
      create: { licensePlate: 'IJ345', make: 'Hyundai', model: 'Kona Electric', year: 2022, color: 'Red', isElectric: true, vehicleTypeId: vtMap.small },
    }),
    prisma.vehicle.upsert({
      where: { licensePlate: 'KL678' },
      update: {},
      create: { licensePlate: 'KL678', make: 'Skoda', model: 'Octavia', year: 2020, color: 'Gray', isElectric: false, vehicleTypeId: vtMap.medium },
    }),
    prisma.vehicle.upsert({
      where: { licensePlate: 'MN901' },
      update: {},
      create: { licensePlate: 'MN901', make: 'BMW', model: 'X5', year: 2023, color: 'Black', isElectric: false, vehicleTypeId: vtMap.large },
    }),
    prisma.vehicle.upsert({
      where: { licensePlate: 'OP234' },
      update: {},
      create: { licensePlate: 'OP234', make: 'Volvo', model: 'XC90', year: 2022, color: 'White', isElectric: false, vehicleTypeId: vtMap.xlarge },
    }),
    prisma.vehicle.upsert({
      where: { licensePlate: 'QR567' },
      update: {},
      create: { licensePlate: 'QR567', make: 'Polestar', model: '2', year: 2023, color: 'Midnight', isElectric: true, vehicleTypeId: vtMap.medium },
    }),
    prisma.vehicle.upsert({
      where: { licensePlate: 'ST890' },
      update: {},
      create: { licensePlate: 'ST890', make: 'Mercedes', model: 'EQC', year: 2022, color: 'Silver', isElectric: true, vehicleTypeId: vtMap.large },
    }),
  ]);

  // Get services for addons
  const generalClean = await prisma.service.findUnique({ where: { code: 'general_clean' } });
  const evCharge = await prisma.service.findUnique({ where: { code: 'ev_charge' } });
  const interiorClean = await prisma.service.findUnique({ where: { code: 'interior_clean' } });
  const exteriorWash = await prisma.service.findUnique({ where: { code: 'exterior_wash' } });
  const handWax = await prisma.service.findUnique({ where: { code: 'hand_wax' } });

  // Helper to generate booking reference
  const generateRef = (num: number) => `KEF-2025-TEST${num.toString().padStart(2, '0')}`;

  // Get dates relative to today
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const addDays = (date: Date, days: number) => new Date(date.getTime() + days * 24 * 60 * 60 * 1000);
  const addHours = (date: Date, hours: number) => new Date(date.getTime() + hours * 60 * 60 * 1000);

  // Clear existing test bookings
  await prisma.bookingAddon.deleteMany({ where: { booking: { reference: { startsWith: 'KEF-2025-TEST' } } } });
  await prisma.booking.deleteMany({ where: { reference: { startsWith: 'KEF-2025-TEST' } } });

  console.log('📦 Creating test bookings...');

  // Booking 1: Arriving today (CONFIRMED) - with services
  const booking1 = await prisma.booking.create({
    data: {
      reference: generateRef(1),
      userId: customers[0].id,
      vehicleId: vehicles[0].id,
      lotId: lot.id,
      status: 'CONFIRMED',
      dropOffTime: addHours(today, 10), // Today at 10:00
      pickUpTime: addDays(addHours(today, 10), 5), // 5 days later
      departureFlightNumber: 'FI615',
      arrivalFlightNumber: 'FI614',
      totalDays: 5,
      basePricePerDay: 600,
      baseTotal: 10000, // 7000 + 5*600
      addonsTotal: 17500,
      totalPrice: 27500,
    },
  });
  await prisma.bookingAddon.create({
    data: { bookingId: booking1.id, serviceId: generalClean!.id, price: 17500, status: 'PENDING' },
  });

  // Booking 2: Arriving today (CONFIRMED) - Tesla with charging
  const booking2 = await prisma.booking.create({
    data: {
      reference: generateRef(2),
      userId: customers[1].id,
      vehicleId: vehicles[1].id,
      lotId: lot.id,
      status: 'CONFIRMED',
      dropOffTime: addHours(today, 14), // Today at 14:00
      pickUpTime: addDays(addHours(today, 14), 7), // 7 days later
      departureFlightNumber: 'FI501',
      arrivalFlightNumber: 'FI500',
      totalDays: 7,
      basePricePerDay: 600,
      baseTotal: 11200,
      addonsTotal: 24500,
      totalPrice: 35700,
    },
  });
  await prisma.bookingAddon.createMany({
    data: [
      { bookingId: booking2.id, serviceId: evCharge!.id, price: 3500, status: 'PENDING' },
      { bookingId: booking2.id, serviceId: generalClean!.id, price: 21000, status: 'PENDING' },
    ],
  });

  // Booking 3: Already checked in (CHECKED_IN) - with pending services
  const booking3 = await prisma.booking.create({
    data: {
      reference: generateRef(3),
      userId: customers[2].id,
      vehicleId: vehicles[2].id,
      lotId: lot.id,
      status: 'CHECKED_IN',
      dropOffTime: addDays(today, -2),
      pickUpTime: addDays(today, 3),
      departureFlightNumber: 'WW901',
      arrivalFlightNumber: 'WW902',
      totalDays: 5,
      basePricePerDay: 600,
      baseTotal: 10000,
      addonsTotal: 16500,
      totalPrice: 26500,
      spotNumber: 'A-15',
      actualDropOff: addDays(today, -2),
    },
  });
  await prisma.bookingAddon.createMany({
    data: [
      { bookingId: booking3.id, serviceId: evCharge!.id, price: 3500, status: 'COMPLETED', completedAt: addDays(today, -1) },
      { bookingId: booking3.id, serviceId: interiorClean!.id, price: 13000, status: 'PENDING' },
    ],
  });

  // Booking 4: In progress (IN_PROGRESS) - services being done
  const booking4 = await prisma.booking.create({
    data: {
      reference: generateRef(4),
      userId: customers[3].id,
      vehicleId: vehicles[3].id,
      lotId: lot.id,
      status: 'IN_PROGRESS',
      dropOffTime: addDays(today, -3),
      pickUpTime: addDays(today, 1),
      departureFlightNumber: 'FI205',
      arrivalFlightNumber: 'FI206',
      totalDays: 4,
      basePricePerDay: 600,
      baseTotal: 9400,
      addonsTotal: 38500,
      totalPrice: 47900,
      spotNumber: 'B-08',
      actualDropOff: addDays(today, -3),
    },
  });
  await prisma.bookingAddon.createMany({
    data: [
      { bookingId: booking4.id, serviceId: generalClean!.id, price: 28500, status: 'IN_PROGRESS' },
      { bookingId: booking4.id, serviceId: handWax!.id, price: 8000, status: 'PENDING' },
    ],
  });

  // Booking 5: Ready for pickup (READY) - departing today
  const booking5 = await prisma.booking.create({
    data: {
      reference: generateRef(5),
      userId: customers[4].id,
      vehicleId: vehicles[4].id,
      lotId: lot.id,
      status: 'READY',
      dropOffTime: addDays(today, -4),
      pickUpTime: addHours(today, 16), // Today at 16:00
      departureFlightNumber: 'SK789',
      arrivalFlightNumber: 'SK788',
      totalDays: 4,
      basePricePerDay: 600,
      baseTotal: 9400,
      addonsTotal: 14500,
      totalPrice: 23900,
      spotNumber: 'A-22',
      actualDropOff: addDays(today, -4),
    },
  });
  await prisma.bookingAddon.createMany({
    data: [
      { bookingId: booking5.id, serviceId: evCharge!.id, price: 3500, status: 'COMPLETED', completedAt: addDays(today, -2) },
      { bookingId: booking5.id, serviceId: exteriorWash!.id, price: 11000, status: 'COMPLETED', completedAt: addDays(today, -1) },
    ],
  });

  // Booking 6: Ready for pickup (READY) - departing today
  const booking6 = await prisma.booking.create({
    data: {
      reference: generateRef(6),
      userId: customers[5].id,
      vehicleId: vehicles[5].id,
      lotId: lot.id,
      status: 'READY',
      dropOffTime: addDays(today, -6),
      pickUpTime: addHours(today, 18), // Today at 18:00
      departureFlightNumber: 'BA456',
      arrivalFlightNumber: 'BA455',
      totalDays: 6,
      basePricePerDay: 600,
      baseTotal: 10600,
      addonsTotal: 0,
      totalPrice: 10600,
      spotNumber: 'C-03',
      actualDropOff: addDays(today, -6),
    },
  });

  // Booking 7: Upcoming (CONFIRMED) - arriving tomorrow
  const booking7 = await prisma.booking.create({
    data: {
      reference: generateRef(7),
      userId: customers[6].id,
      vehicleId: vehicles[6].id,
      lotId: lot.id,
      status: 'CONFIRMED',
      dropOffTime: addDays(addHours(today, 9), 1), // Tomorrow at 09:00
      pickUpTime: addDays(addHours(today, 9), 8), // 7 days later
      departureFlightNumber: 'FI321',
      arrivalFlightNumber: 'FI322',
      totalDays: 7,
      basePricePerDay: 600,
      baseTotal: 11200,
      addonsTotal: 24000,
      totalPrice: 35200,
    },
  });
  await prisma.bookingAddon.create({
    data: { bookingId: booking7.id, serviceId: generalClean!.id, price: 24000, status: 'PENDING' },
  });

  // Booking 8: Upcoming (CONFIRMED) - arriving in 2 days
  const booking8 = await prisma.booking.create({
    data: {
      reference: generateRef(8),
      userId: customers[7].id,
      vehicleId: vehicles[7].id,
      lotId: lot.id,
      status: 'CONFIRMED',
      dropOffTime: addDays(addHours(today, 11), 2),
      pickUpTime: addDays(addHours(today, 11), 12),
      departureFlightNumber: 'DL100',
      arrivalFlightNumber: 'DL101',
      totalDays: 10,
      basePricePerDay: 600,
      baseTotal: 13000,
      addonsTotal: 28500,
      totalPrice: 41500,
    },
  });
  await prisma.bookingAddon.create({
    data: { bookingId: booking8.id, serviceId: generalClean!.id, price: 28500, status: 'PENDING' },
  });

  // Booking 9: Checked out (CHECKED_OUT) - completed yesterday
  const booking9 = await prisma.booking.create({
    data: {
      reference: generateRef(9),
      userId: customers[0].id,
      vehicleId: vehicles[8].id,
      lotId: lot.id,
      status: 'CHECKED_OUT',
      dropOffTime: addDays(today, -8),
      pickUpTime: addDays(today, -1),
      departureFlightNumber: 'FI999',
      arrivalFlightNumber: 'FI998',
      totalDays: 7,
      basePricePerDay: 600,
      baseTotal: 11200,
      addonsTotal: 24500,
      totalPrice: 35700,
      spotNumber: 'B-11',
      actualDropOff: addDays(today, -8),
      actualPickUp: addDays(today, -1),
    },
  });
  await prisma.bookingAddon.createMany({
    data: [
      { bookingId: booking9.id, serviceId: evCharge!.id, price: 3500, status: 'COMPLETED', completedAt: addDays(today, -5) },
      { bookingId: booking9.id, serviceId: generalClean!.id, price: 21000, status: 'COMPLETED', completedAt: addDays(today, -2) },
    ],
  });

  // Booking 10: On site - checked in, departing in 3 days
  const booking10 = await prisma.booking.create({
    data: {
      reference: generateRef(10),
      userId: customers[1].id,
      vehicleId: vehicles[9].id,
      lotId: lot.id,
      status: 'CHECKED_IN',
      dropOffTime: addDays(today, -1),
      pickUpTime: addDays(today, 3),
      departureFlightNumber: 'LH400',
      arrivalFlightNumber: 'LH401',
      totalDays: 4,
      basePricePerDay: 600,
      baseTotal: 9400,
      addonsTotal: 18500,
      totalPrice: 27900,
      spotNumber: 'A-07',
      actualDropOff: addDays(today, -1),
    },
  });
  await prisma.bookingAddon.createMany({
    data: [
      { bookingId: booking10.id, serviceId: evCharge!.id, price: 3500, status: 'PENDING' },
      { bookingId: booking10.id, serviceId: exteriorWash!.id, price: 15000, status: 'PENDING' },
    ],
  });

  // Booking 11: Arriving today - late morning
  const booking11 = await prisma.booking.create({
    data: {
      reference: generateRef(11),
      userId: customers[2].id,
      vehicleId: vehicles[0].id,
      lotId: lot.id,
      status: 'CONFIRMED',
      dropOffTime: addHours(today, 11), // Today at 11:00
      pickUpTime: addDays(addHours(today, 11), 3),
      departureFlightNumber: 'WW123',
      totalDays: 3,
      basePricePerDay: 600,
      baseTotal: 8800,
      addonsTotal: 0,
      totalPrice: 8800,
    },
  });

  // Booking 12: Pending confirmation
  const booking12 = await prisma.booking.create({
    data: {
      reference: generateRef(12),
      userId: customers[3].id,
      vehicleId: vehicles[1].id,
      lotId: lot.id,
      status: 'PENDING',
      dropOffTime: addDays(addHours(today, 8), 3),
      pickUpTime: addDays(addHours(today, 8), 10),
      departureFlightNumber: 'FI777',
      arrivalFlightNumber: 'FI778',
      totalDays: 7,
      basePricePerDay: 600,
      baseTotal: 11200,
      addonsTotal: 24500,
      totalPrice: 35700,
    },
  });
  await prisma.bookingAddon.createMany({
    data: [
      { bookingId: booking12.id, serviceId: evCharge!.id, price: 3500, status: 'PENDING' },
      { bookingId: booking12.id, serviceId: generalClean!.id, price: 21000, status: 'PENDING' },
    ],
  });

  console.log('🎉 Seeded!');
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
