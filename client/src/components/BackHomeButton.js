import Link from "next/link";

export default function BackHomeButton({
  href = "/",
  label = "Back to Home",
  className = "",
}) {
  return (
    <Link
      href={href}
      className={`inline-flex items-center gap-2 rounded-full border border-[var(--border)] bg-[var(--surface-strong)] px-4 py-2 text-[0.72rem] font-semibold uppercase tracking-[0.16em] text-[var(--foreground)] transition hover:bg-[var(--background-strong)] ${className}`.trim()}
    >
      <span aria-hidden="true">←</span>
      {label}
    </Link>
  );
}
