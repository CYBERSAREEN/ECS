"use client";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { Mail, MapPin, MessageCircle, ArrowUpRight } from "lucide-react";

export default function Footer() {
  const pathname = usePathname();
  if (pathname?.startsWith("/vadmin-db7180")) return null;

  return (
    <footer className="relative bg-surface border-t border-white/10">
      {/* Ambient glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-96 h-32 pointer-events-none opacity-20"
           style={{ background: "radial-gradient(circle, rgba(239,35,60,0.15) 0%, transparent 70%)", filter: "blur(40px)" }} />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 grid grid-cols-1 md:grid-cols-3 gap-12">
        {/* Brand */}
        <div>
          <div className="flex items-center gap-2.5 mb-5">
            <Image src="/brand/icon-dark-64px.png" alt="ECS" width={32} height={32} className="h-8 w-auto" />
            <span className="font-heading font-bold text-white tracking-tight">
              EXCELON<span className="text-accent">CS</span>
            </span>
          </div>
          <p className="text-sm leading-relaxed text-white/45 max-w-xs italic">
            &ldquo;AI is Powerful but will always be inferior to Man&apos;s pride&rdquo;
          </p>
          <p className="text-xs text-white/30 mt-5 font-mono">
            CIN: U72200PB2012PTC036199
          </p>
        </div>

        {/* Links */}
        <div>
          <h4 className="text-white font-semibold mb-5 font-heading text-sm tracking-wide">Quick Links</h4>
          <ul className="space-y-3 text-sm">
            {[
              { href: "/", label: "Home" },
              { href: "/services", label: "Services" },
              { href: "/projects", label: "Projects" },
              { href: "/about", label: "About" },
              { href: "/ideas", label: "Ideas & Patents" },
              { href: "/contact", label: "Contact" },
              { href: "/scan", label: "Free Security Scan" },
            ].map(({ href, label }) => (
              <li key={href}>
                <Link href={href} className="text-white/50 hover:text-accent transition-colors inline-flex items-center gap-1 group">
                  {label}
                  <ArrowUpRight size={12} className="opacity-0 group-hover:opacity-100 transition-opacity" />
                </Link>
              </li>
            ))}
          </ul>
        </div>

        {/* Contact */}
        <div>
          <h4 className="text-white font-semibold mb-5 font-heading text-sm tracking-wide">Get In Touch</h4>
          <ul className="space-y-4 text-sm">
            <li className="flex items-center gap-3">
              <div className="p-1.5 bg-accent/10 rounded-lg shrink-0"><Mail size={14} className="text-accent" /></div>
              <a href="mailto:securecybernetics@gmail.com" className="text-white/50 hover:text-accent transition-colors break-all">
                securecybernetics@gmail.com
              </a>
            </li>
            <li className="flex items-center gap-3">
              <div className="p-1.5 bg-accent/10 rounded-lg shrink-0"><MessageCircle size={14} className="text-accent" /></div>
              <a
                href="https://wa.me/917087603933?text=Hi%2C%20I%27d%20like%20to%20learn%20more%20about%20your%20services."
                target="_blank" rel="noopener noreferrer"
                className="text-white/50 hover:text-accent transition-colors"
              >
                +91 70876 03933
              </a>
            </li>
            <li className="flex items-center gap-3">
              <div className="p-1.5 bg-accent/10 rounded-lg shrink-0"><MapPin size={14} className="text-accent" /></div>
              <span className="text-white/50">Ludhiana, Punjab, India</span>
            </li>
          </ul>
        </div>
      </div>

      <div className="relative border-t border-white/10 py-5 text-center text-xs text-white/30">
        © {new Date().getFullYear()} EXCELON CYBER SOLUTIONS PRIVATE LIMITED. All rights reserved.
      </div>
    </footer>
  );
}
