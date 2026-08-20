import "@/App.css";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ReactLenis } from "lenis/react";
import { Toaster } from "@/components/ui/sonner";
import { AuthProvider } from "@/context/AuthContext";
import Landing from "@/pages/Landing";
import AdminLogin from "@/pages/AdminLogin";
import AdminDashboard from "@/pages/AdminDashboard";
import PartnerLogin from "@/pages/PartnerLogin";
import PartnerDashboard from "@/pages/PartnerDashboard";
import ReviewPage from "@/pages/ReviewPage";
import PrivacyPolicy from "@/pages/PrivacyPolicy";
import CookiePolicy from "@/pages/CookiePolicy";
import CookieConsent from "@/components/CookieConsent";

function App() {
  return (
    <div className="App">
      <ReactLenis root options={{ lerp: 0.09, smoothWheel: true }}>
        <AuthProvider>
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<Landing />} />
              <Route path="/privacy-policy" element={<PrivacyPolicy />} />
              <Route path="/cookie-policy" element={<CookiePolicy />} />
              <Route path="/admin/login" element={<AdminLogin />} />
              <Route path="/admin" element={<AdminDashboard />} />
              <Route path="/partner/login" element={<PartnerLogin />} />
              <Route path="/partner" element={<PartnerDashboard />} />
              <Route path="/recensione/:token" element={<ReviewPage />} />
            </Routes>
            <CookieConsent />
          </BrowserRouter>
          <Toaster position="top-center" theme="dark" />
        </AuthProvider>
      </ReactLenis>
    </div>
  );
}

export default App;
