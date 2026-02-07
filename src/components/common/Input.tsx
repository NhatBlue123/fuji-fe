"use client";
import React from "react";

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  icon?: string; // Material icon name
  containerClassName?: string;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ icon, containerClassName, className, ...props }, ref) => {
    return (
      <div className={`relative group ${containerClassName || ""}`}>
        {icon && (
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <span className="material-symbols-outlined text-muted-foreground group-focus-within:text-secondary transition-colors">
              {icon}
            </span>
          </div>
        )}
        <input
          ref={ref}
          className={`block w-full ${
            icon ? "pl-12" : "pl-4"
          } pr-4 py-3.5 bg-background border border-input rounded-xl leading-5 text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-input transition duration-150 ease-in-out ${
            className || ""
          }`}
          {...props}
        />
      </div>
    );
  }
);

Input.displayName = "Input";

export default Input;
