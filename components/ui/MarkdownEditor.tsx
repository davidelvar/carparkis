'use client';

import { useState, useRef } from 'react';
import {
  Bold,
  Italic,
  Heading1,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  Link as LinkIcon,
  Quote,
  Eye,
  Edit3,
  HelpCircle,
} from 'lucide-react';

interface MarkdownEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  minHeight?: string;
  locale?: string;
}

export default function MarkdownEditor({
  value,
  onChange,
  placeholder,
  minHeight = '300px',
  locale = 'is',
}: MarkdownEditorProps) {
  const [mode, setMode] = useState<'edit' | 'preview' | 'split'>('edit');
  const [showHelp, setShowHelp] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const insertMarkdown = (before: string, after: string = '', placeholder: string = '') => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = value.substring(start, end) || placeholder;
    const newText = value.substring(0, start) + before + selectedText + after + value.substring(end);
    
    onChange(newText);
    
    // Set cursor position after insert
    setTimeout(() => {
      textarea.focus();
      const newCursorPos = start + before.length + selectedText.length;
      textarea.setSelectionRange(newCursorPos, newCursorPos);
    }, 0);
  };

  const toolbarButtons = [
    { icon: Bold, action: () => insertMarkdown('**', '**', 'feitletrað'), title: locale === 'is' ? 'Feitletrað' : 'Bold' },
    { icon: Italic, action: () => insertMarkdown('*', '*', 'skáletrað'), title: locale === 'is' ? 'Skáletrað' : 'Italic' },
    { type: 'separator' },
    { icon: Heading1, action: () => insertMarkdown('\n# ', '\n', 'Fyrirsögn'), title: locale === 'is' ? 'Fyrirsögn 1' : 'Heading 1' },
    { icon: Heading2, action: () => insertMarkdown('\n## ', '\n', 'Fyrirsögn'), title: locale === 'is' ? 'Fyrirsögn 2' : 'Heading 2' },
    { icon: Heading3, action: () => insertMarkdown('\n### ', '\n', 'Fyrirsögn'), title: locale === 'is' ? 'Fyrirsögn 3' : 'Heading 3' },
    { type: 'separator' },
    { icon: List, action: () => insertMarkdown('\n- ', '\n', 'Listaatriði'), title: locale === 'is' ? 'Punktalisti' : 'Bullet List' },
    { icon: ListOrdered, action: () => insertMarkdown('\n1. ', '\n', 'Listaatriði'), title: locale === 'is' ? 'Tölusettur listi' : 'Numbered List' },
    { type: 'separator' },
    { icon: LinkIcon, action: () => insertMarkdown('[', '](https://)', 'Tengill'), title: locale === 'is' ? 'Tengill' : 'Link' },
    { icon: Quote, action: () => insertMarkdown('\n> ', '\n', 'Tilvitnun'), title: locale === 'is' ? 'Tilvitnun' : 'Quote' },
  ];

  const renderMarkdownPreview = (text: string) => {
    // Simple markdown to HTML conversion
    let html = text
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
      // Paragraphs (double newlines)
      .replace(/\n\n/g, '</p><p class="text-slate-600 mb-3">')
      // Single line breaks within paragraphs
      .replace(/\n/g, '<br/>');

    // Wrap in paragraph if not starting with a block element
    if (!html.startsWith('<h') && !html.startsWith('<ul') && !html.startsWith('<ol') && !html.startsWith('<blockquote')) {
      html = '<p class="text-slate-600 mb-3">' + html + '</p>';
    }

    return html;
  };

  return (
    <div className="border border-slate-300 rounded-lg overflow-hidden bg-white">
      {/* Toolbar */}
      <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50 px-2 py-1.5">
        <div className="flex items-center gap-0.5">
          {toolbarButtons.map((btn, i) => 
            btn.type === 'separator' ? (
              <div key={i} className="w-px h-5 bg-slate-300 mx-1" />
            ) : (
              <button
                key={i}
                type="button"
                onClick={btn.action}
                title={btn.title}
                className="p-1.5 rounded hover:bg-slate-200 text-slate-600 hover:text-slate-900 transition-colors"
              >
                {btn.icon && <btn.icon className="h-4 w-4" />}
              </button>
            )
          )}
        </div>
        
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => setShowHelp(!showHelp)}
            title={locale === 'is' ? 'Hjálp' : 'Help'}
            className={`p-1.5 rounded transition-colors ${showHelp ? 'bg-primary-100 text-primary-700' : 'hover:bg-slate-200 text-slate-500'}`}
          >
            <HelpCircle className="h-4 w-4" />
          </button>
          <div className="w-px h-5 bg-slate-300 mx-1" />
          <div className="flex bg-slate-200 rounded-md p-0.5">
            <button
              type="button"
              onClick={() => setMode('edit')}
              className={`px-2 py-1 rounded text-xs font-medium transition-colors ${
                mode === 'edit' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Edit3 className="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              onClick={() => setMode('split')}
              className={`px-2 py-1 rounded text-xs font-medium transition-colors ${
                mode === 'split' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {locale === 'is' ? 'Skipt' : 'Split'}
            </button>
            <button
              type="button"
              onClick={() => setMode('preview')}
              className={`px-2 py-1 rounded text-xs font-medium transition-colors ${
                mode === 'preview' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Eye className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Help panel */}
      {showHelp && (
        <div className="border-b border-slate-200 bg-blue-50 px-4 py-3 text-sm">
          <p className="font-medium text-blue-900 mb-2">
            {locale === 'is' ? 'Markdown leiðbeiningar:' : 'Markdown guide:'}
          </p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-blue-800">
            <span><code className="bg-blue-100 px-1 rounded">**texti**</code> → <strong>feitletrað</strong></span>
            <span><code className="bg-blue-100 px-1 rounded">*texti*</code> → <em>skáletrað</em></span>
            <span><code className="bg-blue-100 px-1 rounded"># Fyrirsögn</code> → fyrirsögn</span>
            <span><code className="bg-blue-100 px-1 rounded">- atriði</code> → listi</span>
          </div>
        </div>
      )}

      {/* Editor/Preview area */}
      <div className={`${mode === 'split' ? 'grid grid-cols-2 divide-x divide-slate-200' : ''}`} style={{ minHeight }}>
        {/* Editor */}
        {(mode === 'edit' || mode === 'split') && (
          <textarea
            ref={textareaRef}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            className="w-full h-full p-4 font-mono text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none resize-none bg-white"
            style={{ minHeight: mode === 'split' ? minHeight : minHeight }}
          />
        )}

        {/* Preview */}
        {(mode === 'preview' || mode === 'split') && (
          <div 
            className="p-4 overflow-auto bg-white"
            style={{ minHeight }}
          >
            {value ? (
              <div 
                className="prose prose-sm max-w-none"
                dangerouslySetInnerHTML={{ __html: renderMarkdownPreview(value) }}
              />
            ) : (
              <p className="text-slate-400 italic">
                {locale === 'is' ? 'Forskoðun birtist hér...' : 'Preview will appear here...'}
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
