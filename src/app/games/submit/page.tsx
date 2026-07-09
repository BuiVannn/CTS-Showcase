import type { Metadata } from "next";
import { redirect } from "next/navigation";

export const metadata: Metadata = { title: "Gửi game — CTS Lab" };

export default function SubmitRedirect() {
  redirect("/games/studio/new");
}
