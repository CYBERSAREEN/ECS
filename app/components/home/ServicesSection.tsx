"use client";
import { useState, useRef } from "react";
import { motion, useInView, AnimatePresence } from "framer-motion";
import { Globe, Shield, Brain, Users, ChevronDown, ArrowRight } from "lucide-react";
import Link from "next/link";

const SERVICES = [
  {
    Icon: Globe,
    title: "Web Development",
    short: "Secure-by-design static & dynamic websites",
    detail:
      "Owning a business without a digital presence is leaving revenue on the table. We build scalable static and dynamic websites engineered for performance, security, and growth — no shortcuts, no vibe-coded vulnerabilities, just secure-by-design code that scales.",
    badge: null,
  },
  {
    Icon: Shield,
    title: "WAPT",
    short: "Web Application Penetration Testing",
    detail:
      "Automated scanners find yesterday's problems. Our AI-assisted WAPT generates faster, more reliable vulnerability reports with zero surface disclosure — giving you a true attacker's view with actionable, prioritised remediation.",
    badge: null,
  },
  {
    Icon: Brain,
    title: "AI-Based Cyber Tutor",
    short: "Patent-pending personalized security learning",
    detail:
      "A patent-pending AI tutor that adapts to your learning pace and teaches cybersecurity dynamically. Personalized roadmaps, real-world scenarios, zero generic curriculum — building the next generation of security professionals.",
    badge: "Coming Soon",
  },
  {
    Icon: Users,
    title: "Startup Consultancy",
    short: "CRM, dashboards & operational backbone",
    detail:
      "From CRM dashboards and lead-management systems to admin panels, attendance management, and structured courses — we help startups build the operational backbone they need to scale confidently from Day 1.",
    badge: null,
  },
];

function ServiceCard({ s, i, inView }: { s: typeof SERVICES[0]; i: number; inView: boolean }) {
  const [open, setOpen] = useState(false);
  const Icon = s.Icon;
  return (
    <motion.div
      initial={{ opacity: 0, y: 40 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.5, delay: i * 0.1 }}
      className="bg-white/[0.03] border border-white/10 rounded-2xl overflow-hidden hover:border-accent/40 hover:shadow-[0_0_28px_rgba(239,35,60,0.1)] transition-all duration-300"
    >
      <button
        className="w-full text-left p-7 flex items-start gap-5"
        onClick={() => setOpen((o) => !o)}
      >
        <div className="p-3 bg-accent/10 rounded-xl shrink-0">
          <Icon size={24} className="text-accent" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="font-heading font-bold text-white text-lg">{s.title}</h3>
            {s.badge && (
              <span className="text-[10px] font-mono bg-accent/15 text-accent font-semibold px-2 py-0.5 rounded-full tracking-wider">
                {s.badge}
              </span>
            )}
          </div>
          <p className="text-sm text-white/45 mt-1.5">{s.short}</p>
        </div>
        <ChevronDown
          size={18}
          className={`text-white/30 transition-transform shrink-0 mt-1 ${open ? "rotate-180" : ""}`}
        />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="overflow-hidden"
          >
            <div className="px-7 pb-7 pt-0 border-t border-white/10">
              <p className="text-sm text-white/55 leading-relaxed mt-5">{s.detail}</p>
              <Link
                href="/services"
                className="mt-5 inline-flex items-center gap-1.5 text-sm font-semibold text-accent hover:gap-2.5 transition-all"
              >
                View all services <ArrowRight size={14} />
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

export default function ServicesSection() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });

  return (
    <section className="relative py-28 bg-surface/30 overflow-hidden" ref={ref}>
      <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />

      <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center mb-16 max-w-2xl mx-auto"
        >
          <span className="font-mono text-[11px] text-accent bg-accent/10 border border-accent/20 px-3 py-1.5 rounded-full tracking-[0.18em]">
            WHAT WE DO
          </span>
          <h2 className="font-heading text-3xl md:text-5xl font-bold text-white mt-6 tracking-tight">
            Our Services
          </h2>
          <p className="mt-4 text-white/50 text-base md:text-lg">
            Tap any service to learn more.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {SERVICES.map((s, i) => (
            <ServiceCard key={s.title} s={s} i={i} inView={inView} />
          ))}
        </div>
      </div>
    </section>
  );
}
