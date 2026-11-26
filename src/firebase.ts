import { initializeApp, type FirebaseApp } from 'firebase/app';
import {
  getAuth,
  getRedirectResult,
  GoogleAuthProvider,
  onAuthStateChanged,
  signInWithPopup,
  signInWithRedirect,
  signOut,
  type Auth,
  type User,
} from 'firebase/auth';
import {
  doc,
  getDocFromServer,
  getFirestore,
  type Firestore,
} from 'firebase/firestore';
import firebaseConfig from '../firebase-applet-config.json';
import {
  formatFirebaseAuthError,
  isMobileOrStandalonePwa,
  type FirebaseAuthErrorInfo,
} from './utils/firebaseAuthHelpers';

export { formatFirebaseAuthError, isMobileOrStandalonePwa, type FirebaseAuthErrorInfo };

export const app: FirebaseApp = initializeApp(firebaseConfig);
export const db: Firestore = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const auth: Auth = getAuth(app);

export const ADMIN_FIREBASE_EMAIL = 'olmos5hernandez3@gmail.com';

export function isFirebaseSignedIn(user: User | null = auth.currentUser): boolean {
  return Boolean(user && typeof user.uid === 'string' && user.uid.length > 0);
}

export function isFirebaseAdminUser(user: User | null = auth.currentUser): boolean {
  if (!user || !user.uid || !user.email) return false;
  return user.email.trim().toLowerCase() === ADMIN_FIREBASE_EMAIL && Boolean(user.emailVerified);
}

export function subscribeFirebaseAuth(callback: (user: User | null) => void): () => void {
  return onAuthStateChanged(auth, callback);
}

export type GoogleAuthFlowResult =
  | { status: 'signed_in'; user: User }
  | { status: 'redirecting'; message: string }
  | { status: 'error'; code: string; message: string; isUnauthorizedDomain: boolean };

export function createGoogleAuthProvider(): GoogleAuthProvider {
  const provider = new GoogleAuthProvider();
  provider.setCustomParameters({ prompt: 'select_account' });
  return provider;
}

export const googleProvider: GoogleAuthProvider = createGoogleAuthProvider();

let lastRedirectOutcome: GoogleAuthFlowResult | null = null;

export function getLastGoogleRedirectOutcome(): GoogleAuthFlowResult | null {
  return lastRedirectOutcome;
}

export function connectGoogleAccountWithFallback(): Promise<GoogleAuthFlowResult> {
  const provider = createGoogleAuthProvider();

  // Invocar signInWithPopup de forma sincrónica en el mismo gesto de clic (también en móvil/PWA)
  // y usar signInWithRedirect ÚNICAMENTE si el error exacto es auth/popup-blocked.
  return signInWithPopup(auth, provider)
    .then((cred): GoogleAuthFlowResult => ({ status: 'signed_in', user: cred.user }))
    .catch(async (popupErr): Promise<GoogleAuthFlowResult> => {
      const info = formatFirebaseAuthError(popupErr);
      if (info.code === 'auth/popup-blocked') {
        try {
          await signInWithRedirect(auth, provider);
          return {
            status: 'redirecting',
            message: 'Ventana emergente bloqueada. Redirigiendo a Google para iniciar sesión...',
          };
        } catch (redirectErr) {
          const redInfo = formatFirebaseAuthError(redirectErr);
          return {
            status: 'error',
            code: redInfo.code,
            message: redInfo.message,
            isUnauthorizedDomain: redInfo.isUnauthorizedDomain,
          };
        }
      }
      return {
        status: 'error',
        code: info.code,
        message: info.message,
        isUnauthorizedDomain: info.isUnauthorizedDomain,
      };
    });
}

export async function consumeGoogleRedirectResult(): Promise<GoogleAuthFlowResult | null> {
  try {
    const cred = await getRedirectResult(auth);
    if (cred?.user) {
      lastRedirectOutcome = { status: 'signed_in', user: cred.user };
      return lastRedirectOutcome;
    }
    return null;
  } catch (err) {
    const info = formatFirebaseAuthError(err);
    lastRedirectOutcome = {
      status: 'error',
      code: info.code,
      message: info.message,
      isUnauthorizedDomain: info.isUnauthorizedDomain,
    };
    return lastRedirectOutcome;
  }
}

export async function signInWithGoogleFirebase(): Promise<User> {
  const result = await connectGoogleAccountWithFallback();
  if (result.status === 'signed_in') {
    return result.user;
  }
  if (result.status === 'redirecting') {
    throw new Error(result.message);
  }
  throw new Error(result.message);
}

export async function signOutFirebase(): Promise<void> {
  await signOut(auth);
}

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(
  error: unknown,
  operationType: OperationType,
  path: string | null
): never {
  const currentUser = auth.currentUser;
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: currentUser?.uid ?? null,
      email: currentUser?.email ?? null,
      emailVerified: currentUser?.emailVerified ?? null,
      isAnonymous: currentUser?.isAnonymous ?? null,
      tenantId: currentUser?.tenantId ?? null,
      providerInfo:
        currentUser?.providerData?.map((provider) => ({
          providerId: provider.providerId,
          email: provider.email,
        })) || [],
    },
    operationType,
    path,
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

export function isFirestoreOfflineError(error: unknown): boolean {
  if (!error || typeof error !== 'object') return false;
  const maybe = error as { code?: unknown; message?: unknown };
  const code = String(maybe.code || '').toLowerCase();
  const msg = String(maybe.message || '').toLowerCase();
  return (
    code === 'unavailable' ||
    code === 'failed-precondition' ||
    msg.includes('client is offline') ||
    msg.includes('network') ||
    msg.includes('unavailable')
  );
}

export function isFirestorePermissionDeniedError(error: unknown): boolean {
  if (!error) return false;
  const maybe = error as { code?: unknown; message?: unknown };
  const code = String(maybe.code || '').toLowerCase();
  const msg = String(maybe.message || error).toLowerCase();
  return (
    code === 'permission-denied' ||
    code.includes('permission-denied') ||
    msg.includes('missing or insufficient permissions') ||
    msg.includes('permission_denied') ||
    msg.includes('permission-denied')
  );
}

let connectionTested = false;

export async function testConnection(): Promise<void> {
  if (connectionTested) return;
  connectionTested = true;
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error) {
    if (
      error instanceof Error &&
      error.message.toLowerCase().includes('the client is offline')
    ) {
      console.error('Please check your Firebase configuration.');
    }
  }
}

if (typeof window !== 'undefined') {
  void testConnection();
}
