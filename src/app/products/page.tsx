import type { Metadata } from "next";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import ProductsGrid from "@/components/products/ProductsGrid";

export const metadata: Metadata = {
  title: "Sản phẩm — CTS Lab",
  description: "Hệ sinh thái ứng dụng AI của CTS Lab: PTalk, VietCreative, Vision Tale, Unilearn.",
};

export default function ProductsPage() {
  return (
    <>
      <Navbar />
      <main><ProductsGrid /></main>
      <Footer />
    </>
  );
}
