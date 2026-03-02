import Link from "next/link";
import Image from "next/image";

export default function PrivacyPolicy() {
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
              Privacy Policy
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
                1. Introduction
              </h2>
              <div className="space-y-4 text-foreground/80 leading-relaxed">
                <p>
                  At Runway, we take your privacy seriously. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our service.
                </p>
                <p>
                  Please read this privacy policy carefully. If you do not agree with the terms of this privacy policy, please do not access the service.
                </p>
              </div>
            </section>

            {/* Section 2 */}
            <section className="pb-12 border-b border-foreground/5">
              <h2 className="font-display text-3xl md:text-4xl font-semibold mb-6 tracking-tight">
                2. Information We Collect
              </h2>
              <div className="space-y-6 text-foreground/80 leading-relaxed">
                <div>
                  <h3 className="font-display text-xl font-semibold mb-3 text-foreground">
                    Personal Information
                  </h3>
                  <p className="mb-3">
                    We collect information that you provide directly to us when you:
                  </p>
                  <ul className="list-disc pl-6 space-y-2">
                    <li>Create an account (name, email address, password)</li>
                    <li>Use the service (project data, tasks, sprints, team information)</li>
                    <li>Contact us for support</li>
                    <li>Subscribe to our newsletter or marketing communications</li>
                  </ul>
                </div>

                <div>
                  <h3 className="font-display text-xl font-semibold mb-3 text-foreground">
                    Automatically Collected Information
                  </h3>
                  <p className="mb-3">
                    When you access our service, we automatically collect certain information about your device and usage:
                  </p>
                  <ul className="list-disc pl-6 space-y-2">
                    <li>Log data (IP address, browser type, operating system)</li>
                    <li>Device information (device type, unique device identifiers)</li>
                    <li>Usage data (pages visited, features used, time spent)</li>
                    <li>Cookies and similar tracking technologies</li>
                  </ul>
                </div>
              </div>
            </section>

            {/* Section 3 */}
            <section className="pb-12 border-b border-foreground/5">
              <h2 className="font-display text-3xl md:text-4xl font-semibold mb-6 tracking-tight">
                3. How We Use Your Information
              </h2>
              <div className="space-y-4 text-foreground/80 leading-relaxed">
                <p>We use the information we collect to:</p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Provide, maintain, and improve our service</li>
                  <li>Process your transactions and send related information</li>
                  <li>Send you technical notices, updates, security alerts, and support messages</li>
                  <li>Respond to your comments, questions, and customer service requests</li>
                  <li>Monitor and analyze trends, usage, and activities in connection with our service</li>
                  <li>Detect, prevent, and address technical issues and security incidents</li>
                  <li>Personalize and improve your experience</li>
                  <li>Send you marketing communications (with your consent)</li>
                </ul>
              </div>
            </section>

            {/* Section 4 */}
            <section className="pb-12 border-b border-foreground/5">
              <h2 className="font-display text-3xl md:text-4xl font-semibold mb-6 tracking-tight">
                4. Information Sharing and Disclosure
              </h2>
              <div className="space-y-6 text-foreground/80 leading-relaxed">
                <p>
                  We do not sell your personal information. We may share your information in the following circumstances:
                </p>

                <div>
                  <h3 className="font-display text-xl font-semibold mb-3 text-foreground">
                    With Your Consent
                  </h3>
                  <p>
                    We share your information with third parties when you give us explicit consent to do so.
                  </p>
                </div>

                <div>
                  <h3 className="font-display text-xl font-semibold mb-3 text-foreground">
                    Service Providers
                  </h3>
                  <p>
                    We share information with third-party service providers who perform services on our behalf, such as:
                  </p>
                  <ul className="list-disc pl-6 space-y-2 mt-2">
                    <li>Cloud hosting providers</li>
                    <li>Email service providers</li>
                    <li>Analytics providers</li>
                    <li>Payment processors</li>
                  </ul>
                </div>

                <div>
                  <h3 className="font-display text-xl font-semibold mb-3 text-foreground">
                    Legal Requirements
                  </h3>
                  <p>
                    We may disclose your information if required to do so by law or in response to valid requests by public authorities.
                  </p>
                </div>

                <div>
                  <h3 className="font-display text-xl font-semibold mb-3 text-foreground">
                    Business Transfers
                  </h3>
                  <p>
                    If we are involved in a merger, acquisition, or sale of assets, your information may be transferred as part of that transaction.
                  </p>
                </div>
              </div>
            </section>

            {/* Section 5 */}
            <section className="pb-12 border-b border-foreground/5">
              <h2 className="font-display text-3xl md:text-4xl font-semibold mb-6 tracking-tight">
                5. Data Security
              </h2>
              <div className="space-y-4 text-foreground/80 leading-relaxed">
                <p>
                  We implement appropriate technical and organizational measures to protect the security of your personal information. However, please note that no method of transmission over the Internet or electronic storage is 100% secure.
                </p>
                <p>
                  We use industry-standard encryption for data in transit and at rest. Our infrastructure is hosted on secure, SOC 2 compliant cloud providers.
                </p>
                <p>
                  While we strive to protect your personal information, we cannot guarantee its absolute security. You are responsible for maintaining the confidentiality of your account credentials.
                </p>
              </div>
            </section>

            {/* Section 6 */}
            <section className="pb-12 border-b border-foreground/5">
              <h2 className="font-display text-3xl md:text-4xl font-semibold mb-6 tracking-tight">
                6. Data Retention
              </h2>
              <div className="space-y-4 text-foreground/80 leading-relaxed">
                <p>
                  We retain your personal information for as long as necessary to provide you with our service and fulfill the purposes outlined in this privacy policy.
                </p>
                <p>
                  When you delete your account, we will delete or anonymize your personal information within 30 days, unless we are required to retain it for legal, regulatory, or legitimate business purposes.
                </p>
                <p>
                  Backup copies of deleted data may persist for up to 90 days but are not accessible for regular operations.
                </p>
              </div>
            </section>

            {/* Section 7 */}
            <section className="pb-12 border-b border-foreground/5">
              <h2 className="font-display text-3xl md:text-4xl font-semibold mb-6 tracking-tight">
                7. Your Rights and Choices
              </h2>
              <div className="space-y-4 text-foreground/80 leading-relaxed">
                <p>
                  Depending on your location, you may have certain rights regarding your personal information:
                </p>
                <ul className="list-disc pl-6 space-y-2">
                  <li><strong>Access:</strong> You can request access to the personal information we hold about you</li>
                  <li><strong>Correction:</strong> You can request that we correct inaccurate information</li>
                  <li><strong>Deletion:</strong> You can request deletion of your personal information</li>
                  <li><strong>Data Portability:</strong> You can request a copy of your data in a machine-readable format</li>
                  <li><strong>Opt-out:</strong> You can opt out of marketing communications at any time</li>
                  <li><strong>Withdraw Consent:</strong> Where we process data based on consent, you can withdraw it</li>
                </ul>
                <p className="mt-4">
                  To exercise these rights, please contact us through your account settings or support channels.
                </p>
              </div>
            </section>

            {/* Section 8 */}
            <section className="pb-12 border-b border-foreground/5">
              <h2 className="font-display text-3xl md:text-4xl font-semibold mb-6 tracking-tight">
                8. Cookies and Tracking Technologies
              </h2>
              <div className="space-y-4 text-foreground/80 leading-relaxed">
                <p>
                  We use cookies and similar tracking technologies to collect information about your browsing activities and to distinguish you from other users.
                </p>
                <p>
                  You can set your browser to refuse all or some browser cookies, or to alert you when cookies are being sent. However, if you disable or refuse cookies, some parts of the service may become inaccessible or not function properly.
                </p>
              </div>
            </section>

            {/* Section 9 */}
            <section className="pb-12 border-b border-foreground/5">
              <h2 className="font-display text-3xl md:text-4xl font-semibold mb-6 tracking-tight">
                9. Third-Party Links
              </h2>
              <div className="space-y-4 text-foreground/80 leading-relaxed">
                <p>
                  Our service may contain links to third-party websites or services that are not owned or controlled by Runway.
                </p>
                <p>
                  We have no control over, and assume no responsibility for, the content, privacy policies, or practices of any third-party websites or services. We encourage you to review the privacy policy of every site you visit.
                </p>
              </div>
            </section>

            {/* Section 10 */}
            <section className="pb-12 border-b border-foreground/5">
              <h2 className="font-display text-3xl md:text-4xl font-semibold mb-6 tracking-tight">
                10. Children's Privacy
              </h2>
              <div className="space-y-4 text-foreground/80 leading-relaxed">
                <p>
                  Our service is not intended for children under 18 years of age. We do not knowingly collect personal information from children under 18.
                </p>
                <p>
                  If you are a parent or guardian and you are aware that your child has provided us with personal information, please contact us so that we can take necessary action.
                </p>
              </div>
            </section>

            {/* Section 11 */}
            <section className="pb-12 border-b border-foreground/5">
              <h2 className="font-display text-3xl md:text-4xl font-semibold mb-6 tracking-tight">
                11. International Data Transfers
              </h2>
              <div className="space-y-4 text-foreground/80 leading-relaxed">
                <p>
                  Your information may be transferred to, and maintained on, computers located outside of your state, province, country, or other governmental jurisdiction where the data protection laws may differ.
                </p>
                <p>
                  We take appropriate safeguards to ensure that your personal information remains protected in accordance with this privacy policy when transferred internationally.
                </p>
              </div>
            </section>

            {/* Section 12 */}
            <section className="pb-12 border-b border-foreground/5">
              <h2 className="font-display text-3xl md:text-4xl font-semibold mb-6 tracking-tight">
                12. Changes to This Privacy Policy
              </h2>
              <div className="space-y-4 text-foreground/80 leading-relaxed">
                <p>
                  We may update our Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page and updating the "Last updated" date.
                </p>
                <p>
                  We will notify you via email or a prominent notice on our service prior to the change becoming effective for material changes.
                </p>
                <p>
                  You are advised to review this Privacy Policy periodically for any changes. Changes to this Privacy Policy are effective when they are posted on this page.
                </p>
              </div>
            </section>

            {/* Section 13 */}
            <section className="pb-12">
              <h2 className="font-display text-3xl md:text-4xl font-semibold mb-6 tracking-tight">
                13. Contact Us
              </h2>
              <div className="space-y-4 text-foreground/80 leading-relaxed">
                <p>
                  If you have any questions about this Privacy Policy or our privacy practices, please contact us through:
                </p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Your account support channels</li>
                  <li>The contact information provided on our website</li>
                </ul>
                <p className="mt-4">
                  We will respond to your inquiry within a reasonable timeframe, typically within 30 days.
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
              <Link href="/#" className="hover:text-foreground transition-colors">Contact</Link>
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
