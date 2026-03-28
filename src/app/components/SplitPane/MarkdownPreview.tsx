"use client";

import React, { useRef, useEffect } from "react";
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
 * - data-index 属性用于滚动同步
 */
const MarkdownPreview: React.FC<MarkdownPreviewProps> = ({ content, className }) => {
  // 使用 ref 追踪每个元素类型的索引计数器
  // 使用 ref 而非 state 避免不必要的重渲染
  const countersRef = useRef({
    h: 0,
    p: 0,
    li: 0,
    tr: 0,
    pre: 0,
  });

  // 生成 data-index
  const getDataIndex = (type: keyof typeof countersRef.current): string => {
    const index = countersRef.current[type]++;
    return `${type}-${index}`;
  };

  // 当 content 改变时，重置计数器以确保索引重新开始
  useEffect(() => {
    countersRef.current = { h: 0, p: 0, li: 0, tr: 0, pre: 0 };
  }, [content]);

  return (
    <div className={className}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm, remarkMath]}
        rehypePlugins={[rehypeKatex]}
        components={{
          // 标题添加 data-index (h1-h6 共用逻辑)
          h1({ children, ...props }) {
            return <h1 data-index={getDataIndex("h")} {...props}>{children}</h1>;
          },
          h2({ children, ...props }) {
            return <h2 data-index={getDataIndex("h")} {...props}>{children}</h2>;
          },
          h3({ children, ...props }) {
            return <h3 data-index={getDataIndex("h")} {...props}>{children}</h3>;
          },
          h4({ children, ...props }) {
            return <h4 data-index={getDataIndex("h")} {...props}>{children}</h4>;
          },
          h5({ children, ...props }) {
            return <h5 data-index={getDataIndex("h")} {...props}>{children}</h5>;
          },
          h6({ children, ...props }) {
            return <h6 data-index={getDataIndex("h")} {...props}>{children}</h6>;
          },
          // 段落添加 data-index
          p({ children, ...props }) {
            return <p data-index={getDataIndex("p")} {...props}>{children}</p>;
          },
          // 列表项添加 data-index
          li({ children, ...props }) {
            return <li data-index={getDataIndex("li")} {...props}>{children}</li>;
          },
          // 表格行添加 data-index
          tr({ children, ...props }) {
            return <tr data-index={getDataIndex("tr")} {...props}>{children}</tr>;
          },
          // 预格式化代码块添加 data-index
          pre({ children, ...props }) {
            return <pre data-index={getDataIndex("pre")} {...props}>{children}</pre>;
          },
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
