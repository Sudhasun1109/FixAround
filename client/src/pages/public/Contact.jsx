import React, { useState } from 'react';
import Input from '../../components/common/Input';
import Textarea from '../../components/common/Textarea';
import Button from '../../components/common/Button';
import { showToast } from '../../components/common/Toast';
import { Mail, Phone, MapPin, Clock, Send, MessageSquare, CheckCircle } from 'lucide-react';

export default function Contact() {
  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    subject: 'General Inquiry',
    message: '',
  });
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.message) {
      showToast.error('Please fill in all required fields');
      return;
    }

    setLoading(true);
    // Simulate support ticket dispatch
    setTimeout(() => {
      setLoading(false);
      setSubmitted(true);
      showToast.success('Thank you! Your message has been received by FixAround Support.');
    }, 800);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-12">
      {/* Header */}
      <div className="text-center max-w-2xl mx-auto">
        <span className="text-xs font-bold text-fixteal-600 uppercase tracking-wider">
          Support & Inquiries
        </span>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-fixblue-900 mt-1">
          We’re Here to Help
        </h1>
        <p className="mt-2 text-sm text-slate-500">
          Have questions about a booking, service warranty, or partnership? Get in touch with our team.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Support Channels & Info */}
        <div className="space-y-6">
          <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-6">
            <h3 className="text-base font-bold text-fixblue-900">
              Customer Support Center
            </h3>

            <div className="space-y-4 text-xs text-slate-600">
              <div className="flex items-start gap-3">
                <div className="p-2.5 rounded-xl bg-fixteal-50 text-fixteal-700 shrink-0">
                  <Phone className="w-4 h-4" />
                </div>
                <div>
                  <span className="font-bold text-slate-800 block">Toll-Free Helpline</span>
                  <a href="tel:18003492768" className="text-fixblue-800 font-semibold hover:underline">
                    1800-FIX-AROUND (1800-349-2768)
                  </a>
                  <span className="block text-[11px] text-slate-400 mt-0.5">24/7 for emergency booking support</span>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="p-2.5 rounded-xl bg-fixblue-50 text-fixblue-800 shrink-0">
                  <Mail className="w-4 h-4" />
                </div>
                <div>
                  <span className="font-bold text-slate-800 block">Email Support</span>
                  <a href="mailto:support@fixaround.com" className="text-fixblue-800 font-semibold hover:underline">
                    support@fixaround.com
                  </a>
                  <span className="block text-[11px] text-slate-400 mt-0.5">Response within 2 hours</span>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="p-2.5 rounded-xl bg-indigo-50 text-indigo-700 shrink-0">
                  <MapPin className="w-4 h-4" />
                </div>
                <div>
                  <span className="font-bold text-slate-800 block">Operations Headquarters</span>
                  <p className="text-slate-600 mt-0.5">
                    FixAround India Pvt. Ltd.<br />
                    Outer Circle, Connaught Place,<br />
                    New Delhi, Delhi 110001
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="p-2.5 rounded-xl bg-emerald-50 text-emerald-700 shrink-0">
                  <Clock className="w-4 h-4" />
                </div>
                <div>
                  <span className="font-bold text-slate-800 block">Standard Office Hours</span>
                  <p className="text-slate-600 mt-0.5">Monday – Sunday: 8:00 AM – 9:00 PM</p>
                  <span className="text-[11px] text-emerald-600 font-semibold">Emergency team operates 24/7/365</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Contact Form */}
        <div className="lg:col-span-2">
          <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-xs">
            {submitted ? (
              <div className="py-12 text-center space-y-4">
                <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 mx-auto flex items-center justify-center">
                  <CheckCircle className="w-8 h-8" />
                </div>
                <h3 className="text-xl font-bold text-slate-900">Message Dispatched!</h3>
                <p className="text-sm text-slate-500 max-w-md mx-auto">
                  Our customer operations team has logged ticket #TKT-{Math.floor(100000 + Math.random() * 900000)}. We will follow up via email at {form.email}.
                </p>
                <Button
                  variant="outline"
                  size="md"
                  onClick={() => {
                    setSubmitted(false);
                    setForm({ name: '', email: '', phone: '', subject: 'General Inquiry', message: '' });
                  }}
                >
                  Send Another Message
                </Button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="flex items-center gap-2 mb-2">
                  <MessageSquare className="w-5 h-5 text-fixteal-600" />
                  <h3 className="text-lg font-bold text-fixblue-900">
                    Send Us a Message
                  </h3>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Input
                    label="Your Full Name"
                    required
                    placeholder="e.g. Priya Sharma"
                    value={form.name}
                    onChange={(e) => handleChange('name', e.target.value)}
                  />

                  <Input
                    label="Email Address"
                    type="email"
                    required
                    placeholder="e.g. priya@example.com"
                    value={form.email}
                    onChange={(e) => handleChange('email', e.target.value)}
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Input
                    label="Phone Number"
                    placeholder="e.g. 98765 43210"
                    value={form.phone}
                    onChange={(e) => handleChange('phone', e.target.value)}
                  />

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                      Subject
                    </label>
                    <select
                      value={form.subject}
                      onChange={(e) => handleChange('subject', e.target.value)}
                      className="block w-full rounded-lg border border-slate-300 text-sm py-2.5 px-3.5 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-fixteal-500"
                    >
                      <option value="General Inquiry">General Inquiry</option>
                      <option value="Booking Help">Booking or Technician Help</option>
                      <option value="Warranty Claim Question">Warranty Claim Question</option>
                      <option value="Technician Application">Technician Registration</option>
                      <option value="Billing & Invoicing">Billing & Invoicing</option>
                    </select>
                  </div>
                </div>

                <Textarea
                  label="Message / Problem Details"
                  required
                  placeholder="How can we assist you today? Please include any booking numbers if relevant."
                  value={form.message}
                  onChange={(e) => handleChange('message', e.target.value)}
                  rows={5}
                />

                <div className="pt-2">
                  <Button
                    type="submit"
                    variant="primary"
                    size="lg"
                    loading={loading}
                    icon={Send}
                  >
                    Send Message to Support
                  </Button>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
