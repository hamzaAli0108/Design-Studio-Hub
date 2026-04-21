import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Layout } from "@/components/Layout";
import { supabase } from "@/integrations/supabase/client";

interface Post {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  cover_image_url: string | null;
  tags: string[] | null;
  published_at: string | null;
}

const Blog = () => {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    document.title = "Journal — studio.nx";
    supabase
      .from("blog_posts")
      .select("id,title,slug,excerpt,cover_image_url,tags,published_at")
      .eq("published", true)
      .order("published_at", { ascending: false })
      .then(({ data }) => {
        setPosts(data ?? []);
        setLoading(false);
      });
  }, []);

  return (
    <Layout>
      <section className="container py-16 md:py-24">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <p className="font-mono text-xs text-secondary mb-3">// journal</p>
          <h1 className="font-display text-5xl md:text-7xl font-bold mb-6">
            Notes &amp; <span className="text-gradient">essays</span>
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl">
            Process, perspective, and the craft of design. Published whenever inspiration strikes.
          </p>
        </motion.div>

        <div className="mt-16 grid gap-10">
          {loading ? (
            [...Array(3)].map((_, i) => (
              <div key={i} className="h-48 rounded-xl bg-muted animate-pulse" />
            ))
          ) : posts.length === 0 ? (
            <div className="border border-dashed border-border rounded-2xl p-16 text-center">
              <h3 className="font-display text-2xl font-semibold mb-2">Nothing published yet</h3>
              <p className="text-muted-foreground">Check back soon — new posts on the way.</p>
            </div>
          ) : (
            posts.map((post, i) => (
              <motion.article
                key={post.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="group"
              >
                <Link
                  to={`/blog/${post.slug}`}
                  className="grid md:grid-cols-[1fr,2fr] gap-6 items-start p-4 -m-4 rounded-2xl hover:bg-card/50 transition-colors"
                >
                  <div className="aspect-video rounded-lg overflow-hidden bg-muted border border-border group-hover:border-secondary transition-colors">
                    {post.cover_image_url ? (
                      <img
                        src={post.cover_image_url}
                        alt={post.title}
                        loading="lazy"
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-violet opacity-60" />
                    )}
                  </div>
                  <div>
                    <div className="flex items-center gap-3 mb-3 font-mono text-xs text-muted-foreground">
                      {post.published_at && (
                        <time>{new Date(post.published_at).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}</time>
                      )}
                      {post.tags && post.tags.length > 0 && (
                        <>
                          <span>·</span>
                          <span className="text-primary">{post.tags[0]}</span>
                        </>
                      )}
                    </div>
                    <h2 className="font-display text-2xl md:text-3xl font-bold mb-3 group-hover:text-gradient transition-all">
                      {post.title}
                    </h2>
                    {post.excerpt && (
                      <p className="text-muted-foreground line-clamp-3">{post.excerpt}</p>
                    )}
                    <span className="inline-block mt-4 text-sm font-medium text-secondary group-hover:text-secondary-glow">
                      Read post →
                    </span>
                  </div>
                </Link>
              </motion.article>
            ))
          )}
        </div>
      </section>
    </Layout>
  );
};

export default Blog;
