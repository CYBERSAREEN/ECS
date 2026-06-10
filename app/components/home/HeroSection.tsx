"use client";
import { useEffect, useState, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion, useInView } from "framer-motion";
import { ChevronDown, ArrowRight } from "lucide-react";

const QUOTES = [
  "The only secure computer is one that's unplugged. Ours isn't.",
  "Security is not a product, but a process — and we never stop shipping.",
  "In God we trust. All others we pentest.",
  "Hackers don't take holidays. Neither does our monitoring.",
  "sudo make me secure — and we actually can.",
];

const STATS = [
  { label: "Detection Accuracy", value: 96, suffix: "%" },
  { label: "Latency Reduction", value: 75, suffix: "%" },
  { label: "Faster Convergence", value: 83, suffix: "%" },
];

function Counter({ value, suffix }: { value: number; suffix: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true });
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!inView) return;
    let start = 0;
    const step = Math.ceil(value / 60);
    const interval = setInterval(() => {
      start += step;
      if (start >= value) { setCount(value); clearInterval(interval); }
      else setCount(start);
    }, 18);
    return () => clearInterval(interval);
  }, [inView, value]);

  return <span ref={ref}>{count}{suffix}</span>;
}

function TypewriterCycle() {
  const [idx, setIdx] = useState(0);
  const [displayed, setDisplayed] = useState("");
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    const target = QUOTES[idx];
    let t: ReturnType<typeof setTimeout>;
    if (!deleting && displayed.length < target.length) {
      t = setTimeout(() => setDisplayed(target.slice(0, displayed.length + 1)), 45);
    } else if (!deleting && displayed.length === target.length) {
      t = setTimeout(() => setDeleting(true), 2400);
    } else if (deleting && displayed.length > 0) {
      t = setTimeout(() => setDisplayed(displayed.slice(0, -1)), 22);
    } else {
      setDeleting(false);
      setIdx((i) => (i + 1) % QUOTES.length);
    }
    return () => clearTimeout(t);
  }, [displayed, deleting, idx]);

  return (
    <div className="font-mono text-xs sm:text-sm text-white/45 min-h-[2.5rem] flex items-center justify-center gap-1 flex-wrap">
      <span className="text-accent/70 select-none">&gt;</span>
      <span>&ldquo;{displayed}</span>
      <span className="cursor-blink text-accent font-bold">█</span>
      <span>&rdquo;</span>
    </div>
  );
}

export default function HeroSection() {
  return (
    <section className="relative min-h-screen flex items-center justify-center pt-20 overflow-hidden bg-bg">
      {/* Fine grid */}
      <div className="absolute inset-0 pointer-events-none">
        <svg width="100%" height="100%">
          <defs>
            <pattern id="hero-grid" width="56" height="56" patternUnits="userSpaceOnUse">
              <path d="M 56 0 L 0 0 0 56" fill="none" stroke="#e5e5e5" strokeWidth="0.5" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#hero-grid)" opacity="0.04" />
        </svg>
      </div>

      {/* Top ambient glow */}
      <div className="absolute inset-x-0 top-0 h-[60vh] pointer-events-none ambient-glow" />

      {/* Radial vignette at bottom */}
      <div className="absolute inset-x-0 bottom-0 h-64 pointer-events-none"
           style={{ background: "linear-gradient(to top, #000000, transparent)" }} />

      <div className="relative max-w-4xl mx-auto px-4 sm:px-6 w-full py-16 text-center">

        {/* Floating logo with orbit rings */}
        <motion.div
          initial={{ opacity: 0, scale: 0.6 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.9, ease: "easeOut" }}
          className="relative flex items-center justify-center mb-10"
        >
          {/* Orbit ring */}
          <motion.div
            className="absolute rounded-full border border-accent/25"
            style={{ width: 200, height: 200 }}
            animate={{ rotate: 360 }}
            transition={{ duration: 28, repeat: Infinity, ease: "linear" }}
          >
            {[0, 120, 240].map((deg) => (
              <div
                key={deg}
                className="absolute w-1.5 h-1.5 rounded-full bg-accent"
                style={{
                  top: "50%", left: "50%",
                  transform: `rotate(${deg}deg) translateX(99px) translateY(-3px)`,
                  boxShadow: "0 0 8px rgba(252,163,17,0.8)",
                }}
              />
            ))}
          </motion.div>
          {/* Outer ring */}
          <motion.div
            className="absolute rounded-full border border-white/5"
            style={{ width: 260, height: 260 }}
            animate={{ rotate: -360 }}
            transition={{ duration: 45, repeat: Infinity, ease: "linear" }}
          />
          {/* Glow */}
          <div className="absolute rounded-full"
               style={{ width: 180, height: 180, background: "radial-gradient(circle, rgba(252,163,17,0.18) 0%, transparent 70%)" }} />
          {/* Logo */}
          <motion.div
            animate={{ y: [0, -10, 0] }}
            transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
            className="relative z-10"
          >
            <Image
              src="/brand/icon-dark-256px.png"
              alt="Excelon Cyber Solutions"
              width={120}
              height={120}
              priority
              className="drop-shadow-[0_0_30px_rgba(252,163,17,0.35)] select-none"
            />
          </motion.div>
        </motion.div>

        {/* Badge */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25, duration: 0.5 }}
          className="inline-flex items-center gap-2 bg-white/5 border border-white/10 rounded-full px-4 py-1.5 mb-7"
        >
          <span className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse shrink-0" />
          <span className="font-mono text-[11px] text-white/55 tracking-[0.18em]">SECURE · INNOVATE · PROTECT</span>
        </motion.div>

        {/* Headline */}
        <motion.h1
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35, duration: 0.6 }}
          className="font-heading font-black text-white leading-[1.05] tracking-tight"
          style={{ fontSize: "clamp(2.25rem, 6vw, 4.5rem)" }}
        >
          EXCELON CYBER
          <span className="block text-gradient drop-shadow-[0_0_20px_rgba(252,163,17,0.3)]">
            SOLUTIONS
          </span>
        </motion.h1>

        {/* Subtitle */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.45, duration: 0.6 }}
          className="mt-5 text-white/55 text-base sm:text-lg max-w-2xl mx-auto leading-relaxed"
        >
          Offensive security, secure-by-design engineering, and AI-driven defense —
          protecting enterprises and startups across India.
        </motion.p>

        {/* Typewriter */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6, duration: 0.6 }}
          className="mt-6"
        >
          <TypewriterCycle />
        </motion.div>

        {/* CTAs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7, duration: 0.6 }}
          className="mt-8 flex flex-wrap gap-3 justify-center"
        >
          <Link
            href="/services"
            className="group inline-flex items-center gap-2 bg-accent text-black font-bold px-7 py-3.5 rounded-xl hover:shadow-[0_0_28px_rgba(252,163,17,0.45)] transition-all duration-300"
          >
            Explore Our Services
            <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
          </Link>
          <Link
            href="/contact"
            className="inline-flex items-center gap-2 border border-white/15 text-white font-semibold px-7 py-3.5 rounded-xl hover:border-accent/50 hover:bg-white/5 transition-all duration-300"
          >
            Book a Service
          </Link>
        </motion.div>

        {/* Stats row */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.85, duration: 0.6 }}
          className="mt-16 grid grid-cols-3 gap-4 sm:gap-8 max-w-2xl mx-auto"
        >
          {STATS.map((s) => (
            <div key={s.label} className="flex flex-col items-center">
              <div className="font-heading font-black text-white tabular-nums leading-none"
                   style={{ fontSize: "clamp(1.75rem, 5vw, 3rem)" }}>
                <Counter value={s.value} suffix={s.suffix} />
              </div>
              <div className="h-px w-8 bg-accent/60 my-2.5" />
              <span className="text-[10px] sm:text-xs font-mono text-white/40 uppercase tracking-wider text-center">
                {s.label}
              </span>
            </div>
          ))}
        </motion.div>
      </div>

      {/* Scroll indicator */}
      <div className="absolute bottom-7 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 text-white/30">
        <span className="font-mono text-[10px] tracking-[0.2em] uppercase">Scroll</span>
        <ChevronDown size={16} className="bounce-down" />
      </div>
    </section>
  );
}
