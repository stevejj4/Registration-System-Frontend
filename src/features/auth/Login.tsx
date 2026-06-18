import React, { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import axios from "axios";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/Button";
import TextInput from "@/components/ui/TextInput";
import PasswordInput from "@/components/ui/PasswordInput";
import { getRoleHomePath } from "@/utils/routes";

/**
 * Error messages for login failures. These are user-friendly and do not expose server details.
 */
const INVALID_CREDENTIALS_MESSAGE = "Invalid email or password recheck your credentials.";
const NETWORK_ERROR_MESSAGE =
  "Unable to connect to the server. Please try again.";
const UNEXPECTED_ERROR_MESSAGE =
  "An unexpected error occurred. Please try again later.";

/**
 * Maps login failures to user-safe messages without exposing server details.
 */
function getLoginErrorMessage(err: unknown): string {
  if (axios.isAxiosError(err)) {
    const status = err.response?.status;

    if (status === 401 || status === 403) {
      return INVALID_CREDENTIALS_MESSAGE;
    }

    if (!err.response) {
      return NETWORK_ERROR_MESSAGE;
    }

    return UNEXPECTED_ERROR_MESSAGE;
  }

  return UNEXPECTED_ERROR_MESSAGE;
}
/**
 * Login component for user authentication. Handles email/password input, form submission, and error display.
 * On successful login, redirects user to their role-specific home page.
 * Displays success message if redirected from another page (e.g., after password reset).
 */
export const Login: React.FC = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const successMessage = (location.state as { message?: string } | null)
    ?.message;

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const user = await login({ email, password });
      navigate(getRoleHomePath(user.role), { replace: true });
    } catch (err: unknown) {
      setError(getLoginErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };
/**
 * main render function for the Login component. Displays the login form, handles user input, and shows error/success messages.
 * @returns JSX.Element representing the login page.
 * The layout includes a sidebar with branding and a form for email/password input. On smaller screens, the sidebar is hidden for better usability.
 * Accessibility features include proper labeling of form fields and ARIA attributes for error messages.
 * The form is disabled while a login attempt is in progress to prevent multiple submissions.
 * Success messages (e.g., after password reset) are displayed prominently to inform the user of successful actions.
 * Error messages are displayed in a user-friendly manner without exposing technical details, and are announced to assistive technologies for accessibility.
 * The component uses Tailwind CSS for styling, ensuring a responsive and modern design.
 * Overall, this component provides a secure and user-friendly login experience for the SUN Welfare Management System.
 * Note: The actual authentication logic is handled by the useAuth hook, which abstracts away API calls and token management, allowing this component to focus on the user interface and experience.
 * The component also uses React Router for navigation, enabling seamless redirection after successful login and handling of success messages passed via location state.
 * This design ensures a clear separation of concerns, with the Login component focused on presentation and user interaction, while authentication logic is encapsulated in the useAuth hook and API layer.
 * The use of TypeScript enhances type safety and developer experience, ensuring that the component's props and state are well-defined and reducing the likelihood of runtime errors.
 * Overall, this Login component is a critical part of the user authentication flow, providing a secure and intuitive interface for users to access the SUN Welfare Management System.
 * The component also includes a link to a "Forgot password?" page, allowing users to initiate the password reset process if they have trouble logging in. This enhances the user experience by providing a clear path for account recovery.
 * The design of the login page is responsive, with a sidebar that provides branding and information about the system on larger screens, while focusing on the login form on smaller devices. This ensures that users have a consistent and accessible experience regardless of their device.
 * In summary, the Login component is a well-designed and user-friendly interface for authenticating users in the SUN Welfare Management System, with robust error handling, accessibility features, and a responsive design that caters to a wide range of users and devices.
 */
  return (
    <div className="min-h-screen w-full grid md:grid-cols-2">
      <aside
        className="hidden md:flex flex-col justify-between p-10 lg:p-14 text-white"
        style={{ backgroundColor: "var(--sidebar)" }}
        aria-hidden="true"
      >
        <div className="max-w-lg">
          <h1 className="text-3xl lg:text-4xl font-bold leading-tight tracking-tight">
            SUN Welfare Management System
          </h1>
          <p className="mt-5 text-base lg:text-lg leading-relaxed text-white/90">
            Welcome to the official welfare administration and registration
            portal.
          </p>
        </div>

        <p className="text-xs text-white/70">Authorized Personnel Only.</p>
      </aside>

      <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-10 sm:px-8">
        <div className="w-full max-w-md bg-white p-8 sm:p-10 rounded-xl shadow-lg border border-gray-100">
          <h2 className="text-2xl font-semibold text-gray-900 mb-6">Sign in</h2>

          {successMessage && (
            <p className="text-sm text-green-700 bg-green-50 border border-green-200 rounded-lg p-3 mb-4">
              {successMessage}
            </p>
          )}

          <form onSubmit={handleSubmit}>
            <div className="mb-3">
              <TextInput
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                label="Email"
                type="email"
                autoComplete="email"
                required
                disabled={loading}
              />
            </div>
            <div className="mb-4">
              <PasswordInput
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                label="Password"
                autoComplete="current-password"
                required
                disabled={loading}
              />
            </div>
            {error && (
              <p
                role="alert"
                aria-live="assertive"
                className="text-red-600 text-sm py-1 mb-4"
              >
                {error}
              </p>
            )}
            <Button type="submit" disabled={loading} className="w-full">
              {loading ? "Signing in..." : "Sign in"}
            </Button>
            <div className="mt-4 text-center">
              <Link
                to="/forgot-password"
                className="text-sm text-blue-600 hover:text-blue-800 font-medium"
              >
                Forgot password?
              </Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Login;
