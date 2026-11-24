import test from 'node:test';
import assert from 'node:assert/strict';
import { getScreenTransitionClasses } from './screenTransition';
import {
  formatAdminAuthDiagnostic,
  isMobileOrStandalonePwa,
  shouldAdminFallbackToRedirect,
} from './firebaseAuthHelpers';

test('getScreenTransitionClasses returns directional Tailwind opacity and translate classes', () => {
  const exitForward = getScreenTransitionClasses('exiting', 'forward');
  assert.match(exitForward, /opacity-0/);
  assert.match(exitForward, /-translate-x-4/);
  assert.match(exitForward, /transition-\[opacity,transform\]/);
  assert.match(exitForward, /transform-gpu/);

  const enterForward = getScreenTransitionClasses('entering', 'forward');
  assert.match(enterForward, /opacity-0/);
  assert.match(enterForward, /\btranslate-x-4\b/);
  assert.match(enterForward, /transition-none/);

  const exitBack = getScreenTransitionClasses('exiting', 'back');
  assert.match(exitBack, /opacity-0/);
  assert.match(exitBack, /\btranslate-x-4\b/);

  const enterBack = getScreenTransitionClasses('entering', 'back');
  assert.match(enterBack, /opacity-0/);
  assert.match(enterBack, /-translate-x-4/);

  const idle = getScreenTransitionClasses('idle', 'forward');
  assert.match(idle, /opacity-100/);
  assert.match(idle, /translate-x-0/);
  assert.match(idle, /duration-200/);
  assert.match(idle, /ease-out/);
});

test('shouldAdminFallbackToRedirect falls back on popup-blocked, cancelled-popup-request, and mobile popup errors', () => {
  assert.equal(
    shouldAdminFallbackToRedirect({ code: 'auth/popup-blocked' }, { isMobileOrPwa: false }),
    true
  );
  assert.equal(
    shouldAdminFallbackToRedirect({ code: 'auth/cancelled-popup-request' }, { isMobileOrPwa: false }),
    true
  );
  assert.equal(
    shouldAdminFallbackToRedirect(
      { code: 'auth/operation-not-supported-in-this-environment' },
      { isMobileOrPwa: false }
    ),
    true
  );

  // Generic popup failure on mobile/PWA triggers redirect fallback
  assert.equal(
    shouldAdminFallbackToRedirect({ code: 'auth/internal-error' }, { isMobileOrPwa: true }),
    true
  );
  assert.equal(
    shouldAdminFallbackToRedirect(new Error('Popup failed on mobile'), { isMobileOrPwa: true }),
    true
  );

  // Non-popup Firebase configuration / network errors do NOT redirect silently
  assert.equal(
    shouldAdminFallbackToRedirect({ code: 'auth/unauthorized-domain' }, { isMobileOrPwa: true }),
    false
  );
  assert.equal(
    shouldAdminFallbackToRedirect({ code: 'auth/network-request-failed' }, { isMobileOrPwa: true }),
    false
  );
  assert.equal(
    shouldAdminFallbackToRedirect({ code: 'auth/operation-not-allowed' }, { isMobileOrPwa: false }),
    false
  );
  assert.equal(
    shouldAdminFallbackToRedirect({ code: 'auth/popup-closed-by-user' }, { isMobileOrPwa: false }),
    false
  );

  assert.equal(isMobileOrStandalonePwa('Mozilla/5.0 (iPhone; CPU iPhone OS 17_0)', false), true);
  assert.equal(isMobileOrStandalonePwa('Mozilla/5.0 (Windows NT 10.0; Win64; x64)', true), true);
  assert.equal(isMobileOrStandalonePwa('Mozilla/5.0 (Windows NT 10.0; Win64; x64)', false), false);
});

test('formatAdminAuthDiagnostic includes exact error.code and hostname without popup-blocked boilerplate', () => {
  const unauth = formatAdminAuthDiagnostic(
    { code: 'auth/unauthorized-domain', message: 'Firebase: Error (auth/unauthorized-domain).' },
    'alumineropro.web.app'
  );
  assert.equal(unauth.code, 'auth/unauthorized-domain');
  assert.equal(unauth.hostname, 'alumineropro.web.app');
  assert.equal(unauth.isUnauthorizedDomain, true);
  assert.match(unauth.fullMessage, /auth\/unauthorized-domain/);
  assert.match(unauth.fullMessage, /alumineropro\.web\.app/);
  assert.doesNotMatch(unauth.fullMessage, /ventanas emergentes/i);

  const generic = formatAdminAuthDiagnostic(
    { code: 'auth/app-not-authorized', message: 'App not authorized' },
    'preview.alumineropro.app'
  );
  assert.equal(generic.code, 'auth/app-not-authorized');
  assert.equal(generic.hostname, 'preview.alumineropro.app');
  assert.match(generic.fullMessage, /auth\/app-not-authorized/);
  assert.match(generic.fullMessage, /preview\.alumineropro\.app/);
});
