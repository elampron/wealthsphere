import * as React from 'react';

export interface DialogProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  children: React.ReactNode;
}

export interface DialogContentProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

export interface DialogHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

export interface DialogFooterProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

export interface DialogTitleProps extends React.HTMLAttributes<HTMLHeadingElement> {
  children: React.ReactNode;
}

export interface DialogDescriptionProps extends React.HTMLAttributes<HTMLParagraphElement> {
  children: React.ReactNode;
}

export const Dialog: React.FC<DialogProps>;
export const DialogContent: React.FC<DialogContentProps>;
export const DialogHeader: React.FC<DialogHeaderProps>;
export const DialogFooter: React.FC<DialogFooterProps>;
export const DialogTitle: React.FC<DialogTitleProps>;
export const DialogDescription: React.FC<DialogDescriptionProps>; 