"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

interface TabsContextValue {
  value: string;
  onValueChange: (value: string) => void;
  tabIds: Map<string, string>;
  panelIds: Map<string, string>;
  registerTab: (value: string, tabId: string, panelId: string) => void;
}

const TabsContext = React.createContext<TabsContextValue | undefined>(undefined);

function useTabs() {
  const context = React.useContext(TabsContext);
  if (!context) throw new Error("useTabs must be used within <Tabs>");
  return context;
}

interface TabsProps extends React.HTMLAttributes<HTMLDivElement> {
  defaultValue: string;
  value?: string;
  onValueChange?: (value: string) => void;
}

function Tabs({ defaultValue, value: controlledValue, onValueChange, children, className, ...props }: TabsProps) {
  const [internalValue, setInternalValue] = React.useState(defaultValue);
  const value = controlledValue ?? internalValue;
  const handleChange = onValueChange ?? setInternalValue;
  const [tabIds] = React.useState(() => new Map<string, string>());
  const [panelIds] = React.useState(() => new Map<string, string>());

  const registerTab = React.useCallback((tabValue: string, tabId: string, panelId: string) => {
    tabIds.set(tabValue, tabId);
    panelIds.set(tabValue, panelId);
  }, [tabIds, panelIds]);

  return (
    <TabsContext.Provider value={{ value, onValueChange: handleChange, tabIds, panelIds, registerTab }}>
      <div className={cn(className)} {...props}>{children}</div>
    </TabsContext.Provider>
  );
}

function TabsList({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    const target = e.target as HTMLElement;
    if (target.getAttribute("role") !== "tab") return;

    const tabs = Array.from(
      e.currentTarget.querySelectorAll<HTMLElement>('[role="tab"]:not([disabled])')
    );
    const currentIndex = tabs.indexOf(target);

    let nextIndex: number | null = null;
    if (e.key === "ArrowRight") {
      nextIndex = (currentIndex + 1) % tabs.length;
    } else if (e.key === "ArrowLeft") {
      nextIndex = (currentIndex - 1 + tabs.length) % tabs.length;
    } else if (e.key === "Home") {
      nextIndex = 0;
    } else if (e.key === "End") {
      nextIndex = tabs.length - 1;
    }

    if (nextIndex !== null) {
      e.preventDefault();
      tabs[nextIndex].focus();
      tabs[nextIndex].click();
    }
  };

  return (
    <div
      role="tablist"
      onKeyDown={handleKeyDown}
      className={cn(
        "inline-flex h-10 items-center justify-center rounded-md bg-muted p-1 text-muted-foreground",
        className
      )}
      {...props}
    />
  );
}

interface TabsTriggerProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  value: string;
}

function TabsTrigger({ value, className, ...props }: TabsTriggerProps) {
  const { value: selectedValue, onValueChange, registerTab, panelIds } = useTabs();
  const isSelected = selectedValue === value;
  const tabId = React.useId();
  const panelId = React.useId();

  React.useEffect(() => {
    registerTab(value, tabId, panelId);
  }, [value, tabId, panelId, registerTab]);

  return (
    <button
      role="tab"
      id={tabId}
      aria-selected={isSelected}
      aria-controls={panelIds.get(value) || panelId}
      tabIndex={isSelected ? 0 : -1}
      className={cn(
        "inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
        isSelected && "bg-background text-foreground shadow-sm",
        className
      )}
      onClick={() => onValueChange(value)}
      {...props}
    />
  );
}

interface TabsContentProps extends React.HTMLAttributes<HTMLDivElement> {
  value: string;
}

function TabsContent({ value, className, ...props }: TabsContentProps) {
  const { value: selectedValue, tabIds } = useTabs();
  const panelId = React.useId();
  if (selectedValue !== value) return null;
  return (
    <div
      role="tabpanel"
      id={panelId}
      aria-labelledby={tabIds.get(value)}
      tabIndex={0}
      className={cn("mt-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2", className)}
      {...props}
    />
  );
}

export { Tabs, TabsList, TabsTrigger, TabsContent };
