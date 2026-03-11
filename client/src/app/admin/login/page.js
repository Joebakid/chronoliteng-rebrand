"use client";

import { useState } from "react";
import { loginUser } from "@/lib/api";
import { useRouter } from "next/navigation";
import BackHomeButton from "@/components/BackHomeButton";
import { setAdminToken } from "@/lib/adminAuth";
import { setStoredUserSession } from "@/lib/userAuth";

export default function AdminLogin() {
  const [form, setForm] = useState({ email: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const data = await loginUser(form);

      if (!data?.token || !data?.user?.isAdmin) {
        throw new Error("Admin access required");
      }

      setAdminToken(data.token);
      setStoredUserSession(data);
      router.push("/admin/dashboard");
    } catch (err) {
      setError(err.message || "Invalid email or password");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="site-frame flex min-h-[calc(100dvh-5.5rem)] flex-col py-4 sm:py-8 lg:py-10">
      <div className="mb-4 flex justify-end sm:mb-6">
        <BackHomeButton />
      </div>

      <div className="flex flex-1 items-center justify-center">
        <div className="w-full max-w-md rounded-[2rem] border border-[var(--border)] bg-[var(--surface-strong)] p-6 shadow-[var(--shadow)] sm:p-8">
        <p className="text-center text-[0.72rem] font-semibold uppercase tracking-[0.28em] text-[var(--muted)]">
          Admin Access
        </p>
        <h2 className="font-display mb-6 mt-4 text-center text-3xl font-semibold text-[var(--foreground)]">
          Admin Login
        </h2>

        {error && (
          <div className="mb-4 rounded-2xl border border-[rgba(161,69,59,0.2)] bg-[rgba(161,69,59,0.08)] p-3 text-sm text-[var(--danger)]">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="mb-2 block text-sm font-medium text-[var(--foreground)]">
              Email
            </label>
            <input
              type="email"
              required
              placeholder="admin@chronolite.com"
              className="w-full rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-3 text-[var(--foreground)] outline-none transition focus:border-[var(--accent)]"
              onChange={(e) =>
                setForm({ ...form, email: e.target.value })
              }
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
                placeholder="Enter admin password"
                className="w-full rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-3 pr-20 text-[var(--foreground)] outline-none transition focus:border-[var(--accent)]"
                onChange={(e) =>
                  setForm({ ...form, password: e.target.value })
                }
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
            {loading ? "Logging in..." : "Login"}
          </button>
        </form>
        </div>
      </div>
    </main>
  );
}
