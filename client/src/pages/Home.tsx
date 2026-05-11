import { useLocalAuth } from "@/contexts/AuthContext";
import { Link } from "wouter";
import { ArrowRight, Zap } from "lucide-react";
import { useEffect } from "react";

export default function Home() {
  const { user, loading } = useLocalAuth();

  useEffect(() => {
    if (!loading && user) {
      window.location.href = "/feed";
    }
  }, [user, loading]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Navbar */}
      <nav className="sticky top-0 z-50 border-b border-border bg-card/80 backdrop-blur-md">
        <div className="max-w-6xl mx-auto px-4 h-14 sm:h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold"
              style={{ background: "linear-gradient(135deg, oklch(0.55 0.22 264), oklch(0.6 0.2 290))" }}
            >
              S
            </div>
            <span className="text-lg sm:text-xl font-bold" style={{ fontFamily: "'SocialNetDisplay', 'Playfair Display', serif" }}>
              SocialNet
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Link href="/login">
              <button className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors px-3 py-2 hidden sm:block">
                Sign In
              </button>
            </Link>
            <Link href="/register">
              <button className="sn-btn sn-btn-primary text-sm px-4 py-2">
                Get Started
              </button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="px-4 pt-16 sm:pt-24 pb-16 sm:pb-24 text-center relative overflow-hidden">
        <div
          className="absolute inset-0 opacity-5 pointer-events-none"
          style={{ background: "radial-gradient(ellipse at 50% 0%, oklch(0.55 0.22 264), transparent 70%)" }}
        />
        <div className="relative max-w-4xl mx-auto">
          <div
            className="inline-flex items-center gap-2 px-3 sm:px-4 py-1.5 sm:py-2 rounded-full text-xs sm:text-sm font-medium mb-6 sm:mb-8 border"
            style={{
              background: "oklch(0.55 0.22 264 / 0.08)",
              borderColor: "oklch(0.55 0.22 264 / 0.2)",
              color: "oklch(0.55 0.22 264)",
            }}
          >
            <Zap size={13} />
            Real-time social networking
          </div>

          <h1
            className="text-4xl sm:text-6xl lg:text-7xl font-bold mb-4 sm:mb-6 leading-tight"
            style={{
              fontFamily: "'SocialNetDisplay', 'Playfair Display', serif",
              textShadow: "0 4px 16px rgba(99,102,241,0.2), 0 2px 4px rgba(0,0,0,0.1)",
            }}
          >
            Connect, Share,{" "}
            <span
              style={{
                background: "linear-gradient(135deg, oklch(0.55 0.22 264), oklch(0.6 0.2 290))",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
              }}
            >
              Thrive
            </span>
          </h1>

          <p className="text-base sm:text-xl text-muted-foreground max-w-2xl mx-auto mb-8 sm:mb-10 leading-relaxed px-2">
            A beautifully crafted social platform where meaningful connections happen. Share your story, join communities, and chat in real-time.
          </p>

          <div className="flex items-center justify-center gap-3 flex-wrap">
            <Link href="/register">
              <button className="sn-btn sn-btn-primary text-sm sm:text-base px-6 sm:px-8 py-3 flex items-center gap-2">
                Join SocialNet
                <ArrowRight size={17} />
              </button>
            </Link>
            <Link href="/login">
              <button className="text-sm sm:text-base px-6 sm:px-8 py-3 rounded-xl border border-border hover:bg-secondary transition-all duration-200 font-medium">
                Sign In
              </button>
            </Link>
          </div>
        </div>
      </section>

      {/* Features - multi-column */}
      <section className="py-12 sm:py-20 px-4 bg-secondary/30">
        <div className="max-w-5xl mx-auto">
          <h2
            className="text-2xl sm:text-3xl font-bold text-center mb-3"
            style={{ fontFamily: "'SocialNetDisplay', 'Playfair Display', serif" }}
          >
            Everything you need to connect
          </h2>
          <p className="text-center text-muted-foreground mb-8 sm:mb-12 max-w-xl mx-auto text-sm sm:text-base">
            Powerful features designed for meaningful social interactions
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              { icon: "🔒", title: "Secure Auth", desc: "Username/password login with session management and role-based access control." },
              { icon: "📝", title: "Rich Posts", desc: "Share text, images, and videos. Like, comment, and engage with your community." },
              { icon: "👥", title: "Groups", desc: "Create public or private groups. Manage members and control who joins." },
              { icon: "💬", title: "Real-Time Chat", desc: "Instant messaging powered by Socket.io. See who's online and chat live." },
              { icon: "🤝", title: "Friends", desc: "Send friend requests, build your network, and see friends' posts in your feed." },
              { icon: "📊", title: "Statistics", desc: "Beautiful D3.js charts showing platform activity and community insights." },
            ].map((f) => (
              <div key={f.title} className="sn-card p-5 sm:p-6">
                <div className="text-3xl mb-3">{f.icon}</div>
                <h3 className="font-semibold text-base mb-2">{f.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 sm:py-24 px-4 text-center">
        <div
          className="max-w-2xl mx-auto p-8 sm:p-12 rounded-2xl sm:rounded-3xl text-white relative overflow-hidden"
          style={{ background: "linear-gradient(135deg, oklch(0.55 0.22 264), oklch(0.6 0.2 290))" }}
        >
          <div className="absolute inset-0 opacity-20 pointer-events-none" style={{ background: "radial-gradient(circle at 30% 50%, white, transparent 60%)" }} />
          <div className="relative">
            <h2
              className="text-2xl sm:text-3xl font-bold mb-3"
              style={{ fontFamily: "'SocialNetDisplay', 'Playfair Display', serif", textShadow: "0 2px 8px rgba(0,0,0,0.2)" }}
            >
              Ready to get started?
            </h2>
            <p className="text-white/80 mb-6 sm:mb-8 text-sm sm:text-lg">
              Join thousands of users already connecting on SocialNet
            </p>
            <Link href="/register">
              <button className="bg-white text-primary font-semibold px-6 sm:px-8 py-3 rounded-xl hover:bg-white/90 transition-all duration-200 shadow-lg text-sm sm:text-base">
                Create Free Account
              </button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-6 px-4 text-center text-xs sm:text-sm text-muted-foreground">
        <p>© 2024 SocialNet. Built for the Android 2 Course Final Project.</p>
      </footer>
    </div>
  );
}
