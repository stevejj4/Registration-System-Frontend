<p align="center">
  <img src="https://via.placeholder.com/120x120.png?text=Logo" alt="Project Logo" />
</p>

<h1 align="center">Member Registration System – Frontend</h1>

<p align="center">
  A scalable React + TypeScript frontend for managing member registration, authentication, and role-based system administration powered by a Spring Boot backend API.
</p>

<p align="center">
  <img src="https://img.shields.io/badge/React-18+-61DAFB?style=for-the-badge&logo=react" />
  <img src="https://img.shields.io/badge/TypeScript-5+-3178C6?style=for-the-badge&logo=typescript" />
  <img src="https://img.shields.io/badge/Axios-HTTP-5A29E4?style=for-the-badge" />
  <img src="https://img.shields.io/badge/Vite-Bundler-646CFF?style=for-the-badge&logo=vite" />
  <img src="https://img.shields.io/badge/Spring%20Boot-Backend-6DB33F?style=for-the-badge&logo=springboot" />
</p>

---

## 📌 Project Overview

The **Member Registration System Frontend** is a modern web application built to manage member onboarding, authentication, and administrative user operations.  

It communicates with a RESTful Spring Boot backend and implements a clean, scalable architecture using TypeScript, Axios interceptors, and a service-layer pattern.

---

## 🚀 Key Features

- 🔐 JWT-based authentication (token storage & auto-injection)
- 👥 Member registration and management system
- 🧑‍💼 System user administration (create, update, delete users)
- 🧭 Backend-driven dynamic navigation
- ⚙️ Centralized API client with Axios interceptors
- 🚨 Global error handling with user-friendly messages
- 📊 Role-based access control (PBAC-ready)
- 🧩 Strongly typed DTO architecture (TypeScript)
- 🔄 Reusable utility functions (validation, formatting, filtering)
- 🛡️ Automatic session expiry handling (401 interceptor logout)

---

## 🧰 Tech Stack

- React (Vite)
- TypeScript
- Axios
- React Router
- Spring Boot (Backend API)
- LocalStorage (JWT persistence)

---

## Performance Optimization & Code Splitting

The frontend uses **route-level** and **component-level** code splitting to reduce the initial JavaScript payload and load feature code only when it is needed.

### Route-Level Splitting

Heavy authenticated routes are lazy-loaded in `src/app/App.tsx` using `React.lazy()` and rendered inside a `React.Suspense` boundary with a minimal inline spinner fallback (`RouteSpinner`).

- **Lazy-loaded pages:** `AdminDashboard`, `UserList`, and `MemberRegistration`
- **Eager-loaded routes:** lightweight public auth screens (`Login`, `ForgotPassword`, `ResetPassword`)
- **Suspense boundary:** wraps `ProtectedLayout`, so lazy route chunks load smoothly without layout flicker

Each lazy page compiles into an isolated Vite bundle and is fetched on first navigation to that route.

### Component-Level Form Splitting

The multi-step member registration flow in `MemberRegistration.tsx` defers sub-form downloads until the user advances through the wizard.

- **Lazy-loaded forms:** `PrincipalMemberForm`, `NextOfKinForm`, `DependantsForm`
- **Step 1:** principal form loads immediately when `/register` is opened
- **Steps 2 & 3:** next-of-kin and dependants chunks load only after the user clicks the **Continue** boundaries
- **Suspense per section:** each form step has its own `React.Suspense` fallback (`FormSpinner`)
- **Validation safety:** if submit validation fails for a hidden section, that section is revealed automatically so errors remain visible

### Architecture Fixes

Barrel re-exports were removed to prevent Vite from pulling registration code into the main bundle.

- **Removed:** `MemberRegistration` re-export from `src/features/members/index.ts`
- **Direct imports:** `App.tsx` lazy-loads registration from `@/features/members/components/MemberRegistration`
- **Result:** `MemberRegistration` compiles as a dedicated chunk; the initial landing bundle stays leaner

Run `npm run build` to inspect generated chunk sizes under `dist/assets/`.

---

## Accessibility (a11y) Architecture

The registration flow includes a dedicated accessibility layer that keeps form controls, validation feedback, and dynamic UI changes perceivable to assistive technologies.

### Primitive Input Wiring

Shared form primitives in `src/components/ui/` (`TextInput`, `SelectInput`, `DateInput`) enforce a consistent ARIA contract across all registration steps.

- **Stable IDs:** each field accepts a unique `id` passed through to the underlying control
- **Label association:** labels use `htmlFor` to link visually and programmatically to their input
- **Required state:** required fields expose `aria-required` when applicable
- **Error linkage:** when validation fails, controls set `aria-invalid` and `aria-describedby` pointing at a companion error element (`{fieldId}-error` with `role="alert"`)

Registration forms (`PrincipalMemberForm`, `NextOfKinForm`, `DependantsForm`) supply predictable, step-scoped IDs (for example, `principal-first-name`, `nok-phone-number`, `dependant-{id}-first-name`) so errors and summary links resolve reliably.

### Focus-Managed Error Summary

`MemberRegistration.tsx` renders a validation error summary when submission fails. The summary is announced immediately and becomes the keyboard focus target.

- **Live region:** `role="alert"` and `aria-live="assertive"` surface failures without requiring the user to hunt for inline messages
- **Programmatic focus:** a `tabIndex={-1}` container receives focus via `useEffect` as soon as the summary appears
- **Actionable links:** each listed error is a link mapped through `FIELD_TARGETS` to a concrete field ID and human-readable label
- **Lazy-form coordination:** clicking a link (or failing validation for a hidden step) calls `setShowNextOfKin` / `setShowDependants` to mount deferred form chunks, then focuses the target field after a double `requestAnimationFrame` so lazy-loaded inputs exist in the DOM

This pattern keeps code-split wizard stages compatible with WCAG-oriented error recovery: users hear the problem, land on the summary, and can jump directly to the offending field—even when that field lives in a previously collapsed section.

### Dynamic Live Regions

`DependantsForm.tsx` maintains a visually hidden `aria-live="polite"` region (`role="status"`, `aria-atomic="true"`) for row-level changes that are not otherwise announced.

- **Add row:** updating the live region with *"Dependant added"* when a new dependant is inserted
- **Remove row:** announcing *"Dependant row N removed"* when a row is deleted, using the row’s display index

Together with descriptive `aria-label` attributes on add/remove controls, screen reader users receive immediate feedback as the dependants list grows or shrinks during data entry.

---

## Security & Authentication Architecture

The frontend auth client layer in `src/api/client.ts` and `src/context/AuthContext.tsx` is designed around HttpOnly cookies and volatile in-memory tokens, keeping long-lived credentials out of browser storage.

### Volatile In-Memory Storage

Ephemeral JWT access tokens are held strictly in volatile React component state inside `AuthContext` and mirrored to the Axios client module via `setAccessToken()`. Tokens are never written to `localStorage` or `sessionStorage`, eliminating exposure to client-side storage sniffing (XSS-driven token theft, malicious extensions, or shared-device inspection).

Only non-sensitive user metadata—name, email, role, and permissions—is persisted under the `auth_user` key so the UI can hydrate on reload without retaining the credential itself.

### Secure Cookie Pass-Through

The shared Axios instance is initialized with `withCredentials: true`, instructing the browser to attach HttpOnly cookies on every request and accept `Set-Cookie` directives on responses. Refresh and session cookies travel natively across the application lifecycle without JavaScript ever reading or serializing them.

Cookie-driven endpoints (`/auth/login`, `/auth/refresh`, `/auth/logout`) intentionally skip the `Authorization` header so the server can authenticate via HttpOnly cookies alone when no in-memory access token is present.

### Silent Interceptor Refresh Queue

When an API call returns `401 Unauthorized`, the Axios response interceptor does not force an immediate logout. Instead, it issues a single background `POST /auth/refresh` where the server reads the HttpOnly refresh cookie and returns a new ephemeral access token.

While that refresh call is in flight, all concurrent outgoing requests are held in a temporary queue. On success, the fresh token is applied in memory, queued requests are reissued with an updated `Authorization: Bearer` header, and the original failed call is retried. On failure, the interceptor clears the local session profile and redirects to `/login`.

Session hydration on startup follows the same contract: if `auth_user` exists locally, the app silently calls `/auth/refresh` before marking the session authenticated.

### Backend Integration Contract

The Spring Boot API must expose the following endpoints under `/api/auth`:

| Endpoint | Purpose |
|---|---|
| `POST /auth/login` | Authenticate credentials, set the HttpOnly refresh cookie, return `{ token, ...user }` |
| `POST /auth/refresh` | Validate the refresh cookie, return `{ token }` |
| `POST /auth/logout` | Invalidate the server session and clear auth cookies |

**CORS requirement:** the backend must respond with `Access-Control-Allow-Credentials: true` and a strict, explicit `Access-Control-Allow-Origin` value (for example, `http://localhost:5173`). Wildcard origins (`*`) are incompatible with credentialed cross-origin requests and will break cookie transmission.

---

## 📦 Prerequisites

Before running this project, ensure you have:

- <kbd>Node.js v18+</kbd>
- <kbd>npm</kbd> or <kbd>yarn</kbd>
- Backend Spring Boot API running on `http://localhost:9090`

---

## ⚙️ Installation & Setup

<details>
<summary>Click to expand setup instructions</summary>

### 1. Clone the repository
<kbd>git clone https://github.com/your-org/member-registration-frontend.git</kbd>

### 2. Navigate into the project
<kbd>cd member-registration-frontend</kbd>

### 3. Install dependencies
<kbd>npm install</kbd>

### 4. Start development server
<kbd>npm run dev</kbd>

### 5. Build for production
<kbd>npm run build</kbd>

### 6. Preview production build
<kbd>npm run preview</kbd>

</details>

---

## ▶️ Usage

After starting the application:

- Open: <kbd>http://localhost:5173</kbd>
- Login using valid credentials created by admin
- Access dashboards based on assigned role

Example API usage (handled internally via service layer):

```ts
getUsers();
createUser(data);
updateUser(id, data);
deleteUser(id);
```
