import React from 'react';
import { CheckCircle2 } from 'lucide-react';
import { PerfilCatalogoId } from '../utils/alumineroLogic';
import {
  buildTramos610AcomodadosCards,
  OptimizacionTramos1DResult,
  Tramo610VisualCard,
} from '../utils/modulacionLogic';

interface Tramos610AcomodadosSectionProps {
  id?: string;
  optimizacion: OptimizacionTramos1DResult;
  acabadoByPerfil?: Partial<Record<PerfilCatalogoId, string>>;
  defaultAcabado?: string;
  compact?: boolean;
  onSelectPerfil?: (card: Tramo610VisualCard) => void;
}

export const Tramos610AcomodadosSection: React.FC<Tramos610AcomodadosSectionProps> = ({
  id = 'tramos-610-acomodados-section',
  optimizacion,
  acabadoByPerfil,
  defaultAcabado = 'Natural',
  compact = false,
  onSelectPerfil,
}) => {
  const cards = buildTramos610AcomodadosCards(optimizacion, {
    acabadoByPerfil,
    defaultAcabado,
  });

  if (cards.length === 0) return null;

  const totalBarras = cards.reduce((acc, c) => acc + c.barrasCount, 0);

  return (
    <section
      id={id}
      aria-label="Tramos de 6.10 ya acomodados"
      className={`${compact ? 'mt-3 pt-3' : 'mt-4 pt-4'} flex flex-col gap-3`}
      style={{
        borderTop: '1px solid #cbd5e1',
      }}
    >
      {/* Encabezado destacado con insignia */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div
          className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl"
          style={{
            backgroundColor: '#ecfdf5',
            border: '1px solid #6ee7b7',
            color: '#064e3b',
          }}
        >
          <CheckCircle2
            className="w-4 h-4 shrink-0"
            style={{ color: '#059669' }}
            aria-hidden="true"
          />
          <h3
            className="m-0 text-[13.5px] sm:text-[14.5px] font-extrabold tracking-tight"
            style={{ color: '#064e3b' }}
          >
            ✓ Tramos de 6.10 ya acomodados
          </h3>
        </div>
        <span
          className="px-2.5 py-1 rounded-lg mono text-[11.5px] font-extrabold"
          style={{
            backgroundColor: '#f1f5f9',
            border: '1px solid #cbd5e1',
            color: '#1e293b',
          }}
        >
          {totalBarras} {totalBarras === 1 ? 'barra' : 'barras'} de 6.10 m ·{' '}
          {optimizacion.aprovechamientoGlobalPct}% uso
        </span>
      </div>

      {/* Tarjetas por código de perfil */}
      <div className="flex flex-col gap-3">
        {cards.map((card) => (
          <article
            key={`${card.perfilId}-${card.acabado}`}
            data-tramo-card-code={card.codigo}
            data-preserve-light="true"
            className="rounded-2xl p-3.5 sm:p-4 flex flex-col gap-2.5 shadow-sm"
            style={{
              backgroundColor: '#ffffff',
              border: '1px solid #cbd5e1',
              color: '#0f172a',
            }}
          >
            {/* Cabecera de la tarjeta: Izquierda código + acabado, Derecha total de barras */}
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <div className="min-w-0">
                {onSelectPerfil ? (
                  <button
                    type="button"
                    onClick={() => onSelectPerfil(card)}
                    className="p-0 m-0 bg-transparent border-0 text-left cursor-pointer hover:underline"
                    style={{ backgroundColor: 'transparent', color: '#0f172a' }}
                  >
                    <strong
                      className="text-[14.5px] sm:text-[15px] font-extrabold mono"
                      style={{ color: '#0f172a' }}
                    >
                      {card.headerLeft}
                    </strong>
                  </button>
                ) : (
                  <strong
                    className="text-[14.5px] sm:text-[15px] font-extrabold mono"
                    style={{ color: '#0f172a' }}
                  >
                    {card.headerLeft}
                  </strong>
                )}
                {card.perfilNombre && (
                  <span
                    className="ml-2 text-[11.5px] font-semibold"
                    style={{ color: '#64748b' }}
                  >
                    {card.perfilNombre}
                  </span>
                )}
              </div>
              <strong
                className="text-[13px] sm:text-[13.5px] font-extrabold mono shrink-0"
                style={{ color: '#1b7a9c' }}
              >
                {card.headerRight}
              </strong>
            </div>

            {/* Subtítulo: piezas · mm netos · sobrante */}
            <p
              className="m-0 text-[12px] font-semibold mono"
              style={{ color: '#475569' }}
            >
              {card.subtitulo}
            </p>

            {/* Barras gráficas proporcionales de 6.10 m */}
            <div className="flex flex-col gap-2.5">
              {card.barras.map((barra) => (
                <div key={barra.id} className="flex flex-col gap-1.5">
                  <div
                    className="w-full h-8 sm:h-9 rounded-lg overflow-hidden flex items-stretch"
                    style={{
                      backgroundColor: '#e2e8f0',
                      border: '1px solid #cbd5e1',
                    }}
                    role="img"
                    aria-label={barra.resumenTexto}
                  >
                    {barra.piezas.map((pieza, pIdx) => (
                      <div
                        key={`${barra.id}-p-${pIdx}`}
                        title={`${pieza.nombre}: ${pieza.mm} mm`}
                        style={{
                          width: `${pieza.widthPct}%`,
                          backgroundColor: '#1b7a9c',
                          color: '#ffffff',
                          borderRight: '1.5px solid rgba(255, 255, 255, 0.9)',
                        }}
                        className="h-full flex items-center justify-center text-[10px] sm:text-[11px] font-extrabold mono px-0.5 overflow-hidden select-none"
                      >
                        <span className="truncate" style={{ color: '#ffffff' }}>
                          {pieza.mm}
                        </span>
                      </div>
                    ))}
                    {barra.sobranteMm > 0 && (
                      <div
                        title={`Sobrante: ${barra.sobranteMm} mm`}
                        style={{
                          width: `${Math.max(0, barra.sobrantePct)}%`,
                          backgroundColor: '#e2e8f0',
                        }}
                        className="h-full flex-1 min-w-[4px]"
                      />
                    )}
                  </div>

                  {/* Desglose en texto debajo de la barra */}
                  <p
                    className="m-0 text-[11.5px] sm:text-[12px] font-semibold mono leading-snug break-words"
                    style={{ color: '#334155' }}
                  >
                    {barra.resumenTexto}
                  </p>
                </div>
              ))}
            </div>
          </article>
        ))}
      </div>
    </section>
  );
};
