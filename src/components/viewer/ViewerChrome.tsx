"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import ViewerFrame from "@/components/viewer/ViewerFrame";

export type ViewerBack = { label: string; href: string } | { label: string; onClick: () => void };

export interface ViewerChromeProps {
  back: ViewerBack;
  label: string;
  status: string;
  children: ReactNode;
}

const backClasses =
  "inline-flex items-center gap-2 rounded-[var(--radius-pill)] border border-border bg-card/80 px-4 py-2 text-sm font-medium text-ink shadow-[var(--shadow-sm)] backdrop-blur transition-colors hover:text-blue focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue";

export default function ViewerChrome({ back, label, status, children }: ViewerChromeProps) {
  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-bg">
      {/* glassy chrome bar */}
      <header className="flex h-16 shrink-0 items-center gap-3 border-b border-border bg-card/70 px-4 backdrop-blur-md">
        {"href" in back ? (
          <Link href={back.href} className={backClasses}>
            <ArrowLeft size={15} />
            {back.label}
          </Link>
        ) : (
          <button type="button" onClick={back.onClick} className={backClasses}>
            <ArrowLeft size={15} />
            {back.label}
          </button>
        )}

        <div className="ml-1 hidden items-center gap-2 sm:flex">
          <span
            aria-hidden
            className="h-2 w-2 rounded-full"
            style={{ background: "linear-gradient(135deg, var(--blue), var(--red))" }}
          />
          <span className="font-mono text-xs font-semibold uppercase tracking-[0.16em] text-ink">{label}</span>
          <span className="font-mono text-xs uppercase tracking-[0.16em] text-dim">· {status}</span>
        </div>
      </header>

      {/* viewport */}
      <div className="relative flex-1">
        {children}
        <ViewerFrame />
      </div>
    </div>
  );
}
