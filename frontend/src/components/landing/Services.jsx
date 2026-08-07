import { Droplets, Zap, Wrench, Building2, Factory } from "lucide-react";
import { Reveal, SectionHeading } from "@/components/Reveal";

const ELECTRICAL_IMG = "https://images.pexels.com/photos/9679179/pexels-photo-9679179.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940";

const Card = ({ icon: Icon, title, desc, span, image, testid, delay }) => (
  <Reveal delay={delay} className={span}>
    <div
      data-testid={testid}
      className="group relative h-full min-h-[240px] p-8 flex flex-col justify-end overflow-hidden bg-[#111111] border border-white/10 hover:border-white/30 transition-colors duration-500 hover:scale-[1.01]"
    >
      {image && (
        <>
          <img src={image} alt={title} className="absolute inset-0 w-full h-full object-cover opacity-40 group-hover:opacity-60 transition-opacity duration-700" />
          <div className="absolute inset-0 bg-black/40" />
        </>
      )}
      <Icon className="relative w-7 h-7 mb-auto text-[#FF5A00]" strokeWidth={1.5} />
      <h3 className="relative mt-10 font-display text-xl sm:text-2xl font-bold text-white">{title}</h3>
      <p className="relative mt-2 text-sm text-white/50">{desc}</p>
    </div>
  </Reveal>
);

export default function Services() {
  return (
    <section id="servizi" data-testid="services-section" className="py-24 md:py-32 px-6 md:px-12 mx-auto max-w-7xl">
      <SectionHeading number="03" label="Servizi" title={<>Cinque specialità, <span className="text-[#FF5A00]">un solo interlocutore.</span></>} />
      <div className="mt-16 grid grid-cols-1 md:grid-cols-6 gap-4">
        <Card testid="service-card-idraulico" icon={Droplets} title="Idraulico" desc="Perdite, scarichi, sanitari e impianti idrici." span="md:col-span-2" delay={0} />
        <Card testid="service-card-elettricista" icon={Zap} title="Elettricista" desc="Impianti elettrici, quadri, cortocircuiti e messa a norma." span="md:col-span-2" image={ELECTRICAL_IMG} delay={0.1} />
        <Card testid="service-card-piccole-manutenzioni" icon={Wrench} title="Piccole manutenzioni" desc="Riparazioni domestiche rapide, senza attese infinite." span="md:col-span-2" delay={0.2} />
        <Card testid="service-card-condomini" icon={Building2} title="Servizi per condomini" desc="Gestione veloce delle richieste comuni e delle parti condivise." span="md:col-span-3" delay={0} />
        <Card testid="service-card-aziende" icon={Factory} title="Servizi per aziende" desc="Manutenzione programmata e interventi tempestivi per il tuo business." span="md:col-span-3" delay={0.1} />
      </div>
    </section>
  );
}
