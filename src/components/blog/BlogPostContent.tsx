interface BlogPostContentProps {
  html: string;
}

const BlogPostContent = ({ html }: BlogPostContentProps) => (
  <div
    className="prose prose-lg prose-invert max-w-none
      prose-headings:text-foreground prose-p:text-muted-foreground
      prose-a:text-primary prose-a:no-underline hover:prose-a:underline
      prose-img:rounded-xl prose-img:w-full prose-img:max-w-full
      prose-strong:text-foreground prose-blockquote:border-primary
      prose-figcaption:text-muted-foreground prose-li:text-muted-foreground"
    dangerouslySetInnerHTML={{ __html: html }}
  />
);

export default BlogPostContent;
