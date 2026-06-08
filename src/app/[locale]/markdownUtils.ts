import { splitTextIntoLines } from "@/app/utils";

/**
 * Markdown 翻译选项配置
 */
export interface MarkdownOptions {
  /** 是否翻译 YAML frontmatter */
  translateFrontmatter: boolean;
  /** 是否翻译多行代码块 */
  translateMultilineCode: boolean;
  /** 是否翻译 LaTeX 公式 */
  translateLatex: boolean;
  /** 是否翻译链接文本 */
  translateLinkText: boolean;
}

/**
 * 占位符类型模式（单一来源，修改此处即可更新所有正则）
 */
const placeholderPattern =
  "FRONTMATTER_\\d+|MULTILINE_CODE_\\d+|LATEX_BLOCK_\\d+|CODE_\\d+|LATEX_INLINE_\\d+|LINK_PRE_\\d+|LINK_SUF_\\d+|LINK_\\d+|HEADING_\\d+|LIST_\\d+|BLOCKQUOTE_\\d+|HTML_\\d+";

/**
 * 预编译的正则表达式（基于 placeholderPattern 创建，模块加载时初始化一次）
 */
/** 分割文本与占位符（保留分隔符） */
export const PLACEHOLDER_SPLIT_REGEX = new RegExp(`(<<<(?:${placeholderPattern})>>>)`);
/** 完全匹配占位符 */
export const PLACEHOLDER_TEST_REGEX = new RegExp(`^<<<(?:${placeholderPattern})>>>$`);
/** 全局替换占位符 */
export const PLACEHOLDER_REPLACE_REGEX = new RegExp(`<<<(?:${placeholderPattern})>>>`, "g");

/**
 * 解析 Markdown 文本，将特殊元素替换为占位符以保护其不被翻译
 *
 * 处理的元素包括：
 * - Frontmatter (YAML)
 * - 多行代码块 (```)
 * - 内联代码 (`)
 * - LaTeX 公式 ($ 和 $$)
 * - 链接和图片
 * - 标题 (#)
 * - 列表 (- * 1.)
 * - 引用 (>)
 *
 * @param lines - 源文本的行数组
 * @param mdOptions - Markdown 翻译选项
 * @returns 包含处理后的行和各类占位符映射的对象
 */
/**
 * 行内代码配对:手写线性扫描。CommonMark 规则是「N 个反引号开启、恰好 N 个
 * 反引号关闭」—— 用嵌套量词正则((?:[^`]+|(?!\1)`+)+?)表达会在【未配对】
 * 反引号上指数回溯:一个漏写的闭合反引号就把标签页冻死(对抗审查实测
 * 28 字符尾文 ~1.8s,每 +2 字符 ×4)。线性扫描 O(n),未配对 run 按字面保留。
 */
const protectInlineCode = (line: string, store: (span: string) => string): string => {
  if (!line.includes("`")) return line;
  let out = "";
  let i = 0;
  while (i < line.length) {
    if (line[i] !== "`") {
      const next = line.indexOf("`", i);
      if (next === -1) return out + line.slice(i);
      out += line.slice(i, next);
      i = next;
      continue;
    }
    // 反引号 run:量长度 n
    let n = 0;
    while (i + n < line.length && line[i + n] === "`") n++;
    // 向后找下一个【恰好 n 长】的 run 作为闭合
    let j = i + n;
    let closeStart = -1;
    while (j < line.length) {
      if (line[j] !== "`") {
        j++;
        continue;
      }
      let m = 0;
      while (j + m < line.length && line[j + m] === "`") m++;
      if (m === n) {
        closeStart = j;
        break;
      }
      j += m;
    }
    if (closeStart === -1) {
      out += line.slice(i, i + n); // 未配对:字面保留
      i += n;
    } else {
      out += store(line.slice(i, closeStart + n));
      i = closeStart + n;
    }
  }
  return out;
};

export const filterMarkdownLines = (lines: string[], mdOptions: MarkdownOptions) => {
  const contentLines: string[] = [];
  const contentIndices: number[] = [];

  const frontmatterPlaceholders: { [key: string]: string } = {};
  const codePlaceholders: { [key: string]: string } = {};
  const linkPlaceholders: { [key: string]: string } = {};
  const headingPlaceholders: { [key: string]: string } = {};
  const listPlaceholders: { [key: string]: string } = {};
  const blockquotePlaceholders: { [key: string]: string } = {};
  const latexBlockPlaceholders: { [key: string]: string } = {};
  const latexInlinePlaceholders: { [key: string]: string } = {};
  const htmlPlaceholders: { [key: string]: string } = {};

  let frontmatterCounter = 100;
  let codeCounter = 100;
  let linkCounter = 100;
  let headingCounter = 100;
  let listCounter = 100;
  let blockquoteCounter = 100;
  let latexBlockCounter = 100;
  let latexInlineCounter = 100;
  let htmlCounter = 100;

  // 合并所有行，处理多行 frontmatter 和代码块
  let fullText = lines.join("\n");

  if (!mdOptions.translateFrontmatter) {
    // 前置区域：使用明显的 <<<FRONTMATTER_x>>> 占位符
    fullText = fullText.replace(/^---\n([\s\S]*?)\n---/, (match, body: string) => {
      // 文档以 "---" 主题分隔线(HR)开头时不是 frontmatter:盲吞会把首个
      // "---" 到下一个 "---" 之间的正文整段静默不译。仅当块内首个非空行
      // 长得像 YAML(key: 形式)才按 frontmatter 处理。
      const firstLine = (body.split("\n").find((l) => l.trim() !== "") ?? "").trim();
      // YAML 注释行(#…)开头的 frontmatter 也合法 —— 只认 key: 会把整块
      // frontmatter 误判成正文送翻译(YAML 键被翻译、# 注释被改写)。
      if (!/^["'\w-]+\s*:|^#/.test(firstLine)) return match;
      const placeholder = `<<<FRONTMATTER_${frontmatterCounter}>>>`;
      frontmatterPlaceholders[placeholder] = match;
      frontmatterCounter++;
      return placeholder;
    });
  }

  // 多行代码块。CommonMark 围栏 = ≥3 个同种字符(```/~~~)起始,以"不短于
  // 开栏长度"的同种围栏行收尾 —— 旧的懒惰 /```…```/ 会把 4 反引号外栏的
  // 内嵌 3 反引号围栏错配,内层代码被送翻译后写坏代码块。
  // 开栏/闭栏允许前导空白(规范允许 0-3 空格,列表内围栏缩进更深 —— 锚死
  // 行首会让所有列表内代码块完全失去保护)。
  if (!mdOptions.translateMultilineCode) {
    const storeFence = (match: string) => {
      const placeholder = `<<<MULTILINE_CODE_${codeCounter}>>>`;
      codePlaceholders[placeholder] = match;
      codeCounter++;
      return placeholder;
    };
    // 反引号围栏:info string 不得含反引号(CommonMark 明文规定 —— 否则行首
    // 的 ```cmd``` 行内代码 span 会被当成开栏,吞掉后续全部正文直到下一个
    // 围栏或 EOF)。波浪线围栏无此限制。中段 (?:[\s\S]*?\n)? 可选:零内容
    // 围栏(```bash 紧跟 ```)也要在这里配对,否则掉进未闭合 fallback
    // 吞掉文档剩余部分。
    fullText = fullText.replace(/^[ \t]*(`{3,})[^`\n]*\n(?:[\s\S]*?\n)?[ \t]*\1`*[ \t]*$/gm, storeFence);
    fullText = fullText.replace(/^[ \t]*(~{3,})[^\n]*\n(?:[\s\S]*?\n)?[ \t]*\1~*[ \t]*$/gm, storeFence);
    // 未闭合围栏:CommonMark 规定开栏无闭栏时代码块延伸到文档末尾 —— 不保护
    // 的话整段代码体被送翻译。上两趟已消耗所有配对围栏,此处剩余的开栏行
    // 必然未闭合(alternation 单趟取最早开栏,不分种类)。
    fullText = fullText.replace(/^[ \t]*(?:`{3,}[^`\n]*|~{3,}[^\n]*)\n[\s\S]*$/m, storeFence);
  }

  // latex 公式块。两道 guard,皆因真实公式不会包含这些:
  // 1. 内容不跨【空白行】(?!\n[ \t]*\n) —— 不是只挡字面 \n\n,编辑器留的
  //    行尾空格曾绕过段落边界检查,两个孤立 $$ 重新冻结跨段散文;
  // 2. 内容不含反引号 —— 本扫描跑在行内代码保护之前,文档里两个 `$$`
  //    代码 span 之间的散文曾被冻成假公式。
  if (!mdOptions.translateLatex) {
    fullText = fullText.replace(/\$\$((?:(?!\n[ \t]*\n)[^`])*?)\$\$/g, (match) => {
      const placeholder = `<<<LATEX_BLOCK_${latexBlockCounter}>>>`;
      latexBlockPlaceholders[placeholder] = match;
      latexBlockCounter++;
      return placeholder;
    });
  }

  // HTML 注释:必须在整文阶段处理 —— <!-- --> 常跨多行([\s\S] 写对了但旧代码
  // 按行应用,跨行注释永远匹配不上,注释正文被翻译并污染输出)。
  // [^`] 而非 [\s\S]:本扫描跑在行内代码保护之前,反引号包裹的 `<!--` 代码
  // span 曾开出幻影注释吞掉后续正文(含反引号的真实注释罕见,按字面保留)。
  fullText = fullText.replace(/<!--[^`]*?-->/g, (match) => {
    const placeholder = `<<<HTML_${htmlCounter}>>>`;
    htmlPlaceholders[placeholder] = match;
    htmlCounter++;
    return placeholder;
  });

  // 按行处理
  const processedLines = splitTextIntoLines(fullText);

  processedLines.forEach((line, index) => {
    let modifiedLine = line;

    // 内联代码(线性扫描,见 protectInlineCode 注释 —— 不能用嵌套量词正则)
    modifiedLine = protectInlineCode(modifiedLine, (span) => {
      const placeholder = `<<<CODE_${codeCounter}>>>`;
      codePlaceholders[placeholder] = span;
      codeCounter++;
      return placeholder;
    });

    // 处理内联 LaTeX 公式，但避免识别货币符号
    if (!mdOptions.translateLatex) {
      // pandoc 行内公式完整规则:开 $ 后紧跟非空白、闭 $ 前紧跟非空白、且
      // 【闭 $ 后不能紧跟数字】—— 没有最后一条,"价格$100,优惠$50" 会把
      // 两个价格之间的 CJK 文本冻结成假公式(CJK 无空格,trailing-space
      // 检查帮不上)。(?<!\\) 排除反斜杠转义的字面 \$。
      modifiedLine = modifiedLine.replace(/(?<!\\)\$([^\s$][^$]*?)\$(?!\d)/g, (match, content: string) => {
        if (/\s$/.test(content)) return match; // 闭 $ 前是空白 → 非公式
        // 简单的启发式检测：如果只包含数字、逗号和小数点，可能是货币
        if (/^[\s\d,.]+$/.test(content) && !content.includes("\\")) {
          return match; // 保持货币符号不变
        }
        const placeholder = `<<<LATEX_INLINE_${latexInlineCounter}>>>`;
        latexInlinePlaceholders[placeholder] = match;
        latexInlineCounter++;
        return placeholder;
      });
    }

    // HTML 标签(开始/结束/自闭合;跨行注释已在整文阶段处理)
    // 匹配自闭合标签 <tag ... /> 或 <tag/>
    modifiedLine = modifiedLine.replace(/<([a-zA-Z][a-zA-Z0-9-]*)\s*[^>]*\/>/g, (match) => {
      const placeholder = `<<<HTML_${htmlCounter}>>>`;
      htmlPlaceholders[placeholder] = match;
      htmlCounter++;
      return placeholder;
    });
    // 匹配结束标签 </tag>
    modifiedLine = modifiedLine.replace(/<\/([a-zA-Z][a-zA-Z0-9-]*)>/g, (match) => {
      const placeholder = `<<<HTML_${htmlCounter}>>>`;
      htmlPlaceholders[placeholder] = match;
      htmlCounter++;
      return placeholder;
    });
    // 匹配开始标签 <tag ...> 或 <tag>
    modifiedLine = modifiedLine.replace(/<([a-zA-Z][a-zA-Z0-9-]*)(?:\s+[^>]*)?>/g, (match) => {
      const placeholder = `<<<HTML_${htmlCounter}>>>`;
      htmlPlaceholders[placeholder] = match;
      htmlCounter++;
      return placeholder;
    });

    // 图片 - 始终翻译 alt 文本。URL 段允许一层嵌套括号(维基百科式
    // /wiki/A_(b) 链接),旧的懒惰 .*? 会在 URL 内第一个 ")" 截断,把链接
    // 剩余部分当可翻译文本送出去,链接结构被写坏。
    modifiedLine = modifiedLine.replace(/(!\[)(.*?)(\]\((?:[^()\n]|\([^()\n]*\))*\))/g, (match, prefix, content, suffix) => {
      // 如果 alt 为空，整个替换为占位符
      if (!content.trim()) {
        const placeholder = `<<<LINK_${linkCounter}>>>`;
        linkPlaceholders[placeholder] = match;
        linkCounter++;
        return placeholder;
      }

      const prefixPlaceholder = `<<<LINK_PRE_${linkCounter}>>>`;
      const suffixPlaceholder = `<<<LINK_SUF_${linkCounter}>>>`;
      linkPlaceholders[prefixPlaceholder] = prefix;
      linkPlaceholders[suffixPlaceholder] = suffix;
      linkCounter++;

      return `${prefixPlaceholder}${content}${suffixPlaceholder}`;
    });

    // 链接（非图片）- 根据选项决定是否翻译链接文本(URL 嵌套括号同上)
    modifiedLine = modifiedLine.replace(/(\[)(.*?)(\]\((?:[^()\n]|\([^()\n]*\))*\))/g, (match, prefix, content, suffix) => {
      if (mdOptions.translateLinkText) {
        const prefixPlaceholder = `<<<LINK_PRE_${linkCounter}>>>`;
        const suffixPlaceholder = `<<<LINK_SUF_${linkCounter}>>>`;
        linkPlaceholders[prefixPlaceholder] = prefix;
        linkPlaceholders[suffixPlaceholder] = suffix;
        linkCounter++;

        return `${prefixPlaceholder}${content}${suffixPlaceholder}`;
      }

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

    // 加粗文本不需要保护：** 不会被翻译模型当作可翻译内容剥离，
    // 保护反而会切断句子，让模型失去上下文。保留为内联标记。

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
    latexBlockPlaceholders,
    latexInlinePlaceholders,
    htmlPlaceholders,
  };
};

/** filterMarkdownLines 返回值中所有 placeholder map 字段的子集 */
export type PlaceholderMaps = Pick<
  ReturnType<typeof filterMarkdownLines>,
  | "frontmatterPlaceholders"
  | "codePlaceholders"
  | "latexBlockPlaceholders"
  | "linkPlaceholders"
  | "headingPlaceholders"
  | "listPlaceholders"
  | "blockquotePlaceholders"
  | "latexInlinePlaceholders"
  | "htmlPlaceholders"
>;

/**
 * 把翻译后文本中的占位符还原成原始内容。单次正则扫描 + Map.get 查表,
 * 复杂度 O(text.length)。函数形式的 String.replace callback 返回值是字面量,
 * 不会触发 `$&`/`$$` 解析,因此 LaTeX 块的 `$$` 也能安全还原。
 */
export const restorePlaceholders = (text: string, maps: PlaceholderMaps): string => {
  const all = new Map<string, string>([
    ...Object.entries(maps.frontmatterPlaceholders),
    ...Object.entries(maps.codePlaceholders),
    ...Object.entries(maps.latexBlockPlaceholders),
    ...Object.entries(maps.linkPlaceholders),
    ...Object.entries(maps.headingPlaceholders),
    ...Object.entries(maps.listPlaceholders),
    ...Object.entries(maps.blockquotePlaceholders),
    ...Object.entries(maps.latexInlinePlaceholders),
    ...Object.entries(maps.htmlPlaceholders),
  ]);
  // 迭代到不动点:占位符会嵌套 —— 行内代码先替换,HTML 标签/注释随后包住
  // 含占位符的文本,存储值里就带着内层占位符。单趟还原会把字面
  // <<<CODE_100>>> 留在最终输出里。passes 上限防御病态自引用。
  let out = text;
  for (let pass = 0; pass < 10; pass++) {
    const next = out.replace(PLACEHOLDER_REPLACE_REGEX, (match) => all.get(match) ?? match);
    if (next === out) break;
    out = next;
  }
  return out;
};
