import { useState, useEffect, useRef, useCallback } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Menu, X, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import logo from "@/assets/logo-disruptivaa.png";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";

const serviceLinks = [
  { label: "CRM que sí se usa", href: "/servicios/crm-hubspot" },
  { label: "Negocio en 14 días", href: "/servicios/negocio-14-dias" },
  { label: "Shopify", href: "/servicios/shopify" },
  { label: "Marketing & Ads", href: "/servicios/marketing-ads" },
  { label: "Websites & Landings", href: "/servicios/websites-landings" },
  { label: "MVP & Aplicaciones", href: "/servicios/mvp-aplicaciones" },
];

const navLinks = [
  { label: "Servicios", children: serviceLinks },
  { label: "Nosotros", href: "/#nosotros" },
];

const Navbar = () => {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    setMobileOpen(false);
    setDropdownOpen(false);
  }, [location.pathname]);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    };
    if (dropdownOpen) {
      document.addEventListener("mousedown", handler);
    }
    return () => document.removeEventListener("mousedown", handler);
  }, [dropdownOpen]);

  const isActive = useCallback(
    (href: string) => location.pathname === href,
    [location.pathname]
  );

  const isServicesActive = serviceLinks.some((l) => isActive(l.href));

  const handleAgendarClick = () => {
    if (location.pathname === "/") {
      const el = document.getElementById("contacto");
      if (el) {
        el.scrollIntoView({ behavior: "smooth" });
        return;
      }
    }
    navigate("/brief");
  };

  return (
    <header
      className={cn(
        "fixed top-0 left-0 right-0 z-50 transition-all duration-300",
        scrolled
          ? "bg-background/70 backdrop-blur-xl border-b border-border shadow-lg shadow-black/10"
          : "bg-transparent"
      )}
    >
      <nav className="max-w-7xl mx-auto flex items-center justify-between px-6 h-20">
        {/* Left: Logo */}
        <Link to="/" className="shrink-0">
          <img src={logo} alt="Disruptivaa" className="h-7" />
        </Link>

        {/* Center: Nav links (desktop) */}
        <div className="hidden md:flex items-center gap-10">
          {navLinks.map((link) =>
            link.children ? (
              <div key={link.label} className="relative" ref={dropdownRef}>
                <button
                  onClick={() => setDropdownOpen(!dropdownOpen)}
                  className={cn(
                    "flex items-center gap-1 text-sm transition-colors pb-1",
                    isServicesActive
                      ? "text-foreground border-b-2 border-primary"
                      : "text-muted-foreground hover:text-foreground border-b-2 border-transparent"
                  )}
                >
                  {link.label}
                  <ChevronDown
                    size={14}
                    className={cn("transition-transform", dropdownOpen && "rotate-180")}
                  />
                </button>
                <AnimatePresence>
                  {dropdownOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: -4 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -4 }}
                      transition={{ duration: 0.15 }}
                      className="absolute top-full left-0 mt-2 w-56 rounded-xl bg-card/95 backdrop-blur-xl border border-border shadow-xl shadow-black/30 p-2"
                    >
                      {link.children.map((child) => (
                        <Link
                          key={child.label}
                          to={child.href}
                          className="block px-4 py-2.5 text-sm text-muted-foreground hover:text-foreground hover:bg-secondary rounded-lg transition-colors"
                        >
                          {child.label}
                        </Link>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ) : (
              <Link
                key={link.label}
                to={link.href!}
                className={cn(
                  "text-sm transition-colors pb-1",
                  isActive(link.href!)
                    ? "text-foreground border-b-2 border-primary"
                    : "text-muted-foreground hover:text-foreground border-b-2 border-transparent"
                )}
              >
                {link.label}
              </Link>
            )
          )}
        </div>

        {/* Right: CTAs (desktop) */}
        <div className="hidden md:flex items-center gap-3">
          <Link to="/auth">
            <Button
              variant="ghost"
              size="sm"
              className="text-muted-foreground hover:text-foreground"
            >
              Log In
            </Button>
          </Link>
          <Button
            size="sm"
            onClick={handleAgendarClick}
            className="bg-primary hover:bg-primary/90 text-primary-foreground border-0"
          >
            Agendar llamada
          </Button>
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
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: "easeInOut" }}
            className="md:hidden overflow-hidden bg-background/95 backdrop-blur-xl border-t border-border"
          >
            <div className="px-6 pb-6 pt-4 space-y-4">
              {navLinks.map((link) =>
                link.children ? (
                  <div key={link.label} className="space-y-2">
                    <p className="text-xs uppercase tracking-widest text-muted-foreground font-semibold">
                      {link.label}
                    </p>
                    {link.children.map((child) => (
                      <Link
                        key={child.label}
                        to={child.href}
                        className={cn(
                          "block text-sm pl-3 py-1.5 border-l-2 transition-colors",
                          isActive(child.href)
                            ? "text-foreground border-primary"
                            : "text-muted-foreground hover:text-foreground border-transparent"
                        )}
                      >
                        {child.label}
                      </Link>
                    ))}
                  </div>
                ) : (
                  <Link
                    key={link.label}
                    to={link.href!}
                    className={cn(
                      "block text-sm py-1.5 border-l-2 pl-1 transition-colors",
                      isActive(link.href!)
                        ? "text-foreground border-primary"
                        : "text-muted-foreground hover:text-foreground border-transparent"
                    )}
                  >
                    {link.label}
                  </Link>
                )
              )}
              <div className="flex gap-3 pt-4 border-t border-border">
                <Link to="/auth" className="flex-1">
                  <Button variant="outline" size="sm" className="w-full">
                    Log In
                  </Button>
                </Link>
                <Button
                  size="sm"
                  onClick={handleAgendarClick}
                  className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground border-0"
                >
                  Agendar llamada
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
};

export default Navbar;
