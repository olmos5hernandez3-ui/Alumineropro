import React, { useRef } from 'react';
import { AdminMessageItem, CATALOGO_PERFILES } from '../utils/alumineroLogic';
import { formatMXN, SavedColleagueReferral } from '../utils/storageHelpers';
import { ScreenId } from './TopBarAndDrawer';
import {
  MetallicSetSquareIcon,
  MetallicQuoteDocIcon,
  MetallicWindowIcon,
  MetallicDoorIcon,
  MetallicProfilesIcon,
  MetallicInventoryBoxIcon,
} from './MetallicIcons';

interface Props {
  proActive: boolean;
  homePage?: 0 | 1;
  onChangeHomePage?: (next: 0 | 1) => void;
  hojaPiezasCount: number;
  hojaTotal: number;
  inventarioTramosTotal: number;
  hojasVidrioCount: number;
  notasCount: number;
  cotizacionesCount?: number;
  savedReferral?: SavedColleagueReferral | null;
  referredById?: string | null;
  referredByName?: string | null;
  promoColegaUsed?: boolean;
  pendingRemindersCount?: number;
  dueRemindersCount?: number;
  pushPermission?: NotificationPermission | 'unsupported';
  unreadAdminMessages?: AdminMessageItem[];
  onMarkAdminMessageRead?: (id: string) => void;
  onClaimColleaguePromo?: () => void;
  onOpenColleagueInvite?: () => void;
  onOpenPro?: () => void;
  onEntrarTrabajo: (cat: 'ventanas' | 'puertas') => void;
  onEntrarHoja: () => void;
  onEntrarInventario: () => void;
  onGoToView: (view: ScreenId) => void;
  onOpenAntesDespues: () => void;
  onOpenLevantamiento?: () => void;
  onOpenReminders?: () => void;
}

const SteelCornerAccent: React.FC<{ gold?: boolean }> = ({ gold = false }) => (
  <span
    aria-hidden="true"
    className="pointer-events-none absolute top-0 right-5 w-16 h-[5px] rounded-b-md opacity-90"
    style={{
      background: gold
        ? 'linear-gradient(90deg, rgba(164,132,76,0.2) 0%, #E7CE98 48%, rgba(164,132,76,0.25) 100%)'
        : 'linear-gradient(90deg, rgba(96,124,146,0.18) 0%, #C8DCEB 50%, rgba(96,124,146,0.22) 100%)',
      boxShadow: gold
        ? '0 1px 6px rgba(212, 175, 55, 0.4)'
        : '0 1px 6px rgba(148, 197, 232, 0.35)',
    }}
  />
);

export const MainMenuView: React.FC<Props> = ({
  proActive,
  homePage = 0,
  onChangeHomePage,
  hojaPiezasCount,
  hojaTotal,
  inventarioTramosTotal,
  hojasVidrioCount,
  notasCount,
  cotizacionesCount = 0,
  savedReferral = null,
  referredById = null,
  referredByName = null,
  promoColegaUsed = false,
  pendingRemindersCount = 0,
  dueRemindersCount = 0,
  pushPermission = 'default',
  unreadAdminMessages = [],
  onMarkAdminMessageRead,
  onClaimColleaguePromo,
  onOpenColleagueInvite,
  onOpenPro,
  onEntrarTrabajo,
  onEntrarHoja,
  onEntrarInventario,
  onGoToView,
  onOpenAntesDespues,
  onOpenLevantamiento,
  onOpenReminders,
}) => {
  const swipeStartRef = useRef<{ x: number; y: number; time: number } | null>(null);

  const toggleHomePageLoop = () => {
    onChangeHomePage?.(homePage === 0 ? 1 : 0);
  };

  const handleSwipeStart = (clientX: number, clientY: number) => {
    swipeStartRef.current = { x: clientX, y: clientY, time: Date.now() };
  };

  const handleSwipeEnd = (clientX: number, clientY: number) => {
    const start = swipeStartRef.current;
    swipeStartRef.current = null;
    if (!start) return;
    const dx = clientX - start.x;
    const dy = clientY - start.y;
    const elapsed = Date.now() - start.time;
    if (elapsed > 900) return;
    if (Math.abs(dx) >= 44 && Math.abs(dx) > Math.abs(dy) * 1.25) {
      // Bucle infinito: deslizar izquierda o derecha alterna Vista 1 <-> Vista 2
      toggleHomePageLoop();
    }
  };

  const handlePedirPinClick = () => {
    if (promoColegaUsed) {
      onOpenPro?.();
      return;
    }
    if (savedReferral && onClaimColleaguePromo) {
      onClaimColleaguePromo();
      return;
    }
    if (onOpenPro) {
      onOpenPro();
    } else if (onOpenColleagueInvite) {
      onOpenColleagueInvite();
    }
  };

  const inviterDisplayName = (referredByName || savedReferral?.refName || referredById || '').trim();
  const hasReferral = Boolean(inviterDisplayName);

  return (
    <section
      id="view-menu"
      data-pro-active={proActive ? 'true' : 'false'}
      data-home-page={homePage}
      onTouchStart={(e) => {
        const t = e.touches[0];
        if (t) handleSwipeStart(t.clientX, t.clientY);
      }}
      onTouchEnd={(e) => {
        const t = e.changedTouches[0];
        if (t) handleSwipeEnd(t.clientX, t.clientY);
      }}
      onPointerDown={(e) => {
        if (e.pointerType === 'mouse' && e.button === 0) {
          handleSwipeStart(e.clientX, e.clientY);
        }
      }}
      onPointerUp={(e) => {
        if (e.pointerType === 'mouse') {
          handleSwipeEnd(e.clientX, e.clientY);
        }
      }}
      className="screen-animate pb-36 sm:pb-24 touch-pan-y select-none"
    >
      {/* Avisos / Mensajes del Administrador (sin leer) */}
      {unreadAdminMessages.length > 0 && (
        <div id="menu-admin-messages-stack" className="mb-3 flex flex-col gap-2">
          {unreadAdminMessages.slice(0, 3).map((msg) => (
            <div
              key={msg.id}
              className={`rounded-2xl border p-3.5 shadow-lg ${
                msg.tipo === 'promo'
                  ? 'border-emerald-400/65 bg-emerald-50 dark:bg-emerald-950/75 text-emerald-950 dark:text-emerald-50'
                  : msg.tipo === 'soporte'
                    ? 'border-amber-400/65 bg-amber-50 dark:bg-amber-950/70 text-amber-950 dark:text-amber-50'
                    : 'border-sky-400/65 bg-blue-50 dark:bg-sky-950/75 text-slate-900 dark:text-sky-50'
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-blue-600 text-white">
                      {msg.tipo === 'promo' ? '🎁 Promo' : msg.tipo === 'soporte' ? '🛠️ Soporte' : '📢 Aviso'}
                    </span>
                    <strong className="text-[13.5px] font-extrabold leading-tight">
                      {msg.titulo}
                    </strong>
                  </div>
                  <p className="m-0 mt-1.5 text-[12.5px] leading-relaxed whitespace-pre-line opacity-95">
                    {msg.cuerpo}
                  </p>
                </div>
              </div>
              {onMarkAdminMessageRead && (
                <div className="mt-2.5 flex justify-end">
                  <button
                    type="button"
                    onClick={() => onMarkAdminMessageRead(msg.id)}
                    className="min-h-[34px] px-3 py-1 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-[11.5px] font-extrabold cursor-pointer transition-transform active:scale-95"
                  >
                    ✓ Entendido / Marcar como leído
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Título principal centrado + indicador discreto de vista 1 / 2 */}
      <div className="mb-2.5 sm:mb-3.5 flex flex-col items-center justify-center text-center gap-1.5">
        <h1 className="m-0 text-[clamp(1.45rem,4.8vw,2.1rem)] font-extrabold text-slate-900 dark:text-white leading-[1.1] tracking-[-0.02em] dark:drop-shadow-[0_2px_14px_rgba(255,255,255,0.18)] [text-wrap:balance]">
          {homePage === 0 ? '¿Qué vamos a trabajar?' : 'Catálogo y Herramientas'}
        </h1>
        <div className="inline-flex items-center gap-1.5" role="tablist" aria-label="Vistas de la pantalla de inicio">
          <button
            type="button"
            role="tab"
            id="btn-home-dot-0"
            aria-selected={homePage === 0}
            onClick={() => onChangeHomePage?.(0)}
            className={`px-2.5 py-0.5 rounded-full text-[10.5px] font-extrabold transition-all cursor-pointer border ${
              homePage === 0
                ? 'border-sky-400/70 bg-sky-500/20 text-sky-600 dark:text-sky-200'
                : 'border-slate-300/60 dark:border-white/15 bg-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-white'
            }`}
          >
            1 · Principal
          </button>
          <button
            type="button"
            role="tab"
            id="btn-home-dot-1"
            aria-selected={homePage === 1}
            onClick={() => onChangeHomePage?.(1)}
            className={`px-2.5 py-0.5 rounded-full text-[10.5px] font-extrabold transition-all cursor-pointer border ${
              homePage === 1
                ? 'border-sky-400/70 bg-sky-500/20 text-sky-600 dark:text-sky-200'
                : 'border-slate-300/60 dark:border-white/15 bg-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-white'
            }`}
          >
            2 · Taller y Catálogo
          </button>
        </div>
        {hasReferral && (
          <span
            id="badge-menu-referred-by"
            className="inline-flex items-center gap-1.5 text-[11.5px] font-bold text-emerald-700 dark:text-emerald-300/95 bg-emerald-100 dark:bg-emerald-500/12 border border-emerald-400/50 rounded-full px-3.5 py-1 leading-none"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" aria-hidden="true" />
            Invitado por: {inviterDisplayName}
          </span>
        )}
      </div>

      {/* ===================== VISTA 1 (PRINCIPAL) ===================== */}
      {homePage === 0 && (
        <div id="home-carousel-page-1" className="screen-animate">

      {/* 1. Tarjeta destacada principal: Levantamiento Rápido con escuadra metálica 3D */}
      <button
        type="button"
        id="lev-entry"
        onClick={() => {
          if (onOpenLevantamiento) {
            onOpenLevantamiento();
          } else {
            window.__alumLev?.open();
          }
        }}
        className="group"
      >
        <MetallicSetSquareIcon size={46} className="shrink-0 transition-transform duration-200 group-hover:scale-105" />
        <span style={{ flex: 1, minWidth: 0 }}>
          <span className="block text-[17.5px] sm:text-[19px] font-extrabold text-slate-900 dark:text-white tracking-[-0.015em] leading-tight">
            Levantamiento Rápido
          </span>
          <small>Toma medidas en obra y manda directo a cotizar o modular</small>
        </span>
      </button>

      {/* Aviso de seguimiento de cotizaciones pendientes (si existen) */}
      {onOpenReminders && pendingRemindersCount > 0 && (() => {
        const needsPushActivation = pushPermission === 'default' || pushPermission === 'denied';
        const ctaText =
          pushPermission === 'denied'
            ? 'Desbloquear Push →'
            : pushPermission === 'default'
              ? 'Activar Push →'
              : 'Ver';
        return (
          <button
            type="button"
            id="btn-menu-pending-reminders"
            data-push-permission={pushPermission}
            onClick={onOpenReminders}
            className={`mb-3.5 w-full rounded-2xl px-4 py-3 text-left cursor-pointer border transition-all active:scale-[0.98] flex items-center justify-between gap-3 shadow-lg ${
              dueRemindersCount > 0 || pushPermission === 'denied'
                ? 'border-amber-400/70 bg-amber-500/18 hover:bg-amber-500/26 text-white'
                : 'border-sky-400/50 bg-sky-500/15 hover:bg-sky-500/24 text-white'
            }`}
          >
            <div className="min-w-0">
              <span className="block text-[10.5px] font-extrabold uppercase tracking-wider text-amber-200 truncate">
                {dueRemindersCount > 0
                  ? `🔔 ${dueRemindersCount} seguimiento(s) vencido(s)`
                  : '🔔 Recordatorios de Cotizaciones'}
                {needsPushActivation ? ' · Falta activar avisos Push' : ''}
              </span>
              <span className="block text-[13px] font-extrabold text-white leading-snug mt-0.5">
                {pushPermission === 'denied'
                  ? `Las notificaciones están bloqueadas: desbloquéalas para tus ${pendingRemindersCount} cotización(es) pendiente(s)`
                  : pushPermission === 'default'
                    ? `Activa las notificaciones del navegador para recibir aviso de tus ${pendingRemindersCount} cotización(es) pendiente(s)`
                    : `Tienes ${pendingRemindersCount} cotización(es) pendiente(s) por dar seguimiento`}
              </span>
            </div>
            <span className="shrink-0 px-3 py-1.5 rounded-xl bg-amber-400 text-slate-950 font-extrabold text-[11.5px] whitespace-nowrap">
              {ctaText}
            </span>
          </button>
        );
      })()}

      {/* 2. Banner horizontal verde esmeralda: SOLO visible cuando el usuario llegó por invitación de un colega */}
      {!proActive && hasReferral && (
        <div
          id="card-menu-colleague-promo"
          className={`mb-2.5 sm:mb-3.5 w-full rounded-[16px] px-3.5 py-2.5 text-left transition-all ${
            promoColegaUsed
              ? 'border border-amber-400/50 bg-gradient-to-r from-[#1a1812]/90 via-[#111b24]/95 to-[#161c24]/95 shadow-lg'
              : 'metal-colleague-banner'
          }`}
        >
          {promoColegaUsed ? (
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0">
                <span className="block text-[13.5px] sm:text-[14.5px] font-extrabold text-amber-200 leading-tight">
                  Prueba Colega de 3 días concluida
                </span>
                <p className="m-0 mt-0.5 text-[11px] text-[#B0C4D4] leading-snug">
                  Adquiere un plan de 30, 90 días o 1 Año para continuar con PRO.
                </p>
              </div>
              {onOpenPro && (
                <button
                  type="button"
                  id="btn-menu-upgrade-pro-after-colleague"
                  onClick={onOpenPro}
                  className="shrink-0 min-h-[38px] px-4 py-1.5 rounded-full bg-amber-400 hover:bg-amber-300 active:scale-[0.97] text-slate-950 font-extrabold text-[12.5px] cursor-pointer shadow-md whitespace-nowrap"
                >
                  Actualizar a PRO
                </button>
              )}
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between gap-3">
                <div
                  className="min-w-0 flex-1 cursor-pointer"
                  onClick={() => {
                    if (savedReferral && onClaimColleaguePromo) {
                      onClaimColleaguePromo();
                    } else if (onOpenColleagueInvite) {
                      onOpenColleagueInvite();
                    } else {
                      onOpenPro?.();
                    }
                  }}
                >
                  <span className="block text-[15px] sm:text-[16.5px] font-extrabold text-[#78F5BA] tracking-[-0.01em] leading-tight drop-shadow-[0_1px_2px_rgba(0,0,0,0.45)] truncate">
                    Invitado por: {inviterDisplayName}
                  </span>
                  <span className="block text-[11px] font-semibold text-emerald-100/90 mt-0.5 truncate">
                    {savedReferral
                      ? `Promo #${savedReferral.promoNumber} · 3 días PRO gratis`
                      : '3 días PRO gratis por invitación de colega'}
                  </span>
                </div>
                <button
                  type="button"
                  id="btn-menu-claim-colleague-promo"
                  onClick={handlePedirPinClick}
                  className="metal-colleague-pin-btn shrink-0 min-h-[38px] px-4 sm:px-5 py-1.5 rounded-full font-extrabold text-[13.5px] sm:text-[14px] tracking-tight cursor-pointer transition-all active:scale-95 whitespace-nowrap"
                >
                  Pedir PIN
                </button>
              </div>

              {savedReferral && onOpenPro && (
                <div className="flex items-center justify-end pt-1 border-t border-emerald-300/20">
                  <button
                    type="button"
                    id="btn-menu-enter-colleague-pin"
                    onClick={onOpenPro}
                    className="text-[11.5px] font-bold text-emerald-100 hover:text-white underline underline-offset-2 cursor-pointer bg-transparent border-0 p-0"
                  >
                    Ya tengo mi PIN →
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* 3. Tarjeta ancha destacada: Hoja de Cotización */}
      <button
        type="button"
        id="btn-menu-hoja"
        onClick={onEntrarHoja}
        className="menu-hero-card metal-hero-card mb-3 sm:mb-4 w-full rounded-[18px] p-3.5 sm:p-4 text-left cursor-pointer transition-all duration-150 hover:-translate-y-0.5 active:scale-[0.985] flex flex-col gap-2.5"
      >
        <SteelCornerAccent gold={!proActive} />
        <div className="flex items-start gap-3 min-w-0 w-full">
          <MetallicQuoteDocIcon size={48} className="shrink-0 mt-0.5" />
          <div className="min-w-0 flex-1">
            <div className="flex items-start justify-between gap-2">
              <span className="text-[17.5px] sm:text-[19px] font-extrabold text-white tracking-[-0.015em] leading-tight">
                Hoja de Cotización
              </span>
              {!proActive ? (
                <span className="metal-gold-pro-badge inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-extrabold leading-none whitespace-nowrap shrink-0">
                  <span aria-hidden="true">🔒</span>
                  <span>PRO</span>
                </span>
              ) : (
                <span className="metal-emerald-pill inline-flex items-center px-2.5 py-1 rounded-full text-[10.5px] font-extrabold leading-none whitespace-nowrap shrink-0">
                  PRO Activo
                </span>
              )}
            </div>
            <p className="m-0 text-[12.5px] sm:text-[13px] text-[#B0C4D4] mt-1 leading-snug">
              Partidas de obra, optimización de tramos 6.10 m y PDF
            </p>
          </div>
        </div>

        {/* Resumen rápido tabular (Piezas y Total) */}
        <div className="flex items-center justify-between gap-2 pt-2 border-t border-[#4A6072]/40 w-full">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg bg-[#07131B]/75 border border-[#4A6072]/55 text-[11px] font-semibold text-[#B0C4D4]">
              <span className="text-[9.5px] uppercase tracking-wider opacity-80">Piezas</span>
              <strong className="mono text-white font-extrabold">{hojaPiezasCount} pzas</strong>
            </span>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg bg-[#07131B]/75 border border-[#4A6072]/55 text-[11px] font-semibold text-[#B0C4D4]">
              <span className="text-[9.5px] uppercase tracking-wider opacity-80">Total</span>
              <strong className="mono text-emerald-300 font-extrabold">{formatMXN(hojaTotal)}</strong>
            </span>
          </div>
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.3"
            className="text-[#8CA6BA] shrink-0"
            aria-hidden="true"
          >
            <polyline points="9 18 15 12 9 6" />
          </svg>
        </div>
      </button>

      {/* 4. Cuadrícula principal 2x2 metálica (Ventanas, Puertas, Catálogo Perfiles, Mi Inventario) */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4 mb-7">
        {/* 1. VENTANAS */}
        <button
          type="button"
          id="btn-menu-ventanas"
          onClick={() => onEntrarTrabajo('ventanas')}
          className="menu-grid-card metal-grid-card flex flex-col justify-between gap-2 w-full min-h-[126px] sm:min-h-[144px] p-3 sm:p-4 rounded-[18px] text-left cursor-pointer transition-all duration-150 hover:-translate-y-0.5 active:scale-[0.97]"
        >
          <SteelCornerAccent />
          <div className="flex items-start justify-between gap-1.5 w-full">
            <MetallicWindowIcon size={40} className="shrink-0" />
          </div>
          <div className="mt-1">
            <span className="block text-[16px] sm:text-[17px] font-extrabold text-slate-900 dark:text-white leading-tight tracking-[-0.01em]">
              Ventanas
            </span>
            <span className="menu-card-sub block text-[11.5px] sm:text-[12.5px] mt-1 leading-snug">
              3", 2", Europea, Cancel y Mosq.
            </span>
          </div>
        </button>

        {/* 2. PUERTAS */}
        <button
          type="button"
          id="btn-menu-puertas"
          onClick={() => onEntrarTrabajo('puertas')}
          className="menu-grid-card metal-grid-card flex flex-col justify-between gap-2 w-full min-h-[126px] sm:min-h-[144px] p-3 sm:p-4 rounded-[18px] text-left cursor-pointer transition-all duration-150 hover:-translate-y-0.5 active:scale-[0.97]"
        >
          <SteelCornerAccent />
          <div className="flex items-start justify-between gap-1.5 w-full">
            <MetallicDoorIcon size={40} className="shrink-0" />
            <span
              className={`${
                proActive ? 'metal-emerald-pill' : 'metal-gold-pro-badge'
              } inline-flex items-center justify-center gap-1 px-2.5 py-1 rounded-full text-[10.5px] font-extrabold leading-none whitespace-nowrap shrink-0 mt-0.5`}
            >
              {proActive ? 'PRO Activo' : '🔒 PRO'}
            </span>
          </div>
          <div className="mt-1">
            <span className="block text-[15.5px] sm:text-[17px] font-extrabold text-slate-900 dark:text-white leading-tight tracking-[-0.01em]">
              Puertas
            </span>
            <span className="menu-card-sub block text-[11px] sm:text-[12.5px] mt-0.5 leading-snug">
              Batiente Alumer, 2" y Europea
            </span>
          </div>
        </button>
      </div>
      </div>
      )}

      {/* ===================== VISTA 2 (SECUNDARIA: CATÁLOGO, INVENTARIO Y HERRAMIENTAS) ===================== */}
      {homePage === 1 && (
        <div id="home-carousel-page-2" className="screen-animate">
      <div className="grid grid-cols-2 gap-3 sm:gap-4 mb-5">
        {/* 3. CATÁLOGO PERFILES (con "3\" Gratis" arriba y píldora esmeralda "41 perf." abajo) */}
        <button
          type="button"
          id="btn-menu-catalogo"
          onClick={() => onGoToView('catalogo')}
          className="menu-grid-card metal-grid-card !overflow-visible flex flex-col justify-between gap-2 w-full min-h-[128px] sm:min-h-[144px] p-3 sm:p-4 pb-5 rounded-[18px] text-left cursor-pointer transition-all duration-150 hover:-translate-y-0.5 active:scale-[0.97]"
        >
          <SteelCornerAccent />
          <div className="flex items-start justify-between gap-1.5 w-full">
            <MetallicProfilesIcon size={38} className="shrink-0" />
            <span className="metal-bronze-free-badge inline-flex items-center justify-center px-2 py-1 rounded-full text-[10px] font-extrabold leading-none whitespace-nowrap shrink-0 mt-0.5">
              3" Gratis
            </span>
          </div>
          <div className="mt-1">
            <span className="block text-[15px] sm:text-[16.5px] font-extrabold text-slate-900 dark:text-white leading-tight tracking-[-0.01em]">
              Catálogo Perfiles
            </span>
            <span className="menu-card-sub block text-[11px] sm:text-[12.5px] mt-0.5 leading-snug">
              Secciones Alumer y fotos reales
            </span>
          </div>
          {/* Píldora verde esmeralda centrada en borde inferior */}
          <span className="metal-cat-bottom-pill mono pointer-events-none absolute -bottom-3.5 left-1/2 -translate-x-1/2 inline-flex items-center justify-center px-3.5 py-1 rounded-full text-[11px] font-extrabold leading-none whitespace-nowrap z-10">
            {CATALOGO_PERFILES.length} perf.
          </span>
        </button>

        {/* 4. MI INVENTARIO */}
        <button
          type="button"
          id="btn-menu-inventario"
          onClick={onEntrarInventario}
          className="menu-grid-card metal-grid-card flex flex-col justify-between gap-2 w-full min-h-[128px] sm:min-h-[144px] p-3 sm:p-4 pb-5 rounded-[18px] text-left cursor-pointer transition-all duration-150 hover:-translate-y-0.5 active:scale-[0.97]"
        >
          <SteelCornerAccent />
          <div className="flex items-start justify-between gap-1.5 w-full">
            <MetallicInventoryBoxIcon size={38} className="shrink-0" />
            <span
              className={`${
                proActive ? 'metal-emerald-pill' : 'metal-gold-pro-badge'
              } mono inline-flex items-center justify-center gap-1 px-2 py-1 rounded-full text-[10px] font-extrabold leading-none whitespace-nowrap shrink-0 mt-0.5`}
            >
              {!proActive ? '🔒 PRO' : `${inventarioTramosTotal} tr.`}
            </span>
          </div>
          <div className="mt-1">
            <span className="block text-[15px] sm:text-[16.5px] font-extrabold text-slate-900 dark:text-white leading-tight tracking-[-0.01em]">
              Mi Inventario
            </span>
            <span className="menu-card-sub block text-[11px] sm:text-[12.5px] mt-0.5 leading-snug">
              Tramos, sobrantes y herrajes
            </span>
          </div>
        </button>
      </div>

      {/* 5. Herramientas adicionales del taller */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4">
        {/* 5. NOTAS DE OBRA */}
        <button
          type="button"
          id="btn-menu-notas"
          onClick={() => onGoToView('notas')}
          className="menu-grid-card metal-grid-card flex flex-col justify-between gap-3 w-full min-h-[124px] sm:min-h-[132px] p-3.5 sm:p-4 rounded-[18px] text-left cursor-pointer transition-all duration-150 hover:-translate-y-0.5 active:scale-[0.97]"
        >
          <div className="flex items-center justify-between gap-2 w-full">
            <div className="metal-icon-btn w-10 h-10 rounded-xl flex items-center justify-center shrink-0">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M12 20h9" />
                <path d="M16.5 3.5a2.121 2.121 0 1 1 3 3L7 19l-4 1 1-4Z" />
              </svg>
            </div>
            <span className="metal-emerald-pill mono inline-flex items-center justify-center px-2.5 py-1 rounded-full text-[10px] font-extrabold leading-none whitespace-nowrap shrink-0">
              {notasCount > 0 ? `${notasCount} notas` : 'Gratis'}
            </span>
          </div>
          <div>
            <span className="block text-[14.5px] sm:text-[15.5px] font-extrabold text-slate-900 dark:text-white leading-tight">
              Notas de Obra
            </span>
            <span className="menu-card-sub block text-[11px] sm:text-[12px] mt-1 leading-snug">
              Medidas rápidas y fotos en campo
            </span>
          </div>
        </button>

        {/* 6. MODULACIÓN Y CORTES (GRATIS) */}
        <button
          type="button"
          id="btn-menu-modulacion"
          onClick={() => onGoToView('modulacion')}
          className="menu-grid-card metal-grid-card flex flex-col justify-between gap-3 w-full min-h-[124px] sm:min-h-[132px] p-3.5 sm:p-4 rounded-[18px] text-left cursor-pointer transition-all duration-150 hover:-translate-y-0.5 active:scale-[0.97]"
        >
          <div className="flex items-center justify-between gap-2 w-full">
            <div className="metal-icon-btn w-10 h-10 rounded-xl flex items-center justify-center shrink-0">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M21 6H3" />
                <path d="M10 12H3" />
                <path d="M10 18H3" />
                <path d="m14 15 3 3 5-5" />
              </svg>
            </div>
            <span className="metal-emerald-pill inline-flex items-center justify-center px-2.5 py-1 rounded-full text-[10px] font-extrabold leading-none whitespace-nowrap shrink-0">
              Gratis
            </span>
          </div>
          <div>
            <span className="block text-[14.5px] sm:text-[15.5px] font-extrabold text-slate-900 dark:text-white leading-tight">
              Modulación y Cortes
            </span>
            <span className="menu-card-sub block text-[11px] sm:text-[12px] mt-1 leading-snug">
              Asistente 5 pasos y medidas exactas
            </span>
          </div>
        </button>

        {/* 7. MI TALLER Y PRECIOS */}
        <button
          type="button"
          id="btn-menu-taller"
          onClick={() => onGoToView('taller')}
          className="menu-grid-card metal-grid-card flex flex-col justify-between gap-3 w-full min-h-[124px] sm:min-h-[132px] p-3.5 sm:p-4 rounded-[18px] text-left cursor-pointer transition-all duration-150 hover:-translate-y-0.5 active:scale-[0.97]"
        >
          <div className="flex items-center justify-between gap-2 w-full">
            <div className="metal-icon-btn w-10 h-10 rounded-xl flex items-center justify-center shrink-0">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M3 9l9-6 9 6v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                <path d="M9 22V12h6v10" />
              </svg>
            </div>
            <span className="metal-bronze-free-badge inline-flex items-center justify-center px-2.5 py-1 rounded-full text-[10px] font-extrabold leading-none whitespace-nowrap shrink-0">
              Tarifas
            </span>
          </div>
          <div>
            <span className="block text-[14.5px] sm:text-[15.5px] font-extrabold text-slate-900 dark:text-white leading-tight">
              Mi Taller y Precios
            </span>
            <span className="menu-card-sub block text-[11px] sm:text-[12px] mt-1 leading-snug">
              Logo, tarifas m², métricas y fórmulas
            </span>
          </div>
        </button>

        {/* 8. GALERÍA (ANTES Y DESPUÉS) */}
        <button
          type="button"
          id="btn-menu-antes-despues"
          onClick={onOpenAntesDespues}
          className="menu-grid-card metal-grid-card flex flex-col justify-between gap-3 w-full min-h-[124px] sm:min-h-[132px] p-3.5 sm:p-4 rounded-[18px] text-left cursor-pointer transition-all duration-150 hover:-translate-y-0.5 active:scale-[0.97]"
        >
          <div className="flex items-center justify-between gap-2 w-full">
            <div className="metal-icon-btn w-10 h-10 rounded-xl flex items-center justify-center shrink-0">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <rect x="3" y="4" width="18" height="16" rx="2" />
                <line x1="12" y1="4" x2="12" y2="20" />
                <path d="M6.5 14l2-2 2 2" />
                <path d="M14.5 12l2-2 2 2" />
              </svg>
            </div>
            <span className="metal-bronze-free-badge inline-flex items-center justify-center px-2.5 py-1 rounded-full text-[10px] font-extrabold leading-none whitespace-nowrap shrink-0">
              Clientes
            </span>
          </div>
          <div>
            <span className="block text-[14.5px] sm:text-[15.5px] font-extrabold text-slate-900 dark:text-white leading-tight">
              Galería (Antes y Después)
            </span>
            <span className="menu-card-sub block text-[11px] sm:text-[12px] mt-1 leading-snug">
              Portafolio y presentación a clientes
            </span>
          </div>
        </button>

        {/* 9. OPTIMIZADOR DE VIDRIO (2D) */}
        <button
          type="button"
          id="btn-menu-vidrio"
          onClick={() => onGoToView('vidrio')}
          className="menu-grid-card metal-grid-card flex flex-col justify-between gap-3 w-full min-h-[124px] sm:min-h-[132px] p-3.5 sm:p-4 rounded-[18px] text-left cursor-pointer transition-all duration-150 hover:-translate-y-0.5 active:scale-[0.97]"
        >
          <div className="flex items-center justify-between gap-2 w-full">
            <div className="metal-icon-btn w-10 h-10 rounded-xl flex items-center justify-center shrink-0">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <rect x="3" y="3" width="18" height="18" rx="2" />
                <line x1="11" y1="3" x2="11" y2="21" />
                <line x1="11" y1="12" x2="21" y2="12" />
              </svg>
            </div>
            <span className="metal-bronze-free-badge mono inline-flex items-center justify-center px-2.5 py-1 rounded-full text-[10px] font-extrabold leading-none whitespace-nowrap shrink-0">
              {hojasVidrioCount > 0 ? `${hojasVidrioCount} hojas` : 'Corte 2D'}
            </span>
          </div>
          <div>
            <span className="block text-[14.5px] sm:text-[15.5px] font-extrabold text-slate-900 dark:text-white leading-tight">
              Optimizador de Vidrio (2D)
            </span>
            <span className="menu-card-sub block text-[11px] sm:text-[12px] mt-1 leading-snug">
              Cortes guillotina y % de merma
            </span>
          </div>
        </button>

        {/* 10. HISTORIAL DE COTIZACIONES */}
        <button
          type="button"
          id="btn-menu-cotizaciones"
          onClick={() => onGoToView('cotizaciones')}
          className="menu-grid-card metal-grid-card flex flex-col justify-between gap-3 w-full min-h-[124px] sm:min-h-[132px] p-3.5 sm:p-4 rounded-[18px] text-left cursor-pointer transition-all duration-150 hover:-translate-y-0.5 active:scale-[0.97]"
        >
          <div className="flex items-center justify-between gap-2 w-full">
            <div className="metal-icon-btn w-10 h-10 rounded-xl flex items-center justify-center shrink-0">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2" />
                <rect x="9" y="3" width="6" height="4" rx="1" />
                <path d="M9 12h6" />
                <path d="M9 16h4" />
              </svg>
            </div>
            <span className="metal-bronze-free-badge mono inline-flex items-center justify-center px-2.5 py-1 rounded-full text-[10px] font-extrabold leading-none whitespace-nowrap shrink-0">
              {cotizacionesCount > 0 ? `${cotizacionesCount} folios` : 'Folios'}
            </span>
          </div>
          <div>
            <span className="block text-[14.5px] sm:text-[15.5px] font-extrabold text-slate-900 dark:text-white leading-tight">
              Historial de Cotizaciones
            </span>
            <span className="menu-card-sub block text-[11px] sm:text-[12px] mt-1 leading-snug">
              Enviadas, aprobadas y seguimiento
            </span>
          </div>
        </button>

        {/* 11. VIDEO TUTORIALES */}
        <button
          type="button"
          id="btn-menu-videos"
          onClick={() => onGoToView('videos')}
          className="col-span-2 menu-grid-card metal-grid-card flex items-center justify-between gap-3 w-full min-h-[82px] p-3.5 sm:p-4 rounded-[18px] text-left cursor-pointer transition-all duration-150 hover:-translate-y-0.5 active:scale-[0.985]"
        >
          <div className="flex items-center gap-3 min-w-0">
            <div className="metal-icon-btn w-11 h-11 rounded-xl flex items-center justify-center shrink-0">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <rect x="2" y="4" width="20" height="16" rx="3" />
                <polygon points="10 9 16 12 10 15 10 9" fill="currentColor" />
              </svg>
            </div>
            <div className="min-w-0">
              <span className="block text-[15px] sm:text-[16px] font-extrabold text-slate-900 dark:text-white leading-tight">
                Video Tutoriales
              </span>
              <span className="menu-card-sub block text-[11.5px] sm:text-[12.5px] mt-0.5 leading-snug">
                Guías rápidas de ventanas, cortes 6.10 m, vidrio 2D y PDF
              </span>
            </div>
          </div>
          <span className="metal-emerald-pill inline-flex items-center justify-center px-3 py-1 rounded-full text-[10.5px] font-extrabold leading-none whitespace-nowrap shrink-0">
            Academia
          </span>
        </button>
      </div>
        </div>
      )}
    </section>
  );
};
