import ReactMarkdown from 'react-markdown';
import { cn } from '@/lib/utils';

interface MarkdownMessageProps {
  content: string;
  className?: string;
}

export const MarkdownMessage = ({ content, className }: MarkdownMessageProps) => {
  return (
    <div className={cn(
      // Tailwind Typography with dark theme
      "prose prose-invert prose-sm max-w-none",
      // Paragraph spacing
      "prose-p:mb-3 prose-p:leading-relaxed prose-p:text-foreground",
      // Headings
      "prose-headings:mt-4 prose-headings:mb-2 prose-headings:font-semibold prose-headings:text-foreground",
      "prose-h3:text-base prose-h3:mt-5 prose-h3:mb-3",
      "prose-h4:text-sm prose-h4:mt-3",
      // Lists
      "prose-ul:my-2 prose-ul:pl-4 prose-li:my-0.5 prose-li:text-foreground",
      "prose-ol:my-2 prose-ol:pl-4",
      // Tables with modern styling
      "prose-table:my-4 prose-table:border-collapse prose-table:w-full prose-table:text-xs",
      "prose-thead:border-b prose-thead:border-border",
      "prose-th:bg-muted/50 prose-th:px-3 prose-th:py-2 prose-th:text-left prose-th:font-medium prose-th:text-foreground prose-th:border prose-th:border-border",
      "prose-td:px-3 prose-td:py-2 prose-td:border prose-td:border-border prose-td:text-muted-foreground",
      "prose-tr:border-b prose-tr:border-border",
      // Horizontal rules
      "prose-hr:my-4 prose-hr:border-border",
      // Bold and code
      "prose-strong:text-primary prose-strong:font-semibold",
      "prose-code:bg-muted prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:text-xs prose-code:text-foreground prose-code:before:content-none prose-code:after:content-none",
      // Links
      "prose-a:text-primary prose-a:no-underline hover:prose-a:underline",
      className
    )}>
      <ReactMarkdown>{content}</ReactMarkdown>
    </div>
  );
};

export default MarkdownMessage;
