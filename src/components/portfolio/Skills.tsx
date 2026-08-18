import { useEffect, useRef } from "react";

const skills = [
  { name: "Python", level: 95 },
  { name: "Selenium", level: 90 },
  { name: "CustomTkinter", level: 88 },
  { name: "Google Drive API", level: 80 },
  { name: "Automação Web", level: 92 },
  { name: "PyInstaller", level: 78 },
];

const tools = [
  "Python",
  "Selenium",
  "CustomTkinter",
  "Google Drive API",
  "PyInstaller",
  "Automação Web",
  "Git",
  "PDF Processing",
  "Desktop Apps",
];

export function Skills() {
  const ref = useRef<HTMLElement>(null);

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

  return (
    <section id="skills" ref={ref} className="bg-secondary py-24 md:py-32">
      <div className="mx-auto max-w-6xl px-6">
        <div className="mb-16 max-w-2xl fade-in">
          <p className="font-mono text-sm font-medium uppercase tracking-widest text-primary">Habilidades</p>
          <h2 className="mt-3 text-balance text-3xl font-semibold leading-tight text-foreground md:text-4xl">
            Tecnologias que domino
          </h2>
        </div>

        <div className="grid gap-12 md:grid-cols-2">
          <div className="space-y-6 fade-in">
            {skills.map((skill, index) => (
              <div key={skill.name}>
                <div className="mb-2 flex items-center justify-between text-sm">
                  <span className="font-medium text-foreground">{skill.name}</span>
                  <span className="font-mono text-muted-foreground">{skill.level}%</span>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-background">
                  <div
                    className="h-full rounded-full bg-accent transition-all duration-1000 ease-out"
                    style={{ width: `${skill.level}%`, transitionDelay: `${index * 100}ms` }}
                  />
                </div>
              </div>
            ))}
          </div>

          <div className="fade-in stagger-2">
            <h3 className="mb-6 text-2xl font-semibold text-foreground">Stack</h3>
            <div className="flex flex-wrap gap-3">
              {tools.map((tool) => (
                <span
                  key={tool}
                  className="rounded-full border border-border bg-card px-4 py-2 text-sm font-mono font-medium text-card-foreground transition-colors hover:border-primary hover:text-primary"
                >
                  {tool}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
