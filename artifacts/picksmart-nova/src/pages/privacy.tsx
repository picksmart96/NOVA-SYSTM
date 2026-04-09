import { Link } from "wouter";

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <div className="mx-auto max-w-3xl px-6 py-16">

        <div className="mb-12">
          <Link href="/" className="text-sm text-yellow-400 hover:underline">← Back to Home</Link>
          <p className="mt-6 text-xs font-bold uppercase tracking-widest text-yellow-400">Privacy</p>
          <h1 className="mt-3 text-5xl font-black">Privacy & Data Protection</h1>
          <p className="mt-4 text-slate-400 text-lg">Effective date: January 1, 2025 · PickSmart NOVA</p>
        </div>

        <div className="space-y-10 text-slate-300 leading-relaxed">

          <section>
            <h2 className="text-2xl font-bold text-white mb-4">Warehouse Account Isolation</h2>
            <p>
              At PickSmart NOVA, we treat each warehouse account as a private, separate environment.
              Customer teams are not permitted to access another customer's assignments, users,
              messages, reports, training records, sessions, or operational data. Access to data
              inside each warehouse account is controlled by role-based permissions and limited to
              authorized users within that account.
            </p>
            <p className="mt-4">
              We design and operate the platform so that one customer's warehouse data remains
              private, isolated, and restricted from other customers. We do not share one customer's
              warehouse data with another customer team.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-white mb-4">Information We Collect</h2>
            <p>We collect and use information only as needed to provide, secure, support, maintain, and improve the platform. Depending on how the service is used, this may include:</p>
            <ul className="mt-4 space-y-2 list-disc list-inside text-slate-300">
              <li>Account information (username, role, subscription plan)</li>
              <li>User profile details (name, warehouse location, shift type)</li>
              <li>Training activity and assignment progress</li>
              <li>NOVA session data and voice interaction logs</li>
              <li>Community activity (posts, comments, reactions in Selector Breaking News)</li>
              <li>Device and browser information for service delivery</li>
              <li>Support communications</li>
              <li>Other operational usage data needed to run the platform</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-white mb-4">How We Use Information</h2>
            <p>Customer data is used only to operate, support, secure, and improve the service. Specific uses include:</p>
            <ul className="mt-4 space-y-2 list-disc list-inside text-slate-300">
              <li>Providing training modules, NOVA coaching tools, and dashboard functionality</li>
              <li>Maintaining role-based access controls and warehouse isolation</li>
              <li>Sending relevant service communications (account confirmations, invite links)</li>
              <li>Detecting, investigating, and preventing security incidents and policy violations</li>
              <li>Improving and debugging platform features</li>
              <li>Complying with legal obligations where applicable</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-white mb-4">Data Sharing</h2>
            <p>
              We do not sell, rent, or trade customer data. We may share information only in the following limited circumstances:
            </p>
            <ul className="mt-4 space-y-2 list-disc list-inside text-slate-300">
              <li>With approved service providers that help us operate the platform, under confidentiality obligations</li>
              <li>When required by law, court order, or valid legal process</li>
              <li>To protect the safety, rights, or property of PickSmart NOVA or its users</li>
              <li>In connection with a business transfer, merger, or acquisition (with notice to affected customers where required)</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-white mb-4">Role-Based Access Controls</h2>
            <p>
              Access inside the platform is restricted by role. Selectors, trainers, supervisors, managers, and owners each have defined permissions. Sensitive administrative controls — including user management, warehouse configuration, and platform-wide settings — are restricted to the owner account. We enforce these restrictions at both the interface and application level.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-white mb-4">AI Features (NOVA Help)</h2>
            <p>
              If your warehouse uses NOVA Help (powered by AI language models), customer inputs and AI-generated responses are processed under our service's privacy and security controls. Where OpenAI's business API is used, OpenAI states that business and API customer data is not used to train models by default, and that customers own and control their business data. We do not use NOVA Help inputs to build or train external AI models.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-white mb-4">Security Safeguards</h2>
            <p>
              We use reasonable administrative, technical, and organizational safeguards designed to protect customer data, including access restrictions, authentication controls, role-based permissions, and data protection practices appropriate for the service. Because no system can provide absolute security, our commitment is to implement, maintain, and continually improve safeguards consistent with the risks of the service and the data we process.
            </p>
            <p className="mt-4">
              Security-sensitive actions — including invitations, bans, role changes, and administrative access — are logged for audit purposes.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-white mb-4">Data Retention</h2>
            <p>
              We retain customer data for as long as needed to provide the service and meet legal obligations. When a warehouse account is closed, we work to remove associated data in a reasonable timeframe, except where retention is required by law or legitimate business need.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-white mb-4">California Privacy Rights</h2>
            <p>
              If you are a California resident and your use falls within applicable law, you may have rights relating to access, deletion, correction, and information about how personal information is used, subject to exceptions and legal requirements. Contact us at the address below to make a request or learn more about your rights under the California Consumer Privacy Act (CCPA) and related regulations.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-white mb-4">Contact Us</h2>
            <p>
              For privacy questions, account requests, data deletion inquiries, or security concerns, please contact:
            </p>
            <div className="mt-4 rounded-2xl border border-slate-800 bg-slate-900 p-6">
              <p className="font-bold text-white">PickSmart NOVA — Privacy Team</p>
              <p className="mt-2 text-yellow-400">privacy@picksmartacademy.com</p>
              <p className="mt-1 text-slate-400 text-sm">We will respond to all privacy requests within a reasonable timeframe.</p>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-white mb-4">Policy Updates</h2>
            <p>
              We may update this Privacy Policy from time to time. When we make material changes, we will update the effective date at the top of this page and, where appropriate, notify affected customers. Continued use of the platform after changes are posted constitutes acceptance of the updated policy.
            </p>
          </section>

        </div>

        <div className="mt-16 border-t border-slate-800 pt-8 flex gap-6 text-sm text-slate-500">
          <Link href="/terms" className="hover:text-yellow-400 transition">Terms of Service</Link>
          <Link href="/" className="hover:text-yellow-400 transition">Back to Home</Link>
        </div>
      </div>
    </div>
  );
}
