import type { Metadata } from "next";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import StubPage from "@/components/StubPage";

export const metadata: Metadata = { title: "Đội ngũ — CTS Lab" };

export default function TeamPage() {
  return (
    <>
      <Navbar />
      <main><StubPage titleVi="Đội ngũ" titleEn="Team" /></main>
      <Footer />
    </>
  );
}
