import HeroSection from "../components/home/HeroSection";
import CompanyPortalSection from "../components/home/CompanyPortalSection";
import IntroVideoSection from "../components/home/IntroVideoSection";
import RealTalkSection from "../components/home/RealTalkSection";
import CurriculumSection from "../components/home/CurriculumSection";
import ResultsSection from "../components/home/ResultsSection";
import TestimonialsSection from "../components/home/TestimonialsSection";
import NovaHelpSection from "../components/home/NovaHelpSection";
import PricingSection from "../components/home/PricingSection";
import FinalCtaSection from "../components/home/FinalCtaSection";
import HomeFooter from "../components/home/HomeFooter";

export default function HomePage() {
  return (
    <div className="bg-slate-950">
      <HeroSection />
      <CompanyPortalSection />
      <IntroVideoSection />
      <RealTalkSection />
      <CurriculumSection />
      <ResultsSection />
      <TestimonialsSection />
      <NovaHelpSection />
      <PricingSection />
      <FinalCtaSection />
      <HomeFooter />
    </div>
  );
}
