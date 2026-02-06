import { useState } from "react";
import { AuthFloatingInput } from "./auth-floating-input";

type Props = {
  id: string;
  label: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  error?: string;
};

export function AuthPasswordInput({
  id,
  label,
  value,
  onChange,
  error,
}: Props) {
  const [show, setShow] = useState(false);

  return (
    <AuthFloatingInput
      id={id}
      label={label}
      value={value}
      onChange={onChange}
      error={error}
      type={show ? "text" : "password"}
      rightIcon={
        <button
          type="button"
          tabIndex={-1}
          onClick={() => setShow((v) => !v)}
          className="absolute right-4 top-1/2 -translate-y-1/2 
                     text-slate-500 hover:text-white transition-colors"
        >
          <span className="material-symbols-outlined text-xl">
            {show ? "visibility" : "visibility_off"}
          </span>
        </button>
      }
    />
  );
}
