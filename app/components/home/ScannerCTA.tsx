"use client";
import { useRef } from "react";
import { motion, useInView } from "framer-motion";
import Link from "next/link";
import { Shield, ArrowRight } from "lucide-react";

export default function ScannerCTA() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });

  return (
    <section className="relative py-28 bg-surface/30 overflow-hidden" ref={ref}>
      <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />

      <div className="relative max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="relative rounded-3xl border border-accent/20 overflow-hidden"
          style={{ background: "linear-gradient(135deg, #0f172a 0%, #1e293b 100%)" }}
        >
          {/* Grid */}
          <div className="absolute inset-0 pointer-events-none opacity-[0.06]">
            <svg width="100%" height="100%">
              <defs>
                <pattern id="scan-grid" width="40" height="40" patternUnits="userSpaceOnUse">
                  <path d="M 20 0 L 20 40 M 0 20 L 40 20" fill="none" stroke="#38bdf8" strokeWidth="0.5" opacity="0.5" />
                </pattern>
              </defs>
              <rect width="100%" height="100%" fill="url(#scan-grid)" />
            </svg>
          </div>
          {/* Glow */}
          <div className="absolute -top-20 left-1/2 -translate-x-1/2 w-96 h-40 pointer-events-none"
               style={{ background: "radial-gradient(circle, rgba(56,189,248,0.2) 0%, transparent 70%)", filter: "blur(40px)" }} />

          <div className="relative px-6 sm:px-12 py-16 text-center">
            <div className="inline-flex items-center gap-2 bg-accent/15 border border-accent/30 text-accent text-xs font-mono font-semibold px-4 py-1.5 rounded-full mb-7 tracking-wider">
              <Shield size={13} /> FREE SECURITY SCAN
            </div>
            <h2 className="font-heading text-3xl md:text-5xl font-bold text-white leading-tight tracking-tight">
              Is Your Website Secure?
            </h2>
            <p className="mt-5 text-white/55 text-base md:text-lg max-w-xl mx-auto leading-relaxed">
              Get a quick AI-driven vulnerability scan of your web application.
              No signup required. Report in your inbox within the hour.
            </p>
            <div className="mt-9 flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/scan"
                className="group inline-flex items-center justify-center gap-2 bg-accent text-[#020617] font-bold px-8 py-4 rounded-xl text-base hover:shadow-[0_0_32px_rgba(56,189,248,0.5)] transition-all duration-300"
              >
                I&apos;m Secured?
                <ArrowRight size={17} className="group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link
                href="/contact"
                className="inline-flex items-center justify-center border border-white/20 text-white font-semibold px-8 py-4 rounded-xl text-base hover:border-accent/50 hover:bg-white/5 transition-all duration-300"
              >
                Book Full Assessment
              </Link>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
