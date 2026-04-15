import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { authStore } from "../../store/authStore";
import { adminLogin } from "../../services/adminService";
import Button from "../../components/ui/Button";
import Text from "../../components/ui/Text";

export default function LoginPage() {
  const navigate = useNavigate();
  const { setAdminTokens } = authStore();
  const [form, setForm] = useState({ email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (e) => setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.email || !form.password) {
      setError("Please fill in all fields.");
      return;
    }
    setError("");
    setLoading(true);
    try {
      const data = await adminLogin(form);
      // Backend returns { user: { role, name, ... }, accessToken, refreshToken }
      const role = data.user?.role ?? data.role;
      setAdminTokens({
        accessToken: data.access_token ?? data.accessToken,
        refreshToken: data.refresh_token ?? data.refreshToken,
        role,
        name: data.user?.name ?? data.name ?? "",
      });
      if (role === "super_admin") navigate("/superadmin", { replace: true });
      else if (role === "restaurant_owner" || role === "restaurant_staff")
        navigate("/dashboard", { replace: true });
      else navigate("/", { replace: true });
    } catch (err) {
      setError(err.response?.data?.message || "Invalid credentials. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        {/* Back to home */}
        <div className="text-center mb-4">
          <button
            onClick={() => navigate("/")}
            className="text-xs text-slate-300 hover:text-white transition-colors"
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
            className="bg-gradient-to-r from-orange-400 to-orange-600 bg-clip-text text-transparent"
          >
            Dynamu
          </Text>
          <Text size="sm" color="muted" className="mt-1 text-slate-200">
            Admin Portal
          </Text>
        </div>

        {/* Card */}
        <div className="glass p-8 rounded-3xl">
          <Text as="h2" size="lg" weight="semibold" className="mb-6 !text-orange-500">
            Sign in to your account
          </Text>

          {error && (
            <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-sm px-4 py-3 rounded-xl mb-5">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-xs text-slate-200 block mb-1.5">Email address</label>
              <input
                name="email"
                type="email"
                value={form.email}
                onChange={handleChange}
                placeholder="admin@restaurant.com"
                autoComplete="username"
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder:text-slate-300 focus:outline-none focus:border-orange-500 transition-colors"
              />
            </div>

            <div>
              <label className="text-xs text-slate-200 block mb-1.5">Password</label>
              <input
                name="password"
                type="password"
                value={form.password}
                onChange={handleChange}
                placeholder="••••••••"
                autoComplete="current-password"
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder:text-slate-300 focus:outline-none focus:border-orange-500 transition-colors"
              />
            </div>

            <Button
              type="submit"
              fullWidth
              size="lg"
              loading={loading}
              className="mt-2 !bg-orange-500 hover:!bg-orange-600 shadow-lg shadow-orange-500/20"
            >
              Sign In
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
