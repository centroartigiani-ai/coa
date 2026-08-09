import { motion } from "framer-motion";

const EASE = [0.16, 1, 0.3, 1];

export const Reveal = ({ children, delay = 0, className = "" }) => (
  <motion.div
    className={className}
    initial={{ y: 40, opacity: 0 }}
    whileInView={{ y: 0, opacity: 1 }}
    viewport={{ once: true, margin: "-80px" }}
    transition={{ duration: 0.9, delay, ease: EASE }}
  >
    {children}
  </motion.div>
);

export const MaskedLine = ({ children, delay = 0, className = "" }) => (
  <span className={`block overflow-hidden ${className}`}>
    <motion.span
      className="block"
      initial={{ y: "110%" }}
      animate={{ y: 0 }}
      transition={{ duration: 1.1, delay, ease: EASE }}
    >
      {children}
    </motion.span>
  </span>
);

export const SectionHeading = ({ number, label, title, className = "" }) => (
  <div className={className}>
    <Reveal>
      <p data-testid={`section-label-${number}`} className="text-xs font-bold tracking-[0.3em] uppercase text-[#F2A93B] mb-6 flex items-center gap-3">
        <span className="inline-block w-10 h-px bg-[#F2A93B]" />
        {number} — {label}
      </p>
    </Reveal>
    <Reveal delay={0.1}>
      <h2 className="font-display text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight text-white max-w-3xl leading-[1.05]">
        {title}
      </h2>
    </Reveal>
  </div>
);
