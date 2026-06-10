"use client";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Download, ChevronDown, CheckCircle, Lightbulb } from "lucide-react";
import PageHeader from "../components/layout/PageHeader";

const fade = { hidden: { opacity: 0, y: 24 }, visible: { opacity: 1, y: 0 } };

const PATENT = {
  appNo: "2342352151",
  status: "Approved",
  title: "PENBOX-DMAS: A DISTRIBUTED MULTI-AGENT SECURITY APPLIANCE FOR AUTONOMOUS VULNERABILITY ASSESSMENT AND REMEDIATION AT THE EDGE",
  date: "29-APR-2026",
  refNo: "UTI4236",
  code: "UPTRAYAMBAK260519-4236",
  sdg: "Industry, Innovation, and Infrastructure",
  inventors: [
    { name: "Vedant Sareen", designation: "Student", dept: "Computer Science & Engineering", email: "vedant1318.be23@chitkara.edu.in" },
    { name: "Dr. Himanshi Babbar", designation: "Assistant Professor", dept: "Computer Science & Engineering", email: "himanshi.babbar@chitkara.edu.in" },
  ],
};

function PatentCard() {
  const [open, setOpen] = useState(false);
  return (
    <div className={`bg-white/[0.03] border rounded-2xl overflow-hidden transition-all duration-300 ${open ? "border-accent/50 shadow-[0_0_28px_rgba(8,255,200,0.15)]" : "border-white/10 hover:border-accent/30"}`}>
      <button className="w-full text-left p-6 sm:p-8" onClick={() => setOpen((o) => !o)}>
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <div className="flex flex-wrap items-center gap-2 mb-3">
              <span className="inline-flex items-center gap-1.5 text-xs bg-accent/15 text-accent font-semibold px-3 py-1 rounded-full">
                <CheckCircle size={12} /> {PATENT.status}
              </span>
              <span className="text-xs text-white/35 font-mono">App #{PATENT.appNo}</span>
            </div>
            <h3 className="font-heading font-bold text-white text-lg leading-snug">{PATENT.title}</h3>
            <p className="text-sm text-white/40 mt-2 font-mono">Date: {PATENT.date} · Ref: {PATENT.refNo}</p>
          </div>
          <ChevronDown size={20} className={`text-white/30 shrink-0 mt-1 transition-transform ${open ? "rotate-180" : ""}`} />
        </div>
      </button>

      <AnimatePresence>
        {open && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.3 }} className="overflow-hidden">
            <div className="px-6 sm:px-8 pb-8 border-t border-white/10 pt-6 space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                <div><span className="text-white/35 text-xs font-mono">PATENT CODE</span><p className="text-white/85 font-medium mt-1">{PATENT.code}</p></div>
                <div><span className="text-white/35 text-xs font-mono">SDG ALIGNMENT</span><p className="text-white/85 font-medium mt-1">{PATENT.sdg}</p></div>
              </div>
              <div>
                <span className="text-white/35 text-xs font-mono">INVENTORS</span>
                <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {PATENT.inventors.map((inv) => (
                    <div key={inv.name} className="bg-white/[0.04] border border-white/10 rounded-xl p-4 text-sm">
                      <p className="font-semibold text-white">{inv.name}</p>
                      <p className="text-white/50 text-xs mt-0.5">{inv.designation} · {inv.dept}</p>
                      <p className="text-white/40 text-xs mt-1 break-all">{inv.email}</p>
                    </div>
                  ))}
                </div>
              </div>
              <a href="/patents/penbox-dmas.pdf" download
                className="inline-flex items-center gap-2 bg-accent text-bg font-bold px-5 py-2.5 rounded-lg hover:shadow-[0_0_20px_rgba(8,255,200,0.4)] transition-all text-sm">
                <Download size={15} /> Download Patent PDF
              </a>
              <p className="text-xs text-white/25 font-mono">[Upload PDF to /public/patents/penbox-dmas.pdf to enable download]</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function SubmitForm() {
  const [form, setForm] = useState({ name: "", organization: "", title: "" });
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001"}/api/patents/submit`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ submitter_name: form.name, organization: form.organization, patent_title: form.title }),
      });
    } catch { /* backend optional in dev */ }
    finally { setLoading(false); setSubmitted(true); }
  };

  if (submitted) return (
    <div className="text-center py-10">
      <div className="p-3 bg-accent/10 rounded-2xl w-fit mx-auto mb-4"><Lightbulb size={26} className="text-accent" /></div>
      <h3 className="font-heading font-bold text-white text-xl">Idea Received!</h3>
      <p className="text-white/50 mt-2 text-sm">We&apos;ll review your patent idea within 48 hours.</p>
    </div>
  );

  const inputCls = "w-full border border-white/10 rounded-lg px-4 py-3 text-sm text-white bg-white/[0.04] placeholder-white/25 focus:outline-none focus:border-accent/50 focus:ring-1 focus:ring-accent/30 transition-all";

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {[
        { id: "name", label: "Your Name *", required: true, value: form.name, onChange: (v: string) => setForm({ ...form, name: v }) },
        { id: "org", label: "Organization / Designation", required: false, value: form.organization, onChange: (v: string) => setForm({ ...form, organization: v }) },
        { id: "title", label: "Patent Title *", required: true, value: form.title, onChange: (v: string) => setForm({ ...form, title: v }) },
      ].map(({ id, label, required, value, onChange }) => (
        <div key={id}>
          <label htmlFor={id} className="block text-sm font-medium text-white/70 mb-1.5">{label}</label>
          <input id={id} type="text" required={required} value={value} onChange={e => onChange(e.target.value)} className={inputCls} />
        </div>
      ))}
      <div>
        <label className="block text-sm font-medium text-white/70 mb-1.5">Patent Idea (PDF/DOC)</label>
        <input type="file" accept=".pdf,.doc,.docx"
          className="w-full border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white/50 bg-white/[0.04] file:mr-3 file:py-1 file:px-3 file:rounded-md file:border-0 file:bg-accent/20 file:text-accent file:text-xs file:font-medium" />
      </div>
      <button type="submit" disabled={loading}
        className="w-full bg-accent text-bg font-bold py-3 rounded-lg hover:shadow-[0_0_24px_rgba(8,255,200,0.4)] transition-all disabled:opacity-60">
        {loading ? "Submitting..." : "Submit Patent Idea"}
      </button>
    </form>
  );
}

export default function IdeasPage() {
  return (
    <div className="bg-bg">
      <PageHeader
        eyebrow="INTELLECTUAL PROPERTY"
        title="Ideas & Patents"
        subtitle="Patents driving the future of cybersecurity — and an open door for your novel ideas."
      />

      {/* Patents */}
      <section className="py-16 border-t border-white/10">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fade} transition={{ duration: 0.6 }} className="mb-8">
            <h2 className="font-heading text-2xl md:text-3xl font-bold text-white">My Patents</h2>
            <p className="text-white/50 mt-2 text-sm">Click a patent to expand full details.</p>
          </motion.div>
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fade} transition={{ duration: 0.6, delay: 0.15 }}>
            <PatentCard />
          </motion.div>
        </div>
      </section>

      {/* Submit form */}
      <section className="py-16 bg-surface/30 border-t border-white/10">
        <div className="max-w-2xl mx-auto px-4 sm:px-6">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fade} transition={{ duration: 0.6 }} className="bg-white/[0.03] border border-white/10 rounded-2xl p-8">
            <span className="font-mono text-[11px] text-accent bg-accent/10 border border-accent/20 px-3 py-1.5 rounded-full tracking-[0.18em]">OPEN INNOVATION</span>
            <h2 className="font-heading text-2xl font-bold text-white mt-4 mb-2">Have a Novel Idea?</h2>
            <p className="text-white/50 text-sm mb-6 leading-relaxed">
              If you believe your idea is patent-worthy, we can help you file it for a minimal cost of ₹500/—
              including full refinement. <strong className="text-white/80">You remain the first inventor.</strong>
            </p>
            <SubmitForm />
          </motion.div>
        </div>
      </section>
    </div>
  );
}
