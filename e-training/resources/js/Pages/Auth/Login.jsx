import Checkbox from '@/Components/Checkbox';
import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import TextInput from '@/Components/TextInput';
import GuestLayout from '@/Layouts/GuestLayout';
import { Head, useForm } from '@inertiajs/react';
import { Eye, EyeOff, LogIn, RefreshCw } from 'lucide-react';
import { useState } from 'react';

export default function Login({ status, canResetPassword }) {
    const mainSiteUrl = import.meta.env.VITE_MAIN_SITE_URL || 'http://localhost:5173/';
    const [showPassword, setShowPassword] = useState(false);
    const [captchaKey, setCaptchaKey] = useState(Date.now());
    const { data, setData, post, processing, errors, reset } = useForm({
        username: '',
        password: '',
        captcha: '',
        remember: false,
    });

    const submit = (e) => {
        e.preventDefault();
        post(route('login'), {
            onFinish: () => reset('password', 'captcha'),
            onError: () => setCaptchaKey(Date.now()), // Refresh captcha on error
        });
    };

    const refreshCaptcha = () => {
        setCaptchaKey(Date.now());
    };

    return (
        <GuestLayout backHref={mainSiteUrl}>
            <Head title="Masuk" />

            <div className="text-center mb-8">
                <h2 className="text-xl font-bold text-gray-900">Selamat Datang</h2>
                <p className="text-sm text-gray-500 mt-1">Masuk ke akun E-Training KAN Anda</p>
            </div>

            {status && (
                <div className="mb-4 rounded-lg bg-green-50 border border-green-200 px-4 py-3 text-sm text-green-700">
                    {status}
                </div>
            )}

            <form onSubmit={submit} className="space-y-5">
                <div>
                    <InputLabel htmlFor="username" value="Username" className="text-sm font-medium text-gray-700" />
                    <TextInput
                        id="username"
                        type="text"
                        name="username"
                        value={data.username}
                        className="mt-1.5 block w-full rounded-xl border-gray-200 bg-gray-50 px-4 py-3 text-sm focus:border-navy-500 focus:ring-navy-500 transition-colors"
                        autoComplete="username"
                        isFocused={true}
                        onChange={(e) => setData('username', e.target.value)}
                        placeholder="Masukkan username Anda"
                    />
                    <InputError message={errors.username} className="mt-1.5" />
                </div>

                <div>
                    <InputLabel htmlFor="password" value="Kata Sandi" className="text-sm font-medium text-gray-700" />
                    <div className="relative mt-1.5">
                        <TextInput
                            id="password"
                            type={showPassword ? 'text' : 'password'}
                            name="password"
                            value={data.password}
                            className="block w-full rounded-xl border-gray-200 bg-gray-50 px-4 py-3 pr-10 text-sm focus:border-navy-500 focus:ring-navy-500 transition-colors"
                            autoComplete="current-password"
                            onChange={(e) => setData('password', e.target.value)}
                            placeholder="••••••••"
                        />
                        <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                        >
                            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                    </div>
                    <InputError message={errors.password} className="mt-1.5" />
                </div>

                <div>
                    <InputLabel htmlFor="captcha" value="Kode Keamanan (CAPTCHA)" className="text-sm font-medium text-gray-700" />
                    <div className="flex flex-col sm:flex-row gap-3 mt-1.5">
                        <div className="relative flex-shrink-0">
                            <img
                                src={`/captcha/flat?${captchaKey}`}
                                alt="CAPTCHA"
                                className="h-[46px] rounded-xl border border-gray-200 cursor-pointer object-cover"
                                onClick={refreshCaptcha}
                                title="Klik untuk memuat ulang kode"
                            />
                            <button
                                type="button"
                                onClick={refreshCaptcha}
                                className="absolute -top-2 -right-2 bg-white rounded-full p-1 shadow-md border border-gray-100 text-gray-500 hover:text-navy-600 transition-colors"
                                title="Muat ulang kode"
                            >
                                <RefreshCw className="w-3.5 h-3.5" />
                            </button>
                        </div>
                        <div className="flex-1">
                            <TextInput
                                id="captcha"
                                type="text"
                                name="captcha"
                                value={data.captcha}
                                className="block w-full rounded-xl border-gray-200 bg-gray-50 px-3 py-3 text-sm focus:border-navy-500 focus:ring-navy-500 transition-colors"
                                onChange={(e) => setData('captcha', e.target.value)}
                                placeholder="Masukkan kode di samping"
                            />
                        </div>
                    </div>
                    <InputError message={errors.captcha} className="mt-1.5" />
                </div>

                <div className="flex items-center justify-between">
                    <label className="flex items-center gap-2 cursor-pointer">
                        <Checkbox
                            name="remember"
                            checked={data.remember}
                            onChange={(e) => setData('remember', e.target.checked)}
                        />
                        <span className="text-sm text-gray-600">Ingat saya</span>
                    </label>

                    <span className="text-sm text-gray-400">
                        Lupa sandi? <span className="text-navy-600 font-medium">Hubungi Admin</span>
                    </span>
                </div>

                <button
                    type="submit"
                    disabled={processing}
                    className="w-full btn-primary py-3 rounded-xl text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    <LogIn className="w-4 h-4" />
                    {processing ? 'Memproses...' : 'Masuk'}
                </button>

                <p className="text-center text-sm text-gray-400 mt-2">
                    Akun diberikan oleh Administrator.
                </p>
            </form>
        </GuestLayout>
    );
}
