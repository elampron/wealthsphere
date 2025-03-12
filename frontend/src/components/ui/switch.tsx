import * as React from "react";

interface SwitchProps extends React.InputHTMLAttributes<HTMLInputElement> {
  checked?: boolean;
  onCheckedChange?: (checked: boolean) => void;
}

const Switch = React.forwardRef<HTMLInputElement, SwitchProps>(
  ({ className, checked, onCheckedChange, ...props }, ref) => {
    return (
      <input
        type="checkbox"
        className={`switch ${className || ''}`}
        ref={ref}
        checked={checked}
        onChange={e => onCheckedChange?.(e.target.checked)}
        {...props}
      />
    );
  }
);

Switch.displayName = "Switch";

export { Switch }; 