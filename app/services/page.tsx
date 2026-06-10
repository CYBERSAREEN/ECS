"use client";
import { motion } from "framer-motion";
import Link from "next/link";
import { Globe, Shield, ArrowRight, Package } from "lucide-react";
import PageHeader from "../components/layout/PageHeader";

const WEB_SERVICES = [
  "E-Commerce Website", "Jewelry Website", "Portfolio Website", "Service Website",
  "Business Website", "School Website", "Blog Website", "News Portal",
  "Job Portals", "Multi-Vendor Website", "Salon / Gym / Spa Website",
  "Real Estate Website", "Handbags / Wallet Website", "Clothing Website",
  "Electronic Appliances Website", "Old Laptops Selling Website",
];

const SECURITY_SERVICES = [
  "Web Application Penetration Testing", "API Security Testing",
  "Vulnerability Assessment", "OWASP Top 10 Security Testing",
  "Authentication & Authorization Testing", "Source Code Security Review",
  "Secure Code Review", "Black Box Penetration Testing",
  "Grey Box Penetration Testing", "White Box Penetration Testing",
  "DevSecOps Security Review", "CI/CD Pipeline Security Assessment",
  "Bug Bounty Program Assistance", "Phishing Simulation Campaigns",
  "Security Awareness Training", "Security Consulting",
  "Cyber Risk Assessment", "Startup Security Audits",
  "E-Commerce Security Testing", "CMS Security Testing (WordPress, Shopify, Drupal)",
  "AI Application Security Testing", "LLM & Agent Security Assessment",
];

const fade = { hidden: { opacity: 0, y: 24 }, visible: { opacity: 1, y: 0 } };

function ServiceGrid({ items }: { items: string[] }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
      {items.map((s, i) => (
        <motion.div
          key={s}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={fade}
          transition={{ duration: 0.4, delay: (i % 8) * 0.05 }}
          className="group bg-white/[0.03] border border-white/10 rounded-xl p-4 hover:border-accent/40 hover:bg-white/[0.05] transition-all duration-300"
        >
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-accent/60 group-hover:bg-accent transition-colors shrink-0" />
            <p className="text-sm font-medium text-white/75 group-hover:text-white transition-colors">{s}</p>
          </div>
        </motion.div>
      ))}
    </div>
  );
}

function BundleCTA({ text }: { text: string }) {
  return (
    <div className="mt-10 flex justify-center">
      <Link
        href="/contact"
        className="group inline-flex items-center gap-2 border border-accent/40 text-accent font-semibold px-6 py-3 rounded-xl hover:bg-accent hover:text-black transition-all duration-300"
      >
        <Package size={16} /> {text}
        <ArrowRight size={15} className="group-hover:translate-x-1 transition-transform" />
      </Link>
    </div>
  );
}

export default function ServicesPage() {
  return (
    <div className="bg-bg">
      <PageHeader
        eyebrow="WHAT WE DO"
        title="Our Services"
        subtitle="Secure by design. Built to scale. From full-stack web development to deep offensive security."
      />

      {/* Web Dev */}
      <section className="py-20 bg-surface/30 border-t border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fade} transition={{ duration: 0.6 }} className="mb-10 text-center max-w-2xl mx-auto">
            <div className="inline-flex items-center gap-2 p-2.5 bg-accent/10 rounded-xl mb-4">
              <Globe size={22} className="text-accent" />
            </div>
            <h2 className="font-heading text-2xl md:text-3xl font-bold text-white">Web Development</h2>
            <p className="text-white/50 mt-3">Secure-by-design. Scalable from day one. No vibe-coded vulnerabilities.</p>
          </motion.div>
          <ServiceGrid items={WEB_SERVICES} />
          <BundleCTA text="Want a bundle? Contact us" />
        </div>
      </section>

      {/* Security */}
      <section className="py-20 bg-bg border-t border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fade} transition={{ duration: 0.6 }} className="mb-10 text-center max-w-2xl mx-auto">
            <div className="inline-flex items-center gap-2 p-2.5 bg-accent/10 rounded-xl mb-4">
              <Shield size={22} className="text-accent" />
            </div>
            <h2 className="font-heading text-2xl md:text-3xl font-bold text-white">Security &amp; WAPT</h2>
            <p className="text-white/50 mt-3">Offensive testing across the full stack — web, API, cloud, AI, and beyond.</p>
          </motion.div>
          <ServiceGrid items={SECURITY_SERVICES} />
          <BundleCTA text="Want a bundle? Contact us" />
        </div>
      </section>
    </div>
  );
}
