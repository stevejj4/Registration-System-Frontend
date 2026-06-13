import { http, HttpResponse } from "msw";

export const API_BASE = "http://localhost:9090/api";

export const mockAuthUser = {
  id: 1,
  email: "admin@example.com",
  fullName: "Test Admin",
  role: "ADMIN",
  permissions: ["MEMBER_READ", "MEMBER_CREATE"],
};

export const mockLoginResponse = {
  token: "access-token-initial",
  role: "ADMIN",
  id: mockAuthUser.id,
  email: mockAuthUser.email,
  fullName: mockAuthUser.fullName,
  permissions: mockAuthUser.permissions,
};

export const mockNavigation = [
  { title: "Admin Dashboard", icon: "layout-dashboard", route: "/admin" },
  { title: "Members", icon: "clipboard-list", route: "/members" },
];

export const handlers = [
  http.post(`${API_BASE}/auth/login`, async ({ request }) => {
    const body = (await request.json()) as { email: string; password: string };

    if (body.email === "admin@example.com" && body.password === "password123") {
      return HttpResponse.json(mockLoginResponse);
    }

    return HttpResponse.json({ message: "Invalid credentials" }, { status: 401 });
  }),

  http.post(`${API_BASE}/auth/refresh`, () => {
    return HttpResponse.json({ token: "access-token-refreshed" });
  }),

  http.post(`${API_BASE}/auth/logout`, () => {
    return new HttpResponse(null, { status: 204 });
  }),

  http.get(`${API_BASE}/v1/me/navigation`, () => {
    return HttpResponse.json(mockNavigation);
  }),

  http.get(`${API_BASE}/auth/ping`, () => {
    return HttpResponse.json("pong");
  }),
];
