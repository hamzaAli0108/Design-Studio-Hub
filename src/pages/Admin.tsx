import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Layout } from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { Trash2, Pencil, Plus, Upload, Loader2 } from "lucide-react";

const slugify = (s: string) =>
  s.toLowerCase().trim().replace(/[^\w\s-]/g, "").replace(/\s+/g, "-").replace(/--+/g, "-");

interface BlogRow {
  id: string; title: string; slug: string; excerpt: string | null;
  content: string; cover_image_url: string | null; tags: string[] | null;
  published: boolean; published_at: string | null;
}
interface PortfolioRow {
  id: string; title: string; slug: string; description: string | null;
  category: string | null; cover_image_url: string | null;
  external_url: string | null; featured: boolean;
}

const Admin = () => {
  const navigate = useNavigate();
  const { user, isAdmin, loading } = useAuth();

  useEffect(() => { document.title = "Admin — studio.nx"; }, []);

  useEffect(() => {
    if (!loading) {
      if (!user) navigate("/auth", { replace: true });
    }
  }, [user, loading, navigate]);

  if (loading) return <Layout><div className="container py-24">Loading...</div></Layout>;
  if (!user) return null;
  if (!isAdmin) {
    return (
      <Layout>
        <div className="container py-24 max-w-md text-center">
          <h1 className="font-display text-3xl font-bold mb-3">Not authorized</h1>
          <p className="text-muted-foreground">Your account doesn't have admin privileges.</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <section className="container py-12">
        <div className="flex items-center justify-between mb-8">
          <div>
            <p className="font-mono text-xs text-primary mb-2">// admin</p>
            <h1 className="font-display text-4xl md:text-5xl font-bold">Dashboard</h1>
          </div>
        </div>

        <Tabs defaultValue="blog">
          <TabsList className="mb-8">
            <TabsTrigger value="blog">Blog Posts</TabsTrigger>
            <TabsTrigger value="portfolio">Portfolio</TabsTrigger>
          </TabsList>
          <TabsContent value="blog"><BlogManager userId={user.id} /></TabsContent>
          <TabsContent value="portfolio"><PortfolioManager userId={user.id} /></TabsContent>
        </Tabs>
      </section>
    </Layout>
  );
};

/* ==================== Image upload helper ==================== */
async function uploadImage(file: File, folder: string): Promise<string | null> {
  const ext = file.name.split(".").pop();
  const path = `${folder}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
  const { error } = await supabase.storage.from("media").upload(path, file);
  if (error) { toast.error(error.message); return null; }
  const { data } = supabase.storage.from("media").getPublicUrl(path);
  return data.publicUrl;
}

/* ==================== Blog Manager ==================== */
const emptyBlog: Partial<BlogRow> = {
  title: "", slug: "", excerpt: "", content: "", cover_image_url: "",
  tags: [], published: false,
};

const BlogManager = ({ userId }: { userId: string }) => {
  const [posts, setPosts] = useState<BlogRow[]>([]);
  const [editing, setEditing] = useState<Partial<BlogRow> | null>(null);
  const [tagsInput, setTagsInput] = useState("");
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    const { data } = await supabase
      .from("blog_posts").select("*").order("created_at", { ascending: false });
    setPosts((data ?? []) as BlogRow[]);
  };
  useEffect(() => { load(); }, []);

  const startNew = () => { setEditing({ ...emptyBlog }); setTagsInput(""); };
  const startEdit = (p: BlogRow) => { setEditing(p); setTagsInput((p.tags ?? []).join(", ")); };
  const cancel = () => { setEditing(null); setTagsInput(""); };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]; if (!f) return;
    setUploading(true);
    const url = await uploadImage(f, "blog");
    if (url) setEditing((p) => ({ ...p!, cover_image_url: url }));
    setUploading(false);
  };

  const save = async () => {
    if (!editing?.title?.trim() || !editing.content?.trim()) {
      toast.error("Title and content required");
      return;
    }
    setSaving(true);
    const slug = editing.slug?.trim() || slugify(editing.title);
    const tags = tagsInput.split(",").map((t) => t.trim()).filter(Boolean);
    const payload: any = {
      title: editing.title,
      slug,
      excerpt: editing.excerpt || null,
      content: editing.content,
      cover_image_url: editing.cover_image_url || null,
      tags,
      published: editing.published ?? false,
      published_at: editing.published ? (editing.published_at ?? new Date().toISOString()) : null,
      author_id: userId,
    };
    let error;
    if (editing.id) {
      ({ error } = await supabase.from("blog_posts").update(payload).eq("id", editing.id));
    } else {
      ({ error } = await supabase.from("blog_posts").insert(payload));
    }
    setSaving(false);
    if (error) { toast.error(error.message); return; }
    toast.success(editing.id ? "Post updated" : "Post created");
    cancel(); load();
  };

  const remove = async (id: string) => {
    if (!confirm("Delete this post?")) return;
    const { error } = await supabase.from("blog_posts").delete().eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Deleted"); load();
  };

  if (editing) {
    return (
      <div className="grid gap-5 max-w-3xl">
        <div className="grid gap-2">
          <Label>Title</Label>
          <Input value={editing.title ?? ""} onChange={(e) => setEditing({ ...editing, title: e.target.value })} />
        </div>
        <div className="grid gap-2">
          <Label>Slug (optional, auto from title)</Label>
          <Input value={editing.slug ?? ""} onChange={(e) => setEditing({ ...editing, slug: e.target.value })} placeholder="my-first-post" />
        </div>
        <div className="grid gap-2">
          <Label>Excerpt</Label>
          <Textarea rows={2} value={editing.excerpt ?? ""} onChange={(e) => setEditing({ ...editing, excerpt: e.target.value })} />
        </div>
        <div className="grid gap-2">
          <Label>Cover image</Label>
          <div className="flex items-center gap-3">
            <input type="file" accept="image/*" onChange={handleUpload} className="hidden" id="blog-img" />
            <Button asChild variant="neon-outline" size="sm" disabled={uploading}>
              <label htmlFor="blog-img" className="cursor-pointer">
                {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                {uploading ? "Uploading..." : "Upload"}
              </label>
            </Button>
            {editing.cover_image_url && (
              <img src={editing.cover_image_url} alt="" className="w-16 h-16 object-cover rounded-md border border-border" />
            )}
          </div>
        </div>
        <div className="grid gap-2">
          <Label>Tags (comma-separated)</Label>
          <Input value={tagsInput} onChange={(e) => setTagsInput(e.target.value)} placeholder="design, branding, process" />
        </div>
        <div className="grid gap-2">
          <Label>Content (Markdown supported)</Label>
          <Textarea
            rows={14}
            value={editing.content ?? ""}
            onChange={(e) => setEditing({ ...editing, content: e.target.value })}
            className="font-mono text-sm"
            placeholder="# Heading

Write your post in markdown..."
          />
        </div>
        <div className="flex items-center gap-3 p-4 rounded-lg border border-border">
          <Switch
            checked={!!editing.published}
            onCheckedChange={(v) => setEditing({ ...editing, published: v })}
          />
          <Label>Published</Label>
        </div>
        <div className="flex gap-3">
          <Button variant="neon" onClick={save} disabled={saving}>{saving ? "Saving..." : "Save post"}</Button>
          <Button variant="ghost" onClick={cancel}>Cancel</Button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <Button variant="neon" onClick={startNew} className="mb-6"><Plus className="w-4 h-4" /> New post</Button>
      <div className="grid gap-3">
        {posts.length === 0 && <p className="text-muted-foreground">No posts yet.</p>}
        {posts.map((p) => (
          <div key={p.id} className="flex items-center justify-between gap-4 p-4 rounded-xl border border-border bg-card">
            <div className="min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full ${p.published ? "bg-primary/20 text-primary" : "bg-muted text-muted-foreground"}`}>
                  {p.published ? "PUBLISHED" : "DRAFT"}
                </span>
              </div>
              <p className="font-display font-semibold truncate">{p.title}</p>
              <p className="text-xs text-muted-foreground font-mono truncate">/{p.slug}</p>
            </div>
            <div className="flex gap-2 shrink-0">
              <Button variant="ghost" size="icon" onClick={() => startEdit(p)}><Pencil className="w-4 h-4" /></Button>
              <Button variant="ghost" size="icon" onClick={() => remove(p.id)}><Trash2 className="w-4 h-4" /></Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

/* ==================== Portfolio Manager ==================== */
const emptyPortfolio: Partial<PortfolioRow> = {
  title: "", slug: "", description: "", category: "",
  cover_image_url: "", external_url: "", featured: false,
};

const PortfolioManager = ({ userId }: { userId: string }) => {
  const [items, setItems] = useState<PortfolioRow[]>([]);
  const [editing, setEditing] = useState<Partial<PortfolioRow> | null>(null);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    const { data } = await supabase
      .from("portfolio_items").select("*").order("created_at", { ascending: false });
    setItems((data ?? []) as PortfolioRow[]);
  };
  useEffect(() => { load(); }, []);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]; if (!f) return;
    setUploading(true);
    const url = await uploadImage(f, "portfolio");
    if (url) setEditing((p) => ({ ...p!, cover_image_url: url }));
    setUploading(false);
  };

  const save = async () => {
    if (!editing?.title?.trim()) { toast.error("Title required"); return; }
    setSaving(true);
    const slug = editing.slug?.trim() || slugify(editing.title);
    const payload: any = {
      title: editing.title,
      slug,
      description: editing.description || null,
      category: editing.category || null,
      cover_image_url: editing.cover_image_url || null,
      external_url: editing.external_url || null,
      featured: editing.featured ?? false,
      author_id: userId,
    };
    let error;
    if (editing.id) {
      ({ error } = await supabase.from("portfolio_items").update(payload).eq("id", editing.id));
    } else {
      ({ error } = await supabase.from("portfolio_items").insert(payload));
    }
    setSaving(false);
    if (error) { toast.error(error.message); return; }
    toast.success(editing.id ? "Project updated" : "Project added");
    setEditing(null); load();
  };

  const remove = async (id: string) => {
    if (!confirm("Delete this project?")) return;
    const { error } = await supabase.from("portfolio_items").delete().eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Deleted"); load();
  };

  if (editing) {
    return (
      <div className="grid gap-5 max-w-3xl">
        <div className="grid gap-2"><Label>Title</Label>
          <Input value={editing.title ?? ""} onChange={(e) => setEditing({ ...editing, title: e.target.value })} /></div>
        <div className="grid gap-2"><Label>Slug (optional)</Label>
          <Input value={editing.slug ?? ""} onChange={(e) => setEditing({ ...editing, slug: e.target.value })} /></div>
        <div className="grid gap-2"><Label>Category</Label>
          <Input value={editing.category ?? ""} onChange={(e) => setEditing({ ...editing, category: e.target.value })} placeholder="Branding, UI/UX, Logo..." /></div>
        <div className="grid gap-2"><Label>Description</Label>
          <Textarea rows={3} value={editing.description ?? ""} onChange={(e) => setEditing({ ...editing, description: e.target.value })} /></div>
        <div className="grid gap-2"><Label>External URL (optional)</Label>
          <Input value={editing.external_url ?? ""} onChange={(e) => setEditing({ ...editing, external_url: e.target.value })} placeholder="https://..." /></div>
        <div className="grid gap-2">
          <Label>Cover image</Label>
          <div className="flex items-center gap-3">
            <input type="file" accept="image/*" onChange={handleUpload} className="hidden" id="port-img" />
            <Button asChild variant="neon-outline" size="sm" disabled={uploading}>
              <label htmlFor="port-img" className="cursor-pointer">
                {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                {uploading ? "Uploading..." : "Upload"}
              </label>
            </Button>
            {editing.cover_image_url && (
              <img src={editing.cover_image_url} alt="" className="w-16 h-16 object-cover rounded-md border border-border" />
            )}
          </div>
        </div>
        <div className="flex items-center gap-3 p-4 rounded-lg border border-border">
          <Switch checked={!!editing.featured} onCheckedChange={(v) => setEditing({ ...editing, featured: v })} />
          <Label>Featured on homepage</Label>
        </div>
        <div className="flex gap-3">
          <Button variant="neon" onClick={save} disabled={saving}>{saving ? "Saving..." : "Save project"}</Button>
          <Button variant="ghost" onClick={() => setEditing(null)}>Cancel</Button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <Button variant="neon" onClick={() => setEditing({ ...emptyPortfolio })} className="mb-6">
        <Plus className="w-4 h-4" /> New project
      </Button>
      <div className="grid gap-3">
        {items.length === 0 && <p className="text-muted-foreground">No projects yet.</p>}
        {items.map((p) => (
          <div key={p.id} className="flex items-center justify-between gap-4 p-4 rounded-xl border border-border bg-card">
            <div className="flex items-center gap-3 min-w-0">
              {p.cover_image_url ? (
                <img src={p.cover_image_url} alt="" className="w-12 h-12 object-cover rounded-md border border-border shrink-0" />
              ) : (
                <div className="w-12 h-12 rounded-md bg-gradient-violet shrink-0" />
              )}
              <div className="min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  {p.featured && <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-secondary/20 text-secondary">FEATURED</span>}
                  {p.category && <span className="text-[10px] font-mono text-muted-foreground">{p.category}</span>}
                </div>
                <p className="font-display font-semibold truncate">{p.title}</p>
              </div>
            </div>
            <div className="flex gap-2 shrink-0">
              <Button variant="ghost" size="icon" onClick={() => setEditing(p)}><Pencil className="w-4 h-4" /></Button>
              <Button variant="ghost" size="icon" onClick={() => remove(p.id)}><Trash2 className="w-4 h-4" /></Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Admin;
