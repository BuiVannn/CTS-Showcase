"use client";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import "katex/dist/katex.min.css";
import { normalizeMath } from "@/lib/normalize-math";

/** Renders an assistant answer as Markdown + KaTeX math. Raw HTML stays disabled (no XSS). */
export default function MessageContent({ content }: { content: string }) {
  return (
    <div className="ptalk-md">
      <ReactMarkdown remarkPlugins={[remarkGfm, remarkMath]} rehypePlugins={[rehypeKatex]}>
        {normalizeMath(content)}
      </ReactMarkdown>
    </div>
  );
}
