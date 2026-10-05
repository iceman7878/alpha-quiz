import type { Metadata } from "next";
import { LandingV2 } from "@/components/v2/LandingV2";
import "@/styles/v2.css";

// Protótipo da nova landing (Fase 2). Fora do índice; a landing atual segue em "/".
export const metadata: Metadata = {
  title: "ALPHA LAUNCH — 7-Day Build",
  robots: { index: false, follow: false },
};

export default function V2() {
  return <LandingV2 />;
}
