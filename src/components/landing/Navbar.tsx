import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { Menu, X, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import logo from "@/assets/logo-disruptivaa.png";
import { Button } from "@/components/ui/button";

const navLinks = [
  {
    label: "Servicios",
    children: [
      { label: "CRM que sí se usa", href: "/brief" },
      { label: "Negocio en 14 días", href: "/negocio-14-dias" },
      { label: "Shopify", href: "/brief" },
    ],
  },
  { label: "Brief", href: "/brief" },
];

const Navbar = () => {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    setMobileOpen(false);
    setDropdownOpen(false);
  }, [location.pathname]);

  return (
    <header
      className={cn(
        "fixed top-0 left-0 right-0 z-50 transition-all duration-300",
        scrolled
          ? "bg-background/70 backdrop-blur-xl border-b border-border shadow-lg shadow-black/10"
          : "bg-transparent"
      )}
    >
      <nav className="max-w-7xl mx-auto flex items-center justify-between px-6 h-16">
        <Link to="/" className="shrink-0">
          <img src={logo} alt="Disruptivaa" className="h-7" />
        </Link>

        {/* Desktop Nav */}
        <div className="hidden md:flex items-center gap-8">
          {navLinks.map((link) =>
            link.children ? (
              <div key={link.label} className="relative">
                <button
                  onClick={() => setDropdownOpen(!dropdownOpen)}
                  className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  {link.label}
                  <ChevronDown size={14} className={cn("transition-transform", dropdownOpen && "rotate-180")} />
                </button>
                {dropdownOpen && (
                  <div className="absolute top-full left-0 mt-2 w-56 rounded-xl bg-card/95 backdrop-blur-xl border border-border shadow-xl shadow-black/30 p-2">
                    {link.children.map((child) => (
                      <Link
                        key={child.label}
                        to={child.href}
                        className="block px-4 py-2.5 text-sm text-muted-foreground hover:text-foreground hover:bg-secondary rounded-lg transition-colors"
                      >
                        {child.label}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <Link
                key={link.label}
                to={link.href!}
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                {link.label}
              </Link>
            )
          )}
        </div>

        {/* Desktop CTA */}
        <div className="hidden md:flex items-center gap-3">
          <Link to="/auth">
            <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground">
              Log In
            </Button>
          </Link>
          <Link to="/brief">
            <Button size="sm" className="bg-primary hover:bg-primary/90 text-primary-foreground border-0">
              Agendar llamada
            </Button>
          </Link>
        </div>

        {/* Mobile toggle */}
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="md:hidden text-muted-foreground hover:text-foreground"
        >
          {mobileOpen ? <X size={22} /> : <Menu size={22} />}
        </button>
      </nav>

      {/* Mobile Menu */}
      {mobileOpen && (
        <div className="md:hidden bg-background/95 backdrop-blur-xl border-t border-border px-6 pb-6 pt-4 space-y-4">
          {navLinks.map((link) =>
            link.children ? (
              <div key={link.label} className="space-y-2">
                <p className="text-xs uppercase tracking-widest text-muted-foreground font-semibold">{link.label}</p>
                {link.children.map((child) => (
                  <Link
                    key={child.label}
                    to={child.href}
                    className="block text-sm text-muted-foreground hover:text-foreground pl-3 py-1.5"
                  >
                    {child.label}
                  </Link>
                ))}
              </div>
            ) : (
              <Link key={link.label} to={link.href!} className="block text-sm text-muted-foreground hover:text-foreground py-1.5">
                {link.label}
              </Link>
            )
          )}
          <div className="flex gap-3 pt-4 border-t border-border">
            <Link to="/auth" className="flex-1">
              <Button variant="outline" size="sm" className="w-full">Log In</Button>
            </Link>
            <Link to="/brief" className="flex-1">
              <Button size="sm" className="w-full bg-primary hover:bg-primary/90 text-primary-foreground border-0">
                Agendar llamada
              </Button>
            </Link>
          </div>
        </div>
      )}
    </header>
  );
};

export default Navbar;
