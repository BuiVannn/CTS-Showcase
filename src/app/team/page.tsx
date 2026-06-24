import type { Metadata } from "next";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import TeamGrid from "@/components/team/TeamGrid";

export const metadata: Metadata = {
  title: "Đội ngũ",
  description: "Đội ngũ giảng viên và sinh viên xây dựng CTS Lab tại PTIT.",
};

export default function TeamPage() {
  return (
    <>
      <Navbar />
      <main><TeamGrid /></main>
      <Footer />
    </>
  );
}
