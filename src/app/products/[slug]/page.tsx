import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import ProductDetail from "@/components/products/ProductDetail";
import { getProducts, getProduct } from "@/content/products";

export function generateStaticParams() {
  return getProducts().map((p) => ({ slug: p.slug }));
}

export async function generateMetadata(
  { params }: { params: Promise<{ slug: string }> }
): Promise<Metadata> {
  const { slug } = await params;
  const p = getProduct(slug);
  return { title: p ? `${p.name} — CTS Lab` : "Không tìm thấy — CTS Lab" };
}

export default async function ProductDetailPage(
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  if (!getProduct(slug)) notFound();
  return (
    <>
      <Navbar />
      <main><ProductDetail slug={slug} /></main>
      <Footer />
    </>
  );
}
