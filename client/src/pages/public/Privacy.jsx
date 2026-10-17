import React from 'react';
import { Shield, Lock, Eye, FileText } from 'lucide-react';

export default function Privacy() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-12 space-y-8">
      <div>
        <span className="text-xs font-bold text-fixteal-600 uppercase tracking-wider">
          Legal & Compliance
        </span>
        <h1 className="text-3xl font-extrabold text-fixblue-900 mt-1">
          FixAround Privacy Policy
        </h1>
        <p className="text-xs text-slate-400 mt-1">Last updated: October 2026</p>
      </div>

      <div className="bg-white p-6 sm:p-10 rounded-3xl border border-slate-200 shadow-xs prose prose-slate max-w-none text-xs sm:text-sm text-slate-600 leading-relaxed space-y-6">
        <section className="space-y-2">
          <h2 className="text-base font-bold text-fixblue-900">1. Information We Collect</h2>
          <p>
            When you create an account, request a service, or join as a technician on FixAround, we collect personal information necessary to deliver and protect services. This includes:
          </p>
          <ul className="list-disc pl-5 space-y-1">
            <li>Contact details: Name, verified email address, mobile phone number.</li>
            <li>Location data: Precise GPS coordinates or physical addresses provided for dispatch.</li>
            <li>Transaction information: Payment amounts, methods, invoices, and service histories.</li>
            <li>Technician verification docs: Government ID cards, certifications, and trade proof.</li>
          </ul>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-bold text-fixblue-900">2. How We Use Location Information</h2>
          <p>
            For emergency requests and proximity dispatch, FixAround uses your device's geographical coordinates to compute distances to nearby certified technicians using Haversine formulas. This enables immediate 30-minute response times and accurate estimated time of arrival (ETA). Location is shared with the assigned technician only for the duration of the active booking.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-bold text-fixblue-900">3. Payment Security & Banking Details</h2>
          <p>
            All digital payments are processed through PCI-DSS compliant secure payment gateway partners. FixAround never stores your full credit card credentials, CVV, or UPI PINs on our servers. Electronic receipts and tax invoices are securely archived in your dashboard.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-bold text-fixblue-900">4. Sharing with Third Parties</h2>
          <p>
            We do not sell, rent, or trade your personal information to third-party advertisers. Information is strictly shared with assigned service technicians (contact name, address, problem notes) to perform authorized repairs, or with law enforcement where legally required.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-bold text-fixblue-900">5. Your Privacy Rights & Data Erasure</h2>
          <p>
            You have the right to request access to your stored personal records, correct inaccurate profiles, or request account deactivation and data anonymization by contacting <a href="mailto:privacy@fixaround.com" className="text-fixteal-600 font-semibold underline">privacy@fixaround.com</a>.
          </p>
        </section>
      </div>
    </div>
  );
}
