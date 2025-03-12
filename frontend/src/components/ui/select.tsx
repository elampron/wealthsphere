import * as React from "react";

interface SelectProps {
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  disabled?: boolean;
  name?: string;
  children: React.ReactNode;
}

const Select: React.FC<SelectProps> = ({
  value,
  defaultValue,
  onValueChange,
  disabled,
  name,
  children,
  ...props
}) => {
  return (
    <div className="select-container">
      {children}
    </div>
  );
};

interface SelectTriggerProps extends React.HTMLAttributes<HTMLButtonElement> {
  className?: string;
  children: React.ReactNode;
}

const SelectTrigger: React.FC<SelectTriggerProps> = ({
  className,
  children,
  ...props
}) => {
  return (
    <button className={`select-trigger ${className || ''}`} {...props}>
      {children}
    </button>
  );
};

interface SelectContentProps extends React.HTMLAttributes<HTMLDivElement> {
  className?: string;
  children: React.ReactNode;
}

const SelectContent: React.FC<SelectContentProps> = ({
  className,
  children,
  ...props
}) => {
  return (
    <div className={`select-content ${className || ''}`} {...props}>
      {children}
    </div>
  );
};

interface SelectItemProps extends React.HTMLAttributes<HTMLDivElement> {
  value: string;
  disabled?: boolean;
  className?: string;
  children: React.ReactNode;
}

const SelectItem: React.FC<SelectItemProps> = ({
  value,
  disabled,
  className,
  children,
  ...props
}) => {
  return (
    <div 
      className={`select-item ${className || ''} ${disabled ? 'disabled' : ''}`} 
      data-value={value}
      {...props}
    >
      {children}
    </div>
  );
};

interface SelectValueProps {
  placeholder?: string;
  children?: React.ReactNode;
}

const SelectValue: React.FC<SelectValueProps> = ({
  placeholder,
  children
}) => {
  return (
    <span className="select-value">
      {children || placeholder}
    </span>
  );
};

export {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue
}; 