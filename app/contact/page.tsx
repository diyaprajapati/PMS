import Link from "next/link";
import Image from "next/image";

export default function ContactPage() {
  return (
    <div className="min-h-screen bg-background font-sans">
      {/* Nav - Brutalist minimal */}
      <nav className="border-b border-foreground/10">
        <div className="max-w-[1400px] mx-auto px-8 md:px-16 py-6 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            <Image src="/logo.png" alt="Runway" width={40} height={40} className="w-10 h-10" />
            <span className="font-display text-2xl font-semibold tracking-tight">Runway</span>
          </Link>

          <div className="flex items-center gap-8">
            <Link href="/login" className="text-sm font-medium text-foreground/60 hover:text-foreground transition-colors">
              Sign In
            </Link>
            <Link
              href="/register"
              className="text-sm font-medium px-6 py-2.5 bg-foreground text-background border border-foreground hover:bg-foreground/90 transition-colors"
            >
              Get Started
            </Link>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-[1400px] mx-auto px-8 md:px-16 py-32">
        <div className="max-w-[900px]">
          {/* Header */}
          <div className="mb-20 pb-12 border-b border-foreground/10">
            <h1 className="font-display text-6xl md:text-8xl font-bold mb-8 tracking-tighter leading-[0.95]">
              Get in touch
            </h1>
            <p className="text-2xl md:text-3xl text-foreground/60 leading-[1.4]">
              Have questions? We'd love to hear from you.
            </p>
          </div>

          {/* Main Contact Section */}
          <div className="border border-foreground/10 p-16 md:p-24 text-center mb-20">
            <div className="mb-12">
              <svg
                className="w-24 h-24 mx-auto text-primary mb-8"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                />
              </svg>

              <h2 className="font-display text-3xl md:text-4xl font-semibold mb-6 tracking-tight">
                Email us for any inquiry
              </h2>

              <p className="text-xl text-foreground/60 mb-12 max-w-[600px] mx-auto leading-relaxed">
                Whether you have questions, need support, or want to discuss a partnership, we're here to help.
              </p>

              <a
                href="mailto:hey@dcubelabs.work"
                className="inline-flex items-center justify-center px-8 py-4 bg-primary text-primary-foreground border border-primary text-lg font-medium hover:bg-primary/90 transition-colors"
              >
                hey@dcubelabs.work
              </a>
            </div>

            <div className="pt-12 border-t border-foreground/10">
              <p className="text-foreground/50 text-sm font-mono">
                We typically respond within 24-48 hours during business days
              </p>
            </div>
          </div>

          {/* Info Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-px bg-foreground/10">
            <div className="bg-background p-12 border border-foreground/10">
              <h3 className="font-display text-xl font-semibold mb-3">
                General Inquiries
              </h3>
              <p className="text-foreground/60 leading-relaxed">
                Questions about Runway, pricing, or features
              </p>
            </div>

            <div className="bg-background p-12 border border-foreground/10">
              <h3 className="font-display text-xl font-semibold mb-3">
                Technical Support
              </h3>
              <p className="text-foreground/60 leading-relaxed">
                Help with your account, bugs, or technical issues
              </p>
            </div>

            <div className="bg-background p-12 border border-foreground/10">
              <h3 className="font-display text-xl font-semibold mb-3">
                Partnerships
              </h3>
              <p className="text-foreground/60 leading-relaxed">
                Business partnerships and collaboration opportunities
              </p>
            </div>
          </div>

          {/* Back to Home */}
          <div className="mt-20 pt-12 border-t border-foreground/10">
            <Link
              href="/"
              className="inline-flex items-center gap-2 text-foreground/60 hover:text-foreground transition-colors group"
            >
              <svg
                className="w-5 h-5 transition-transform group-hover:-translate-x-1"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Back to Home
            </Link>
          </div>
        </div>
      </main>

      {/* Footer - Minimal */}
      <footer className="border-t border-foreground/10 mt-32">
        <div className="max-w-[1400px] mx-auto px-8 md:px-16 py-12">
          <div className="flex flex-col md:flex-row items-center justify-between gap-8">
            <div className="flex items-center gap-3">
              <Image src="/logo.png" alt="Runway" width={24} height={24} className="w-6 h-6" />
              <span className="font-display font-semibold">Runway</span>
            </div>

            <div className="flex items-center gap-8 text-sm text-foreground/60">
              <Link href="/privacy" className="hover:text-foreground transition-colors">Privacy</Link>
              <Link href="/terms" className="hover:text-foreground transition-colors">Terms</Link>
              <Link href="/contact" className="hover:text-foreground transition-colors">Contact</Link>
            </div>

            <div className="text-sm text-foreground/40 font-mono">
              © 2026 Runway
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
