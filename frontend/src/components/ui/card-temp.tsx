import React from "react";

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {}

export function Card({ children, ...props }: CardProps) {
  return <div className="rounded-lg border bg-card text-card-foreground shadow-sm" {...props}>{children}</div>;
}

export interface CardHeaderProps extends React.HTMLAttributes<HTMLDivElement> {}

export function CardHeader({ children, ...props }: CardHeaderProps) {
  return <div className="flex flex-col space-y-1.5 p-6" {...props}>{children}</div>;
}

export interface CardTitleProps extends React.HTMLAttributes<HTMLHeadingElement> {}

export function CardTitle({ children, ...props }: CardTitleProps) {
  return <h3 className="text-lg font-semibold leading-none tracking-tight" {...props}>{children}</h3>;
}

export interface CardDescriptionProps extends React.HTMLAttributes<HTMLParagraphElement> {}

export function CardDescription({ children, ...props }: CardDescriptionProps) {
  return <p className="text-sm text-muted-foreground" {...props}>{children}</p>;
}

export interface CardContentProps extends React.HTMLAttributes<HTMLDivElement> {}

export function CardContent({ children, ...props }: CardContentProps) {
  return <div className="p-6 pt-0" {...props}>{children}</div>;
}

export interface CardFooterProps extends React.HTMLAttributes<HTMLDivElement> {}

export function CardFooter({ children, ...props }: CardFooterProps) {
  return <div className="flex items-center p-6 pt-0" {...props}>{children}</div>;
} 