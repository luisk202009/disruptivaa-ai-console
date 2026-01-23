import ReactMarkdown from 'react-markdown';
import { cn } from '@/lib/utils';

interface MarkdownMessageProps {
  content: string;
  className?: string;
}

export const MarkdownMessage = ({ content, className }: MarkdownMessageProps) => {
  return (
    <div className={cn(
      // Tailwind Typography with dark theme - 16px base for comfortable reading
      "prose prose-invert prose-base max-w-none",
      // Paragraph spacing - increased for better readability
      "prose-p:mb-4 prose-p:leading-7 prose-p:text-zinc-400",
      // Headings
      "prose-headings:mt-4 prose-headings:mb-2 prose-headings:font-semibold prose-headings:text-foreground",
      "prose-h3:text-base prose-h3:mt-5 prose-h3:mb-3",
      "prose-h4:text-sm prose-h4:mt-3",
      // Lists
      "prose-ul:my-2 prose-ul:pl-4 prose-li:my-0.5 prose-li:text-zinc-400",
      "prose-ol:my-2 prose-ol:pl-4",
      // Tables with modern styling
      "prose-table:my-4 prose-table:border-collapse prose-table:w-full prose-table:text-xs",
      "prose-thead:border-b prose-thead:border-border",
      "prose-th:bg-muted/50 prose-th:px-3 prose-th:py-2 prose-th:text-left prose-th:font-medium prose-th:text-foreground prose-th:border prose-th:border-border",
      "prose-td:px-3 prose-td:py-2 prose-td:border prose-td:border-border prose-td:text-zinc-400",
      "prose-tr:border-b prose-tr:border-border",
      // Horizontal rules
      "prose-hr:my-4 prose-hr:border-border",
      // Bold and code - neutral colors
      "prose-strong:text-foreground prose-strong:font-semibold",
      "prose-code:bg-muted prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:text-xs prose-code:text-foreground prose-code:before:content-none prose-code:after:content-none",
      // Links - neutral with hover
      "prose-a:text-zinc-300 prose-a:no-underline hover:prose-a:text-white hover:prose-a:underline",
      className
    )}>
      <ReactMarkdown>{content}</ReactMarkdown>
    </div>
  );
};

export default MarkdownMessage;
