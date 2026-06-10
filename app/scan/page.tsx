"use client";
import { useState } from "react";
import { motion } from "framer-motion";
import { Shield, CheckCircle, Globe, Lock, Mail, Server, Link as LinkIcon, MailCheck } from "lucide-react";
import Link from "next/link";
import PageHeader from "../components/layout/PageHeader";

const HOW_IT_WORKS = [
  { n: "1", title: "Verify Ownership", desc: "Prove the domain is yours via a DNS record, an HTML meta tag, or an uploaded file. No account, no password." },
  { n: "2", title: "AI-Driven Assessment", desc: "An autonomous engine inspects your site the way an attacker would — safely. Non-intrusive and non-disruptive." },
  { n: "3", title: "Intelligent Enrichment", desc: "Findings become an executive summary, attack paths, compliance mapping, and step-by-step remediation." },
  { n: "4", title: "Report Delivered", desc: "Most scans finish within an hour — your report appears on screen and lands in your inbox as a shareable PDF." },
];

const COVERAGE = [
  { Icon: Globe, title: "Web App Flaws", desc: "Injection, broken access control, and other OWASP Top 10 risks." },
  { Icon: Lock, title: "Security Misconfigurations", desc: "Missing headers, weak TLS/SSL, and exposed admin surfaces." },
  { Icon: Server, title: "Exposed Services", desc: "Open ports and services that widen your attack surface." },
  { Icon: Mail, title: "Email & DNS Hygiene", desc: "SPF, DKIM, and DMARC gaps that enable spoofing." },
  { Icon: LinkIcon, title: "Attack-Path Analysis", desc: "How individual weaknesses chain into a real-world breach." },
  { Icon: CheckCircle, title: "Compliance Mapping", desc: "Findings aligned to recognised security control frameworks." },
];

const fade = { hidden: { opacity: 0, y: 24 }, visible: { opacity: 1, y: 0 } };

export default function ScanPage() {
  const [form, setForm] = useState({ email: "", url: "", method: "dns", agreed: false });
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.agreed) return;
    setLoading(true);
    try {
      await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001"}/api/scan/request`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: form.email, website_url: form.url, verification_method: form.method }),
      });
    } catch { /* ok in dev */ }
    setLoading(false);
    setDone(true);
  };

  const inputCls = "w-full border border-white/10 rounded-lg px-4 py-3 text-sm text-white bg-white/[0.04] placeholder-white/25 focus:outline-none focus:border-accent/50 focus:ring-1 focus:ring-accent/30 transition-all";

  return (
    <div className="bg-bg">
      <PageHeader
        eyebrow="FREE VULNERABILITY SCAN"
        title="QuickScan"
        subtitle="Test your website security — no account needed. Enter your email and URL, we verify ownership, scan, and email you the report."
      />

      {/* Form */}
      <section className="py-12 border-t border-white/10">
        <div className="max-w-2xl mx-auto px-4 sm:px-6">
          {done ? (
            <div className="bg-white/[0.03] border border-accent/30 rounded-2xl text-center py-14">
              <div className="p-3 bg-accent/10 rounded-2xl w-fit mx-auto mb-4"><MailCheck size={30} className="text-accent" /></div>
              <h3 className="font-heading text-2xl font-bold text-white">Scan Request Received!</h3>
              <p className="text-white/50 mt-2">We&apos;ll email your security report within 1 hour.</p>
            </div>
          ) : (
            <motion.form initial="hidden" animate="visible" variants={fade} transition={{ duration: 0.6 }} onSubmit={handleSubmit} className="bg-white/[0.03] border border-white/10 rounded-2xl p-8 space-y-5">
              <div>
                <label htmlFor="scan-email" className="block text-sm font-medium text-white/70 mb-1.5">Work Email *</label>
                <input id="scan-email" type="email" required placeholder="must match the domain you're scanning" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} className={inputCls} />
              </div>
              <div>
                <label htmlFor="scan-url" className="block text-sm font-medium text-white/70 mb-1.5">Website URL *</label>
                <input id="scan-url" type="url" required placeholder="https://example.com" value={form.url} onChange={e => setForm({ ...form, url: e.target.value })} className={inputCls} />
              </div>
              <div>
                <p className="text-sm font-medium text-white/70 mb-2">Verification Method *</p>
                <div className="space-y-2">
                  {[
                    { val: "dns", label: "DNS TXT Record", desc: "Add a TXT record to your DNS" },
                    { val: "html", label: "HTML Meta Tag", desc: "We give you a meta tag to paste in your page" },
                    { val: "file", label: "File Download & Upload", desc: "We give you a file to upload to your server" },
                  ].map(({ val, label, desc }) => (
                    <label key={val} className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${form.method === val ? "border-accent/60 bg-accent/5" : "border-white/10 bg-white/[0.02] hover:border-accent/30"}`}>
                      <input type="radio" name="method" value={val} checked={form.method === val} onChange={() => setForm({ ...form, method: val })} className="accent-accent" />
                      <div>
                        <p className="text-sm font-medium text-white">{label}</p>
                        <p className="text-xs text-white/45">{desc}</p>
                      </div>
                    </label>
                  ))}
                </div>
              </div>
              <label className="flex items-start gap-3 cursor-pointer">
                <input type="checkbox" checked={form.agreed} onChange={e => setForm({ ...form, agreed: e.target.checked })} className="mt-0.5 accent-accent shrink-0" required />
                <p className="text-xs text-white/50 leading-relaxed">
                  I agree that QuickScan can use my email to send the scan report and verify domain ownership.
                  My data is automatically deleted within 6 days.
                </p>
              </label>
              <button type="submit" disabled={loading || !form.agreed}
                className="w-full bg-accent text-bg font-bold py-4 rounded-xl text-base hover:shadow-[0_0_28px_rgba(8,255,200,0.45)] transition-all disabled:opacity-50 flex items-center justify-center gap-2">
                <Shield size={18} /> {loading ? "Submitting..." : "Start Scan"}
              </button>
            </motion.form>
          )}
        </div>
      </section>

      {/* How it works */}
      <section className="py-20 bg-surface/30 border-t border-white/10">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <h2 className="font-heading text-3xl md:text-4xl font-bold text-white text-center mb-14 tracking-tight">How It Works</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {HOW_IT_WORKS.map((s, i) => (
              <motion.div key={s.n} initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fade} transition={{ duration: 0.5, delay: i * 0.1 }}
                className="bg-white/[0.03] border border-white/10 rounded-2xl p-6 hover:border-accent/30 transition-all">
                <div className="w-10 h-10 rounded-xl bg-accent/10 text-accent font-heading font-bold flex items-center justify-center mb-5">{s.n}</div>
                <h3 className="font-heading font-bold text-white mb-2">{s.title}</h3>
                <p className="text-sm text-white/50 leading-relaxed">{s.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Coverage */}
      <section className="py-20 border-t border-white/10">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <h2 className="font-heading text-3xl md:text-4xl font-bold text-white text-center mb-14 tracking-tight">What QuickScan Checks</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {COVERAGE.map(({ Icon, title, desc }, i) => (
              <motion.div key={title} initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fade} transition={{ duration: 0.5, delay: i * 0.08 }}
                className="flex gap-4 p-5 bg-white/[0.03] border border-white/10 rounded-xl hover:border-accent/30 transition-all">
                <div className="shrink-0 p-2.5 bg-accent/10 rounded-lg h-fit"><Icon size={18} className="text-accent" /></div>
                <div>
                  <h3 className="font-heading font-semibold text-white text-sm mb-1">{title}</h3>
                  <p className="text-xs text-white/50 leading-relaxed">{desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Bottom CTA */}
      <section className="py-20 pb-28 bg-surface/30 border-t border-white/10 text-center">
        <div className="max-w-2xl mx-auto px-4">
          <p className="text-white/50 text-sm">
            <strong className="text-white/80">Good to know:</strong> QuickScan assesses your public-facing website only. It cannot reach pages behind a login, content blocked by a firewall or WAF, or a site offline during the scan.
          </p>
          <p className="text-white/50 text-sm mt-5 mb-7">
            This free scan shows a selection of your findings. A full engagement adds deep manual pen-testing, exploitation proof, and a complete prioritised remediation plan.
          </p>
          <Link href="/contact" className="inline-block bg-accent text-bg font-bold px-8 py-4 rounded-xl hover:shadow-[0_0_28px_rgba(8,255,200,0.45)] transition-all">
            Ready for the Full Assessment? →
          </Link>
        </div>
      </section>
    </div>
  );
}
