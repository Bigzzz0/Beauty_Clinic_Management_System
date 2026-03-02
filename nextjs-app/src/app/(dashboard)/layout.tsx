import { DashboardLayout } from '@/components/layout/dashboard-layout'
import { IdleTimeout } from '@/components/idle-timeout'

export default function DashboardRootLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <>
            <IdleTimeout />
            <DashboardLayout>{children}</DashboardLayout>
        </>
    )
}
