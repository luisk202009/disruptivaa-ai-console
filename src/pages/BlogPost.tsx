import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import PublicLayout from "@/components/landing/PublicLayout";
import BlogPostContent from "@/components/blog/BlogPostContent";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";

interface WpPost {
  title: { rendered: string };
  content: { rendered: string };
  date: string;
  _embedded?: {
    "wp:featuredmedia"?: { source_url: string }[];
  };
}

const decodeHtml = (html: string) => {
  const txt = document.createElement("textarea");
  txt.innerHTML = html;
  return txt.value;
};

const BlogPost = () => {
  const { slug } = useParams<{ slug: string }>();
  const [post, setPost] = useState<WpPost | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    const fetchPost = async () => {
      setLoading(true);
      setNotFound(false);
      try {
        const url = `https://qtjwzfbinsrmnvlsgvtw.supabase.co/functions/v1/get-wp-posts?slug=${slug}`;
        const res = await fetch(url, {
          headers: {
            apikey: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF0and6ZmJpbnNybW52bHNndnR3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU5NzY4MDUsImV4cCI6MjA4MTU1MjgwNX0.gvLt5ggffAwHp-HbBAqyGa18HuNZzJ5AHD6p4q6dk7E",
          },
        });
        const json = await res.json();
        if (!json.posts || json.posts.length === 0) {
          setNotFound(true);
        } else {
          setPost(json.posts[0]);
        }
      } catch {
        setNotFound(true);
      } finally {
        setLoading(false);
      }
    };
    if (slug) fetchPost();
  }, [slug]);

  const featuredImage = post?._embedded?.["wp:featuredmedia"]?.[0]?.source_url;

  return (
    <PublicLayout>
      <section className="py-20 px-6">
        <div className="max-w-3xl mx-auto">
          <Link to="/blog">
            <Button variant="ghost" size="sm" className="mb-8 text-muted-foreground hover:text-foreground">
              <ArrowLeft size={16} className="mr-2" /> Volver al Blog
            </Button>
          </Link>

          {loading && (
            <div className="space-y-6">
              <Skeleton className="h-8 w-3/4" />
              <Skeleton className="h-4 w-40" />
              <Skeleton className="aspect-video w-full rounded-xl" />
              <div className="space-y-3">
                {Array.from({ length: 8 }).map((_, i) => (
                  <Skeleton key={i} className="h-4 w-full" />
                ))}
              </div>
            </div>
          )}

          {notFound && (
            <div className="text-center py-16">
              <h2 className="text-2xl font-bold text-foreground mb-2">Artículo no encontrado</h2>
              <p className="text-muted-foreground mb-6">
                El artículo que buscas no existe o fue eliminado.
              </p>
              <Link to="/blog">
                <Button>Ver todos los artículos</Button>
              </Link>
            </div>
          )}

          {!loading && post && (
            <article className="space-y-8">
              <header className="space-y-4">
                <h1 className="text-3xl md:text-4xl font-bold text-foreground leading-tight">
                  {decodeHtml(post.title.rendered)}
                </h1>
                <time className="block text-sm text-muted-foreground">
                  {format(new Date(post.date), "d 'de' MMMM, yyyy", { locale: es })}
                </time>
              </header>

              {featuredImage && (
                <img
                  src={featuredImage}
                  alt={decodeHtml(post.title.rendered)}
                  className="w-full rounded-xl"
                />
              )}

              <BlogPostContent html={post.content.rendered} />
            </article>
          )}
        </div>
      </section>
    </PublicLayout>
  );
};

export default BlogPost;
