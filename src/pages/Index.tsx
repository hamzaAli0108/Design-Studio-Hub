import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowRight, Sparkles, Zap, Eye, Heart } from "lucide-react";
import { Layout } from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import heroBg from "@/assets/hero-bg.jpg";

interface PortfolioItem {
  id: string;
  title: string;
  slug: string;
  category: string | null;
  cover_image_url: string | null;
  views_count: number;
  likes_count: number;
}

const LIKES_KEY = "portfolio-liked-v1";
const VIEWS_KEY = "portfolio-viewed-session-v1";

const getSet = (key: string, storage: Storage): Set<string> => {
  try { return new Set(JSON.parse(storage.getItem(key) ?? "[]")); } catch { return new Set(); }
};
const saveSet = (key: string, set: Set<string>, storage: Storage) => {
  try { storage.setItem(key, JSON.stringify([...set])); } catch {}
};

interface BlogPost {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  cover_image_url: string | null;
  published_at: string | null;
}

const Index = () => {
  const [featured, setFeatured] = useState<PortfolioItem[]>([]);
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [liked, setLiked] = useState<Set<string>>(() =>
    typeof window !== "undefined" ? getSet(LIKES_KEY, localStorage) : new Set()
  );

  useEffect(() => {
    document.title = "studio.nx — Graphic Designer Portfolio";

    supabase
      .from("portfolio_items")
      .select("id,title,slug,category,cover_image_url,views_count,likes_count")
      .eq("featured", true)
      .order("created_at", { ascending: false })
      .limit(4)
      .then(({ data }) => {
        const items = (data ?? []) as PortfolioItem[];
        setFeatured(items);

        // Increment view once per browser session per item
        const viewed = getSet(VIEWS_KEY, sessionStorage);
        const fresh = items.filter((it) => !viewed.has(it.id));
        if (fresh.length === 0) return;
        fresh.forEach((it) => viewed.add(it.id));
        saveSet(VIEWS_KEY, viewed, sessionStorage);
        Promise.all(
          fresh.map((it) =>
            supabase
              .rpc("increment_portfolio_view", { _id: it.id })
              .then(({ data: c }) => ({ id: it.id, c }))
          )
        ).then((results) => {
          setFeatured((curr) =>
            curr.map((it) => {
              const r = results.find((x) => x.id === it.id);
              return r && typeof r.c === "number" ? { ...it, views_count: r.c } : it;
            })
          );
        });
      });

    supabase
      .from("blog_posts")
      .select("id,title,slug,excerpt,cover_image_url,published_at")
      .eq("published", true)
      .order("published_at", { ascending: false })
      .limit(3)
      .then(({ data }) => setPosts(data ?? []));
  }, []);

  const handleLike = async (e: React.MouseEvent, id: string) => {
    e.preventDefault();
    e.stopPropagation();
    if (liked.has(id)) return;
    const next = new Set(liked);
    next.add(id);
    setLiked(next);
    saveSet(LIKES_KEY, next, localStorage);
    setFeatured((curr) =>
      curr.map((it) => (it.id === id ? { ...it, likes_count: it.likes_count + 1 } : it))
    );
    const { data, error } = await supabase.rpc("increment_portfolio_like", { _id: id });
    if (!error && typeof data === "number") {
      setFeatured((curr) =>
        curr.map((it) => (it.id === id ? { ...it, likes_count: data } : it))
      );
    }
  };

  return (
    <Layout>
      {/* Hero */}
      <section className="relative overflow-hidden noise">
        <div className="absolute inset-0 -z-10">
          <img
            src={heroBg}
            alt=""
            width={1920}
            height={1080}
            className="w-full h-full object-cover opacity-40 dark:block hidden"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-background/40 via-background/70 to-background" />
          <div className="absolute inset-0 grid-bg opacity-50" />
        </div>

        <div className="container min-h-[88vh] flex flex-col justify-center py-24">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="inline-flex self-start items-center gap-2 px-3 py-1.5 rounded-full border border-primary/30 bg-primary/5 mb-6 font-mono text-xs"
          >
            <span className="w-2 h-2 rounded-full bg-primary animate-pulse-glow" />
            Available for projects · 2026
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.1 }}
            className="font-display font-bold text-5xl md:text-7xl lg:text-8xl leading-[0.95] max-w-5xl"
          >
            I design{" "}
            <span className="text-gradient text-glow-cyan">experiences</span>,
            <br />
            not just{" "}
            <span className="relative inline-block">
              visuals.
              <motion.span
                initial={{ scaleX: 0 }}
                animate={{ scaleX: 1 }}
                transition={{ delay: 1, duration: 0.8 }}
                className="absolute -bottom-2 left-0 right-0 h-1 bg-gradient-neon origin-left"
              />
            </span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="mt-8 text-lg md:text-xl text-muted-foreground max-w-2xl"
          >
            Independent graphic designer crafting bold brands, interfaces, and visual systems
            for ambitious teams across the globe.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.5 }}
            className="mt-10 flex flex-wrap gap-4"
          >
            <Link to="/portfolio">
              <Button variant="neon" size="xl" className="gap-2">
                View work <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
            <Link to="/blog">
              <Button variant="neon-outline" size="xl">Read journal</Button>
            </Link>
          </motion.div>
        </div>

        {/* Marquee */}
        <div className="border-y border-border bg-card/30 backdrop-blur-sm overflow-hidden">
          <div className="flex animate-marquee whitespace-nowrap py-4">
            {[...Array(2)].map((_, i) => (
              <div key={i} className="flex items-center gap-12 pr-12 font-display text-2xl text-muted-foreground">
                {["Branding", "UI / UX", "Editorial", "Type Design", "Motion", "Identity", "Packaging"].map((s) => (
                  <span key={s} className="flex items-center gap-12">
                    {s}
                    <Sparkles className="w-5 h-5 text-primary" />
                  </span>
                ))}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Work */}
      <section className="container py-24">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
          <div>
            <p className="font-mono text-xs text-primary mb-3">// 01 — selected work</p>
            <h2 className="font-display text-4xl md:text-5xl font-bold">
              Recent <span className="text-gradient">projects</span>
            </h2>
          </div>
          <Link to="/portfolio" className="group inline-flex items-center gap-2 text-sm font-medium hover:text-primary transition-colors">
            All projects <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>

        {featured.length === 0 ? (
          <EmptyState
            icon={<Zap className="w-6 h-6" />}
            title="No featured projects yet"
            text="Sign in as admin to add your first project."
          />
        ) : (
          <div className="grid gap-6 md:grid-cols-2">
            {featured.map((item, i) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
              >
                <Link
                  to={`/portfolio`}
                  className="group block relative aspect-[4/3] rounded-2xl overflow-hidden border border-border hover:border-primary transition-all duration-500"
                >
                  {item.cover_image_url ? (
                    <img
                      src={item.cover_image_url}
                      alt={item.title}
                      loading="lazy"
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-violet" />
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-background via-background/40 to-transparent opacity-90" />

                  {/* Right-side stats: views + likes */}
                  <div className="absolute top-4 right-4 flex flex-col gap-2 z-10">
                    <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-full bg-background/70 backdrop-blur border border-border text-xs font-mono">
                      <Eye className="w-3.5 h-3.5 text-primary" />
                      <span>{item.views_count.toLocaleString()}</span>
                    </div>
                    <button
                      type="button"
                      onClick={(e) => handleLike(e, item.id)}
                      aria-label={liked.has(item.id) ? "Liked" : "Like project"}
                      className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-full backdrop-blur border text-xs font-mono transition-all ${
                        liked.has(item.id)
                          ? "bg-secondary/20 border-secondary text-secondary"
                          : "bg-background/70 border-border hover:border-secondary hover:text-secondary"
                      }`}
                    >
                      <Heart
                        className={`w-3.5 h-3.5 transition-transform ${liked.has(item.id) ? "fill-current scale-110" : ""}`}
                      />
                      <span>{item.likes_count.toLocaleString()}</span>
                    </button>
                  </div>

                  <div className="absolute inset-x-0 bottom-0 p-6">
                    {item.category && (
                      <p className="font-mono text-xs text-primary mb-2">{item.category}</p>
                    )}
                    <h3 className="font-display text-2xl font-bold">{item.title}</h3>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        )}
      </section>

      {/* Blog preview */}
      <section className="container py-24">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
          <div>
            <p className="font-mono text-xs text-secondary mb-3">// 02 — journal</p>
            <h2 className="font-display text-4xl md:text-5xl font-bold">
              Latest <span className="text-gradient">writing</span>
            </h2>
          </div>
          <Link to="/blog" className="group inline-flex items-center gap-2 text-sm font-medium hover:text-secondary transition-colors">
            All posts <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>

        {posts.length === 0 ? (
          <EmptyState
            icon={<Sparkles className="w-6 h-6" />}
            title="No posts yet"
            text="Sign in as admin to publish your first blog post."
          />
        ) : (
          <div className="grid gap-6 md:grid-cols-3">
            {posts.map((post, i) => (
              <motion.div
                key={post.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
              >
                <Link
                  to={`/blog/${post.slug}`}
                  className="group block rounded-xl overflow-hidden border border-border hover:border-secondary transition-all"
                >
                  <div className="aspect-video overflow-hidden bg-muted">
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
                  <div className="p-5">
                    {post.published_at && (
                      <p className="font-mono text-xs text-muted-foreground mb-2">
                        {new Date(post.published_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                      </p>
                    )}
                    <h3 className="font-display text-xl font-bold mb-2 group-hover:text-secondary transition-colors">
                      {post.title}
                    </h3>
                    {post.excerpt && (
                      <p className="text-sm text-muted-foreground line-clamp-2">{post.excerpt}</p>
                    )}
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        )}
      </section>
    </Layout>
  );
};

const EmptyState = ({ icon, title, text }: { icon: React.ReactNode; title: string; text: string }) => (
  <div className="border border-dashed border-border rounded-2xl p-12 text-center">
    <div className="w-12 h-12 grid place-items-center mx-auto rounded-full bg-primary/10 text-primary mb-4">
      {icon}
    </div>
    <h3 className="font-display text-xl font-semibold mb-2">{title}</h3>
    <p className="text-sm text-muted-foreground">{text}</p>
  </div>
);

export default Index;
