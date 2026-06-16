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
 * 跨占位符配对守卫:HTML 注释 / LaTeX 块的内容类逐字符回火,禁止跨越先行
 * pass 产出的占位符 token(围栏占位符行【不含】反引号也不含空行,裸内容类
 * 会让两个散落定界符跨占位符配对,中间散文整段被吞)。按【精确占位符形态】
 * 回火而非裸 "<<<":字面 <<<(shell here-string、heredoc 示例)中止匹配会
 * 让注释失保护、尾部还被开标签 pass 熔成 "<<<<<HTML_n>>>" 形态的假 token。
 */
const NOT_PLACEHOLDER_LOOKAHEAD = `(?!<<<(?:${placeholderPattern})>>>)`;

/**
 * HTML 注释保护:线性扫描(语义与旧正则
 * `<!--(?:NOT_PLACEHOLDER[^`])*?-->` 完全一致)。旧正则对【未闭合】的
 * `<!--` 是二次方:每个开标记的惰性中段都要扫到文档末尾才放弃 —— 16k 行
 * 无闭合注释的文件(grep 输出、注释模板清单)让主线程冻死 4 秒+,每翻倍
 * ×4(围栏 pass 同病已改行扫描,这里同方)。
 * 配对规则:最近的 `-->`;中段含反引号或占位符 token 则该开标记永远配不上
 * (更远的闭标记必然包含同一坏字符),按字面保留。三个游标(闭标记/反引号/
 * 占位符)单调前移,整体 O(n)。
 */
const protectHtmlComments = (text: string, store: (span: string) => string): string => {
  if (!text.includes("<!--")) return text;
  const phRe = new RegExp(`<<<(?:${placeholderPattern})>>>`, "g");
  let out = "";
  let emitFrom = 0;
  let searchFrom = 0;
  let close = -2; // 缓存的最近 "-->" 下标(-2 = 未计算)
  let tick = -2; // 缓存的最近 "`" 下标
  let ph = -2; // 缓存的最近占位符 token 起点
  for (;;) {
    const open = text.indexOf("<!--", searchFrom);
    if (open === -1) break;
    const mid = open + 4;
    if (close !== -1 && close < mid) close = text.indexOf("-->", mid);
    if (close === -1) break;
    if (tick !== -1 && tick < mid) tick = text.indexOf("`", mid);
    if (ph !== -1 && ph < mid) {
      phRe.lastIndex = mid;
      const m = phRe.exec(text);
      ph = m ? m.index : -1;
    }
    const valid = (tick === -1 || tick >= close) && (ph === -1 || ph >= close);
    if (valid) {
      out += text.slice(emitFrom, open) + store(text.slice(open, close + 3));
      emitFrom = close + 3;
      searchFrom = close + 3;
    } else {
      searchFrom = mid;
    }
  }
  return out + text.slice(emitFrom);
};
// 第四道守卫 (?!\n[ \t]*#{1,6}[ \t]):内容不跨 ATX 标题行 —— 真公式不会包含
// markdown 标题,而无空行的 CJK 散文(粘贴文本常见)里两个孤立 $$ 会连同
// 中间的标题/正文整段冻成假公式,段落守卫(依赖空行)帮不上。
const LATEX_BLOCK_RE = new RegExp(`\\$\\$(?:(?!\\n[ \\t]*\\n)(?!\\n[ \\t]*#{1,6}[ \\t])${NOT_PLACEHOLDER_LOOKAHEAD}[^\`])*?\\$\\$`, "g");

// HTML 自闭合/开始标签。未引号属性段同样按占位符回火(注释/LaTeX 同款):
// 裸 [^>"'] 会吃进先行 pass 产出的 <<<CODE_n / <<<LATEX_INLINE_n 字符,标签的
// 收尾 > 恰好熔断占位符 token 的第一个 >("T<U requires `compare()`" 的行内
// 代码占位符被吞进 HTML 占位符,行里残留孤立 ">>",译模型不逐字回传时还原出
// 字面 <<<CODE_n> 垃圾且代码内容丢失)。引号分支不需要回火 —— 引号内的完整
// token 是合法嵌套,restorePlaceholders 的定点迭代会逐层展开。
const HTML_SELF_CLOSING_RE = new RegExp(`<([a-zA-Z][a-zA-Z0-9-]*)(?:\\s+[a-zA-Z_:@#{](?:${NOT_PLACEHOLDER_LOOKAHEAD}[^>"']|"[^"]*"|'[^']*')*?|\\s*)\\/>`, "g");
const HTML_OPEN_TAG_RE = new RegExp(`<([a-zA-Z][a-zA-Z0-9-]*)(?:\\s+[a-zA-Z_:@#](?:${NOT_PLACEHOLDER_LOOKAHEAD}[^>"']|"[^"]*"|'[^']*')*|\\s*\\/|\\s+)?>`, "g");

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

  // 计数器从源文里已有的字面占位符形态文本之后起算:粘贴过"复制占位符
  // 文本"的输出、讲解本管线的文档里会出现字面 <<<CODE_100>>> —— 若新分配
  // 的占位符与之同名,还原时 all.get 命中真实映射,把用户的字面 token 静默
  // 替换成无关内容(数据损坏)。避让后字面 token 不进映射,restorePlaceholders
  // 的 `?? match` 兜底让它原样留在输出里。
  // 序号限 1-9 位:更长的数字(如字面 <<<CODE_99999999999999999999>>>)解析
  // 成浮点会让模板字符串产出 "1e+21" 形态的不合规占位符、且自增失效全员同名;
  // 而计数器从 100 起每文档至多加几千,永远到不了 10^9 —— 超长序号不避让也
  // 不可能碰撞,直接忽略。
  let counterSeed = 100;
  for (const m of lines.join("\n").matchAll(/<<<[A-Z_]+_(\d{1,9})>>>/g)) {
    counterSeed = Math.max(counterSeed, Number(m[1]) + 1);
  }

  let frontmatterCounter = counterSeed;
  let codeCounter = counterSeed;
  let linkCounter = counterSeed;
  let headingCounter = counterSeed;
  let listCounter = counterSeed;
  let blockquoteCounter = counterSeed;
  let latexBlockCounter = counterSeed;
  let latexInlineCounter = counterSeed;
  let htmlCounter = counterSeed;

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
    // 单趟行扫描按【文档顺序】配对围栏(CommonMark 语义):
    //   - 开栏 = ≥3 个同种字符;反引号栏的 info string 不得含反引号(规范
    //     明文 —— 否则行首 ```cmd``` 行内代码 span 会被当开栏),波浪线栏
    //     无此限制;
    //   - 闭栏 = 同种字符、长度 ≥ 开栏、整行仅该字符(两侧允许空白);
    //   - 无闭栏 → 块延伸到文档末尾(规范);零内容围栏(```bash 紧跟 ```)
    //     正常配对。
    // 此前是"先全文配对反引号、再全文配对波浪"的两趟正则 + 未闭合 fallback:
    //   1. 两个波浪栏【内容里】的字面 ``` 行(演示围栏语法的标准写法)会被
    //      跨块配成一对,把两块之间的正文整段吞进代码占位符 —— 输出与源文
    //      逐字节相同却报翻译成功;
    //   2. 每个配对失败的开栏行,懒惰中段都要对剩余全文回溯 —— 病态输入
    //      (几万行 ```x 开栏)让主线程卡死在二次方扫描里。
    // 行扫描两者皆除,O(行数)。
    const srcLines = fullText.split("\n");
    const outLines: string[] = [];
    // blockquote 前缀("> "、"> > ",规范允许 0-3 前导空格):引用块内的围栏
    // 按 CommonMark 仍是代码围栏 —— 不剥前缀直接匹配会让 "> ```js" 的整块
    // 引用代码(changelog、引用回答里很常见)当散文送翻,代码被机翻写坏。
    const BQ_PREFIX_RE = /^(?:[ \t]{0,3}>[ \t]?)+/;
    for (let i = 0; i < srcLines.length; i++) {
      const bq = srcLines[i].match(BQ_PREFIX_RE);
      const openerBody = bq ? srcLines[i].slice(bq[0].length) : srcLines[i];
      const opener = openerBody.match(/^[ \t]*(`{3,})[^`]*$|^[ \t]*(~{3,})/);
      if (!opener) {
        outLines.push(srcLines[i]);
        continue;
      }
      const fenceChar = opener[1] ? "`" : "~";
      const minLen = (opener[1] ?? opener[2]!).length;
      let end = i + 1;
      let closerAt: number | null = null;
      while (end < srcLines.length) {
        let body = srcLines[end];
        if (bq) {
          // 引用块围栏的内容/闭栏行必须仍带 > 前缀(围栏不是段落,没有
          // lazy continuation);无前缀行 = 引用块结束,围栏块随之截止。
          const m = body.match(BQ_PREFIX_RE);
          if (!m) break;
          body = body.slice(m[0].length);
        }
        // 只容忍 space/tab(与开栏一致):trim() 会连 NBSP/全角空格一起吞,
        // 把 "　```" 这种按规范属于代码内容的行误判成闭栏,栏后内容
        // 泄漏出保护、残留的真闭栏再开出幻影围栏吞掉后续正文。
        const t = body.replace(/^[ \t]+|[ \t]+$/g, "");
        if (t.length >= minLen && [...t].every((c) => c === fenceChar)) {
          closerAt = end;
          break;
        }
        end++;
      }
      // 闭栏行收尾;无闭栏时:引用块围栏到引用块最后一行为止,顶层围栏
      // 延伸到文档末尾(规范)。
      const blockEnd = closerAt ?? (bq ? end - 1 : srcLines.length - 1);
      outLines.push(storeFence(srcLines.slice(i, blockEnd + 1).join("\n")));
      i = blockEnd;
    }
    fullText = outLines.join("\n");
  }

  // HTML 注释:必须在整文阶段处理 —— <!-- --> 常跨多行([\s\S] 写对了但旧代码
  // 按行应用,跨行注释永远匹配不上,注释正文被翻译并污染输出)。
  // 【先于 LaTeX 块】:注释是更外层的文档区域 —— 反过来跑时,注释内的
  // "$$"(<!-- TODO: fix $$ rendering -->)会与后文散文里的 $$ 配对,注释
  // 正文被送翻、可见散文被冻结。
  // [^`] 而非 [\s\S]:本扫描跑在行内代码保护之前,反引号包裹的 `<!--` 代码
  // span 曾开出幻影注释吞掉后续正文(含反引号的真实注释罕见,按字面保留)。
  // 占位符回火(NOT_PLACEHOLDER_LOOKAHEAD,定义见顶部):围栏等先行 pass 的
  // 占位符行【不含】反引号/空行,裸 [^`] 会让 "<!--" + 围栏占位符 + "-->"
  // 跨占位符配对,中间散文整段被吞 —— 输出与源文逐字节相同却报成功
  // (LaTeX 块同款守卫,见下)。
  fullText = protectHtmlComments(fullText, (match) => {
    const placeholder = `<<<HTML_${htmlCounter}>>>`;
    htmlPlaceholders[placeholder] = match;
    htmlCounter++;
    return placeholder;
  });

  // latex 公式块。三道 guard,皆因真实公式不会包含这些:
  // 1. 内容不跨【空白行】(?!\n[ \t]*\n) —— 不是只挡字面 \n\n,编辑器留的
  //    行尾空格曾绕过段落边界检查,两个孤立 $$ 重新冻结跨段散文;
  // 2. 内容不含反引号 —— 本扫描跑在行内代码保护之前,文档里两个 `$$`
  //    代码 span 之间的散文曾被冻成假公式;
  // 3. 内容不跨占位符(NOT_PLACEHOLDER_LOOKAHEAD)—— 围栏占位符行无反引号
  //    也无空行,讲解 math 语法的文档("Wrap display math in $$" + 围栏示例
  //    + "A closing $$")曾跨围栏配对,两段散文连同围栏被吞进假公式。
  if (!mdOptions.translateLatex) {
    fullText = fullText.replace(LATEX_BLOCK_RE, (match) => {
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
    // 匹配自闭合标签 <tag ... /> 或 <tag/>。属性段与开始标签同款双守卫:
    //   1. 必须以合法属性名字符开头 —— 裸 \s*[^>]* 会把 "i<n 时…<item/>" 的
    //      中间散文整段吞进占位符(开始标签 pass 修过的同一 bug,这条跑在它
    //      之前,不守卫等于白修);
    //   2. 引号内的 > 不终结属性段(CommonMark 明文允许)—— 否则标签在引号
    //      中间截断,残尾被当散文送翻,还原后属性被写坏。
    // \{ 在属性起始集里:JSX/MDX 的展开属性 <Component {...props}/> 在守卫
    // 加固前是受保护的,不放行会把它当散文送翻。
    modifiedLine = modifiedLine.replace(HTML_SELF_CLOSING_RE, (match) => {
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
    // 匹配开始标签 <tag ...> 或 <tag>。属性段必须以合法属性名字符
    // ([a-zA-Z_:],外加 @/# 容纳 Vue 的 @click / #slot 速记)或自闭合 /
    // 开头(CommonMark 原始 HTML 规则)—— 裸 [^>]* 会把 "如果 a<b 且 c>d"
    // 的比较句吞成假标签,"且 c" 整段冻结不译(渲染器把它当字面文本显示,
    // 是可见散文)。第三分支 \s+ 兜住「标签名后只有空白」的 <div >。
    // 属性尾用引号感知的交替而非裸 [^>]*:title="a>b" 的引号内 > 曾把标签
    // 截断在引号中间,残尾 b"> 被当散文送翻 —— 译模型不逐字回传时还原出
    // 损坏的属性(CommonMark 明文允许引号值内出现 >)。未闭合引号按规范
    // 不是标签,整段保持可译散文。
    modifiedLine = modifiedLine.replace(HTML_OPEN_TAG_RE, (match) => {
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
