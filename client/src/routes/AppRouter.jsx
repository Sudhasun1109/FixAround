import React, { Suspense, lazy } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import ProtectedRoute from './ProtectedRoute';
import RoleRoute from './RoleRoute';
import { ROLES } from '../utils/constants';
import Spinner from '../components/common/Spinner';

// Layouts
import PublicLayout from '../layouts/PublicLayout';
import CustomerLayout from '../layouts/CustomerLayout';
import TechnicianLayout from '../layouts/TechnicianLayout';
import AdminLayout from '../layouts/AdminLayout';

// Lazy-loaded Public Pages
const Home = lazy(() => import('../pages/public/Home'));
const Services = lazy(() => import('../pages/public/Services'));
const ServiceDetail = lazy(() => import('../pages/public/ServiceDetail'));
const HowItWorks = lazy(() => import('../pages/public/HowItWorks'));
const Emergency = lazy(() => import('../pages/public/Emergency'));
const About = lazy(() => import('../pages/public/About'));
const Contact = lazy(() => import('../pages/public/Contact'));
const Login = lazy(() => import('../pages/public/Login'));
const RegisterCustomer = lazy(() => import('../pages/public/RegisterCustomer'));
const RegisterTechnician = lazy(() => import('../pages/public/RegisterTechnician'));
const Privacy = lazy(() => import('../pages/public/Privacy'));
const Terms = lazy(() => import('../pages/public/Terms'));

// Lazy-loaded Customer Pages
const CustomerDashboard = lazy(() => import('../pages/customer/Dashboard'));
const SearchTechnicians = lazy(() => import('../pages/customer/SearchTechnicians'));
const TechnicianProfile = lazy(() => import('../pages/customer/TechnicianProfile'));
const CreateBooking = lazy(() => import('../pages/customer/CreateBooking'));
const EmergencyRequest = lazy(() => import('../pages/customer/EmergencyRequest'));
const BookingDetail = lazy(() => import('../pages/customer/BookingDetail'));
const EstimateApproval = lazy(() => import('../pages/customer/EstimateApproval'));
const PaymentCheckout = lazy(() => import('../pages/customer/PaymentCheckout'));
const InvoiceView = lazy(() => import('../pages/customer/InvoiceView'));
const BookingHistory = lazy(() => import('../pages/customer/BookingHistory'));
const CustomerReviews = lazy(() => import('../pages/customer/Reviews'));
const WarrantyClaims = lazy(() => import('../pages/customer/WarrantyClaims'));
const CustomerWallet = lazy(() => import('../pages/customer/Wallet'));
const CustomerProfile = lazy(() => import('../pages/customer/Profile'));
const CustomerNotifications = lazy(() => import('../pages/customer/Notifications'));

// Lazy-loaded Technician Pages
const TechnicianDashboard = lazy(() => import('../pages/technician/Dashboard'));
const ProfileManagement = lazy(() => import('../pages/technician/ProfileManagement'));
const Skills = lazy(() => import('../pages/technician/Skills'));
const Availability = lazy(() => import('../pages/technician/Availability'));
const IncomingRequests = lazy(() => import('../pages/technician/IncomingRequests'));
const RequestDetail = lazy(() => import('../pages/technician/RequestDetail'));
const EstimateSubmission = lazy(() => import('../pages/technician/EstimateSubmission'));
const ActiveJob = lazy(() => import('../pages/technician/ActiveJob'));
const JobCompletion = lazy(() => import('../pages/technician/JobCompletion'));
const Earnings = lazy(() => import('../pages/technician/Earnings'));
const TechnicianReviews = lazy(() => import('../pages/technician/Reviews'));
const VerificationStatus = lazy(() => import('../pages/technician/VerificationStatus'));

// Lazy-loaded Admin Pages
const AdminDashboard = lazy(() => import('../pages/admin/Dashboard'));
const CustomerManagement = lazy(() => import('../pages/admin/CustomerManagement'));
const TechnicianVerification = lazy(() => import('../pages/admin/TechnicianVerification'));
const CategoryManagement = lazy(() => import('../pages/admin/CategoryManagement'));
const PriceManagement = lazy(() => import('../pages/admin/PriceManagement'));
const BookingMonitoring = lazy(() => import('../pages/admin/BookingMonitoring'));
const EmergencyMonitoring = lazy(() => import('../pages/admin/EmergencyMonitoring'));
const PaymentReports = lazy(() => import('../pages/admin/PaymentReports'));
const AdminWarrantyClaims = lazy(() => import('../pages/admin/WarrantyClaims'));
const ReviewModeration = lazy(() => import('../pages/admin/ReviewModeration'));
const SettingsPage = lazy(() => import('../pages/admin/Settings'));
const AuditLogs = lazy(() => import('../pages/admin/AuditLogs'));

export default function AppRouter() {
  return (
    <Suspense fallback={<Spinner fullScreen label="Loading FixAround platform..." />}>
      <Routes>
        {/* PUBLIC ROUTES */}
        <Route element={<PublicLayout />}>
          <Route path="/" element={<Home />} />
          <Route path="/services" element={<Services />} />
          <Route path="/services/:id" element={<ServiceDetail />} />
          <Route path="/technicians/:id" element={<TechnicianProfile />} />
          <Route path="/how-it-works" element={<HowItWorks />} />
          <Route path="/emergency" element={<Emergency />} />
          <Route path="/about" element={<About />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<RegisterCustomer />} />
          <Route path="/register-technician" element={<RegisterTechnician />} />
          <Route path="/privacy" element={<Privacy />} />
          <Route path="/terms" element={<Terms />} />
        </Route>

        {/* CUSTOMER ROUTES */}
        <Route
          element={
            <ProtectedRoute>
              <RoleRoute allowedRoles={[ROLES.CUSTOMER, ROLES.ADMIN]}>
                <CustomerLayout />
              </RoleRoute>
            </ProtectedRoute>
          }
        >
          <Route path="/customer/dashboard" element={<CustomerDashboard />} />
          <Route path="/customer/search" element={<SearchTechnicians />} />
          <Route path="/customer/book" element={<CreateBooking />} />
          <Route path="/customer/emergency" element={<EmergencyRequest />} />
          <Route path="/customer/bookings" element={<BookingHistory />} />
          <Route path="/customer/bookings/:id" element={<BookingDetail />} />
          <Route path="/customer/estimate/:id" element={<EstimateApproval />} />
          <Route path="/customer/checkout/:id" element={<PaymentCheckout />} />
          <Route path="/customer/invoices/:id" element={<InvoiceView />} />
          <Route path="/customer/reviews" element={<CustomerReviews />} />
          <Route path="/customer/claims" element={<WarrantyClaims />} />
          <Route path="/customer/wallet" element={<CustomerWallet />} />
          <Route path="/customer/profile" element={<CustomerProfile />} />
          <Route path="/customer/notifications" element={<CustomerNotifications />} />
        </Route>

        {/* TECHNICIAN ROUTES */}
        <Route
          element={
            <ProtectedRoute>
              <RoleRoute allowedRoles={[ROLES.TECHNICIAN]}>
                <TechnicianLayout />
              </RoleRoute>
            </ProtectedRoute>
          }
        >
          <Route path="/technician/dashboard" element={<TechnicianDashboard />} />
          <Route path="/technician/profile" element={<ProfileManagement />} />
          <Route path="/technician/skills" element={<Skills />} />
          <Route path="/technician/availability" element={<Availability />} />
          <Route path="/technician/requests" element={<IncomingRequests />} />
          <Route path="/technician/requests/:id" element={<RequestDetail />} />
          <Route path="/technician/estimates/new/:bookingId" element={<EstimateSubmission />} />
          <Route path="/technician/active-job/:id" element={<ActiveJob />} />
          <Route path="/technician/jobs/:id/complete" element={<JobCompletion />} />
          <Route path="/technician/earnings" element={<Earnings />} />
          <Route path="/technician/reviews" element={<TechnicianReviews />} />
          <Route path="/technician/verification" element={<VerificationStatus />} />
        </Route>

        {/* ADMIN ROUTES */}
        <Route
          element={
            <ProtectedRoute>
              <RoleRoute allowedRoles={[ROLES.ADMIN]}>
                <AdminLayout />
              </RoleRoute>
            </ProtectedRoute>
          }
        >
          <Route path="/admin/dashboard" element={<AdminDashboard />} />
          <Route path="/admin/customers" element={<CustomerManagement />} />
          <Route path="/admin/technicians" element={<TechnicianVerification />} />
          <Route path="/admin/categories" element={<CategoryManagement />} />
          <Route path="/admin/pricing" element={<PriceManagement />} />
          <Route path="/admin/bookings" element={<BookingMonitoring />} />
          <Route path="/admin/emergency" element={<EmergencyMonitoring />} />
          <Route path="/admin/payments" element={<PaymentReports />} />
          <Route path="/admin/claims" element={<AdminWarrantyClaims />} />
          <Route path="/admin/reviews" element={<ReviewModeration />} />
          <Route path="/admin/settings" element={<SettingsPage />} />
          <Route path="/admin/audit-logs" element={<AuditLogs />} />
        </Route>

        {/* Fallback route */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  );
}
