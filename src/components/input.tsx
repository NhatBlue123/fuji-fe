'use client';


import clsx from 'clsx';


interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
label: string;
error?: string;
showError?: boolean;
}


export default function Input({
label,
error,
showError,
className,
...props
}: InputProps) {
const hasError = showError && !!error;


return (
<div className="relative">
<input
{...props}
placeholder=" "
className={clsx(
`
peer w-full px-4 py-3.5 text-white
bg-slate-800/50
border rounded-xl
outline-none transition-all
`,
hasError
? 'border-rose-500 ring-1 ring-rose-500'
: 'border-slate-600/50 focus:border-blue-500 focus:ring-1 focus:ring-blue-500',
className
)}
/>


{/* Floating label */}
<label
className={clsx(
`
absolute left-4 top-3.5 text-sm
text-slate-400 pointer-events-none
transition-all
peer-placeholder-shown:top-3.5
peer-placeholder-shown:text-sm
peer-focus:-top-2
peer-focus:text-xs
peer-focus:text-blue-400
`,
hasError && 'text-rose-400'
)}
>
{label}
</label>


{/* Error message */}
{hasError && (
<p className="mt-1 text-xs text-rose-400">{error}</p>
)}
</div>
);
}