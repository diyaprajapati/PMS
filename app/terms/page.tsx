import Link from "next/link";
import Image from "next/image";

export default function TermsOfService() {
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
              Terms of Service
            </h1>
            <p className="text-xl text-foreground/60 font-mono">
              Last updated: March 2, 2026
            </p>
          </div>

          {/* Content Sections */}
          <div className="space-y-16">
            {/* Section 1 */}
            <section className="pb-12 border-b border-foreground/5">
              <h2 className="font-display text-3xl md:text-4xl font-semibold mb-6 tracking-tight">
                1. Agreement to Terms
              </h2>
              <div className="space-y-4 text-foreground/80 leading-relaxed">
                <p>
                  By accessing and using Runway ("the Service"), you accept and agree to be bound by the terms and provision of this agreement. If you do not agree to these Terms of Service, please do not use the Service.
                </p>
                <p>
                  We reserve the right to update and change these Terms of Service without notice. Any new features that augment or enhance the current Service shall be subject to the Terms of Service.
                </p>
              </div>
            </section>

            {/* Section 2 */}
            <section className="pb-12 border-b border-foreground/5">
              <h2 className="font-display text-3xl md:text-4xl font-semibold mb-6 tracking-tight">
                2. Account Terms
              </h2>
              <div className="space-y-4 text-foreground/80 leading-relaxed">
                <p>
                  You must be 18 years or older to use this Service. You must provide your legal full name, a valid email address, and any other information requested in order to complete the signup process.
                </p>
                <p>
                  You are responsible for maintaining the security of your account and password. Runway cannot and will not be liable for any loss or damage from your failure to comply with this security obligation.
                </p>
                <p>
                  You are responsible for all content posted and activity that occurs under your account. One person or legal entity may not maintain more than one free account.
                </p>
                <p>
                  You may not use the Service for any illegal or unauthorized purpose. You must not, in the use of the Service, violate any laws in your jurisdiction.
                </p>
              </div>
            </section>

            {/* Section 3 */}
            <section className="pb-12 border-b border-foreground/5">
              <h2 className="font-display text-3xl md:text-4xl font-semibold mb-6 tracking-tight">
                3. API and Service Terms
              </h2>
              <div className="space-y-4 text-foreground/80 leading-relaxed">
                <p>
                  Abuse or excessively frequent requests to Runway via the API may result in the temporary or permanent suspension of your account's access to the API. Runway, in our sole discretion, will determine abuse or excessive usage of the API.
                </p>
                <p>
                  Runway reserves the right at any time to modify or discontinue, temporarily or permanently, your access to the API (or any part thereof) with or without notice.
                </p>
              </div>
            </section>

            {/* Section 4 */}
            <section className="pb-12 border-b border-foreground/5">
              <h2 className="font-display text-3xl md:text-4xl font-semibold mb-6 tracking-tight">
                4. Payment and Billing
              </h2>
              <div className="space-y-4 text-foreground/80 leading-relaxed">
                <p>
                  The Service is currently offered free of charge. When paid plans become available, the following terms will apply:
                </p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>A valid credit card is required for paying accounts.</li>
                  <li>The Service is billed in advance on a monthly or annual basis and is non-refundable.</li>
                  <li>All fees are exclusive of all taxes, levies, or duties imposed by taxing authorities.</li>
                  <li>For any upgrade or downgrade in plan level, your credit card will automatically be charged the new rate.</li>
                </ul>
              </div>
            </section>

            {/* Section 5 */}
            <section className="pb-12 border-b border-foreground/5">
              <h2 className="font-display text-3xl md:text-4xl font-semibold mb-6 tracking-tight">
                5. Cancellation and Termination
              </h2>
              <div className="space-y-4 text-foreground/80 leading-relaxed">
                <p>
                  You are solely responsible for properly canceling your account. You can cancel your account at any time through your account settings.
                </p>
                <p>
                  All of your content will be immediately deleted from the Service upon cancellation. This information cannot be recovered once your account is cancelled.
                </p>
                <p>
                  Runway, in its sole discretion, has the right to suspend or terminate your account and refuse any and all current or future use of the Service for any reason at any time.
                </p>
              </div>
            </section>

            {/* Section 6 */}
            <section className="pb-12 border-b border-foreground/5">
              <h2 className="font-display text-3xl md:text-4xl font-semibold mb-6 tracking-tight">
                6. Modifications to the Service
              </h2>
              <div className="space-y-4 text-foreground/80 leading-relaxed">
                <p>
                  Runway reserves the right at any time to modify or discontinue, temporarily or permanently, the Service (or any part thereof) with or without notice.
                </p>
                <p>
                  Runway shall not be liable to you or to any third party for any modification, price change, suspension, or discontinuance of the Service.
                </p>
              </div>
            </section>

            {/* Section 7 */}
            <section className="pb-12 border-b border-foreground/5">
              <h2 className="font-display text-3xl md:text-4xl font-semibold mb-6 tracking-tight">
                7. Intellectual Property
              </h2>
              <div className="space-y-4 text-foreground/80 leading-relaxed">
                <p>
                  We claim no intellectual property rights over the material you provide to the Service. Your profile and materials uploaded remain yours.
                </p>
                <p>
                  Runway does not pre-screen content, but reserves the right (but not the obligation) to refuse or remove any content that is available via the Service.
                </p>
                <p>
                  The look and feel of the Service is copyright © Runway. All rights reserved. You may not duplicate, copy, or reuse any portion of the HTML/CSS, JavaScript, or visual design elements without express written permission.
                </p>
              </div>
            </section>

            {/* Section 8 */}
            <section className="pb-12 border-b border-foreground/5">
              <h2 className="font-display text-3xl md:text-4xl font-semibold mb-6 tracking-tight">
                8. Limitation of Liability
              </h2>
              <div className="space-y-4 text-foreground/80 leading-relaxed">
                <p>
                  In no event shall Runway, nor its directors, employees, partners, agents, suppliers, or affiliates, be liable for any indirect, incidental, special, consequential or punitive damages, including without limitation, loss of profits, data, use, goodwill, or other intangible losses.
                </p>
                <p>
                  Runway assumes no responsibility for any errors or omissions in the content of the Service. In no event shall Runway be liable for any special, direct, indirect, consequential, or incidental damages or any damages whatsoever.
                </p>
              </div>
            </section>

            {/* Section 9 */}
            <section className="pb-12 border-b border-foreground/5">
              <h2 className="font-display text-3xl md:text-4xl font-semibold mb-6 tracking-tight">
                9. General Conditions
              </h2>
              <div className="space-y-4 text-foreground/80 leading-relaxed">
                <p>
                  Your use of the Service is at your sole risk. The Service is provided on an "as is" and "as available" basis.
                </p>
                <p>
                  Technical support is only provided to paying account holders and is only available via email. We strive to respond to all support requests within 24-48 hours during business days.
                </p>
                <p>
                  You understand that Runway uses third-party vendors and hosting partners to provide the necessary hardware, software, networking, storage, and related technology required to run the Service. Your data is securely stored with Neon DB, a managed third-party Postgres service.
                </p>
                <p>
                  Runway does not sell, rent, or share your personal information or user data with any third parties for marketing, advertising, or any other purposes, except as strictly necessary to operate the Service or as required by law.
                </p>
                <p>
                  You must not modify, adapt or hack the Service or modify another website to falsely imply that it is associated with the Service or Runway.
                </p>
              </div>
            </section>

            {/* Section 10 */}
            <section className="pb-12">
              <h2 className="font-display text-3xl md:text-4xl font-semibold mb-6 tracking-tight">
                10. Contact Information
              </h2>
              <div className="space-y-4 text-foreground/80 leading-relaxed">
                <p>
                  If you have any questions about these Terms of Service, please contact us through your account support channels or via the contact information provided on our website.
                </p>
              </div>
            </section>
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
