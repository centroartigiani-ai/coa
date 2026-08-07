import { useEffect, useState } from "react";
import { Menu, X, Wrench } from "lucide-react";

const LINKS = [
  { label: "Come funziona", href: "#come-funziona", id: "nav-come-funziona" },
  { label: "Servizi", href: "#servizi", id: "nav-servizi" },
  { label: "Per chi", href: "#per-chi", id: "nav-per-chi" },
  { label: "Partner", href: "#partner", id: "nav-partner" },
  { label: "FAQ", href: "#faq", id: "nav-faq" },
];

export default function Navbar({ onRequest }) {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const go = (href) => {
    setOpen(false);
    document.querySelector(href)?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <header
      data-testid="navbar"
      className={`fixed top-0 left-0 right-0 z-50 transition-colors duration-500 ${
        scrolled || open ? "bg-black/70 backdrop-blur-xl border-b border-white/10" : "bg-transparent border-b border-transparent"
      }`}
    >
      <div className="px-6 md:px-12 mx-auto max-w-7xl flex items-center justify-between h-20">
        <button data-testid="nav-logo" onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })} className="flex items-center gap-3 group">
          <span className="w-9 h-9 bg-[#FF5A00] flex items-center justify-center transition-transform duration-300 group-hover:rotate-90">
            <Wrench className="w-4 h-4 text-black" strokeWidth={2.5} />
          </span>
          <span className="text-left leading-none">
            <span className="font-display font-black text-white text-lg tracking-tight block">COA</span>
            <span className="text-[10px] tracking-[0.2em] uppercase text-white/50 hidden sm:block">Centrale Operativa Artigiani</span>
          </span>
        </button>

        <nav className="hidden lg:flex items-center gap-8">
          {LINKS.map((l) => (
            <button key={l.href} data-testid={l.id} onClick={() => go(l.href)} className="text-sm text-white/60 hover:text-white transition-colors">
              {l.label}
            </button>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          <button
            data-testid="nav-request-cta"
            onClick={onRequest}
            className="hidden sm:inline-flex bg-[#FF5A00] text-white px-6 py-3 text-sm font-medium hover:bg-[#E04F00] transition-colors"
          >
            Richiedi un intervento
          </button>
          <button data-testid="nav-menu-toggle" onClick={() => setOpen(!open)} className="lg:hidden text-white p-2" aria-label="Menu">
            {open ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {open && (
        <div data-testid="nav-mobile-menu" className="lg:hidden bg-black/90 backdrop-blur-xl border-t border-white/10 px-6 py-6 flex flex-col gap-4">
          {LINKS.map((l) => (
            <button key={l.href} data-testid={`${l.id}-mobile`} onClick={() => go(l.href)} className="text-left text-lg text-white/80 hover:text-white transition-colors">
              {l.label}
            </button>
          ))}
          <button
            data-testid="nav-request-cta-mobile"
            onClick={() => { setOpen(false); onRequest(); }}
            className="mt-2 bg-[#FF5A00] text-white px-6 py-4 text-sm font-medium hover:bg-[#E04F00] transition-colors"
          >
            Richiedi un intervento
          </button>
        </div>
      )}
    </header>
  );
}
