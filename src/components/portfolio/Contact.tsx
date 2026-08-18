import { useEffect, useRef, useState } from "react";
import { Mail, MapPin, Send, Linkedin, Github } from "lucide-react";

export function Contact() {
  const ref = useRef<HTMLElement>(null);
  const [status, setStatus] = useState<"idle" | "sent">("idle");

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
          }
        });
      },
      { threshold: 0.1, rootMargin: "0px 0px -50px 0px" }
    );

    const elements = ref.current?.querySelectorAll(".fade-in");
    elements?.forEach((el) => observer.observe(el));

    return () => observer.disconnect();
  }, []);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setStatus("sent");
    setTimeout(() => setStatus("idle"), 3000);
  };

  return (
    <section id="contact" ref={ref} className="bg-background py-24 md:py-32">
      <div className="mx-auto max-w-6xl px-6">
        <div className="grid gap-12 md:grid-cols-2 md:gap-16">
          <div className="space-y-8 fade-in">
            <div>
              <p className="font-mono text-sm font-medium uppercase tracking-widest text-primary">Contato</p>
              <h2 className="mt-3 text-balance text-3xl font-semibold leading-tight text-foreground md:text-4xl">
                Vamos construir algo juntos?
              </h2>
            </div>
            <p className="max-w-md text-base leading-relaxed text-muted-foreground">
              Estou aberto a oportunidades, freelas e colaborações em projetos interessantes. Me envie uma mensagem e vamos conversar.
            </p>
            <div className="space-y-4">
              <a
                href="mailto:gustavo@gustavoalexandre.dev"
                className="flex items-center gap-3 text-sm font-medium text-foreground transition-colors hover:text-primary"
              >
                <Mail className="h-5 w-5 text-primary" />
                gustavo@gustavoalexandre.dev
              </a>
              <div className="flex items-center gap-3 text-sm font-medium text-muted-foreground">
                <MapPin className="h-5 w-5 text-primary" />
                São Paulo, Brasil
              </div>
              <div className="flex items-center gap-4 pt-2">
                <a
                  href="https://github.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-sm font-medium text-foreground transition-colors hover:text-primary"
                >
                  <Github className="h-5 w-5" />
                  GitHub
                </a>
                <a
                  href="https://linkedin.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-sm font-medium text-foreground transition-colors hover:text-primary"
                >
                  <Linkedin className="h-5 w-5" />
                  LinkedIn
                </a>
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4 rounded-3xl border border-border bg-card p-6 md:p-8 fade-in stagger-2">
            <div>
              <label htmlFor="name" className="mb-2 block text-sm font-medium text-card-foreground">
                Nome
              </label>
              <input
                id="name"
                type="text"
                required
                className="w-full rounded-xl border border-input bg-background px-4 py-3 text-sm text-foreground outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-ring"
                placeholder="Seu nome"
              />
            </div>
            <div>
              <label htmlFor="email" className="mb-2 block text-sm font-medium text-card-foreground">
                Email
              </label>
              <input
                id="email"
                type="email"
                required
                className="w-full rounded-xl border border-input bg-background px-4 py-3 text-sm text-foreground outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-ring"
                placeholder="seu@email.com"
              />
            </div>
            <div>
              <label htmlFor="message" className="mb-2 block text-sm font-medium text-card-foreground">
                Mensagem
              </label>
              <textarea
                id="message"
                required
                rows={4}
                className="w-full resize-none rounded-xl border border-input bg-background px-4 py-3 text-sm text-foreground outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-ring"
                placeholder="Conte-me sobre o seu projeto..."
              />
            </div>
            <button
              type="submit"
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-6 py-3 text-sm font-medium text-primary-foreground transition-transform hover:scale-[1.02]"
            >
              {status === "sent" ? "Mensagem enviada!" : "Enviar mensagem"}
              <Send className="h-4 w-4" />
            </button>
          </form>
        </div>
      </div>
    </section>
  );
}
