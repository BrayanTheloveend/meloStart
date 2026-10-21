import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import Hero from "@/components/landing/Hero";
import GenreMarquee from "@/components/landing/GenreMarquee";
import Features from "@/components/landing/Features";
import UseCases from "@/components/landing/UseCases";
import Showcase from "@/components/landing/Showcase";
import HowItWorks from "@/components/landing/HowItWorks";
import Stats from "@/components/landing/Stats";
import Pricing from "@/components/landing/Pricing";
import Testimonials from "@/components/landing/Testimonials";
import Faq from "@/components/landing/Faq";
import CtaBanner from "@/components/landing/CtaBanner";

export default function HomePage() {
  return (
    <>
      <Header />
      <main>
        <Hero />
        <GenreMarquee />
        {/* <Features /> */}
        <UseCases />
        <Showcase />
        <HowItWorks />
        <Stats />
        <Pricing />
        <Testimonials />
        <Faq />
        <CtaBanner />
      </main>
      <Footer />
    </>
  );
}
