import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Layout } from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

const Auth = () => {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    document.title = "Sign in — studio.nx";
  }, []);

  useEffect(() => {
    if (!loading && user) navigate("/admin", { replace: true });
  }, [user, loading, navigate]);

  const handle = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/admin`,
            data: { display_name: displayName },
          },
        });
        if (error) throw error;
        toast.success("Account created! You're signed in.");
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        toast.success("Welcome back!");
      }
    } catch (err: any) {
      toast.error(err.message ?? "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Layout>
      <section className="container py-16 md:py-24 max-w-md">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <p className="font-mono text-xs text-primary mb-3">// access</p>
          <h1 className="font-display text-4xl md:text-5xl font-bold mb-2">
            {mode === "signin" ? "Sign in" : "Create account"}
          </h1>
          <p className="text-muted-foreground mb-8">
            {mode === "signin" ? "Welcome back to the studio." : "First user becomes admin automatically."}
          </p>

          <form onSubmit={handle} className="space-y-5 p-6 rounded-2xl border border-border bg-card">
            {mode === "signup" && (
              <div className="space-y-2">
                <Label htmlFor="name">Display name</Label>
                <Input id="name" value={displayName} onChange={(e) => setDisplayName(e.target.value)} placeholder="Your name" required />
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" minLength={6} required />
            </div>

            <Button type="submit" variant="neon" size="lg" className="w-full" disabled={submitting}>
              {submitting ? "Please wait..." : mode === "signin" ? "Sign in" : "Create account"}
            </Button>

            <p className="text-center text-sm text-muted-foreground">
              {mode === "signin" ? "Don't have an account? " : "Already have one? "}
              <button
                type="button"
                onClick={() => setMode(mode === "signin" ? "signup" : "signin")}
                className="text-primary hover:underline font-medium"
              >
                {mode === "signin" ? "Sign up" : "Sign in"}
              </button>
            </p>
          </form>
        </motion.div>
      </section>
    </Layout>
  );
};

export default Auth;
