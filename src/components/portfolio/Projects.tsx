import { useEffect, useRef } from "react";
import { ArrowUpRight, Github } from "lucide-react";

const projects = [
  {
    title: "Automação eCAC",
    category: "Automação Fiscal · Python",
    description: "Aplicação desktop em Python para automação e organização de processos fiscais no e-CAC. Realiza a coleta de documentos, organização por cliente, processamento em lote e integração com Google Drive, reduzindo tarefas manuais e aumentando a eficiência dos processos.",
    color: "bg-primary",
    text: "text-primary-foreground",
    tags: ["Python", "Selenium", "CustomTkinter", "Google Drive API", "PyInstaller"],
  },
  {
    title: "Extrator Automático PGDAS",
    category: "Automação Web · Python",
    description: "Aplicação desktop em Python para automatizar a consulta e extração de declarações PGDAS-D diretamente do e-CAC. Possui interface gráfica, organização automática dos documentos por cliente, consulta de diferentes anos e geração dos arquivos em PDF.",
    color: "bg-[oklch(0.35_0.08_220)]",
    text: "text-white",
    tags: ["Python", "Selenium", "CustomTkinter", "Automação Web"],
  },
];

export function Projects() {
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
    <section id="projects" ref={ref} className="bg-background py-24 md:py-32">
      <div className="mx-auto max-w-6xl px-6">
        <div className="mb-16 max-w-2xl fade-in">
          <p className="font-mono text-sm font-medium uppercase tracking-widest text-primary">Projetos</p>
          <h2 className="mt-3 text-balance text-3xl font-semibold leading-tight text-foreground md:text-4xl">
            Trabalhos selecionados
          </h2>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {projects.map((project, index) => (
            <article
              key={project.title}
              className={`group relative overflow-hidden rounded-3xl ${project.color} p-8 md:p-10 transition-all hover:-translate-y-1 hover:shadow-xl fade-in stagger-${index + 1}`}
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className={`font-mono text-xs font-medium uppercase tracking-widest ${project.text} opacity-80`}>
                    {project.category}
                  </p>
                  <h3 className={`mt-3 text-2xl font-semibold md:text-3xl ${project.text}`}>
                    {project.title}
                  </h3>
                </div>
                <div className={`rounded-full border ${project.text === "text-white" ? "border-white/30" : "border-current/30"} p-2 opacity-0 transition-opacity group-hover:opacity-100`}>
                  <ArrowUpRight className={`h-5 w-5 ${project.text}`} />
                </div>
              </div>
              <p className={`mt-4 max-w-sm text-sm leading-relaxed ${project.text} opacity-90`}>
                {project.description}
              </p>
              <div className="mt-6 flex flex-wrap gap-2">
                {project.tags.map((tag) => (
                  <span
                    key={tag}
                    className={`rounded-md border ${project.text === "text-white" ? "border-white/20" : "border-current/20"} px-2 py-1 text-xs font-mono ${project.text}`}
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </article>
          ))}
        </div>

        <div className="mt-12 text-center fade-in">
          <a
            href="https://github.com"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-full border border-border px-6 py-3 text-sm font-medium text-foreground transition-colors hover:bg-secondary"
          >
            <Github className="h-4 w-4" />
            Ver mais no GitHub
          </a>
        </div>
      </div>
    </section>
  );
}
