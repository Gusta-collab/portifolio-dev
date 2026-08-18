import { useEffect, useRef } from "react";
import { Code2, Server, Gauge } from "lucide-react";

const services = [
  {
    icon: Code2,
    title: "Aplicativos Desktop",
    description: "Desenvolvimento de aplicações personalizadas para desktop, organizadas e eficientes, de acordo com as necessidades de cada projeto.",
  },
  {
    icon: Server,
    title: "Automação Python",
    description: "Criação de scripts e ferramentas que executam tarefas repetitivas de forma automática, reduzindo trabalho manual e aumentando a produtividade.",
  },
  {
    icon: Gauge,
    title: "Otimização de Processos",
    description: "Identificação de tarefas que podem ser otimizadas e desenvolvimento de soluções para executá-las de maneira rápida, padronizada e confiável.",
  },
];

export function About() {
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
    <section id="about" ref={ref} className="bg-secondary py-24 md:py-32">
      <div className="mx-auto max-w-6xl px-6">
        <div className="grid gap-12 md:grid-cols-2 md:gap-16">
          <div className="space-y-6 fade-in">
            <p className="font-mono text-sm font-medium uppercase tracking-widest text-primary">Sobre</p>
            <h2 className="text-balance text-3xl font-semibold leading-tight text-foreground md:text-4xl">
              Desenvolvimento de aplicativos e automação.
            </h2>
          </div>
          <div className="space-y-6 fade-in stagger-2">
            <p className="text-base leading-relaxed text-muted-foreground">
              Tenho experiência no desenvolvimento de aplicativos desktop, utilizando programação para criar soluções personalizadas de acordo com as necessidades de cada projeto. Busco desenvolver aplicações práticas, organizadas e eficientes, com foco em facilitar tarefas e melhorar processos.
            </p>
            <p className="text-base leading-relaxed text-muted-foreground">
              Também trabalho com automações em Python, criando scripts e ferramentas capazes de executar tarefas repetitivas de forma automática, reduzindo o trabalho manual e aumentando a produtividade. Meu objetivo é transformar processos manuais e repetitivos em soluções automatizadas, economizando tempo, reduzindo erros e tornando o trabalho mais eficiente.
            </p>
          </div>
        </div>

        <div className="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {services.map((service, index) => (
            <div
              key={service.title}
              className={`group rounded-2xl border border-border bg-card p-6 transition-all hover:-translate-y-1 hover:shadow-lg fade-in stagger-${index + 1}`}
            >
              <div className="mb-4 inline-flex rounded-xl bg-primary/10 p-3 text-primary">
                <service.icon className="h-6 w-6" />
              </div>
              <h3 className="mb-2 text-xl font-semibold text-card-foreground">{service.title}</h3>
              <p className="text-sm leading-relaxed text-muted-foreground">{service.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
