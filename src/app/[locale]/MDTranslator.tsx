"use client";

import React, { useState, useEffect, useMemo } from "react";
import { Flex, Card, Button, Typography, Input, Upload, Form, Space, message, Select, Modal, Checkbox, Progress, Tooltip, Switch, Spin } from "antd";
import { CopyOutlined, DownloadOutlined, InboxOutlined, UploadOutlined } from "@ant-design/icons";
import { splitTextIntoLines, getTextStats, downloadFile } from "@/app/utils";
import { placeholderPattern, filterMarkdownLines } from "./markdownUtils";
import { categorizedOptions, findMethodLabel } from "@/app/components/translateAPI";
import { useLanguageOptions, filterLanguageOption } from "@/app/components/languages";
import { useCopyToClipboard } from "@/app/hooks/useCopyToClipboard";
import useFileUpload from "@/app/hooks/useFileUpload";
import useTranslateData from "@/app/hooks/useTranslateData";
import { useTranslations } from "next-intl";
import { getLangDir } from "rtl-detect";

const { TextArea } = Input;
const { Dragger } = Upload;
const { Paragraph } = Typography;

const MDTranslator = () => {
  const tMarkdown = useTranslations("markdown");
  const t = useTranslations("common");

  const { sourceOptions, targetOptions } = useLanguageOptions();
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
  } = useTranslateData();
  const [messageApi, contextHolder] = message.useMessage();

  const sourceStats = useMemo(() => getTextStats(sourceText), [sourceText]);
  const resultStats = useMemo(() => getTextStats(translatedText), [translatedText]);

  const config = getCurrentConfig();
  const [taggedText, setTaggedText] = useState("");
  const [rawTranslationMode, setRawTranslationMode] = useState(false);
  const [mdOption, setMdOption] = useState({
    translateFrontmatter: false,
    translateMultilineCode: false,
    translateLatex: false,
  });

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
      messageApi.error(t("noTargetLanguage"));
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
                  const [translated] = await translateContent([segment], translationMethod, currentTargetLang, fileIndex, totalFiles);
                  return translated;
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
          const translateRawLine = async (line: string): Promise<string> => {
            const [translated] = await translateContent([line], translationMethod, currentTargetLang, fileIndex, totalFiles);
            return translated;
          };

          const translatedLines = await Promise.all(lines.map((line) => translateRawLine(line)));
          translatedTextWithPlaceholders = translatedLines.join("\n");
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
          let fileExtension = ".md";
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
      } catch (error) {
        messageApi.error(`${error.message} ${sourceOptions.find((option) => option.value === currentTargetLang)?.label || currentTargetLang}  ${t("translationError")}`, 5);
      }
    }
  };

  const handleMultipleTranslate = async () => {
    const isValid = await validateTranslate();
    if (!isValid) {
      return;
    }

    if (multipleFiles.length === 0) {
      messageApi.error(t("noFileUploaded"));
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
    messageApi.success(t("translationComplete"), 10);
  };

  const handleExportFile = () => {
    const uploadFileName = multipleFiles[0]?.name;
    const fileName = uploadFileName || "mdtranslated.md";
    downloadFile(translatedText, fileName);
    return fileName;
  };

  const handleExtractText = () => {
    if (!sourceText.trim()) {
      messageApi.error(t("noSourceText"));
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
    copyToClipboard(extractedText, messageApi, t("textExtracted"));
  };

  return (
    <Spin spinning={isFileProcessing} size="large">
      {contextHolder}
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
        <p className="ant-upload-text">{tMarkdown("dragAndDropText")}</p>
      </Dragger>
      {uploadMode === "single" && (
        <TextArea
          placeholder={tMarkdown("pasteUploadContent")}
          value={sourceStats.displayText}
          onChange={!sourceStats.isTooLong ? (e) => setSourceText(e.target.value) : undefined}
          rows={8}
          className="mt-1 mb-2"
          allowClear
          readOnly={sourceStats.isTooLong}
        />
      )}
      {sourceText && (
        <Paragraph type="secondary" className="-mt-1 mb-2">
          {t("inputStatsTitle")}: {sourceStats.charCount} {t("charLabel")}, {sourceStats.lineCount} {t("lineLabel")}
        </Paragraph>
      )}
      <Form layout="inline" labelWrap className="gap-1 mb-2">
        <Form.Item label={t("translationAPI")}>
          <Space.Compact>
            <Select showSearch value={translationMethod} onChange={(e) => setTranslationMethod(e)} options={categorizedOptions} style={{ minWidth: 150 }} />
            {config?.apiKey !== undefined && translationMethod !== "llm" && (
              <Tooltip title={`${t("enter")} ${findMethodLabel(translationMethod)} API Key`}>
                <Input.Password
                  autoComplete="off"
                  placeholder={`API Key ${findMethodLabel(translationMethod)} `}
                  value={config.apiKey}
                  onChange={(e) => handleConfigChange(translationMethod, "apiKey", e.target.value)}
                />
              </Tooltip>
            )}
          </Space.Compact>
        </Form.Item>
        <Form.Item label={t("sourceLanguage")}>
          <Select
            value={sourceLanguage}
            onChange={(e) => handleLanguageChange("source", e)}
            options={sourceOptions}
            showSearch
            placeholder={t("selectSourceLanguage")}
            optionFilterProp="children"
            filterOption={(input, option) => filterLanguageOption({ input, option })}
            style={{ minWidth: 120 }}
          />
        </Form.Item>
        <Space wrap>
          <Form.Item label={t("targetLanguage")}>
            {!multiLanguageMode ? (
              <Select
                value={targetLanguage}
                onChange={(e) => handleLanguageChange("target", e)}
                options={targetOptions}
                showSearch
                placeholder={t("selectTargetLanguage")}
                optionFilterProp="children"
                filterOption={(input, option) => filterLanguageOption({ input, option })}
                style={{ minWidth: 120 }}
              />
            ) : (
              <Select
                mode="multiple"
                allowClear
                value={target_langs}
                onChange={(e) => setTarget_langs(e)}
                options={targetOptions}
                placeholder={t("selectMultiTargetLanguages")}
                optionFilterProp="children"
                filterOption={(input, option) => filterLanguageOption({ input, option })}
                style={{ minWidth: 300 }}
              />
            )}
          </Form.Item>
        </Space>
        <Form.Item label={tMarkdown("translationOptions")}>
          <Space wrap>
            <Tooltip title={tMarkdown("tFrontmatterTooltip")}>
              <Checkbox
                checked={mdOption.translateFrontmatter}
                onChange={(e) =>
                  setMdOption((prev) => ({
                    ...prev,
                    translateFrontmatter: e.target.checked,
                  }))
                }>
                {tMarkdown("tFrontmatter")}
              </Checkbox>
            </Tooltip>

            <Tooltip title={tMarkdown("tCodeBlocksTooltip")}>
              <Checkbox
                checked={mdOption.translateMultilineCode}
                onChange={(e) =>
                  setMdOption((prev) => ({
                    ...prev,
                    translateMultilineCode: e.target.checked,
                  }))
                }>
                {tMarkdown("tCodeBlocks")}
              </Checkbox>
            </Tooltip>

            <Tooltip title={tMarkdown("tLatexTooltip")}>
              <Checkbox
                checked={mdOption.translateLatex}
                onChange={(e) =>
                  setMdOption((prev) => ({
                    ...prev,
                    translateLatex: e.target.checked,
                  }))
                }>
                {tMarkdown("tLatex")}
              </Checkbox>
            </Tooltip>
          </Space>
        </Form.Item>
        <Form.Item label={t("advancedSettings")}>
          <Space wrap>
            <Tooltip title={tMarkdown("rawTranslationModeTooltip")}>
              <Checkbox checked={rawTranslationMode} onChange={(e) => setRawTranslationMode(e.target.checked)}>
                {tMarkdown("rawTranslationMode")}
              </Checkbox>
            </Tooltip>
            <Tooltip title={t("singleFileModeTooltip")}>
              <Checkbox checked={singleFileMode} onChange={(e) => setSingleFileMode(e.target.checked)}>
                {t("singleFileMode")}
              </Checkbox>
            </Tooltip>
            <Tooltip title={t("useCacheTooltip")}>
              <Checkbox checked={useCache} onChange={(e) => setUseCache(e.target.checked)}>
                {t("useCache")}
              </Checkbox>
            </Tooltip>
            <Tooltip title={t("multiLanguageModeTooltip")}>
              <Switch checked={multiLanguageMode} onChange={(checked) => setMultiLanguageMode(checked)} checkedChildren={t("multiLanguageMode")} unCheckedChildren={t("singleLanguageMode")} />
            </Tooltip>
          </Space>
        </Form.Item>
      </Form>
      <Flex gap="small">
        <Button type="primary" block onClick={() => (uploadMode === "single" ? handleTranslate(performTranslation, sourceText) : handleMultipleTranslate())} disabled={translateInProgress}>
          {multiLanguageMode ? `${t("translate")} | ${t("totalLanguages")}${target_langs.length || 0}` : t("translate")}
        </Button>
        <Tooltip title={t("exportSettingTooltip")}>
          <Button
            icon={<DownloadOutlined />}
            onClick={async () => {
              await exportSettings();
            }}>
            {t("exportSetting")}
          </Button>
        </Tooltip>
        <Tooltip title={t("importSettingTooltip")}>
          <Button
            icon={<UploadOutlined />}
            onClick={async () => {
              await importSettings();
            }}>
            {t("importSetting")}
          </Button>
        </Tooltip>
        <Tooltip title={t("resetUploadTooltip")}>
          <Button
            onClick={() => {
              resetUpload();
              setTranslatedText("");
              messageApi.success(t("resetUploadSuccess"));
            }}>
            {t("resetUpload")}
          </Button>
        </Tooltip>
        {uploadMode === "single" && sourceText && <Button onClick={handleExtractText}>{t("extractText")}</Button>}
      </Flex>
      {uploadMode === "single" && (
        <>
          {translatedText && !(multiLanguageMode && target_langs.length > 1) && (
            <Card
              title={t("translationResult")}
              className="mt-3"
              extra={
                <Space wrap>
                  <Button icon={<CopyOutlined />} onClick={() => copyToClipboard(translatedText, messageApi)}>
                    {t("copy")}
                  </Button>
                  <Button
                    icon={<DownloadOutlined />}
                    onClick={() => {
                      const fileName = handleExportFile();
                      messageApi.success(`${t("exportedFile")}: ${fileName}`);
                    }}>
                    {t("exportFile")}
                  </Button>
                </Space>
              }>
              <TextArea value={resultStats.displayText} dir={getLangDir(targetLanguage)} rows={10} readOnly />
              <Paragraph type="secondary" className="-mb-2">
                {t("outputStatsTitle")}: {resultStats.charCount} {t("charLabel")}, {resultStats.lineCount} {t("lineLabel")}
              </Paragraph>
            </Card>
          )}
          {extractedText && (
            <>
              <Card
                title={t("extractedText")}
                className="mt-3"
                extra={
                  <Button icon={<CopyOutlined />} onClick={() => copyToClipboard(extractedText, messageApi)}>
                    {t("copy")}
                  </Button>
                }>
                <TextArea value={extractedText} rows={10} readOnly />
              </Card>
              <Card
                title={tMarkdown("textWithPlaceholders")}
                className="mt-3"
                extra={
                  <Button icon={<CopyOutlined />} onClick={() => copyToClipboard(taggedText, messageApi)}>
                    {t("copy")}
                  </Button>
                }>
                <TextArea value={taggedText} rows={10} readOnly />
              </Card>
            </>
          )}
        </>
      )}
      {translateInProgress && (
        <Modal title={t("translating")} open={translateInProgress} footer={null} closable={false}>
          <div className="text-center">
            <Progress type="circle" percent={Math.round(progressPercent * 100) / 100} />
            {multiLanguageMode && target_langs.length > 0 && <p className="mt-4">{`${t("multiTranslating")} ${target_langs.length}`}</p>}
          </div>
        </Modal>
      )}
    </Spin>
  );
};

export default MDTranslator;
