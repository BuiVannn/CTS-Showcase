import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import Container from "@/components/ui/Container";
import SignOutButton from "@/components/auth/SignOutButton";

export const metadata: Metadata = { title: "Tài khoản", robots: { index: false } };

export default async function AccountPage() {
  const session = await auth();
  if (!session) redirect("/api/auth/signin?callbackUrl=/account");

  const { name, email, image } = session.user ?? {};
  return (
    <>
      <Navbar />
      <main className="section pt-28">
        <Container className="max-w-2xl">
          <h1 className="text-section text-ink">Tài khoản</h1>
          <div className="mt-8 flex items-center gap-4 rounded-[var(--radius-lg)] border border-border bg-card p-6">
            {image ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={image} alt="" className="h-14 w-14 rounded-full object-cover" />
            ) : (
              <span className="flex h-14 w-14 items-center justify-center rounded-full bg-blue/15 text-xl text-blue">
                {(name ?? email ?? "?").slice(0, 1).toUpperCase()}
              </span>
            )}
            <div>
              <p className="text-lg font-semibold text-ink">{name ?? "—"}</p>
              <p className="text-sm text-ink-2">{email ?? "—"}</p>
              {session.isAdmin && (
                <span
                  className="mt-1 inline-block rounded-[var(--radius-pill)] px-2 py-0.5 text-xs font-semibold"
                  style={{ background: "var(--red-soft)", color: "var(--red)" }}
                >
                  Admin
                </span>
              )}
            </div>
          </div>
          <div className="mt-6"><SignOutButton /></div>
        </Container>
      </main>
      <Footer />
    </>
  );
}
