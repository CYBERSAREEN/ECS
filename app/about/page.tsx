"use client";
import Image from "next/image";
import { motion } from "framer-motion";
import { Target, Telescope, Sparkles, Shield } from "lucide-react";
import PageHeader from "../components/layout/PageHeader";

const TIMELINE = [
  { year: "2012", event: "Excelon Cyber Solutions founded (CIN: U72200PB2012PTC036199)" },
  { year: "2023", event: "First enterprise WAPT engagement — zero false positives" },
  { year: "2024", event: "PenBox DMAS patent filed — distributed AI security appliance" },
  { year: "2025", event: "AI Cyber Tutor patent application submitted" },
  { year: "2026", event: "Expanding into startup consultancy & Web 4.0 security research" },
];

const fade = { hidden: { opacity: 0, y: 30 }, visible: { opacity: 1, y: 0 } };

export default function AboutPage() {
  return (
    <div className="bg-bg">
      <PageHeader
        eyebrow="ABOUT"
        title="Meet Vedant Sareen"
        subtitle="Founder & CTO — penetration tester, web developer, AI automation engineer, Red Teamer & VAPT specialist."
      />

      {/* Bio — redesigned with cinematic photo presentation */}
      <section className="py-20 border-t border-white/10 overflow-hidden">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-14 items-center">
            {/* Photo — takes 2 cols, cinematic frame */}
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={fade}
              transition={{ duration: 0.8 }}
              className="lg:col-span-2 relative flex items-center justify-center"
            >
              {/* Ambient glow behind photo */}
              <div
                className="absolute w-80 h-80 rounded-full pointer-events-none"
                style={{
                  background: "radial-gradient(circle, rgba(239,35,60,0.12) 0%, transparent 70%)",
                  filter: "blur(50px)",
                }}
              />
              {/* Decorative ring */}
              <motion.div
                className="absolute rounded-full border border-accent/15"
                style={{ width: 340, height: 340 }}
                animate={{ rotate: 360 }}
                transition={{ duration: 60, repeat: Infinity, ease: "linear" }}
              />
              <motion.div
                className="absolute rounded-full border border-white/5"
                style={{ width: 380, height: 380 }}
                animate={{ rotate: -360 }}
                transition={{ duration: 80, repeat: Infinity, ease: "linear" }}
              >
                {[0, 90, 180, 270].map((deg) => (
                  <div
                    key={deg}
                    className="absolute w-1 h-1 rounded-full bg-accent/50"
                    style={{
                      top: "50%",
                      left: "50%",
                      transform: `rotate(${deg}deg) translateX(189px) translateY(-2px)`,
                    }}
                  />
                ))}
              </motion.div>

              {/* Photo with border glow */}
              <div className="relative z-10">
                <div className="absolute -inset-1 rounded-3xl bg-gradient-to-br from-accent/30 via-accent/10 to-transparent blur-sm" />
                <Image
                  src="/brand/profile-400x400.png"
                  alt="Vedant Sareen"
                  width={300}
                  height={300}
                  className="relative rounded-3xl border border-accent/25 w-full max-w-[300px] mx-auto object-cover shadow-2xl"
                />
                {/* Floating badge */}
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.5, duration: 0.5 }}
                  className="absolute -bottom-4 -right-4 bg-surface border border-accent/30 rounded-2xl px-4 py-2.5 flex items-center gap-2 shadow-lg"
                >
                  <Shield size={16} className="text-accent" />
                  <div>
                    <p className="text-xs font-bold text-white leading-tight">Ex-EY Analyst</p>
                    <p className="text-[10px] text-white/40 font-mono">3+ yrs Security</p>
                  </div>
                </motion.div>
              </div>
            </motion.div>

            {/* Bio text — takes 3 cols */}
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={fade}
              transition={{ duration: 0.7, delay: 0.15 }}
              className="lg:col-span-3 space-y-6"
            >
              <div className="flex items-center gap-3 mb-2">
                <span className="font-mono text-[11px] font-semibold text-accent bg-accent/10 border border-accent/20 px-3 py-1.5 rounded-full tracking-[0.18em]">
                  FOUNDER &amp; CTO
                </span>
                <Sparkles size={16} className="text-accent/60" />
              </div>
              <h2 className="font-heading text-3xl md:text-4xl font-bold text-white tracking-tight">
                Your Cyber Guy
              </h2>
              <p className="text-white/60 leading-relaxed text-[15px]">
                I&apos;m a professional penetration tester, web developer, AI automation
                engineer, Red Teamer, and VAPT specialist — basically, your cyber guy
                who&apos;s keen on finding every crack in the digital armor and patching it
                before the bad actors do.
              </p>
              <p className="text-white/60 leading-relaxed text-[15px]">
                In a world where people debate whether AI makes security engineers
                obsolete, I show up to secure the AI models themselves — fine-tuning
                parameters, hardening local LLMs, and building defenses that protect
                the systems everyone else trusts blindly.
              </p>
              <p className="text-white/60 leading-relaxed text-[15px]">
                When I&apos;m AFK, I practice music — I&apos;m a judge at interuniversity
                competitions, a performer, and a music mentor with a deep appreciation
                for every art form. The same creative discipline that makes a great
                musician makes a great hacker: pattern recognition, patience, and the
                courage to try something nobody else has.
              </p>

              {/* Quick stats row */}
              <div className="flex flex-wrap gap-6 pt-4 border-t border-white/10">
                {[
                  { val: "3+", label: "Years in Security" },
                  { val: "2", label: "Patents Filed" },
                  { val: "96%", label: "Detection Rate" },
                ].map(({ val, label }) => (
                  <div key={label} className="text-center">
                    <div className="font-heading font-black text-2xl text-accent">{val}</div>
                    <div className="text-[10px] text-white/40 font-mono uppercase tracking-wider mt-0.5">{label}</div>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Mission & Vision — redesigned with large split layout and accent lines */}
      <section className="py-24 bg-surface/30 border-t border-white/10 overflow-hidden">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fade}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <span className="font-mono text-[11px] text-accent bg-accent/10 border border-accent/20 px-3 py-1.5 rounded-full tracking-[0.18em]">
              WHAT DRIVES US
            </span>
            <h2 className="font-heading text-3xl md:text-5xl font-bold text-white mt-6 tracking-tight">
              Mission & Vision
            </h2>
          </motion.div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {[
              {
                label: "My Mission",
                Icon: Target,
                headline: "Earning Trust, One Byte at a Time",
                text: "My mission is to earn your trust, carry your blessings, and secure your digital identity as if it were my own. Privacy is non-negotiable. The moment you share your data with the digital world, you are trusting someone to protect it. I take that responsibility personally — your digital identity is as real, and as vulnerable, as your physical one. I will not let anyone disrupt the flow of trust you have placed in this connected world.",
              },
              {
                label: "My Vision",
                Icon: Telescope,
                headline: "Securing Futures, Not Just Systems",
                text: "When I was a student, I had no roadmap. Nobody handed me a cybersecurity career guide — I had to carve my own path through trial, error, and obsession. That experience shapes everything I build today. By the time Web 4.0 arrives, I want every aspiring security engineer to have a personalized, AI-powered learning path that meets them exactly where they are. I want to secure environments AND futures.",
              },
            ].map(({ label, Icon, headline, text }, i) => (
              <motion.div
                key={label}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                variants={fade}
                transition={{ duration: 0.6, delay: i * 0.15 }}
                className="group relative bg-white/[0.03] border border-white/10 rounded-2xl overflow-hidden hover:border-accent/30 transition-all duration-300"
              >
                {/* Top accent bar */}
                <div className="h-1 bg-gradient-to-r from-accent/60 via-accent to-accent/60" />
                <div className="p-8 sm:p-10">
                  <div className="flex items-center gap-3 mb-5">
                    <div className="p-3 bg-accent/10 rounded-xl group-hover:bg-accent/20 transition-colors">
                      <Icon size={22} className="text-accent" />
                    </div>
                    <span className="font-mono text-[10px] text-accent/60 tracking-[0.15em] uppercase">{label}</span>
                  </div>
                  <h3 className="font-heading font-bold text-white text-2xl mb-4 leading-tight">{headline}</h3>
                  <p className="text-[15px] text-white/55 leading-relaxed">{text}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Timeline */}
      <section className="py-20 border-t border-white/10">
        <div className="max-w-3xl mx-auto px-4 sm:px-6">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fade}
            transition={{ duration: 0.6 }}
            className="text-center mb-14"
          >
            <span className="font-mono text-[11px] text-accent bg-accent/10 border border-accent/20 px-3 py-1.5 rounded-full tracking-[0.18em]">
              OUR JOURNEY
            </span>
            <h2 className="font-heading text-3xl md:text-4xl font-bold text-white mt-6 tracking-tight">
              Company Journey
            </h2>
          </motion.div>
          <div className="relative">
            <div className="absolute left-4 top-0 bottom-0 w-px bg-white/10 md:left-1/2" />
            <div className="space-y-8">
              {TIMELINE.map((t, i) => (
                <motion.div
                  key={t.year}
                  initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fade}
                  transition={{ duration: 0.5, delay: i * 0.1 }}
                  className={`relative flex md:items-center gap-4 ${i % 2 === 0 ? "md:flex-row" : "md:flex-row-reverse"}`}
                >
                  <div className="flex-1 md:text-right">
                    {i % 2 === 0 ? (
                      <div className="bg-white/[0.03] border border-white/10 rounded-xl p-5 ml-10 md:ml-0 hover:border-accent/30 transition-all">
                        <p className="font-heading font-bold text-accent text-lg">{t.year}</p>
                        <p className="text-sm text-white/55 mt-1">{t.event}</p>
                      </div>
                    ) : <div className="hidden md:block" />}
                  </div>
                  <div className="absolute left-4 md:left-1/2 w-3 h-3 rounded-full bg-accent -translate-x-1/2 top-6 shadow-[0_0_10px_rgba(239,35,60,0.6)]" />
                  <div className="flex-1">
                    {i % 2 !== 0 ? (
                      <div className="bg-white/[0.03] border border-white/10 rounded-xl p-5 ml-10 md:ml-4 hover:border-accent/30 transition-all">
                        <p className="font-heading font-bold text-accent text-lg">{t.year}</p>
                        <p className="text-sm text-white/55 mt-1">{t.event}</p>
                      </div>
                    ) : <div className="hidden md:block" />}
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
