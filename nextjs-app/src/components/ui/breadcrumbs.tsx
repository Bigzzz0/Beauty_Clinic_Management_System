'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { ChevronRight, Home } from 'lucide-react'
import { cn } from '@/lib/utils'

export function Breadcrumbs() {
    const pathname = usePathname()
    const segments = pathname.split('/').filter(Boolean)

    if (segments.length === 0 || (segments.length === 1 && segments[0] === 'dashboard')) {
        return null
    }

    return (
        <nav aria-label="Breadcrumb" className="mb-4 flex items-center text-sm text-muted-foreground">
            <ol className="flex items-center gap-2">
                <li>
                    <Link
                        href="/dashboard"
                        className="flex items-center text-amber-600 hover:text-amber-700 transition-colors"
                        aria-label="Home"
                    >
                        <Home className="h-4 w-4" />
                    </Link>
                </li>
                {segments.map((segment, index) => {
                    let href = `/${segments.slice(0, index + 1).join('/')}`
                    const isLast = index === segments.length - 1
                    const title = segment.charAt(0).toUpperCase() + segment.slice(1).replace(/-/g, ' ')

                    // Override empty parent routes like /receipt -> /transactions
                    if (segment === 'receipt') {
                        href = '/transactions'
                    }

                    // Skip "dashboard" segment in display if it's the first one (since we have the Home icon)
                    if (segment === 'dashboard') return null

                    return (
                        <li key={segment} className="flex items-center gap-2">
                            <ChevronRight className="h-4 w-4 text-slate-300" />
                            {isLast ? (
                                <span className="font-bold text-amber-600" aria-current="page">
                                    {title}
                                </span>
                            ) : (
                                <Link
                                    href={href}
                                    className="hover:text-foreground transition-colors"
                                >
                                    {title}
                                </Link>
                            )}
                        </li>
                    )
                })}
            </ol>
        </nav>
    )
}
