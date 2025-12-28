'use client';

import { useState, useEffect } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { FileText, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

// Simple markdown to HTML converter
function renderMarkdown(text: string): string {
  return text
    // Escape HTML
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    // Headers
    .replace(/^### (.+)$/gm, '<h3 class="text-lg font-semibold text-slate-900 mt-4 mb-2">$1</h3>')
    .replace(/^## (.+)$/gm, '<h2 class="text-xl font-semibold text-slate-900 mt-6 mb-3">$1</h2>')
    .replace(/^# (.+)$/gm, '<h1 class="text-2xl font-bold text-slate-900 mt-6 mb-4">$1</h1>')
    // Bold and italic
    .replace(/\*\*(.+?)\*\*/g, '<strong class="font-semibold text-slate-900">$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    // Links
    .replace(/\[(.+?)\]\((.+?)\)/g, '<a href="$2" class="text-primary-600 hover:underline" target="_blank" rel="noopener">$1</a>')
    // Lists
    .replace(/^- (.+)$/gm, '<li class="ml-4 list-disc text-slate-600">$1</li>')
    .replace(/^\d+\. (.+)$/gm, '<li class="ml-4 list-decimal text-slate-600">$1</li>')
    // Blockquotes
    .replace(/^> (.+)$/gm, '<blockquote class="border-l-4 border-primary-300 pl-4 italic text-slate-600 my-2">$1</blockquote>')
    // Paragraphs
    .replace(/\n\n/g, '</p><p class="text-slate-600 mb-3">')
    .replace(/\n/g, '<br/>');
}

export default function TermsPage() {
  const locale = useLocale();
  const t = useTranslations('common');
  const [content, setContent] = useState<string>('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchContent = async () => {
      try {
        const response = await fetch('/api/settings/pages?page=terms');
        if (response.ok) {
          const data = await response.json();
          setContent(locale === 'is' ? data.content : data.contentEn);
        }
      } catch (error) {
        console.error('Failed to fetch terms:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchContent();
  }, [locale]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-sky-50">
      <div className="max-w-4xl mx-auto px-4 py-12">
        <Link 
          href={`/${locale}`}
          className="inline-flex items-center gap-2 text-primary-600 hover:text-primary-700 mb-8"
        >
          <ArrowLeft className="h-4 w-4" />
          {t('backToHome')}
        </Link>

        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8 md:p-12">
          <div className="flex items-center gap-3 mb-8">
            <div className="p-3 bg-primary-100 rounded-xl">
              <FileText className="h-8 w-8 text-primary-600" />
            </div>
            <h1 className="text-3xl font-bold text-slate-900">
              {locale === 'is' ? 'Skilmálar' : 'Terms of Service'}
            </h1>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
            </div>
          ) : content ? (
            <div 
              className="prose prose-slate max-w-none"
              dangerouslySetInnerHTML={{ __html: '<p class="text-slate-600 mb-3">' + renderMarkdown(content) + '</p>' }}
            />
          ) : (
            <div className="text-center py-12 text-slate-500">
              {locale === 'is' 
                ? 'Skilmálar hafa ekki verið skilgreindir ennþá.'
                : 'Terms of service have not been defined yet.'}
            </div>
          )}
        </div>

        <div className="text-center mt-8 text-sm text-slate-500">
          {locale === 'is' 
            ? 'Síðast uppfært: ' + new Date().toLocaleDateString('is-IS')
            : 'Last updated: ' + new Date().toLocaleDateString('en-US')}
        </div>
      </div>
    </div>
  );
}
