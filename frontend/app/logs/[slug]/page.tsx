import fs from "node:fs/promises";
import path from "node:path";
import { notFound } from "next/navigation";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import type { Metadata } from "next";
import { engineeringLogs } from "../data";

type LogPageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateStaticParams() {
  return engineeringLogs.map((log) => ({ slug: log.slug }));
}

export async function generateMetadata({ params }: LogPageProps): Promise<Metadata> {
  const { slug } = await params;
  const log = engineeringLogs.find((entry) => entry.slug === slug);

  if (!log) {
    return {
      title: "Log Not Found",
    };
  }

  return {
    title: `${log.title} — Engineering Log`,
    description: log.description,
  };
}

export default async function LogPage({ params }: LogPageProps) {
  const { slug } = await params;
  const log = engineeringLogs.find((entry) => entry.slug === slug);

  if (!log) notFound();

  const filePath = path.join(process.cwd(), "content", "logs", `${slug}.md`);

  let markdown: string;

  try {
    markdown = await fs.readFile(filePath, "utf8");
  } catch {
    notFound();
  }

  return (
    <main className="min-h-screen bg-black px-6 py-16 text-white sm:px-10 lg:px-20">
      <article className="mx-auto w-full max-w-3xl">
        <p className="text-[10px] uppercase tracking-[0.24em] text-white/45">Engineering Log</p>
        <h1 className="mt-4 text-3xl font-black tracking-[-0.02em] text-white sm:text-4xl">
          {log.title}
        </h1>
        <p className="mt-3 text-sm text-white/65">{log.description}</p>

        <div className="mt-10 space-y-5 text-[15px] leading-8 text-white/85 [&_h1]:text-2xl [&_h1]:font-semibold [&_h1]:text-white [&_h2]:mt-8 [&_h2]:text-lg [&_h2]:font-semibold [&_h2]:text-white [&_pre]:overflow-x-auto [&_pre]:rounded-xl [&_pre]:border [&_pre]:border-white/10 [&_pre]:bg-[#050505] [&_pre]:p-4 [&_code]:font-mono [&_code]:text-[13px] [&_ul]:list-disc [&_ul]:space-y-2 [&_ul]:pl-5">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>{markdown}</ReactMarkdown>
        </div>
      </article>
    </main>
  );
}
