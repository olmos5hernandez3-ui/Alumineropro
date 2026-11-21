# Security Specification — Aluminero Pro Firestore Rules

## 1. Arquitectura y Modelo de Confianza
- **Dispositivos cliente (`devices/{deviceId}`)**: Cada celular o navegador genera un `deviceId` único (`ALM-XXXX`) sin requerir inicio de sesión con Google, para garantizar que cualquier dispositivo nuevo aparezca automáticamente como **Versión Gratuita** en el Panel de Administrador desde el primer instante.
- **Claves e historial (`adminKeys/{keyId}`)**: Registra todas las claves generadas o asignadas desde el Panel de Administrador.
- **Revocaciones y bloqueos persistentes (`revokedKeys/{keyCode}`, `blockedDevices/{deviceId}`)**: Mantienen la revocación/bloqueo activos incluso si se borra el registro del historial.
- **Respaldo en la nube (`accounts/{accountId}`)**: Almacena el respaldo exclusivo de planes de 90 días y 1 año usando `accountId` (hash SHA-256 del correo), salt+hash SHA-256 de contraseña y mapas nativos (sin JSON strings).
- **Configuración (`config/{configId}`)**: Almacena únicamente el hash+salt de la contraseña personalizada de administrador.

## 2. Invariantes de Datos (Data Invariants)
1. Todos los IDs de documento (`deviceId`, `keyId`, `keyCode`, `accountId`, `configId`) deben cumplir `isValidId(id)` (`^[a-zA-Z0-9_-]{3,128}$`).
2. Ningún documento acepta campos fantasma (`keys().hasOnly(...)` en creación y `affectedKeys().hasOnly(...)` en actualización).
3. Toda cadena de texto valida tipo (`is string`) y límite de tamaño (`.size() <= maxLength`).
4. Todos los arreglos (`activeDays`) tienen tamaño acotado (`<= 60`) y validación de elemento cuando no están vacíos.
5. Campos inmutables (`deviceId`, `firstSeenAt`, `id`, `createdAt`, `email`) no pueden alterarse tras la creación.
6. Todas las marcas de tiempo (`firstSeenAt`, `lastSeenAt`, `createdAt`, `updatedAt`, `revokedAt`, `blockedAt`) se validan en rango temporal coherente contra `request.time.toMillis()`.

## 3. Dirty Dozen Payloads (Casos rechazados con PERMISSION_DENIED)
1. **ID Poisoning**: Documento `devices/ALM-X...1500chars` -> rechazado por `isValidId(deviceId)`.
2. **Ghost Field / Shadow Create**: `devices/ALM-1234` con campo extra `isSuperAdmin: true` -> rechazado por `keys().hasOnly(...)`.
3. **Shadow Update**: Actualización de `devices/ALM-1234` alterando campo `ghostField` -> rechazado por `affectedKeys().hasOnly(...)`.
4. **Immutable Tampering (firstSeenAt)**: Actualización modificando `firstSeenAt` -> rechazado por `incoming().firstSeenAt == existing().firstSeenAt`.
5. **Immutable Tampering (deviceId)**: Actualización cambiando `deviceId` dentro del cuerpo -> rechazado por `incoming().deviceId == existing().deviceId`.
6. **Type Poisoning**: `proActive: "true"` (string en lugar de bool) -> rechazado por `data.proActive is bool`.
7. **Denial of Wallet String**: `cliente` con 500 caracteres -> rechazado por `data.cliente.size() <= 120`.
8. **Unbounded Array**: `activeDays` con 61 elementos -> rechazado por `data.activeDays.size() <= 60`.
9. **Array Element Type Poisoning**: `activeDays: [12345]` -> rechazado por `(data.activeDays.size() == 0 || data.activeDays[0] is string)`.
10. **Future Timestamp Spoofing**: `createdAt: 9999999999999` -> rechazado por `<= request.time.toMillis() + 300000`.
11. **Account Immutable Email Hijack**: Actualización de `accounts/{id}` cambiando `email` -> rechazado por `incoming().email == existing().email`.
12. **Unmatched Collection Write**: Escritura en colección arbitraria `/hackers/1` -> rechazado por catch-all `match /{document=**} { allow read, write: if false; }`.
