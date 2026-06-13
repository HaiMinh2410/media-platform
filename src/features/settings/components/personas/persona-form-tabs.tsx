import * as React from "react";
import { BasicTab } from "./tabs/basic-tab";
import { CampaignTab } from "./tabs/campaign-tab";
import { AdvancedTab } from "./tabs/advanced-tab";
import { SafetyTab } from "./tabs/safety-tab";

interface PersonaFormTabsProps {
  activeTab: string;
  persona: any;
  account: any;
  onChange: (updates: any) => void;
  botConfig: any;
  onChangeBotConfig: (updates: any) => void;
  isLoadingBot: boolean;
}

export function PersonaFormTabs({
  activeTab,
  persona,
  account,
  onChange,
  botConfig,
  onChangeBotConfig,
  isLoadingBot,
}: PersonaFormTabsProps) {
  switch (activeTab) {
    case "safety":
      return (
        <SafetyTab
          persona={persona}
          onChange={onChange}
          botConfig={botConfig}
          onChangeBotConfig={onChangeBotConfig}
          isLoadingBot={isLoadingBot}
        />
      );
    case "basic":
      return (
        <BasicTab persona={persona} account={account} onChange={onChange} />
      );
    case "campaign":
      return <CampaignTab persona={persona} onChange={onChange} />;
    case "advanced":
      return <AdvancedTab persona={persona} onChange={onChange} />;
    default:
      return null;
  }
}
