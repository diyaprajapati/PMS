"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import Image from "next/image";

export default function LandingPage() {
  const [email, setEmail] = useState("");
  const [activeSteps, setActiveSteps] = useState<Set<string>>(new Set());
  const stepRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});

  useEffect(() => {
    const handleScroll = () => {
      const middleOfScreen = window.innerHeight / 2;
      const newActiveSteps = new Set<string>();

      Object.entries(stepRefs.current).forEach(([stepNumber, element]) => {
        if (element) {
          const rect = element.getBoundingClientRect();
          const elementMiddle = rect.top + rect.height / 2;

          // If element middle crosses the middle of screen
          if (elementMiddle <= middleOfScreen && elementMiddle >= 0) {
            newActiveSteps.add(stepNumber);
          }
        }
      });

      setActiveSteps(newActiveSteps);
    };

    window.addEventListener("scroll", handleScroll);
    handleScroll(); // Initial check

    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

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

      {/* Hero - Maximum impact */}
      <section className="border-b border-foreground/10">
        <div className="max-w-[1400px] mx-auto px-8 md:px-16 py-32 md:py-48">
          <div className="max-w-[900px]">
            <h1 className="font-display text-[72px] md:text-[120px] leading-[0.9] font-bold tracking-tighter mb-12">
              Ship work<br />that matters
            </h1>

            <p className="text-2xl md:text-3xl text-foreground/60 mb-16 max-w-[600px] leading-[1.4]">
              Project management stripped to its essence. No clutter. No complexity. Just results.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 mb-16">
              <Link
                href="/register"
                className="inline-flex items-center justify-center px-8 py-4 bg-primary text-primary-foreground border border-primary text-base font-medium hover:bg-primary/90 transition-colors"
              >
                Get Started Free
              </Link>
              <Link
                href="#demo"
                className="inline-flex items-center justify-center px-8 py-4 border border-foreground/20 text-base font-medium hover:border-foreground/40 transition-colors"
              >
                See How It Works
              </Link>
            </div>

            <div className="flex items-center gap-12 text-sm text-foreground/50 font-mono">
              <span>Free for now</span>
              <span>No credit card</span>
              <span>Always simple</span>
            </div>
          </div>
        </div>
      </section>

      {/* Stats - Brutalist grid */}
      <section className="border-b border-foreground/10">
        <div className="max-w-[1400px] mx-auto grid grid-cols-1 md:grid-cols-3">
          <div className="border-r border-foreground/10 px-8 md:px-16 py-20">
            <div className="font-display text-6xl font-bold mb-4">10K+</div>
            <div className="text-foreground/60">Teams shipping daily</div>
          </div>
          <div className="border-r border-foreground/10 px-8 md:px-16 py-20">
            <div className="font-display text-6xl font-bold mb-4">50M+</div>
            <div className="text-foreground/60">Tasks completed</div>
          </div>
          <div className="px-8 md:px-16 py-20">
            <div className="font-display text-6xl font-bold mb-4">99.9%</div>
            <div className="text-foreground/60">Uptime guaranteed</div>
          </div>
        </div>
      </section>

      {/* Features - Grid system */}
      <section className="border-b border-foreground/10">
        <div className="max-w-[1400px] mx-auto px-8 md:px-16 py-32">
          <h2 className="font-display text-5xl md:text-7xl font-bold mb-24 max-w-[800px]">
            Everything you need. Nothing you don't.
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-px bg-foreground/10">
            {[
              {
                title: "Sprint Planning",
                description: "Plan work in focused sprints. Set goals. Track progress. Ship on time."
              },
              {
                title: "Task Management",
                description: "Break down projects into actionable tasks. Assign. Execute. Done."
              },
              {
                title: "Team Collaboration",
                description: "Real-time updates. Clear communication. Everyone stays aligned."
              },
              {
                title: "Analytics",
                description: "Track velocity. Identify bottlenecks. Make data-driven decisions."
              },
              {
                title: "Time Tracking",
                description: "Know where time goes. Optimize workflows. Improve efficiency."
              },
              {
                title: "Bug Tracking",
                description: "Log issues. Prioritize fixes. Ship stable products."
              }
            ].map((feature, i) => (
              <div key={i} className="bg-background p-12 border border-foreground/10 hover:border-primary/30 transition-colors group">
                <h3 className="font-display text-2xl font-semibold mb-4 group-hover:text-primary transition-colors">
                  {feature.title}
                </h3>
                <p className="text-foreground/60 leading-relaxed">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works - Simple steps with scroll animation */}
      <section id="demo" className="border-b border-foreground/10">
        <div className="max-w-[1400px] mx-auto px-8 md:px-16 py-32">
          <h2 className="font-display text-5xl md:text-7xl font-bold mb-24">
            Three steps to ship faster
          </h2>

          <div className="space-y-20">
            {[
              {
                number: "01",
                title: "Create your project",
                description: "Set up in 60 seconds. Add your team. Define your first sprint."
              },
              {
                number: "02",
                title: "Break down the work",
                description: "Create tasks. Set priorities. Assign to team members."
              },
              {
                number: "03",
                title: "Ship and iterate",
                description: "Track progress. Review metrics. Plan the next sprint."
              }
            ].map((step) => (
              <div key={step.number} className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start pb-20 border-b border-foreground/5 last:border-0">
                <div className="md:col-span-2">
                  <div
                    ref={(el) => { stepRefs.current[step.number] = el; }}
                    className={`font-mono text-6xl font-bold transition-colors duration-300 ${
                      activeSteps.has(step.number) ? 'text-primary' : 'text-foreground/10'
                    }`}
                  >
                    {step.number}
                  </div>
                </div>
                <div className="md:col-span-10">
                  <h3 className="font-display text-4xl font-semibold mb-4">
                    {step.title}
                  </h3>
                  <p className="text-xl text-foreground/60 max-w-[600px]">
                    {step.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials - Minimal quotes */}
      <section className="border-b border-foreground/10">
        <div className="max-w-[1400px] mx-auto px-8 md:px-16 py-32">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-px bg-foreground/10">
            {[
              {
                quote: "We shipped 3x faster in the first month. No learning curve. Just works.",
                author: "Sarah Chen",
                role: "Engineering Lead"
              },
              {
                quote: "Finally, a tool that doesn't get in the way. Simple, fast, effective.",
                author: "Marcus Rodriguez",
                role: "Product Manager"
              },
              {
                quote: "The ROI was immediate. Best decision we made this year.",
                author: "Emily Watson",
                role: "CTO"
              }
            ].map((testimonial, i) => (
              <div key={i} className="bg-background p-12 border border-foreground/10">
                <p className="text-xl mb-8 leading-relaxed">
                  "{testimonial.quote}"
                </p>
                <div className="text-sm">
                  <div className="font-semibold">{testimonial.author}</div>
                  <div className="text-foreground/50">{testimonial.role}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA - Bold and simple */}
      <section className="border-b border-foreground/10">
        <div className="max-w-[1400px] mx-auto px-8 md:px-16 py-32 md:py-48 text-center">
          <h2 className="font-display text-6xl md:text-8xl font-bold mb-12 max-w-[1000px] mx-auto leading-[0.95]">
            Ready to ship faster?
          </h2>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              window.location.href = `/register?email=${encodeURIComponent(email)}`;
            }}
            className="max-w-[600px] mx-auto mb-12"
          >
            <div className="flex flex-col sm:flex-row gap-4">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@email.com"
                className="flex-1 px-6 py-4 border border-foreground/20 bg-background text-foreground placeholder:text-foreground/30 focus:outline-none focus:border-primary transition-colors text-lg"
                required
              />
              <button
                type="submit"
                className="px-8 py-4 bg-primary text-primary-foreground border border-primary text-lg font-medium hover:bg-primary/90 transition-colors whitespace-nowrap"
              >
                Get Started
              </button>
            </div>
          </form>

          <p className="text-foreground/50 text-sm font-mono">
            Free to get started · No credit card required
          </p>
        </div>
      </section>

      {/* Footer - Minimal */}
      <footer className="border-t border-foreground/10">
        <div className="max-w-[1400px] mx-auto px-8 md:px-16 py-12">
          <div className="flex flex-col md:flex-row items-center justify-between gap-8">
            <div className="flex items-center gap-3">
              <Image src="/logo.png" alt="Runway" width={24} height={24} className="w-6 h-6" />
              <span className="font-display font-semibold">Runway</span>
            </div>

            <div className="flex items-center gap-8 text-sm text-foreground/60">
              <Link href="#" className="hover:text-foreground transition-colors">Privacy</Link>
              <Link href="#" className="hover:text-foreground transition-colors">Terms</Link>
              <Link href="#" className="hover:text-foreground transition-colors">Contact</Link>
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
