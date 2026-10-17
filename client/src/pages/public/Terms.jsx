import React from 'react';

export default function Terms() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-12 space-y-8">
      <div>
        <span className="text-xs font-bold text-fixteal-600 uppercase tracking-wider">
          Legal Agreement
        </span>
        <h1 className="text-3xl font-extrabold text-fixblue-900 mt-1">
          FixAround Terms & Conditions
        </h1>
        <p className="text-xs text-slate-400 mt-1">Effective: October 2026</p>
      </div>

      <div className="bg-white p-6 sm:p-10 rounded-3xl border border-slate-200 shadow-xs prose prose-slate max-w-none text-xs sm:text-sm text-slate-600 leading-relaxed space-y-6">
        <section className="space-y-2">
          <h2 className="text-base font-bold text-fixblue-900">1. Acceptance of Terms</h2>
          <p>
            By accessing or using the FixAround application, website, and services, you agree to be bound by these Terms and Conditions. If you do not agree with any provision, you may not register or book services on the platform.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-bold text-fixblue-900">2. Service Booking & Transparent Estimates</h2>
          <p>
            FixAround serves as an automated platform connecting consumers with independent certified technicians. Prior to beginning work, the assigned professional must submit an itemized electronic estimate outlining labor, materials, and inspection fees. Customer approval is required before execution. Work performed outside the approved estimate cannot be enforced or billed.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-bold text-fixblue-900">3. Emergency Dispatch & Response Times</h2>
          <p>
            Emergency requests trigger immediate automated cascading matching. While our target dispatch time is 30 minutes, actual arrival times may vary based on traffic conditions, weather events, or road closures. Customers agree to provide accurate access directions and phone availability.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-bold text-fixblue-900">4. Warranty Claims & Re-Service</h2>
          <p>
            Every completed job carries a platform warranty according to the specific service category (typically 3 to 30 days). If the exact identical repair fails within this timeframe, the customer may file a warranty claim. FixAround will dispatch an authorized technician for inspection and resolution at no additional service cost.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-bold text-fixblue-900">5. Cancellations & Disputes</h2>
          <p>
            Customers may cancel standard bookings free of charge before technician arrival. If cancellation occurs after the technician has arrived on-site, a standard inspection charge may apply. In case of disputes regarding quality, damages, or billing, customers may raise an official platform dispute for administrator moderation.
          </p>
        </section>
      </div>
    </div>
  );
}
