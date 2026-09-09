import Link from "next/link";

export default function NotFound() {
  return (
    <main className="mx-auto flex min-h-screen max-w-3xl flex-col justify-center px-5">
      <p className="text-[10px] uppercase tracking-[0.28em] text-[var(--text-3)]">404</p>
      <h1 className="mt-3 text-3xl font-bold tracking-tight text-balance">
        This page is not on the desk.
      </h1>
      <p className="mt-4 max-w-[56ch] text-sm leading-relaxed text-[var(--text-2)] text-pretty">
        The URL does not match anything Tally serves. The instrument and the landing are the two
        real surfaces.
      </p>
      <div className="mt-8 flex flex-wrap gap-4">
        <Link
          href="/"
          className="h-11 border border-[var(--line-2)] bg-[var(--text)] px-5 text-xs font-bold uppercase tracking-[0.18em] leading-[2.75rem] text-[var(--bg)] transition-colors duration-150 hover:bg-[var(--text-2)]"
        >
          Landing
        </Link>
        <Link
          href="/desk"
          className="h-11 border border-[var(--line-2)] px-5 text-xs font-bold uppercase tracking-[0.18em] leading-[2.75rem] text-[var(--text-2)] transition-colors duration-150 hover:bg-[var(--surface)] hover:text-[var(--text)]"
        >
          The desk
        </Link>
      </div>
    </main>
  );
}
