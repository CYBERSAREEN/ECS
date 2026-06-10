"use client";
import { useRef } from "react";
import { motion, useInView } from "framer-motion";
import Link from "next/link";
import { ArrowRight, Zap, TrendingUp, Award, Clock } from "lucide-react";

const PILLARS = [
  { Icon: Zap, stat: "96%", label: "Detection Accuracy", sub: "Real attackers, real results" },
  { Icon: TrendingUp, stat: "3×", label: "Faster Remediation", sub: "Clear, prioritised fixes" },
  { Icon: Award, stat: "4+", label: "Years of Research", sub: "Deep-tech expertise" },
  { Icon: Clock, stat: "1hr", label: "Avg. Report Time", sub: "Speed without compromise" },
];

export default function WhyECSSection() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });

  return (
    <section className="relative py-28 pb-36 bg-bg overflow-hidden" ref={ref}>
      <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />

      {/* Ambient glow */}
      <div className="absolute bottom-0 left-1/4 w-96 h-48 pointer-events-none opacity-20"
           style={{ background: "radial-gradient(circle, rgba(56,189,248,0.15) 0%, transparent 70%)", filter: "blur(50px)" }} />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-14 items-center">
          {/* Left: copy */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.7 }}
            className="space-y-7"
          >
            <span className="font-mono text-[11px] text-accent bg-accent/10 border border-accent/20 px-3 py-1.5 rounded-full tracking-[0.18em]">
              WHY CHOOSE ECS
            </span>
            <h2 className="font-heading text-3xl md:text-5xl font-bold text-white leading-[1.1] tracking-tight">
              Security Isn&apos;t a Feature.
              <span className="block text-gradient">It&apos;s the Foundation.</span>
            </h2>
            <div className="space-y-4 text-white/55 text-[15px] leading-relaxed">
              <p>
                In a world racing toward AI, the greatest vulnerability is assuming
                technology alone keeps you safe. At ECS, we sit at the intersection
                of human intelligence and machine precision — because the best
                firewall is still a trained mind.
              </p>
              <p>
                Every breach costs more than money. It costs <span className="text-white/90">trust</span>. And trust,
                once broken, is the hardest thing to rebuild. We don&apos;t sell
                security assessments — we become your long-term digital guardian.
              </p>
              <p className="font-heading font-semibold text-white">
                Partner with ECS — where every engagement is personal.
              </p>
            </div>
            <Link
              href="/about"
              className="group inline-flex items-center gap-2 border border-accent/40 text-accent font-semibold px-6 py-3 rounded-xl hover:bg-accent hover:text-[#020617] transition-all duration-300"
            >
              Know More
              <ArrowRight size={15} className="group-hover:translate-x-1 transition-transform" />
            </Link>
          </motion.div>

          {/* Right: stat pillars */}
          <div className="grid grid-cols-2 gap-4">
            {PILLARS.map(({ Icon, stat, label, sub }, i) => (
              <motion.div
                key={label}
                initial={{ opacity: 0, y: 30 }}
                animate={inView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.55, delay: 0.15 + i * 0.1 }}
                className="bg-white/[0.03] border border-white/10 rounded-2xl p-6 hover:border-accent/30 hover:bg-white/[0.05] transition-all duration-300"
              >
                <div className="p-2.5 bg-accent/10 rounded-lg w-fit mb-5">
                  <Icon size={18} className="text-accent" />
                </div>
                <div className="font-heading font-black text-3xl text-white mb-1.5">{stat}</div>
                <div className="text-xs font-semibold text-white/75 mb-0.5">{label}</div>
                <div className="text-[11px] text-white/40 font-mono">{sub}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
