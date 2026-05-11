import { useState } from "react";
import { Link } from "wouter";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Eye, EyeOff, LogIn } from "lucide-react";

export default function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);

  const loginMutation = trpc.auth.login.useMutation({
    onSuccess: () => { toast.success("Welcome back!"); window.location.href = "/feed"; },
    onError: (e) => toast.error(e.message || "Login failed"),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password) return;
    loginMutation.mutate({ username: username.trim(), password });
  };

  return (
    <div className="min-h-screen flex flex-col lg:flex-row">
      {/* Left panel — hidden on mobile */}
      <div
        className="hidden lg:flex flex-col justify-between w-1/2 p-12 text-white relative overflow-hidden"
        style={{ background: "linear-gradient(135deg, oklch(0.48 0.22 264), oklch(0.55 0.22 264), oklch(0.6 0.2 290))" }}
      >
        <div className="absolute inset-0 opacity-20 pointer-events-none" style={{ background: "radial-gradient(circle at 20% 80%, white, transparent 50%)" }} />
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
            Welcome back to your community
          </h2>
          <p className="text-white/70 text-lg leading-relaxed">Connect with friends, share your moments, and stay up to date with your groups.</p>
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
            <h1 className="text-2xl sm:text-3xl font-bold mb-2" style={{ fontFamily: "'SocialNetDisplay', 'Playfair Display', serif" }}>Sign in</h1>
            <p className="text-muted-foreground text-sm">Enter your credentials to access your account</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Username</label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter your username"
                className="sn-input"
                autoComplete="username"
                autoCapitalize="none"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Password</label>
              <div className="relative">
                <input
                  type={showPass ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  className="sn-input pr-12"
                  autoComplete="current-password"
                  required
                />
                <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors p-1">
                  {showPass ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <button type="submit" disabled={loginMutation.isPending} className="sn-btn sn-btn-primary w-full py-3 text-base mt-2">
              {loginMutation.isPending ? (
                <span className="flex items-center justify-center gap-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Signing in...
                </span>
              ) : (
                <span className="flex items-center justify-center gap-2"><LogIn size={18} />Sign In</span>
              )}
            </button>
          </form>

          <div className="mt-5 p-4 rounded-xl bg-secondary/50 text-sm">
            <p className="font-medium mb-2 text-muted-foreground text-xs">Demo accounts:</p>
            <div className="space-y-1 text-muted-foreground text-xs">
              <p><span className="font-mono bg-background px-1.5 py-0.5 rounded">alice</span> / <span className="font-mono bg-background px-1.5 py-0.5 rounded">password123</span></p>
              <p><span className="font-mono bg-background px-1.5 py-0.5 rounded">admin</span> / <span className="font-mono bg-background px-1.5 py-0.5 rounded">admin123</span></p>
            </div>
          </div>

          <p className="mt-5 text-center text-sm text-muted-foreground">
            Don't have an account?{" "}
            <Link href="/register"><span className="text-primary font-medium hover:underline cursor-pointer">Create one</span></Link>
          </p>
        </div>
      </div>
    </div>
  );
}
