import Navbar from "@/components/Navbar";
import Hero from "@/components/Hero";
import AboutSection from "@/components/AboutSection";
import ShowcaseSection from "@/components/ShowcaseSection";
import SplitSection from "@/components/SplitSection";
import ProductShowcase from "@/components/ProductShowcase";
import Team from "@/components/Team";
import Partners from "@/components/Partners";
import Contact from "@/components/Contact";
import Footer from "@/components/Footer";
import ParticleBackground from "@/components/ParticleBackground";
import RobotSection from "@/components/RobotSection";

// Static placeholder data — will be replaced by Payload CMS data once seeded
const defaultSettings = {
  siteName: "Creative Technologies and Simulation Lab",
  heroHeadline: "CTS LAB",
  heroSubtitle: "Hanoi - Vietnam",
  heroBadge: "Posts & Telecommunications Institute of Technology",
  missionStatement:
    "Pioneering the future of STEM education through innovative research, cutting-edge technology, and hands-on learning experiences.",
  contactEmail: "contact@cts.ptit.edu.vn",
  contactPhone: "+84 xxx xxx xxx",
  contactAddress: "Posts & Telecommunications Institute of Technology, Hanoi, Vietnam",
  socialLinks: {
    github: "https://github.com/cts",
    facebook: "https://facebook.com/cts",
    youtube: "https://youtube.com/@cts",
    email: "contact@cts.ptit.edu.vn",
  },
};

export default function Home() {
  const settings = defaultSettings;

  return (
    <>
      <ParticleBackground />
      <Navbar siteName={settings.siteName} />

      <main className="flex-1 relative">
        <Hero
          headline={settings.heroHeadline}
          subtitle={settings.heroSubtitle}
          badge={settings.heroBadge}
        />

        <AboutSection mission={settings.missionStatement} />

        <ShowcaseSection videoUrl="https://www.youtube.com/embed/h94H81kNK9I" />

        <RobotSection />

        <SplitSection />

        <ProductShowcase />

        <Team />

        <Partners />

        <Contact
          email={settings.contactEmail}
          phone={settings.contactPhone}
          address={settings.contactAddress}
        />
      </main>

      <Footer
        siteName={settings.siteName}
        contactEmail={settings.contactEmail}
        contactPhone={settings.contactPhone}
        contactAddress={settings.contactAddress}
        socialLinks={settings.socialLinks}
      />
    </>
  );
}
