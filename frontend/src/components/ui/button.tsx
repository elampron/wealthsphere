import React from "react";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'outline' | 'destructive' | 'link';
  size?: 'default' | 'sm' | 'lg';
}

export function Button({ children, className, variant = 'default', size = 'default', ...props }: ButtonProps) {
  return <button className={className} {...props}>{children}</button>;
} 