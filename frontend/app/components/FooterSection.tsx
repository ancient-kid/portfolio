export function FooterSection() {
  return (
    <footer className="border-t border-white/10 px-6 py-8 sm:px-10 lg:px-20">
      <div className="mx-auto flex max-w-6xl flex-col gap-6 text-sm text-[#A0A0A0] sm:flex-row sm:items-center sm:justify-between">
        <p className="text-xl font-black tracking-[-0.02em] text-white">ANRG.</p>
        <div className="space-y-3 text-left sm:text-right">
          <p>© 2026</p>
          <div className="flex gap-4 sm:justify-end">
            <a href="https://github.com/ancient-kid" target="_blank" rel="noreferrer" className="transition hover:text-white">
              GitHub
            </a>
            <a href="https://x.com/anxientkid" target="_blank" rel="noreferrer" className="transition hover:text-white">
              X
            </a>
            <a
              href="https://www.linkedin.com/in/anurag-anrg"
              target="_blank"
              rel="noreferrer"
              className="transition hover:text-white"
            >
              LinkedIn
            </a>
            <a href="mailto:anrg.dev@gmail.com" className="transition hover:text-white">
              Email
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
