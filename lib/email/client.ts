/**
 * Email Service
 * 
 * Handles sending transactional emails for bookings using nodemailer.
 */

import nodemailer from 'nodemailer';
import type { Booking, User, Vehicle, Lot } from '@prisma/client';

// Types
export interface EmailConfig {
  host: string;
  port: number;
  secure: boolean;
  auth: {
    user: string;
    pass: string;
  };
  from: {
    name: string;
    email: string;
  };
}

export interface BookingEmailData {
  booking: Booking & {
    user: User;
    vehicle: Vehicle;
    lot: Lot;
  };
  locale: 'is' | 'en';
}

// Get email configuration from environment
function getEmailConfig(): EmailConfig | null {
  const host = process.env.SMTP_HOST;
  const port = parseInt(process.env.SMTP_PORT || '587', 10);
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASSWORD;
  const fromEmail = process.env.SMTP_FROM || 'noreply@carpark.is';
  const fromName = process.env.SMTP_FROM_NAME || 'CarPark';

  if (!host || !user || !pass) {
    console.warn('[Email] SMTP not configured - missing environment variables');
    return null;
  }

  return {
    host,
    port,
    secure: port === 465,
    auth: { user, pass },
    from: { name: fromName, email: fromEmail },
  };
}

// Create transporter
function createTransporter() {
  const config = getEmailConfig();
  if (!config) return null;

  return nodemailer.createTransport({
    host: config.host,
    port: config.port,
    secure: config.secure,
    auth: config.auth,
  });
}

// Check if email is configured
export function isEmailConfigured(): boolean {
  return getEmailConfig() !== null;
}

// Format price for display
function formatPrice(amount: number, locale: string): string {
  return new Intl.NumberFormat(locale === 'is' ? 'is-IS' : 'en-US', {
    style: 'decimal',
    minimumFractionDigits: 0,
  }).format(amount) + ' kr.';
}

// Format date for display
function formatDate(date: Date, locale: string): string {
  return new Intl.DateTimeFormat(locale === 'is' ? 'is-IS' : 'en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}

/**
 * Send booking confirmation email
 */
export async function sendBookingConfirmation(data: BookingEmailData): Promise<boolean> {
  const transporter = createTransporter();
  const config = getEmailConfig();
  
  if (!transporter || !config) {
    console.warn('[Email] Cannot send confirmation - SMTP not configured');
    return false;
  }

  const { booking, locale } = data;
  const isIcelandic = locale === 'is';

  const subject = isIcelandic
    ? `Bókun staðfest - ${booking.reference}`
    : `Booking Confirmed - ${booking.reference}`;

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${subject}</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f8fafc;">
  <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
    <!-- Header -->
    <div style="text-align: center; margin-bottom: 32px;">
      <h1 style="color: #1aa7b3; font-size: 28px; margin: 0;">CarPark</h1>
      <p style="color: #64748b; margin-top: 8px;">Keflavík International Airport</p>
    </div>

    <!-- Main Card -->
    <div style="background: white; border-radius: 16px; padding: 32px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
      <!-- Success Icon -->
      <div style="text-align: center; margin-bottom: 24px;">
        <div style="width: 64px; height: 64px; background: #dcfce7; border-radius: 50%; display: inline-flex; align-items: center; justify-content: center;">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#16a34a" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M20 6L9 17l-5-5"/>
          </svg>
        </div>
      </div>

      <h2 style="color: #0f172a; font-size: 24px; text-align: center; margin: 0 0 8px 0;">
        ${isIcelandic ? 'Bókun staðfest!' : 'Booking Confirmed!'}
      </h2>
      <p style="color: #64748b; text-align: center; margin: 0 0 32px 0;">
        ${isIcelandic ? 'Takk fyrir bókunina. Hér eru upplýsingarnar þínar.' : 'Thank you for your booking. Here are your details.'}
      </p>

      <!-- Booking Reference -->
      <div style="background: #f1f5f9; border-radius: 12px; padding: 16px; text-align: center; margin-bottom: 24px;">
        <p style="color: #64748b; font-size: 14px; margin: 0 0 4px 0;">
          ${isIcelandic ? 'Bókunarnúmer' : 'Booking Reference'}
        </p>
        <p style="color: #0f172a; font-size: 24px; font-weight: bold; margin: 0; font-family: monospace;">
          ${booking.reference}
        </p>
      </div>

      <!-- Details -->
      <table style="width: 100%; border-collapse: collapse;">
        <tr>
          <td style="padding: 12px 0; border-bottom: 1px solid #e2e8f0;">
            <span style="color: #64748b; font-size: 14px;">${isIcelandic ? 'Bíll' : 'Vehicle'}</span><br>
            <span style="color: #0f172a; font-weight: 500;">${booking.vehicle.licensePlate}</span>
          </td>
        </tr>
        <tr>
          <td style="padding: 12px 0; border-bottom: 1px solid #e2e8f0;">
            <span style="color: #64748b; font-size: 14px;">${isIcelandic ? 'Bílastæði' : 'Parking Lot'}</span><br>
            <span style="color: #0f172a; font-weight: 500;">${booking.lot.name}</span>
          </td>
        </tr>
        <tr>
          <td style="padding: 12px 0; border-bottom: 1px solid #e2e8f0;">
            <span style="color: #64748b; font-size: 14px;">${isIcelandic ? 'Koma' : 'Drop-off'}</span><br>
            <span style="color: #0f172a; font-weight: 500;">${formatDate(booking.dropOffTime, locale)}</span>
          </td>
        </tr>
        <tr>
          <td style="padding: 12px 0; border-bottom: 1px solid #e2e8f0;">
            <span style="color: #64748b; font-size: 14px;">${isIcelandic ? 'Sækja' : 'Pick-up'}</span><br>
            <span style="color: #0f172a; font-weight: 500;">${formatDate(booking.pickUpTime, locale)}</span>
          </td>
        </tr>
        <tr>
          <td style="padding: 12px 0;">
            <span style="color: #64748b; font-size: 14px;">${isIcelandic ? 'Heildarverð' : 'Total Price'}</span><br>
            <span style="color: #0f172a; font-weight: 600; font-size: 18px;">${formatPrice(booking.totalPrice, locale)}</span>
          </td>
        </tr>
      </table>

      <!-- CTA Button -->
      <div style="text-align: center; margin-top: 32px;">
        <a href="${process.env.NEXT_PUBLIC_APP_URL || 'https://carpark.is'}/bookings/${booking.id}" 
           style="display: inline-block; background: #1aa7b3; color: white; padding: 14px 28px; border-radius: 12px; text-decoration: none; font-weight: 500;">
          ${isIcelandic ? 'Skoða bókun' : 'View Booking'}
        </a>
      </div>
    </div>

    <!-- Footer -->
    <div style="text-align: center; margin-top: 32px; color: #64748b; font-size: 14px;">
      <p style="margin: 0 0 8px 0;">CarPark - Keflavík International Airport</p>
      <p style="margin: 0;">
        ${isIcelandic ? 'Hafðu samband:' : 'Contact us:'} 
        <a href="mailto:info@carpark.is" style="color: #1aa7b3;">info@carpark.is</a>
      </p>
    </div>
  </div>
</body>
</html>
  `;

  try {
    await transporter.sendMail({
      from: `"${config.from.name}" <${config.from.email}>`,
      to: booking.user.email!,
      subject,
      html,
    });
    console.log(`[Email] Confirmation sent to ${booking.user.email} for ${booking.reference}`);
    return true;
  } catch (error) {
    console.error('[Email] Failed to send confirmation:', error);
    return false;
  }
}

/**
 * Send booking reminder email
 */
export async function sendBookingReminder(data: BookingEmailData): Promise<boolean> {
  const transporter = createTransporter();
  const config = getEmailConfig();
  
  if (!transporter || !config) {
    console.warn('[Email] Cannot send reminder - SMTP not configured');
    return false;
  }

  const { booking, locale } = data;
  const isIcelandic = locale === 'is';

  const subject = isIcelandic
    ? `Áminning: Bókun á morgun - ${booking.reference}`
    : `Reminder: Booking Tomorrow - ${booking.reference}`;

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${subject}</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f8fafc;">
  <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
    <!-- Header -->
    <div style="text-align: center; margin-bottom: 32px;">
      <h1 style="color: #1aa7b3; font-size: 28px; margin: 0;">CarPark</h1>
      <p style="color: #64748b; margin-top: 8px;">Keflavík International Airport</p>
    </div>

    <!-- Main Card -->
    <div style="background: white; border-radius: 16px; padding: 32px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
      <!-- Bell Icon -->
      <div style="text-align: center; margin-bottom: 24px;">
        <div style="width: 64px; height: 64px; background: #fef3c7; border-radius: 50%; display: inline-flex; align-items: center; justify-content: center;">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#d97706" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
            <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
          </svg>
        </div>
      </div>

      <h2 style="color: #0f172a; font-size: 24px; text-align: center; margin: 0 0 8px 0;">
        ${isIcelandic ? 'Áminning um bókun' : 'Booking Reminder'}
      </h2>
      <p style="color: #64748b; text-align: center; margin: 0 0 32px 0;">
        ${isIcelandic ? 'Bókunin þín er á næstunni. Ekki gleyma!' : 'Your booking is coming up soon. Don\'t forget!'}
      </p>

      <!-- Booking Reference -->
      <div style="background: #fef3c7; border-radius: 12px; padding: 16px; text-align: center; margin-bottom: 24px;">
        <p style="color: #92400e; font-size: 14px; margin: 0 0 4px 0;">
          ${isIcelandic ? 'Bókunarnúmer' : 'Booking Reference'}
        </p>
        <p style="color: #78350f; font-size: 24px; font-weight: bold; margin: 0; font-family: monospace;">
          ${booking.reference}
        </p>
      </div>

      <!-- Details -->
      <table style="width: 100%; border-collapse: collapse;">
        <tr>
          <td style="padding: 12px 0; border-bottom: 1px solid #e2e8f0;">
            <span style="color: #64748b; font-size: 14px;">${isIcelandic ? 'Bíll' : 'Vehicle'}</span><br>
            <span style="color: #0f172a; font-weight: 500;">${booking.vehicle.licensePlate}</span>
          </td>
        </tr>
        <tr>
          <td style="padding: 12px 0; border-bottom: 1px solid #e2e8f0;">
            <span style="color: #64748b; font-size: 14px;">${isIcelandic ? 'Koma' : 'Drop-off'}</span><br>
            <span style="color: #0f172a; font-weight: 500;">${formatDate(booking.dropOffTime, locale)}</span>
          </td>
        </tr>
        <tr>
          <td style="padding: 12px 0;">
            <span style="color: #64748b; font-size: 14px;">${isIcelandic ? 'Bílastæði' : 'Parking Lot'}</span><br>
            <span style="color: #0f172a; font-weight: 500;">${booking.lot.name}</span>
          </td>
        </tr>
      </table>

      <!-- CTA Button -->
      <div style="text-align: center; margin-top: 32px;">
        <a href="${process.env.NEXT_PUBLIC_APP_URL || 'https://carpark.is'}/bookings/${booking.id}" 
           style="display: inline-block; background: #1aa7b3; color: white; padding: 14px 28px; border-radius: 12px; text-decoration: none; font-weight: 500;">
          ${isIcelandic ? 'Skoða bókun' : 'View Booking'}
        </a>
      </div>
    </div>

    <!-- Footer -->
    <div style="text-align: center; margin-top: 32px; color: #64748b; font-size: 14px;">
      <p style="margin: 0 0 8px 0;">CarPark - Keflavík International Airport</p>
      <p style="margin: 0;">
        ${isIcelandic ? 'Hafðu samband:' : 'Contact us:'} 
        <a href="mailto:info@carpark.is" style="color: #1aa7b3;">info@carpark.is</a>
      </p>
    </div>
  </div>
</body>
</html>
  `;

  try {
    await transporter.sendMail({
      from: `"${config.from.name}" <${config.from.email}>`,
      to: booking.user.email!,
      subject,
      html,
    });
    console.log(`[Email] Reminder sent to ${booking.user.email} for ${booking.reference}`);
    return true;
  } catch (error) {
    console.error('[Email] Failed to send reminder:', error);
    return false;
  }
}

/**
 * Send check-in confirmation email
 */
export async function sendCheckInConfirmation(data: BookingEmailData): Promise<boolean> {
  const transporter = createTransporter();
  const config = getEmailConfig();
  
  if (!transporter || !config) {
    console.warn('[Email] Cannot send check-in confirmation - SMTP not configured');
    return false;
  }

  const { booking, locale } = data;
  const isIcelandic = locale === 'is';

  const subject = isIcelandic
    ? `Innritun staðfest - ${booking.reference}`
    : `Check-in Confirmed - ${booking.reference}`;

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${subject}</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f8fafc;">
  <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
    <!-- Header -->
    <div style="text-align: center; margin-bottom: 32px;">
      <h1 style="color: #1aa7b3; font-size: 28px; margin: 0;">CarPark</h1>
      <p style="color: #64748b; margin-top: 8px;">Keflavík International Airport</p>
    </div>

    <!-- Main Card -->
    <div style="background: white; border-radius: 16px; padding: 32px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
      <!-- Car Icon -->
      <div style="text-align: center; margin-bottom: 24px;">
        <div style="width: 64px; height: 64px; background: #dbeafe; border-radius: 50%; display: inline-flex; align-items: center; justify-content: center;">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#2563eb" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.5 2.8C1.4 11.3 1 12.1 1 13v3c0 .6.4 1 1 1h2"/>
            <circle cx="7" cy="17" r="2"/>
            <circle cx="17" cy="17" r="2"/>
          </svg>
        </div>
      </div>

      <h2 style="color: #0f172a; font-size: 24px; text-align: center; margin: 0 0 8px 0;">
        ${isIcelandic ? 'Bíllinn þinn er kominn!' : 'Your car has arrived!'}
      </h2>
      <p style="color: #64748b; text-align: center; margin: 0 0 32px 0;">
        ${isIcelandic ? 'Við höfum tekið við bílnum þínum. Góða ferð!' : 'We\'ve received your vehicle. Have a great trip!'}
      </p>

      <!-- Details -->
      <div style="background: #f1f5f9; border-radius: 12px; padding: 20px;">
        <table style="width: 100%; border-collapse: collapse;">
          <tr>
            <td style="padding: 8px 0;">
              <span style="color: #64748b; font-size: 14px;">${isIcelandic ? 'Bókunarnúmer' : 'Reference'}</span>
            </td>
            <td style="padding: 8px 0; text-align: right;">
              <span style="color: #0f172a; font-weight: 600; font-family: monospace;">${booking.reference}</span>
            </td>
          </tr>
          <tr>
            <td style="padding: 8px 0;">
              <span style="color: #64748b; font-size: 14px;">${isIcelandic ? 'Bíll' : 'Vehicle'}</span>
            </td>
            <td style="padding: 8px 0; text-align: right;">
              <span style="color: #0f172a; font-weight: 500;">${booking.vehicle.licensePlate}</span>
            </td>
          </tr>
          <tr>
            <td style="padding: 8px 0;">
              <span style="color: #64748b; font-size: 14px;">${isIcelandic ? 'Staðsetning' : 'Location'}</span>
            </td>
            <td style="padding: 8px 0; text-align: right;">
              <span style="color: #0f172a; font-weight: 500;">${booking.lot.name}</span>
            </td>
          </tr>
          <tr>
            <td style="padding: 8px 0;">
              <span style="color: #64748b; font-size: 14px;">${isIcelandic ? 'Áætluð sækja' : 'Expected pickup'}</span>
            </td>
            <td style="padding: 8px 0; text-align: right;">
              <span style="color: #0f172a; font-weight: 500;">${formatDate(booking.pickUpTime, locale)}</span>
            </td>
          </tr>
        </table>
      </div>

      <!-- Info Box -->
      <div style="background: #ecfdf5; border: 1px solid #a7f3d0; border-radius: 12px; padding: 16px; margin-top: 24px;">
        <p style="color: #065f46; font-size: 14px; margin: 0;">
          ${isIcelandic 
            ? '💡 Mundu að hafa bókunarnúmerið til reiðu þegar þú sækir bílinn.' 
            : '💡 Remember to have your booking reference ready when picking up your car.'}
        </p>
      </div>
    </div>

    <!-- Footer -->
    <div style="text-align: center; margin-top: 32px; color: #64748b; font-size: 14px;">
      <p style="margin: 0 0 8px 0;">CarPark - Keflavík International Airport</p>
      <p style="margin: 0;">
        ${isIcelandic ? 'Hafðu samband:' : 'Contact us:'} 
        <a href="mailto:info@carpark.is" style="color: #1aa7b3;">info@carpark.is</a>
      </p>
    </div>
  </div>
</body>
</html>
  `;

  try {
    await transporter.sendMail({
      from: `"${config.from.name}" <${config.from.email}>`,
      to: booking.user.email!,
      subject,
      html,
    });
    console.log(`[Email] Check-in confirmation sent to ${booking.user.email} for ${booking.reference}`);
    return true;
  } catch (error) {
    console.error('[Email] Failed to send check-in confirmation:', error);
    return false;
  }
}

/**
 * Send test email (basic connectivity test)
 */
export async function sendTestEmail(to: string, locale: 'is' | 'en' = 'is'): Promise<boolean> {
  const transporter = createTransporter();
  const config = getEmailConfig();
  
  if (!transporter || !config) {
    console.warn('[Email] Cannot send test email - SMTP not configured');
    return false;
  }

  const isIcelandic = locale === 'is';
  const subject = isIcelandic ? 'Prófunarpóstur - CarPark' : 'Test Email - CarPark';

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>${subject}</title>
</head>
<body style="margin: 0; padding: 40px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f8fafc;">
  <div style="max-width: 500px; margin: 0 auto; background: white; border-radius: 16px; padding: 32px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
    <div style="text-align: center; margin-bottom: 24px;">
      <div style="width: 48px; height: 48px; background: #dcfce7; border-radius: 50%; display: inline-flex; align-items: center; justify-content: center;">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#16a34a" stroke-width="2">
          <path d="M20 6L9 17l-5-5"/>
        </svg>
      </div>
    </div>
    <h2 style="color: #0f172a; text-align: center; margin: 0 0 16px 0;">
      ${isIcelandic ? 'Tölvupóstur virkar!' : 'Email is working!'}
    </h2>
    <p style="color: #64748b; text-align: center; margin: 0;">
      ${isIcelandic 
        ? 'SMTP stillingar eru réttar. Tölvupóstsendingar eru tilbúnar.' 
        : 'SMTP settings are correct. Email sending is ready.'}
    </p>
  </div>
</body>
</html>
  `;

  try {
    await transporter.sendMail({
      from: `"${config.from.name}" <${config.from.email}>`,
      to,
      subject,
      html,
    });
    console.log(`[Email] Test email sent to ${to}`);
    return true;
  } catch (error) {
    console.error('[Email] Failed to send test email:', error);
    return false;
  }
}

/**
 * Create sample booking data for test emails
 */
function createSampleBookingData(userEmail: string, userName: string): BookingEmailData['booking'] {
  const now = new Date();
  const dropOff = new Date(now);
  dropOff.setDate(dropOff.getDate() + 7);
  dropOff.setHours(10, 0, 0, 0);
  const pickUp = new Date(dropOff);
  pickUp.setDate(pickUp.getDate() + 5);
  pickUp.setHours(14, 0, 0, 0);

  return {
    id: 'test-booking-123',
    reference: 'KEF-2025-TEST01',
    status: 'CONFIRMED',
    dropOffTime: dropOff,
    pickUpTime: pickUp,
    actualDropOff: null,
    actualPickUp: null,
    totalDays: 5,
    basePricePerDay: 2000,
    baseTotal: 10000,
    addonsTotal: 2500,
    discountAmount: 0,
    totalPrice: 12500,
    notes: null,
    internalNotes: null,
    spotNumber: null,
    createdAt: now,
    updatedAt: now,
    userId: 'test-user',
    vehicleId: 'test-vehicle',
    lotId: 'test-lot',
    guestName: null,
    guestEmail: null,
    guestPhone: null,
    departureFlightNumber: 'FI615',
    departureFlightTime: dropOff,
    arrivalFlightNumber: 'FI612',
    arrivalFlightTime: pickUp,
    user: {
      id: 'test-user',
      name: userName || 'Test User',
      email: userEmail,
      emailVerified: null,
      image: null,
      phone: '+354 555 1234',
      role: 'CUSTOMER',
      createdAt: now,
      updatedAt: now,
      locale: 'is',
      kennitala: null,
      pin: null,
    },
    vehicle: {
      id: 'test-vehicle',
      licensePlate: 'AB123',
      make: 'Toyota',
      model: 'Yaris',
      year: 2020,
      color: 'Hvítur',
      fuelType: 'Bensín',
      isElectric: false,
      rawApiData: null,
      lastApiSync: null,
      vehicleTypeId: 'test-type',
      ownerId: 'test-user',
      createdAt: now,
      updatedAt: now,
    },
    lot: {
      id: 'test-lot',
      name: 'Aðalbílastæði',
      nameEn: 'Main Parking',
      slug: 'main-parking',
      address: 'Flugvallarvegur 1, 235 Keflavíkurflugvöllur',
      latitude: 63.9850,
      longitude: -22.6056,
      totalSpaces: 500,
      isActive: true,
      instructions: 'Akstursleiðbeiningar...',
      instructionsEn: 'Driving directions...',
      createdAt: now,
      updatedAt: now,
    },
  } as BookingEmailData['booking'];
}

/**
 * Send test booking confirmation email
 */
export async function sendTestBookingConfirmation(to: string, userName: string, locale: 'is' | 'en' = 'is'): Promise<boolean> {
  const sampleBooking = createSampleBookingData(to, userName);
  return sendBookingConfirmation({ booking: sampleBooking, locale });
}

/**
 * Send test booking reminder email
 */
export async function sendTestBookingReminder(to: string, userName: string, locale: 'is' | 'en' = 'is'): Promise<boolean> {
  const sampleBooking = createSampleBookingData(to, userName);
  return sendBookingReminder({ booking: sampleBooking, locale });
}

/**
 * Send test check-in confirmation email
 */
export async function sendTestCheckInConfirmation(to: string, userName: string, locale: 'is' | 'en' = 'is'): Promise<boolean> {
  const sampleBooking = createSampleBookingData(to, userName);
  return sendCheckInConfirmation({ booking: sampleBooking, locale });
}

/**
 * Send booking cancellation email
 */
export async function sendBookingCancellation(data: BookingEmailData): Promise<boolean> {
  const transporter = createTransporter();
  const config = getEmailConfig();
  
  if (!transporter || !config) {
    console.warn('[Email] Cannot send cancellation - SMTP not configured');
    return false;
  }

  const { booking, locale } = data;
  const isIcelandic = locale === 'is';

  const subject = isIcelandic
    ? `Bókun afturkölluð - ${booking.reference}`
    : `Booking Cancelled - ${booking.reference}`;

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${subject}</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f8fafc;">
  <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
    <!-- Header -->
    <div style="text-align: center; margin-bottom: 32px;">
      <h1 style="color: #1aa7b3; font-size: 28px; margin: 0;">CarPark</h1>
      <p style="color: #64748b; margin-top: 8px;">Keflavík International Airport</p>
    </div>

    <!-- Main Card -->
    <div style="background: white; border-radius: 16px; padding: 32px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
      <!-- Cancel Icon -->
      <div style="text-align: center; margin-bottom: 24px;">
        <div style="width: 64px; height: 64px; background: #fee2e2; border-radius: 50%; display: inline-flex; align-items: center; justify-content: center;">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#dc2626" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="12" cy="12" r="10"/>
            <line x1="15" y1="9" x2="9" y2="15"/>
            <line x1="9" y1="9" x2="15" y2="15"/>
          </svg>
        </div>
      </div>

      <h2 style="color: #0f172a; font-size: 24px; text-align: center; margin: 0 0 8px 0;">
        ${isIcelandic ? 'Bókun afturkölluð' : 'Booking Cancelled'}
      </h2>
      <p style="color: #64748b; text-align: center; margin: 0 0 32px 0;">
        ${isIcelandic 
          ? 'Bókunin þín hefur verið afturkölluð. Ef þetta var ekki þú, vinsamlegast hafðu samband.' 
          : 'Your booking has been cancelled. If this wasn\'t you, please contact us.'}
      </p>

      <!-- Booking Reference -->
      <div style="background: #fee2e2; border-radius: 12px; padding: 16px; text-align: center; margin-bottom: 24px;">
        <p style="color: #991b1b; font-size: 14px; margin: 0 0 4px 0;">
          ${isIcelandic ? 'Bókunarnúmer' : 'Booking Reference'}
        </p>
        <p style="color: #7f1d1d; font-size: 24px; font-weight: bold; margin: 0; font-family: monospace; text-decoration: line-through;">
          ${booking.reference}
        </p>
      </div>

      <!-- Details -->
      <table style="width: 100%; border-collapse: collapse;">
        <tr>
          <td style="padding: 12px 0; border-bottom: 1px solid #e2e8f0;">
            <span style="color: #64748b; font-size: 14px;">${isIcelandic ? 'Bíll' : 'Vehicle'}</span><br>
            <span style="color: #0f172a; font-weight: 500;">${booking.vehicle.licensePlate}</span>
          </td>
        </tr>
        <tr>
          <td style="padding: 12px 0; border-bottom: 1px solid #e2e8f0;">
            <span style="color: #64748b; font-size: 14px;">${isIcelandic ? 'Upprunaleg koma' : 'Original Drop-off'}</span><br>
            <span style="color: #0f172a; font-weight: 500;">${formatDate(booking.dropOffTime, locale)}</span>
          </td>
        </tr>
        <tr>
          <td style="padding: 12px 0;">
            <span style="color: #64748b; font-size: 14px;">${isIcelandic ? 'Heildarverð' : 'Total Amount'}</span><br>
            <span style="color: #0f172a; font-weight: 600; font-size: 18px;">${formatPrice(booking.totalPrice, locale)}</span>
          </td>
        </tr>
      </table>

      <!-- Info Box -->
      <div style="background: #fef3c7; border: 1px solid #fcd34d; border-radius: 12px; padding: 16px; margin-top: 24px;">
        <p style="color: #92400e; font-size: 14px; margin: 0;">
          ${isIcelandic 
            ? '💡 Ef þú hefur greitt fyrir bókunina, mun endurgreiðsla berast innan 5-7 virkra daga.' 
            : '💡 If you have paid for this booking, a refund will be processed within 5-7 business days.'}
        </p>
      </div>

      <!-- CTA Button -->
      <div style="text-align: center; margin-top: 32px;">
        <a href="${process.env.NEXT_PUBLIC_APP_URL || 'https://carpark.is'}/booking" 
           style="display: inline-block; background: #1aa7b3; color: white; padding: 14px 28px; border-radius: 12px; text-decoration: none; font-weight: 500;">
          ${isIcelandic ? 'Bóka aftur' : 'Book Again'}
        </a>
      </div>
    </div>

    <!-- Footer -->
    <div style="text-align: center; margin-top: 32px; color: #64748b; font-size: 14px;">
      <p style="margin: 0 0 8px 0;">CarPark - Keflavík International Airport</p>
      <p style="margin: 0;">
        ${isIcelandic ? 'Hafðu samband:' : 'Contact us:'} 
        <a href="mailto:info@carpark.is" style="color: #1aa7b3;">info@carpark.is</a>
      </p>
    </div>
  </div>
</body>
</html>
  `;

  try {
    await transporter.sendMail({
      from: `"${config.from.name}" <${config.from.email}>`,
      to: booking.user.email!,
      subject,
      html,
    });
    console.log(`[Email] Cancellation sent to ${booking.user.email} for ${booking.reference}`);
    return true;
  } catch (error) {
    console.error('[Email] Failed to send cancellation:', error);
    return false;
  }
}
