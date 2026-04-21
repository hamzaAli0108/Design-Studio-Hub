import { Link, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { Menu, X } from "lucide-react";

const links = [
  { to: "/", label: "Home" },
  { to: "/portfolio", label: "Work" },
  { to: "/blog", label: "Blog" },
  { to: "/contact", label: "Contact" },
];

export const Navbar = () => {
  const { user, isAdmin, signOut } = useAuth();
  const location = useLocation();
  const [open, setOpen] = useState(false);

  return (
    <header className="fixed top-0 inset-x-0 z-50 backdrop-blur-xl bg-background/60 border-b border-border">
      <div className="container flex h-16 items-center justify-between">
        <Link to="/" className="flex items-center gap-2 group">
          <motion.div
            whileHover={{ rotate: 180 }}
            transition={{ duration: 0.6 }}
            className="w-8 h-8 rounded-md bg-gradient-neon glow-soft"
          />
          <span className="font-display font-bold text-lg tracking-tight">
            studio<span className="text-gradient">.nx</span>
          </span>
        </Link>

        <nav className="hidden md:flex items-center gap-8">
          {links.map((link) => {
            const active = location.pathname === link.to ||
              (link.to !== "/" && location.pathname.startsWith(link.to));
            return (
              <Link
                key={link.to}
                to={link.to}
                className={`text-sm font-medium transition-colors relative ${
                  active ? "text-primary" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {link.label}
                {active && (
                  <motion.span
                    layoutId="navUnderline"
                    className="absolute -bottom-1 left-0 right-0 h-px bg-gradient-neon"
                  />
                )}
              </Link>
            );
          })}
        </nav>

        <div className="hidden md:flex items-center gap-3">
          <Link to="/contact">
            <Button variant="neon" size="sm" className="gap-1.5">
              Let's Talk
            </Button>
          </Link>
          {user ? (
            <>
              {isAdmin && (
                <Link to="/admin">
                  <Button variant="neon-outline" size="sm">Admin</Button>
                </Link>
              )}
              <Button variant="ghost" size="sm" onClick={signOut}>Sign out</Button>
            </>
          ) : (
            <Link to="/auth">
              <Button variant="ghost" size="sm">Sign in</Button>
            </Link>
          )}
        </div>

        <button
          className="md:hidden p-2"
          onClick={() => setOpen(!open)}
          aria-label="Toggle menu"
        >
          {open ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {open && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="md:hidden border-t border-border bg-background/95"
        >
          <div className="container py-4 flex flex-col gap-3">
            {links.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                onClick={() => setOpen(false)}
                className="py-2 text-sm font-medium"
              >
                {link.label}
              </Link>
            ))}
            {user ? (
              <>
                {isAdmin && (
                  <Link to="/admin" onClick={() => setOpen(false)}>
                    <Button variant="neon-outline" size="sm" className="w-full">Admin</Button>
                  </Link>
                )}
                <Button variant="ghost" size="sm" onClick={signOut}>Sign out</Button>
              </>
            ) : (
              <Link to="/auth" onClick={() => setOpen(false)}>
                <Button variant="neon" size="sm" className="w-full">Sign in</Button>
              </Link>
            )}
          </div>
        </motion.div>
      )}
    </header>
  );
};
