"use client";
import { useState } from "react";
import { motion } from "framer-motion";
import { Mail, Phone, MapPin, MessageCircle, Send, CheckCircle2 } from "lucide-react";
import PageHeader from "../components/layout/PageHeader";

const SERVICES = [
  "Web Development", "Web Application Penetration Testing (WAPT)",
  "AI-Based Cyber Tutor", "Startup Consultancy", "Security Consulting",
  "Bug Bounty Assistance", "Other",
];

const fade = { hidden: { opacity: 0, y: 24 }, visible: { opacity: 1, y: 0 } };

export default function ContactPage() {
  const [form, setForm] = useState({ name: "", email: "", organization: "", service: "", message: "" });
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001"}/api/contact`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: form.name, email: form.email, organization: form.organization, service_required: form.service, message: form.message }),
      });
    } catch { /* backend optional in dev */ }
    const waText = encodeURIComponent(
      `HI! Just gone through your website and, I wish to enquire more about service ${form.service} please acknowledge your availability, thank you!`
    );
    window.open(`https://wa.me/917087603933?text=${waText}`, "_blank");
    setLoading(false);
    setDone(true);
  };

  const inputCls = "w-full border border-white/10 rounded-lg px-4 py-3 text-sm text-white bg-white/[0.04] placeholder-white/25 focus:outline-none focus:border-accent/50 focus:ring-1 focus:ring-accent/30 transition-all";

  return (
    <div className="bg-bg">
      <PageHeader
        eyebrow="GET IN TOUCH"
        title="Let's Talk Security"
        subtitle="Fill the form and your enquiry reaches us instantly via WhatsApp. We typically respond within 2 hours."
      />

      <section className="py-12 border-t border-white/10">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 lg:grid-cols-5 gap-10">
          {/* Contact info */}
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fade} transition={{ duration: 0.6 }} className="lg:col-span-2 space-y-4">
            {[
              { icon: <Mail size={18} className="text-accent" />, label: "Email", value: "securecybernetics@gmail.com", href: "mailto:securecybernetics@gmail.com" },
              { icon: <MessageCircle size={18} className="text-accent" />, label: "WhatsApp", value: "+91 70876 03933", href: "https://wa.me/917087603933" },
              { icon: <Phone size={18} className="text-accent" />, label: "Phone", value: "+91 70876 03933", href: "tel:+917087603933" },
              { icon: <MapPin size={18} className="text-accent" />, label: "Location", value: "Ludhiana, Punjab, India", href: null },
            ].map(({ icon, label, value, href }) => (
              <div key={label} className="flex items-center gap-4 p-4 bg-white/[0.03] border border-white/10 rounded-xl hover:border-accent/30 transition-all">
                <div className="p-2.5 bg-accent/10 rounded-lg shrink-0">{icon}</div>
                <div className="min-w-0">
                  <p className="text-xs text-white/35 font-mono">{label}</p>
                  {href ? (
                    <a href={href} target={href.startsWith("http") ? "_blank" : undefined} rel="noopener noreferrer" className="text-sm font-medium text-white hover:text-accent transition-colors break-all">{value}</a>
                  ) : (
                    <p className="text-sm font-medium text-white">{value}</p>
                  )}
                </div>
              </div>
            ))}
          </motion.div>

          {/* Form */}
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fade} transition={{ duration: 0.6, delay: 0.15 }} className="lg:col-span-3">
            {done ? (
              <div className="bg-white/[0.03] border border-accent/30 rounded-2xl p-10 text-center">
                <div className="p-3 bg-accent/10 rounded-2xl w-fit mx-auto mb-4"><CheckCircle2 size={30} className="text-accent" /></div>
                <h3 className="font-heading text-2xl font-bold text-white">Message Sent!</h3>
                <p className="text-white/50 mt-2">WhatsApp opened with your enquiry. We&apos;ll respond shortly.</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="bg-white/[0.03] border border-white/10 rounded-2xl p-8 space-y-5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  {[
                    { id: "name", label: "Your Name *", type: "text", required: true, value: form.name, onChange: (v: string) => setForm({ ...form, name: v }) },
                    { id: "email", label: "Email ID *", type: "email", required: true, value: form.email, onChange: (v: string) => setForm({ ...form, email: v }) },
                  ].map(({ id, label, type, required, value, onChange }) => (
                    <div key={id}>
                      <label htmlFor={id} className="block text-sm font-medium text-white/70 mb-1.5">{label}</label>
                      <input id={id} type={type} required={required} value={value} onChange={e => onChange(e.target.value)} className={inputCls} />
                    </div>
                  ))}
                </div>
                <div>
                  <label htmlFor="org" className="block text-sm font-medium text-white/70 mb-1.5">Organization</label>
                  <input id="org" type="text" value={form.organization} onChange={e => setForm({ ...form, organization: e.target.value })} className={inputCls} />
                </div>
                <div>
                  <label htmlFor="service" className="block text-sm font-medium text-white/70 mb-1.5">Service Required *</label>
                  <select id="service" required value={form.service} onChange={e => setForm({ ...form, service: e.target.value })}
                    className={inputCls + " appearance-none cursor-pointer"}>
                    <option value="" className="bg-surface">Select a service...</option>
                    {SERVICES.map(s => <option key={s} value={s} className="bg-surface">{s}</option>)}
                  </select>
                </div>
                <div>
                  <label htmlFor="msg" className="block text-sm font-medium text-white/70 mb-1.5">Message</label>
                  <textarea id="msg" rows={4} value={form.message} onChange={e => setForm({ ...form, message: e.target.value })} className={inputCls + " resize-none"} />
                </div>
                <button type="submit" disabled={loading}
                  className="w-full bg-accent text-bg font-bold py-3.5 rounded-lg hover:shadow-[0_0_24px_rgba(8,255,200,0.4)] transition-all flex items-center justify-center gap-2 disabled:opacity-60">
                  <Send size={16} /> {loading ? "Sending..." : "Verify & Send via WhatsApp"}
                </button>
              </form>
            )}
          </motion.div>
        </div>
      </section>
    </div>
  );
}
