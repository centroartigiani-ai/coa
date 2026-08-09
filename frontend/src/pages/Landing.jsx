import { useState } from "react";
import Navbar from "@/components/landing/Navbar";
import Hero from "@/components/landing/Hero";
import HowItWorks from "@/components/landing/HowItWorks";
import Problem from "@/components/landing/Problem";
import Services from "@/components/landing/Services";
import Audiences from "@/components/landing/Audiences";
import PartnerSection from "@/components/landing/PartnerSection";
import Areas from "@/components/landing/Areas";
import Faq from "@/components/landing/Faq";
import Footer from "@/components/landing/Footer";
import RequestFormDialog from "@/components/landing/RequestWizard";
import PartnerFormDialog from "@/components/landing/PartnerFormDialog";
import WhatsAppFloat from "@/components/landing/WhatsAppFloat";
import StickyCTA from "@/components/landing/StickyCTA";

export default function Landing() {
  const [requestOpen, setRequestOpen] = useState(false);
  const [partnerOpen, setPartnerOpen] = useState(false);

  return (
    <div data-testid="landing-page" className="bg-[#1C1C1E] text-white min-h-screen">
      <div className="noise-overlay" />
      <Navbar onRequest={() => setRequestOpen(true)} />
      <Hero onRequest={() => setRequestOpen(true)} onPartner={() => setPartnerOpen(true)} />
      <HowItWorks />
      <Problem />
      <Services />
      <Audiences />
      <PartnerSection onPartner={() => setPartnerOpen(true)} />
      <Areas />
      <Faq />
      <Footer onPartner={() => setPartnerOpen(true)} />
      <RequestFormDialog open={requestOpen} onOpenChange={setRequestOpen} />
      <PartnerFormDialog open={partnerOpen} onOpenChange={setPartnerOpen} />
      <WhatsAppFloat />
      <StickyCTA onRequest={() => setRequestOpen(true)} hidden={requestOpen} />
    </div>
  );
}
