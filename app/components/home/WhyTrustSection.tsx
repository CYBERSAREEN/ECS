"use client";
import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import { Lock, Shield, FileText, Brain } from "lucide-react";

const CARDS = [
  {
    Icon: Lock,
    title: "Security-First Approach",
    tag: "OWASP · REAL-WORLD TTPs",
    desc: "Every assessment follows industry-recognized methodologies, including OWASP standards and real-world attacker techniques — focused on exploitable vulnerabilities that pose genuine business risk.",
  },
  {
    Icon: Shield,
    title: "Human-Led Testing",
    tag: "BEYOND SCANNERS",
    desc: "Automated tools find common issues. Our researchers perform manual testing to uncover complex vulnerabilities, business-logic flaws, and attack paths scanners miss.",
  },
  {
    Icon: FileText,
    title: "Actionable Reports",
    tag: "PROOF-OF-CONCEPT",
    desc: "We explain impact, provide proof-of-concept evidence, and deliver clear remediation guidance so your team fixes issues efficiently — not just a score.",
  },
  {
    Icon: Brain,
    title: "Research-Driven Expertise",
    tag: "EMERGING THREATS",
    desc: "Our team actively studies emerging threats, exploit techniques, and modern attack vectors so every assessment reflects today's evolving landscape.",
  },
];

const cardVariants = {
  hidden: { opacity: 0, y: 40 },
  visible: { opacity: 1, y: 0 },
};

export default function WhyTrustSection() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });

  return (
    <section className="relative py-28 bg-bg overflow-hidden" ref={ref}>
      {/* Top divider glow */}
      <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center mb-16 max-w-2xl mx-auto"
        >
          <span className="font-mono text-[11px] text-accent bg-accent/10 border border-accent/20 px-3 py-1.5 rounded-full tracking-[0.18em]">
            WHY TRUST US
          </span>
          <h2 className="font-heading text-3xl md:text-5xl font-bold text-white mt-6 tracking-tight">
            We Think Like Attackers
          </h2>
          <p className="mt-4 text-white/50 text-base md:text-lg leading-relaxed">
            Beyond compliance checkboxes — so you can defend like experts.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {CARDS.map(({ Icon, title, tag, desc }, i) => (
            <motion.div
              key={title}
              variants={cardVariants}
              initial="hidden"
              animate={inView ? "visible" : "hidden"}
              transition={{ duration: 0.55, delay: i * 0.1 }}
              className="group relative bg-white/[0.03] border border-white/10 rounded-2xl p-7 hover:border-accent/40 hover:bg-white/[0.05] hover:shadow-[0_0_32px_rgba(239,35,60,0.1)] transition-all duration-300 overflow-hidden"
            >
              <div className="absolute top-0 left-0 right-0 h-px bg-accent scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left" />

              <div className="p-3 bg-accent/10 w-fit rounded-xl mb-6 group-hover:bg-accent/20 transition-colors duration-300">
                <Icon size={22} className="text-accent" />
              </div>

              <span className="font-mono text-[10px] text-accent/60 tracking-[0.15em]">{tag}</span>
              <h3 className="font-heading font-bold text-white mt-2 mb-3 text-lg leading-snug">{title}</h3>
              <p className="text-sm text-white/50 leading-relaxed">{desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
