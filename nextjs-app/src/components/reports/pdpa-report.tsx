'use client'

import { useQuery } from '@tanstack/react-query'
import { useAuthStore } from '@/stores/auth-store'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { 
    ShieldCheck, ShieldAlert, Users, Phone, Calendar, 
    ChevronRight, Eye, UserX, CheckCircle, Info, Download
} from 'lucide-react'
import Link from 'next/link'
import { formatDateTime } from '@/lib/utils'

interface PdpaStats {
    totalPatients: number
    pdpaGranted: number
    pdpaPending: number
    marketingGranted: number
    marketingPending: number
    medicalGranted: number
    medicalPending: number
    anonymizedCount: number
}

interface PendingAppointment {
    appointment_id: number
    appointment_date: string
    customer_id: number
    hn_code: string
    full_name: string
    phone_number: string
    is_pdpa_granted: boolean
}

interface ApiResponse {
    stats: PdpaStats
    pendingPDPAAppointments: PendingAppointment[]
}

export default function PdpaReportTab() {
    const token = useAuthStore((s) => s.token)

    const { data, isLoading, error } = useQuery<ApiResponse>({
        queryKey: ['report-pdpa'],
        queryFn: async () => {
            const res = await fetch('/api/reports/pdpa', {
                headers: token ? { Authorization: `Bearer ${token}` } : {},
            })
            if (!res.ok) throw new Error('Failed to fetch PDPA compliance report')
            return res.json()
        }
    })

    const handleExport = () => {
        if (!data) return;

        const formatCSVCell = (val: any) => {
            const str = String(val ?? '');
            if (str.includes(',') || str.includes('"') || str.includes('\n')) {
                return `"${str.replace(/"/g, '""')}"`;
            }
            return str;
        };

        const stats = data.stats;
        const pdpaPercent = stats ? Math.round((stats.pdpaGranted / stats.totalPatients) * 100) : 0;
        const marketingPercent = stats ? Math.round((stats.marketingGranted / stats.totalPatients) * 100) : 0;
        const medicalPercent = stats ? Math.round((stats.medicalGranted / stats.totalPatients) * 100) : 0;

        const metadata = [
            ['รายงานความสอดคล้องทางกฎหมาย PDPA (PDPA Compliance Report)'],
            ['จำนวนคนไข้ทั้งหมด', `${stats?.totalPatients || 0} คน`],
            ['ยินยอมนโยบายความเป็นส่วนตัว (Privacy)', `${stats?.pdpaGranted || 0} คน (${pdpaPercent}%)`],
            ['รอดำเนินการความยินยอมความเป็นส่วนตัว', `${stats?.pdpaPending || 0} คน`],
            ['ยินยอมข้อมูลการตลาด (Marketing)', `${stats?.marketingGranted || 0} คน (${marketingPercent}%)`],
            ['รอดำเนินการความยินยอมการตลาด', `${stats?.marketingPending || 0} คน`],
            ['ยินยอมข้อมูลหัตถการการรักษา (Medical)', `${stats?.medicalGranted || 0} คน (${medicalPercent}%)`],
            ['รอดำเนินการความยินยอมหัตถการ', `${stats?.medicalPending || 0} คน`],
            ['บัญชีที่ขอลบ/ปกปิดตัวตน (Anonymized)', `${stats?.anonymizedCount || 0} ราย`],
            ['วันที่ดึงรายงาน', new Date().toLocaleString('th-TH')],
            [], // เว้นบรรทัด
        ];

        const metadataRows = metadata.map(row => row.map(formatCSVCell).join(','));
        const headers = ['วันเวลานัดหมาย', 'รหัสคนไข้ (HN)', 'ชื่อ-นามสกุล คนไข้', 'เบอร์โทรติดต่อ', 'สถานะความยินยอม PDPA'];
        const dataRows = (data.pendingPDPAAppointments || []).map(app => [
            app.appointment_date ? formatDateTime(app.appointment_date) : '-',
            app.hn_code,
            app.full_name,
            app.phone_number,
            app.is_pdpa_granted ? 'ยินยอมแล้ว' : 'ยังไม่เซ็นยินยอม'
        ]).map(row => row.map(formatCSVCell).join(','));

        const csvContent = [...metadataRows, headers.join(','), ...dataRows].join('\n');
        const bom = new Uint8Array([0xEF, 0xBB, 0xBF]);
        const blob = new Blob([bom, csvContent], { type: 'text/csv;charset=utf-8;' });

        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', `pdpa_compliance_report_${new Date().toISOString().split('T')[0]}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    if (isLoading) {
        return (
            <div className="space-y-6">
                <div className="grid gap-4 md:grid-cols-4">
                    {[...Array(4)].map((_, i) => (
                        <Skeleton key={i} className="h-32 rounded-xl" />
                    ))}
                </div>
                <Skeleton className="h-64 rounded-xl" />
            </div>
        )
    }

    if (error) {
        return (
            <div className="p-8 text-center text-red-500 bg-red-50 rounded-xl border border-red-100 flex flex-col items-center gap-2">
                <ShieldAlert className="h-10 w-10 text-red-500" />
                <p className="font-bold">เกิดข้อผิดพลาดในการดึงข้อมูลรายงาน PDPA</p>
                <p className="text-sm">{(error as Error).message}</p>
            </div>
        )
    }

    const stats = data?.stats
    const pendingAppointments = data?.pendingPDPAAppointments || []

    // Calculate percentages
    const pdpaPercent = stats ? Math.round((stats.pdpaGranted / stats.totalPatients) * 100) : 0
    const marketingPercent = stats ? Math.round((stats.marketingGranted / stats.totalPatients) * 100) : 0
    const medicalPercent = stats ? Math.round((stats.medicalGranted / stats.totalPatients) * 100) : 0

    return (
        <div className="space-y-6">
            {/* Stat Cards with progress bars */}
            <div className="grid gap-4 md:grid-cols-4">
                {/* Card 1: PDPA Privacy */}
                <Card className="hover:shadow-md transition-shadow">
                    <CardHeader className="p-4 pb-2 flex flex-row items-center justify-between">
                        <CardTitle className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                            ความยินยอม PDPA (Privacy)
                        </CardTitle>
                        <ShieldCheck className="h-5 w-5 text-emerald-500 shrink-0" />
                    </CardHeader>
                    <CardContent className="p-4 pt-0 space-y-2">
                        <div className="flex items-baseline justify-between">
                            <span className="text-2xl font-bold text-slate-800">{stats?.pdpaGranted} / {stats?.totalPatients}</span>
                            <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">{pdpaPercent}%</span>
                        </div>
                        <div className="w-full bg-slate-100 rounded-full h-2">
                            <div className="bg-emerald-500 h-2 rounded-full transition-all duration-500" style={{ width: `${pdpaPercent}%` }} />
                        </div>
                        <p className="text-[10px] text-slate-400 font-medium">รอดำเนินการยินยอม: {stats?.pdpaPending} ราย</p>
                    </CardContent>
                </Card>

                {/* Card 2: Marketing Consent */}
                <Card className="hover:shadow-md transition-shadow">
                    <CardHeader className="p-4 pb-2 flex flex-row items-center justify-between">
                        <CardTitle className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                            ความยินยอมทางโฆษณา (Marketing)
                        </CardTitle>
                        <Users className="h-5 w-5 text-blue-500 shrink-0" />
                    </CardHeader>
                    <CardContent className="p-4 pt-0 space-y-2">
                        <div className="flex items-baseline justify-between">
                            <span className="text-2xl font-bold text-slate-800">{stats?.marketingGranted} / {stats?.totalPatients}</span>
                            <span className="text-xs font-semibold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">{marketingPercent}%</span>
                        </div>
                        <div className="w-full bg-slate-100 rounded-full h-2">
                            <div className="bg-blue-500 h-2 rounded-full transition-all duration-500" style={{ width: `${marketingPercent}%` }} />
                        </div>
                        <p className="text-[10px] text-slate-400 font-medium">รอดำเนินการยินยอม: {stats?.marketingPending} ราย</p>
                    </CardContent>
                </Card>

                {/* Card 3: Medical Treatment Consent */}
                <Card className="hover:shadow-md transition-shadow">
                    <CardHeader className="p-4 pb-2 flex flex-row items-center justify-between">
                        <CardTitle className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                            ความยินยอมหัตถการ (Medical)
                        </CardTitle>
                        <ShieldCheck className="h-5 w-5 text-indigo-500 shrink-0" />
                    </CardHeader>
                    <CardContent className="p-4 pt-0 space-y-2">
                        <div className="flex items-baseline justify-between">
                            <span className="text-2xl font-bold text-slate-800">{stats?.medicalGranted} / {stats?.totalPatients}</span>
                            <span className="text-xs font-semibold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full">{medicalPercent}%</span>
                        </div>
                        <div className="w-full bg-slate-100 rounded-full h-2">
                            <div className="bg-indigo-500 h-2 rounded-full transition-all duration-500" style={{ width: `${medicalPercent}%` }} />
                        </div>
                        <p className="text-[10px] text-slate-400 font-medium">รอดำเนินการยินยอม: {stats?.medicalPending} ราย</p>
                    </CardContent>
                </Card>

                {/* Card 4: Anonymized Accounts */}
                <Card className="hover:shadow-md transition-shadow">
                    <CardHeader className="p-4 pb-2 flex flex-row items-center justify-between">
                        <CardTitle className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                            บัญชีปกปิดตัวตน (Anonymized)
                        </CardTitle>
                        <UserX className="h-5 w-5 text-slate-500 shrink-0" />
                    </CardHeader>
                    <CardContent className="p-4 pt-0 space-y-2">
                        <div className="flex items-baseline justify-between">
                            <span className="text-2xl font-bold text-slate-800">{stats?.anonymizedCount}</span>
                            <span className="text-xs font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">ลบแล้ว</span>
                        </div>
                        <p className="text-xs text-slate-400 pt-3">จำนวนคนไข้ที่ใช้สิทธิ์ Right to be Forgotten (ลบข้อมูลหลักแต่ประวัติธุรกรรมยังคงไว้)</p>
                    </CardContent>
                </Card>
            </div>

            {/* Warning banner/compliance tips */}
            <div className="p-4 bg-amber-50 border border-amber-200 text-amber-800 rounded-xl flex items-start gap-3">
                <Info className="h-5 w-5 shrink-0 mt-0.5 text-amber-600" />
                <div className="text-xs space-y-1">
                    <h5 className="font-bold text-amber-900">เกร็ดความรู้ในการปฏิบัติตามกฎหมาย PDPA</h5>
                    <p>คลินิกมีหน้าที่ตามกฎหมายที่จะต้องได้รับความยินยอมก่อนการจัดเก็บและประมวลผลข้อมูลคนไข้ทุกราย โดยเฉพาะข้อมูลสุขภาพที่อ่อนไหว (Sensitive Data) หากคนไข้รายใดยังไม่มีการกดให้สิทธิ์ยินยอม โปรดติดต่อให้คนไข้ทำรายการผ่านแท็บ **PDPA & Consent** ในหน้า OPD Card เมื่อคนไข้เดินทางมาที่ร้าน</p>
                </div>
            </div>

            {/* Upcoming Appointments lacking Consent */}
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
                    <div className="space-y-1">
                        <CardTitle className="text-base flex items-center gap-2">
                            <ShieldAlert className="h-5 w-5 text-amber-500" />
                            รายชื่อคนไข้ที่มีนัดหมายใน 7 วันข้างหน้า แต่ยังไม่ได้เซ็นยินยอม PDPA
                        </CardTitle>
                        <CardDescription>
                            โปรดให้คนไข้เซ็นเอกสารยินยอมความปลอดภัยทันทีเมื่อมาถึงคลินิก
                        </CardDescription>
                    </div>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={handleExport}
                        disabled={!data || pendingAppointments.length === 0}
                        className="gap-2 rounded-xl transition-all hover:-translate-y-0.5 hover:shadow-sm"
                    >
                        <Download className="h-4 w-4" />
                        Export CSV
                    </Button>
                </CardHeader>
                <CardContent className="p-0">
                    {pendingAppointments.length === 0 ? (
                        <div className="py-16 text-center text-slate-500">
                            <CheckCircle className="h-12 w-12 mx-auto mb-3 text-emerald-500 opacity-80" />
                            <p className="font-bold">ข้อมูลเป็นไปตามเงื่อนไขทางกฎหมาย 100%</p>
                            <p className="text-xs text-slate-400 mt-1">คนไข้ที่มีนัดหมายล่วงหน้าทั้งหมดได้กดยินยอมนโยบายความเป็นส่วนตัวเรียบร้อยแล้ว</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow className="bg-slate-50">
                                        <TableHead className="w-[180px] text-xs font-bold uppercase text-slate-500">วันเวลานัดหมาย</TableHead>
                                        <TableHead className="w-[120px] text-xs font-bold uppercase text-slate-500">รหัสคนไข้</TableHead>
                                        <TableHead className="text-xs font-bold uppercase text-slate-500">ชื่อ-นามสกุล คนไข้</TableHead>
                                        <TableHead className="text-xs font-bold uppercase text-slate-500">เบอร์โทรติดต่อ</TableHead>
                                        <TableHead className="text-xs font-bold uppercase text-slate-500 text-center">ความยินยอม PDPA</TableHead>
                                        <TableHead className="w-[100px]"></TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {pendingAppointments.map((app) => (
                                        <TableRow key={app.appointment_id} className="hover:bg-slate-50/50 transition-colors">
                                            <TableCell className="font-medium text-xs text-slate-600">
                                                {app.appointment_date ? formatDateTime(app.appointment_date) : '-'}
                                            </TableCell>
                                            <TableCell className="font-mono text-xs font-semibold text-slate-500">{app.hn_code}</TableCell>
                                            <TableCell className="font-semibold text-sm text-slate-800">{app.full_name}</TableCell>
                                            <TableCell className="font-mono text-xs text-slate-500 flex items-center gap-1">
                                                <Phone className="h-3 w-3 text-slate-400" />
                                                {app.phone_number}
                                            </TableCell>
                                            <TableCell className="text-center">
                                                <Badge variant="destructive" className="bg-red-50 text-red-700 border-red-100 gap-1 rounded-full text-[10px]">
                                                    <ShieldAlert className="h-3 w-3 text-red-500" />
                                                    ยังไม่เซ็นยินยอม
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-center">
                                                <Link href={`/patients/${app.customer_id}`}>
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        className="h-8 text-blue-600 hover:text-blue-700 hover:bg-blue-50 gap-1 rounded-lg"
                                                    >
                                                        <Eye className="h-3.5 w-3.5" />
                                                        เปิดโปรไฟล์
                                                    </Button>
                                                </Link>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}
