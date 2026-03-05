'use client';

import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeHighlight from 'rehype-highlight';
import 'highlight.js/styles/github-dark.css';

import { cn } from '@/lib/utils';

type MarkdownRendererProps = {
  content: string;
};

export default function MarkdownRenderer({ content }: MarkdownRendererProps) {
  if (!content.trim()) {
    return null;
  }

  return (
    <div className="prose prose-sm max-w-none">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeHighlight]}
        components={{
          a: ({ children, ...props }) => (
            <a
              {...props}
              className={cn('text-primary underline underline-offset-2', props.className)}
              target="_blank"
              rel="noreferrer"
            >
              {children}
            </a>
          ),
          pre: ({ className, ...props }) => (
            <pre
              {...props}
              className={cn(
                'overflow-x-auto rounded-md bg-muted/60 border border-border/60 px-3 py-2',
                className,
              )}
            />
          ),
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}

