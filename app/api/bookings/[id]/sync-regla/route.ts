import { NextRequest, NextResponse } from 'next/server';
import { syncBookingToRegla } from '@/lib/regla/sync-service';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    await syncBookingToRegla(id);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Regla sync failed:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Sync failed' },
      { status: 500 }
    );
  }
}
