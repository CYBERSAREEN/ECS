"use client";
import { usePathname } from "next/navigation";
import { MessageCircle } from "lucide-react";

const WA_URL =
  "https://wa.me/917087603933?text=Hi%2C%20I%27d%20like%20to%20learn%20more%20about%20Solutions%20you%20provide%20related%20to%20cyber%20security%20services.";

export default function WhatsAppBadge() {
  const pathname = usePathname();
  if (pathname?.startsWith("/vadmin-db7180")) return null;

  return (
    <a
      href={WA_URL}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Chat on WhatsApp"
      className="fixed bottom-5 right-5 z-50 bg-green-500 text-white p-3.5 rounded-full shadow-lg hover:scale-110 hover:shadow-xl transition-all duration-200"
    >
      <MessageCircle size={24} />
    </a>
  );
}
