import { useEffect, useState } from "react";
import { Menu, X } from "lucide-react";

const navLinks = [
  { label: "Sobre", href: "#about" },
  { label: "Projetos", href: "#projects" },
  { label: "Habilidades", href: "#skills" },
  { label: "Contato", href: "#contact" },
];

export function Header() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 transition-all duration-300 ${
        scrolled ? "bg-background/80 backdrop-blur-md shadow-sm" : "bg-transparent"
      }`}
    >
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <a href="#" className="font-serif text-lg font-medium italic tracking-tight text-foreground">
          Gustavo Alexandre
        </a>

        <nav className="hidden items-center gap-8 md:flex">
          {navLinks.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              {link.label}
            </a>
          ))}
          <a
            href="#contact"
            className="rounded-full bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-transform hover:scale-105"
          >
            Vamos conversar
          </a>
        </nav>

        <button
          className="md:hidden"
          aria-label="Abrir menu"
          onClick={() => setMobileOpen(true)}
        >
          <Menu className="h-6 w-6 text-foreground" />
        </button>
      </div>

      {mobileOpen && (
        <div className="fixed inset-0 z-50 bg-background/95 backdrop-blur-sm md:hidden">
          <div className="flex h-full flex-col items-center justify-center gap-8">
            <button
              className="absolute right-6 top-4"
              aria-label="Fechar menu"
              onClick={() => setMobileOpen(false)}
            >
              <X className="h-6 w-6 text-foreground" />
            </button>
            {navLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="font-mono text-2xl text-foreground"
                onClick={() => setMobileOpen(false)}
              >
                {link.label}
              </a>
            ))}
          </div>
        </div>
      )}
    </header>
  );
}
