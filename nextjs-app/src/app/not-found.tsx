import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { FileQuestion } from 'lucide-react'

export default function NotFound() {
    return (
        <div className="flex h-screen w-full flex-col items-center justify-center bg-slate-50 text-center dark:bg-slate-900">
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800">
                <FileQuestion className="h-10 w-10 text-slate-400" />
            </div>
            <h2 className="mt-6 text-2xl font-semibold tracking-tight">404 - Page Not Found</h2>
            <p className="mt-2 text-muted-foreground">
                ขออภัย ไม่พบหน้าที่คุณต้องการ
            </p>
            <div className="mt-6">
                <Button asChild>
                    <Link href="/dashboard">
                        กลับสู่หน้าหลัก
                    </Link>
                </Button>
            </div>
        </div>
    )
}
