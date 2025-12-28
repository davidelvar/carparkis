import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { auth } from '@/lib/auth/config';

const RESERVATION_DURATION_MINUTES = 10; // How long a spot is held

// Clean up expired reservations
async function cleanupExpiredReservations() {
  await prisma.spotReservation.deleteMany({
    where: {
      expiresAt: { lt: new Date() },
    },
  });
}

// Calculate available spots for a date range
async function getAvailableSpots(lotId: string, startDate: Date, endDate: Date) {
  const lot = await prisma.lot.findUnique({
    where: { id: lotId },
    select: { totalSpaces: true },
  });

  if (!lot) return 0;

  // Count confirmed bookings that overlap with the requested dates
  const overlappingBookings = await prisma.booking.count({
    where: {
      lotId,
      status: { in: ['PENDING', 'CONFIRMED', 'CHECKED_IN', 'IN_PROGRESS', 'READY'] },
      AND: [
        { dropOffTime: { lt: endDate } },
        { pickUpTime: { gt: startDate } },
      ],
    },
  });

  // Count active reservations that overlap (excluding expired ones)
  const overlappingReservations = await prisma.spotReservation.count({
    where: {
      lotId,
      isActive: true,
      expiresAt: { gt: new Date() },
      AND: [
        { startDate: { lt: endDate } },
        { endDate: { gt: startDate } },
      ],
    },
  });

  return Math.max(0, lot.totalSpaces - overlappingBookings - overlappingReservations);
}

// POST - Create or extend a reservation
export async function POST(request: NextRequest) {
  try {
    await cleanupExpiredReservations();

    const body = await request.json();
    const { sessionId, lotId, startDate, endDate, bookingData } = body;

    if (!sessionId || !lotId || !startDate || !endDate) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const start = new Date(startDate);
    const end = new Date(endDate);

    // Check if user already has a reservation
    const existingReservation = await prisma.spotReservation.findUnique({
      where: { sessionId },
    });

    if (existingReservation) {
      // Extend the existing reservation
      const updated = await prisma.spotReservation.update({
        where: { sessionId },
        data: {
          lotId,
          startDate: start,
          endDate: end,
          expiresAt: new Date(Date.now() + RESERVATION_DURATION_MINUTES * 60 * 1000),
          bookingData: bookingData || existingReservation.bookingData,
          isActive: true,
        },
      });

      return NextResponse.json({
        success: true,
        reservation: {
          id: updated.id,
          expiresAt: updated.expiresAt.toISOString(),
          remainingSeconds: Math.floor((updated.expiresAt.getTime() - Date.now()) / 1000),
        },
      });
    }

    // Check availability before creating new reservation
    const availableSpots = await getAvailableSpots(lotId, start, end);

    if (availableSpots <= 0) {
      return NextResponse.json(
        { success: false, error: 'no_spots_available', message: 'No spots available for these dates' },
        { status: 409 }
      );
    }

    // Get user ID if logged in
    const session = await auth();
    const userId = session?.user?.id;

    // Create new reservation
    const reservation = await prisma.spotReservation.create({
      data: {
        sessionId,
        lotId,
        startDate: start,
        endDate: end,
        expiresAt: new Date(Date.now() + RESERVATION_DURATION_MINUTES * 60 * 1000),
        userId,
        bookingData,
        isActive: true,
      },
    });

    return NextResponse.json({
      success: true,
      reservation: {
        id: reservation.id,
        expiresAt: reservation.expiresAt.toISOString(),
        remainingSeconds: Math.floor((reservation.expiresAt.getTime() - Date.now()) / 1000),
      },
    });
  } catch (error) {
    console.error('Reservation error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create reservation' },
      { status: 500 }
    );
  }
}

// GET - Check reservation status
export async function GET(request: NextRequest) {
  try {
    await cleanupExpiredReservations();

    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get('sessionId');

    if (!sessionId) {
      return NextResponse.json(
        { success: false, error: 'Missing sessionId' },
        { status: 400 }
      );
    }

    const reservation = await prisma.spotReservation.findUnique({
      where: { sessionId },
    });

    if (!reservation || !reservation.isActive || reservation.expiresAt < new Date()) {
      return NextResponse.json({
        success: true,
        reservation: null,
        hasReservation: false,
      });
    }

    return NextResponse.json({
      success: true,
      hasReservation: true,
      reservation: {
        id: reservation.id,
        expiresAt: reservation.expiresAt.toISOString(),
        remainingSeconds: Math.floor((reservation.expiresAt.getTime() - Date.now()) / 1000),
        bookingData: reservation.bookingData,
        startDate: reservation.startDate.toISOString(),
        endDate: reservation.endDate.toISOString(),
      },
    });
  } catch (error) {
    console.error('Get reservation error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to get reservation' },
      { status: 500 }
    );
  }
}

// DELETE - Cancel/release a reservation
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get('sessionId');

    if (!sessionId) {
      return NextResponse.json(
        { success: false, error: 'Missing sessionId' },
        { status: 400 }
      );
    }

    await prisma.spotReservation.deleteMany({
      where: { sessionId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete reservation error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete reservation' },
      { status: 500 }
    );
  }
}
