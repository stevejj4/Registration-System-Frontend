/**
 * Dynamic navigation item returned by GET /api/v1/me/navigation
 */
export interface NavigationItemDTO {
  title: string;
  icon: string;
  route: string;
}
