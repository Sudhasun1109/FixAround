import React from 'react';
import { Link } from 'react-router-dom';
import { Wrench, Phone, Mail, MapPin, Shield, Clock } from 'lucide-react';

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-fixblue-950 text-slate-300 border-t border-fixblue-900/80">
      {/* Top Value Proposition Banner */}
      <div className="border-b border-fixblue-900/60 bg-fixblue-900/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center md:text-left">
            <div className="flex items-center justify-center md:justify-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-fixteal-500/15 text-fixteal-400 flex items-center justify-center shrink-0 border border-fixteal-500/20">
                <Clock className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-white">24/7 Rapid Emergency Response</h4>
                <p className="text-xs text-slate-400">Certified technicians ready for immediate dispatch</p>
              </div>
            </div>

            <div className="flex items-center justify-center md:justify-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-500/15 text-indigo-400 flex items-center justify-center shrink-0 border border-indigo-500/20">
                <Shield className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-white">FixAround Verified Network</h4>
                <p className="text-xs text-slate-400">Identity & skill verified doorstep professionals</p>
              </div>
            </div>

            <div className="flex items-center justify-center md:justify-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/15 text-emerald-400 flex items-center justify-center shrink-0 border border-emerald-500/20">
                <Phone className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-white">Direct Helpline & Inquiries</h4>
                <p className="text-xs text-slate-400">
                  Call:{' '}
                  <a
                    href="tel:9597993402"
                    className="font-bold text-white hover:text-fixteal-300 transition-colors"
                  >
                    9597993402
                  </a>
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Footer Links */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-8">
          {/* Brand & Direct Contact Details */}
          <div className="lg:col-span-2 space-y-4">
            <Link to="/" className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-xl bg-fixteal-600 flex items-center justify-center text-white shadow-md">
                <Wrench className="w-5 h-5" />
              </div>
              <span className="text-2xl font-extrabold tracking-tight text-white">
                Fix<span className="text-fixteal-400">Around</span>
              </span>
            </Link>

            <p className="text-xs text-slate-400 leading-relaxed max-w-sm">
              FixAround is a smart local service marketplace connecting households and businesses with verified electricians, plumbers, appliance technicians, and home maintenance specialists.
            </p>

            <div className="space-y-2.5 text-xs text-slate-300 pt-2">
              <div className="flex items-center gap-2.5">
                <MapPin className="w-4 h-4 text-fixteal-400 shrink-0" aria-hidden="true" />
                <span className="font-medium text-slate-200">Tiruppur, Tamil Nadu</span>
              </div>
              <div className="flex items-center gap-2.5">
                <Mail className="w-4 h-4 text-fixteal-400 shrink-0" aria-hidden="true" />
                <a
                  href="mailto:vichudass15@gmail.com"
                  className="text-slate-300 hover:text-fixteal-300 transition-colors focus:outline-none focus:underline"
                >
                  vichudass15@gmail.com
                </a>
              </div>
              <div className="flex items-center gap-2.5">
                <Phone className="w-4 h-4 text-fixteal-400 shrink-0" aria-hidden="true" />
                <a
                  href="tel:9597993402"
                  className="font-semibold text-slate-200 hover:text-fixteal-300 transition-colors focus:outline-none focus:underline"
                >
                  9597993402
                </a>
              </div>
            </div>
          </div>

          {/* Popular Services */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-white uppercase tracking-wider">
              Popular Services
            </h4>
            <ul className="space-y-2 text-xs">
              <li><Link to="/services/electrician" className="hover:text-fixteal-400 transition-colors">Electricians</Link></li>
              <li><Link to="/services/plumber" className="hover:text-fixteal-400 transition-colors">Plumbers</Link></li>
              <li><Link to="/services/ac-repair" className="hover:text-fixteal-400 transition-colors">AC Repair & Service</Link></li>
              <li><Link to="/services/appliance-repair" className="hover:text-fixteal-400 transition-colors">Appliance Repair</Link></li>
              <li><Link to="/services/carpenter" className="hover:text-fixteal-400 transition-colors">Carpentry Work</Link></li>
              <li><Link to="/services" className="text-fixteal-400 font-semibold hover:underline">All Services &rarr;</Link></li>
            </ul>
          </div>

          {/* Platform Links */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-white uppercase tracking-wider">
              FixAround
            </h4>
            <ul className="space-y-2 text-xs">
              <li><Link to="/about" className="hover:text-fixteal-400 transition-colors">About Us</Link></li>
              <li><Link to="/how-it-works" className="hover:text-fixteal-400 transition-colors">How It Works</Link></li>
              <li><Link to="/emergency" className="text-rose-400 font-semibold hover:underline">Emergency Repairs</Link></li>
              <li><Link to="/contact" className="hover:text-fixteal-400 transition-colors">Contact Support</Link></li>
              <li><Link to="/register-technician" className="hover:text-fixteal-400 transition-colors">Join as Technician</Link></li>
            </ul>
          </div>

          {/* Trust & Guarantees */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-white uppercase tracking-wider">
              Trust & Security
            </h4>
            <ul className="space-y-2 text-xs text-slate-400">
              <li><Link to="/privacy" className="hover:text-fixteal-400 transition-colors">Privacy Policy</Link></li>
              <li><Link to="/terms" className="hover:text-fixteal-400 transition-colors">Terms of Service</Link></li>
              <li className="text-slate-400">Verified Technicians</li>
              <li className="text-slate-400">Upfront Estimates</li>
              <li className="text-slate-400">Escrow Payments</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-fixblue-900 bg-fixblue-950/80 py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <p>© {currentYear} FixAround. All rights reserved.</p>
          <div className="flex items-center gap-6">
            <Link to="/privacy" className="hover:text-slate-400 transition-colors">Privacy</Link>
            <Link to="/terms" className="hover:text-slate-400 transition-colors">Terms</Link>
            <Link to="/contact" className="hover:text-slate-400 transition-colors">Support</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
