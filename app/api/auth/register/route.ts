import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, email, phone } = body;

    // Validate required fields
    if (!name || !email) {
      return NextResponse.json(
        { success: false, error: 'Name and email are required' },
        { status: 400 }
      );
    }

    // Normalize email
    const normalizedEmail = email.toLowerCase().trim();

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (existingUser) {
      // User exists - update their info if they don't have it yet
      // This allows users who signed up via magic link during booking to add their info
      const updateData: { name?: string; phone?: string | null } = {};
      
      if (!existingUser.name && name) {
        updateData.name = name.trim();
      }
      if (!existingUser.phone && phone) {
        updateData.phone = phone.trim();
      }

      if (Object.keys(updateData).length > 0) {
        await prisma.user.update({
          where: { email: normalizedEmail },
          data: updateData,
        });
      }

      return NextResponse.json({
        success: true,
        message: 'User updated',
        isExisting: true,
      });
    }

    // Create new user
    await prisma.user.create({
      data: {
        email: normalizedEmail,
        name: name.trim(),
        phone: phone?.trim() || null,
        role: 'CUSTOMER',
      },
    });

    return NextResponse.json({
      success: true,
      message: 'User created',
      isExisting: false,
    });
  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to register user' },
      { status: 500 }
    );
  }
}
