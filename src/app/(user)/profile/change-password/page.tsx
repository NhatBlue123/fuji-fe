"use client";

import { useState } from "react";
import { Eye, EyeOff, Lock, ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";

export default function ChangePasswordPage() {
  const router = useRouter();

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!currentPassword || !newPassword || !confirmPassword) {
      setError("Vui lòng nhập đầy đủ thông tin.");
      return;
    }

    if (newPassword.length < 8) {
      setError("Mật khẩu mới phải có ít nhất 8 ký tự.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("Mật khẩu xác nhận không khớp.");
      return;
    }

    // TODO: call API change password

    localStorage.removeItem("token");
    localStorage.removeItem("user");
    router.push("/");
  };

  return (
    <div className="min-h-screen bg-slate-950 px-4 py-16">
      <div className="mx-auto max-w-6xl bg-slate-900 border border-slate-800 rounded-2xl p-8 space-y-6">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-sm text-slate-400 hover:text-slate-200 transition w-fit"
        >
          <ArrowLeft size={16} />
          Quay lại
        </button>

        {/* ===== CENTER FORM ===== */}
        <div className="mx-auto max-w-md space-y-6">
          {/* Header */}
          <div className="text-center space-y-2">
            <div className="mx-auto w-12 h-12 rounded-full bg-indigo-600/20 flex items-center justify-center">
              <Lock className="text-indigo-400" />
            </div>
            <h1 className="text-2xl font-bold text-slate-100">
              Đổi mật khẩu
            </h1>
            <p className="text-sm text-slate-400">
              Để bảo mật tài khoản học tiếng Nhật của bạn
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Current */}
            <Field
              label="Mật khẩu hiện tại"
              type={showPassword ? "text" : "password"}
              value={currentPassword}
              onChange={setCurrentPassword}
            />

            {/* New */}
            <Field
              label="Mật khẩu mới"
              type={showPassword ? "text" : "password"}
              value={newPassword}
              onChange={setNewPassword}
            />

            {/* Confirm */}
            <Field
              label="Xác nhận mật khẩu mới"
              type={showPassword ? "text" : "password"}
              value={confirmPassword}
              onChange={setConfirmPassword}
            />

            {/* Toggle */}
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="flex items-center gap-2 text-sm text-slate-400 hover:text-slate-200 transition"
            >
              {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              {showPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
            </button>

            {error && <p className="text-sm text-red-400">{error}</p>}

            <button
              type="submit"
              className="w-full py-3 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-semibold transition"
            >
              Cập nhật mật khẩu
            </button>
          </form>

          <p className="text-xs text-center text-slate-500">
            Sau khi đổi mật khẩu, bạn sẽ cần đăng nhập lại.
          </p>
        </div>
      </div>
    </div>
  );
}

/* ===== Reusable Field ===== */
function Field({
  label,
  type,
  value,
  onChange,
}: {
  label: string;
  type: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="space-y-1">
      <label className="text-sm text-slate-300">{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-lg bg-slate-800 border border-slate-700
                   px-4 py-2.5 text-slate-100
                   focus:outline-none focus:ring-2 focus:ring-indigo-500"
      />
    </div>
  );
}
