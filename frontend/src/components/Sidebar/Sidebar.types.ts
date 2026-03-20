export type SidebarTab = "chat" | "config" | "inspector";

export interface SidebarProps {
  activeTab: SidebarTab;
  onTabChange: (tab: SidebarTab) => void;
  children: React.ReactNode;
}

export const SIDEBAR_TABS: {
  key: SidebarTab;
  label: string;
}[] = [
  { key: "chat", label: "Chat" },
  { key: "config", label: "Config" },
  { key: "inspector", label: "Note" },
];
