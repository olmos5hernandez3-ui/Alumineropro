import React, { useEffect, useState } from 'react';
import { MarginTrafficLightCard } from './MarginTrafficLightCard';

interface CalculadoraModalProps {
  open: boolean;
  proActive?: boolean;
  isAdmin?: boolean;
  onClose: () => void;
  onShowToast?: (msg: string, topSuccess?: boolean) => void;
}

const OPERATORS = new Set(['+', '-', '×', '÷']);

function formatResultNumber(num: number): string {
  if (!Number.isFinite(num)) return 'Error';
  const rounded = Math.round(num * 1e8) / 1e8;
  return String(rounded);
}

function evaluateExpression(rawExpr: string): string {
  const normalized = rawExpr.replace(/×/g, '*').replace(/÷/g, '/').trim();
  if (!normalized) return '0';

  // Elimina operador colgante al final
  const cleaned = normalized.replace(/[+\-*/.]$/, '');
  if (!cleaned) return '0';

  const tokens: string[] = [];
  let i = 0;
  while (i < cleaned.length) {
    const ch = cleaned[i];
    if (ch === ' ') {
      i++;
      continue;
    }
    if (
      (ch >= '0' && ch <= '9') ||
      ch === '.' ||
      (ch === '-' &&
        (tokens.length === 0 || ['+', '-', '*', '/'].includes(tokens[tokens.length - 1])))
    ) {
      let numStr = ch;
      i++;
      while (i < cleaned.length && ((cleaned[i] >= '0' && cleaned[i] <= '9') || cleaned[i] === '.')) {
        numStr += cleaned[i];
        i++;
      }
      tokens.push(numStr);
      continue;
    }
    if (['+', '-', '*', '/'].includes(ch)) {
      tokens.push(ch);
      i++;
      continue;
    }
    return 'Error';
  }

  if (tokens.length === 0) return '0';

  // Primera pasada: multiplicación y división
  const highPrec: (number | string)[] = [];
  let idx = 0;
  const firstNum = Number(tokens[0]);
  if (Number.isNaN(firstNum)) return 'Error';
  highPrec.push(firstNum);
  idx = 1;

  while (idx < tokens.length) {
    const op = tokens[idx];
    const nextRaw = tokens[idx + 1];
    if (!nextRaw) break;
    const nextVal = Number(nextRaw);
    if (Number.isNaN(nextVal)) return 'Error';

    if (op === '*' || op === '/') {
      const prevVal = Number(highPrec.pop());
      if (op === '/' && nextVal === 0) return 'Error';
      highPrec.push(op === '*' ? prevVal * nextVal : prevVal / nextVal);
    } else {
      highPrec.push(op, nextVal);
    }
    idx += 2;
  }

  // Segunda pasada: suma y resta
  let acc = Number(highPrec[0]);
  for (let k = 1; k < highPrec.length; k += 2) {
    const op = highPrec[k];
    const rhs = Number(highPrec[k + 1]);
    if (op === '+') acc += rhs;
    else if (op === '-') acc -= rhs;
  }

  return formatResultNumber(acc);
}

export const CalculadoraModal: React.FC<CalculadoraModalProps> = ({
  open,
  proActive = false,
  isAdmin = false,
  onClose,
  onShowToast,
}) => {
  const [expression, setExpression] = useState('0');
  const [justEvaluated, setJustEvaluated] = useState(false);

  const appendDigit = (digit: string) => {
    if (expression === 'Error' || justEvaluated) {
      setExpression(digit);
      setJustEvaluated(false);
      return;
    }
    if (expression === '0') {
      setExpression(digit);
      return;
    }
    setExpression((prev) => prev + digit);
  };

  const appendDecimal = () => {
    if (expression === 'Error' || justEvaluated) {
      setExpression('0.');
      setJustEvaluated(false);
      return;
    }
    const parts = expression.split(/[+\-×÷]/);
    const currentNum = parts[parts.length - 1] || '';
    if (currentNum.includes('.')) return;
    const lastChar = expression.slice(-1);
    if (OPERATORS.has(lastChar)) {
      setExpression((prev) => `${prev}0.`);
    } else {
      setExpression((prev) => `${prev}.`);
    }
  };

  const appendOperator = (op: string) => {
    if (expression === 'Error') {
      setExpression('0');
      setJustEvaluated(false);
      return;
    }
    setJustEvaluated(false);
    const lastChar = expression.slice(-1);
    if (OPERATORS.has(lastChar)) {
      setExpression((prev) => prev.slice(0, -1) + op);
    } else {
      setExpression((prev) => prev + op);
    }
  };

  const handleClear = () => {
    setExpression('0');
    setJustEvaluated(false);
  };

  const handleBackspace = () => {
    if (expression === 'Error' || justEvaluated) {
      setExpression('0');
      setJustEvaluated(false);
      return;
    }
    if (expression.length <= 1) {
      setExpression('0');
      return;
    }
    setExpression((prev) => prev.slice(0, -1));
  };

  const handleEvaluate = () => {
    const res = evaluateExpression(expression);
    setExpression(res);
    setJustEvaluated(true);
  };

  const handleCopyResult = async () => {
    const valToCopy = justEvaluated ? expression : evaluateExpression(expression);
    if (valToCopy === 'Error') return;
    try {
      await navigator.clipboard.writeText(valToCopy);
      onShowToast?.(`Resultado copiado: ${valToCopy}`, true);
    } catch {
      onShowToast?.('No se pudo copiar al portapapeles');
    }
  };

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
        return;
      }
      if (e.key >= '0' && e.key <= '9') {
        e.preventDefault();
        appendDigit(e.key);
      } else if (e.key === '.') {
        e.preventDefault();
        appendDecimal();
      } else if (e.key === '+') {
        e.preventDefault();
        appendOperator('+');
      } else if (e.key === '-') {
        e.preventDefault();
        appendOperator('-');
      } else if (e.key === '*') {
        e.preventDefault();
        appendOperator('×');
      } else if (e.key === '/') {
        e.preventDefault();
        appendOperator('÷');
      } else if (e.key === 'Enter' || e.key === '=') {
        e.preventDefault();
        handleEvaluate();
      } else if (e.key === 'Backspace') {
        e.preventDefault();
        handleBackspace();
      } else if (e.key === 'Delete') {
        e.preventDefault();
        handleClear();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  });

  if (!open) return null;

  const previewVal = justEvaluated ? '' : evaluateExpression(expression);
  const showPreview = Boolean(previewVal && previewVal !== 'Error' && previewVal !== expression);

  return (
    <div
      id="modal-calculadora"
      className="fixed inset-0 z-50 bg-slate-950/75 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-label="Calculadora rápida"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="w-full max-w-[380px] max-h-[92vh] overflow-y-auto bg-white text-slate-900 border-[1.5px] border-slate-300 rounded-[22px] p-4 shadow-2xl">
        <div className="flex items-center justify-between gap-2 mb-3">
          <div>
            <h2 className="m-0 text-[16.5px] font-extrabold">Calculadora Rápida</h2>
            <p className="m-0 text-[11.5px] text-slate-500">
              Cuentas de medidas, cortes y precios
            </p>
          </div>
          <button
            type="button"
            id="btn-calc-close"
            onClick={onClose}
            aria-label="Cerrar calculadora"
            className="min-w-[36px] min-h-[36px] rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold cursor-pointer"
          >
            ✕
          </button>
        </div>

        {/* Pantalla de la calculadora */}
        <div
          id="calc-display"
          className="rounded-2xl border border-slate-300 bg-slate-900 text-white px-3.5 py-3 mb-3 text-right"
        >
          <div className="min-h-[18px] text-[12px] text-slate-400 mono truncate">
            {showPreview ? `= ${previewVal}` : ' '}
          </div>
          <div
            id="calc-display-value"
            className="mono text-[26px] font-extrabold leading-tight break-all min-h-[34px]"
          >
            {expression}
          </div>
        </div>

        {/* Teclado numérico y operadores */}
        <div className="grid grid-cols-4 gap-2">
          <button
            type="button"
            id="btn-calc-clear"
            onClick={handleClear}
            className="col-span-2 min-h-[48px] rounded-xl border border-red-200 bg-red-50 hover:bg-red-100 text-red-700 font-extrabold text-[15px] cursor-pointer"
          >
            C (Borrar)
          </button>
          <button
            type="button"
            id="btn-calc-backspace"
            onClick={handleBackspace}
            aria-label="Borrar último carácter"
            className="min-h-[48px] rounded-xl border border-amber-300 bg-amber-50 hover:bg-amber-100 text-amber-900 font-extrabold text-[16px] cursor-pointer"
          >
            ⌫
          </button>
          <button
            type="button"
            id="btn-calc-div"
            onClick={() => appendOperator('÷')}
            className="min-h-[48px] rounded-xl border border-blue-200 bg-blue-50 hover:bg-blue-100 text-blue-700 font-extrabold text-[18px] cursor-pointer"
          >
            ÷
          </button>

          {['7', '8', '9'].map((d) => (
            <button
              key={d}
              type="button"
              onClick={() => appendDigit(d)}
              className="min-h-[48px] rounded-xl border border-slate-300 bg-slate-50 hover:bg-slate-100 text-slate-900 font-extrabold text-[17px] mono cursor-pointer"
            >
              {d}
            </button>
          ))}
          <button
            type="button"
            id="btn-calc-mul"
            onClick={() => appendOperator('×')}
            className="min-h-[48px] rounded-xl border border-blue-200 bg-blue-50 hover:bg-blue-100 text-blue-700 font-extrabold text-[18px] cursor-pointer"
          >
            ×
          </button>

          {['4', '5', '6'].map((d) => (
            <button
              key={d}
              type="button"
              onClick={() => appendDigit(d)}
              className="min-h-[48px] rounded-xl border border-slate-300 bg-slate-50 hover:bg-slate-100 text-slate-900 font-extrabold text-[17px] mono cursor-pointer"
            >
              {d}
            </button>
          ))}
          <button
            type="button"
            id="btn-calc-sub"
            onClick={() => appendOperator('-')}
            className="min-h-[48px] rounded-xl border border-blue-200 bg-blue-50 hover:bg-blue-100 text-blue-700 font-extrabold text-[20px] cursor-pointer"
          >
            −
          </button>

          {['1', '2', '3'].map((d) => (
            <button
              key={d}
              type="button"
              onClick={() => appendDigit(d)}
              className="min-h-[48px] rounded-xl border border-slate-300 bg-slate-50 hover:bg-slate-100 text-slate-900 font-extrabold text-[17px] mono cursor-pointer"
            >
              {d}
            </button>
          ))}
          <button
            type="button"
            id="btn-calc-add"
            onClick={() => appendOperator('+')}
            className="min-h-[48px] rounded-xl border border-blue-200 bg-blue-50 hover:bg-blue-100 text-blue-700 font-extrabold text-[19px] cursor-pointer"
          >
            +
          </button>

          <button
            type="button"
            onClick={() => appendDigit('0')}
            className="col-span-2 min-h-[48px] rounded-xl border border-slate-300 bg-slate-50 hover:bg-slate-100 text-slate-900 font-extrabold text-[17px] mono cursor-pointer"
          >
            0
          </button>
          <button
            type="button"
            id="btn-calc-dot"
            onClick={appendDecimal}
            className="min-h-[48px] rounded-xl border border-slate-300 bg-slate-50 hover:bg-slate-100 text-slate-900 font-extrabold text-[20px] mono cursor-pointer"
          >
            .
          </button>
          <button
            type="button"
            id="btn-calc-eq"
            onClick={handleEvaluate}
            className="min-h-[48px] rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-[20px] cursor-pointer shadow-sm"
          >
            =
          </button>
        </div>

        <button
          type="button"
          id="btn-calc-copy"
          onClick={() => void handleCopyResult()}
          className="mt-3 w-full min-h-[38px] rounded-xl border border-slate-300 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-[12px] cursor-pointer"
        >
          Copiar resultado
        </button>

        {/* Semáforo de Margen compacto — Exclusivo PRO / Administrador (oculto en Versión Gratuita) */}
        <MarginTrafficLightCard
          id="semaforo-margen-calculadora"
          proActive={proActive}
          isAdmin={isAdmin}
          variant="compact"
        />
      </div>
    </div>
  );
};
