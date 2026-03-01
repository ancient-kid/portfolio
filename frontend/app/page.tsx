import { CurrentFocusSection } from "./components/CurrentFocusSection";
import { EngineeringLogsSection } from "./components/EngineeringLogsSection";
import { FooterSection } from "./components/FooterSection";
import { HeroSection } from "./components/HeroSection";
import { ProjectsSection } from "./components/ProjectsSection";
import { SystemLabSection } from "./components/SystemLabSection";
import { TerminalSection } from "./components/TerminalSection";

export default function Home() {
  return (
    <main className="bg-black text-white">
      <HeroSection />
      <CurrentFocusSection />
      <ProjectsSection />
      <EngineeringLogsSection />
      <SystemLabSection />
      <TerminalSection />
      <FooterSection />
    </main>
  );
}
