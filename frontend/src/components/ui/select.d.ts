import * as React from 'react';

export interface SelectProps {
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  disabled?: boolean;
  name?: string;
  children: React.ReactNode;
}

export interface SelectTriggerProps extends React.HTMLAttributes<HTMLButtonElement> {
  className?: string;
  children: React.ReactNode;
}

export interface SelectContentProps extends React.HTMLAttributes<HTMLDivElement> {
  className?: string;
  children: React.ReactNode;
}

export interface SelectItemProps extends React.HTMLAttributes<HTMLDivElement> {
  value: string;
  disabled?: boolean;
  className?: string;
  children: React.ReactNode;
}

export interface SelectValueProps {
  placeholder?: string;
  children?: React.ReactNode;
}

export const Select: React.FC<SelectProps>;
export const SelectTrigger: React.FC<SelectTriggerProps>;
export const SelectContent: React.FC<SelectContentProps>;
export const SelectItem: React.FC<SelectItemProps>;
export const SelectValue: React.FC<SelectValueProps>; 