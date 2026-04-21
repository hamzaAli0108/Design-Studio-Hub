import { useEffect, useState, useMemo } from "react";
import { motion } from "framer-motion";
import { ExternalLink } from "lucide-react";
import { Layout } from "@/components/Layout";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";

interface Item {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  category: string | null;
  cover_image_url: string | null;
  external_url: string | null;
}

const Portfolio = () => {
  const [items, setItems] = useState<Item[]>([]);
  const [filter, setFilter] = useState<string>("All");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    document.title = "Work — studio.nx";
    supabase
      .from("portfolio_items")
      .select("id,title,slug,description,category,cover_image_url,external_url")
      .order("created_at", { ascending: false })
      .then(({ data }) => {
        setItems(data ?? []);
        setLoading(false);
      });
  }, []);

  const categories = useMemo(() => {
    const set = new Set<string>();
    items.forEach((i) => i.category && set.add(i.category));
    return ["All", ...Array.from(set)];
  }, [items]);

  const filtered = filter === "All" ? items : items.filter((i) => i.category === filter);

  return (
    <Layout>
      <section className="container py-16 md:py-24">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <p className="font-mono text-xs text-primary mb-3">// portfolio</p>
          <h1 className="font-display text-5xl md:text-7xl font-bold mb-6">
            Selected <span className="text-gradient">work</span>
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl">
            A collection of brand systems, digital products, and experiments shipped over the years.
          </p>
        </motion.div>

        {categories.length > 1 && (
          <div className="flex flex-wrap gap-2 mt-10">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setFilter(cat)}
                className={`px-4 py-2 rounded-full text-sm font-medium font-mono transition-all border ${
                  filter === cat
                    ? "bg-primary text-primary-foreground border-primary shadow-[0_0_20px_hsl(var(--primary)/0.5)]"
                    : "border-border text-muted-foreground hover:border-primary hover:text-primary"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        )}

        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {loading
            ? [...Array(6)].map((_, i) => (
                <div key={i} className="aspect-[4/5] rounded-xl bg-muted animate-pulse" />
              ))
            : filtered.length === 0
            ? (
              <div className="col-span-full border border-dashed border-border rounded-2xl p-16 text-center">
                <h3 className="font-display text-2xl font-semibold mb-2">No projects yet</h3>
                <p className="text-muted-foreground">Add your first project from the admin dashboard.</p>
              </div>
            )
            : filtered.map((item, i) => (
                <motion.article
                  key={item.id}
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: i * 0.05 }}
                  className="group relative rounded-xl overflow-hidden border border-border hover:border-primary transition-all duration-500"
                >
                  <div className="aspect-[4/5] overflow-hidden bg-muted">
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
                  </div>
                  <div className="absolute inset-0 bg-gradient-to-t from-background via-background/30 to-transparent opacity-95" />
                  <div className="absolute inset-x-0 bottom-0 p-5">
                    {item.category && (
                      <p className="font-mono text-xs text-primary mb-2">{item.category}</p>
                    )}
                    <div className="flex items-start justify-between gap-3">
                      <h3 className="font-display text-xl font-bold">{item.title}</h3>
                      {item.external_url && (
                        <a
                          href={item.external_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-1.5 rounded-md border border-border hover:border-primary hover:text-primary transition-colors"
                          aria-label={`Open ${item.title}`}
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                      )}
                    </div>
                    {item.description && (
                      <p className="text-sm text-muted-foreground line-clamp-2 mt-2">{item.description}</p>
                    )}
                  </div>
                </motion.article>
              ))}
        </div>
      </section>
    </Layout>
  );
};

export default Portfolio;
