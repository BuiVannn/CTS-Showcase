import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import HomeHero from "@/components/home/HomeHero";
import EcosystemBento from "@/components/home/EcosystemBento";
import HomeStats from "@/components/home/HomeStats";

export default function Home() {
  return (
    <>
      <Navbar />
      <main className="relative">
        <HomeHero />
        <HomeStats />
        <EcosystemBento />
      </main>
      <Footer />
    </>
  );
}
