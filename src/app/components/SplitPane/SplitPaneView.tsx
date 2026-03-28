"use client";

import React, { useState, useCallback } from "react";
import { Card, Button, Typography, Input, Flex, App } from "antd";
import { GlobalOutlined, EyeOutlined, EyeInvisibleOutlined, FileTextOutlined, SyncOutlined } from "@ant-design/icons";
import { useTranslations } from "next-intl";
import { useTranslationContext } from "@/app/components/TranslationContext";
import { SplitPaneContainer } from "./index";
import MarkdownPreview from "./MarkdownPreview";
import { useScrollSync } from "./useScrollSync";
import { useLocalStorage } from "@/app/hooks/useLocalStorage";

const { TextArea } = Input;
const { Text } = Typography;

interface SplitPaneViewProps {
  /** 触发翻译的回调函数 */
  onTranslate?: () => void;
}

/**
 * 分屏预览视图组件
 * - 左侧: 原文输入区 (TextArea)
 * - 右侧: 译文显示区 (只读 TextArea)
 * - 集成 SplitPaneContainer 实现拖拽分隔
 */
const SplitPaneView: React.FC<SplitPaneViewProps> = ({ onTranslate }) => {
  const t = useTranslations("common");
  const { message } = App.useApp();

  // 分屏视图独立的原文文本状态
  const [sourceText, setSourceText] = useState("");

  // 预览模式状态
  const [isPreviewMode, setIsPreviewMode] = useState(false);
  const [previewContent, setPreviewContent] = useState<'source' | 'translation'>('source');

  // 滚动同步状态 (默认开启，持久化到 localStorage)
  const [scrollSyncEnabled, setScrollSyncEnabled] = useLocalStorage("splitPaneScrollSync", true);

  // 滚动同步 hook
  const { leftScrollRef, rightScrollRef } = useScrollSync({ enabled: scrollSyncEnabled });

  // 从 useTranslationContext 获取翻译结果 (只读显示)
  // 注意: 这里实际上需要使用 translationContext 的 translatedText
  // 但由于分屏视图是独立输入，分屏视图需要自己调用翻译
  const {
    translatedText,
    translateInProgress,
    translationMethod,
    sourceLanguage,
    targetLanguage,
    translateContent,
    getCurrentConfig,
  } = useTranslationContext();

  // 处理翻译按钮点击
  const handleTranslate = useCallback(async () => {
    if (!sourceText.trim()) {
      message.warning(t("noSourceText"));
      return;
    }

    const config = getCurrentConfig();
    if (!config.apiKey && translationMethod !== "gtxFreeAPI") {
      message.error(t("noApiKey"));
      return;
    }

    // 调用翻译
    try {
      const lines = sourceText.split("\n");
      await translateContent(lines, translationMethod, targetLanguage);
      // 翻译结果会通过 useTranslationContext 自动更新 translatedText
      onTranslate?.();
    } catch (error) {
      message.error(t("translationError"));
    }
  }, [sourceText, translateContent, translationMethod, targetLanguage, getCurrentConfig, message, t, onTranslate]);

  // 左侧面板: 原文输入/预览
  const leftPanel = (
    <Card className="h-full" title={t("sourceArea")}>
      <Flex vertical className="h-full" gap="small">
        <div ref={leftScrollRef as React.RefObject<HTMLDivElement>} className="flex-1 overflow-auto">
          {isPreviewMode ? (
            <MarkdownPreview content={sourceText} className="h-full" />
          ) : (
            <TextArea
              value={sourceText}
              onChange={(e) => setSourceText(e.target.value)}
              placeholder={t("pasteUploadContent")}
              rows={12}
              className="h-full"
              aria-label={t("sourceArea")}
            />
          )}
        </div>
        <Flex justify="end">
          <Text type="secondary" className="!text-xs">
            {sourceText.length} {t("charLabel")} / {sourceText.split("\n").length} {t("lineLabel")}
          </Text>
        </Flex>
      </Flex>
    </Card>
  );

  // 右侧面板: 译文显示/预览
  const rightPanel = (
    <Card
      className="h-full"
      title={
        <Flex justify="space-between" align="center">
          <span>{t("translationResult")}</span>
          {isPreviewMode && (
            <Button
              type="text"
              size="small"
              icon={previewContent === 'source' ? <FileTextOutlined /> : <GlobalOutlined />}
              onClick={() => setPreviewContent(previewContent === 'source' ? 'translation' : 'source')}
            >
              {previewContent === 'source' ? t("sourceArea") : t("translationResult")}
            </Button>
          )}
        </Flex>
      }
    >
      <Flex vertical className="h-full" gap="small">
        <div ref={rightScrollRef as React.RefObject<HTMLDivElement>} className="flex-1 overflow-auto">
          {isPreviewMode ? (
            <MarkdownPreview
              content={previewContent === 'source' ? sourceText : translatedText}
              className="h-full"
            />
          ) : (
            <TextArea
              value={translatedText}
              readOnly
              placeholder={t("translationResult")}
              rows={12}
              className="h-full"
              aria-label={t("translationResult")}
            />
          )}
        </div>
        <Flex justify="end">
          <Text type="secondary" className="!text-xs">
            {translatedText.length} {t("charLabel")} / {translatedText.split("\n").length} {t("lineLabel")}
          </Text>
        </Flex>
      </Flex>
    </Card>
  );

  return (
    <div className="h-full">
      {/* 翻译操作栏 */}
      <Flex justify="space-between" align="center" className="mb-3">
        <Text type="secondary">
          {t("sourceArea")}: {sourceLanguage} → {targetLanguage}
        </Text>
        <Flex gap="small">
          <Button
            icon={<SyncOutlined spin={scrollSyncEnabled} />}
            onClick={() => setScrollSyncEnabled(!scrollSyncEnabled)}
            type={scrollSyncEnabled ? "primary" : "default"}
            title={t("scrollSync")}
          >
            {t("scrollSync")}
          </Button>
          <Button
            icon={isPreviewMode ? <EyeInvisibleOutlined /> : <EyeOutlined />}
            onClick={() => setIsPreviewMode(!isPreviewMode)}
          >
            {isPreviewMode ? t("textMode") : t("previewMode")}
          </Button>
          <Button
            type="primary"
            icon={<GlobalOutlined spin={translateInProgress} />}
            onClick={handleTranslate}
            disabled={translateInProgress || !sourceText.trim()}
            loading={translateInProgress}
          >
            {t("translate")}
          </Button>
        </Flex>
      </Flex>

      {/* 分屏容器 */}
      <SplitPaneContainer
        leftPanel={leftPanel}
        rightPanel={rightPanel}
      />
    </div>
  );
};

export default SplitPaneView;