import type { Metadata } from "next";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import DownloadCenter from "@/components/products/DownloadCenter";

export const metadata: Metadata = {
  title: "Tải ứng dụng",
  description: "Tải ứng dụng CTS Lab cho Android và iOS.",
};

export default function DownloadPage() {
  return (
    <>
      <Navbar />
      <main><DownloadCenter /></main>
      <Footer />
    </>
  );
}
