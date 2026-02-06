export function AuthPrimaryButton({
  children,
  className = "",
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      {...props}
      className={`w-full py-3.5 px-4
        bg-gradient-to-r from-secondary to-rose-500
        hover:from-pink-400 hover:to-rose-400
        text-white font-bold rounded-xl
        shadow-lg shadow-pink-500/30
        hover:shadow-pink-500/50
        transform hover:-translate-y-0.5 active:translate-y-0
        transition-all duration-200
        flex items-center justify-center gap-2
        ${className}`}
    >
      {children}
    </button>
  );
}
