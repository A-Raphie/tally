"use client";

export default function GlobalError({ reset }: { error: Error; reset: () => void }) {
  return (
    <main className="mx-auto flex min-h-screen max-w-3xl flex-col justify-center px-5">
      <p className="text-[10px] uppercase tracking-[0.28em] text-[var(--text-3)]">Instrument fault</p>
      <h1 className="mt-3 text-3xl font-bold tracking-tight text-balance">
        The instrument hit an error.
      </h1>
      <p className="mt-4 max-w-[56ch] text-sm leading-relaxed text-[var(--text-2)] text-pretty">
        The page failed to render. Cards and verdicts are safe in the desk log; retry the render.
      </p>
      <div className="mt-8">
        <button
          onClick={reset}
          className="h-11 border border-[var(--line-2)] bg-[var(--text)] px-5 text-xs font-bold uppercase tracking-[0.18em] text-[var(--bg)] transition-colors duration-150 hover:bg-[var(--text-2)]"
        >
          Retry
        </button>
      </div>
    </main>
  );
}
