import heroImage from "@/../public/images/dev-hero.jpg";

export function Hero() {
  return (
    <section className="relative min-h-screen overflow-hidden bg-background pt-24 md:pt-0">
      <div className="mx-auto grid min-h-screen max-w-6xl items-center gap-8 px-6 py-20 md:grid-cols-2 md:py-0">
        <div className="order-2 space-y-6 md:order-1">
          <p className="font-mono text-sm font-medium uppercase tracking-widest text-primary">
            Desenvolvedor Desktop
          </p>
          <h1 className="font-serif text-balance text-4xl font-normal italic leading-[1.15] text-foreground md:text-5xl lg:text-6xl">
            Transformo ideias em{" "}
            <span className="text-accent not-italic">realidade digital</span>.
          </h1>
          <p className="max-w-md text-base leading-relaxed text-muted-foreground">
            Desenvolvedor full-stack apaixonado por criar aplicações rápidas, acessíveis e com experiências que fazem a diferença.
          </p>
          <div className="flex flex-wrap items-center gap-4 pt-2">
            <a
              href="#projects"
              className="rounded-full bg-primary px-6 py-3 text-sm font-medium text-primary-foreground transition-transform hover:scale-105"
            >
              Ver projetos
            </a>
            <a
              href="#contact"
              className="inline-flex items-center gap-2 rounded-full border border-border px-6 py-3 text-sm font-medium text-foreground transition-colors hover:bg-secondary"
            >
              Vamos conversar
            </a>
          </div>
          <div className="flex flex-wrap gap-4 pt-4 font-mono text-xs text-muted-foreground">
            <span className="rounded-md bg-secondary px-3 py-1">React</span>
            <span className="rounded-md bg-secondary px-3 py-1">TypeScript</span>
            <span className="rounded-md bg-secondary px-3 py-1">Node.js</span>
            <span className="rounded-md bg-secondary px-3 py-1">Tailwind</span>
          </div>
        </div>

        <div className="order-1 flex items-center justify-center md:order-2">
          <div className="relative w-full max-w-md">
            <div className="absolute -right-4 -top-4 h-full w-full rounded-3xl bg-accent/20" />
            <img
              src={heroImage}
              alt="Ilustração abstrata de um desenvolvedor trabalhando com código"
              className="relative rounded-3xl object-cover shadow-2xl"
              width={600}
              height={800}
            />
          </div>
        </div>
      </div>

      <div className="absolute bottom-8 left-1/2 hidden -translate-x-1/2 md:block">
        <div className="flex h-10 w-6 items-start justify-center rounded-full border border-border p-2">
          <div className="h-2 w-1 animate-bounce rounded-full bg-accent" />
        </div>
      </div>
    </section>
  );
}
