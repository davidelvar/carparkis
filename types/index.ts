import type {
  User,
  Booking,
  Vehicle,
  VehicleType,
  Lot,
  Service,
  LotService,
  BookingAddon,
  Payment,
  BookingStatus,
  AddonStatus,
  PaymentStatus,
} from '@prisma/client';

// Re-export Prisma types
export type {
  User,
  Booking,
  Vehicle,
  VehicleType,
  Lot,
  Service,
  LotService,
  BookingAddon,
  Payment,
  BookingStatus,
  AddonStatus,
  PaymentStatus,
};

// Extended types with relations
export type BookingWithRelations = Booking & {
  user: User;
  vehicle: Vehicle & { vehicleType: VehicleType };
  lot: Lot;
  addons: (BookingAddon & { service: Service })[];
  payment?: Payment | null;
};

export type LotWithPricing = Lot & {
  pricing: (LotPricing & { vehicleType: VehicleType })[];
  services: (LotService & { service: Service })[];
};

export type LotPricing = {
  id: string;
  lotId: string;
  vehicleTypeId: string;
  pricePerDay: number;
  weeklyDiscount: number | null;
  monthlyDiscount: number | null;
  isActive: boolean;
};

// API Response types
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
}

// Booking form types
export interface BookingFormData {
  licensePlate: string;
  vehicleTypeId: string;
  lotId: string;
  departureFlightNumber?: string;
  departureFlightDate?: string;
  arrivalFlightNumber?: string;
  arrivalFlightDate?: string;
  dropOffTime: string;
  pickUpTime: string;
  addons: string[];
  notes?: string;
}

// Vehicle lookup response
export interface VehicleLookupResult {
  licensePlate: string;
  make?: string;
  model?: string;
  year?: number;
  color?: string;
  fuelType?: string;
  isElectric: boolean;
  vehicleTypeCode: string;
}

// Flight lookup response
export interface FlightLookupResult {
  flightNumber: string;
  scheduledTime: string;
  estimatedTime?: string;
  destination?: string;
  airline?: string;
  status?: string;
}

// Pricing calculation
export interface PriceCalculation {
  totalDays: number;
  basePricePerDay: number;
  baseTotal: number;
  addons: {
    serviceId: string;
    name: string;
    price: number;
  }[];
  addonsTotal: number;
  discountAmount: number;
  discountReason?: string;
  totalPrice: number;
  vatAmount: number;
}

// Dashboard stats
export interface OperatorDashboardStats {
  todayArrivals: number;
  todayDepartures: number;
  carsOnSite: number;
  pendingServices: number;
}

export interface AdminDashboardStats {
  totalBookings: number;
  totalRevenue: number;
  avgOccupancy: number;
  bookingsByStatus: Record<BookingStatus, number>;
  revenueByDay: { date: string; revenue: number }[];
  peakHours: { hour: number; count: number }[];
}
