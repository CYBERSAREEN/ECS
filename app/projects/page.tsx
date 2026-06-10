"use client";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { ExternalLink, Globe, ShieldCheck, CheckCircle2 } from "lucide-react";
import PageHeader from "../components/layout/PageHeader";

const fade = { hidden: { opacity: 0, y: 24 }, visible: { opacity: 1, y: 0 } };

function WebDevProjects() {
  return (
    <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fade} transition={{ duration: 0.6 }}
      className="group bg-white/[0.03] border border-white/10 rounded-2xl overflow-hidden hover:border-accent/40 transition-all duration-300">
      <div className="p-8">
        <div className="flex flex-wrap items-start justify-between gap-4 mb-5">
          <div>
            <h3 className="font-heading text-2xl font-bold text-white">THE RAW STUDIOS</h3>
            <a href="https://therawstudios.in" target="_blank" rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-accent text-sm font-medium hover:gap-2 transition-all mt-1.5">
              therawstudios.in <ExternalLink size={13} />
            </a>
          </div>
          <span className="text-xs font-mono bg-accent/10 text-accent font-semibold px-3 py-1.5 rounded-full">Delivered in 3 weeks</span>
        </div>
        <p className="text-white/55 leading-relaxed mb-6">
          Scaling an institute for music, dance, art, and craft — from local studio to global digital
          presence. Mr. Rounak&apos;s vision was clear: make The Raw Studios the digital face of their
          artistic legacy, celebrating creativity for every age group from 4 to 50+.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-7">
          {[
            "Static website with GSAP animations, responsive across all devices",
            "Admin dashboard for CRUD on courses and teachers",
            "CRM and Enquiry Dashboard with WhatsApp integration",
            "SEO-friendly with optimised pixel ad generation",
          ].map((f) => (
            <div key={f} className="flex items-start gap-2.5 text-sm text-white/60">
              <CheckCircle2 size={16} className="text-accent shrink-0 mt-0.5" />
              <span>{f}</span>
            </div>
          ))}
        </div>
        <div className="grid grid-cols-3 gap-3">
          {[1, 2, 3].map((n) => (
            <div key={n} className="aspect-video bg-white/[0.04] border border-white/10 rounded-xl flex items-center justify-center">
              <span className="text-xs text-white/25 font-mono">Screenshot {n}</span>
            </div>
          ))}
        </div>
        <p className="mt-3 text-xs text-white/25 font-mono">
          [Upload screenshots to /public/projects/images/therawstudios/]
        </p>
      </div>
    </motion.div>
  );
}

function SecurityProjects() {
  return (
    <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fade} transition={{ duration: 0.6 }}
      className="bg-white/[0.03] border border-white/10 rounded-2xl p-10 text-center">
      <div className="p-3 bg-accent/10 rounded-2xl w-fit mx-auto mb-5"><ShieldCheck size={28} className="text-accent" /></div>
      <h3 className="font-heading text-xl font-bold text-white mb-2">Confidentiality is Our Standard</h3>
      <p className="text-white/50 text-sm max-w-md mx-auto leading-relaxed">
        Security assessment case studies are available under NDA upon request.
        We respect client confidentiality as much as we protect their systems.
      </p>
      <Link href="/contact" className="mt-7 inline-block bg-accent text-bg font-bold px-6 py-3 rounded-xl hover:shadow-[0_0_24px_rgba(8,255,200,0.4)] transition-all">
        Request Case Study
      </Link>
    </motion.div>
  );
}

export default function ProjectsPage() {
  const [tab, setTab] = useState<"web" | "security">("web");

  return (
    <div className="bg-bg">
      <PageHeader
        eyebrow="PORTFOLIO"
        title="Our Projects"
        subtitle="Work we're proud of. Results that speak."
      />

      <section className="py-12 border-t border-white/10">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Tabs */}
          <div className="flex justify-center mb-12">
            <div className="inline-flex bg-white/[0.04] border border-white/10 rounded-xl p-1">
              {[
                { id: "web" as const, label: "Web Development", Icon: Globe },
                { id: "security" as const, label: "Security Research", Icon: ShieldCheck },
              ].map(({ id, label, Icon }) => (
                <button
                  key={id}
                  onClick={() => setTab(id)}
                  className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold transition-all ${
                    tab === id ? "bg-accent text-bg" : "text-white/55 hover:text-white"
                  }`}
                >
                  <Icon size={16} /> {label}
                </button>
              ))}
            </div>
          </div>

          <AnimatePresence mode="wait">
            <motion.div
              key={tab}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -16 }}
              transition={{ duration: 0.3 }}
            >
              {tab === "web" ? <WebDevProjects /> : <SecurityProjects />}
            </motion.div>
          </AnimatePresence>
        </div>
      </section>
    </div>
  );
}
