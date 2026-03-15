// components/PageLoader.jsx
export default function PageLoader({ text = "Loading…", fullPage = false }) {
  if (fullPage) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <LoaderInner text={text} />
      </div>
    );
  }
  return (
    <div className="flex items-center justify-center py-12">
      <LoaderInner text={text} />
    </div>
  );
}

function LoaderInner({ text }) {
  return (
    <div className="flex flex-col items-center gap-3">
      <div className="relative h-8 w-8">
        {/* Outer ring */}
        <span className="absolute inset-0 rounded-full border-2 border-[var(--border)]" />
        {/* Spinning arc */}
        <span
          className="absolute inset-0 rounded-full border-2 border-transparent border-t-[var(--foreground)] animate-spin"
          style={{ animationDuration: "0.7s" }}
        />
      </div>
      {text && (
        <p className="text-xs font-medium uppercase tracking-[0.2em] text-[var(--muted)]">{text}</p>
      )}
    </div>
  );
}