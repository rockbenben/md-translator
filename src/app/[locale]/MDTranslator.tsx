"use client";

import React, { useState } from "react";
import { Flex, Card, Button, Typography, Form, Space, App, Tooltip, Spin, Row, Col, Divider, Switch, Collapse, theme } from "antd";
import { SettingOutlined, FormatPainterOutlined, GlobalOutlined, ImportOutlined, InfoCircleOutlined, SaveOutlined, FileMarkdownOutlined, ControlOutlined } from "@ant-design/icons";
import { useTranslations } from "next-intl";
import { getLangDir } from "rtl-detect";
import { useCopyToClipboard } from "@/app/hooks/useCopyToClipboard";
import useFileUpload from "@/app/hooks/useFileUpload";
import { useResetOnSourceChange } from "@/app/hooks/useResetOnSourceChange";
import { useLocalStorage } from "@/app/hooks/useLocalStorage";
import { useTextStats } from "@/app/hooks/useTextStats";
import { useExportFilename } from "@/app/hooks/useExportFilename";

import { splitTextIntoLines, downloadFile, getFileTypePresetConfig } from "@/app/utils";
import { MARKDOWN_DEFAULTS, filterMarkdownLines, PLACEHOLDER_REPLACE_REGEX, restorePlaceholders, splitMarkdownSegments, mergeMarkdownSegments, applyRemoveCharsToMarkdown, applyRemoveCharsToSegments } from "@/app/lib/translation/formats/markdown";
import { LLM_MODELS } from "@/app/lib/translation";
import { mapSkippingSoftFilled } from "@/app/lib/translation/softFill";
import { delay } from "@/app/lib/translation/retry";
import ToggleRow from "@/app/components/styled/ToggleRow";
import LanguageSelector from "@/app/components/LanguageSelector";
import ApiStatusBlock from "@/app/components/ApiStatusBlock";
import ContextTranslationBlock from "@/app/components/ContextTranslationBlock";
import { useTranslationContext } from "@/app/components/TranslationContext";
import ResultCard from "@/app/components/ResultCard";
import Section from "@/app/components/styled/Section";
import TranslationProgressStrip from "@/app/components/TranslationProgressStrip";
import AdvancedTranslationSettings from "@/app/components/AdvancedTranslationSettings";
import TranslateFailurePanel from "@/app/components/TranslateFailurePanel";

import MultiLanguageSettingsModal from "@/app/components/MultiLanguageSettingsModal";
import UploadSourceCard from "@/app/components/UploadSourceCard";
import { useFileExport } from "@/app/hooks/useFileExport";
import { useLockExportFolder } from "@/app/components/ExportFolder";

const { Text } = Typography;

const uploadFileTypes = getFileTypePresetConfig("markdownText");

const MDTranslator = () => {
  const tMarkdown = useTranslations("MDTranslator");
  const t = useTranslations("common");

  const { copyToClipboard } = useCopyToClipboard();
  const upload = useFileUpload("md-translator");
  const {
    isFileProcessing,
    multipleFiles,
    readFile,
    sourceText,
    uploadMode,
    singleFileMode,
    setSingleFileMode,
  } = upload;
  const {
    exportSettings,
    importSettings,
    translationMethod,
    translateBatch,
    runTranslation,
    sourceLanguage,
    targetLanguage,
    targetLanguages,
    setTargetLanguages,
    useCache,
    setUseCache,
    removeChars,
    setRemoveChars,
    multiLanguageMode,
    setMultiLanguageMode,
    translatedText,
    setTranslatedText,
    failedCount,
    failedLines,
    failedLangs,
    failedReason,
    clearFailures,
    runHadFailures,
    runRetry,
    isScopedRetry,
    getActiveTargetLangs,
    isTranslating,
    resetProgress,
    progressPercent,
    progressInfo,
    handleLanguageChange,
    handleSwapLanguages,
    requestCancel,
    isCancelRequested,
    retryCount,
    setRetryCount,
    requestTimeoutSec,
    setRequestTimeoutSec,
    runBatchTranslation,
    reportLangFailure,
    noteFileFailure,
  } = useTranslationContext();

  // 运行中锁住页面级「导出目录」入口:写入是每个文件现读句柄,跑到一半改目录
  // 会把同一批产物劈进两个文件夹。控件在 ToolPage 里,prop 传不上去,故用环境锁。
  useLockExportFolder(isTranslating);
  const { message } = App.useApp();
  const exportFile = useFileExport();
  const { token } = theme.useToken();

  const sourceStats = useTextStats(sourceText);
  const resultStats = useTextStats(translatedText);

  const [taggedText, setTaggedText] = useState("");

  // 默认值与 CLI 共用 MARKDOWN_DEFAULTS(formats/markdown)——改默认只动那一处。
  // options 展开成新对象:useLocalStorage 的初值会被 setMdOptions 路径引用,
  // 不能让共享常量对象有被间接改写的机会。
  const [mdOptions, setMdOptions] = useLocalStorage("md-translator-options", { ...MARKDOWN_DEFAULTS.options });
  const [rawMode, setRawMode] = useLocalStorage("md-translator-rawMode", false);
  const [contextAware, setContextAware] = useLocalStorage("md-translator-contextAware", MARKDOWN_DEFAULTS.contextAware);
  // 上下文感知只对 LLM 生效(MT 不走上下文路径),它要求的 raw 模式按【生效中】
  // 派生为覆盖层,不写穿用户自己的 rawMode 偏好 —— 事件式 setRawMode(true) 曾把
  // rawMode 永久写成 true:之后切到 MT 服务,上下文感知块随 LLM 条件隐藏,raw
  // 开关却仍被 contextAware 锁死在开启,Markdown 保护静默失效且 UI 无法解锁。
  const contextAwareActive = contextAware && LLM_MODELS.includes(translationMethod);
  const effectiveRawMode = rawMode || contextAwareActive;
  // key 必须与 Collapse items 的 "markdown"/"advanced" 一致(同字幕工具的修复)
  const [collapseKeys, setCollapseKeys] = useLocalStorage<string[]>("md-translator-collapseKeys", ["markdown"]);
  const [multiLangModalOpen, setMultiLangModalOpen] = useState(false);
  // 提取出的纯文本预览 — tool-local,不放在共享 TranslationContext 里。
  const [extractedText, setExtractedText] = useState("");
  // 记录 translatedText 对应的目标语种,handleExportFile 用它生成文件名;
  // 多语言模式下 translatedText 是 previewLang(常规跑 = targetLangs[0];scoped
  // 重试时保持上一次预览的语种)而非主 targetLanguage,不记录的话导出文件名会
  // 标错语种(主 targetLanguage 跟 translatedText 内容不匹配)
  const [translatedTextLang, setTranslatedTextLang] = useState<string | null>(null);
  const { customFileName, setCustomFileName, generateFileName } = useExportFilename("md-translator");

  // 源文本变化时只复位"源派生"的本地预览(extractedText)。译文结果及其元数据
  // (translatedText / translatedTextLang)则保留——和 JSON 翻译一致:改源后旧结果不清,
  // 直到重新翻译。这样既符合"保留旧结果",又不必在 render 阶段去 set 共享 context 的
  // translatedText(那会更新 TranslationProvider → setState-in-render 警告)。
  useResetOnSourceChange(sourceText, () => setExtractedText(""));

  // 作废上一轮翻译产物:Clear All 与换/删上传文件时调用,使译文结果、语种标记、
  // 失败面板回到"未翻译"初始态。extractedText 由上面的 prevSourceText 复位。
  const clearResults = () => {
    setTranslatedText("");
    setTranslatedTextLang(null);
    clearFailures();
  };

  /**
   * 翻译函数：
   * 1. 对源文本进行分行和占位符替换；
   * 2. 对每一行根据预设的占位符规则进行分割，只调用翻译 API 翻译非占位符片段；
   * 3. 组装翻译后的行，并最终将占位符还原为原始内容。
   */
  // removeChars 工具:跳过占位符 token,只清理可见译文段(实现在
  // formats/markdown,与 CLI 共用同一份 —— 见调用处注释)
  const applyRemoveChars = (text: string): string => applyRemoveCharsToMarkdown(text, removeChars);

  const performTranslation = async (sourceText: string, fileNameSet?: string, fileIndex?: number, totalFiles?: number) => {
    // On a failure-panel retry (runRetry) this is narrowed to the langs still
    // needing work — successful languages aren't re-walked/re-downloaded.
    const targetLangs = getActiveTargetLangs();
    if (multiLanguageMode && targetLangs.length === 0) {
      message.error(t("noTargetLanguage"));
      // noteFileFailure 已含 markRunHadFailures:不标记的话 runTranslation
      // 返回 true → 绿色"已处理"toast 跟错误 toast 同屏自相矛盾。
      noteFileFailure();
      return;
    }
    const fileName = fileNameSet || multipleFiles[0]?.name || "markdown.md";
    // 预览语言:常规跑 = 本轮第一个语言(旧行为);多语言 scoped 重试 = 保持
    // 当前预览的语言 —— 仅当它也在重试范围内时刷新,否则不动预览。不加这条,
    // 重试会把用户正在看的 targetLangs[0](现在是第一个【失败】语言)静默
    // 换掉。单语言模式恒取 targetLangs[0]:换过目标语言的重试也要把新结果
    // 显示出来(预览是单语言模式唯一的输出)。
    const previewLang = multiLanguageMode && isScopedRetry() && translatedTextLang ? (targetLangs.includes(translatedTextLang) ? translatedTextLang : null) : targetLangs[0];
    const lines = splitTextIntoLines(sourceText);

    const {
      contentLines,
      sourceLineNumbers,
      frontmatterPlaceholders,
      codePlaceholders,
      linkPlaceholders,
      headingPlaceholders,
      listPlaceholders,
      blockquotePlaceholders,
      latexBlockPlaceholders,
      latexInlinePlaceholders,
      htmlPlaceholders,
    } = filterMarkdownLines(lines, mdOptions);

    // 跟踪当前文件是否有任何 lang 翻译失败;末尾合并到 failedFilesRef
    let hasFailedLang = false;

    for (const currentTargetLang of targetLangs) {
      // 取消刹车:translateBatch 的入口守卫本来也会把后续语言逐个抛掉(级联标记
      // → 下面 catch 静默 continue),在这里刹住只是不做那 N 次空转。
      if (isCancelRequested()) break;
      let translatedTextWithPlaceholders = "";
      try {
        if (!effectiveRawMode) {
          // 对每一行进行处理，分割占位符与普通文本，仅翻译普通文本部分。不处理加粗文本格式，否则对语义伤害较大。
          // 第一步：收集所有待翻译片段及其位置信息(切分/回填在 lib/translation/formats/markdown，与 CLI 共用)
          const { textsToTranslate, textLineNumbers, lineSegments } = splitMarkdownSegments(contentLines, sourceLineNumbers);

          // 第二步：一次性翻译所有片段（translateBatch 内部已有 pLimit 并发控制）
          const softFilled = new Set<number>();
          const translatedTexts = await translateBatch(textsToTranslate, translationMethod, currentTargetLang, fileIndex, totalFiles, undefined, { lineNumbers: textLineNumbers, fileName, collectSoftFilled: softFilled });

          // 第三步：逐片段清理 removeChars(软填片段原样保留),再回填
          // removeChars 必须在占位符还原【之前】应用,且跳过占位符 token 本身
          // —— 还原后应用会损坏受保护的代码块/链接/LaTeX;字符命中 <<<…>>>
          // 会毁掉占位符导致泄漏。合并【之前】做:合并后的字符串里定位不到软填
          // 片段的边界,只能整行豁免,同行成功译出的片段会跟着留下 removeChars
          // 字符(共用助手,CLI markdown handler 走同一份)。
          const cleanedTexts = applyRemoveCharsToSegments(translatedTexts, softFilled, removeChars);
          translatedTextWithPlaceholders = mergeMarkdownSegments(lineSegments, cleanedTexts).join("\n");

          // 单次正则扫描 + Map 查表还原所有占位符 (O(text.length))。
          // 因为占位符自带 <<<...>>> 分隔符,literal 比较不会发生 prefix 重叠,
          // 不再需要 sort by 长度;函数 callback 形式的 replace 不解析 $$,
          // LATEX 也不需要 $$ 转义。
          translatedTextWithPlaceholders = restorePlaceholders(translatedTextWithPlaceholders, {
            frontmatterPlaceholders,
            codePlaceholders,
            latexBlockPlaceholders,
            linkPlaceholders,
            headingPlaceholders,
            listPlaceholders,
            blockquotePlaceholders,
            latexInlinePlaceholders,
            htmlPlaceholders,
          });
        } else {
          // Raw text mode: translate all lines
          // If context mode is enabled, use context-aware translation with markdown type
          // (lines 就是完整物理行数组,行号走 i+1 默认值,只需带上文件名)
          const rawSoftFilled = new Set<number>();
          const translatedLines = await translateBatch(lines, translationMethod, currentTargetLang, fileIndex, totalFiles, contextAware ? "markdown" : undefined, { fileName, collectSoftFilled: rawSoftFilled });
          // raw 模式下 1:1 对应,软填行逐行跳过。
          translatedTextWithPlaceholders = mapSkippingSoftFilled(translatedLines, rawSoftFilled, applyRemoveChars).join("\n");
        }

        // Create language-specific file name for download
        const langLabel = currentTargetLang;
        const downloadFileName = generateFileName(fileName, langLabel, undefined, multiLanguageMode);

        if (multiLanguageMode || multipleFiles.length > 1) {
          await downloadFile(translatedTextWithPlaceholders, downloadFileName);
        }

        if (currentTargetLang === previewLang) {
          setTranslatedText(translatedTextWithPlaceholders);
          setTranslatedTextLang(currentTargetLang);
        }

        if (multiLanguageMode && currentTargetLang !== targetLangs[targetLangs.length - 1]) {
          await delay(500);
        }
      } catch (error: unknown) {
        if (reportLangFailure(error, currentTargetLang)) hasFailedLang = true;
      }
    }

    if (hasFailedLang) noteFileFailure();
  };

  // Single-file translation just shows the result (no per-file export toast), so confirm
  // completion here — only when the run fully succeeded (runTranslation returns false if
  // any line/lang failed, so we don't contradict the failure panel/error toast).
  const handleSingleTranslate = async () => {
    const ok = await runTranslation(performTranslation, sourceText);
    if (ok) message.success(t("textProcessed"));
  };

  const handleExportFile = () => {
    const uploadFileName = multipleFiles[0]?.name || "markdown.md";
    // ResultCard 只在 translatedText 非空时渲染,而 translatedText 写入必伴随 lang 同帧 setState,
    // 所以 handleExportFile 触发时 translatedTextLang 必非 null —— ?? 仅作类型收窄兜底
    const langLabel = translatedTextLang ?? targetLanguage;
    const fileName = generateFileName(uploadFileName, langLabel, undefined, multiLanguageMode);
    void exportFile(translatedText, fileName);
  };

  const handleExtractText = () => {
    if (!sourceText.trim()) {
      message.warning(t("noSourceText"));
      return;
    }
    const lines = splitTextIntoLines(sourceText);
    const { contentLines } = filterMarkdownLines(lines, mdOptions);
    let extractedText = contentLines.join("\n");
    setTaggedText(extractedText);
    extractedText = extractedText.replace(PLACEHOLDER_REPLACE_REGEX, "");
    // 移除 Markdown 加粗符号，保留加粗文本内容
    extractedText = extractedText.replace(/\*\*(.*?)\*\*/g, "$1");
    setExtractedText(extractedText);
    copyToClipboard(extractedText, t("textExtracted"));
  };

  return (
    <Spin spinning={isFileProcessing} description={t("pleaseWait")} size="large">
      <Row gutter={[24, 24]}>
        {/* Left Column: Upload and Main Actions */}
        <Col xs={24} lg={14} xl={15}>
          <UploadSourceCard upload={upload} stats={sourceStats} fileTypes={uploadFileTypes} formatsHint={uploadFileTypes.fullLabel} multiFile textDirection="auto" locked={isTranslating} onClear={clearResults} onSourceChange={clearResults}>

            <Divider />

            <Flex gap="small" wrap className="mt-auto pt-4">
              <Button
                type="primary"
                size="large"
                icon={<GlobalOutlined spin={isTranslating} />}
                className="flex-1"
                onClick={() => (uploadMode === "single" ? handleSingleTranslate() : runBatchTranslation(performTranslation, multipleFiles, readFile, t("noFileUploaded")))}
                disabled={isTranslating}
                loading={isTranslating}>
                {multiLanguageMode ? `${t("translate")} | ${t("totalLanguages")}${targetLanguages.length || 0}` : t("translate")}
              </Button>

              {uploadMode === "single" && sourceText && (
                <Button size="large" onClick={handleExtractText} icon={<FormatPainterOutlined />}>
                  {t("extractText")}
                </Button>
              )}
            </Flex>

            <TranslationProgressStrip
              isTranslating={isTranslating}
              percent={progressPercent}
              onCancel={requestCancel}
              resumable={useCache}
              onDismiss={resetProgress}
              multiLanguageMode={multiLanguageMode}
              targetLanguageCount={targetLanguages.length}
              failed={failedCount > 0 || failedLangs.length > 0 || runHadFailures}
              lineFailures={failedCount > 0}
              currentCount={progressInfo.current}
              totalCount={progressInfo.total}
            />
          </UploadSourceCard>
        </Col>

        {/* Right Column: Settings and Configuration */}
        <Col xs={24} lg={10} xl={9}>
          <Card
            title={<Space><SettingOutlined /> {t("configuration")}</Space>}
            extra={
              <Space>
                <Tooltip title={t("exportSettingTooltip")}>
                  <Button
                    type="text"
                    icon={<SaveOutlined />}
                    size="small"
                    disabled={isTranslating}
                    onClick={async () => {
                      await exportSettings();
                    }}
                    aria-label={t("exportSettingTooltip")}
                  />
                </Tooltip>
                <Tooltip title={t("importSettingTooltip")}>
                  <Button
                    type="text"
                    icon={<ImportOutlined />}
                    size="small"
                    disabled={isTranslating}
                    onClick={async () => {
                      await importSettings();
                    }}
                    aria-label={t("importSettingTooltip")}
                  />
                </Tooltip>
                <Tooltip title={t("batchEditMultiLangTooltip")}>
                  <Button type="text" icon={<GlobalOutlined />} size="small" disabled={isTranslating} onClick={() => setMultiLangModalOpen(true)} aria-label={t("batchEditMultiLangTooltip")} />
                </Tooltip>
              </Space>
            }>
            <Form layout="vertical" className="w-full !mb-3">
              <LanguageSelector
                sourceLanguage={sourceLanguage}
                targetLanguage={targetLanguage}
                targetLanguages={targetLanguages}
                multiLanguageMode={multiLanguageMode}
                handleLanguageChange={handleLanguageChange}
                handleSwapLanguages={handleSwapLanguages}
                setTargetLanguages={setTargetLanguages}
                setMultiLanguageMode={setMultiLanguageMode}
                disabled={isTranslating}
              />
            </Form>

            <ApiStatusBlock disabled={isTranslating} />

            {LLM_MODELS.includes(translationMethod) && (
              <>
                <ContextTranslationBlock enabled={contextAware} onEnabledChange={setContextAware} disabled={isTranslating} />
                <Typography.Text type="secondary" style={{ display: "block", fontSize: 12, marginTop: -8, marginBottom: 12, paddingLeft: 4 }}>
                  <InfoCircleOutlined style={{ marginRight: 4 }} />
                  {tMarkdown("contextAwareRawNote")}
                </Typography.Text>
              </>
            )}

            <Collapse
              ghost
              size="small"
              activeKey={collapseKeys}
              onChange={(keys) => setCollapseKeys(typeof keys === "string" ? [keys] : keys)}
              items={[
                {
                  key: "markdown",
                  label: (
                    <Space>
                      <FileMarkdownOutlined />
                      <Text strong>{tMarkdown("translationOptions")}</Text>
                    </Space>
                  ),
                  children: (
                    <Flex vertical gap="middle">
                      <Section noGap>
                        <Text strong style={{ display: "block", marginBottom: token.marginXS, fontSize: token.fontSizeSM }}>
                          {tMarkdown("translateContentGroup")}
                        </Text>
                        <Flex vertical gap="small">
                          <ToggleRow label={tMarkdown("tFrontmatter")} tooltip={tMarkdown("tFrontmatterTooltip")}>
                            <Switch
                              disabled={isTranslating}
                              size="small"
                              checked={mdOptions.translateFrontmatter}
                              onChange={(checked) => setMdOptions((prev) => ({ ...prev, translateFrontmatter: checked }))}
                              aria-label="Frontmatter"
                            />
                          </ToggleRow>
                          <ToggleRow label={tMarkdown("tCodeBlocks")} tooltip={tMarkdown("tCodeBlocksTooltip")}>
                            <Switch
                              disabled={isTranslating}
                              size="small"
                              checked={mdOptions.translateMultilineCode}
                              onChange={(checked) => setMdOptions((prev) => ({ ...prev, translateMultilineCode: checked }))}
                              aria-label={tMarkdown("tCodeBlocks")}
                            />
                          </ToggleRow>
                          <ToggleRow label={tMarkdown("tLatex")} tooltip={tMarkdown("tLatexTooltip")}>
                            <Switch
                              disabled={isTranslating}
                              size="small"
                              checked={mdOptions.translateLatex}
                              onChange={(checked) => setMdOptions((prev) => ({ ...prev, translateLatex: checked }))}
                              aria-label={tMarkdown("tLatex")}
                            />
                          </ToggleRow>
                          <ToggleRow label={tMarkdown("tLinkText")} tooltip={tMarkdown("tLinkText")}>
                            <Switch
                              disabled={isTranslating}
                              size="small"
                              checked={mdOptions.translateLinkText}
                              onChange={(checked) => setMdOptions((prev) => ({ ...prev, translateLinkText: checked }))}
                              aria-label={tMarkdown("tLinkText")}
                            />
                          </ToggleRow>
                        </Flex>
                      </Section>

                      <Section noGap>
                        <Text strong style={{ display: "block", marginBottom: token.marginXS, fontSize: token.fontSizeSM }}>
                          {tMarkdown("formatModeGroup")}
                        </Text>
                        <ToggleRow label={tMarkdown("rawTranslationMode")} tooltip={tMarkdown("rawTranslationModeTooltip")}>
                          <Switch size="small" checked={effectiveRawMode} onChange={setRawMode} disabled={contextAwareActive || isTranslating} aria-label={tMarkdown("rawTranslationMode")} />
                        </ToggleRow>
                      </Section>
                    </Flex>
                  ),
                },
                {
                  key: "advanced",
                  label: (
                    <Space>
                      <ControlOutlined />
                      <Text strong>{t("advancedSettings")}</Text>
                    </Space>
                  ),
                  children: (
                    <AdvancedTranslationSettings
                      disabled={isTranslating}
                      customFileName={customFileName}
                      setCustomFileName={setCustomFileName}
                      removeChars={removeChars}
                      setRemoveChars={setRemoveChars}
                      retryCount={retryCount}
                      setRetryCount={setRetryCount}
                      requestTimeoutSec={requestTimeoutSec}
                      setRequestTimeoutSec={setRequestTimeoutSec}
                      useCache={useCache}
                      setUseCache={setUseCache}
                      singleFileMode={singleFileMode}
                      setSingleFileMode={setSingleFileMode}
                    />
                  ),
                },
              ]}
            />
          </Card>
        </Col>
      </Row>

      {/* Partial-failure panel: auto-retried once, still-failed lines kept originals */}
      <TranslateFailurePanel
        count={failedCount}
        lines={failedLines}
        failedLangs={failedLangs}
        reason={failedReason}
        disabled={isTranslating}
        onRetry={() => runRetry(() => (uploadMode === "single" ? handleSingleTranslate() : runBatchTranslation(performTranslation, multipleFiles, readFile, t("noFileUploaded"))))}
      />

      {/* Results Section */}
      {uploadMode === "single" && (translatedText || extractedText) && (
        <div className="mt-6">
          <Row gutter={[24, 24]}>
            {translatedText && !(multiLanguageMode && targetLanguages.length > 1) && (
              <Col xs={24} lg={extractedText ? 12 : 24}>
                <ResultCard
                  title={t("translationResult")}
                  content={translatedText}
                  stats={resultStats}
                  onCopy={() => copyToClipboard(translatedText)}
                  onExport={handleExportFile}
                  textDirection={getLangDir(translatedTextLang ?? targetLanguage)}
                />
              </Col>
            )}

            {extractedText && (
              <Col xs={24} lg={translatedText ? 12 : 24}>
                <ResultCard title={t("extractedText")} content={extractedText} textDirection="auto" showStats={false} onCopy={() => copyToClipboard(extractedText)} onCopyNode={() => copyToClipboard(taggedText)} copyNodeLabel={tMarkdown("textWithPlaceholders")} />
              </Col>
            )}
          </Row>
        </div>
      )}

      <MultiLanguageSettingsModal
        open={multiLangModalOpen}
        onClose={() => setMultiLangModalOpen(false)}
        targetLanguages={targetLanguages}
        setTargetLanguages={setTargetLanguages}
        setMultiLanguageMode={setMultiLanguageMode}
      />
    </Spin>
  );
};

export default MDTranslator;
