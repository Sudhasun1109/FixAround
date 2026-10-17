import React from 'react';
import { Link } from 'react-router-dom';
import Button from '../../components/common/Button';
import { ShieldCheck, Target, HeartHandshake, Award, Users, Wrench, CheckCircle } from 'lucide-react';

export default function About() {
  return (
    <div className="space-y-16 py-12">
      {/* Hero */}
      <section className="max-w-4xl mx-auto px-4 text-center">
        <span className="text-xs font-bold text-fixteal-600 uppercase tracking-wider">
          About FixAround
        </span>
        <h1 className="text-3xl sm:text-5xl font-extrabold text-fixblue-900 mt-2">
          Empowering Local Craftsmanship with Technology
        </h1>
        <p className="mt-4 text-base text-slate-600 leading-relaxed max-w-2xl mx-auto">
          We built FixAround with one clear mission: to bring trust, transparent pricing, and rapid response to local home repair services across India.
        </p>
      </section>

      {/* Mission & Vision */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="p-8 rounded-3xl bg-white border border-slate-200 shadow-xs space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-fixblue-50 text-fixblue-800 flex items-center justify-center">
              <Target className="w-6 h-6" />
            </div>
            <h2 className="text-xl font-bold text-fixblue-900">Our Mission</h2>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              To eliminate friction and uncertainty in home maintenance. We ensure households have immediate access to dignified, certified technicians with honest upfront quotes and rock-solid warranty backing.
            </p>
          </div>

          <div className="p-8 rounded-3xl bg-white border border-slate-200 shadow-xs space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-teal-50 text-fixteal-600 flex items-center justify-center">
              <HeartHandshake className="w-6 h-6" />
            </div>
            <h2 className="text-xl font-bold text-fixblue-900">Empowering Technicians</h2>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              We empower skilled local electricians, mechanics, and plumbers with steady demand, digital settlement tools, career development, and fair payouts — helping them grow reputable businesses.
            </p>
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="bg-slate-100 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <span className="text-xs font-bold text-fixteal-600 uppercase tracking-wider">
              Core Principles
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-fixblue-900 mt-1">
              What We Stand For
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-xs">
              <ShieldCheck className="w-8 h-8 text-fixteal-600 mb-3" />
              <h4 className="text-base font-bold text-fixblue-900 mb-1">Uncompromising Safety</h4>
              <p className="text-xs text-slate-500 leading-relaxed">
                Comprehensive government KYC, background checks, and identity validation before any pro enters a home.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-xs">
              <Award className="w-8 h-8 text-fixblue-800 mb-3" />
              <h4 className="text-base font-bold text-fixblue-900 mb-1">Price Integrity</h4>
              <p className="text-xs text-slate-500 leading-relaxed">
                No hidden costs. Every job requires an itemized electronic estimate approved by the customer beforehand.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-xs">
              <Wrench className="w-8 h-8 text-indigo-600 mb-3" />
              <h4 className="text-base font-bold text-fixblue-900 mb-1">Workmanship Guarantee</h4>
              <p className="text-xs text-slate-500 leading-relaxed">
                Every repair is backed by a platform warranty for free re-service if the issue reoccurs.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-xs">
              <Users className="w-8 h-8 text-emerald-600 mb-3" />
              <h4 className="text-base font-bold text-fixblue-900 mb-1">Community First</h4>
              <p className="text-xs text-slate-500 leading-relaxed">
                Supporting neighborhood tradespeople and elevating local employment with dignified earnings.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Join the Team / Network CTA */}
      <section className="max-w-4xl mx-auto px-4 text-center">
        <div className="p-8 sm:p-12 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-4">
          <h3 className="text-2xl font-bold text-fixblue-900">Are You a Skilled Professional?</h3>
          <p className="text-xs sm:text-sm text-slate-500 max-w-xl mx-auto leading-relaxed">
            Join thousands of electricians, plumbers, and mechanics who earn dependable income with FixAround.
          </p>
          <div className="pt-2 flex justify-center gap-3">
            <Link to="/register-technician">
              <Button variant="secondary" size="md">
                Register as a Technician
              </Button>
            </Link>
            <Link to="/contact">
              <Button variant="outline" size="md">
                Contact Operations
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
