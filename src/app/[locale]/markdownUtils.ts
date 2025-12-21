import { splitTextIntoLines } from "@/app/utils";

interface MarkdownOptions {
  translateFrontmatter: boolean;
  translateMultilineCode: boolean;
  translateLatex: boolean;
}
/**
 * 解析文本，将前置区域、代码块、链接、标题、列表、引用、加粗等内容替换为占位符，
 * 返回处理后的行数组及各类占位符字典
 */
export const placeholderPattern = "FRONTMATTER_\\d+|MULTILINE_CODE_\\d+|LATEX_BLOCK_\\d+|CODE_\\d+|LATEX_INLINE_\\d+|LINK_\\d+|HEADING_\\d+|LIST_\\d+|BLOCKQUOTE_\\d+|STRONG_\\d+";
export const filterMarkdownLines = (lines: string[], mdOption: MarkdownOptions) => {
  const contentLines: string[] = [];
  const contentIndices: number[] = [];

  const frontmatterPlaceholders: { [key: string]: string } = {};
  const codePlaceholders: { [key: string]: string } = {};
  const linkPlaceholders: { [key: string]: string } = {};
  const headingPlaceholders: { [key: string]: string } = {};
  const listPlaceholders: { [key: string]: string } = {};
  const blockquotePlaceholders: { [key: string]: string } = {};
  const strongPlaceholders: { [key: string]: string } = {};
  const latexBlockPlaceholders: { [key: string]: string } = {};
  const latexInlinePlaceholders: { [key: string]: string } = {};

  let frontmatterCounter = 100;
  let codeCounter = 100;
  let linkCounter = 100;
  let headingCounter = 100;
  let listCounter = 100;
  let blockquoteCounter = 100;
  // let strongCounter = 100;
  let latexBlockCounter = 100;
  let latexInlineCounter = 100;

  // 合并所有行，处理多行 frontmatter 和代码块
  let fullText = lines.join("\n");

  if (!mdOption.translateFrontmatter) {
    // 前置区域：使用明显的 <<<FRONTMATTER_x>>> 占位符
    fullText = fullText.replace(/^---\n[\s\S]*?\n---/, (match) => {
      const placeholder = `<<<FRONTMATTER_${frontmatterCounter}>>>`;
      frontmatterPlaceholders[placeholder] = match;
      frontmatterCounter++;
      return placeholder;
    });
  }

  // 多行代码块
  if (!mdOption.translateMultilineCode) {
    fullText = fullText.replace(/```[\s\S]*?```/g, (match) => {
      const placeholder = `<<<MULTILINE_CODE_${codeCounter}>>>`;
      codePlaceholders[placeholder] = match;
      codeCounter++;
      return placeholder;
    });
  }

  // latex 公式块
  if (!mdOption.translateLatex) {
    fullText = fullText.replace(/\$\$[\s\S]*?\$\$/g, (match) => {
      const placeholder = `<<<LATEX_BLOCK_${latexBlockCounter}>>>`;
      latexBlockPlaceholders[placeholder] = match;
      latexBlockCounter++;
      return placeholder;
    });
  }

  // 按行处理
  const processedLines = splitTextIntoLines(fullText);

  processedLines.forEach((line, index) => {
    let modifiedLine = line;

    // 内联代码
    modifiedLine = modifiedLine.replace(/`([^`]+?)`/g, (match) => {
      const placeholder = `<<<CODE_${codeCounter}>>>`;
      codePlaceholders[placeholder] = match;
      codeCounter++;
      return placeholder;
    });

    // 处理内联 LaTeX 公式，但避免识别货币符号
    if (!mdOption.translateLatex) {
      modifiedLine = modifiedLine.replace(/\$([^\$]+?)\$/g, (match, content) => {
        // 简单的启发式检测：如果只包含数字、逗号和小数点，可能是货币
        // 或者检查是否包含常见的 LaTeX 命令，如\
        if (/^[\s\d,.]+$/.test(content) && !content.includes("\\")) {
          return match; // 保持货币符号不变
        }
        const placeholder = `<<<LATEX_INLINE_${latexInlineCounter}>>>`;
        latexInlinePlaceholders[placeholder] = match;
        latexInlineCounter++;
        return placeholder;
      });
    }

    // 链接和图片
    modifiedLine = modifiedLine.replace(/(!?\[.*?\]\(.*?\))/g, (match) => {
      const placeholder = `<<<LINK_${linkCounter}>>>`;
      linkPlaceholders[placeholder] = match;
      linkCounter++;
      return placeholder;
    });

    // 标题（保留标题内容，仅将前缀替换成占位符）
    modifiedLine = modifiedLine.replace(/^(#{1,6}\s)(.*)/, (_, prefix, content) => {
      const placeholder = `<<<HEADING_${headingCounter}>>>`;
      headingPlaceholders[placeholder] = prefix;
      headingCounter++;
      return `${placeholder}${content}`;
    });

    // 列表
    modifiedLine = modifiedLine.replace(/^(\s*(?:[-*]|\d+\.)\s+)(.*)/, (_, prefix, content) => {
      const placeholder = `<<<LIST_${listCounter}>>>`;
      listPlaceholders[placeholder] = prefix;
      listCounter++;
      return `${placeholder}${content}`;
    });

    // 引用
    modifiedLine = modifiedLine.replace(/^(>\s)(.*)/, (_, prefix, content) => {
      const placeholder = `<<<BLOCKQUOTE_${blockquoteCounter}>>>`;
      blockquotePlaceholders[placeholder] = prefix;
      blockquoteCounter++;
      return `${placeholder}${content}`;
    });

    // 加粗文本（不作处理，避免语义被分割）
    // modifiedLine = modifiedLine.replace(/\*\*(.*?)\*\*/g, (match, content) => {
    //   const placeholder = `<<<STRONG_${strongCounter}>>>`;
    //   strongPlaceholders[placeholder] = content;
    //   strongCounter++;
    //   return `${placeholder}${content}${placeholder}`;
    // });

    contentLines.push(modifiedLine);
    contentIndices.push(index);
  });

  return {
    contentLines,
    contentIndices,
    frontmatterPlaceholders,
    codePlaceholders,
    linkPlaceholders,
    headingPlaceholders,
    listPlaceholders,
    blockquotePlaceholders,
    strongPlaceholders,
    latexBlockPlaceholders,
    latexInlinePlaceholders,
  };
};
