import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import Container from "@/components/ui/Container";

export const metadata: Metadata = { title: "Thành viên — CTS Lab", robots: { index: false } };

const APPS = [
  { name: "Dashboard", href: "https://dashboard.ctslab.net", desc: "Quản lý hệ sinh thái" },
  { name: "PTalk", href: "/products/ptalk", desc: "Trợ lý giọng nói AI" },
  { name: "VR Tour", href: "/vr-tour", desc: "Tham quan campus PTIT" },
];

export default async function MembersPage() {
  const session = await auth();
  if (!session) redirect("/api/auth/signin?callbackUrl=/members");

  return (
    <>
      <Navbar />
      <main className="section pt-28">
        <Container>
          <span className="eyebrow eyebrow-draw">Thành viên</span>
          <h1 className="text-section mt-3 text-ink">Khu thành viên</h1>
          <p className="mt-3 max-w-xl text-base leading-relaxed text-ink-2">
            Cổng vào hệ sinh thái CTS — một tài khoản cho mọi ứng dụng.
          </p>
          <div className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {APPS.map((a) => (
              <a key={a.name} href={a.href} className="group rounded-[var(--radius-lg)] border border-border bg-card p-6 transition-transform hover:-translate-y-1">
                <h2 className="text-display text-lg text-ink">{a.name}</h2>
                <p className="mt-1.5 text-sm text-ink-2">{a.desc}</p>
              </a>
            ))}
            <div className="rounded-[var(--radius-lg)] border border-dashed border-border bg-surface p-6 text-sm text-dim">
              Khu game của bạn — sắp có.
            </div>
          </div>
        </Container>
      </main>
      <Footer />
    </>
  );
}
