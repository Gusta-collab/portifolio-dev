import { createFileRoute } from "@tanstack/react-router";
import { Header } from "@/components/portfolio/Header";
import { Hero } from "@/components/portfolio/Hero";
import { About } from "@/components/portfolio/About";
import { Projects } from "@/components/portfolio/Projects";
import { Skills } from "@/components/portfolio/Skills";
import { Contact } from "@/components/portfolio/Contact";
import { Footer } from "@/components/portfolio/Footer";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Gustavo Alexandre — Desenvolvedor Desktop" },
      { name: "description", content: "Portfolio de Gustavo Alexandre, desenvolvedor desktop especializado em Python, automação e aplicativos personalizados." },
      { property: "og:title", content: "Gustavo Alexandre — Desenvolvedor Desktop" },
      { property: "og:description", content: "Portfolio de Gustavo Alexandre, desenvolvedor desktop especializado em Python, automação e aplicativos personalizados." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

function Index() {
  return (
    <main className="min-h-screen bg-background">
      <Header />
      <Hero />
      <About />
      <Projects />
      <Skills />
      <Contact />
      <Footer />
    </main>
  );
}
