'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'
import { Eye, EyeOff, LogIn, Loader2, Sparkles, Shield, Heart } from 'lucide-react'
import Image from 'next/image'
import { useAuthStore } from '@/stores/auth-store'
import { loginSchema, type LoginInput } from '@/lib/validations/auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export default function LoginPage() {
    const [showPassword, setShowPassword] = useState(false)
    const [isLoading, setIsLoading] = useState(false)
    const [currentTime, setCurrentTime] = useState('')
    const router = useRouter()
    const { login } = useAuthStore()

    useEffect(() => {
        const updateTime = () => {
            const now = new Date()
            setCurrentTime(now.toLocaleTimeString('th-TH', {
                hour: '2-digit', minute: '2-digit',
                timeZone: 'Asia/Bangkok'
            }))
        }
        updateTime()
        const interval = setInterval(updateTime, 1000)
        return () => clearInterval(interval)
    }, [])

    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm<LoginInput>({
        resolver: zodResolver(loginSchema),
    })

    const onSubmit = async (data: LoginInput) => {
        setIsLoading(true)
        try {
            const response = await fetch('/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data),
            })

            const result = await response.json()

            if (!response.ok) {
                throw new Error(result.error || 'เข้าสู่ระบบไม่สำเร็จ')
            }

            login(result.user, result.token)
            toast.success('เข้าสู่ระบบสำเร็จ')
            router.push('/dashboard')
        } catch (error) {
            toast.error(error instanceof Error ? error.message : 'เกิดข้อผิดพลาด')
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <div className="flex min-h-screen">
            {/* ── Left Brand Panel ── */}
            <div className="hidden lg:flex lg:w-[45%] relative flex-col items-center justify-center overflow-hidden"
                style={{ background: 'linear-gradient(145deg, #78350f 0%, #b45309 35%, #d97706 65%, #f59e0b 100%)' }}>

                {/* Decorative blobs */}
                <div className="absolute -top-24 -left-24 w-72 h-72 rounded-full opacity-20 animate-float"
                    style={{ background: 'radial-gradient(circle, #fbbf24, transparent)' }} />
                <div className="absolute bottom-0 right-0 w-96 h-96 rounded-full opacity-10 animate-float"
                    style={{ animationDelay: '1s', background: 'radial-gradient(circle, #fef3c7, transparent)' }} />
                <div className="absolute top-1/2 -right-12 w-48 h-48 rounded-full opacity-15 animate-float"
                    style={{ animationDelay: '2s', background: 'radial-gradient(circle, #fde68a, transparent)' }} />

                {/* Grid pattern overlay */}
                <div className="absolute inset-0 opacity-5"
                    style={{ backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)', backgroundSize: '32px 32px' }} />

                {/* Content */}
                <div className="relative z-10 flex flex-col items-center gap-8 px-12 text-center animate-fade-in">
                    {/* Logo */}
                    <div className="flex h-24 w-24 items-center justify-center rounded-2xl overflow-hidden shadow-2xl shadow-amber-950/40 ring-4 ring-white/20">
                        <Image src="/JinLogo.jpg" alt="Beauty Clinic" width={96} height={96} className="w-full h-full object-contain" />
                    </div>

                    <div className="space-y-3">
                        <h1 className="text-4xl font-bold text-white tracking-tight">Beauty Clinic</h1>
                        <p className="text-amber-100 text-lg font-medium">ระบบบริหารจัดการคลินิกความงาม</p>
                        <p className="text-amber-200/80 text-sm">Professional Clinic Management System</p>
                    </div>

                    {/* Feature badges */}
                    <div className="flex flex-col gap-3 w-full max-w-xs animate-fade-in-up-delay-2">
                        {[
                            { icon: Shield, text: 'ระบบปลอดภัยระดับ Enterprise' },
                            { icon: Heart, text: 'ดูแลลูกค้าอย่างมืออาชีพ' },
                            { icon: Sparkles, text: 'ข้อมูลครบ ใช้งานง่าย' },
                        ].map(({ icon: Icon, text }) => (
                            <div key={text} className="flex items-center gap-3 rounded-xl bg-white/10 backdrop-blur-sm px-4 py-3 text-left">
                                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white/20">
                                    <Icon className="h-4 w-4 text-white" />
                                </div>
                                <span className="text-sm text-white/90 font-medium">{text}</span>
                            </div>
                        ))}
                    </div>

                    {/* Clock */}
                    <div className="mt-4 text-5xl font-mono font-bold text-white/60 tracking-widest tabular-nums">
                        {currentTime}
                    </div>
                </div>

                {/* Footer */}
                <p className="absolute bottom-6 text-xs text-amber-200/50">© 2025 Beauty Clinic Management System</p>
            </div>

            {/* ── Right Form Panel ── */}
            <div className="flex flex-1 flex-col items-center justify-center bg-slate-50 p-8">
                {/* Mobile logo */}
                <div className="mb-8 flex lg:hidden flex-col items-center gap-3">
                    <div className="flex h-14 w-14 items-center justify-center rounded-xl overflow-hidden shadow-lg shadow-amber-200/60">
                        <Image src="/JinLogo.jpg" alt="Beauty Clinic" width={56} height={56} className="w-full h-full object-contain" />
                    </div>
                    <h1 className="text-xl font-bold text-slate-800">Beauty Clinic</h1>
                </div>

                <div className="w-full max-w-sm animate-fade-in-up">
                    {/* Heading */}
                    <div className="mb-8 space-y-1">
                        <h2 className="text-2xl font-bold text-slate-800">ยินดีต้อนรับ 👋</h2>
                        <p className="text-slate-500 text-sm">กรุณาเข้าสู่ระบบเพื่อดำเนินการต่อ</p>
                    </div>

                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                        {/* Username */}
                        <div className="space-y-1.5">
                            <Label htmlFor="username" className="text-slate-700 font-medium">
                                ชื่อผู้ใช้ <span className="text-red-400">*</span>
                            </Label>
                            <Input
                                id="username"
                                placeholder="กรอกชื่อผู้ใช้"
                                autoComplete="username"
                                aria-invalid={!!errors.username}
                                aria-describedby={errors.username ? 'username-error' : undefined}
                                required
                                inputMode="email"
                                autoCapitalize="none"
                                className="h-11 bg-white border-slate-200 focus:border-amber-400 focus:ring-amber-400/20 transition-all duration-200 placeholder:text-slate-300"
                                {...register('username')}
                            />
                            {errors.username && (
                                <p id="username-error" className="text-xs text-red-500 animate-fade-in" role="alert">
                                    {errors.username.message}
                                </p>
                            )}
                        </div>

                        {/* Password */}
                        <div className="space-y-1.5">
                            <Label htmlFor="password" className="text-slate-700 font-medium">
                                รหัสผ่าน <span className="text-red-400">*</span>
                            </Label>
                            <div className="relative">
                                <Input
                                    id="password"
                                    type={showPassword ? 'text' : 'password'}
                                    placeholder="กรอกรหัสผ่าน"
                                    autoComplete="current-password"
                                    className="h-11 pr-11 bg-white border-slate-200 focus:border-amber-400 focus:ring-amber-400/20 transition-all duration-200 placeholder:text-slate-300"
                                    aria-invalid={!!errors.password}
                                    aria-describedby={errors.password ? 'password-error' : undefined}
                                    required
                                    {...register('password')}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-amber-600 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 rounded"
                                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                                >
                                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                </button>
                            </div>
                            {errors.password && (
                                <p id="password-error" className="text-xs text-red-500 animate-fade-in" role="alert">
                                    {errors.password.message}
                                </p>
                            )}
                        </div>

                        {/* Submit */}
                        <Button
                            type="submit"
                            disabled={isLoading}
                            className="w-full h-11 mt-2 font-semibold text-sm transition-all duration-200 shadow-lg shadow-amber-500/30"
                            style={{ background: isLoading ? undefined : 'linear-gradient(135deg, #d97706, #f59e0b)' }}
                        >
                            <div className="flex items-center justify-center gap-2">
                                {isLoading
                                    ? <><Loader2 className="h-4 w-4 animate-spin" /> กำลังเข้าสู่ระบบ...</>
                                    : <><LogIn className="h-4 w-4" /> เข้าสู่ระบบ</>
                                }
                            </div>
                        </Button>
                    </form>

                    {/* Divider */}
                    <div className="mt-8 pt-6 border-t border-slate-100 text-center">
                        <p className="text-xs text-slate-400">
                            Beauty Clinic Management System v2.0
                        </p>
                    </div>
                </div>
            </div>
        </div>
    )
}
