# Security Specification — Aluminero Pro Firestore Rules

## 1. Arquitectura de Autenticación y Roles (RBAC)
- **Fail-Closed Catch-All**: `match /{document=**} { allow read, write: if false; }` bloquea cualquier ruta no autorizada o acceso anónimo por defecto.
- **Administrador (`isAdmin()`)**: Verificado mediante correo verificado (`olmos5hernandez3@gmail.com` con `email_verified == true`) o documento dedicado en `admins/{uid}`.
- **Colecciones propiedad del usuario (`users/{userId}`, `talleres/{userId}`, `devices/{deviceId}`, `accounts/{accountId}`)**:
  - Lectura y escritura restringidas estrictamente al propietario autenticado (`request.auth.uid == userId` o `resource.data.ownerUid == request.auth.uid`) o al administrador.
  - Los clientes **no pueden** modificar campos sensibles de suscripción, días de prueba, estado PRO, rol de administrador, revocaciones ni bloqueos (`role`, `proActive`, `planCode`, `planLabel`, `expiresAt`, `trialActive`, `trialExpiresAt`, `revoked`, `blocked`, `adminAssigned`, `promo_colega_usada`, `fecha_activacion_colega`).
- **Colecciones protegidas de Administración**:
  - `config/{configId}`, `adminKeys/{keyId}`, `revokedKeys/{keyCode}`, `blockedDevices/{deviceId}`, `admins/{adminUid}`: Lectura y escritura exclusivas de `isAdmin()`.
  - `tutorial_videos/{videoId}`, `reference_prices/{docId}`, `admin_messages/{messageId}`: Lectura solo para usuarios autenticados (`isSignedIn()`); creación, edición y borrado exclusivos de `isAdmin()`.

## 2. Invariantes de Datos (Data Invariants)
1. Todos los IDs de documento cumplen `isValidId(id)` (`^[a-zA-Z0-9_-]{3,128}$`).
2. Ningún documento acepta campos fantasma (`keys().hasOnly(...)` en creación y `affectedKeys().hasOnly(...)` en actualización).
3. Toda cadena de texto valida tipo (`is string`) y límite de tamaño (`.size() <= maxLength`); URLs de tutoriales exigen `^https://.*`.
4. Los arreglos (`activeDays`, `items`) tienen tamaño acotado y validación de tipo del primer elemento.
5. Campos inmutables (`uid`, `ownerUid`, `deviceId`, `firstSeenAt`, `id`, `createdAt`, `email`) no pueden alterarse tras la creación.
6. Todas las marcas de tiempo se validan en rango temporal coherente contra `request.time.toMillis()`.
