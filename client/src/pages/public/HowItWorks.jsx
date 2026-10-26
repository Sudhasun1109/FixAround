import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import Button from '../../components/common/Button';
import {
  Search,
  CheckCircle,
  Calendar,
  AlertTriangle,
  CreditCard,
  Shield,
  HelpCircle,
  ChevronDown,
  ChevronUp,
  ArrowRight,
} from 'lucide-react';

const FAQS = [
  {
    q: 'How does the FixAround price guarantee work?',
    a: 'Every technician is obligated to inspect the repair site and submit a detailed, itemized electronic estimate before commencing any work. You have complete control to review and approve or reject the quote. Technicians cannot bill beyond approved amounts.',
  },
  {
    q: 'What is the response time for Emergency Repairs?',
    a: 'When you trigger an Emergency Request, our smart dispatch system notifies all active verified technicians within a 10 km radius. If the first technician does not acknowledge within 2 minutes, the system immediately cascades to backup technicians until accepted. Typical arrival is under 30 minutes.',
  },
  {
    q: 'What is covered under the FixAround Warranty?',
    a: 'Every completed repair is covered by the FixAround Service Quality Guarantee. If the exact problem recurs during this period, you can file a 1-click warranty claim in your dashboard for a free inspection and re-service.',
  },
  {
    q: 'Are all FixAround technicians background checked?',
    a: 'Yes. Before any technician is authorized on the platform, our operations team verifies government identity proofs, criminal record history, address validity, and evaluates trade certifications and practical experience.',
  },
  {
    q: 'Can I pay online or in cash?',
    a: 'FixAround supports digital payments via UPI, Credit/Debit cards, Net Banking, and wallet integration, as well as Cash on Service. For maximum dispute protection and warranty activation, digital checkout is recommended.',
  },
];

export default function HowItWorks() {
  const [openFaq, setOpenFaq] = useState(null);

  const toggleFaq = (idx) => {
    setOpenFaq(openFaq === idx ? null : idx);
  };

  return (
    <div className="space-y-16 py-12">
      {/* Title Header */}
      <section className="max-w-4xl mx-auto px-4 text-center">
        <span className="text-xs font-bold text-fixteal-600 uppercase tracking-wider">
          Simple, Safe & Transparent
        </span>
        <h1 className="text-3xl sm:text-5xl font-extrabold text-fixblue-900 mt-2">
          How FixAround Works
        </h1>
        <p className="mt-4 text-base text-slate-600 leading-relaxed max-w-2xl mx-auto">
          We reimagined home repairs by eliminating ambiguous estimates, missing handymen, and safety concerns.
        </p>
      </section>

      {/* 4 Steps Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="p-8 rounded-2xl bg-white border border-slate-200 shadow-xs flex gap-5">
            <div className="w-12 h-12 rounded-xl bg-fixblue-900 text-white flex items-center justify-center font-bold text-lg shrink-0">
              1
            </div>
            <div>
              <h3 className="text-lg font-bold text-fixblue-900 mb-2">Book Online in 60 Seconds</h3>
              <p className="text-xs sm:text-sm text-slate-500 leading-relaxed">
                Choose the service you need from electrical, plumbing, AC repair, carpentry, and more. Describe your issue, select your address, and choose standard scheduling or emergency dispatch.
              </p>
            </div>
          </div>

          <div className="p-8 rounded-2xl bg-white border border-slate-200 shadow-xs flex gap-5">
            <div className="w-12 h-12 rounded-xl bg-fixteal-600 text-white flex items-center justify-center font-bold text-lg shrink-0">
              2
            </div>
            <div>
              <h3 className="text-lg font-bold text-fixblue-900 mb-2">Smart Technician Matching</h3>
              <p className="text-xs sm:text-sm text-slate-500 leading-relaxed">
                Our automated dispatch assigns the closest verified professional. Track their status live from "Accepted" to "On the way" and "Arrived at your door".
              </p>
            </div>
          </div>

          <div className="p-8 rounded-2xl bg-white border border-slate-200 shadow-xs flex gap-5">
            <div className="w-12 h-12 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-bold text-lg shrink-0">
              3
            </div>
            <div>
              <h3 className="text-lg font-bold text-fixblue-900 mb-2">Pre-Job Itemized Approval</h3>
              <p className="text-xs sm:text-sm text-slate-500 leading-relaxed">
                The technician inspects the site and submits an exact digital breakdown of labor, parts, and inspection fees. You inspect the estimate and tap Approve before any tools touch your home.
              </p>
            </div>
          </div>

          <div className="p-8 rounded-2xl bg-white border border-slate-200 shadow-xs flex gap-5">
            <div className="w-12 h-12 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold text-lg shrink-0">
              4
            </div>
            <div>
              <h3 className="text-lg font-bold text-fixblue-900 mb-2">Completion & Warranty Protection</h3>
              <p className="text-xs sm:text-sm text-slate-500 leading-relaxed">
                Once satisfied, pay securely and download your official invoice. Your repair is backed by FixAround warranty with hassle-free re-service coverage.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Emergency vs Standard Comparison */}
      <section className="bg-slate-100 py-16">
        <div className="max-w-5xl mx-auto px-4">
          <div className="text-center mb-10">
            <h2 className="text-2xl font-bold text-fixblue-900">
              Standard Service vs. 24/7 Emergency Dispatch
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              Choose the mode that fits your timeline and urgency.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
              <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-blue-100 text-blue-800">
                Standard Booking
              </span>
              <h3 className="text-lg font-bold text-slate-900 mt-3 mb-2">
                Planned Maintenance & Upgrades
              </h3>
              <ul className="space-y-2 text-xs text-slate-600">
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0" />
                  Select your preferred date and time slot
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0" />
                  Browse technician profiles and choose specific specialists
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0" />
                  Standard visiting / inspection fee applies
                </li>
              </ul>
            </div>

            <div className="bg-rose-50/50 p-6 rounded-2xl border border-rose-200 shadow-xs">
              <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-rose-100 text-rose-800">
                Emergency Dispatch
              </span>
              <h3 className="text-lg font-bold text-slate-900 mt-3 mb-2">
                Urgent Repairs & Hazards
              </h3>
              <ul className="space-y-2 text-xs text-slate-700">
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-rose-600 shrink-0" />
                  Immediate automatic dispatch to nearest active tech
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-rose-600 shrink-0" />
                  Auto-failover cascade within 2-minute deadline
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-rose-600 shrink-0" />
                  Average arrival in under 30 minutes
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* FAQS Accordion */}
      <section className="max-w-4xl mx-auto px-4">
        <div className="text-center mb-10">
          <span className="text-xs font-bold text-fixteal-600 uppercase tracking-wider">
            Got Questions?
          </span>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-fixblue-900 mt-1">
            Frequently Asked Questions
          </h2>
        </div>

        <div className="space-y-3">
          {FAQS.map((faq, idx) => {
            const isOpen = openFaq === idx;
            return (
              <div
                key={idx}
                className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-2xs"
              >
                <button
                  type="button"
                  onClick={() => toggleFaq(idx)}
                  className="w-full flex items-center justify-between p-5 text-left font-bold text-slate-800 hover:text-fixblue-900 transition-colors"
                >
                  <span className="text-sm sm:text-base pr-4">{faq.q}</span>
                  {isOpen ? (
                    <ChevronUp className="w-5 h-5 text-fixteal-600 shrink-0" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-slate-400 shrink-0" />
                  )}
                </button>

                {isOpen && (
                  <div className="px-5 pb-5 text-xs sm:text-sm text-slate-600 leading-relaxed border-t border-slate-100 pt-3">
                    {faq.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* CTA Box */}
      <section className="max-w-5xl mx-auto px-4">
        <div className="p-8 sm:p-12 rounded-3xl bg-fixblue-900 text-white text-center space-y-4">
          <h2 className="text-2xl sm:text-3xl font-extrabold">Ready to solve your repair today?</h2>
          <p className="text-xs sm:text-sm text-slate-300 max-w-xl mx-auto">
            Book certified plumbers, electricians, and technicians in your neighborhood now.
          </p>
          <div className="pt-2 flex justify-center gap-4">
            <Link to="/services">
              <Button variant="secondary" size="lg" icon={ArrowRight}>
                Book a Service
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
