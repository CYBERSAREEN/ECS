"use client";
import { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Lock, Eye, EyeOff } from "lucide-react";

export default function AdminLoginPage() {
  const router = useRouter();
  const [form, setForm] = useState({ username: "", password: "" });
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001"}/api/admin/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ username: form.username, password: form.password }),
      });
      if (res.ok) {
        router.push("/vadmin-db7180/dashboard");
      } else {
        setError("Invalid credentials. Please try again.");
      }
    } catch {
      setError("Authentication service unavailable. Please try again.");
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-navy flex items-center justify-center p-4 relative overflow-hidden">
      {/* Grid background */}
      <div className="absolute inset-0 opacity-[0.05] pointer-events-none">
        <svg width="100%" height="100%"><defs><pattern id="ag" width="40" height="40" patternUnits="userSpaceOnUse"><path d="M 40 0 L 0 0 0 40" fill="none" stroke="#08FFC8" strokeWidth="1"/></pattern></defs><rect width="100%" height="100%" fill="url(#ag)"/></svg>
      </div>

      <div className="relative w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-8">
          <Image src="/brand/logo-light-2x.png" alt="ECS" width={140} height={44} className="mx-auto h-11 w-auto" />
        </div>

        <div className="bg-white/5 backdrop-blur border border-white/10 rounded-2xl p-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-accent/20 rounded-lg">
              <Lock size={16} className="text-accent" />
            </div>
            <div>
              <h1 className="font-heading font-bold text-white text-lg">Admin Access</h1>
              <p className="text-white/40 text-xs">Restricted area</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4" autoComplete="off">
            <div>
              <label htmlFor="uname" className="block text-xs font-medium text-white/60 mb-1.5">Username</label>
              <input
                id="uname" type="text" required autoComplete="off"
                value={form.username} onChange={e => setForm({ ...form, username: e.target.value })}
                className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-sm text-white placeholder-white/20 focus:outline-none focus:border-accent/50 focus:ring-1 focus:ring-accent/30 transition-all"
              />
            </div>
            <div className="relative">
              <label htmlFor="pw" className="block text-xs font-medium text-white/60 mb-1.5">Password</label>
              <input
                id="pw" type={showPw ? "text" : "password"} required autoComplete="off"
                value={form.password} onChange={e => setForm({ ...form, password: e.target.value })}
                className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 pr-11 text-sm text-white placeholder-white/20 focus:outline-none focus:border-accent/50 focus:ring-1 focus:ring-accent/30 transition-all"
              />
              <button type="button" onClick={() => setShowPw(s => !s)} className="absolute right-3 top-8 text-white/40 hover:text-white transition-colors">
                {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>

            {error && <p className="text-red-400 text-xs bg-red-400/10 px-3 py-2 rounded-lg">{error}</p>}

            <button type="submit" disabled={loading}
              className="w-full bg-accent text-navy font-bold py-3 rounded-lg hover:bg-accent/80 transition-all disabled:opacity-60 mt-2">
              {loading ? "Verifying..." : "Access Dashboard"}
            </button>
          </form>
        </div>

        <p className="text-center text-white/20 text-xs mt-6">
          EXCELON CYBER SOLUTIONS © {new Date().getFullYear()}
        </p>
      </div>
    </div>
  );
}
