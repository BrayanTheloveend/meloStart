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
import { prisma } from "@/lib/prisma";


export default async function HomePage() {
  let initialUsers = [];
  let totalUsers = 0;
  let initialTestimonials = [];

  try {
    const [users, count, dbTestimonials] = await Promise.all([
      prisma.user.findMany({
        take: 4,
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          name: true,
          image: true,
        },
      }),
      prisma.user.count(),
      prisma.testimonial.findMany({
        where: { isApproved: true },
        take: 6,
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          name: true,
          role: true,
          text: true,
          rating: true,
          avatarUrl: true,
        },
      }),
    ]);
    initialUsers = users;
    totalUsers = count;
    initialTestimonials = dbTestimonials;
  } catch (error) {
    console.warn("[HomePage] Impossible de charger les données BDD pour la page d'accueil:", error?.message || error);
  }

  return (
    <>
      <Header />
      <main>
        <Hero initialUsers={initialUsers} initialTotalCount={totalUsers} />
        <GenreMarquee />
        {/* <Features /> */}
        <UseCases />
        <Showcase />
        <HowItWorks />
        <Stats />
        <Pricing />
        <Testimonials items={initialTestimonials} />
        <Faq />
        <CtaBanner />
      </main>
      <Footer />
    </>
  );
}
