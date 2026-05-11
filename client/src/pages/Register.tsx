import { useState } from "react";
import { Link } from "wouter";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Eye, EyeOff, UserPlus } from "lucide-react";

export default function Register() {
  const [form, setForm] = useState({ username: "", password: "", name: "", email: "" });
  const [showPass, setShowPass] = useState(false);

  const registerMutation = trpc.auth.register.useMutation({
    onSuccess: () => { toast.success("Account created! Welcome to SocialNet!"); window.location.href = "/feed"; },
    onError: (e) => toast.error(e.message || "Registration failed"),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.username || !form.password || !form.name) return;
    registerMutation.mutate(form);
  };

  return (
    <div className="min-h-screen flex flex-col lg:flex-row">
      {/* Left panel — hidden on mobile */}
      <div
        className="hidden lg:flex flex-col justify-between w-1/2 p-12 text-white relative overflow-hidden"
        style={{ background: "linear-gradient(135deg, oklch(0.48 0.22 264), oklch(0.55 0.22 264), oklch(0.6 0.2 290))" }}
      >
        <div className="absolute inset-0 opacity-20 pointer-events-none" style={{ background: "radial-gradient(circle at 80% 20%, white, transparent 50%)" }} />
        <div className="relative">
          <Link href="/">
            <div className="flex items-center gap-3 cursor-pointer">
              <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center font-bold text-xl">S</div>
              <span className="text-2xl font-bold" style={{ fontFamily: "'SocialNetDisplay', 'Playfair Display', serif", textShadow: "0 2px 8px rgba(0,0,0,0.2)" }}>SocialNet</span>
            </div>
          </Link>
        </div>
        <div className="relative">
          <h2 className="text-4xl font-bold mb-4 leading-tight" style={{ fontFamily: "'SocialNetDisplay', 'Playfair Display', serif", textShadow: "0 2px 12px rgba(0,0,0,0.2)" }}>
            Start your social journey today
          </h2>
          <p className="text-white/70 text-lg leading-relaxed">Join a growing community of people sharing ideas, building connections, and creating memories.</p>
        </div>
        <div className="relative text-white/50 text-sm">© 2024 SocialNet</div>
      </div>

      {/* Right panel */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-8 bg-background min-h-screen lg:min-h-0">
        <div className="w-full max-w-md">
          {/* Mobile brand */}
          <div className="lg:hidden text-center mb-8">
            <div
              className="w-14 h-14 rounded-2xl flex items-center justify-center text-white font-bold text-2xl mx-auto mb-3"
              style={{ background: "linear-gradient(135deg, oklch(0.55 0.22 264), oklch(0.6 0.2 290))" }}
            >
              S
            </div>
            <span className="text-2xl font-bold" style={{ fontFamily: "'SocialNetDisplay', 'Playfair Display', serif" }}>SocialNet</span>
          </div>

          <div className="mb-7">
            <h1 className="text-2xl sm:text-3xl font-bold mb-2" style={{ fontFamily: "'SocialNetDisplay', 'Playfair Display', serif" }}>Create account</h1>
            <p className="text-muted-foreground text-sm">Join SocialNet and start connecting</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Full Name <span className="text-destructive">*</span></label>
              <input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Your full name" className="sn-input" autoComplete="name" required />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Username <span className="text-destructive">*</span></label>
              <input type="text" value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value.toLowerCase().replace(/\s/g, "") })} placeholder="Choose a username" className="sn-input" autoComplete="username" autoCapitalize="none" minLength={3} required />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Email</label>
              <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="your@email.com (optional)" className="sn-input" autoComplete="email" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Password <span className="text-destructive">*</span></label>
              <div className="relative">
                <input type={showPass ? "text" : "password"} value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} placeholder="At least 6 characters" className="sn-input pr-12" autoComplete="new-password" minLength={6} required />
                <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors p-1">
                  {showPass ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <button type="submit" disabled={registerMutation.isPending} className="sn-btn sn-btn-primary w-full py-3 text-base mt-2">
              {registerMutation.isPending ? (
                <span className="flex items-center justify-center gap-2"><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />Creating account...</span>
              ) : (
                <span className="flex items-center justify-center gap-2"><UserPlus size={18} />Create Account</span>
              )}
            </button>
          </form>

          <p className="mt-5 text-center text-sm text-muted-foreground">
            Already have an account?{" "}
            <Link href="/login"><span className="text-primary font-medium hover:underline cursor-pointer">Sign in</span></Link>
          </p>
        </div>
      </div>
    </div>
  );
}
