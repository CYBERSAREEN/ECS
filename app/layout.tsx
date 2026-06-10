import type { Metadata } from "next";
import { Inter, Space_Grotesk } from "next/font/google";
import "./globals.css";
import Navbar from "./components/layout/Navbar";
import Footer from "./components/layout/Footer";
import WhatsAppBadge from "./components/layout/WhatsAppBadge";
import Loader from "./components/Loader";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const spaceGrotesk = Space_Grotesk({
  variable: "--font-space-grotesk",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Excelon Cyber Solutions | Cybersecurity & Web Development",
    template: "%s | Excelon Cyber Solutions",
  },
  description:
    "Premium cybersecurity services — penetration testing, WAPT, AI-driven security, and web development from Ludhiana, India. Protecting your digital future.",
  keywords: [
    "cybersecurity", "penetration testing", "WAPT", "web application security",
    "red teaming", "AI security", "LLM security", "DevSecOps", "bug bounty",
    "web development", "startup consultancy", "Ludhiana", "India", "PenBox DMAS",
  ],
  openGraph: {
    title: "Excelon Cyber Solutions — Offensive Security Platform",
    description:
      "AI-driven cybersecurity services and secure-by-design web development. Protecting enterprises and startups across India.",
    images: ["/brand/linkedin-banner-1584x396.png"],
    locale: "en_IN",
    type: "website",
  },
  robots: { index: true, follow: true },
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL || "https://excelong.in"
  ),
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${inter.variable} ${spaceGrotesk.variable}`}>
      <body className="bg-bg text-ink antialiased">
        <Loader />
        <Navbar />
        <main>{children}</main>
        <Footer />
        <WhatsAppBadge />
      </body>
    </html>
  );
}
