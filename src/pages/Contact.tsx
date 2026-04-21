import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Mail, MessageSquare, ArrowUpRight, CheckCircle2, Clock, RefreshCw } from "lucide-react";
import { z } from "zod";
import { Layout } from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const schema = z.object({
  full_name: z.string().trim().min(1, "Name is required").max(100),
  email: z.string().trim().email("Invalid email").max(255),
  message: z.string().trim().min(1, "Message is required").max(5000),
});

const Contact = () => {
  const [form, setForm] = useState({ full_name: "", email: "", message: "" });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [sent, setSent] = useState<{ name: string; email: string } | null>(null);

  useEffect(() => {
    document.title = "Let's Talk — studio.nx";
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    const parsed = schema.safeParse(form);
    if (!parsed.success) {
      const fieldErrors: Record<string, string> = {};
      parsed.error.issues.forEach((i) => {
        if (i.path[0]) fieldErrors[i.path[0] as string] = i.message;
      });
      setErrors(fieldErrors);
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.functions.invoke("send-contact-email", {
        body: parsed.data,
      });
      if (error) throw error;
      toast.success("Message sent! I'll get back to you soon.");
      setSent({ name: parsed.data.full_name, email: parsed.data.email });
      setForm({ full_name: "", email: "", message: "" });
    } catch (err) {
      console.error(err);
      toast.error("Couldn't send message. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      <section className="container py-24 md:py-32">
        <div className="grid gap-16 lg:grid-cols-2 lg:gap-24 items-start">
          {/* Left — copy */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <p className="font-mono text-xs text-primary mb-4">// 03 — contact</p>
            <h1 className="font-display text-5xl md:text-7xl font-bold leading-[0.95]">
              Let's <span className="text-gradient text-glow-cyan">talk</span>.
            </h1>
            <p className="mt-6 text-lg text-muted-foreground max-w-md">
              Whether you're looking to build a new brand, refine an interface, or
              bring a unique project to life — I'm here to help.
            </p>

            <div className="mt-10 space-y-4">
              <div className="flex items-center gap-4 p-4 rounded-xl border border-border bg-card/40">
                <div className="w-10 h-10 grid place-items-center rounded-lg bg-primary/10 text-primary">
                  <Mail className="w-5 h-5" />
                </div>
                <div>
                  <p className="font-mono text-xs text-muted-foreground">Email</p>
                  <p className="font-medium">hello@studio.nx</p>
                </div>
              </div>
              <div className="flex items-center gap-4 p-4 rounded-xl border border-border bg-card/40">
                <div className="w-10 h-10 grid place-items-center rounded-lg bg-secondary/10 text-secondary">
                  <MessageSquare className="w-5 h-5" />
                </div>
                <div>
                  <p className="font-mono text-xs text-muted-foreground">Response time</p>
                  <p className="font-medium">Usually within 24 hours</p>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Right — form */}
          <motion.form
            onSubmit={handleSubmit}
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.15 }}
            className="relative rounded-2xl border border-border bg-card/40 backdrop-blur-sm p-6 md:p-8 noise"
          >
            <div className="absolute -inset-px rounded-2xl bg-gradient-neon opacity-20 -z-10 blur-xl" />

            <div className="space-y-5">
              <div>
                <Label htmlFor="full_name" className="text-sm font-medium">Full name</Label>
                <Input
                  id="full_name"
                  value={form.full_name}
                  onChange={(e) => setForm({ ...form, full_name: e.target.value })}
                  placeholder="ex., Basit"
                  maxLength={100}
                  className="mt-2 bg-background/50 border-border focus-visible:ring-primary"
                />
                {errors.full_name && <p className="text-xs text-destructive mt-1">{errors.full_name}</p>}
              </div>

              <div>
                <Label htmlFor="email" className="text-sm font-medium">Email address</Label>
                <Input
                  id="email"
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  placeholder="ex., basit@gmail.com"
                  maxLength={255}
                  className="mt-2 bg-background/50 border-border focus-visible:ring-primary"
                />
                {errors.email && <p className="text-xs text-destructive mt-1">{errors.email}</p>}
              </div>

              <div>
                <Label htmlFor="message" className="text-sm font-medium">Your message</Label>
                <Textarea
                  id="message"
                  value={form.message}
                  onChange={(e) => setForm({ ...form, message: e.target.value })}
                  placeholder="Share your thoughts or inquiries..."
                  rows={6}
                  maxLength={5000}
                  className="mt-2 bg-background/50 border-border focus-visible:ring-primary resize-none"
                />
                {errors.message && <p className="text-xs text-destructive mt-1">{errors.message}</p>}
                <p className="text-xs text-muted-foreground mt-1 text-right">
                  {form.message.length}/5000
                </p>
              </div>

              <Button
                type="submit"
                variant="neon"
                size="xl"
                disabled={loading}
                className="w-full gap-2"
              >
                {loading ? "Sending..." : "Send Message"}
                <ArrowUpRight className="w-4 h-4" />
              </Button>
            </div>
          </motion.form>
        </div>
      </section>
    </Layout>
  );
};

export default Contact;
