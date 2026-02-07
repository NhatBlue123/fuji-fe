'use client';

import { useState } from 'react';
import { AuthPrimaryButton } from '../ui/auth-ui/auth-primary-button';
import { AuthPasswordInput } from '../ui/auth-ui/auth-pass-input';
import { AuthFloatingInput } from '../ui/auth-ui/auth-floating-input';
import AuthLayout from './layout/AuthLayout';
import OAuthGoogleButton from '@/components/auth/OAuthGoogleButton';

type Errors = {
    fullname?: string;
    email?: string;
    password?: string;
    confirm_password?: string;
};

export default function RegisterForm() {
    const [formData, setFormData] = useState({
        fullname: '',
        email: '',
        password: '',
        confirm_password: '',
    });

    const [errors, setErrors] = useState<Errors>({});
    const [submitted, setSubmitted] = useState(false);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { id, value } = e.target;
        setFormData(prev => ({ ...prev, [id]: value }));
        if (submitted) setErrors(prev => ({ ...prev, [id]: undefined }));
    };

    const validate = () => {
        const newErrors: Errors = {};
        if (!formData.fullname) newErrors.fullname = 'Vui lòng nhập tên đăng nhập';
        if (!formData.email) newErrors.email = 'Vui lòng nhập email';
        if (!formData.password) newErrors.password = 'Vui lòng nhập mật khẩu';
        if (formData.confirm_password !== formData.password)
            newErrors.confirm_password = 'Mật khẩu không khớp';

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitted(true);
        if (!validate()) return;
        console.log('Register:', formData);
    };

    return (
        <AuthLayout mode="register">
            <form className="space-y-4" onSubmit={handleSubmit}>
                <AuthFloatingInput
                    id="fullname"
                    label="Tên đăng nhập"
                    value={formData.fullname}
                    onChange={handleChange}
                    error={submitted ? errors.fullname : undefined}
                />

                <AuthFloatingInput
                    id="email"
                    type="email"
                    label="Email"
                    value={formData.email}
                    onChange={handleChange}
                    error={submitted ? errors.email : undefined}
                />

                <AuthPasswordInput
                    id="password"
                    label="Mật khẩu"
                    value={formData.password}
                    onChange={handleChange}
                    error={submitted ? errors.password : undefined}
                />

                <AuthPasswordInput
                    id="confirm_password"
                    label="Xác nhận mật khẩu"
                    value={formData.confirm_password}
                    onChange={handleChange}
                    error={submitted ? errors.confirm_password : undefined}
                />
                {/* Action buttons */}
                <div className="pt-4 space-y-4">
                    <AuthPrimaryButton type="submit">
                        Tạo tài khoản
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
                                console.log("Register with Google");
                            }}
                        />
                    </div>

                </div>
            </form>
        </AuthLayout>
    );
}
