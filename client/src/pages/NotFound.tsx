import { Link } from "wouter";

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center">
        <h1 className="text-8xl font-bold mb-4" style={{ fontFamily: "'SocialNetDisplay', 'Playfair Display', serif", background: "linear-gradient(135deg, oklch(0.55 0.22 264), oklch(0.6 0.2 290))", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>404</h1>
        <p className="text-xl font-semibold mb-2">Page not found</p>
        <p className="text-muted-foreground mb-8">The page you're looking for doesn't exist.</p>
        <Link href="/"><button className="sn-btn sn-btn-primary">Go Home</button></Link>
      </div>
    </div>
  );
}
