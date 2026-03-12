"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { loginUser, registerUser } from "@/lib/api";
import { useAppContext } from "@/app/state/AppContext";
import { setAdminToken } from "@/lib/adminAuth";

export default function AuthForm({ mode }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { signIn } = useAppContext();
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [infoMessage, setInfoMessage] = useState("");

  const isRegister = mode === "register";

  async function handleSubmit(event) {
    event.preventDefault();
    setLoading(true);
    setError("");
    setInfoMessage("");

    try {
      if (isRegister) {
        const data = await registerUser(form);
        setInfoMessage(data?.message || "Check your email for confirmation.");
        setForm({ name: "", email: "", password: "" });
        return;
      }

      const data = await loginUser({
        email: form.email,
        password: form.password,
      });

      if (!data?.token || !data?.user) {
        throw new Error(data?.message || "Authentication failed");
      }

      signIn(data);
      if (data.user.isAdmin) {
        setAdminToken(data.token);
        router.push("/admin/dashboard");
        return;
      }

      router.push(searchParams.get("next") || "/account/profile");
    } catch (err) {
      setError(err.message || "Unable to continue right now.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto w-full max-w-md rounded-[2rem] border border-[var(--border)] bg-[var(--surface-strong)] p-6 shadow-[var(--shadow)] sm:p-8">
      <p className="text-center text-[0.72rem] font-semibold uppercase tracking-[0.28em] text-[var(--muted)]">
        {isRegister ? "Create account" : "Sign in"}
      </p>
      <h1 className="font-display mt-4 text-center text-3xl font-semibold text-[var(--foreground)]">
        {isRegister ? "Open your Chronolite account" : "Welcome back"}
      </h1>
      <p className="mt-3 text-center text-sm leading-6 text-[var(--muted)]">
        {isRegister
          ? "Create an account for faster access to your saved details. Checkout still works without an account."
          : "Sign in to manage your account details. Shopping remains available without signing in."}
      </p>

      {error && (
        <div className="mt-6 rounded-2xl border border-[rgba(161,69,59,0.2)] bg-[rgba(161,69,59,0.08)] p-3 text-sm text-[var(--danger)]">
          {error}
        </div>
      )}
      {infoMessage && (
        <div className="mt-4 rounded-2xl border border-[rgba(8,112,152,0.2)] bg-[rgba(8,112,152,0.08)] p-3 text-sm text-[var(--accent)]">
          {infoMessage}
        </div>
      )}

      <form onSubmit={handleSubmit} className="mt-8 space-y-5">
        {isRegister && (
          <div>
            <label className="mb-2 block text-sm font-medium text-[var(--foreground)]">
              Full name
            </label>
            <input
              type="text"
              required
              value={form.name}
              placeholder="Joseph Bawo"
              className="w-full rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-3 text-[var(--foreground)] outline-none transition focus:border-[var(--accent)]"
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
          </div>
        )}

        <div>
          <label className="mb-2 block text-sm font-medium text-[var(--foreground)]">
            Email
          </label>
          <input
            type="email"
            required
            value={form.email}
            placeholder="you@example.com"
            className="w-full rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-3 text-[var(--foreground)] outline-none transition focus:border-[var(--accent)]"
            onChange={(e) => setForm({ ...form, email: e.target.value })}
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-[var(--foreground)]">
            Password
          </label>
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              required
              value={form.password}
              placeholder="Enter your password"
              className="w-full rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-3 pr-20 text-[var(--foreground)] outline-none transition focus:border-[var(--accent)]"
              onChange={(e) => setForm({ ...form, password: e.target.value })}
            />
            <button
              type="button"
              onClick={() => setShowPassword((current) => !current)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[0.7rem] font-semibold uppercase tracking-[0.14em] text-[var(--muted)]"
            >
              {showPassword ? "Hide" : "Show"}
            </button>
          </div>
        </div>

        <button
          disabled={loading}
          className="w-full rounded-full bg-[var(--foreground)] py-3 font-medium text-[var(--surface-strong)] transition hover:opacity-90"
        >
          {loading
            ? isRegister
              ? "Creating account..."
              : "Signing in..."
            : isRegister
              ? "Create account"
              : "Sign in"}
        </button>
      </form>
    </div>
  );
}
