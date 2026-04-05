import { Link } from "react-router-dom";
import { format } from "date-fns";
import { es } from "date-fns/locale";

interface BlogCardProps {
  slug: string;
  title: string;
  excerpt: string;
  imageUrl?: string;
  date: string;
}

const decodeHtml = (html: string) => {
  const txt = document.createElement("textarea");
  txt.innerHTML = html;
  return txt.value;
};

const stripHtml = (html: string) => html.replace(/<[^>]*>/g, "").trim();

const BlogCard = ({ slug, title, excerpt, imageUrl, date }: BlogCardProps) => (
  <Link
    to={`/blog/${slug}`}
    className="group rounded-2xl border border-border bg-card overflow-hidden transition-all hover:shadow-lg hover:shadow-primary/10 hover:-translate-y-1"
  >
    <div className="aspect-video overflow-hidden bg-muted">
      {imageUrl ? (
        <img
          src={imageUrl}
          alt={decodeHtml(title)}
          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
          loading="lazy"
        />
      ) : (
        <div className="w-full h-full flex items-center justify-center text-muted-foreground text-sm">
          Sin imagen
        </div>
      )}
    </div>
    <div className="p-5 space-y-3">
      <time className="text-xs text-muted-foreground">
        {format(new Date(date), "d 'de' MMMM, yyyy", { locale: es })}
      </time>
      <h2 className="text-lg font-semibold text-foreground leading-snug line-clamp-2 group-hover:text-primary transition-colors">
        {decodeHtml(title)}
      </h2>
      <p className="text-sm text-muted-foreground line-clamp-3">
        {stripHtml(decodeHtml(excerpt))}
      </p>
    </div>
  </Link>
);

export default BlogCard;
