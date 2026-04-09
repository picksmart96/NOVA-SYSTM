import { Link } from "wouter";

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <div className="mx-auto max-w-3xl px-6 py-16">

        <div className="mb-12">
          <Link href="/" className="text-sm text-yellow-400 hover:underline">← Back to Home</Link>
          <p className="mt-6 text-xs font-bold uppercase tracking-widest text-yellow-400">Legal</p>
          <h1 className="mt-3 text-5xl font-black">Terms of Service</h1>
          <p className="mt-4 text-slate-400 text-lg">Effective date: January 1, 2025 · PickSmart NOVA</p>
        </div>

        <div className="space-y-10 text-slate-300 leading-relaxed">

          <section>
            <h2 className="text-2xl font-bold text-white mb-4">1. Acceptance of Terms</h2>
            <p>
              By accessing or using PickSmart NOVA ("the Platform"), you agree to be bound by these
              Terms of Service and our Privacy Policy. If you do not agree to these terms, you may
              not use the Platform. These terms apply to all users, including selectors, trainers,
              supervisors, managers, and owners.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-white mb-4">2. Platform Description</h2>
            <p>
              PickSmart NOVA is a warehouse training and operations platform designed to help order
              selectors, trainers, supervisors, and managers improve performance, accuracy, and
              safety. The Platform includes training modules, AI-powered coaching tools (NOVA Help),
              voice-directed workflow tools (NOVA Trainer), community features (Selector Breaking
              News), dashboards, and related operational tools.
            </p>
            <p className="mt-4">
              The Platform is offered in two configurations: <strong className="text-white">ES3</strong> (including NOVA Trainer
              voice workflow) and <strong className="text-white">Standard</strong> (without NOVA Trainer). Features available to
              your account depend on your warehouse's subscription configuration.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-white mb-4">3. Account Registration and Access</h2>
            <p>You are responsible for maintaining the security of your account credentials. You agree to:</p>
            <ul className="mt-4 space-y-2 list-disc list-inside">
              <li>Provide accurate information when creating an account</li>
              <li>Keep your password secure and not share credentials with others</li>
              <li>Notify us promptly of any suspected unauthorized account access</li>
              <li>Use the Platform only for your authorized role and warehouse account</li>
            </ul>
            <p className="mt-4">
              Access is granted through invite links or direct account creation by authorized administrators. Invite links are single-use and tied to the warehouse that issued them.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-white mb-4">4. Warehouse Data Isolation</h2>
            <p>
              Each warehouse account is maintained as a private, separate environment. You agree not to attempt to access, view, extract, or interfere with another customer's warehouse data, users, assignments, sessions, or community content. Unauthorized attempts to cross warehouse boundaries are a material violation of these Terms and may result in immediate termination of access.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-white mb-4">5. Acceptable Use</h2>
            <p>You agree not to use the Platform to:</p>
            <ul className="mt-4 space-y-2 list-disc list-inside">
              <li>Harass, threaten, or abuse other users in any community features</li>
              <li>Post content that is discriminatory, violent, or illegal</li>
              <li>Attempt to reverse-engineer, scrape, or exploit the Platform</li>
              <li>Circumvent role-based access controls or authentication mechanisms</li>
              <li>Share or misuse access credentials</li>
              <li>Use the Platform for any purpose other than legitimate warehouse training and operations</li>
              <li>Introduce malware, viruses, or disruptive code</li>
            </ul>
            <p className="mt-4">
              Violations of acceptable use may result in immediate suspension or permanent termination of access, at our discretion.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-white mb-4">6. AI Features (NOVA Help)</h2>
            <p>
              NOVA Help uses AI language models to provide coaching, guidance, and operational support. AI responses are generated automatically and may not always be perfectly accurate. You should use your own judgment when acting on AI-generated guidance, particularly for safety-critical warehouse operations. PickSmart NOVA is not liable for actions taken based solely on AI-generated responses.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-white mb-4">7. Subscriptions and Payments</h2>
            <p>
              Access to premium features requires a paid subscription. Subscription plans are available for individual selectors (Professional Single, $25/month) and company/warehouse accounts (Company Unlimited, $1,600/year). Subscriptions renew automatically unless cancelled. We reserve the right to update pricing with advance notice to customers.
            </p>
            <p className="mt-4">
              Refund eligibility is determined on a case-by-case basis. Contact us for billing questions.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-white mb-4">8. Intellectual Property</h2>
            <p>
              All content on the Platform, including training modules, NOVA tools, designs, and documentation, is owned by PickSmart NOVA or its licensors. You are granted a limited, non-exclusive license to use the Platform for its intended purpose. You may not reproduce, distribute, or create derivative works from Platform content without written permission.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-white mb-4">9. Limitation of Liability</h2>
            <p>
              To the maximum extent permitted by law, PickSmart NOVA is not liable for indirect, incidental, special, consequential, or punitive damages arising from your use of the Platform. Our total liability for any claim related to the Platform will not exceed the amount you paid us in the three months preceding the claim.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-white mb-4">10. Termination</h2>
            <p>
              We reserve the right to suspend or terminate your access to the Platform at any time for violation of these Terms, non-payment, or any other reason we determine is necessary to protect the Platform or other users. You may cancel your subscription at any time through the owner account portal.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-white mb-4">11. Modifications to Terms</h2>
            <p>
              We may update these Terms from time to time. We will notify customers of material changes by updating the effective date and, where appropriate, providing direct notice. Continued use of the Platform after changes take effect constitutes acceptance of the updated Terms.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-white mb-4">12. Governing Law</h2>
            <p>
              These Terms are governed by the laws of the jurisdiction in which PickSmart NOVA operates, without regard to conflict of law principles. Disputes will be resolved through binding arbitration or in the appropriate courts of that jurisdiction.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-white mb-4">13. Contact</h2>
            <p>For questions about these Terms, contact:</p>
            <div className="mt-4 rounded-2xl border border-slate-800 bg-slate-900 p-6">
              <p className="font-bold text-white">PickSmart NOVA — Legal Team</p>
              <p className="mt-2 text-yellow-400">legal@picksmartacademy.com</p>
            </div>
          </section>

        </div>

        <div className="mt-16 border-t border-slate-800 pt-8 flex gap-6 text-sm text-slate-500">
          <Link href="/privacy" className="hover:text-yellow-400 transition">Privacy Policy</Link>
          <Link href="/" className="hover:text-yellow-400 transition">Back to Home</Link>
        </div>
      </div>
    </div>
  );
}
