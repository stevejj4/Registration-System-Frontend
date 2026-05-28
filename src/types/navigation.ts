/**
 * Dynamic navigation item returned by GET /api/v1/me/navigation
 * Give me the navigation menu for the current user based on their permissions and roles
 */
export interface NavigationItemDTO {
  title: string;
  icon: string;
  route: string;
}
