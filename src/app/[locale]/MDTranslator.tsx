"use client";

import React, { useState, useEffect } from "react";
import { Flex, Card, Button, Typography, Input, InputNumber, Upload, Form, Space, App, Tooltip, Spin, Row, Col, Divider, Switch, Collapse } from "antd";
import {
  CopyOutlined,
  InboxOutlined,
  SettingOutlined,
  FileTextOutlined,
  ClearOutlined,
  FormatPainterOutlined,
  GlobalOutlined,
  ImportOutlined,
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

import { splitTextIntoLines, downloadFile, splitBySpaces, getErrorMessage } from "@/app/utils";
import { placeholderPattern, filterMarkdownLines } from "./markdownUtils";
import { LLM_MODELS } from "@/app/lib/translation";
import { useLanguageOptions } from "@/app/components/languages";
import LanguageSelector from "@/app/components/LanguageSelector";
import TranslationAPISelector from "@/app/components/TranslationAPISelector";
import { useTranslationContext } from "@/app/components/TranslationContext";
import ResultCard from "@/app/components/ResultCard";
import TranslationProgressModal from "@/app/components/TranslationProgressModal";

import MultiLanguageSettingsModal from "@/app/components/MultiLanguageSettingsModal";

const { TextArea } = Input;
const { Dragger } = Upload;
const { Paragraph, Text } = Typography;

const MDTranslator = () => {
  const tMarkdown = useTranslations("markdown");
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
    setTranslationMethod,
    translateContent,
    handleTranslate,
    getCurrentConfig,
    handleConfigChange,
    sourceLanguage,
    targetLanguage,
    target_langs,
    setTarget_langs,
    useCache,
    setUseCache,
    removeChars,
    setRemoveChars,
    multiLanguageMode,
    setMultiLanguageMode,
    translatedText,
    setTranslatedText,
    translateInProgress,
    setTranslateInProgress,
    progressPercent,
    setProgressPercent,
    extractedText,
    setExtractedText,
    handleLanguageChange,
    delay,
    validateTranslate,
    retryCount,
    setRetryCount,
    retryTimeout,
    setRetryTimeout,
  } = useTranslationContext();
  const { message } = App.useApp();

  const sourceStats = useTextStats(sourceText);
  const resultStats = useTextStats(translatedText);

  const [taggedText, setTaggedText] = useState("");

  const [mdOption, setMdOption] = useLocalStorage("mdTranslatorOptions", {
    translateFrontmatter: false,
    translateMultilineCode: false,
    translateLatex: false,
    translateLinkText: true,
  });
  const [rawTranslationMode, setRawTranslationMode] = useLocalStorage("mdTranslatorRawMode", false);
  const [contextTranslation, setContextTranslation] = useLocalStorage("mdTranslatorContextMode", false);
  const [activeCollapseKeys, setActiveCollapseKeys] = useLocalStorage<string[]>("mdTranslatorCollapseKeys", ["markdown"]);
  const [multiLangModalOpen, setMultiLangModalOpen] = useState(false);

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
    const targetLanguagesToUse = multiLanguageMode ? target_langs : [targetLanguage];
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
      strongPlaceholders,
      latexBlockPlaceholders,
      latexInlinePlaceholders,
    } = filterMarkdownLines(lines, mdOption);

    // 占位符正则，匹配形如 <<<TYPE_x>>> 的占位符
    const placeholderRegex = new RegExp(`^<<<(${placeholderPattern})>>>$`);
    const splitRegex = new RegExp(`(<<<(?:${placeholderPattern})>>>)`);

    // For each target language, perform translation
    for (const currentTargetLang of targetLanguagesToUse) {
      let translatedTextWithPlaceholders = "";
      try {
        if (!rawTranslationMode) {
          // 对每一行进行处理，分割占位符与普通文本，仅翻译普通文本部分。不处理加粗文本格式，否则对语义伤害较大。
          const translateLine = async (line: string): Promise<string> => {
            const segments = line.split(splitRegex);
            const translatedSegments = await Promise.all(
              segments.map(async (segment) => {
                if (placeholderRegex.test(segment)) {
                  // 占位符保持原样
                  return segment;
                } else {
                  // 仅翻译普通文本部分
                  const leadingSpace = segment.match(/^\s*/)?.[0] || "";
                  const trailingSpace = segment.match(/\s*$/)?.[0] || "";
                  const trimmedSegment = segment.trim();

                  if (!trimmedSegment) {
                    return segment;
                  }

                  const [translated] = await translateContent([trimmedSegment], translationMethod, currentTargetLang, fileIndex, totalFiles);
                  return leadingSpace + translated + trailingSpace;
                }
              })
            );
            return translatedSegments.join("");
          };

          const finalTranslatedLines = await Promise.all(contentLines.map((line) => translateLine(line)));
          translatedTextWithPlaceholders = finalTranslatedLines.join("\n");

          // 合并所有占位符映射
          const allPlaceholders = new Map([
            ...Object.entries(frontmatterPlaceholders),
            ...Object.entries(codePlaceholders),
            ...Object.entries(latexBlockPlaceholders),
            ...Object.entries(linkPlaceholders),
            ...Object.entries(headingPlaceholders),
            ...Object.entries(listPlaceholders),
            ...Object.entries(blockquotePlaceholders),
            ...Object.entries(latexInlinePlaceholders),
            ...Object.entries(strongPlaceholders),
          ]);

          // 按占位符长度降序排序，防止部分匹配替换
          const sortedPlaceholders = Array.from(allPlaceholders.entries()).sort((a, b) => b[0].length - a[0].length);

          for (const [placeholder, content] of sortedPlaceholders) {
            const escapedPlaceholder = placeholder.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
            let replacementContent = content;
            if (placeholder.includes("LATEX_")) {
              // Replace $ with $$ (in regex replacement context, $ needs special handling)
              replacementContent = content.replace(/\$/g, "$$$$");
            }
            translatedTextWithPlaceholders = translatedTextWithPlaceholders.replace(new RegExp(escapedPlaceholder, "g"), replacementContent);
          }
        } else {
          // Raw text mode: translate all lines
          // If context mode is enabled, use context-aware translation with markdown type
          const translatedLines = await translateContent(lines, translationMethod, currentTargetLang, fileIndex, totalFiles, contextTranslation ? "markdown" : undefined);
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
        let downloadFileName;
        const fileName = fileNameSet || multipleFiles[0]?.name;

        if (fileName) {
          // For batch mode with a filename provided
          const lastDotIndex = fileName.lastIndexOf(".");
          if (lastDotIndex !== -1) {
            const fileExtension = fileName.slice(lastDotIndex + 1).toLowerCase();
            const fileNameWithoutExt = fileName.slice(0, lastDotIndex);
            downloadFileName = `${fileNameWithoutExt}_${langLabel}.${fileExtension}`;
          } else {
            downloadFileName = `${fileName}_${langLabel}.md`;
          }
        } else {
          // For single file mode without a filename
          const fileExtension = ".md";
          downloadFileName = `markdown_${langLabel}${fileExtension}`;
        }

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
        message.error(messageText, 5);
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

    setTranslateInProgress(true);
    setProgressPercent(0);

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

    setTranslateInProgress(false);
    message.success(t("translationExported"), 10);
  };

  const handleExportFile = () => {
    const uploadFileName = multipleFiles[0]?.name;
    const fileName = uploadFileName || "mdtranslated.md";
    downloadFile(translatedText, fileName);
    return fileName;
  };

  const handleExtractText = () => {
    if (!sourceText.trim()) {
      message.error(t("noSourceText"));
      return;
    }
    const lines = splitTextIntoLines(sourceText);
    const { contentLines } = filterMarkdownLines(lines, mdOption);
    let extractedText = contentLines.join("\n");
    setTaggedText(extractedText);
    // 使用正则表达式匹配所有格式为 <<<...>>> 的占位符，并替换为空字符串
    const replaceRegex = new RegExp(`<<<(?:${placeholderPattern})>>>`, "g");
    extractedText = extractedText.replace(replaceRegex, "");
    // 移除 Markdown 加粗符号，保留加粗文本内容
    extractedText = extractedText.replace(/\*\*(.*?)\*\*/g, "$1");
    setExtractedText(extractedText);
    copyToClipboard(extractedText, t("textExtracted"));
  };

  const config = getCurrentConfig();

  return (
    <Spin spinning={isFileProcessing} size="large">
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
                  disabled={translateInProgress}
                  onClick={() => {
                    resetUpload();
                    setTranslatedText("");
                    message.success(t("resetUploadSuccess"));
                  }}
                  icon={<ClearOutlined />}
                  aria-label={t("resetUpload")}>
                  {t("resetUpload")}
                </Button>
              </Tooltip>
            }
            className="h-full shadow-sm">
            <Dragger
              customRequest={({ file }) => handleFileUpload(file as File)}
              accept=".txt,.md,.markdown"
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
              <p className="ant-upload-hint">{t("supportedFormats")} .txt, .md, .markdown</p>
            </Dragger>

            {uploadMode === "single" && (
              <>
                <TextArea
                  placeholder={t("pasteUploadContent")}
                  value={sourceStats.isEditable ? sourceText : sourceStats.displayText}
                  onChange={sourceStats.isEditable ? (e) => setSourceText(e.target.value) : undefined}
                  rows={8}
                  className="mt-1"
                  allowClear
                  readOnly={!sourceStats.isEditable}
                  aria-label={t("sourceArea")}
                />
                {sourceText && (
                  <Flex justify="end">
                    <Paragraph type="secondary">
                      {t("inputStatsTitle")}: {sourceStats.charCount} {t("charLabel")}, {sourceStats.lineCount} {t("lineLabel")}
                    </Paragraph>
                  </Flex>
                )}
              </>
            )}

            <Divider />

            <Flex gap="small" wrap className="mt-auto pt-4">
              <Button
                type="primary"
                size="large"
                icon={<GlobalOutlined spin={translateInProgress} />}
                className="flex-1 shadow-md"
                onClick={() => (uploadMode === "single" ? handleTranslate(performTranslation, sourceText) : handleMultipleTranslate())}
                disabled={translateInProgress}
                loading={translateInProgress}>
                {multiLanguageMode ? `${t("translate")} | ${t("totalLanguages")}${target_langs.length || 0}` : t("translate")}
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
            className="shadow-sm"
            extra={
              <Space>
                <Tooltip title={t("exportSettingTooltip")}>
                  <Button
                    type="text"
                    icon={<SaveOutlined />}
                    size="small"
                    disabled={translateInProgress}
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
                    disabled={translateInProgress}
                    onClick={async () => {
                      await importSettings();
                    }}
                    aria-label={t("importSettingTooltip")}
                  />
                </Tooltip>
                <Tooltip title={t("batchEditMultiLangTooltip")}>
                  <Button type="text" icon={<GlobalOutlined />} size="small" disabled={translateInProgress} onClick={() => setMultiLangModalOpen(true)} aria-label={t("batchEditMultiLangTooltip")} />
                </Tooltip>
              </Space>
            }>
            <Form layout="vertical" className="w-full">
              {/* Language Selection - Always Visible */}
              <LanguageSelector
                sourceLanguage={sourceLanguage}
                targetLanguage={targetLanguage}
                target_langs={target_langs}
                multiLanguageMode={multiLanguageMode}
                handleLanguageChange={handleLanguageChange}
                setTarget_langs={setTarget_langs}
                setMultiLanguageMode={setMultiLanguageMode}
              />

              {/* API Settings - Always Visible */}
              <TranslationAPISelector translationMethod={translationMethod} setTranslationMethod={setTranslationMethod} config={config} handleConfigChange={handleConfigChange} />
            </Form>

            <Divider style={{ margin: "12px 0" }} />

            <Collapse
              ghost
              activeKey={activeCollapseKeys}
              onChange={(keys) => setActiveCollapseKeys(typeof keys === "string" ? [keys] : keys)}
              expandIconPlacement="end"
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
                    <Flex vertical gap="small">
                      <Flex justify="space-between" align="center">
                        <Tooltip title={tMarkdown("tFrontmatterTooltip")}>
                          <span>Frontmatter</span>
                        </Tooltip>
                        <Switch
                          size="small"
                          checked={mdOption.translateFrontmatter}
                          onChange={(checked) =>
                            setMdOption((prev) => ({
                              ...prev,
                              translateFrontmatter: checked,
                            }))
                          }
                          aria-label="Frontmatter"
                        />
                      </Flex>
                      <Flex justify="space-between" align="center">
                        <Tooltip title={tMarkdown("tCodeBlocksTooltip")}>
                          <span>{tMarkdown("tCodeBlocks")}</span>
                        </Tooltip>
                        <Switch
                          size="small"
                          checked={mdOption.translateMultilineCode}
                          onChange={(checked) =>
                            setMdOption((prev) => ({
                              ...prev,
                              translateMultilineCode: checked,
                            }))
                          }
                          aria-label={tMarkdown("tCodeBlocks")}
                        />
                      </Flex>
                      <Flex justify="space-between" align="center">
                        <Tooltip title={tMarkdown("tLatexTooltip")}>
                          <span>{tMarkdown("tLatex")}</span>
                        </Tooltip>
                        <Switch
                          size="small"
                          checked={mdOption.translateLatex}
                          onChange={(checked) =>
                            setMdOption((prev) => ({
                              ...prev,
                              translateLatex: checked,
                            }))
                          }
                          aria-label={tMarkdown("tLatex")}
                        />
                      </Flex>
                      <Flex justify="space-between" align="center">
                        <Tooltip title={tMarkdown("tLinkText")}>
                          <span>{tMarkdown("tLinkText")}</span>
                        </Tooltip>
                        <Switch
                          size="small"
                          checked={mdOption.translateLinkText}
                          onChange={(checked) =>
                            setMdOption((prev) => ({
                              ...prev,
                              translateLinkText: checked,
                            }))
                          }
                          aria-label={tMarkdown("tLinkText")}
                        />
                      </Flex>
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
                    <Flex vertical gap="small">
                      {/* Mode Settings */}
                      <div style={{ marginBottom: 8 }}>
                        <Flex vertical gap="small">
                          <Flex justify="space-between" align="center">
                            <Tooltip title={tMarkdown("rawTranslationModeTooltip")}>
                              <span>{tMarkdown("rawTranslationMode")}</span>
                            </Tooltip>
                            <Switch size="small" checked={rawTranslationMode} onChange={setRawTranslationMode} aria-label={tMarkdown("rawTranslationMode")} />
                          </Flex>

                          {LLM_MODELS.includes(translationMethod) && (
                            <Flex justify="space-between" align="center">
                              <Tooltip title={t("contextAwareTranslationTooltip")}>
                                <span>{t("contextAwareTranslation")}</span>
                              </Tooltip>
                              <Switch
                                size="small"
                                checked={contextTranslation}
                                onChange={(checked) => {
                                  setContextTranslation(checked);
                                  if (checked) {
                                    setRawTranslationMode(true);
                                  }
                                }}
                                aria-label={t("contextAwareTranslation")}
                              />
                            </Flex>
                          )}
                        </Flex>
                      </div>

                      <Divider style={{ margin: "4px 0" }} />

                      {/* System Settings */}
                      <div style={{ marginBottom: 8 }}>
                        <Flex vertical gap="small">
                          <Flex justify="space-between" align="center">
                            <Tooltip title={t("singleFileModeTooltip")}>
                              <span>{t("singleFileMode")}</span>
                            </Tooltip>
                            <Switch size="small" checked={singleFileMode} onChange={setSingleFileMode} aria-label={t("singleFileMode")} />
                          </Flex>
                          <Flex justify="space-between" align="center">
                            <Tooltip title={t("useCacheTooltip")}>
                              <span>{t("useCache")}</span>
                            </Tooltip>
                            <Switch size="small" checked={useCache} onChange={setUseCache} aria-label={t("useCache")} />
                          </Flex>
                        </Flex>
                      </div>

                      <Divider style={{ margin: "4px 0" }} />

                      {/* Post Processing */}
                      <div>
                        <Flex vertical gap={8}>
                          <Flex vertical gap={4}>
                            <span style={{ fontSize: "13px" }}>{t("removeCharsAfterTranslation")}</span>
                            <Input
                              placeholder={`${t("example")}: ♪ <i> </i>`}
                              value={removeChars}
                              onChange={(e) => setRemoveChars(e.target.value)}
                              allowClear
                              aria-label={t("removeCharsAfterTranslation")}
                            />
                          </Flex>

                          <Row gutter={[12, 12]}>
                            <Col span={12}>
                              <Tooltip title={t("retryCountTooltip")}>
                                <Flex vertical gap={4}>
                                  <span style={{ fontSize: "13px" }}>{t("retryCount")}</span>
                                  <InputNumber min={1} max={10} value={retryCount} onChange={(value) => setRetryCount(value ?? 3)} style={{ width: "100%" }} aria-label={t("retryCount")} />
                                </Flex>
                              </Tooltip>
                            </Col>
                            <Col span={12}>
                              <Tooltip title={t("retryTimeoutTooltip")}>
                                <Flex vertical gap={4}>
                                  <span style={{ fontSize: "13px" }}>{t("retryTimeout")}</span>
                                  <InputNumber
                                    min={5}
                                    max={1200}
                                    value={retryTimeout}
                                    onChange={(value) => setRetryTimeout(value ?? 30)}
                                    addonAfter="s"
                                    style={{ width: "100%" }}
                                    aria-label={t("retryTimeout")}
                                  />
                                </Flex>
                              </Tooltip>
                            </Col>
                          </Row>
                        </Flex>
                      </div>
                    </Flex>
                  ),
                },
              ]}
            />
          </Card>
        </Col>
      </Row>

      {/* Results Section */}
      {uploadMode === "single" && (translatedText || extractedText) && (
        <div className="mt-6">
          <Row gutter={[24, 24]}>
            {translatedText && !(multiLanguageMode && target_langs.length > 1) && (
              <Col xs={24} lg={extractedText ? 12 : 24}>
                <ResultCard
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
                  className="shadow-sm h-full"
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

      <TranslationProgressModal open={translateInProgress} percent={progressPercent} multiLanguageMode={multiLanguageMode} targetLanguageCount={target_langs.length} />

      <MultiLanguageSettingsModal
        open={multiLangModalOpen}
        onClose={() => setMultiLangModalOpen(false)}
        target_langs={target_langs}
        setTarget_langs={setTarget_langs}
        setMultiLanguageMode={setMultiLanguageMode}
      />
    </Spin>
  );
};

export default MDTranslator;
