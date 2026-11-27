import { useState, type ReactNode } from "react";

type Props = {
  titulo: string;
  children: ReactNode;
  abierto?: boolean;
};

export function Acordeon({ titulo, children, abierto = false }: Props) {
  const [open, setOpen] = useState(abierto);
  return (
    <div className="border border-white/10 rounded-xl mb-2 overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between gap-2 px-4 py-3 text-left font-semibold"
      >
        <span className="min-w-0 break-words">{titulo}</span>
        <span className={`shrink-0 transition-transform ${open ? "rotate-180" : ""}`}>▾</span>
      </button>
      <div className={`grid transition-all duration-300 ${open ? "grid-rows-[1fr]" : "grid-rows-[0fr]"}`}>
        <div className="overflow-hidden">
          <div className="px-4 pb-4">{children}</div>
        </div>
      </div>
    </div>
  );
}

export default Acordeon;
