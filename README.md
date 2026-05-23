# ikoin — Control de gastos universitarios

App financiera PWA diseñada para la vida universitaria. Registrá gastos e ingresos, seguí tus metas de ahorro y analizá tus hábitos — todo desde el celular.

> Probala en vivo: **[ikoin.vercel.app](https://koin-boa2025-devs-projects.vercel.app)**

---

## Funcionalidades

- **Dashboard** — balance actual, estadísticas semanales y últimas transacciones de un vistazo
- **Transacciones** — registrá gastos e ingresos con categoría, billetera y fecha; agrupados por día
- **Metas** — creá metas de ahorro con progreso visual y emoji personalizado
- **Análisis** — donut chart de distribución de gastos y barras de progreso de presupuestos
- **Billeteras** — administrá múltiples billeteras; el saldo se actualiza automáticamente con cada transacción
- **Categorías** — 10 categorías de gastos + 6 de ingresos incluidas por defecto
- **PWA** — instalable en iOS y Android, funciona como app nativa

---

## Stack

| Capa | Tecnología |
|---|---|
| UI | React 19 + Vite 8 |
| Estilos | Tailwind CSS v3 + Framer Motion |
| 3D / Landing | Three.js + @react-three/fiber |
| Estado global | Zustand |
| Backend | Firebase Auth + Firestore |
| Gráficos | Recharts (desktop) + SVG custom (mobile) |
| PWA | vite-plugin-pwa |
| Deploy | Vercel |

---

## Diseño mobile

La versión mobile tiene un rediseño completo con efecto **liquid glass**:

- Bottom nav con `backdrop-filter` + filtro SVG de refracción (feTurbulence + feDisplacementMap)
- FAB central para registrar transacciones rápido
- Safe area padding para PWA standalone en iOS (`env(safe-area-inset-top/bottom)`)
- Sin zoom en inputs, sin layout shift al abrir el teclado

---

## Estructura del proyecto

```
src/
├── components/
│   ├── layout/       # BottomNav, Sidebar, Header
│   └── ui/           # AddTransactionSheet, modals, cards
├── pages/
│   ├── Landing.jsx
│   ├── Login.jsx
│   ├── Onboarding.jsx
│   └── app/          # Dashboard, Transactions, Goals, Analytics, Budgets, AppSettings
├── services/         # Firebase: auth, transactions, categories, wallets, budgets
├── store/            # Zustand store
└── lib/              # Firebase init
```

---

## Correr localmente

### 1. Clonar e instalar

```bash
git clone https://github.com/boa2025-dev/koin.git
cd koin
npm install
```

### 2. Configurar Firebase

Creá un proyecto en [Firebase Console](https://console.firebase.google.com), habilitá **Authentication** (Email/Password + Google) y **Firestore**.

Copiá las credenciales y creá el archivo `.env.local` en la raíz:

```env
VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_AUTH_DOMAIN=...
VITE_FIREBASE_PROJECT_ID=...
VITE_FIREBASE_MESSAGING_SENDER_ID=...
VITE_FIREBASE_APP_ID=...
```

### 3. Reglas de Firestore

Publicá las reglas del archivo `firestore.rules`:

```bash
firebase deploy --only firestore:rules
```

O pegálas manualmente en Firebase Console → Firestore → Reglas.

### 4. Correr

```bash
npm run dev
```

---

## Deploy en Vercel

1. Conectá el repo en [vercel.com](https://vercel.com)
2. En **Settings → Environment Variables** agregá las mismas variables de `.env.local`
3. Deploy automático en cada push a `main`

---

## Seguridad

- Las credenciales de Firebase **nunca se commitean** — `.env.local` está en `.gitignore`
- Las reglas de Firestore restringen cada usuario a sus propios datos:
  ```
  allow read, write: if request.auth != null && request.auth.uid == userId
  ```

---

## Licencia

MIT
