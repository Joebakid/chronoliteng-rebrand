"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAppContext } from "@/app/state/AppContext";
import { signInWithGoogle } from "@/lib/userAuth"; // NEW

// ── view states: "login" | "register" | "reset" | "reset_sent" | "verify"
export default function AuthForm({ mode }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { signUp, signIn } = useAppContext();

  const [view, setView] = useState(mode);
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [otpInput, setOtpInput] = useState("");
  const [generatedCode, setGeneratedCode] = useState(null);
  const [resetEmail, setResetEmail] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [infoMessage, setInfoMessage] = useState("");

  const isRegister = view === "register";
  const isReset = view === "reset";
  const isResetSent = view === "reset_sent";
  const isVerify = view === "verify";

  const clearMessages = () => {
    setError("");
    setInfoMessage("");
  };

  function getAuthErrorMessage(code) {
    switch (code) {
      case "auth/invalid-credential":
        return "The email or password you entered is incorrect.";
      case "auth/email-already-in-use":
        return "An account with this email already exists.";
      case "auth/weak-password":
        return "Password must be at least 6 characters.";
      default:
        return "Something went wrong. Please check your connection.";
    }
  }

  // GOOGLE LOGIN
  async function handleGoogleLogin() {
    try {
      setLoading(true);
      const session = await signInWithGoogle();

      if (session) {
        router.push("/account/profile");
      }
    } catch {
      setError("Google sign in failed.");
    } finally {
      setLoading(false);
    }
  }

  // ── Handle Registration & Code Generation
  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    clearMessages();
    try {
      if (isRegister) {
        await signUp({
          name: form.name,
          email: form.email,
          password: form.password,
        });

        const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
        setGeneratedCode(otpCode);

        fetch("/api/send-email", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            to: form.email,
            subject: "Verify your Chronolite Access",
            htmlType: "verify",
            data: { name: form.name, code: otpCode },
          }),
        }).catch(() => {});

        setView("verify");
        return;
      }

      const firebaseUser = await signIn({
        email: form.email,
        password: form.password,
      });

      if (firebaseUser.isAdmin) {
        router.push("/admin/dashboard");
        return;
      }

      router.push(searchParams.get("next") || "/account/profile");
    } catch (err) {
      setError(getAuthErrorMessage(err?.code || ""));
    } finally {
      setLoading(false);
    }
  }

  // ── Handle Verification Code Check
  async function handleVerifyCode(e) {
    e.preventDefault();
    setError("");

    if (otpInput === generatedCode) {
      setInfoMessage("Verification successful. Welcome to the inner circle.");
      setLoading(true);

      setTimeout(() => {
        router.push("/account/profile");
      }, 2000);
    } else {
      setError("The code you entered is incorrect. Please check your email.");
    }
  }

  // ── Password reset submit
  async function handleResetSubmit(e) {
    e.preventDefault();
    if (!resetEmail.trim()) return;

    setLoading(true);
    clearMessages();

    try {
      await fetch("/api/send-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          to: resetEmail,
          subject: "Reset your Chronoliteng password",
          htmlType: "reset",
          data: { email: resetEmail },
        }),
      });

      setView("reset_sent");
    } catch {
      setView("reset_sent");
    } finally {
      setLoading(false);
    }
  }

  // --- 1. VERIFICATION VIEW ---
  if (isVerify) {
    return (
      <div className="mx-auto w-full max-w-md rounded-[2rem] border border-[var(--border)] bg-[var(--surface-strong)] p-6 text-center shadow-[var(--shadow)] sm:p-8">
        <p className="text-[0.72rem] font-semibold uppercase tracking-[0.28em] text-[var(--accent)]">
          Security Check
        </p>

        <h1 className="font-display mt-4 text-3xl font-semibold text-[var(--foreground)]">
          Verify your email
        </h1>

        <p className="mt-3 text-sm leading-6 text-[var(--muted)]">
          We've sent a 6-digit access code to{" "}
          <span className="text-[var(--foreground)] font-medium">
            {form.email}
          </span>
          .
        </p>

        {error && (
          <div className="mt-6 rounded-2xl border border-red-400/20 bg-red-400/10 p-3 text-sm text-red-400">
            {error}
          </div>
        )}

        {infoMessage && (
          <div className="mt-4 rounded-2xl border border-blue-500/20 bg-blue-500/10 p-3 text-sm text-blue-400">
            {infoMessage}
          </div>
        )}

        <form onSubmit={handleVerifyCode} className="mt-8 space-y-5">
          <input
            type="text"
            maxLength={6}
            required
            value={otpInput}
            onChange={(e) =>
              setOtpInput(e.target.value.replace(/\D/g, ""))
            }
            placeholder="000000"
            className="w-full text-center text-4xl font-bold tracking-[0.4em] rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4"
          />

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-full bg-[var(--foreground)] py-4 font-bold text-[var(--surface-strong)] uppercase tracking-widest"
          >
            {loading ? "Verifying..." : "Confirm Access"}
          </button>
        </form>

        <button
          onClick={() => setView("register")}
          className="mt-6 text-xs font-semibold text-[var(--muted)] uppercase tracking-widest"
        >
          Back to Registration
        </button>
      </div>
    );
  }

  // --- MAIN LOGIN / REGISTER VIEW ---
  return (
    <div className="mx-auto w-full max-w-md rounded-[2rem] border border-[var(--border)] bg-[var(--surface-strong)] p-6 shadow-[var(--shadow)] sm:p-8">

      {/* GOOGLE LOGIN BUTTON */}
      <button
        type="button"
        onClick={handleGoogleLogin}
        className="mb-6 w-full flex items-center justify-center gap-3 rounded-full border border-[var(--border)] py-3 font-medium hover:bg-[var(--surface)] transition"
      >
        Continue with Google
      </button>

      <p className="text-center text-[0.72rem] font-semibold uppercase tracking-[0.28em] text-[var(--muted)]">
        {isRegister ? "Create account" : "Sign in"}
      </p>

      <h1 className="font-display mt-4 text-center text-3xl font-semibold text-[var(--foreground)]">
        {isRegister ? "Welcome to Chronolite" : "Welcome back"}
      </h1>

      <p className="mt-3 text-center text-sm leading-6 text-[var(--muted)]">
        {isRegister
          ? "Join the inner circle for exclusive access."
          : "Sign in to manage your premium collection."}
      </p>

      {/* YOUR ORIGINAL FORM (UNCHANGED) */}
      <form onSubmit={handleSubmit} className="mt-8 space-y-5">
        {isRegister && (
          <div>
            <label className="mb-2 block text-sm font-medium">
              Full name
            </label>

            <input
              type="text"
              required
              value={form.name}
              placeholder="Joseph Bawo"
              className="w-full rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-3"
              onChange={(e) =>
                setForm({ ...form, name: e.target.value })
              }
            />
          </div>
        )}

        <div>
          <label className="mb-2 block text-sm font-medium">
            Email
          </label>

          <input
            type="email"
            required
            value={form.email}
            placeholder="you@example.com"
            className="w-full rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-3"
            onChange={(e) =>
              setForm({ ...form, email: e.target.value })
            }
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium">
            Password
          </label>

          <input
            type={showPassword ? "text" : "password"}
            required
            value={form.password}
            placeholder="••••••••"
            className="w-full rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-3"
            onChange={(e) =>
              setForm({ ...form, password: e.target.value })
            }
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-full bg-[var(--foreground)] py-3 font-medium text-[var(--surface-strong)]"
        >
          {loading
            ? "Processing..."
            : isRegister
            ? "Create account"
            : "Sign in"}
        </button>
      </form>
    </div>
  );
}