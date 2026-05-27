import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Alert, Input } from "antd";
import Button from "../components/ui/Button";
import Text from "../components/ui/Text";
import { adminLogin } from "../services/dashboardService";
import { authStore } from "../store/authStore";
import { applyColorMode } from "../theme/tokens";

export default function LoginPage() {
  const navigate = useNavigate();
  const { setAdminTokens } = authStore();
  const [form, setForm] = useState({ email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    applyColorMode('light');
    return () => applyColorMode('dark');
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!form.email || !form.password) {
      setError("Please fill in all fields.");
      return;
    }
    setError("");
    setLoading(true);
    try {
      const data = await adminLogin(form) as {
        user?: { role?: string; name?: string };
        role?: string;
        name?: string;
        access_token?: string;
        accessToken?: string;
        refresh_token?: string;
        refreshToken?: string;
      };
      // Backend returns { user: { role, name, ... }, accessToken, refreshToken }
      const role = data.user?.role ?? data.role;
      setAdminTokens({
        accessToken: data.access_token ?? data.accessToken ?? "",
        refreshToken: data.refresh_token ?? data.refreshToken ?? "",
        role: role ?? "",
        name: data.user?.name ?? data.name ?? "",
      });
      if (role === "super_admin") navigate("/superadmin", { replace: true });
      else if (role === "restaurant_owner" || role === "restaurant_staff")
        navigate("/dashboard", { replace: true });
      else navigate("/", { replace: true });
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { message?: string } } };
      setError(axiosErr.response?.data?.message || "Invalid credentials. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen  flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        {/* Back to home */}
        <div className="text-center mb-4">
          <button
            onClick={() => navigate("/")}
            className="text-xs text-dim hover:text-ink transition-colors"
          >
            ← Back to home
          </button>
        </div>

        {/* Logo / heading */}
        <div className="text-center mb-10">
          <Text
            as="h1"
            size="2xl"
            weight="bold"
            className="bg-linear-to-r from-orange-400 to-orange-600 bg-clip-text text-transparent"
          >
            Dynamu
          </Text>
          <Text size="sm" color="muted" className="mt-1 text-dim">
            Admin Portal
          </Text>
        </div>

        {/* Card */}
        <div className="glass p-8 rounded-3xl">
          <Text as="h2" size="lg" weight="semibold" className="mb-6 text-orange-500!">
            Sign in to your account
          </Text>

          {error && (
            <Alert type="error" message={error} className="mb-5" showIcon />
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="w-full space-y-1">
              <label className="text-xs text-dim">Email address</label>
              <Input
                name="email"
                type="email"
                value={form.email}
                onChange={handleChange}
                placeholder="admin@restaurant.com"
                autoComplete="username"
                size="large"
              />
            </div>

            <div className="w-full space-y-1">
              <label className="text-xs text-dim">Password</label>
              <Input.Password
                name="password"
                value={form.password}
                onChange={handleChange}
                placeholder="••••••••"
                autoComplete="current-password"
                size="large"
              />
            </div>

            <Button
              htmlType="submit"
              fullWidth
              size="lg"
              loading={loading}
              className="mt-2 bg-orange-500! hover:bg-orange-600! shadow-lg shadow-orange-500/20"
            >
              Sign In
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
