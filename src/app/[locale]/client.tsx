"use client";

import React from "react";
import { FileMarkdownOutlined } from "@ant-design/icons";
import MDTranslator from "./MDTranslator";
import { useTranslations, useLocale } from "next-intl";
import { TranslationProvider } from "@/app/components/TranslationContext";
import { getDocUrl } from "@/app/utils";
import ToolPage from "@/app/components/styled/ToolPage";
import ApiSettingsDrawer from "@/app/components/ApiSettingsDrawer";

const ClientPage = () => {
  const tMarkdown = useTranslations("MDTranslator");
  const locale = useLocale();
  const userGuideUrl = getDocUrl("guide/translation/md-translator/index.html", locale);

  return (
    <TranslationProvider>
      <ToolPage icon={<FileMarkdownOutlined />} toolKey="mdTranslator" description={tMarkdown("clientDescription")} guideUrl={userGuideUrl}>
        <MDTranslator />
      </ToolPage>
      <ApiSettingsDrawer />
    </TranslationProvider>
  );
};

export default ClientPage;
