import { Wrench, Building2, Factory } from "lucide-react";
import { Reveal, SectionHeading } from "@/components/Reveal";
import { IconElectrician, IconPlumber } from "@/components/landing/icons";

const ELECTRICAL_IMG = "https://images.pexels.com/photos/9679179/pexels-photo-9679179.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940";

const CoreCard = ({ icon: Icon, title, desc, image, testid, delay }) => (
  <Reveal delay={delay} className="md:col-span-3">
    <div
      data-testid={testid}
      className="group relative h-full min-h-[320px] p-8 md:p-10 flex flex-col justify-end overflow-hidden bg-[#26241F] border border-[#F2A93B]/40 hover:border-[#F2A93B] transition-colors duration-500"
    >
      {image && (
        <>
          <img src={image} alt={title === "Elettricista" ? "Elettricista al lavoro su un quadro elettrico a Varese" : title} className="absolute inset-0 w-full h-full object-cover opacity-35 group-hover:opacity-50 transition-opacity duration-700" />
          <div className="absolute inset-0 bg-[#1C1C1E]/50" />
        </>
      )}
      <span className="absolute top-6 right-6 font-mono-data text-[10px] tracking-[0.25em] uppercase text-[#F2A93B]">Servizio core</span>
      <Icon className="relative w-12 h-12 mb-auto text-[#F2A93B]" />
      <h3 className="relative mt-12 font-display text-2xl sm:text-3xl font-bold text-[#F5F1EA]">{title}</h3>
      <p className="relative mt-3 text-sm text-[#F5F1EA]/55 max-w-sm">{desc}</p>
    </div>
  </Reveal>
);

const Card = ({ icon: Icon, title, desc, testid, delay }) => (
  <Reveal delay={delay} className="md:col-span-2">
    <div
      data-testid={testid}
      className="group relative h-full min-h-[220px] p-8 flex flex-col justify-end bg-[#26241F] border border-[#F5F1EA]/10 hover:border-[#F5F1EA]/30 transition-colors duration-500"
    >
      <Icon className="w-7 h-7 mb-auto text-[#F2A93B]" strokeWidth={1.5} />
      <h3 className="mt-10 font-display text-xl sm:text-2xl font-bold text-[#F5F1EA]">{title}</h3>
      <p className="mt-2 text-sm text-[#F5F1EA]/50">{desc}</p>
    </div>
  </Reveal>
);

export default function Services() {
  return (
    <section id="servizi" data-testid="services-section" className="py-24 md:py-32 px-6 md:px-12 mx-auto max-w-7xl">
      <SectionHeading number="03" label="Servizi" title={<>Idraulico, elettricista e manutenzioni <span className="text-[#F2A93B]">a Varese.</span></>} />
      <div className="mt-16 grid grid-cols-1 md:grid-cols-6 gap-4">
        <CoreCard testid="service-card-idraulico" icon={IconPlumber} title="Idraulico" desc="Pronto intervento idraulico a Varese e provincia: perdite d'acqua, scarichi, sanitari e impianti idrici." delay={0} />
        <CoreCard testid="service-card-elettricista" icon={IconElectrician} title="Elettricista" desc="Pronto intervento elettrico a Varese: guasti elettrici, quadri, cortocircuiti e messa a norma." image={ELECTRICAL_IMG} delay={0.1} />
        <Card testid="service-card-piccole-manutenzioni" icon={Wrench} title="Piccole manutenzioni" desc="Riparazioni domestiche a Varese, con il tuo artigiano di fiducia." delay={0} />
        <Card testid="service-card-condomini" icon={Building2} title="Servizi per condomini" desc="Manutenzione condominio a Varese: un referente unico per gli amministratori." delay={0.1} />
        <Card testid="service-card-aziende" icon={Factory} title="Servizi per aziende" desc="Manutenzione impianti aziendali a Varese e pronto intervento tecnico." delay={0.2} />
      </div>
    </section>
  );
}
