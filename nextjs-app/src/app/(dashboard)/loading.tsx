'use client'

export default function Loading() {
    return (
        <div className="flex h-[calc(100vh-12rem)] w-full flex-col items-center justify-center gap-6 animate-fade-in">
            <div className="relative flex items-center justify-center">
                {/* Premium, high-end geometric spinning ring */}
                <div className="h-12 w-12 rounded-full border-[3px] border-slate-100 border-t-amber-500 animate-spin"></div>
            </div>
            
            {/* Elegant clinical tracking typography */}
            <div className="flex flex-col items-center gap-1.5 text-center">
                <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500">
                    Loading System
                </span>
                <span className="text-sm font-medium text-slate-600 dark:text-slate-300">
                    กำลังโหลดข้อมูลระบบ กรุณารอสักครู่
                </span>
            </div>

            {/* Shimmering minimal loading line indicator */}
            <div className="h-0.5 w-24 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                <div className="h-full w-full rounded-full bg-gradient-to-r from-amber-400 via-amber-500 to-amber-600 animate-shimmer" style={{ backgroundSize: '200% 100%' }}></div>
            </div>
        </div>
    )
}
