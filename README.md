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
