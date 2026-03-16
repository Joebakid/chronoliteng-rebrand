"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAppContext } from "@/app/state/AppContext";
import { getFunctions, httpsCallable } from "firebase/functions";

// ── view states: "login" | "register" | "reset" | "reset_sent"
export default function AuthForm({ mode }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { signUp, signIn } = useAppContext();

  const [view, setView] = useState(mode);
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [resetEmail, setResetEmail] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [infoMessage, setInfoMessage] = useState("");

  const isRegister = view === "register";
  const isReset = view === "reset";
  const isResetSent = view === "reset_sent";

  const clearMessages = () => { setError(""); setInfoMessage(""); };

  function getAuthErrorMessage(code) {
    switch (code) {
      case "auth/invalid-credential":
      case "auth/wrong-password":
      case "auth/user-not-found":
        return "The email or password you entered is incorrect. Please try again.";
      case "auth/too-many-requests":
        return "Too many failed attempts. Your account has been temporarily locked — reset your password or try again later.";
      case "auth/invalid-email":
        return "That doesn't look like a valid email address.";
      case "auth/email-already-in-use":
        return "An account with this email already exists. Try signing in instead.";
      case "auth/weak-password":
        return "Your password must be at least 6 characters long.";
      case "auth/user-disabled":
        return "This account has been disabled. Contact support if you think this is a mistake.";
      case "auth/network-request-failed":
        return "Network error. Check your connection and try again.";
      case "auth/popup-closed-by-user":
        return "Sign-in was cancelled. Please try again.";
      default:
        return "Something went wrong. Please try again.";
    }
  }

  // ── Auth submit (login / register)
  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    clearMessages();
    try {
      if (isRegister) {
        const data = await signUp({ name: form.name, email: form.email, password: form.password });
        setInfoMessage(data?.message || "Check your email for confirmation.");
        setForm({ name: "", email: "", password: "" });
        return;
      }
      const firebaseUser = await signIn({ email: form.email, password: form.password });
      if (firebaseUser.isAdmin) { router.push("/admin/dashboard"); return; }
      router.push(searchParams.get("next") || "/account/profile");
    } catch (err) {
      setError(getAuthErrorMessage(err?.code || ""));
    } finally {
      setLoading(false);
    }
  }

  // ── Password reset submit
  async function handleResetSubmit(e) {
    e.preventDefault();
    if (!resetEmail.trim()) return;
    setLoading(true);
    clearMessages();
    try {
      const functions = getFunctions();
      const sendPasswordReset = httpsCallable(functions, "sendPasswordReset");
      await sendPasswordReset({ email: resetEmail.trim() });
      setView("reset_sent");
    } catch (err) {
      // Always show success — never reveal whether email exists
      setView("reset_sent");
    } finally {
      setLoading(false);
    }
  }

  // ────────────────────────────────────────────────
  // RESET SENT confirmation screen
  // ────────────────────────────────────────────────
  if (isResetSent) {
    return (
      <div className="mx-auto w-full max-w-md rounded-[2rem] border border-[var(--border)] bg-[var(--surface-strong)] p-6 shadow-[var(--shadow)] sm:p-8 text-center">
        <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-[var(--surface)] border border-[var(--border)] text-2xl">
          ✉️
        </div>
        <p className="text-[0.72rem] font-semibold uppercase tracking-[0.28em] text-[var(--muted)]">
          Check your inbox
        </p>
        <h1 className="font-display mt-4 text-2xl font-semibold text-[var(--foreground)]">
          Reset link sent
        </h1>
        <p className="mt-3 text-sm leading-6 text-[var(--muted)]">
          If <strong className="text-[var(--foreground)]">{resetEmail}</strong> has an account,
          you'll receive a password reset link shortly. Check your spam folder if it doesn't arrive.
        </p>
        <button
          onClick={() => { setView("login"); setResetEmail(""); clearMessages(); }}
          className="mt-8 w-full rounded-full bg-[var(--foreground)] py-3 font-medium text-[var(--surface-strong)] transition hover:opacity-90"
        >
          Back to sign in
        </button>
      </div>
    );
  }

  // ────────────────────────────────────────────────
  // RESET PASSWORD form
  // ────────────────────────────────────────────────
  if (isReset) {
    return (
      <div className="mx-auto w-full max-w-md rounded-[2rem] border border-[var(--border)] bg-[var(--surface-strong)] p-6 shadow-[var(--shadow)] sm:p-8">
        <p className="text-center text-[0.72rem] font-semibold uppercase tracking-[0.28em] text-[var(--muted)]">
          Reset password
        </p>
        <h1 className="font-display mt-4 text-center text-3xl font-semibold text-[var(--foreground)]">
          Forgot your password?
        </h1>
        <p className="mt-3 text-center text-sm leading-6 text-[var(--muted)]">
          Enter the email address on your account and we'll send you a reset link.
        </p>

        {error && (
          <div className="mt-6 rounded-2xl border border-[rgba(161,69,59,0.2)] bg-[rgba(161,69,59,0.08)] p-3 text-sm text-[var(--danger)]">
            {error}
          </div>
        )}

        <form onSubmit={handleResetSubmit} className="mt-8 space-y-5">
          <div>
            <label className="mb-2 block text-sm font-medium text-[var(--foreground)]">
              Email address
            </label>
            <input
              type="email"
              required
              value={resetEmail}
              placeholder="you@example.com"
              className="w-full rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-3 text-[var(--foreground)] outline-none transition focus:border-[var(--accent)]"
              onChange={(e) => setResetEmail(e.target.value)}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-full bg-[var(--foreground)] py-3 font-medium text-[var(--surface-strong)] transition hover:opacity-90 disabled:opacity-60"
          >
            {loading ? "Sending..." : "Send reset link"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-[var(--muted)]">
          Remember it?{" "}
          <button
            onClick={() => { setView("login"); clearMessages(); }}
            className="font-semibold text-[var(--foreground)] underline-offset-2 hover:underline"
          >
            Back to sign in
          </button>
        </p>
      </div>
    );
  }

  // ────────────────────────────────────────────────
  // LOGIN / REGISTER form
  // ────────────────────────────────────────────────
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
          <div className="mb-2 flex items-center justify-between">
            <label className="text-sm font-medium text-[var(--foreground)]">
              Password
            </label>
            {!isRegister && (
              <button
                type="button"
                onClick={() => { setView("reset"); clearMessages(); }}
                className="text-xs font-semibold text-[var(--muted)] hover:text-[var(--foreground)] transition"
              >
                Forgot password?
              </button>
            )}
          </div>
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
              onClick={() => setShowPassword((c) => !c)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[0.7rem] font-semibold uppercase tracking-[0.14em] text-[var(--muted)]"
            >
              {showPassword ? "Hide" : "Show"}
            </button>
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-full bg-[var(--foreground)] py-3 font-medium text-[var(--surface-strong)] transition hover:opacity-90 disabled:opacity-60"
        >
          {loading
            ? isRegister ? "Creating account..." : "Signing in..."
            : isRegister ? "Create account" : "Sign in"}
        </button>
      </form>

      {/* Switch between login / register */}
      <p className="mt-6 text-center text-sm text-[var(--muted)]">
        {isRegister ? "Already have an account?" : "Don't have an account?"}{" "}
        <button
          onClick={() => {
            setView(isRegister ? "login" : "register");
            setForm({ name: "", email: "", password: "" });
            clearMessages();
          }}
          className="font-semibold text-[var(--foreground)] underline-offset-2 hover:underline"
        >
          {isRegister ? "Sign in" : "Create one"}
        </button>
      </p>
    </div>
  );
}