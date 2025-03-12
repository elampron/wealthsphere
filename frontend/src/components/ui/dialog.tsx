import * as React from "react";

interface DialogProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  children: React.ReactNode;
}

const Dialog: React.FC<DialogProps> = ({
  open,
  onOpenChange,
  children
}) => {
  return <div className="dialog">{children}</div>;
};

interface DialogContentProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

const DialogContent: React.FC<DialogContentProps> = ({
  children,
  ...props
}) => {
  return <div className="dialog-content" {...props}>{children}</div>;
};

interface DialogHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

const DialogHeader: React.FC<DialogHeaderProps> = ({
  children,
  ...props
}) => {
  return <div className="dialog-header" {...props}>{children}</div>;
};

interface DialogFooterProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

const DialogFooter: React.FC<DialogFooterProps> = ({
  children,
  ...props
}) => {
  return <div className="dialog-footer" {...props}>{children}</div>;
};

interface DialogTitleProps extends React.HTMLAttributes<HTMLHeadingElement> {
  children: React.ReactNode;
}

const DialogTitle: React.FC<DialogTitleProps> = ({
  children,
  ...props
}) => {
  return <h2 className="dialog-title" {...props}>{children}</h2>;
};

interface DialogDescriptionProps extends React.HTMLAttributes<HTMLParagraphElement> {
  children: React.ReactNode;
}

const DialogDescription: React.FC<DialogDescriptionProps> = ({
  children,
  ...props
}) => {
  return <p className="dialog-description" {...props}>{children}</p>;
};

export {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription
}; 