'use client'
import clsx from 'clsx'

type Props = {
  children: React.ReactNode
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'destructive'
  size?: 'sm' | 'md' | 'lg'
  onClick?: () => void
  className?: string
  disabled?: boolean
  loading?: boolean
  type?: 'button' | 'submit' | 'reset'
}

export default function AdminButton({
  children,
  variant = 'primary',
  size = 'md',
  onClick,
  className,
  disabled = false,
  loading = false,
  type = 'button',
}: Props) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      className={clsx(
        'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50',
        {
          // Sizes
          'h-8 px-3 text-xs': size === 'sm',
          'h-10 px-4': size === 'md',
          'h-12 px-6 text-base': size === 'lg',

          // Variants
          'bg-blue-500 text-white hover:bg-blue-600 shadow-sm hover:shadow-md hover:shadow-blue-500/30':
            variant === 'primary',
          'bg-secondary text-secondary-foreground hover:bg-secondary/80':
            variant === 'secondary',
          'border border-border bg-background hover:bg-accent hover:text-accent-foreground':
            variant === 'outline',
          'text-muted-foreground hover:bg-accent hover:text-accent-foreground':
            variant === 'ghost',
          'bg-destructive text-destructive-foreground hover:bg-destructive/90':
            variant === 'destructive',
        },
        className
      )}
    >
      {loading && (
        <span className="material-symbols-outlined text-sm animate-spin">refresh</span>
      )}
      {children}
    </button>
  )
}
