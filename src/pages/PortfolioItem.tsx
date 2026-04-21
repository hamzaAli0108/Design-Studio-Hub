import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, ExternalLink } from "lucide-react";
import { Layout } from "@/components/Layout";
import { supabase } from "@/integrations/supabase/client";

interface Item {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  category: string | null;
  cover_image_url: string | null;
  external_url: string | null;
  gallery: unknown;
  author_id: string;
  created_at: string;
}

interface Author {
  display_name: string | null;
  avatar_url: string | null;
}

const PortfolioItem = () => {
  const { slug } = useParams<{ slug: string }>();
  const [item, setItem] = useState<Item | null>(null);
  const [author, setAuthor] = useState<Author | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!slug) return;
    supabase
      .from("portfolio_items")
      .select("id,title,slug,description,category,cover_image_url,external_url,gallery,author_id,created_at")
      .eq("slug", slug)
      .maybeSingle()
      .then(async ({ data }) => {
        if (!data) {
          setNotFound(true);
          setLoading(false);
          return;
        }
        setItem(data);
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

  if (notFound || !item) {
    return (
      <Layout>
        <div className="container py-24 text-center">
          <h1 className="font-display text-4xl font-bold mb-4">Project not found</h1>
          <Link to="/portfolio" className="text-primary hover:underline">← Back to portfolio</Link>
        </div>
      </Layout>
    );
  }

  const gallery: string[] = Array.isArray(item.gallery)
    ? (item.gallery as unknown[]).filter((g): g is string => typeof g === "string")
    : [];

  return (
    <Layout>
      <article className="container py-12 md:py-20">
        <Link
          to="/portfolio"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary mb-10 group"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          All work
        </Link>

        <motion.header
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-4xl mb-12"
        >
          {item.category && (
            <p className="font-mono text-xs text-primary mb-3">// {item.category}</p>
          )}
          <h1 className="font-display text-5xl md:text-7xl font-bold leading-[1.05] mb-6">
            {item.title}
          </h1>
          {item.description && (
            <p className="text-xl text-muted-foreground max-w-2xl">{item.description}</p>
          )}

          <div className="mt-10 grid grid-cols-2 md:grid-cols-4 gap-6 pt-8 border-t border-border">
            <div>
              <p className="font-mono text-xs text-muted-foreground mb-1">Client</p>
              <p className="font-medium">{author?.display_name ?? "Studio"}</p>
            </div>
            <div>
              <p className="font-mono text-xs text-muted-foreground mb-1">Year</p>
              <p className="font-medium">{new Date(item.created_at).getFullYear()}</p>
            </div>
            {item.category && (
              <div>
                <p className="font-mono text-xs text-muted-foreground mb-1">Discipline</p>
                <p className="font-medium">{item.category}</p>
              </div>
            )}
            {item.external_url && (
              <div>
                <p className="font-mono text-xs text-muted-foreground mb-1">Live</p>
                <a
                  href={item.external_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 font-medium text-primary hover:text-primary-glow"
                >
                  Visit <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            )}
          </div>
        </motion.header>

        {item.cover_image_url && (
          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1 }}
            className="rounded-2xl overflow-hidden border border-border mb-12"
          >
            <img
              src={item.cover_image_url}
              alt={item.title}
              className="w-full h-auto object-cover"
            />
          </motion.div>
        )}

        {gallery.length > 0 && (
          <section className="max-w-5xl mx-auto space-y-8 mb-16">
            <p className="font-mono text-xs text-secondary mb-2">// gallery</p>
            {gallery.map((src, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-100px" }}
                transition={{ duration: 0.5 }}
                className={`rounded-2xl overflow-hidden border border-border ${
                  i % 3 === 0 ? "" : i % 3 === 1 ? "md:ml-12" : "md:mr-12"
                }`}
              >
                <img src={src} alt={`${item.title} — ${i + 1}`} loading="lazy" className="w-full h-auto" />
              </motion.div>
            ))}
          </section>
        )}

        <div className="border-t border-border pt-12 mt-12 text-center">
          <p className="font-mono text-xs text-muted-foreground mb-4">// next</p>
          <Link
            to="/portfolio"
            className="inline-block font-display text-3xl md:text-4xl font-bold hover:text-gradient transition-all"
          >
            See more work →
          </Link>
        </div>
      </article>
    </Layout>
  );
};

export default PortfolioItem;
