import React from "react";

interface AuthFloatingInputProps
    extends React.InputHTMLAttributes<HTMLInputElement> {
    label: string;
    error?: string;
    rightIcon?: React.ReactNode;
}

export function AuthFloatingInput({
    id,
    label,
    error,
    className = "",
    rightIcon,
    placeholder,
    ...props
}: AuthFloatingInputProps) {
    const baseInput = "peer block w-full px-4 py-3.5 text-white bg-slate-800/50 rounded-xl border transition-all focus:outline-none focus:ring-1 placeholder-transparent";
    const errorInput = "border-rose-500 ring-rose-500";
    const normalInput = "border-slate-600/50 focus:border-pink-500 focus:ring-pink-500";

    const labelClasses = `
        absolute left-3 top-1/2 z-10 origin-[0]
        -translate-y-1/2 scale-100
        text-sm text-slate-400
        bg-transparent px-2
        transition-all duration-300
        pointer-events-none
        rounded-full

        peer-focus:top-0
        peer-focus:-translate-y-1/2
        peer-focus:scale-90
        peer-focus:text-pink-500
        peer-focus:bg-slate-900/90
        peer-focus:backdrop-blur-md

        peer-not-placeholder-shown:top-0
        peer-not-placeholder-shown:-translate-y-1/2
        peer-not-placeholder-shown:scale-90
        peer-not-placeholder-shown:text-pink-500
        peer-not-placeholder-shown:bg-slate-900/90
        peer-not-placeholder-shown:backdrop-blur-md
        
        peer-placeholder-shown:top-1/2
        peer-placeholder-shown:-translate-y-1/2
        peer-placeholder-shown:scale-100
        peer-placeholder-shown:bg-transparent
    `;

    return (
        <div className="relative group">
            <input
                id={id}
                {...props}
                placeholder={placeholder ?? " "}
                className={`${baseInput} ${error ? errorInput : normalInput} ${className}`}
            />

            <label
                htmlFor={id}
                className={labelClasses}
            >
                {label}
            </label>


            {rightIcon}
            {error && (
                <p className="mt-1.5 text-xs text-rose-400 font-medium px-1 flex items-center gap-1 animate-in fade-in slide-in-from-top-1">
                    <span className="material-symbols-outlined text-[14px]">error</span>
                    {error}
                </p>
            )}
        </div>
    );
}
