import type { LucideIcon } from "lucide-react";
import { Mic, Paintbrush, Film, Music, GraduationCap, Signature, Bluetooth } from "lucide-react";
import type { IconKey } from "@/content/types";

/** Single source for mapping an app's IconKey to a lucide icon component. */
export const APP_ICONS: Record<IconKey, LucideIcon> = {
  mic: Mic,
  paintbrush: Paintbrush,
  film: Film,
  music: Music,
  graduation: GraduationCap,
  signature: Signature,
  bluetooth: Bluetooth,
};
