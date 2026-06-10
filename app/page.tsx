import HeroSection from "./components/home/HeroSection";
import WhyTrustSection from "./components/home/WhyTrustSection";
import ServicesSection from "./components/home/ServicesSection";
import TeamSection from "./components/home/TeamSection";
import ScannerCTA from "./components/home/ScannerCTA";
import WhyECSSection from "./components/home/WhyECSSection";

export default function HomePage() {
  return (
    <>
      <HeroSection />
      <WhyTrustSection />
      <ServicesSection />
      <TeamSection />
      <ScannerCTA />
      <WhyECSSection />
    </>
  );
}
