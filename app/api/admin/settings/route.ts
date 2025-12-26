import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { auth } from '@/lib/auth/config';
import { isEmailConfigured } from '@/lib/email/client';

// GET /api/admin/settings - Get all settings (public for site settings, restricted for sensitive)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const publicOnly = searchParams.get('public') === 'true';

    // Public settings that can be accessed without auth
    const publicKeys = [
      'siteName',
      'siteNameEn', 
      'contactEmail',
      'contactPhone',
      'address',
      'defaultLocale',
      'currency',
      'rapydEnabled',
      'netgiroEnabled',
    ];

    let settings;
    let emailConfigured = false;
    
    if (publicOnly) {
      settings = await prisma.setting.findMany({
        where: {
          key: { in: publicKeys }
        }
      });
    } else {
      // Check admin auth for full settings
      const session = await auth();
      const userRole = (session?.user as { role?: string })?.role;
      
      if (!session || userRole !== 'ADMIN') {
        return NextResponse.json(
          { success: false, error: 'Unauthorized' },
          { status: 401 }
        );
      }
      
      settings = await prisma.setting.findMany();
      
      // Check email configuration status for admin
      emailConfigured = isEmailConfigured();
    }

    // Convert to object format
    const settingsObject = settings.reduce((acc, setting) => {
      acc[setting.key] = setting.value;
      return acc;
    }, {} as Record<string, unknown>);

    return NextResponse.json({ 
      success: true, 
      data: settingsObject,
      emailConfigured,
    });
  } catch (error) {
    console.error('Failed to fetch settings:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch settings' },
      { status: 500 }
    );
  }
}

// PUT /api/admin/settings - Update settings (admin only)
export async function PUT(request: NextRequest) {
  try {
    const session = await auth();
    const userRole = (session?.user as { role?: string })?.role;
    
    if (!session || userRole !== 'ADMIN') {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { settings } = body;

    if (!settings || typeof settings !== 'object') {
      return NextResponse.json(
        { success: false, error: 'Invalid settings data' },
        { status: 400 }
      );
    }

    // Upsert each setting
    const updates = Object.entries(settings).map(([key, value]) =>
      prisma.setting.upsert({
        where: { key },
        update: { value: value as any },
        create: { key, value: value as any },
      })
    );

    await prisma.$transaction(updates);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to save settings:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to save settings' },
      { status: 500 }
    );
  }
}
