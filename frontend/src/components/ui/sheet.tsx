import * as React from "react";

interface SheetProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  children: React.ReactNode;
}

const Sheet: React.FC<SheetProps> = ({
  open,
  onOpenChange,
  children
}) => {
  return <div className="sheet">{children}</div>;
};

interface SheetContentProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

const SheetContent: React.FC<SheetContentProps> = ({
  children,
  ...props
}) => {
  return <div className="sheet-content" {...props}>{children}</div>;
};

interface SheetHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

const SheetHeader: React.FC<SheetHeaderProps> = ({
  children,
  ...props
}) => {
  return <div className="sheet-header" {...props}>{children}</div>;
};

interface SheetFooterProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

const SheetFooter: React.FC<SheetFooterProps> = ({
  children,
  ...props
}) => {
  return <div className="sheet-footer" {...props}>{children}</div>;
};

interface SheetTitleProps extends React.HTMLAttributes<HTMLHeadingElement> {
  children: React.ReactNode;
}

const SheetTitle: React.FC<SheetTitleProps> = ({
  children,
  ...props
}) => {
  return <h2 className="sheet-title" {...props}>{children}</h2>;
};

interface SheetDescriptionProps extends React.HTMLAttributes<HTMLParagraphElement> {
  children: React.ReactNode;
}

const SheetDescription: React.FC<SheetDescriptionProps> = ({
  children,
  ...props
}) => {
  return <p className="sheet-description" {...props}>{children}</p>;
};

export {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetFooter,
  SheetTitle,
  SheetDescription
}; 