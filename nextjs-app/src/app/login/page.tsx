'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'
import { Eye, EyeOff, LogIn } from 'lucide-react'
import { useAuthStore } from '@/stores/auth-store'
import { loginSchema, type LoginInput } from '@/lib/validations/auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export default function LoginPage() {
    const [showPassword, setShowPassword] = useState(false)
    const [isLoading, setIsLoading] = useState(false)
    const router = useRouter()
    const { login } = useAuthStore()

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
        <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-4">
            <div className="absolute inset-0 bg-[url('/grid.svg')] bg-center opacity-20" />

            <Card className="relative w-full max-w-md border-0 bg-white/10 backdrop-blur-xl">
                <CardHeader className="space-y-4 text-center">
                    <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-pink-500 to-purple-600 shadow-lg shadow-pink-500/20">
                        <span className="text-2xl font-bold text-white">BC</span>
                    </div>
                    <div>
                        <CardTitle className="text-2xl font-bold text-white">
                            Beauty Clinic
                        </CardTitle>
                        <CardDescription className="text-slate-300">
                            ระบบบริหารจัดการคลินิกความงาม
                        </CardDescription>
                    </div>
                </CardHeader>

                <CardContent>
                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="username" className="text-slate-200">
                                ชื่อผู้ใช้ <span className="text-red-400">*</span>
                            </Label>
                            <Input
                                id="username"
                                placeholder="กรอกชื่อผู้ใช้"
                                autoComplete="username"
                                className="border-slate-600 bg-slate-800/50 text-white placeholder:text-slate-400"
                                aria-invalid={!!errors.username}
                                aria-describedby={errors.username ? "username-error" : undefined}
                                required
                                inputMode="email"
                                autoCapitalize="none"
                                {...register('username')}
                            />
                            {errors.username && (
                                <p id="username-error" className="text-sm text-red-400" role="alert">{errors.username.message}</p>
                            )}
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="password" className="text-slate-200">
                                รหัสผ่าน <span className="text-red-400">*</span>
                            </Label>
                            <div className="relative">
                                <Input
                                    id="password"
                                    type={showPassword ? 'text' : 'password'}
                                    placeholder="กรอกรหัสผ่าน"
                                    autoComplete="current-password"
                                    className="border-slate-600 bg-slate-800/50 pr-10 text-white placeholder:text-slate-400"
                                    aria-invalid={!!errors.password}
                                    aria-describedby={errors.password ? "password-error" : undefined}
                                    required
                                    {...register('password')}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                                    aria-label={showPassword ? "Hide password" : "Show password"}
                                    title={showPassword ? "Hide password" : "Show password"}
                                >
                                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                </button>
                            </div>
                            {errors.password && (
                                <p id="password-error" className="text-sm text-red-400" role="alert">{errors.password.message}</p>
                            )}
                        </div>

                        <Button
                            type="submit"
                            isLoading={isLoading}
                            className="w-full bg-gradient-to-r from-pink-500 to-purple-600 text-white hover:from-pink-600 hover:to-purple-700"
                        >
                            <div className="flex items-center gap-2">
                                <LogIn className="h-4 w-4" />
                                เข้าสู่ระบบ
                            </div>
                        </Button>
                    </form>

                    <div className="mt-6 text-center">
                        <p className="text-xs text-slate-400">
                            © 2025 Beauty Clinic Management System
                        </p>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
