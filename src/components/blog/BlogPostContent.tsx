import DOMPurify from "dompurify";

interface BlogPostContentProps {
  html: string;
}

const BlogPostContent = ({ html }: BlogPostContentProps) => {
  // Saneamos el HTML proveniente de WordPress para prevenir XSS.
  const safeHtml = DOMPurify.sanitize(html, {
    USE_PROFILES: { html: true },
    ADD_ATTR: ["target", "rel"],
  });

  return (
    <div
      className="prose prose-lg prose-invert max-w-none
        prose-headings:text-foreground prose-p:text-muted-foreground
        prose-a:text-primary prose-a:no-underline hover:prose-a:underline
        prose-img:rounded-xl prose-img:w-full prose-img:max-w-full
        prose-strong:text-foreground prose-blockquote:border-primary
        prose-figcaption:text-muted-foreground prose-li:text-muted-foreground"
      dangerouslySetInnerHTML={{ __html: safeHtml }}
    />
  );
};

export default BlogPostContent;
