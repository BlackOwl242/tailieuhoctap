'use client';

import { useMemo } from 'react';
import { marked } from 'marked';
import DOMPurify from 'isomorphic-dompurify';

/**
 * Render Markdown an toàn: marked → DOMPurify (chống XSS) → HTML.
 * Nội dung bài viết do người dùng soạn nên bắt buộc sanitize trước khi render.
 */
export function MarkdownViewer({ content }: { content: string }) {
  const html = useMemo(() => {
    const raw = marked.parse(content ?? '', { async: false }) as string;
    return DOMPurify.sanitize(raw);
  }, [content]);

  return <div className="markdown-body" dangerouslySetInnerHTML={{ __html: html }} />;
}
