import {
  SidebarProps,
  SIDEBAR_TABS,
} from "./Sidebar.types";

export function Sidebar({
  activeTab,
  onTabChange,
  children,
}: SidebarProps) {
  return (
    <aside className="sidebar">
      <nav className="sidebar__tabs">
        {SIDEBAR_TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => onTabChange(tab.key)}
            className={`sidebar__tab ${
              activeTab === tab.key ? "active" : ""
            }`}
          >
            {tab.label}
          </button>
        ))}
      </nav>
      <div className="sidebar__content">{children}</div>
    </aside>
  );
}
