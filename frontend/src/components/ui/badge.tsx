import * as React from "react";

interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'secondary' | 'destructive' | 'outline';
}

const Badge: React.FC<BadgeProps> = ({ 
  className, 
  variant = 'default', 
  ...props 
}) => {
  return (
    <div
      className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ${className}`}
      {...props}
    />
  );
};

Badge.displayName = "Badge";

export { Badge }; 