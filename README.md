# Bódate · Organiza tu boda 💍

App (PWA) para organizar una boda: invitados, mesas, tareas, presupuesto, pagos,
proveedores, cronograma del día, música y regalos. Se instala en el móvil pulsando
"Añadir a pantalla de inicio" y funciona como una app normal, incluso sin conexión.

Los datos se guardan en el propio dispositivo (no hace falta cuenta). Cada persona que
la instale tiene su propia boda. Para pasar tus datos de un móvil a otro: en **Ajustes →
Descargar copia** y luego **Cargar copia** en el otro.

---

## Opción A — Publicarla SIN ordenador (la más fácil)

Con esto cualquiera podrá abrirla e instalarla desde un enlace.

1. Crea una cuenta gratis en **GitHub** (github.com).
2. Crea un repositorio nuevo (botón "New") y sube **todos los archivos de esta carpeta**
   (puedes arrastrarlos en "uploading an existing file").
3. Entra en **vercel.com**, regístrate con tu cuenta de GitHub y pulsa **"Add New… → Project"**.
4. Elige el repositorio de Bódate y pulsa **Deploy**. Vercel detecta Vite solo.
5. En 1–2 minutos te da una dirección tipo `https://bodate.vercel.app`.
   ¡Ese es el enlace que compartes! Tu novia lo abre y:
   - **iPhone (Safari):** botón Compartir → "Añadir a pantalla de inicio".
   - **Android (Chrome):** menú ⋮ → "Instalar aplicación" / "Añadir a pantalla de inicio".

> Para un nombre propio tipo `bodate.app`, compra el dominio y conéctalo en
> Vercel → Settings → Domains.

## Opción B — Con ordenador (Node.js instalado)

```bash
npm install      # instala dependencias
npm run dev      # pruébala en local (http://localhost:5173)
npm run build    # genera la carpeta dist/ lista para publicar
```

Luego sube la carpeta **dist/** a cualquier hosting (Netlify, Vercel, etc.).
En Netlify puedes incluso arrastrar la carpeta `dist` a netlify.com/drop.

---

## Cambiar el logo

Los iconos están en `public/` (pwa-192.png, pwa-512.png, pwa-512-maskable.png,
apple-touch-icon.png, favicon.svg). Sustitúyelos por los tuyos manteniendo los nombres.

## Estructura

```
bodate/
├─ index.html
├─ package.json
├─ vite.config.js
├─ public/        ← iconos de la app
└─ src/
   ├─ App.jsx     ← toda la app
   ├─ main.jsx
   └─ index.css
```

Hecho con cariño. ¡Felicidades por la boda! 🌿
