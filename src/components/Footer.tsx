import { Link } from "react-router-dom";
import { Github, Instagram, Twitter, Mail } from "lucide-react";

export const Footer = () => {
  return (
    <footer className="border-t border-border mt-32">
      <div className="container py-12 grid gap-8 md:grid-cols-3">
        <div>
          <div className="flex items-center gap-2 mb-3">
            <div className="w-8 h-8 rounded-md bg-gradient-neon" />
            <span className="font-display font-bold text-lg">studio.nx</span>
          </div>
          <p className="text-sm text-muted-foreground max-w-xs">
            Designing experiences, not just visuals. Available for select projects.
          </p>
        </div>

        <div>
          <h4 className="font-display font-semibold mb-3">Navigate</h4>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li><Link to="/" className="hover:text-primary transition-colors">Home</Link></li>
            <li><Link to="/portfolio" className="hover:text-primary transition-colors">Work</Link></li>
            <li><Link to="/blog" className="hover:text-primary transition-colors">Blog</Link></li>
          </ul>
        </div>

        <div>
          <h4 className="font-display font-semibold mb-3">Connect</h4>
          <div className="flex gap-3">
            {[Instagram, Twitter, Github, Mail].map((Icon, i) => (
              <a
                key={i}
                href="#"
                className="w-10 h-10 grid place-items-center rounded-md border border-border hover:border-primary hover:text-primary hover:shadow-[0_0_20px_hsl(var(--primary)/0.4)] transition-all"
                aria-label="Social link"
              >
                <Icon className="w-4 h-4" />
              </a>
            ))}
          </div>
        </div>
      </div>
      <div className="border-t border-border">
        <div className="container py-4 text-xs text-muted-foreground font-mono flex flex-col md:flex-row justify-between gap-2">
          <span>© {new Date().getFullYear()} studio.nx — all rights reserved</span>
          <span>built with neon &amp; coffee ☕</span>
        </div>
      </div>
    </footer>
  );
};
