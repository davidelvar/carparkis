import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const page = searchParams.get('page');

  if (!page || !['terms', 'privacy'].includes(page)) {
    return NextResponse.json({ error: 'Invalid page parameter' }, { status: 400 });
  }

  try {
    const contentKey = page === 'terms' ? 'termsContent' : 'privacyContent';
    const contentKeyEn = page === 'terms' ? 'termsContentEn' : 'privacyContentEn';

    const [contentSetting, contentEnSetting] = await Promise.all([
      prisma.setting.findUnique({ where: { key: contentKey } }),
      prisma.setting.findUnique({ where: { key: contentKeyEn } }),
    ]);

    return NextResponse.json({
      content: contentSetting?.value || '',
      contentEn: contentEnSetting?.value || '',
    });
  } catch (error) {
    console.error('Failed to fetch page content:', error);
    return NextResponse.json({ error: 'Failed to fetch page content' }, { status: 500 });
  }
}
