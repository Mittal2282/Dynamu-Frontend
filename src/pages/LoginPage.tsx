import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { adminLogin } from "../services/dashboardService";
import { authStore } from "../store/authStore";
import { applyColorMode } from "../theme/tokens";
import LoginCornerIcon from "../assets/LoginCornerIcon.png";
import { ORANGE } from "../constants/landingConstants";
import DynamuLogo from "../assets/DynamuLogo.png";

const ACCENT = '#FF6B00';

export default function LoginPage() {
  const navigate = useNavigate();
  const { setAdminTokens } = authStore();
  const [form, setForm] = useState({ email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [keepSignedIn, setKeepSignedIn] = useState(false);

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
    <div className="flex h-screen w-screen overflow-hidden">

      {/* ── LEFT PANEL ── */}
      <div
        className="hidden lg:flex w-[42%] shrink-0 flex-col justify-between"
        style={{
          padding: '48px 60px',
          background: `linear-gradient(to bottom, rgba(0,0,0,0.68), rgba(0,0,0,0.80)),
                       url('https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=1920&q=85') center/cover no-repeat`,
        }}
      >
        {/* Logo row */}
        <div className="flex items-center gap-2">
          <img src={DynamuLogo} alt="DynamuAI" className="h-9 w-auto object-contain rounded-full" />
          <span className="font-bold text-white" style={{ fontSize: '18px' }}>
            DynamuAI
          </span>
        </div>

        {/* Middle content */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
          {/* Badge */}
          <div
            className="inline-flex items-center gap-2 self-start"
            style={{ background: ACCENT, padding: '7px 18px' }}
          >
            <span
              className="font-semibold uppercase tracking-wider"
              style={{ fontSize: '12px', color: '#000000' }}
            >
              Hospitality Intelligence
            </span>
          </div>

          {/* Heading */}
          <h1
            className="font-black leading-tight text-white"
            style={{ fontSize: 'clamp(2.2rem, calc(3.5dvh + 1.8vw), 3.5rem)' }}
          >
            Run your entire{' '}
            <span style={{ color: ORANGE }}>HoReCa</span>
            {' '}operation,
            <br />
            powered by AI.
          </h1>

          {/* Body */}
          <p
            className="leading-relaxed"
            style={{ fontSize: 'clamp(0.9rem, calc(1.2dvh + 0.4vw), 1.0625rem)', color: 'rgba(255,255,255,0.65)', maxWidth: '380px' }}
          >
            Hotels, restaurants and cafes: unified reservations, operations and
            guest intelligence in one admin command center.
          </p>
        </div>

        {/* Spacer — keeps logo at top, content in middle */}
        <div />
      </div>

      {/* ── RIGHT PANEL ── */}
      <div className="flex-1 flex flex-col bg-white">

        {/* Back to home */}
        <div className="px-8 pt-6">
          <button
            onClick={() => navigate("/")}
            className="transition-colors"
            style={{ fontSize: '13px', color: '#6b7280' }}
            onMouseEnter={e => (e.currentTarget.style.color = '#111827')}
            onMouseLeave={e => (e.currentTarget.style.color = '#6b7280')}
          >
            ← Back to home
          </button>
        </div>

        {/* Form card — centered */}
        <div className="flex-1 flex flex-col justify-center px-8 sm:px-12">
          <div className="w-full max-w-md mx-auto relative">

            {/* Orange corner accent */}
            <img
              src={LoginCornerIcon}
              alt=""
              className="absolute"
              style={{ top: '-1px', right: '-1px', width: '50px', height: '50px', zIndex: 1, display: 'block', boxShadow: '4px 4px 0px #111827' }}
            />

            {/* Card */}
            <div style={{ border: '2px solid #111827', borderRadius: '8px', padding: '40px', boxShadow: '6px 6px 0px #111827' }}>

              {/* ADMIN PORTAL eyebrow */}
              <p
                className="font-bold uppercase tracking-widest"
                style={{ fontSize: '12px', color: ACCENT, marginBottom: '14px' }}
              >
                Admin Portal
              </p>

              {/* Heading */}
              <h2
                className="font-bold"
                style={{ fontSize: '30px', color: '#111827', marginBottom: '10px', lineHeight: 1.2 }}
              >
                Sign in to your account
              </h2>

              {/* Subtitle */}
              <p style={{ fontSize: '14px', color: '#6b7280', marginBottom: '28px', lineHeight: 1.6 }}>
                Welcome back. Enter your credentials to access the dashboard.
              </p>

              {/* Error */}
              {error && (
                <div
                  className="mb-4"
                  style={{ background: '#fff1f0', border: '1px solid #fca5a5', borderRadius: '6px', padding: '10px 14px', fontSize: '13px', color: '#dc2626' }}
                >
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

                {/* Email */}
                <div>
                  <label
                    htmlFor="email"
                    className="block font-medium"
                    style={{ fontSize: '14px', color: '#374151', marginBottom: '7px' }}
                  >
                    Email address
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                        <polyline points="22,6 12,13 2,6" />
                      </svg>
                    </div>
                    <input
                      id="email"
                      name="email"
                      type="email"
                      value={form.email}
                      onChange={handleChange}
                      placeholder="admin@restaurant.com"
                      autoComplete="username"
                      className="w-full outline-none transition-colors"
                      style={{
                        height: '50px',
                        paddingLeft: '42px',
                        paddingRight: '14px',
                        border: '1px solid #d1d5db',
                        borderRadius: '6px',
                        fontSize: '15px',
                        color: '#111827',
                        background: '#fff',
                      }}
                      onFocus={e => (e.currentTarget.style.borderColor = ACCENT)}
                      onBlur={e => (e.currentTarget.style.borderColor = '#d1d5db')}
                    />
                  </div>
                </div>

                {/* Password */}
                <div>
                  <label
                    htmlFor="password"
                    className="block font-medium"
                    style={{ fontSize: '14px', color: '#374151', marginBottom: '7px' }}
                  >
                    Password
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                        <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                      </svg>
                    </div>
                    <input
                      id="password"
                      name="password"
                      type={showPassword ? "text" : "password"}
                      value={form.password}
                      onChange={handleChange}
                      placeholder="••••••••"
                      autoComplete="current-password"
                      className="w-full outline-none transition-colors"
                      style={{
                        height: '50px',
                        paddingLeft: '42px',
                        paddingRight: '44px',
                        border: '1px solid #d1d5db',
                        borderRadius: '6px',
                        fontSize: '15px',
                        color: '#111827',
                        background: '#fff',
                      }}
                      onFocus={e => (e.currentTarget.style.borderColor = ACCENT)}
                      onBlur={e => (e.currentTarget.style.borderColor = '#d1d5db')}
                    />
                    <button
                      type="button"
                      className="absolute inset-y-0 right-0 flex items-center pr-3"
                      onClick={() => setShowPassword(p => !p)}
                    >
                      {showPassword ? (
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
                          <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
                          <line x1="1" y1="1" x2="23" y2="23" />
                        </svg>
                      ) : (
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                          <circle cx="12" cy="12" r="3" />
                        </svg>
                      )}
                    </button>
                  </div>
                </div>

                {/* Keep me signed in */}
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={keepSignedIn}
                    onChange={e => setKeepSignedIn(e.target.checked)}
                    style={{ accentColor: ACCENT, width: '14px', height: '14px', flexShrink: 0 }}
                  />
                  <span style={{ fontSize: '14px', color: '#6b7280' }}>Keep me signed in</span>
                </label>

                {/* Submit */}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full font-semibold text-white flex items-center justify-center gap-2"
                  style={{
                    height: '52px',
                    background: ACCENT,
                    borderRadius: '6px',
                    fontSize: '16px',
                    boxShadow: '4px 4px 0px #111827',
                    opacity: loading ? 0.7 : 1,
                    cursor: loading ? 'not-allowed' : 'pointer',
                    transition: 'transform 0.1s ease, box-shadow 0.1s ease',
                  }}
                  onMouseEnter={e => {
                    if (!loading) {
                      e.currentTarget.style.transform = 'translate(4px, 4px)';
                      e.currentTarget.style.boxShadow = 'none';
                    }
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.transform = 'translate(0, 0)';
                    e.currentTarget.style.boxShadow = '4px 4px 0px #111827';
                  }}
                  onMouseDown={e => {
                    if (!loading) {
                      e.currentTarget.style.transform = 'translate(4px, 4px)';
                      e.currentTarget.style.boxShadow = 'none';
                    }
                  }}
                  onMouseUp={e => {
                    e.currentTarget.style.transform = 'translate(0, 0)';
                    e.currentTarget.style.boxShadow = '4px 4px 0px #111827';
                  }}
                >
                  {loading ? 'Signing in…' : (
                    <>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" />
                        <polyline points="10 17 15 12 10 7" />
                        <line x1="15" y1="12" x2="3" y2="12" />
                      </svg>
                      Sign In
                    </>
                  )}
                </button>
              </form>

              {/* Disclaimer */}
              <p
                className="text-center"
                style={{ fontSize: '11px', color: '#9ca3af', marginTop: '18px', lineHeight: 1.5 }}
              >
                Protected by DynamuAI security. By signing in you agree to our{' '}
                <span className="font-medium cursor-pointer" style={{ color: ACCENT }}>Terms</span>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
