// ⚠️ MÓDULO PROTEGIDO: NO MODIFICAR NI ELIMINAR EN FUTURAS ACTUALIZACIONES A MENOS QUE EL USUARIO LO SOLICITE EXPLÍCITAMENTE.
import React, { useEffect, useRef, useState } from 'react';
import { Eye, EyeOff, ShieldCheck } from 'lucide-react';
import { verifyAdminAccessCredential, verifyRecoveryPin } from '../utils/alumineroLogic';
import {
  clearLegacyAdminKeys,
  loadAdminPasswordOverride,
  saveAdminPasswordOverride,
} from '../utils/storageHelpers';
import { resetAdminPasswordWithServer, verifyAdminPasswordWithServer } from '../utils/cloudSync';

export interface AdminGateModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const AdminGateModal: React.FC<AdminGateModalProps> = ({ open, onClose, onSuccess }) => {
  const [step, setStep] = useState<'login' | 'pin' | 'new-password'>('login');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [recoveryPin, setRecoveryPin] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [infoMsg, setInfoMsg] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const pinRef = useRef<HTMLInputElement>(null);
  const newPwdRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      clearLegacyAdminKeys();
      setStep('login');
      setPassword('');
      setShowPassword(false);
      setRecoveryPin('');
      setNewPassword('');
      setShowNewPassword(false);
      setErrorMsg('');
      setInfoMsg('');
      setSubmitting(false);
      const timer = window.setTimeout(() => inputRef.current?.focus(), 40);
      return () => window.clearTimeout(timer);
    } else {
      setStep('login');
      setPassword('');
      setShowPassword(false);
      setRecoveryPin('');
      setNewPassword('');
      setShowNewPassword(false);
      setErrorMsg('');
      setInfoMsg('');
      setSubmitting(false);
    }
  }, [open]);

  if (!open) return null;

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;
    const cleanPass = password.trim();
    if (!cleanPass) {
      setErrorMsg('Contraseña incorrecta');
      return;
    }

    // 1) Verificación local instantánea: contraseña configurada (por defecto 1983) o PIN de recuperación (202699)
    const localAuth = verifyAdminAccessCredential(cleanPass, loadAdminPasswordOverride());
    if (localAuth.ok) {
      setPassword('');
      setErrorMsg('');
      setInfoMsg('');
      setSubmitting(false);
      onSuccess();
      return;
    }

    // 2) Respaldo en nube con límite de tiempo corto y manejo de errores para nunca bloquear el botón
    setSubmitting(true);
    try {
      const timeoutPromise = new Promise<{ ok: boolean; offline: boolean }>((resolve) => {
        window.setTimeout(() => resolve({ ok: false, offline: true }), 2200);
      });
      const serverCheck = await Promise.race([
        verifyAdminPasswordWithServer(cleanPass).catch(() => ({ ok: false, offline: true })),
        timeoutPromise,
      ]);

      if (serverCheck.ok) {
        saveAdminPasswordOverride(cleanPass);
        setPassword('');
        setErrorMsg('');
        setInfoMsg('');
        onSuccess();
        return;
      }

      setErrorMsg('Contraseña incorrecta');
    } catch {
      setErrorMsg('Contraseña incorrecta');
    } finally {
      setSubmitting(false);
    }
  };

  const handlePinSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!verifyRecoveryPin(recoveryPin)) {
      setErrorMsg('PIN de recuperación incorrecto');
      return;
    }
    setErrorMsg('');
    setStep('new-password');
    window.setTimeout(() => newPwdRef.current?.focus(), 40);
  };

  const handleSaveNewPassword = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanNew = newPassword.trim();
    if (cleanNew.length < 4) {
      setErrorMsg('Escribe una contraseña de al menos 4 caracteres');
      return;
    }
    const pinForCloud = recoveryPin.trim();
    saveAdminPasswordOverride(cleanNew);
    void resetAdminPasswordWithServer(pinForCloud, cleanNew).catch(() => {
      // Sincronización en segundo plano sin bloquear el cambio local
    });
    setPassword('');
    setRecoveryPin('');
    setNewPassword('');
    setErrorMsg('');
    setInfoMsg('Nueva contraseña guardada correctamente. Ingresa con tu nueva clave.');
    setStep('login');
    window.setTimeout(() => inputRef.current?.focus(), 40);
  };

  return (
    <div
      id="modal-admin-auth"
      className="fixed inset-0 z-[10050] bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-label="Acceso de Administrador"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      {step === 'login' && (
        <form
          onSubmit={handleLoginSubmit}
          className="w-full max-w-[400px] bg-white text-slate-900 rounded-[20px] p-5 shadow-2xl border border-slate-200"
        >
          <div className="flex items-start justify-between gap-2 mb-3">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-blue-50 border border-blue-200 text-blue-700 flex items-center justify-center shrink-0">
                <ShieldCheck className="w-5 h-5" aria-hidden="true" />
              </div>
              <div>
                <h2 className="m-0 text-[18px] font-extrabold text-slate-900">Seguridad · Administrador</h2>
                <p className="m-0 text-[12px] text-slate-500">
                  Ingresa la contraseña para abrir el Panel de Administrador
                </p>
              </div>
            </div>
            <button
              type="button"
              id="btn-admin-auth-close"
              onClick={onClose}
              aria-label="Cerrar cuadro de contraseña"
              className="min-w-[36px] min-h-[36px] rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold cursor-pointer"
            >
              ✕
            </button>
          </div>

          {infoMsg && (
            <p
              id="msg-admin-password-reset-ok"
              className="mb-3 p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-[12px] font-bold"
            >
              {infoMsg}
            </p>
          )}

          <div className="mb-3">
            <label htmlFor="inp-admin-password" className="block text-[12px] font-bold text-slate-600 mb-1">
              Clave de acceso
            </label>
            <div className="relative flex items-center">
              <input
                ref={inputRef}
                id="inp-admin-password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="off"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (errorMsg) setErrorMsg('');
                }}
                placeholder="••••••••••••"
                className="w-full min-h-[44px] rounded-xl border border-slate-300 bg-white text-slate-900 pl-3 pr-11 text-[14px] font-semibold focus:outline-none focus:border-blue-600"
              />
              <button
                type="button"
                id="btn-toggle-admin-password"
                onClick={() => setShowPassword((prev) => !prev)}
                aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                title={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                className="absolute right-1.5 inline-flex items-center justify-center w-9 h-9 rounded-lg text-slate-500 hover:text-slate-800 cursor-pointer"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            {errorMsg && (
              <p
                id="err-admin-password"
                role="alert"
                className="mt-1.5 mb-0 text-[12.5px] font-bold text-red-600"
              >
                {errorMsg}
              </p>
            )}
          </div>

          <div className="flex items-center justify-end gap-2">
            <button
              type="button"
              id="btn-admin-auth-cancel"
              onClick={onClose}
              className="min-h-[44px] px-4 rounded-xl border border-slate-200 bg-slate-100 hover:bg-slate-200 text-slate-700 text-[13px] font-bold cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              id="btn-admin-auth-submit"
              disabled={submitting}
              className="min-h-[44px] px-5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-[13.5px] font-extrabold cursor-pointer disabled:opacity-60 shadow-sm"
            >
              {submitting ? 'Verificando...' : 'Entrar'}
            </button>
          </div>

          <div className="mt-3 text-center">
            <button
              type="button"
              id="btn-forgot-admin-password"
              onClick={() => {
                setErrorMsg('');
                setInfoMsg('');
                setRecoveryPin('');
                setStep('pin');
                window.setTimeout(() => pinRef.current?.focus(), 40);
              }}
              className="text-[12px] font-semibold text-slate-500 hover:text-blue-600 underline cursor-pointer bg-transparent border-0"
            >
              ¿Olvidaste tu contraseña?
            </button>
          </div>
        </form>
      )}

      {step === 'pin' && (
        <form
          onSubmit={handlePinSubmit}
          className="w-full max-w-[400px] bg-white text-slate-900 rounded-[20px] p-5 shadow-2xl border border-slate-200"
        >
          <div className="flex items-start justify-between gap-2 mb-3">
            <div>
              <h2 className="m-0 text-[18px] font-extrabold text-slate-900">Recuperar Acceso</h2>
              <p className="m-0 text-[12px] text-slate-500">
                Ingresa el PIN de recuperación maestro para definir una nueva clave
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label="Cerrar recuperación"
              className="min-w-[36px] min-h-[36px] rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold cursor-pointer"
            >
              ✕
            </button>
          </div>

          <div className="mb-3">
            <label htmlFor="inp-admin-recovery-pin" className="block text-[12px] font-bold text-slate-600 mb-1">
              PIN de recuperación maestro
            </label>
            <input
              ref={pinRef}
              id="inp-admin-recovery-pin"
              type="password"
              inputMode="numeric"
              autoComplete="off"
              value={recoveryPin}
              onChange={(e) => {
                setRecoveryPin(e.target.value);
                if (errorMsg) setErrorMsg('');
              }}
              placeholder="PIN maestro"
              className="w-full min-h-[44px] rounded-xl border border-slate-300 bg-white text-slate-900 px-3 mono text-[14px] font-bold focus:outline-none focus:border-blue-600"
            />
            {errorMsg && (
              <p
                id="err-admin-recovery-pin"
                role="alert"
                className="mt-1.5 mb-0 text-[12.5px] font-bold text-red-600"
              >
                {errorMsg}
              </p>
            )}
          </div>

          <div className="flex items-center justify-between gap-2">
            <button
              type="button"
              onClick={() => {
                setErrorMsg('');
                setStep('login');
              }}
              className="min-h-[44px] px-3.5 rounded-xl border border-slate-200 bg-slate-100 hover:bg-slate-200 text-slate-700 text-[12.5px] font-bold cursor-pointer"
            >
              Volver
            </button>
            <button
              type="submit"
              id="btn-verify-recovery-pin"
              className="min-h-[44px] px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-[13px] font-extrabold cursor-pointer"
            >
              Validar PIN
            </button>
          </div>
        </form>
      )}

      {step === 'new-password' && (
        <form
          onSubmit={handleSaveNewPassword}
          className="w-full max-w-[400px] bg-white text-slate-900 rounded-[20px] p-5 shadow-2xl border border-slate-200"
        >
          <div className="flex items-start justify-between gap-2 mb-3">
            <div>
              <h2 className="m-0 text-[18px] font-extrabold text-slate-900">Nueva Contraseña Admin</h2>
              <p className="m-0 text-[12px] text-slate-500">
                Guarda una nueva contraseña persistente para el Panel de Administrador
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label="Cerrar cambio de contraseña"
              className="min-w-[36px] min-h-[36px] rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold cursor-pointer"
            >
              ✕
            </button>
          </div>

          <div className="mb-3">
            <label htmlFor="inp-admin-new-password" className="block text-[12px] font-bold text-slate-600 mb-1">
              Nueva contraseña de administrador
            </label>
            <div className="relative flex items-center">
              <input
                ref={newPwdRef}
                id="inp-admin-new-password"
                type={showNewPassword ? 'text' : 'password'}
                autoComplete="new-password"
                value={newPassword}
                onChange={(e) => {
                  setNewPassword(e.target.value);
                  if (errorMsg) setErrorMsg('');
                }}
                placeholder="Mínimo 4 caracteres"
                className="w-full min-h-[44px] rounded-xl border border-slate-300 bg-white text-slate-900 pl-3 pr-11 text-[14px] font-semibold focus:outline-none focus:border-blue-600"
              />
              <button
                type="button"
                id="btn-toggle-admin-new-password"
                onClick={() => setShowNewPassword((prev) => !prev)}
                aria-label={showNewPassword ? 'Ocultar nueva contraseña' : 'Mostrar nueva contraseña'}
                className="absolute right-1.5 inline-flex items-center justify-center w-9 h-9 rounded-lg text-slate-500 hover:text-slate-800 cursor-pointer"
              >
                {showNewPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            {errorMsg && (
              <p role="alert" className="mt-1.5 mb-0 text-[12.5px] font-bold text-red-600">
                {errorMsg}
              </p>
            )}
          </div>

          <div className="flex items-center justify-between gap-2">
            <button
              type="button"
              onClick={() => {
                setErrorMsg('');
                setStep('login');
              }}
              className="min-h-[44px] px-3.5 rounded-xl border border-slate-200 bg-slate-100 hover:bg-slate-200 text-slate-700 text-[12.5px] font-bold cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              id="btn-save-new-admin-password"
              disabled={submitting}
              className="min-h-[44px] px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-[13px] font-extrabold cursor-pointer disabled:opacity-60"
            >
              {submitting ? 'Guardando...' : 'Guardar contraseña'}
            </button>
          </div>
        </form>
      )}
    </div>
  );
};

export const AdminAuthModal = AdminGateModal;
