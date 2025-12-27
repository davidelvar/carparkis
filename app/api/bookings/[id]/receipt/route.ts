import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { jsPDF } from 'jspdf';

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
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(date));
}

// Format short date
function formatShortDate(date: Date): string {
  return new Intl.DateTimeFormat('en-GB', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date(date));
}

// Helper to convert hex to RGB
function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  } : { r: 0, g: 0, b: 0 };
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const { searchParams } = new URL(request.url);
  const locale = searchParams.get('locale') || 'is';
  const isIcelandic = locale === 'is';

  try {
    const booking = await prisma.booking.findFirst({
      where: {
        OR: [{ id }, { reference: id }],
      },
      include: {
        vehicle: { include: { vehicleType: true } },
        lot: true,
        addons: { include: { service: true } },
        user: { select: { name: true, email: true, phone: true } },
      },
    });

    if (!booking) {
      return NextResponse.json(
        { success: false, error: 'Booking not found' },
        { status: 404 }
      );
    }

    // Create PDF document
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
    });

    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 15;
    const contentWidth = pageWidth - 2 * margin;
    
    // Colors
    const primary = hexToRgb('#255da0');
    const primaryDark = hexToRgb('#1e4d85');
    const textDark = hexToRgb('#0f172a');
    const textMuted = hexToRgb('#64748b');
    const bgLight = hexToRgb('#f8fafc');
    const bgAccent = hexToRgb('#eff6ff');
    const border = hexToRgb('#e2e8f0');
    const success = hexToRgb('#059669');

    // ===== HEADER SECTION =====
    // Full-width header with gradient effect (simulated with two rectangles)
    doc.setFillColor(primary.r, primary.g, primary.b);
    doc.rect(0, 0, pageWidth, 45, 'F');
    doc.setFillColor(primaryDark.r, primaryDark.g, primaryDark.b);
    doc.rect(0, 35, pageWidth, 10, 'F');

    // Logo/Brand
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(28);
    doc.setFont('helvetica', 'bold');
    doc.text('CarPark', pageWidth / 2, 20, { align: 'center' });
    
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.text('Keflavik International Airport Parking', pageWidth / 2, 30, { align: 'center' });

    // Receipt badge
    doc.setFillColor(255, 255, 255);
    doc.roundedRect(pageWidth / 2 - 20, 40, 40, 10, 2, 2, 'F');
    doc.setTextColor(primary.r, primary.g, primary.b);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.text(isIcelandic ? 'KVITTUN' : 'RECEIPT', pageWidth / 2, 47, { align: 'center' });

    // ===== REFERENCE & DATE SECTION =====
    let yPos = 60;
    
    // Reference number - prominent display
    doc.setFillColor(bgAccent.r, bgAccent.g, bgAccent.b);
    doc.roundedRect(margin, yPos, contentWidth, 28, 4, 4, 'F');
    doc.setDrawColor(primary.r, primary.g, primary.b);
    doc.setLineWidth(0.5);
    doc.roundedRect(margin, yPos, contentWidth, 28, 4, 4, 'S');
    
    doc.setTextColor(textMuted.r, textMuted.g, textMuted.b);
    doc.setFontSize(7);
    doc.setFont('helvetica', 'bold');
    doc.text(isIcelandic ? 'BOKUNARNUMER' : 'BOOKING REFERENCE', margin + 10, yPos + 8);
    
    doc.setTextColor(textDark.r, textDark.g, textDark.b);
    doc.setFontSize(20);
    doc.setFont('helvetica', 'bold');
    doc.text(booking.reference, margin + 10, yPos + 21);
    
    // Date on the right side
    doc.setTextColor(textMuted.r, textMuted.g, textMuted.b);
    doc.setFontSize(7);
    doc.setFont('helvetica', 'normal');
    doc.text(isIcelandic ? 'UTGEFID' : 'ISSUED', pageWidth - margin - 10, yPos + 8, { align: 'right' });
    doc.setTextColor(textDark.r, textDark.g, textDark.b);
    doc.setFontSize(10);
    doc.text(formatShortDate(new Date()), pageWidth - margin - 10, yPos + 18, { align: 'right' });

    yPos += 38;

    // ===== TWO COLUMN LAYOUT FOR CUSTOMER & VEHICLE =====
    const colWidth = (contentWidth - 8) / 2;
    
    // Customer Card
    doc.setFillColor(bgLight.r, bgLight.g, bgLight.b);
    doc.roundedRect(margin, yPos, colWidth, 40, 3, 3, 'F');
    
    doc.setTextColor(primary.r, primary.g, primary.b);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.text(isIcelandic ? 'VIDSKIPTAVINUR' : 'CUSTOMER', margin + 8, yPos + 10);
    
    doc.setTextColor(textDark.r, textDark.g, textDark.b);
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    const customerName = booking.user?.name || booking.guestName || '-';
    doc.text(customerName.length > 20 ? customerName.substring(0, 20) + '...' : customerName, margin + 8, yPos + 22);
    
    doc.setTextColor(textMuted.r, textMuted.g, textMuted.b);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    const customerEmail = booking.user?.email || booking.guestEmail || '-';
    doc.text(customerEmail.length > 28 ? customerEmail.substring(0, 28) + '...' : customerEmail, margin + 8, yPos + 32);

    // Vehicle Card
    const col2X = margin + colWidth + 8;
    doc.setFillColor(textDark.r, textDark.g, textDark.b);
    doc.roundedRect(col2X, yPos, colWidth, 40, 3, 3, 'F');
    
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.text(isIcelandic ? 'OKUTAEKI' : 'VEHICLE', col2X + 8, yPos + 10);
    
    // License plate badge
    doc.setFillColor(255, 255, 255);
    doc.roundedRect(col2X + 8, yPos + 14, colWidth - 16, 14, 2, 2, 'F');
    doc.setTextColor(textDark.r, textDark.g, textDark.b);
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text(booking.vehicle.licensePlate, col2X + colWidth / 2, yPos + 24, { align: 'center' });
    
    doc.setTextColor(200, 200, 200);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    const vehicleInfo = `${booking.vehicle.make || ''} ${booking.vehicle.model || ''}`.trim() || '-';
    doc.text(vehicleInfo, col2X + 8, yPos + 36);

    yPos += 50;

    // ===== PARKING DETAILS SECTION =====
    doc.setFillColor(bgLight.r, bgLight.g, bgLight.b);
    doc.roundedRect(margin, yPos, contentWidth, 48, 3, 3, 'F');
    
    doc.setTextColor(primary.r, primary.g, primary.b);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.text(isIcelandic ? 'BOKUNARUPPLYSINGAR' : 'BOOKING DETAILS', margin + 8, yPos + 10);

    // Drop-off
    doc.setTextColor(textMuted.r, textMuted.g, textMuted.b);
    doc.setFontSize(7);
    doc.text(isIcelandic ? 'KOMA' : 'DROP-OFF', margin + 8, yPos + 20);
    doc.setTextColor(textDark.r, textDark.g, textDark.b);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.text(formatDate(booking.dropOffTime, locale), margin + 8, yPos + 27);

    // Pick-up
    doc.setTextColor(textMuted.r, textMuted.g, textMuted.b);
    doc.setFontSize(7);
    doc.setFont('helvetica', 'bold');
    doc.text(isIcelandic ? 'SAEKJA' : 'PICK-UP', margin + 8, yPos + 37);
    doc.setTextColor(textDark.r, textDark.g, textDark.b);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.text(formatDate(booking.pickUpTime, locale), margin + 8, yPos + 44);

    // Duration badge on right
    doc.setFillColor(primary.r, primary.g, primary.b);
    doc.roundedRect(pageWidth - margin - 45, yPos + 15, 37, 22, 3, 3, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text(String(booking.totalDays), pageWidth - margin - 26.5, yPos + 28, { align: 'center' });
    doc.setFontSize(7);
    doc.setFont('helvetica', 'normal');
    doc.text(isIcelandic ? 'DAGAR' : 'DAYS', pageWidth - margin - 26.5, yPos + 34, { align: 'center' });

    // Location
    doc.setTextColor(textMuted.r, textMuted.g, textMuted.b);
    doc.setFontSize(7);
    doc.setFont('helvetica', 'bold');
    doc.text(isIcelandic ? 'STADSETNING' : 'LOCATION', pageWidth - margin - 85, yPos + 20);
    doc.setTextColor(textDark.r, textDark.g, textDark.b);
    doc.setFontSize(9);
    const lotName = isIcelandic ? booking.lot.name : (booking.lot.nameEn || booking.lot.name);
    doc.text(lotName.length > 15 ? lotName.substring(0, 15) + '...' : lotName, pageWidth - margin - 85, yPos + 27);
    if (booking.lot.address) {
      doc.setTextColor(textMuted.r, textMuted.g, textMuted.b);
      doc.setFontSize(7);
      doc.setFont('helvetica', 'normal');
      const addr = booking.lot.address.length > 20 ? booking.lot.address.substring(0, 20) + '...' : booking.lot.address;
      doc.text(addr, pageWidth - margin - 85, yPos + 34);
    }

    yPos += 58;

    // ===== PRICE BREAKDOWN SECTION =====
    const addonsCount = booking.addons?.length || 0;
    const hasDiscount = booking.discountAmount > 0;
    const priceBoxHeight = 55 + addonsCount * 10 + (hasDiscount ? 10 : 0);
    
    doc.setFillColor(bgLight.r, bgLight.g, bgLight.b);
    doc.roundedRect(margin, yPos, contentWidth, priceBoxHeight, 3, 3, 'F');
    
    doc.setTextColor(primary.r, primary.g, primary.b);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.text(isIcelandic ? 'VERDYFIRLIT' : 'PRICE BREAKDOWN', margin + 8, yPos + 10);
    
    let priceY = yPos + 20;
    
    // Parking fee
    doc.setTextColor(textDark.r, textDark.g, textDark.b);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.text(`${isIcelandic ? 'Bilastaedi' : 'Parking'} (${booking.totalDays} ${isIcelandic ? 'dagar' : 'days'})`, margin + 8, priceY);
    doc.setFont('helvetica', 'bold');
    doc.text(formatPrice(booking.baseTotal, locale), pageWidth - margin - 8, priceY, { align: 'right' });
    priceY += 10;

    // Addons
    if (booking.addons && booking.addons.length > 0) {
      doc.setFont('helvetica', 'normal');
      for (const addon of booking.addons) {
        const serviceName = isIcelandic ? addon.service.name : (addon.service.nameEn || addon.service.name);
        doc.text(serviceName.length > 35 ? serviceName.substring(0, 35) + '...' : serviceName, margin + 8, priceY);
        doc.text(formatPrice(addon.price, locale), pageWidth - margin - 8, priceY, { align: 'right' });
        priceY += 10;
      }
    }

    // Discount
    if (hasDiscount) {
      doc.setTextColor(success.r, success.g, success.b);
      doc.setFont('helvetica', 'normal');
      doc.text(isIcelandic ? 'Afsláttur' : 'Discount', margin + 8, priceY);
      doc.text(`-${formatPrice(booking.discountAmount, locale)}`, pageWidth - margin - 8, priceY, { align: 'right' });
      priceY += 10;
    }

    // Divider
    priceY += 2;
    doc.setDrawColor(border.r, border.g, border.b);
    doc.setLineWidth(0.3);
    doc.line(margin + 8, priceY, pageWidth - margin - 8, priceY);
    priceY += 8;

    // Total
    doc.setTextColor(textDark.r, textDark.g, textDark.b);
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text(isIcelandic ? 'Samtals' : 'Total', margin + 8, priceY);
    doc.setTextColor(primary.r, primary.g, primary.b);
    doc.setFontSize(16);
    doc.text(formatPrice(booking.totalPrice, locale), pageWidth - margin - 8, priceY, { align: 'right' });

    // VAT note
    priceY += 8;
    doc.setTextColor(textMuted.r, textMuted.g, textMuted.b);
    doc.setFontSize(7);
    doc.setFont('helvetica', 'italic');
    doc.text(isIcelandic ? 'Verd er med VSK' : 'Price includes VAT', margin + 8, priceY);

    // ===== FOOTER =====
    // Footer line
    doc.setDrawColor(border.r, border.g, border.b);
    doc.setLineWidth(0.3);
    doc.line(margin, pageHeight - 30, pageWidth - margin, pageHeight - 30);
    
    // Footer content
    doc.setTextColor(textMuted.r, textMuted.g, textMuted.b);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.text('CarPark ehf. | Keflavik International Airport', pageWidth / 2, pageHeight - 22, { align: 'center' });
    doc.text('www.carpark.is | info@carpark.is', pageWidth / 2, pageHeight - 16, { align: 'center' });
    
    // Thank you message
    doc.setTextColor(primary.r, primary.g, primary.b);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.text(isIcelandic ? 'Takk fyrir vidskiptin!' : 'Thank you for your business!', pageWidth / 2, pageHeight - 8, { align: 'center' });

    // Get PDF as array buffer
    const pdfOutput = doc.output('arraybuffer');

    return new NextResponse(pdfOutput, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="receipt-${booking.reference}.pdf"`,
      },
    });
  } catch (error) {
    console.error('Receipt generation error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to generate receipt' },
      { status: 500 }
    );
  }
}
