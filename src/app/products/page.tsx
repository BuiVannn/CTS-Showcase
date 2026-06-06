import type { Metadata } from "next";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import ProductsView from "@/components/ProductsView";

export const metadata: Metadata = {
  title: "Products — CTS Lab",
  description:
    "Explore the CTS Lab AI ecosystem — PTalk, VietCreative, Vision Tale, and Unilearn. One account, single sign-on.",
};

export default function ProductsPage() {
  return (
    <>
      <Navbar showSectionLinks={false} />
      <ProductsView />
      <Footer />
    </>
  );
}
