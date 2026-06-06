"use client";

import { useRef, useState } from "react";
import { useGSAP } from "@gsap/react";
import { gsap } from "@/lib/gsap";
import { Send, CheckCircle, AlertCircle } from "lucide-react";

interface ContactProps {
  email?: string;
  phone?: string;
  address?: string;
}

export default function Contact({
  email = "contact@cts.ptit.edu.vn",
  phone = "+84 xxx xxx xxx",
  address = "Posts & Telecommunications Institute of Technology, Hanoi, Vietnam",
}: ContactProps) {
  const sectionRef = useRef<HTMLElement>(null);
  const [status, setStatus] = useState<"idle" | "sending" | "success" | "error">("idle");

  useGSAP(
    () => {
      if (!sectionRef.current) return;

      const title = sectionRef.current.querySelector(".section-title");
      if (title) {
        gsap.from(title, {
          opacity: 0,
          y: 30,
          duration: 0.8,
          ease: "power3.out",
          scrollTrigger: {
            trigger: title,
            start: "top 85%",
            once: true,
          },
        });
      }

      const cols = sectionRef.current.querySelectorAll(".contact-col");

      gsap.fromTo(
        cols,
        { opacity: 0, y: 40 },
        {
          opacity: 1,
          y: 0,
          duration: 0.8,
          stagger: 0.15,
          ease: "power3.out",
          immediateRender: false,
          scrollTrigger: {
            trigger: sectionRef.current,
            start: "top 70%",
            once: true,
          },
        }
      );
    },
    { scope: sectionRef }
  );

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setStatus("sending");

    const form = e.currentTarget;
    const formData = new FormData(form);
    const data = {
      name: formData.get("name") as string,
      email: formData.get("email") as string,
      message: formData.get("message") as string,
    };

    try {
      const res = await fetch("/api/contact-submissions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (res.ok) {
        setStatus("success");
        form.reset();
      } else {
        setStatus("error");
      }
    } catch {
      setStatus("error");
    }
  };

  return (
    <section ref={sectionRef} id="contact" className="section-spacing relative">
      {/* Red accent line */}
      <div className="accent-line mb-16" />

      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        {/* Section header */}
        <div className="section-title mb-16">
          <span className="text-label mb-4 block">Reach Out</span>
          <h2 className="text-section font-[family-name:var(--font-display)] text-[var(--ink)]">
            Contact
          </h2>
          <div className="accent-line-short mt-4" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
          {/* Info column */}
          <div className="contact-col">
            <h3 className="text-xl font-semibold text-[var(--ink)] font-[family-name:var(--font-display)] mb-6">
              Get in touch
            </h3>
            <p className="text-[var(--text-muted)] leading-relaxed mb-8">
              Interested in our research, products, or collaboration opportunities? We&apos;d love to hear from you.
            </p>

            <div className="space-y-4">
              <div>
                <span className="text-xs tracking-widest uppercase text-[var(--text-muted)] mb-1 block">Email</span>
                <a href={`mailto:${email}`} className="text-sm text-[var(--ink)] hover:text-[var(--red-dark)] transition-colors">
                  {email}
                </a>
              </div>
              <div>
                <span className="text-xs tracking-widest uppercase text-[var(--text-muted)] mb-1 block">Phone</span>
                <span className="text-sm text-[var(--text-muted)]">{phone}</span>
              </div>
              <div>
                <span className="text-xs tracking-widest uppercase text-[var(--text-muted)] mb-1 block">Address</span>
                <span className="text-sm text-[var(--text-muted)]">{address}</span>
              </div>
            </div>
          </div>

          {/* Form column */}
          <div className="contact-col">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="contact-field">
                <label htmlFor="name" className="text-xs tracking-widest uppercase text-[var(--text-muted)] mb-2 block">
                  Name
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  required
                  className="w-full bg-transparent border-b-2 border-[var(--border-strong)] py-3 text-sm text-[var(--ink)] placeholder:text-[var(--text-dim)] focus:border-[var(--red)] focus:outline-none transition-colors"
                  placeholder="Your name"
                />
              </div>
              <div className="contact-field">
                <label htmlFor="email" className="text-xs tracking-widest uppercase text-[var(--text-muted)] mb-2 block">
                  Email
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  required
                  className="w-full bg-transparent border-b-2 border-[var(--border-strong)] py-3 text-sm text-[var(--ink)] placeholder:text-[var(--text-dim)] focus:border-[var(--red)] focus:outline-none transition-colors"
                  placeholder="your@email.com"
                />
              </div>
              <div className="contact-field">
                <label htmlFor="message" className="text-xs tracking-widest uppercase text-[var(--text-muted)] mb-2 block">
                  Message
                </label>
                <textarea
                  id="message"
                  name="message"
                  required
                  rows={4}
                  className="w-full bg-transparent border-b-2 border-[var(--border-strong)] py-3 text-sm text-[var(--ink)] placeholder:text-[var(--text-dim)] focus:border-[var(--red)] focus:outline-none transition-colors resize-none"
                  placeholder="Tell us about your inquiry..."
                />
              </div>

              <button
                type="submit"
                disabled={status === "sending"}
                className="contact-submit-btn flex items-center gap-3 px-8 py-3 border border-[var(--red)] text-[var(--red-dark)] text-xs font-medium tracking-widest uppercase disabled:opacity-50 btn-outline"
              >
                {status === "sending" ? (
                  "Sending..."
                ) : (
                  <>
                    Send Message <Send size={14} />
                  </>
                )}
              </button>

              {status === "success" && (
                <div className="flex items-center gap-2 text-sm text-green-500">
                  <CheckCircle size={16} />
                  Message sent successfully!
                </div>
              )}
              {status === "error" && (
                <div className="flex items-center gap-2 text-sm text-[var(--red)]">
                  <AlertCircle size={16} />
                  Failed to send. Please try again.
                </div>
              )}
            </form>
          </div>
        </div>
      </div>
    </section>
  );
}
