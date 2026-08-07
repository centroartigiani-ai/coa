import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Reveal, SectionHeading } from "@/components/Reveal";

const FAQS = [
  { q: "Quanto tempo serve per essere ricontattati?", a: "Entro circa 15 minuti dalla richiesta. Il professionista più adatto ti contatta direttamente." },
  { q: "Gli artigiani sono verificati?", a: "Sì, selezioniamo attentamente ogni professionista prima di inserirlo nella rete COA." },
  { q: "Quanto costa richiedere un intervento?", a: "La richiesta è gratuita. Riceverai il contatto del professionista più adatto senza alcun costo." },
  { q: "Posso richiedere interventi urgenti?", a: "Sì, gestiamo anche richieste urgenti: segnalalo nel modulo e daremo priorità alla tua richiesta." },
  { q: "Posso diventare partner?", a: "Sì. Se sei un professionista puoi candidarti tramite il modulo dedicato nella sezione Partner." },
];

export default function Faq() {
  return (
    <section id="faq" data-testid="faq-section" className="py-24 md:py-32 px-6 md:px-12 mx-auto max-w-7xl">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-16">
        <div className="lg:col-span-5">
          <SectionHeading number="07" label="Domande frequenti" title={<>Tutto chiaro, <span className="text-[#FF5A00]">prima ancora di chiedere.</span></>} />
        </div>
        <Reveal delay={0.15} className="lg:col-span-7">
          <Accordion type="single" collapsible data-testid="faq-accordion">
            {FAQS.map((f, i) => (
              <AccordionItem key={i} value={`faq-${i}`} className="border-b border-white/10">
                <AccordionTrigger data-testid={`faq-trigger-${i}`} className="text-left text-xl sm:text-2xl font-light text-white hover:text-[#FF5A00] hover:no-underline py-8 transition-colors">
                  {f.q}
                </AccordionTrigger>
                <AccordionContent data-testid={`faq-content-${i}`} className="text-white/50 text-base pb-8 max-w-xl">
                  {f.a}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </Reveal>
      </div>
    </section>
  );
}
