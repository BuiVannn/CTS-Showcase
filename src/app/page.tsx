import Navbar from "@/components/Navbar";
import Hero from "@/components/Hero";
import AboutSection from "@/components/AboutSection";
import ShowcaseSection from "@/components/ShowcaseSection";
import Spotlight from "@/components/Spotlight";
import SplitSection from "@/components/SplitSection";
import ProductShowcase from "@/components/ProductShowcase";
import Team from "@/components/Team";
import Partners from "@/components/Partners";
import Contact from "@/components/Contact";
import Footer from "@/components/Footer";

export default function Home() {
  return (
    <>
      <Navbar />
      <main className="relative">
        <Hero />
        <AboutSection />
        <ShowcaseSection />
        <Spotlight />
        <SplitSection />
        <ProductShowcase />
        <Team />
        <Partners />
        <Contact />
      </main>
      <Footer />
    </>
  );
}
