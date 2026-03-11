import BackHomeButton from "@/components/BackHomeButton";

export default function NotFound() {
  return (
    <main className="site-frame flex min-h-[calc(100vh-6.5rem)] flex-col justify-center py-10 sm:py-14 lg:py-16">
      <div className="mb-6 flex justify-end">
        <BackHomeButton />
      </div>

      <section className="rounded-[2rem] border border-[var(--border)] bg-[var(--surface-strong)] p-8 shadow-[var(--shadow)] sm:p-10">
        <p className="text-[0.74rem] font-semibold uppercase tracking-[0.28em] text-[var(--muted)]">
          Page not found
        </p>
        <h1 className="font-display mt-4 text-4xl font-semibold text-[var(--foreground)] sm:text-5xl">
          Unknown link
        </h1>
        <p className="mt-4 max-w-2xl text-[0.92rem] leading-7 text-[var(--muted)]">
          The page you entered does not exist. Check the URL or return to the storefront.
        </p>
      </section>
    </main>
  );
}
