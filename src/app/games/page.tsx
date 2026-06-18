import type { Metadata } from "next";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import StubPage from "@/components/StubPage";

export const metadata: Metadata = { title: "Games — CTS Lab" };

export default function GamesPage() {
  return (
    <>
      <Navbar />
      <main><StubPage titleVi="Games" titleEn="Games" /></main>
      <Footer />
    </>
  );
}
