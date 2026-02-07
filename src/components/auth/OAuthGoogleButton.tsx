'use client';

type Props = {
  onClick: () => void;
};

export default function OAuthGoogleButton({ onClick }: Props) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full flex items-center justify-center gap-3 px-4 py-2.5
                 bg-slate-800/50 border border-white/10 rounded-xl
                 text-sm font-semibold text-white
                 hover:bg-slate-700/60 transition"
    >
      <svg
        className="w-5 h-5"
        viewBox="0 0 48 48"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          fill="#EA4335"
          d="M24 9.5c3.54 0 6.36 1.46 8.27 3.24l6.14-6.14C34.73 2.91 29.74 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.18 5.58C11.7 13.36 17.39 9.5 24 9.5z"
        />
        <path
          fill="#4285F4"
          d="M46.1 24.55c0-1.63-.15-3.2-.42-4.73H24v9h12.7c-.55 2.9-2.17 5.36-4.62 7.03l7.08 5.5C43.96 37.36 46.1 31.5 46.1 24.55z"
        />
        <path
          fill="#FBBC05"
          d="M9.74 28.8a14.6 14.6 0 0 1 0-9.6l-7.18-5.58A23.97 23.97 0 0 0 0 24c0 3.89.93 7.57 2.56 10.78l7.18-5.58z"
        />
        <path
          fill="#34A853"
          d="M24 48c6.48 0 11.92-2.14 15.89-5.83l-7.08-5.5c-1.96 1.32-4.47 2.1-8.81 2.1-6.61 0-12.3-3.86-14.26-9.3l-7.18 5.58C6.51 42.62 14.62 48 24 48z"
        />
      </svg>

      <span>Tiếp tục với Google</span>
    </button>
  );
}
