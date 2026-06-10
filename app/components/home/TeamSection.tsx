"use client";
import { useRef } from "react";
import { motion, useInView } from "framer-motion";
import Image from "next/image";

const TEAM = [
  {
    name: "Vedant Sareen",
    role: "Director & CTO",
    photo: "/brand/profile-200x200.png",
    bio: "Penetration tester, web developer, AI automation engineer, Red Teamer & VAPT specialist. Ex-EY Senior Security Analyst. Patent holder for PenBox DMAS.",
  },
  {
    name: "Suneha Passi",
    role: "Senior Web Developer",
    photo: null,
    initials: "SP",
    bio: "Full-stack web designer, prompt engineer, and project team lead. Delivering pixel-perfect, accessible interfaces at scale.",
  },
  {
    name: "Hardik Garg",
    role: "Lead Cybersecurity Analyst",
    photo: null,
    initials: "HG",
    bio: "Deep expertise in red teaming, cloud security, DevSecOps, and bug bounty. Penetration tester with systemic attack-path analysis.",
  },
];

export default function TeamSection() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });

  return (
    <section className="relative py-28 bg-bg overflow-hidden" ref={ref}>
      <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />

      <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center mb-16 max-w-2xl mx-auto"
        >
          <span className="font-mono text-[11px] text-accent bg-accent/10 border border-accent/20 px-3 py-1.5 rounded-full tracking-[0.18em]">
            THE TEAM
          </span>
          <h2 className="font-heading text-3xl md:text-5xl font-bold text-white mt-6 tracking-tight">
            Meet Our Team
          </h2>
          <p className="mt-4 text-white/50 text-base md:text-lg">
            Security professionals who think like attackers, build like engineers.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {TEAM.map((m, i) => (
            <motion.div
              key={m.name}
              initial={{ opacity: 0, y: 40 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.5, delay: i * 0.12 }}
              className="group bg-white/[0.03] border border-white/10 rounded-2xl p-8 text-center hover:border-accent/40 hover:bg-white/[0.05] hover:shadow-[0_0_28px_rgba(252,163,17,0.1)] transition-all duration-300"
            >
              <div className="mx-auto mb-6 relative w-fit">
                <div className="absolute inset-0 rounded-full bg-accent/20 blur-xl scale-110 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                {m.photo ? (
                  <Image
                    src={m.photo}
                    alt={m.name}
                    width={104}
                    height={104}
                    className="relative rounded-full border-2 border-accent/40 mx-auto w-26 h-26 object-cover"
                    style={{ width: 104, height: 104 }}
                  />
                ) : (
                  <div className="relative w-26 h-26 rounded-full bg-navy flex items-center justify-center mx-auto border-2 border-accent/40"
                       style={{ width: 104, height: 104 }}>
                    <span className="text-2xl font-bold text-accent font-heading">
                      {"initials" in m ? m.initials : ""}
                    </span>
                  </div>
                )}
              </div>
              <h3 className="font-heading font-bold text-white text-xl">{m.name}</h3>
              <p className="text-accent text-sm font-semibold mt-1.5 mb-4">{m.role}</p>
              <p className="text-sm text-white/50 leading-relaxed">{m.bio}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
