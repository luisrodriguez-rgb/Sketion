# Documentacion Tecnica y Changelog de Arquitectura — Sketion

> **Version del Core:** v11.0 GA (Production-Ready Architecture)  
> **Ambito:** Visual Knowledge Workspace, Criptografia E2EE, Persistencia Local-First & Sincronizacion Concurrente.

Este documento detalla exhaustivamente las especificaciones tecnicas, decisiones de arquitectura y mejoras de blindaje aplicadas al nucleo de **Sketion** para su publicacion en el portal oficial y la documentacion del producto.

---

## Tabla de Contenidos
1. [Vision General de la Arquitectura](#1-vision-general-de-la-arquitectura)
2. [Persistencia Local-First & Reconciliacion Concurrente](#2-persistencia-local-first--reconciliacion-concurrente)
3. [Seguridad Criptografica End-to-End (E2EE)](#3-seguridad-criptografica-end-to-end-e2ee)
4. [Control de Acceso Basado en Roles (RBAC en WebSockets)](#4-control-de-acceso-basado-en-roles-rbac-en-websockets)
5. [Optimizacion de Memoria RAM, Cuota y Almacenamiento](#5-optimizacion-de-memoria-ram-cuota-y-almacenamiento)
6. [Service Worker, PWA & LaTeX Offline (MathJax)](#6-service-worker-pwa--latex-offline-mathjax)
7. [Pipelines de Importacion y Visualizacion de Datos](#7-pipelines-de-importacion-y-visualizacion-de-datos)
8. [Changelog Detallado de Archivos Modificados](#8-changelog-detallado-de-archivos-modificados)

---

## 1. Vision General de la Arquitectura

Sketion opera bajo un modelo **hibrido Local-First y Cloud-Sync**:
- **Almacenamiento Local:** IndexedDB (`idb-keyval`) para tableros, historial de versiones y metadatos de usuario con latencia de lectura/escritura 0ms.
- **Sincronizacion Cloud:** Supabase (PostgreSQL + RLS + Supabase Storage) con debounce asincrono y vaciado prioritario (`flush`).
- **Colaboracion Realtime:** WebSockets (`collab-server.js`) con relay ciego y Supabase Realtime Broadcast (canales multiplexados de presencia y lienzo).

```text
┌─────────────────────────────────────────────────────────────┐
│                       SKETION CLIENT                        │
│                                                             │
│  ┌───────────────────────┐       ┌───────────────────────┐  │
│  │   IndexedDB Store     │       │   Web Crypto API      │  │
│  │  (Local-First Cache)  │       │ (AES-GCM 128-bit E2EE)│  │
│  └───────────┬───────────┘       └───────────┬───────────┘  │
│              │                               │              │
└──────────────┼───────────────────────────────┼──────────────┘
               │                               │
        [Debounce + Flush]             [Cifrado Opaco]
               │                               │
               ▼                               ▼
┌──────────────────────────────┐ ┌────────────────────────────┐
│      SUPABASE CLOUD          │ │     COLLAB WEBSOCKET       │
│  (PostgreSQL, RLS, Storage)  │ │   (Relay Ciego + RBAC)     │
└──────────────────────────────┘ └────────────────────────────┘
```

---

## 2. Persistencia Local-First & Reconciliacion Concurrente

### Reconciliacion Elemento por Elemento (`mergeElements`)
En lugar de aplicar politicas de Last-Write-Wins a nivel de tablero completo (que sobrescribian el lienzo entero si dos usuarios editaban de forma offline o remota), se implemento `mergeElements`:
- **Comparacion de Versiones:** Compara `element.version` y `element.updated` de cada figura individual.
- **Fusion No Destructiva:** Si un elemento existe localmente con una version superior, se conserva el cambio local; si la version remota es mas reciente, se adopta la remota.
- **Tolerancia a Conexiones Inestables:** Previene la perdida de trazos o diagramas creados sin conexion al reconectar a Supabase.

### Fusion Atomica de Comentarios (`mergeComments`)
Los hilos de comentarios anclados al lienzo y sus respuestas hijas (`replies`) se reconcilian mediante un mapa indexado por ID (`comment.id` y `reply.id`):
- Dos colaboradores pueden responder simultaneamente al mismo hilo de discusion sin pisar las respuestas del otro.
- Los estados de resolucion (`resolved`) se propagan de forma determinista.

### Vaciado Inmediato de Buffer (`flushPendingSupabaseSync`)
Para evitar perdida de datos si el usuario cierra la pestana o navega fuera de la aplicacion antes de que expire el timer de debounce de 3 segundos:
- `flushPendingSupabaseSync` se ejecuta de forma sincronica e inmediata en los eventos del navegador:
  - `window.addEventListener("beforeunload", ...)`
  - `window.addEventListener("unload", ...)`
  - `document.addEventListener("visibilitychange", ...)` (cuando `document.hidden` es verdadero).

---

## 3. Seguridad Criptografica End-to-End (E2EE)

### Cifrado AES-GCM en el Hash de URL
- **Generacion de Claves:** Claves simetricas de 128 bits generadas en el navegador cliente mediante `crypto.subtle.generateKey`.
- **Embebidura en URL:** El `roomKey` reside estrictamente en el hash de la URL (`#room=<roomId>,<roomKey>`). Los hashes de URL **nunca viajan en los encabezados HTTP ni se envian a servidores**.
- **Canal de Retransmision Ciego:** `collab-server.js` recibe y retransmite exclusivamente `encryptedBuffer` e `iv`. El servidor no posee ni almacena la clave criptografica.

### Extension de E2EE a Comentarios en Tiempo Real
- `sendCommentCreate` y `sendCommentResolve` cifran el payload JSON antes de emitirlo por Socket.io o Supabase Broadcast.
- `client-comment-create` y `client-comment-resolve` reciben y descifran los bytes en el cliente receptor, logrando que el 100% de la sesion de colaboracion (figuras, trazos, cursores, presencia y comentarios) sea homogeneamente cifrada de extremo a extremo.

---

## 4. Control de Acceso Basado en Roles (RBAC en WebSockets)

El servidor de colaboracion (`collab-server.js`) y el cliente (`Portal.tsx`) implementan control estricto de roles:
- **Roles Soportados:** `editor`, `viewer`, `commenter`.
- **Validacion en Handshake:** Al emitir `join-room`, el cliente declara su rol (`socket.data.role = role`).
- **Bloqueo a Nivel de Servidor:**
  - Los sockets con rol `viewer` o `commenter` tienen bloqueadas las emisiones `server-broadcast` y `server-volatile-broadcast`.
  - Los sockets con rol `viewer` no pueden emitir `server-comment-create` ni `server-comment-resolve`.
- **Defensa en Profundidad:** Incluso si un usuario modifica el frontend local, el servidor rechaza cualquier intento de mutacion del lienzo.

---

## 5. Optimizacion de Memoria RAM, Cuota y Almacenamiento

### Blindaje contra `QuotaExceededError` en IndexedDB
- Todas las operaciones de escritura en `boardsDb.ts` (`saveBoard`, `saveBoardsMetadata`, `saveBoardComments`, `saveBoardVersion`) estan protegidas con deteccion de excepciones `QuotaExceededError`.
- Si el navegador agota la cuota asignada en disco, el sistema emite advertencias estructuradas en lugar de generar excepciones no capturadas.

### Prevencion de Fugas de Memoria en Importacion de PDFs
- **Liberacion de Canvas 2D:** Tras procesar cada pagina en `pdfImporter.ts`, se restablecen explicitamente las dimensiones del canvas (`canvas.width = 0; canvas.height = 0`) para liberar los buffers de memoria grafica.
- **Revocacion de Object URLs:** En `App.tsx`, las URLs temporales (`URL.revokeObjectURL(img.dataURL)`) se revocan inmediatamente despues de transferir las paginas a Supabase Storage.

### Preservacion de Archivos Binarios en Restauracion de Versiones
- `restoreBoardVersion` fusiona los diccionarios de binarios (`files`) de la version historica con el tablero actual (`mergedFiles`), evitando que elementos de imagen queden rotos tras restaurar snapshots antiguos.

---

## 6. Service Worker, PWA & LaTeX Offline (MathJax)

- **Vite PWA & Workbox:** Cache runtime configurado para empaquetar chunks JavaScript, fuentes `.woff2` (90 dias) y locales linguisticos.
- **Cache Offline para MathJax:** Regla `CacheFirst` (90 dias) para `https://cdn.jsdelivr.net/npm/mathjax@3/.+`, permitiendo que la compilacion de formulas matematicas y ecuaciones de Machine Learning funcione completamente offline tras la primera carga.
- **Division de Bundle (Code Splitting):** El catalogo de 212 plantillas predefinidas (>5MB) se aislo en `templates.chunk` mediante `manualChunks` en `vite.config.mts`, reduciendo drasticamente el First Contentful Paint (FCP).

---

## 7. Pipelines de Importacion y Visualizacion de Datos

- **Google Sheets & CSV Importer:** Deteccion automatica de filas, cabeceras y tipos de datos (numericos, fechas, texto).
- **Data-to-Chart Visualizer:** Selector integrado en el modal de datos para instanciar:
  1. **Tablas vectoriales:** con ajuste automatico de anchos de columna y alineacion tipografica.
  2. **Graficos de barras vectoriales:** con calculo automatico de escalas, ejes Y graduados y etiquetas.
  3. **Graficos de lineas de tendencia:** con interpolacion de puntos de datos.

---

## 8. Changelog Detallado de Archivos Modificados

| Archivo | Mejoras Aplicadas |
| :--- | :--- |
| `boardsDb.ts` | - Implementacion de `mergeElements` (reconciliacion por version).<br>- Implementacion de `mergeComments` (fusion atomica de hilos).<br>- Funcion `flushPendingSupabaseSync` para guardado instantaneo.<br>- Manejo de `QuotaExceededError` en todas las escrituras.<br>- Preservacion de `mergedFiles` en `restoreBoardVersion`.<br>- Mapeo exhaustivo de metadatos (`is_favorite`, `notes_count`, `comments_count`, etc.). |
| `collab-server.js` | - Control de acceso RBAC por socket (`socket.data.role`).<br>- Bloqueo de broadcasts y comentarios para usuarios `viewer`.<br>- Retransmision de comentarios como buffers cifrados opacos E2EE. |
| `Collab.tsx` | - Cifrado AES-GCM en `sendCommentCreate` y `sendCommentResolve`.<br>- Descifrado transparente en los listeners de comentarios recibidos. |
| `Portal.tsx` | - Envio de parametro `role` al unirse a la sala colaborativa.<br>- Descifrado E2EE en el canal Broadcast de Supabase Realtime. |
| `App.tsx` | - Conexion de `flushPendingSupabaseSync` a `beforeunload`, `unload` y `visibilitychange`.<br>- Revocacion de Object URLs en subida de PDFs para liberar RAM.<br>- Selector de tipo de grafico en modal de datos CSV.<br>- Manejo de `CHANNEL_ERROR` y `TIMED_OUT` en suscripciones Supabase. |
| `pdfImporter.ts` | - Vaciado de memoria de buffers de canvas (`width=0, height=0`) por pagina procesada. |
| `vite.config.mts` | - Code splitting de plantillas en `templates.chunk`.<br>- Regla de cache Workbox para MathJax CDN (LaTeX offline). |
| `supabase_schema.sql` | - Migracion SQL con sentencias `ALTER TABLE public.boards ADD COLUMN IF NOT EXISTS`. |
