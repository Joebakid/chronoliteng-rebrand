import BackHomeButton from "@/components/BackHomeButton";

export default function NotFound() {
  return (
    <main className="site-frame flex min-h-[calc(100vh-6.5rem)] flex-col justify-center py-10 sm:py-14 lg:py-16">
      {/* Top Navigation Row */}
      <div className="mb-8 flex justify-end">
        <BackHomeButton />
      </div>

      {/* Main Content Card */}
      <section className="rounded-[2.5rem] border border-[var(--border)] bg-[var(--surface-strong)]/30 p-10 shadow-[var(--shadow)] sm:p-16 lg:p-24 text-center">
        <div className="space-y-6">
          {/* Subtle Label */}
          <p className="text-[0.65rem] font-black uppercase tracking-[0.4em] text-[var(--accent)]">
            Error 404
          </p>

          {/* Large Minimal Heading */}
          <h1 className="font-display text-4xl font-bold uppercase tracking-tight text-[var(--foreground)] sm:text-6xl lg:text-7xl">
            Unknown <br className="hidden sm:block" /> Destination
          </h1>

          {/* Refined Description */}
          <div className="mx-auto h-[1px] w-12 bg-[var(--border)] my-8" />
          
          <p className="mx-auto max-w-lg font-body text-[0.75rem] font-medium uppercase leading-relaxed tracking-[0.2em] text-[var(--muted)] opacity-80">
            The link you followed may be broken or the page has been moved. 
            Please verify the address or return to the main collection.
          </p>

          {/* Call to Action */}
          <div className="pt-10">
            <a 
              href="/" 
              className="inline-block rounded-full border border-[var(--foreground)] bg-[var(--foreground)] px-10 py-4 text-[0.65rem] font-bold uppercase tracking-[0.25em] text-[var(--surface-strong)] transition-all hover:bg-transparent hover:text-[var(--foreground)] active:scale-95"
            >
              Return to Storefront
            </a>
          </div>
        </div>
      </section>
    </main>
  );
}