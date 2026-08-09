import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight } from "lucide-react";

export default function StickyCTA({ onRequest, hidden }) {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const onScroll = () => setShow(window.scrollY > 500);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <AnimatePresence>
      {show && !hidden && (
        <motion.div
          initial={{ y: 90, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 90, opacity: 0 }}
          transition={{ type: "spring", stiffness: 260, damping: 24 }}
          className="fixed z-[85] bottom-4 sm:bottom-6 left-4 right-20 sm:left-0 sm:right-0 flex sm:justify-center pointer-events-none"
        >
          <motion.button
            data-testid="sticky-request-cta"
            onClick={onRequest}
            whileHover={{ y: -3 }}
            whileTap={{ scale: 0.97 }}
            className="pointer-events-auto group flex items-center justify-center gap-3 w-full sm:w-auto bg-[#F2A93B] text-[#1C1C1E] px-7 sm:px-9 py-4 font-semibold shadow-[0_12px_40px_rgba(242,169,59,0.35)] hover:shadow-[0_16px_55px_rgba(242,169,59,0.55)] hover:bg-[#F5B456] transition-shadow"
          >
            <span className="relative flex h-2.5 w-2.5 shrink-0">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#1C1C1E] opacity-40" />
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[#1C1C1E]" />
            </span>
            Richiedi un intervento
            <ArrowRight className="w-5 h-5 transition-transform duration-300 group-hover:translate-x-1" />
          </motion.button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
