import React, { Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { HealthDataProvider } from './context/HealthDataContext';
import WebsiteLayout from './website/components/Layout';
import AuthModal from './website/components/AuthModal';
import ProtectedRoute from './shared/components/ProtectedRoute';
import DashboardLayout from './dashboard/layouts/DashboardLayout';

// Lazy-loaded Website Pages
const HomePage = lazy(() => import('./website/pages/HomePage'));
const ContactPage = lazy(() => import('./website/pages/ContactPage'));
const AboutPage = lazy(() => import('./website/pages/AboutPage'));
const ServicesPage = lazy(() => import('./website/pages/ServicesPage'));
const ServiceSinglePage = lazy(() => import('./website/pages/ServiceSinglePage'));
const BlogPage = lazy(() => import('./website/pages/BlogPage'));
const BlogSinglePage = lazy(() => import('./website/pages/BlogSinglePage'));
const DoctorsPage = lazy(() => import('./website/pages/DoctorsPage'));
const DoctorPage = lazy(() => import('./website/pages/DoctorPage'));
const DoctorSinglePage = lazy(() => import('./website/pages/DoctorSinglePage'));
const CaseStudyPage = lazy(() => import('./website/pages/CaseStudyPage'));
const CaseStudySinglePage = lazy(() => import('./website/pages/CaseStudySinglePage'));
const ImageGalleryPage = lazy(() => import('./website/pages/ImageGalleryPage'));
const VideoGalleryPage = lazy(() => import('./website/pages/VideoGalleryPage'));
const FaqsPage = lazy(() => import('./website/pages/FaqsPage'));
const BookAppointmentPage = lazy(() => import('./website/pages/BookAppointmentPage'));
const ProjectsPage = lazy(() => import('./website/pages/ProjectsPage'));
const IndexImagePage = lazy(() => import('./website/pages/IndexImagePage'));
const Error404Page = lazy(() => import('./website/pages/Error404Page'));
const ResetPasswordPage = lazy(() => import('./website/pages/ResetPassword'));

// Lazy-loaded Dashboard Pages
const Dashboard = lazy(() => import('./dashboard/pages/Dashboard'));
const RiskPrediction = lazy(() => import('./dashboard/pages/RiskPrediction'));
const HeartDiabetesPrediction = lazy(() => import('./dashboard/pages/HeartDiabetesPrediction'));
const AIChatbots = lazy(() => import('./dashboard/pages/AIChatbots'));
const BodyExplorer = lazy(() => import('./dashboard/pages/BodyExplorer'));
const ReversePlanner = lazy(() => import('./dashboard/pages/ReversePlanner'));
const Forecast = lazy(() => import('./dashboard/pages/Forecast'));
const DashboardBlogs = lazy(() => import('./dashboard/pages/DashboardBlogs'));
const DashboardContact = lazy(() => import('./dashboard/pages/DashboardContact'));
const Profile = lazy(() => import('./dashboard/pages/Profile'));
const PredictionHistory = lazy(() => import('./dashboard/pages/PredictionHistory'));

const Layout = ({ children }) => {
  const location = useLocation();
  const isResetPassword = location.pathname.startsWith('/reset-password');

  return (
    <>
      {children}
      {!isResetPassword && <AuthModal />}
    </>
  );
};

function App() {
  return (
    <Router>
      <AuthProvider>
        <HealthDataProvider>
          <Layout>
            <Suspense fallback={null}>
              <Routes>
                {/* Website Routes */}
                <Route element={<WebsiteLayout />}>
                  <Route path="/" element={<HomePage />} />
                  <Route path="/about" element={<AboutPage />} />
                  <Route path="/services" element={<ServicesPage />} />
                  <Route path="/service-single" element={<ServiceSinglePage />} />
                  <Route path="/blog" element={<BlogPage />} />
                  <Route path="/blogs" element={<BlogPage />} />
                  <Route path="/blog-single" element={<BlogSinglePage />} />
                  <Route path="/doctors" element={<DoctorsPage />} />
                  <Route path="/doctor" element={<DoctorPage />} />
                  <Route path="/doctor-single" element={<DoctorSinglePage />} />
                  <Route path="/case-study" element={<CaseStudyPage />} />
                  <Route path="/case-study-single" element={<CaseStudySinglePage />} />
                  <Route path="/image-gallery" element={<ImageGalleryPage />} />
                  <Route path="/video-gallery" element={<VideoGalleryPage />} />
                  <Route path="/faqs" element={<FaqsPage />} />
                  <Route path="/faq" element={<FaqsPage />} />
                  <Route path="/book-appointment" element={<BookAppointmentPage />} />
                  <Route path="/contact" element={<ContactPage />} />
                  <Route path="/projects" element={<ProjectsPage />} />
                  <Route path="/index-image" element={<IndexImagePage />} />
                  <Route path="/404" element={<Error404Page />} />
                </Route>

                <Route path="/reset-password/:resetToken" element={<ResetPasswordPage />} />

                {/* Protected Dashboard Routes */}
                <Route
                  path="/dashboard"
                  element={
                    <ProtectedRoute>
                      <DashboardLayout />
                    </ProtectedRoute>
                  }
                >
                  <Route index element={<Dashboard />} />
                  <Route path="risk-prediction" element={<RiskPrediction />} />
                  <Route
                    path="risk-prediction/heart-diabetes"
                    element={<HeartDiabetesPrediction />}
                  />
                  <Route path="chatbots" element={<AIChatbots />} />
                  <Route path="body-explorer" element={<BodyExplorer />} />
                  <Route path="reverse-planner" element={<ReversePlanner />} />
                  <Route path="forecast" element={<Forecast />} />
                  <Route path="blogs" element={<DashboardBlogs />} />
                  <Route path="contact" element={<DashboardContact />} />
                  <Route path="profile" element={<Profile />} />
                  <Route path="prediction-history" element={<PredictionHistory />} />
                </Route>

                <Route path="*" element={<Error404Page />} />
              </Routes>
            </Suspense>
          </Layout>
        </HealthDataProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;
