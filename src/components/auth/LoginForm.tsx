'use client';

import { useState } from 'react';
import { AuthFloatingInput } from '../ui/auth-ui/auth-floating-input';
import { AuthPasswordInput } from '../ui/auth-ui/auth-pass-input';
import { AuthPrimaryButton } from '../ui/auth-ui/auth-primary-button';
import OAuthGoogleButton from '@/components/auth/OAuthGoogleButton';
import AuthLayout from './layout/AuthLayout';


export default function LoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Login:', { email, password });
  };

  return (
    <AuthLayout mode="login">
      <form className="space-y-5" onSubmit={handleSubmit}>
        <AuthFloatingInput
          id="email"
          type="email"
          label="Email"
          value={email}
          onChange={e => setEmail(e.target.value)}
        />

        <AuthPasswordInput
          id="password"
          label="Mật khẩu"
          value={password}
          onChange={e => setPassword(e.target.value)}
        />

        <div className="pt-4 space-y-4">
          <AuthPrimaryButton type="submit">
            Đăng nhập
            <span className="material-symbols-outlined text-sm">
              arrow_forward
            </span>
          </AuthPrimaryButton>
          <div className="relative my-6 flex items-center">
            <div className="flex-grow border-t border-white/10"></div>
            <span className="mx-4 text-xs font-semibold text-slate-400 uppercase">
              OR
            </span>
            <div className="flex-grow border-t border-white/10"></div>
          </div>
          <div className="mt-6 flex justify-center">
            <OAuthGoogleButton
              onClick={() => {
                console.log("Login with Google");
              }}
            />
          </div>

        </div>
      </form>
    </AuthLayout>
  );
}
