import React from 'react';
import { Link } from 'react-router-dom';
import { Wrench, Phone, Mail, MapPin, Shield, Clock, Heart } from 'lucide-react';

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-fixblue-950 text-slate-300 border-t border-fixblue-900">
      {/* Top Banner */}
      <div className="border-b border-fixblue-900/60 bg-fixblue-900/40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center md:text-left">
            <div className="flex items-center justify-center md:justify-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-fixteal-500/20 text-fixteal-400 flex items-center justify-center shrink-0">
                <Clock className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-white">24/7 Rapid Emergency Response</h4>
                <p className="text-xs text-slate-400">Certified technicians at your door in 30 mins</p>
              </div>
            </div>

            <div className="flex items-center justify-center md:justify-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center shrink-0">
                <Shield className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-white">FixAround Warranty Protection</h4>
                <p className="text-xs text-slate-400">Up to 30 days free re-service guarantee</p>
              </div>
            </div>

            <div className="flex items-center justify-center md:justify-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
                <Phone className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-white">Emergency Support Line</h4>
                <p className="text-xs text-slate-400">Call toll-free: 1800-FIX-AROUND</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Footer Links */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-8">
          {/* Brand Info */}
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
              FixAround is India's premier smart local service platform connecting households and businesses with thoroughly verified, background-checked plumbers, electricians, AC technicians, and repair specialists.
            </p>

            <div className="space-y-2 text-xs text-slate-400 pt-2">
              <p className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-fixteal-400 shrink-0" />
                Connaught Place, Central Delhi, New Delhi 110001
              </p>
              <p className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-fixteal-400 shrink-0" />
                support@fixaround.com
              </p>
              <p className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-fixteal-400 shrink-0" />
                +91 90000 00001 / +91 1800-349-2768
              </p>
            </div>
          </div>

          {/* Quick Links */}
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
              <li><Link to="/services" className="text-fixteal-400 font-semibold hover:underline">All 12+ Categories &rarr;</Link></li>
            </ul>
          </div>

          {/* Company */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-white uppercase tracking-wider">
              Company
            </h4>
            <ul className="space-y-2 text-xs">
              <li><Link to="/about" className="hover:text-fixteal-400 transition-colors">About FixAround</Link></li>
              <li><Link to="/how-it-works" className="hover:text-fixteal-400 transition-colors">How It Works</Link></li>
              <li><Link to="/emergency" className="text-rose-400 font-semibold hover:underline">Emergency Repairs</Link></li>
              <li><Link to="/contact" className="hover:text-fixteal-400 transition-colors">Contact Support</Link></li>
              <li><Link to="/register-technician" className="hover:text-fixteal-400 transition-colors">Join as Technician</Link></li>
            </ul>
          </div>

          {/* Legal & Trust */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-white uppercase tracking-wider">
              Trust & Legal
            </h4>
            <ul className="space-y-2 text-xs">
              <li><Link to="/privacy" className="hover:text-fixteal-400 transition-colors">Privacy Policy</Link></li>
              <li><Link to="/terms" className="hover:text-fixteal-400 transition-colors">Terms of Service</Link></li>
              <li><span className="text-slate-400">100% Background Checked</span></li>
              <li><span className="text-slate-400">Transparent Pricing</span></li>
              <li><span className="text-slate-400">Escrow Secure Payments</span></li>
            </ul>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-fixblue-900 bg-fixblue-950/80 py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <p>© {currentYear} FixAround Technologies India Pvt. Ltd. All rights reserved.</p>
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
