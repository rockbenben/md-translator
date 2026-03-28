"use client";

import React, { useState, useCallback } from "react";
import { Card, Button, Typography, Input, Flex, App } from "antd";
import { GlobalOutlined } from "@ant-design/icons";
import { useTranslations } from "next-intl";
import { useTranslationContext } from "@/app/components/TranslationContext";
import { SplitPaneContainer } from "./index";

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

  // 左侧面板: 原文输入
  const leftPanel = (
    <Card className="h-full" title={t("sourceArea")}>
      <Flex vertical className="h-full" gap="small">
        <TextArea
          value={sourceText}
          onChange={(e) => setSourceText(e.target.value)}
          placeholder={t("pasteUploadContent")}
          rows={12}
          className="flex-1"
          aria-label={t("sourceArea")}
        />
        <Flex justify="end">
          <Text type="secondary" className="!text-xs">
            {sourceText.length} {t("charLabel")} / {sourceText.split("\n").length} {t("lineLabel")}
          </Text>
        </Flex>
      </Flex>
    </Card>
  );

  // 右侧面板: 译文显示
  const rightPanel = (
    <Card className="h-full" title={t("translationResult")}>
      <Flex vertical className="h-full" gap="small">
        <TextArea
          value={translatedText}
          readOnly
          placeholder={t("translationResult")}
          rows={12}
          className="flex-1"
          aria-label={t("translationResult")}
        />
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

      {/* 分屏容器 */}
      <SplitPaneContainer
        leftPanel={leftPanel}
        rightPanel={rightPanel}
      />
    </div>
  );
};

export default SplitPaneView;