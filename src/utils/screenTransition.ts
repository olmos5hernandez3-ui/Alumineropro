export type ScreenTransitionPhase = 'idle' | 'exiting' | 'entering';
export type NavTransitionDir = 'none' | 'forward' | 'back';

export const SCREEN_EXIT_DURATION_MS = 140;

const GPU_BASE =
  'transform-gpu motion-reduce:transition-none motion-reduce:transform-none';

/**
 * Devuelve clases de Tailwind para animaciones suaves de salida y entrada
 * entre pantallas usando únicamente `opacity` y `transform` (`translate-x-*`).
 */
export function getScreenTransitionClasses(
  phase: ScreenTransitionPhase,
  direction: NavTransitionDir
): string {
  if (phase === 'exiting') {
    const exitTranslate = direction === 'back' ? 'translate-x-4' : '-translate-x-4';
    return `${GPU_BASE} will-change-[opacity,transform] transition-[opacity,transform] duration-150 ease-in opacity-0 ${exitTranslate} pointer-events-none`;
  }

  if (phase === 'entering') {
    const enterStartTranslate = direction === 'back' ? '-translate-x-4' : 'translate-x-4';
    return `${GPU_BASE} will-change-[opacity,transform] transition-none opacity-0 ${enterStartTranslate}`;
  }

  return `${GPU_BASE} transition-[opacity,transform] duration-200 ease-out opacity-100 translate-x-0`;
}
