import { useState, useEffect } from "react";
import PublicLayout from "@/components/landing/PublicLayout";
import BlogCard from "@/components/blog/BlogCard";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface WpPost {
  slug: string;
  title: { rendered: string };
  excerpt: { rendered: string };
  date: string;
  _embedded?: {
    "wp:featuredmedia"?: { source_url: string }[];
  };
}

const Blog = () => {
  const [posts, setPosts] = useState<WpPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    const fetchPosts = async () => {
      setLoading(true);
      setError(null);
      const { data, error: fnError } = await supabase.functions.invoke("get-wp-posts", {
        method: "GET",
        headers: { "Content-Type": "application/json" },
        body: undefined,
      });

      // supabase.functions.invoke doesn't support query params natively,
      // so we use the body approach — but for GET with params we'll call directly
      const url = `https://qtjwzfbinsrmnvlsgvtw.supabase.co/functions/v1/get-wp-posts?page=${page}`;
      try {
        const res = await fetch(url, {
          headers: {
            apikey: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF0and6ZmJpbnNybW52bHNndnR3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU5NzY4MDUsImV4cCI6MjA4MTU1MjgwNX0.gvLt5ggffAwHp-HbBAqyGa18HuNZzJ5AHD6p4q6dk7E",
          },
        });
        const json = await res.json();
        if (json.error) throw new Error(json.error);
        setPosts(json.posts || []);
        setTotalPages(json.totalPages || 1);
      } catch (e: any) {
        setError(e.message || "Error al cargar el blog");
      } finally {
        setLoading(false);
      }
    };
    fetchPosts();
  }, [page]);

  return (
    <PublicLayout>
      <section className="py-20 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-14">
            <h1 className="text-4xl font-bold text-foreground mb-4">Blog</h1>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Artículos, guías y novedades sobre marketing digital, tecnología y negocios.
            </p>
          </div>

          {error && (
            <div className="text-center py-16">
              <p className="text-destructive mb-4">{error}</p>
              <Button variant="outline" onClick={() => setPage(1)}>
                Reintentar
              </Button>
            </div>
          )}

          {loading && (
            <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="rounded-2xl border border-border bg-card overflow-hidden">
                  <Skeleton className="aspect-video w-full" />
                  <div className="p-5 space-y-3">
                    <Skeleton className="h-3 w-24" />
                    <Skeleton className="h-5 w-full" />
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-3/4" />
                  </div>
                </div>
              ))}
            </div>
          )}

          {!loading && !error && posts.length === 0 && (
            <p className="text-center text-muted-foreground py-16">
              No hay artículos publicados todavía.
            </p>
          )}

          {!loading && !error && posts.length > 0 && (
            <>
              <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
                {posts.map((post) => (
                  <BlogCard
                    key={post.slug}
                    slug={post.slug}
                    title={post.title.rendered}
                    excerpt={post.excerpt.rendered}
                    imageUrl={post._embedded?.["wp:featuredmedia"]?.[0]?.source_url}
                    date={post.date}
                  />
                ))}
              </div>

              {totalPages > 1 && (
                <div className="flex justify-center items-center gap-4 mt-12">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page <= 1}
                    onClick={() => setPage((p) => p - 1)}
                  >
                    <ChevronLeft size={16} /> Anterior
                  </Button>
                  <span className="text-sm text-muted-foreground">
                    Página {page} de {totalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page >= totalPages}
                    onClick={() => setPage((p) => p + 1)}
                  >
                    Siguiente <ChevronRight size={16} />
                  </Button>
                </div>
              )}
            </>
          )}
        </div>
      </section>
    </PublicLayout>
  );
};

export default Blog;
