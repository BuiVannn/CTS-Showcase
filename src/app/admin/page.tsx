import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import Container from "@/components/ui/Container";

export const metadata: Metadata = { title: "Quản trị — CTS Lab", robots: { index: false } };

export default async function AdminPage() {
  const session = await auth();
  if (!session) redirect("/api/auth/signin?callbackUrl=/admin");
  if (!session.isAdmin) redirect("/account");

  return (
    <>
      <Navbar />
      <main className="section pt-28">
        <Container className="max-w-2xl">
          <span className="eyebrow eyebrow-draw">Quản trị</span>
          <h1 className="text-section mt-3 text-ink">Bảng quản trị</h1>
          <p className="mt-3 text-base leading-relaxed text-ink-2">
            Công cụ quản trị sắp có — duyệt game và quản lý người dùng sẽ ở đây.
          </p>
        </Container>
      </main>
      <Footer />
    </>
  );
}
