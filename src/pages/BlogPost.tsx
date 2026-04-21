import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { motion } from "framer-motion";
import ReactMarkdown from "react-markdown";
import { ArrowLeft } from "lucide-react";
import { Layout } from "@/components/Layout";
import { supabase } from "@/integrations/supabase/client";

interface Post {
  id: string;
  title: string;
  excerpt: string | null;
  content: string;
  cover_image_url: string | null;
  tags: string[] | null;
  published_at: string | null;
  author_id: string;
}

interface Author {
  display_name: string | null;
  avatar_url: string | null;
}

const BlogPost = () => {
  const { slug } = useParams<{ slug: string }>();
  const [post, setPost] = useState<Post | null>(null);
  const [author, setAuthor] = useState<Author | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!slug) return;
    supabase
      .from("blog_posts")
      .select("id,title,excerpt,content,cover_image_url,tags,published_at,author_id")
      .eq("slug", slug)
      .eq("published", true)
      .maybeSingle()
      .then(async ({ data }) => {
        if (!data) {
          setNotFound(true);
          setLoading(false);
          return;
        }
        setPost(data);
        document.title = `${data.title} — studio.nx`;
        const { data: prof } = await supabase
          .from("profiles")
          .select("display_name,avatar_url")
          .eq("id", data.author_id)
          .maybeSingle();
        setAuthor(prof);
        setLoading(false);
      });
  }, [slug]);

  if (loading) {
    return (
      <Layout>
        <div className="container py-24">
          <div className="h-12 w-2/3 rounded bg-muted animate-pulse mb-8" />
          <div className="aspect-video rounded-xl bg-muted animate-pulse" />
        </div>
      </Layout>
    );
  }

  if (notFound || !post) {
    return (
      <Layout>
        <div className="container py-24 text-center">
          <h1 className="font-display text-4xl font-bold mb-4">Post not found</h1>
          <Link to="/blog" className="text-primary hover:underline">← Back to blog</Link>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <article className="container py-12 md:py-20 max-w-3xl">
        <Link
          to="/blog"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary mb-8 group"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          All posts
        </Link>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          {post.tags && post.tags.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-4">
              {post.tags.map((t) => (
                <span key={t} className="px-2.5 py-1 text-xs font-mono rounded-full bg-primary/10 text-primary border border-primary/30">
                  {t}
                </span>
              ))}
            </div>
          )}

          <h1 className="font-display text-4xl md:text-6xl font-bold leading-[1.05] mb-6">
            {post.title}
          </h1>

          {post.excerpt && (
            <p className="text-xl text-muted-foreground mb-8">{post.excerpt}</p>
          )}

          <div className="flex items-center gap-4 pb-8 mb-8 border-b border-border">
            {author?.avatar_url ? (
              <img src={author.avatar_url} alt={author.display_name ?? ""} className="w-10 h-10 rounded-full object-cover" />
            ) : (
              <div className="w-10 h-10 rounded-full bg-gradient-neon" />
            )}
            <div>
              <p className="text-sm font-medium">{author?.display_name ?? "Author"}</p>
              {post.published_at && (
                <p className="font-mono text-xs text-muted-foreground">
                  {new Date(post.published_at).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}
                </p>
              )}
            </div>
          </div>

          {post.cover_image_url && (
            <img
              src={post.cover_image_url}
              alt={post.title}
              className="w-full rounded-2xl mb-12 border border-border"
            />
          )}

          <div className="prose-content">
            <ReactMarkdown>{post.content}</ReactMarkdown>
          </div>
        </motion.div>
      </article>

      <style>{`
        .prose-content { font-size: 1.0625rem; line-height: 1.8; color: hsl(var(--foreground)); }
        .prose-content p { margin: 0 0 1.5rem; }
        .prose-content h2 { font-family: 'Space Grotesk', sans-serif; font-size: 2rem; font-weight: 700; margin: 3rem 0 1rem; }
        .prose-content h3 { font-family: 'Space Grotesk', sans-serif; font-size: 1.5rem; font-weight: 600; margin: 2rem 0 0.75rem; }
        .prose-content a { color: hsl(var(--primary)); text-decoration: underline; text-underline-offset: 4px; }
        .prose-content ul, .prose-content ol { margin: 0 0 1.5rem 1.5rem; }
        .prose-content li { margin-bottom: 0.5rem; }
        .prose-content blockquote { border-left: 3px solid hsl(var(--primary)); padding-left: 1.25rem; font-style: italic; color: hsl(var(--muted-foreground)); margin: 2rem 0; }
        .prose-content code { font-family: 'JetBrains Mono', monospace; font-size: 0.875em; background: hsl(var(--muted)); padding: 0.15rem 0.4rem; border-radius: 4px; }
        .prose-content pre { background: hsl(var(--card)); padding: 1.25rem; border-radius: 0.75rem; overflow-x: auto; border: 1px solid hsl(var(--border)); margin: 1.5rem 0; }
        .prose-content img { border-radius: 0.75rem; margin: 2rem 0; }
      `}</style>
    </Layout>
  );
};

export default BlogPost;
