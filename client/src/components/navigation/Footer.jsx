import React from 'react';
import { Link } from 'react-router-dom';
import {
  MapPin,
  Mail,
  Phone,
  Clock,
  ArrowRight,
  ShieldCheck,
  Instagram,
  Facebook,
  Linkedin,
  Youtube,
  Sparkles,
} from 'lucide-react';

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="relative bg-[#101D2B] text-[#A9B0B8] border-t border-[#354252]/60 overflow-hidden font-sans">
      {/* Subtle ambient luxury background highlight */}
      <div 
        className="pointer-events-none absolute -top-40 right-1/4 w-96 h-96 bg-[#C5A46D]/5 rounded-full blur-3xl"
        aria-hidden="true" 
      />

      {/* ==================================================
          1. PRE-FOOTER LUXURY CALL TO ACTION (CTA)
          ================================================== */}
      <section 
        className="relative bg-[#17283A] border-b border-[#354252]/70 py-12 lg:py-16 px-4 sm:px-6 lg:px-8"
        aria-label="Footer Call to Action"
      >
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col lg:flex-row items-center justify-between gap-8 text-center lg:text-left">
            <div className="max-w-2xl space-y-3">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#C5A46D]/10 border border-[#C5A46D]/30 text-[#C5A46D] text-xs font-semibold tracking-wider uppercase">
                <Sparkles className="w-3.5 h-3.5" aria-hidden="true" />
                <span>Excellence in Home Care</span>
              </div>
              <h2 className="font-serif text-2xl sm:text-3xl lg:text-4xl font-semibold text-[#FFFFFF] tracking-tight leading-snug">
                Your Home Deserves Professional Care.
              </h2>
              <p className="text-sm sm:text-base text-[#A9B0B8] font-normal leading-relaxed">
                Discover dependable local professionals and experience a smarter, seamless way to manage your home repairs and regular maintenance.
              </p>
            </div>

            <div className="shrink-0 flex flex-col sm:flex-row items-center gap-4">
              <Link
                to="/services"
                className="group inline-flex items-center gap-3 px-8 py-4 rounded-full bg-[#C5A46D] hover:bg-[#D8B881] text-[#101D2B] font-bold text-xs sm:text-sm tracking-[0.14em] uppercase transition-all duration-300 shadow-lg shadow-[#C5A46D]/20 hover:shadow-[#C5A46D]/40 hover:-translate-y-0.5"
              >
                <span>EXPLORE OUR SERVICES</span>
                <ArrowRight className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-1" aria-hidden="true" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ==================================================
          2. MAIN 4-COLUMN CORPORATE FOOTER
          ================================================== */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-20">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-10 lg:gap-12">
          
          {/* COLUMN 1 (35% on Desktop): Brand Identity */}
          <div className="lg:col-span-5 space-y-6">
            <div className="space-y-2">
              <Link to="/" className="inline-flex items-center gap-3 group focus:outline-none">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#17283A] to-[#101D2B] border border-[#C5A46D]/40 flex items-center justify-center text-[#C5A46D] shadow-md group-hover:border-[#C5A46D] transition-colors">
                  <span className="font-serif font-bold text-xl text-[#C5A46D]">F</span>
                </div>
                <div className="flex flex-col">
                  <span className="font-serif text-2xl font-bold tracking-[0.15em] text-[#FFFFFF]">
                    FIXAROUND
                  </span>
                </div>
              </Link>
              <div className="text-[10px] sm:text-[11px] font-semibold tracking-[0.2em] text-[#C5A46D] uppercase">
                SMART LOCAL SERVICE. TRUSTED PROFESSIONALS.
              </div>
            </div>

            {/* Champagne Gold Accent Line */}
            <div className="w-12 h-[2px] bg-[#C5A46D] rounded-full" aria-hidden="true" />

            <p className="text-xs sm:text-sm text-[#A9B0B8] leading-relaxed max-w-sm">
              FixAround connects discerning homeowners and property managers with credentialed, background-verified specialists. Built on precision, accountability, and dependable craftsmanship.
            </p>

            {/* Social Media Links */}
            <div className="pt-2">
              <div className="text-[11px] font-semibold uppercase tracking-[0.15em] text-[#FFFFFF]/80 mb-3">
                Connect With Us
              </div>
              <div className="flex items-center gap-3">
                <a
                  href="https://instagram.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="FixAround on Instagram"
                  className="w-9 h-9 rounded-full bg-[#17283A] border border-[#354252] flex items-center justify-center text-[#A9B0B8] hover:text-[#C5A46D] hover:border-[#C5A46D] hover:bg-[#C5A46D]/10 hover:-translate-y-0.5 transition-all duration-300"
                >
                  <Instagram className="w-4 h-4" />
                </a>
                <a
                  href="https://facebook.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="FixAround on Facebook"
                  className="w-9 h-9 rounded-full bg-[#17283A] border border-[#354252] flex items-center justify-center text-[#A9B0B8] hover:text-[#C5A46D] hover:border-[#C5A46D] hover:bg-[#C5A46D]/10 hover:-translate-y-0.5 transition-all duration-300"
                >
                  <Facebook className="w-4 h-4" />
                </a>
                <a
                  href="https://linkedin.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="FixAround on LinkedIn"
                  className="w-9 h-9 rounded-full bg-[#17283A] border border-[#354252] flex items-center justify-center text-[#A9B0B8] hover:text-[#C5A46D] hover:border-[#C5A46D] hover:bg-[#C5A46D]/10 hover:-translate-y-0.5 transition-all duration-300"
                >
                  <Linkedin className="w-4 h-4" />
                </a>
                <a
                  href="https://youtube.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="FixAround on YouTube"
                  className="w-9 h-9 rounded-full bg-[#17283A] border border-[#354252] flex items-center justify-center text-[#A9B0B8] hover:text-[#C5A46D] hover:border-[#C5A46D] hover:bg-[#C5A46D]/10 hover:-translate-y-0.5 transition-all duration-300"
                >
                  <Youtube className="w-4 h-4" />
                </a>
              </div>
            </div>
          </div>

          {/* COLUMN 2 (20% on Desktop): The Company */}
          <div className="lg:col-span-2 space-y-4">
            <h3 className="text-xs font-semibold tracking-[0.22em] text-[#FFFFFF] uppercase pb-2.5 border-b border-[#354252]/60">
              THE COMPANY
            </h3>
            <ul className="space-y-2.5 text-xs">
              <li>
                <Link to="/" className="text-[#A9B0B8] hover:text-[#F5F3EE] hover:translate-x-1 inline-block transition-transform duration-200">
                  Home
                </Link>
              </li>
              <li>
                <Link to="/about" className="text-[#A9B0B8] hover:text-[#F5F3EE] hover:translate-x-1 inline-block transition-transform duration-200">
                  About FixAround
                </Link>
              </li>
              <li>
                <Link to="/how-it-works" className="text-[#A9B0B8] hover:text-[#F5F3EE] hover:translate-x-1 inline-block transition-transform duration-200">
                  How It Works
                </Link>
              </li>
              <li>
                <Link to="/services" className="text-[#A9B0B8] hover:text-[#F5F3EE] hover:translate-x-1 inline-block transition-transform duration-200">
                  Our Services
                </Link>
              </li>
              <li>
                <Link to="/search" className="text-[#A9B0B8] hover:text-[#F5F3EE] hover:translate-x-1 inline-block transition-transform duration-200">
                  Find Professionals
                </Link>
              </li>
              <li>
                <Link to="/contact" className="text-[#A9B0B8] hover:text-[#F5F3EE] hover:translate-x-1 inline-block transition-transform duration-200">
                  Contact Us
                </Link>
              </li>
              <li>
                <Link to="/register-technician" className="text-[#C5A46D] hover:text-[#D8B881] hover:translate-x-1 inline-block font-medium transition-transform duration-200">
                  Partner with Us &rarr;
                </Link>
              </li>
            </ul>
          </div>

          {/* COLUMN 3 (20% on Desktop): Our Services */}
          <div className="lg:col-span-2 space-y-4">
            <h3 className="text-xs font-semibold tracking-[0.22em] text-[#FFFFFF] uppercase pb-2.5 border-b border-[#354252]/60">
              OUR SERVICES
            </h3>
            <ul className="space-y-2.5 text-xs">
              <li>
                <Link to="/search?q=Plumber" className="text-[#A9B0B8] hover:text-[#C5A46D] hover:translate-x-1 inline-block transition-transform duration-200">
                  Plumbing Services
                </Link>
              </li>
              <li>
                <Link to="/search?q=Electrician" className="text-[#A9B0B8] hover:text-[#C5A46D] hover:translate-x-1 inline-block transition-transform duration-200">
                  Electrical Solutions
                </Link>
              </li>
              <li>
                <Link to="/search?q=Carpenter" className="text-[#A9B0B8] hover:text-[#C5A46D] hover:translate-x-1 inline-block transition-transform duration-200">
                  Carpentry & Woodwork
                </Link>
              </li>
              <li>
                <Link to="/search?q=AC" className="text-[#A9B0B8] hover:text-[#C5A46D] hover:translate-x-1 inline-block transition-transform duration-200">
                  Air Conditioning & HVAC
                </Link>
              </li>
              <li>
                <Link to="/search?q=Painter" className="text-[#A9B0B8] hover:text-[#C5A46D] hover:translate-x-1 inline-block transition-transform duration-200">
                  Architectural Painting
                </Link>
              </li>
              <li>
                <Link to="/search?q=Appliance" className="text-[#A9B0B8] hover:text-[#C5A46D] hover:translate-x-1 inline-block transition-transform duration-200">
                  Appliance Maintenance
                </Link>
              </li>
              <li>
                <Link to="/search?q=Cleaning" className="text-[#A9B0B8] hover:text-[#C5A46D] hover:translate-x-1 inline-block transition-transform duration-200">
                  Home Deep Cleaning
                </Link>
              </li>
              <li>
                <Link to="/emergency" className="text-[#C5A46D] font-semibold hover:text-[#D8B881] hover:translate-x-1 inline-block transition-transform duration-200">
                  24/7 Emergency Repairs
                </Link>
              </li>
            </ul>
          </div>

          {/* COLUMN 4 (25% on Desktop): Get In Touch */}
          <div className="lg:col-span-3 space-y-4">
            <h3 className="text-xs font-semibold tracking-[0.22em] text-[#FFFFFF] uppercase pb-2.5 border-b border-[#354252]/60">
              GET IN TOUCH
            </h3>
            <address className="not-italic space-y-3.5 text-xs text-[#A9B0B8]">
              {/* Email */}
              <div className="flex items-start gap-3 group">
                <div className="w-8 h-8 rounded-lg bg-[#17283A] border border-[#354252] flex items-center justify-center text-[#C5A46D] shrink-0 group-hover:border-[#C5A46D]/60 transition-colors">
                  <Mail className="w-3.5 h-3.5" aria-hidden="true" />
                </div>
                <div className="space-y-0.5">
                  <div className="text-[10px] uppercase tracking-wider text-[#A9B0B8]/80">Client Support</div>
                  <a
                    href="mailto:support@fixaround.com"
                    className="block text-[#F5F3EE] hover:text-[#C5A46D] transition-colors font-medium"
                  >
                    support@fixaround.com
                  </a>
                  <a
                    href="mailto:vichudass15@gmail.com"
                    className="block text-xs text-[#A9B0B8] hover:text-[#C5A46D] transition-colors"
                  >
                    vichudass15@gmail.com
                  </a>
                </div>
              </div>

              {/* Phone */}
              <div className="flex items-start gap-3 group">
                <div className="w-8 h-8 rounded-lg bg-[#17283A] border border-[#354252] flex items-center justify-center text-[#C5A46D] shrink-0 group-hover:border-[#C5A46D]/60 transition-colors">
                  <Phone className="w-3.5 h-3.5" aria-hidden="true" />
                </div>
                <div className="space-y-0.5">
                  <div className="text-[10px] uppercase tracking-wider text-[#A9B0B8]/80">Direct Concierge</div>
                  <a
                    href="tel:+919597993402"
                    className="block text-[#F5F3EE] hover:text-[#C5A46D] transition-colors font-semibold"
                  >
                    +91 95979 93402
                  </a>
                </div>
              </div>

              {/* Location */}
              <div className="flex items-start gap-3 group">
                <div className="w-8 h-8 rounded-lg bg-[#17283A] border border-[#354252] flex items-center justify-center text-[#C5A46D] shrink-0 group-hover:border-[#C5A46D]/60 transition-colors">
                  <MapPin className="w-3.5 h-3.5" aria-hidden="true" />
                </div>
                <div className="space-y-0.5">
                  <div className="text-[10px] uppercase tracking-wider text-[#A9B0B8]/80">Corporate Hub</div>
                  <p className="text-[#F5F3EE] font-medium leading-relaxed">
                    Tiruppur, Tamil Nadu, India
                  </p>
                </div>
              </div>

              {/* Hours / Emergency badge */}
              <div className="flex items-start gap-3 pt-1">
                <div className="w-8 h-8 rounded-lg bg-[#17283A] border border-[#354252] flex items-center justify-center text-[#C5A46D] shrink-0">
                  <Clock className="w-3.5 h-3.5" aria-hidden="true" />
                </div>
                <div className="space-y-1">
                  <div className="text-[10px] uppercase tracking-wider text-[#A9B0B8]/80">Service Hours</div>
                  <p className="text-xs text-[#F5F3EE]">Mon – Sun: 7:00 AM – 10:00 PM</p>
                  <span className="inline-block mt-1 px-2.5 py-0.5 rounded text-[10px] font-semibold bg-[#C5A46D]/15 border border-[#C5A46D]/30 text-[#C5A46D]">
                    24/7 Priority Emergency Dispatch
                  </span>
                </div>
              </div>
            </address>
          </div>

        </div>
      </div>

      {/* ==================================================
          3. SUB-FOOTER BOTTOM BAR
          ================================================== */}
      <div className="border-t border-[#354252] bg-[#0c1622] py-6 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-[#A9B0B8]">
          {/* Copyright */}
          <p className="text-center md:text-left">
            &copy; {currentYear} FixAround. All Rights Reserved.
          </p>

          {/* Corporate Motto */}
          <div className="text-center">
            <span className="font-serif italic text-sm text-[#C5A46D] tracking-wide">
              &ldquo;Designed for Better Living.&rdquo;
            </span>
          </div>

          {/* Legal Links */}
          <div className="flex items-center gap-6">
            <Link 
              to="/privacy" 
              className="hover:text-[#F5F3EE] transition-colors focus:outline-none focus:underline"
            >
              Privacy Policy
            </Link>
            <span className="text-[#354252]" aria-hidden="true">•</span>
            <Link 
              to="/terms" 
              className="hover:text-[#F5F3EE] transition-colors focus:outline-none focus:underline"
            >
              Terms &amp; Conditions
            </Link>
            <span className="text-[#354252]" aria-hidden="true">•</span>
            <Link 
              to="/contact" 
              className="hover:text-[#F5F3EE] transition-colors focus:outline-none focus:underline"
            >
              Support
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
