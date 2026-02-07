import clsx from "clsx";

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
    className,
    rightIcon,
    placeholder,
    ...props
}: AuthFloatingInputProps) {
    return (
        <div className="relative group">
            <input
                id={id}
                {...props}
                placeholder={placeholder ?? " "}
                className={clsx(
                    "peer block w-full px-4 pt-5 py-2.5 text-white bg-slate-800/50 rounded-xl border transition-all",
                    "focus:outline-none focus:ring-1 placeholder-transparent",
                    error
                        ? "border-rose-500 ring-rose-500"
                        : "border-slate-600/50 focus:border-blue-500 focus:ring-blue-500",
                    className
                )}
            />

            <label
                htmlFor={id}
                className="
                    absolute left-3 top-1/2 z-10 origin-[0]
                    -translate-y-1/2 scale-100
                    text-sm text-slate-400
                    bg-card-bg px-2
                    transition-all duration-300
                    pointer-events-none

                    peer-focus:top-2
                    peer-focus:-translate-y-4
                    peer-focus:scale-90
                    peer-focus:text-blue-500

                    peer-placeholder-shown:top-1/2
                    peer-placeholder-shown:-translate-y-1/2
                    peer-placeholder-shown:scale-100
                "
            >
                {label}
            </label>


            {rightIcon}
        </div>
    );
}
