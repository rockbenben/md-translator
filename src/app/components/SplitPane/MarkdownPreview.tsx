"use client";

import React from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneDark } from "react-syntax-highlighter/dist/esm/styles/prism";
import "katex/dist/katex.min.css";

interface MarkdownPreviewProps {
  /** Markdown 内容 */
  content: string;
  /** 自定义类名 */
  className?: string;
}

/**
 * Markdown 渲染组件
 * 支持:
 * - Basic Markdown (标题、列表、代码块、链接、粗体、斜体)
 * - GFM (表格、任务列表、删除线)
 * - LaTeX 数学公式 ($x$ 和 $$x$$)
 * - Prism 语法高亮 (oneDark 主题)
 */
const MarkdownPreview: React.FC<MarkdownPreviewProps> = ({ content, className }) => {
  return (
    <div className={className}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm, remarkMath]}
        rehypePlugins={[rehypeKatex]}
        components={{
          // 代码块语法高亮
          code({ className, children, ...props }) {
            const match = /language-(\w+)/.exec(className || "");
            const isInline = !match && !className;

            if (isInline) {
              return (
                <code
                  className="px-1 py-0.5 bg-gray-100 dark:bg-gray-800 rounded text-sm font-mono"
                  {...props}
                >
                  {children}
                </code>
              );
            }

            return (
              <SyntaxHighlighter
                style={oneDark}
                language={match ? match[1] : "text"}
                PreTag="div"
                className="!my-2 !rounded-lg !bg-gray-900"
              >
                {String(children).replace(/\n$/, "")}
              </SyntaxHighlighter>
            );
          },
          // 链接打开新窗口
          a({ href, children, ...props }) {
            return (
              <a
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-500 hover:text-blue-600 underline"
                {...props}
              >
                {children}
              </a>
            );
          },
          // 表格样式
          table({ children, ...props }) {
            return (
              <div className="overflow-x-auto my-3">
                <table
                  className="min-w-full border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden"
                  {...props}
                >
                  {children}
                </table>
              </div>
            );
          },
          // 表格头样式
          th({ children, ...props }) {
            return (
              <th
                className="px-4 py-2 bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 font-semibold text-left"
                {...props}
              >
                {children}
              </th>
            );
          },
          // 表格单元格样式
          td({ children, ...props }) {
            return (
              <td
                className="px-4 py-2 border-b border-gray-200 dark:border-gray-700"
                {...props}
              >
                {children}
              </td>
            );
          },
          // 任务列表样式
          input({ type, ...props }) {
            if (type === "checkbox") {
              return (
                <input
                  type="checkbox"
                  className="mr-2 w-4 h-4 accent-blue-500"
                  readOnly
                  {...props}
                />
              );
            }
            return <input type={type} {...props} />;
          },
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
};

export default MarkdownPreview;
