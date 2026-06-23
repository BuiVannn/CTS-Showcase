import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import HomeHero from "@/components/home/HomeHero";
import WhatWeDo from "@/components/home/WhatWeDo";
import SpotlightSection from "@/components/home/SpotlightSection";
import HomeStats from "@/components/home/HomeStats";
import ShowcaseSection from "@/components/home/ShowcaseSection";
import EcosystemBento from "@/components/home/EcosystemBento";
import Partners from "@/components/home/Partners";
import HomeCTA from "@/components/home/HomeCTA";

export default function Home() {
  return (
    <>
      <Navbar />
      <main className="relative">
        <HomeHero />
        <WhatWeDo />
        <SpotlightSection />
        <HomeStats />
        <ShowcaseSection />
        <EcosystemBento />
        <Partners />
        <HomeCTA />
      </main>
      <Footer />
    </>
  );
}
