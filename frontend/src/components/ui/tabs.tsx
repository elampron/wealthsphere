import React from "react";

export interface TabsProps extends React.HTMLAttributes<HTMLDivElement> {
  defaultValue?: string;
  value?: string;
  onValueChange?: (value: string) => void;
}

export function Tabs({ children, ...props }: TabsProps) {
  return <div {...props}>{children}</div>;
}

export interface TabsListProps extends React.HTMLAttributes<HTMLDivElement> {}

export function TabsList({ children, ...props }: TabsListProps) {
  return <div className="flex space-x-1" {...props}>{children}</div>;
}

export interface TabsTriggerProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  value: string;
}

export function TabsTrigger({ children, value, ...props }: TabsTriggerProps) {
  return <button value={value} {...props}>{children}</button>;
}

export interface TabsContentProps extends React.HTMLAttributes<HTMLDivElement> {
  value: string;
}

export function TabsContent({ children, value, ...props }: TabsContentProps) {
  return <div data-value={value} {...props}>{children}</div>;
} 