"use client";

import React, { useState, useEffect } from "react";
import { Flex, Card, Button, Typography, Input, Upload, Form, Space, App, Tooltip, Spin, Row, Col, Divider, Switch, Collapse, theme } from "antd";
import {
  CopyOutlined,
  InboxOutlined,
  SettingOutlined,
  FileTextOutlined,
  ClearOutlined,
  FormatPainterOutlined,
  GlobalOutlined,
  ImportOutlined,
  InfoCircleOutlined,
  SaveOutlined,
  FileMarkdownOutlined,
  ControlOutlined,
} from "@ant-design/icons";
import { useTranslations } from "next-intl";
import { getLangDir } from "rtl-detect";
import { useCopyToClipboard } from "@/app/hooks/useCopyToClipboard";
import useFileUpload from "@/app/hooks/useFileUpload";
import { useLocalStorage } from "@/app/hooks/useLocalStorage";
import { useTextStats } from "@/app/hooks/useTextStats";
import { useExportFilename } from "@/app/hooks/useExportFilename";

import { splitTextIntoLines, downloadFile, splitBySpaces, getErrorMessage, getFileTypePresetConfig } from "@/app/utils";
import { filterMarkdownLines, PLACEHOLDER_SPLIT_REGEX, PLACEHOLDER_TEST_REGEX, PLACEHOLDER_REPLACE_REGEX, restorePlaceholders } from "./markdownUtils";
import { LLM_MODELS } from "@/app/lib/translation";
import { delay } from "@/app/hooks/translation";
import { useLanguageOptions } from "@/app/components/languages";
import LanguageSelector from "@/app/components/LanguageSelector";
import ApiStatusBlock from "@/app/components/ApiStatusBlock";
import ContextTranslationBlock from "@/app/components/ContextTranslationBlock";
import { useTranslationContext } from "@/app/components/TranslationContext";
import ResultCard from "@/app/components/ResultCard";
import TranslationProgressModal from "@/app/components/TranslationProgressModal";
import AdvancedTranslationSettings from "@/app/components/AdvancedTranslationSettings";
import TranslateFailurePanel from "@/app/components/TranslateFailurePanel";

import MultiLanguageSettingsModal from "@/app/components/MultiLanguageSettingsModal";
import SourceArea from "@/app/components/SourceArea";

const { TextArea } = Input;
const { Dragger } = Upload;
const { Text } = Typography;

const uploadFileTypes = getFileTypePresetConfig("markdownText");

interface MDTranslatorProps {
  onOpenApiSettings?: () => void;
}

const MDTranslator = ({ onOpenApiSettings }: MDTranslatorProps) => {
  const tMarkdown = useTranslations("MDTranslator");
  const t = useTranslations("common");

  const { sourceOptions } = useLanguageOptions();
  const { copyToClipboard } = useCopyToClipboard();
  const {
    isFileProcessing,
    fileList,
    multipleFiles,
    readFile,
    sourceText,
    setSourceText,
    uploadMode,
    singleFileMode,
    setSingleFileMode,
    handleFileUpload,
    handleUploadRemove,
    handleUploadChange,
    resetUpload,
  } = useFileUpload();
  const {
    exportSettings,
    importSettings,
    translationMethod,
    translateContent,
    handleTranslate,
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
    translateFailedCount,
    translateFailedLines,
    isTranslating,
    setIsTranslating,
    progressPercent,
    setProgressPercent,
    progressInfo,
    extractedText,
    setExtractedText,
    handleLanguageChange,
    handleSwapLanguages,
    validateTranslate,
    retryCount,
    setRetryCount,
    requestTimeoutSec,
    setRequestTimeoutSec,
  } = useTranslationContext();
  const { message } = App.useApp();
  const { token } = theme.useToken();
  const cardStyle: React.CSSProperties = { boxShadow: token.boxShadowTertiary };

  const sourceStats = useTextStats(sourceText);
  const resultStats = useTextStats(translatedText);

  const [taggedText, setTaggedText] = useState("");

  const [mdOptions, setMdOptions] = useLocalStorage("md-translator-options", {
    translateFrontmatter: false,
    translateMultilineCode: false,
    translateLatex: false,
    translateLinkText: true,
  });
  const [rawMode, setRawMode] = useLocalStorage("md-translator-rawMode", false);
  const [contextAware, setContextAware] = useLocalStorage("md-translator-contextAware", false);
  const [collapseKeys, setCollapseKeys] = useLocalStorage<string[]>("md-translator-collapseKeys", ["MDTranslator"]);
  const [multiLangModalOpen, setMultiLangModalOpen] = useState(false);
  const { customFileName, setCustomFileName, generateFileName } = useExportFilename("md-translator");

  useEffect(() => {
    setExtractedText("");
    setTranslatedText("");
  }, [sourceText, setExtractedText, setTranslatedText]);

  /**
   * 翻译函数：
   * 1. 对源文本进行分行和占位符替换；
   * 2. 对每一行根据预设的占位符规则进行分割，只调用翻译 API 翻译非占位符片段；
   * 3. 组装翻译后的行，并最终将占位符还原为原始内容。
   */
  const performTranslation = async (sourceText: string, fileNameSet?: string, fileIndex?: number, totalFiles?: number) => {
    // Determine target languages to translate to
    const targetLanguagesToUse = multiLanguageMode ? targetLanguages : [targetLanguage];
    // If no target languages selected in multi-language mode, show error
    if (multiLanguageMode && targetLanguagesToUse.length === 0) {
      message.error(t("noTargetLanguage"));
      return;
    }
    const lines = splitTextIntoLines(sourceText);

    const {
      contentLines,
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

    // For each target language, perform translation
    for (const currentTargetLang of targetLanguagesToUse) {
      let translatedTextWithPlaceholders = "";
      try {
        if (!rawMode) {
          // 对每一行进行处理，分割占位符与普通文本，仅翻译普通文本部分。不处理加粗文本格式，否则对语义伤害较大。
          // 第一步：收集所有待翻译片段及其位置信息
          const textsToTranslate: string[] = [];
          const lineSegments: { segments: string[]; mapping: ({ type: "placeholder" | "empty"; value: string } | { type: "text"; index: number; leading: string; trailing: string })[] }[] = [];

          for (const line of contentLines) {
            const segments = line.split(PLACEHOLDER_SPLIT_REGEX);
            const mapping: (typeof lineSegments)[number]["mapping"] = [];
            for (const segment of segments) {
              if (PLACEHOLDER_TEST_REGEX.test(segment)) {
                mapping.push({ type: "placeholder", value: segment });
              } else {
                const leadingSpace = segment.match(/^\s*/)?.[0] || "";
                const trailingSpace = segment.match(/\s*$/)?.[0] || "";
                const trimmedSegment = segment.trim();
                if (!trimmedSegment) {
                  mapping.push({ type: "empty", value: segment });
                } else {
                  mapping.push({ type: "text", index: textsToTranslate.length, leading: leadingSpace, trailing: trailingSpace });
                  textsToTranslate.push(trimmedSegment);
                }
              }
            }
            lineSegments.push({ segments, mapping });
          }

          // 第二步：一次性翻译所有片段（translateContent 内部已有 pLimit 并发控制）
          const translatedTexts = await translateContent(textsToTranslate, translationMethod, currentTargetLang, fileIndex, totalFiles);

          // 第三步：回填翻译结果
          const finalTranslatedLines = lineSegments.map(({ mapping }) =>
            mapping
              .map((entry) => {
                if (entry.type === "text") return entry.leading + translatedTexts[entry.index] + entry.trailing;
                return entry.value;
              })
              .join(""),
          );
          translatedTextWithPlaceholders = finalTranslatedLines.join("\n");

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
          const translatedLines = await translateContent(lines, translationMethod, currentTargetLang, fileIndex, totalFiles, contextAware ? "markdown" : undefined);
          translatedTextWithPlaceholders = translatedLines.join("\n");
        }

        // Remove specified characters from the final translated text (after all formatting is done)
        if (removeChars.trim()) {
          const charsToRemove = splitBySpaces(removeChars);
          charsToRemove.forEach((char) => {
            translatedTextWithPlaceholders = translatedTextWithPlaceholders.replaceAll(char, "");
          });
        }

        // Create language-specific file name for download
        const langLabel = currentTargetLang;
        const fileName = fileNameSet || multipleFiles[0]?.name || "markdown.md";
        const downloadFileName = generateFileName(fileName, langLabel);

        if (multiLanguageMode || multipleFiles.length > 1) {
          await downloadFile(translatedTextWithPlaceholders, downloadFileName);
        }

        if (!multiLanguageMode || (multiLanguageMode && currentTargetLang === targetLanguagesToUse[0])) {
          setTranslatedText(translatedTextWithPlaceholders);
        }

        if (multiLanguageMode && currentTargetLang !== targetLanguagesToUse[targetLanguagesToUse.length - 1]) {
          await delay(500);
        }
      } catch (error: unknown) {
        const messageText = [getErrorMessage(error), sourceOptions.find((o) => o.value === currentTargetLang)?.label || currentTargetLang, t("translationError")].join(" ");
        message.error(messageText, 60);
      }
    }
  };

  const handleMultipleTranslate = async () => {
    const isValid = await validateTranslate();
    if (!isValid) {
      return;
    }

    if (multipleFiles.length === 0) {
      message.error(t("noFileUploaded"));
      return;
    }

    setIsTranslating(true);
    setProgressPercent(0);

    try {
      for (let i = 0; i < multipleFiles.length; i++) {
        const currentFile = multipleFiles[i];
        await new Promise<void>((resolve) => {
          readFile(currentFile, async (text) => {
            await performTranslation(text, currentFile.name, i, multipleFiles.length);
            await delay(1500);
            resolve();
          });
        });
      }

      message.success(t("translationExported"), 10);
    } finally {
      setIsTranslating(false);
    }
  };

  const handleExportFile = () => {
    const uploadFileName = multipleFiles[0]?.name || "markdown.md";
    const fileName = generateFileName(uploadFileName, targetLanguage);
    downloadFile(translatedText, fileName);
    return fileName;
  };

  const handleExtractText = () => {
    if (!sourceText.trim()) {
      message.error(t("noSourceText"));
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
    <Spin spinning={isFileProcessing} description="Please wait..." size="large">
      <Row gutter={[24, 24]}>
        {/* Left Column: Upload and Main Actions */}
        <Col xs={24} lg={14} xl={15}>
          <Card
            title={
              <Space>
                <InboxOutlined /> {t("sourceArea")}
              </Space>
            }
            extra={
              <Tooltip title={t("resetUploadTooltip")}>
                <Button
                  type="text"
                  danger
                  disabled={isTranslating}
                  onClick={() => {
                    resetUpload();
                    setTranslatedText("");
                    message.success(t("resetUploadSuccess"));
                  }}
                  icon={<ClearOutlined />}
                  aria-label={t("clearAll")}>
                  {t("clearAll")}
                </Button>
              </Tooltip>
            }
            style={cardStyle}>
            <Dragger
              customRequest={({ file }) => handleFileUpload(file as File)}
              accept={uploadFileTypes.accept}
              multiple={!singleFileMode}
              showUploadList
              beforeUpload={singleFileMode ? resetUpload : undefined}
              onRemove={handleUploadRemove}
              onChange={handleUploadChange}
              fileList={fileList}>
              <p className="ant-upload-drag-icon">
                <InboxOutlined />
              </p>
              <p className="ant-upload-text">{t("dragAndDropText")}</p>
              <p className="ant-upload-hint">
                {t("supportedFormats")} {uploadFileTypes.fullLabel}
              </p>
            </Dragger>

            {uploadMode === "single" && (
              <SourceArea
                sourceText={sourceText}
                setSourceText={setSourceText}
                stats={sourceStats}
                placeholder={t("pasteUploadContent")}
                ariaLabel={t("sourceArea")}
                className="mt-1"
              />
            )}

            <Divider />

            <Flex gap="small" wrap className="mt-auto pt-4">
              <Button
                type="primary"
                size="large"
                icon={<GlobalOutlined spin={isTranslating} />}
                className="flex-1"
                onClick={() => (uploadMode === "single" ? handleTranslate(performTranslation, sourceText) : handleMultipleTranslate())}
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
          </Card>
        </Col>

        {/* Right Column: Settings and Configuration */}
        <Col xs={24} lg={10} xl={9}>
          <Card
            title={
              <Space>
                <SettingOutlined /> {t("configuration")}
              </Space>
            }
            style={cardStyle}
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
              />
            </Form>

            <ApiStatusBlock onOpenApiSettings={onOpenApiSettings} disabled={isTranslating} />

            {LLM_MODELS.includes(translationMethod) && (
              <>
                <ContextTranslationBlock
                  enabled={contextAware}
                  onEnabledChange={(checked) => {
                    setContextAware(checked);
                    if (checked) {
                      setRawMode(true);
                    }
                  }}
                  disabled={isTranslating}
                />
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
                      <section
                        style={{
                          padding: token.paddingSM,
                          background: "transparent",
                          border: `1px solid ${token.colorBorderSecondary}`,
                          borderRadius: token.borderRadiusLG,
                        }}>
                        <Text strong style={{ display: "block", marginBottom: token.marginXS, fontSize: token.fontSizeSM }}>
                          {tMarkdown("translateContentGroup")}
                        </Text>
                        <Flex vertical gap="small">
                          <Flex justify="space-between" align="center">
                            <Tooltip title={tMarkdown("tFrontmatterTooltip")}>
                              <span>{tMarkdown("tFrontmatter")}</span>
                            </Tooltip>
                            <Switch
                              size="small"
                              checked={mdOptions.translateFrontmatter}
                              onChange={(checked) => setMdOptions((prev) => ({ ...prev, translateFrontmatter: checked }))}
                              aria-label="Frontmatter"
                            />
                          </Flex>
                          <Flex justify="space-between" align="center">
                            <Tooltip title={tMarkdown("tCodeBlocksTooltip")}>
                              <span>{tMarkdown("tCodeBlocks")}</span>
                            </Tooltip>
                            <Switch
                              size="small"
                              checked={mdOptions.translateMultilineCode}
                              onChange={(checked) => setMdOptions((prev) => ({ ...prev, translateMultilineCode: checked }))}
                              aria-label={tMarkdown("tCodeBlocks")}
                            />
                          </Flex>
                          <Flex justify="space-between" align="center">
                            <Tooltip title={tMarkdown("tLatexTooltip")}>
                              <span>{tMarkdown("tLatex")}</span>
                            </Tooltip>
                            <Switch
                              size="small"
                              checked={mdOptions.translateLatex}
                              onChange={(checked) => setMdOptions((prev) => ({ ...prev, translateLatex: checked }))}
                              aria-label={tMarkdown("tLatex")}
                            />
                          </Flex>
                          <Flex justify="space-between" align="center">
                            <Tooltip title={tMarkdown("tLinkText")}>
                              <span>{tMarkdown("tLinkText")}</span>
                            </Tooltip>
                            <Switch
                              size="small"
                              checked={mdOptions.translateLinkText}
                              onChange={(checked) => setMdOptions((prev) => ({ ...prev, translateLinkText: checked }))}
                              aria-label={tMarkdown("tLinkText")}
                            />
                          </Flex>
                        </Flex>
                      </section>

                      <section
                        style={{
                          padding: token.paddingSM,
                          background: "transparent",
                          border: `1px solid ${token.colorBorderSecondary}`,
                          borderRadius: token.borderRadiusLG,
                        }}>
                        <Text strong style={{ display: "block", marginBottom: token.marginXS, fontSize: token.fontSizeSM }}>
                          {tMarkdown("formatModeGroup")}
                        </Text>
                        <Flex justify="space-between" align="center">
                          <Tooltip title={tMarkdown("rawTranslationModeTooltip")}>
                            <span>{tMarkdown("rawTranslationMode")}</span>
                          </Tooltip>
                          <Switch size="small" checked={rawMode} onChange={setRawMode} disabled={contextAware} aria-label={tMarkdown("rawTranslationMode")} />
                        </Flex>
                      </section>
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
        count={translateFailedCount}
        lines={translateFailedLines}
        disabled={isTranslating}
        onRetry={() => (uploadMode === "single" ? handleTranslate(performTranslation, sourceText) : handleMultipleTranslate())}
      />

      {/* Results Section */}
      {uploadMode === "single" && (translatedText || extractedText) && (
        <div className="mt-6">
          <Row gutter={[24, 24]}>
            {translatedText && !(multiLanguageMode && targetLanguages.length > 1) && (
              <Col xs={24} lg={extractedText ? 12 : 24}>
                <ResultCard
                  title={t("translationResult")}
                  content={resultStats.displayText}
                  charCount={resultStats.charCount}
                  lineCount={resultStats.lineCount}
                  onCopy={() => copyToClipboard(translatedText)}
                  onExport={() => {
                    const fileName = handleExportFile();
                    message.success(`${t("exportedFile")}: ${fileName}`);
                  }}
                  textDirection={getLangDir(targetLanguage)}
                />
              </Col>
            )}

            {extractedText && (
              <Col xs={24} lg={translatedText ? 12 : 24}>
                <Card
                  title={
                    <Space>
                      <FileTextOutlined /> {t("extractedText")}
                    </Space>
                  }
                  className="h-full"
                  style={{ boxShadow: token.boxShadowTertiary }}
                  extra={
                    <Space wrap>
                      <Button type="text" icon={<CopyOutlined />} onClick={() => copyToClipboard(extractedText)}>
                        {t("copy")}
                      </Button>
                      <Button type="text" icon={<CopyOutlined />} onClick={() => copyToClipboard(taggedText)}>
                        {tMarkdown("textWithPlaceholders")}
                      </Button>
                    </Space>
                  }>
                  <TextArea value={extractedText} rows={10} readOnly aria-label={t("extractedText")} />
                </Card>
              </Col>
            )}
          </Row>
        </div>
      )}

      <TranslationProgressModal
        open={isTranslating}
        percent={progressPercent}
        multiLanguageMode={multiLanguageMode}
        targetLanguageCount={targetLanguages.length}
        currentCount={progressInfo.current}
        totalCount={progressInfo.total}
      />

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
