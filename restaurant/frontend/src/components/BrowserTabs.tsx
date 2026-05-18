import React from "react";
import { cn } from "../lib/utils";

export interface BrowserTab {
  id: string;
  label: string;
  icon?: React.ReactNode;
}

interface BrowserTabsProps {
  tabs: BrowserTab[];
  activeTab: string;
  onTabChange: (id: string) => void;
  children: React.ReactNode;
  title?: string;
}

const BrowserTabs: React.FC<BrowserTabsProps> = ({
  tabs,
  activeTab,
  onTabChange,
  children,
  title,
}) => (
  <div className="bg-card rounded-xl border border-card-light overflow-hidden">
    <div className="flex items-end gap-0.5 px-3 pt-3 bg-card-light/40 border-b border-card-light overflow-x-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
      {tabs.map((tab) => {
        const isActive = tab.id === activeTab;
        return (
          <button
            key={tab.id}
            type="button"
            onClick={() => onTabChange(tab.id)}
            className={cn(
              "flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-t-lg border border-b-0 transition-colors whitespace-nowrap shrink-0",
              isActive
                ? "bg-card text-white border-card-light -mb-px z-10"
                : "bg-card-light/60 text-text-gray border-transparent hover:text-white hover:bg-card-light",
            )}
          >
            {tab.icon}
            {tab.label}
          </button>
        );
      })}
    </div>
    <div className="p-6">
      {title && <h2 className="text-2xl font-bold text-white mb-6">{title}</h2>}
      {children}
    </div>
  </div>
);

export default BrowserTabs;
