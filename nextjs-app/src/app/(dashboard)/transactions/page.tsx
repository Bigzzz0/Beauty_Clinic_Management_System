'use client'

import { useState } from 'react'
import {
    FileText, Search, Eye, Printer, Ban, ChevronLeft, ChevronRight,
    CheckCircle, Clock, XCircle, User, Phone, Download
} from 'lucide-react'
import Link from 'next/link'
import { EmptyState } from '@/components/ui/empty-state'
import {
    HoverCard,
    HoverCardContent,
    HoverCardTrigger,
} from '@/components/ui/hover-card'
import { toast } from 'sonner'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuthStore } from '@/stores/auth-store'
import { formatCurrency, formatDateTime } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table'
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from '@/components/ui/dialog'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog'

interface Transaction {
    transaction_id: number
    transaction_date: string
    total_amount: number
    discount: number
    net_amount: number
    remaining_balance: number
    payment_status: 'PAID' | 'PARTIAL' | 'UNPAID' | 'CANCELLED' | 'VOIDED'
    customer: {
        customer_id: number
        hn_code: string
        first_name: string
        last_name: string
        phone_number?: string
    }
    transaction_item: Array<{
        item_id: number
        qty: number
        unit_price: number
        subtotal: number
        product?: { product_name: string; category?: string }
        course?: { course_name: string }
    }>
    payment_log: Array<{
        payment_id: number
        amount_paid: number
        payment_method: string
        payment_date: string
    }>
}

const getStatusBadge = (status: string) => {
    switch (status) {
        case 'PAID':
            return <Badge className="bg-green-100 text-green-700"><CheckCircle className="h-3 w-3 mr-1" />ชำระแล้ว</Badge>
        case 'PARTIAL':
            return <Badge className="bg-amber-100 text-amber-700"><Clock className="h-3 w-3 mr-1" />ค้างชำระ</Badge>
        case 'UNPAID':
            return <Badge className="bg-red-100 text-red-700"><Clock className="h-3 w-3 mr-1" />ยังไม่ชำระ</Badge>
        case 'VOIDED':
            return <Badge className="bg-slate-100 text-slate-700"><XCircle className="h-3 w-3 mr-1" />ยกเลิก</Badge>
        default:
            return <Badge variant="secondary">{status}</Badge>
    }
}

export default function TransactionsPage() {
    const token = useAuthStore((s) => s.token)
    const isAdmin = useAuthStore((s) => s.isAdmin)
    const queryClient = useQueryClient()

    const [search, setSearch] = useState('')
    const [status, setStatus] = useState('')
    const [page, setPage] = useState(1)
    const [selectedTx, setSelectedTx] = useState<Transaction | null>(null)
    const [voidTxId, setVoidTxId] = useState<number | null>(null)
    const limit = 20

    const { data, isLoading } = useQuery<{ data: Transaction[]; meta: { total: number; totalPages: number } }>({
        queryKey: ['transactions', { search, status, page }],
        queryFn: async () => {
            const params = new URLSearchParams()
            params.set('page', page.toString())
            params.set('limit', limit.toString())
            if (search) params.set('search', search)
            if (status) params.set('status', status)

            const res = await fetch(`/api/transactions?${params}`, {
                headers: token ? { Authorization: `Bearer ${token}` } : {},
            })
            if (!res.ok) throw new Error('Failed to fetch')
            return res.json()
        },
    })

    const handleExport = async () => {
        try {
            toast.loading('กำลังเตรียมข้อมูลประวัติบิล...');
            const res = await fetch('/api/export?type=transactions', {
                headers: token ? { Authorization: `Bearer ${token}` } : {},
            });
            if (!res.ok) {
                if (res.status === 403) throw new Error('ไม่มีสิทธิ์เข้าถึง: เฉพาะผู้ดูแลระบบ (Admin) เท่านั้น');
                throw new Error('ไม่สามารถเชื่อมต่อข้อมูลส่งออกได้');
            }
            const blob = await res.blob();
            const link = document.createElement('a');
            const url = URL.createObjectURL(blob);
            link.setAttribute('href', url);
            link.setAttribute('download', `transactions_report_${new Date().toISOString().split('T')[0]}.csv`);
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            toast.dismiss();
            toast.success('ส่งออกข้อมูลประวัติบิลสำเร็จ');
        } catch (error: any) {
            toast.dismiss();
            toast.error(error.message || 'เกิดข้อผิดพลาดในการส่งออก');
        }
    };

    const voidMutation = useMutation({
        mutationFn: async (id: number) => {
            const res = await fetch(`/api/transactions/${id}`, {
                method: 'DELETE',
                headers: token ? { Authorization: `Bearer ${token}` } : {},
            })
            if (!res.ok) {
                const err = await res.json()
                throw new Error(err.error || 'Failed')
            }
            return res.json()
        },
        onSuccess: () => {
            toast.success('ยกเลิกบิลสำเร็จ')
            queryClient.invalidateQueries({ queryKey: ['transactions'] })
            setVoidTxId(null)
        },
        onError: (error: Error) => {
            toast.error(error.message || 'เกิดข้อผิดพลาด')
        },
    })

    const transactions = data?.data || []
    const totalPages = data?.meta?.totalPages || 1

    const handlePrint = (tx: Transaction) => {
        // Open print dialog
        toast.info('กำลังเปิดหน้าพิมพ์...')
        // In real implementation, open receipt in new window for printing
        window.open(`/receipt/${tx.transaction_id}`, '_blank')
    }

    return (
        <div className="space-y-6 animate-fade-in">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold flex items-center gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 shadow-sm shadow-amber-200">
                            <FileText className="h-5 w-5 text-white" />
                        </div>
                        ประวัติบิล
                    </h1>
                    <p className="text-muted-foreground text-sm mt-1 ml-0.5">รายการธุรกรรมทั้งหมด</p>
                </div>
                {isAdmin() && (
                    <Button
                        variant="outline"
                        onClick={handleExport}
                        className="gap-2 rounded-xl transition-all hover:-translate-y-0.5 hover:shadow-sm"
                    >
                        <Download className="h-4 w-4" />
                        Export CSV
                    </Button>
                )}
            </div>

            {/* Filters */}
            <Card>
                <CardContent className="p-4">
                    <div className="flex flex-col gap-4 md:flex-row md:items-center">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                            <Input
                                placeholder="ค้นหาเลขบิล / ชื่อลูกค้า / HN..."
                                value={search}
                                aria-label="Search transactions"
                                onChange={(e) => { setSearch(e.target.value); setPage(1) }}
                                className="pl-10"
                            />
                        </div>
                        <Select value={status} onValueChange={(v) => { setStatus(v); setPage(1) }}>
                            <SelectTrigger className="w-full md:w-48">
                                <SelectValue placeholder="ทุกสถานะ" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">ทุกสถานะ</SelectItem>
                                <SelectItem value="PAID">ชำระแล้ว</SelectItem>
                                <SelectItem value="PARTIAL">ค้างชำระ</SelectItem>
                                <SelectItem value="UNPAID">ยังไม่ชำระ</SelectItem>
                                <SelectItem value="VOIDED">ยกเลิก</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </CardContent>
            </Card>

            {/* Transactions Table */}
            <Card>
                <CardHeader>
                    <CardTitle>รายการบิล ({data?.meta?.total || 0})</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="rounded-xl border overflow-hidden">
                        <Table>
                            <TableHeader>
                                <TableRow className="bg-slate-50 hover:bg-slate-50">
                                    <TableHead className="text-xs font-semibold uppercase tracking-wide text-slate-500">เลขบิล</TableHead>
                                    <TableHead className="text-xs font-semibold uppercase tracking-wide text-slate-500">วันที่</TableHead>
                                    <TableHead className="text-xs font-semibold uppercase tracking-wide text-slate-500">ลูกค้า</TableHead>
                                    <TableHead className="text-right text-xs font-semibold uppercase tracking-wide text-slate-500">ยอดรวม</TableHead>
                                    <TableHead className="text-xs font-semibold uppercase tracking-wide text-slate-500">สถานะ</TableHead>
                                    <TableHead className="w-32"></TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {isLoading ? (
                                    [...Array(5)].map((_, i) => (
                                        <TableRow key={i}>
                                            <TableCell colSpan={6}>
                                                <div className="h-12 animate-pulse rounded bg-slate-100" />
                                            </TableCell>
                                        </TableRow>
                                    ))
                                ) : transactions.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={6} className="h-64 text-center">
                                            <EmptyState
                                                icon={FileText}
                                                title="ไม่พบรายการบิล"
                                                description={search || status ? "ไม่พบรายการที่ตรงกับเงื่อนไขการค้นหา" : "ยังไม่มีประวัติการทำรายการ"}
                                                action={
                                                    <Link href="/pos">
                                                        <Button variant="outline" className="mt-4">
                                                            ไปที่หน้าขาย (POS)
                                                        </Button>
                                                    </Link>
                                                }
                                            />
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    transactions.map((tx) => (
                                        <TableRow key={tx.transaction_id} className="hover:bg-amber-50/30 transition-colors">
                                            <TableCell>
                                                <span className="font-mono font-medium text-slate-700">#{tx.transaction_id}</span>
                                            </TableCell>
                                            <TableCell>
                                                <span className="text-sm">{formatDateTime(tx.transaction_date)}</span>
                                            </TableCell>
                                            <TableCell>
                                                <HoverCard openDelay={200}>
                                                    <HoverCardTrigger asChild>
                                                        <div className="cursor-pointer hover:bg-slate-50 p-1 -ml-1 rounded transition-colors inline-block w-full">
                                                            <p className="font-medium text-primary decoration-primary/30 hover:underline underline-offset-4">{tx.customer.first_name} {tx.customer.last_name}</p>
                                                            <p className="text-xs text-muted-foreground">{tx.customer.hn_code}</p>
                                                        </div>
                                                    </HoverCardTrigger>
                                                    <HoverCardContent className="w-80 p-4" align="start">
                                                        <div className="flex justify-between space-x-4">
                                                            <div className="space-y-1">
                                                                <h4 className="text-sm font-semibold flex items-center gap-1">
                                                                    <User className="w-4 h-4 text-primary" />
                                                                    {tx.customer.first_name} {tx.customer.last_name}
                                                                </h4>
                                                                <p className="text-sm text-muted-foreground flex items-center gap-1">
                                                                    <span>HN:</span> <span className="font-mono">{tx.customer.hn_code}</span>
                                                                </p>
                                                                {tx.customer.phone_number && (
                                                                    <div className="flex items-center pt-2">
                                                                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                                                                            <Phone className="w-3 h-3" />
                                                                            {tx.customer.phone_number}
                                                                        </span>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </HoverCardContent>
                                                </HoverCard>
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <span className="font-medium">{formatCurrency(Number(tx.net_amount))}</span>
                                            </TableCell>
                                            <TableCell>
                                                {getStatusBadge(tx.payment_status)}
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex gap-1">
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        aria-label="ดูรายละเอียดบิล"
                                                        onClick={() => setSelectedTx(tx)}
                                                    >
                                                        <Eye className="h-4 w-4" />
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        aria-label="พิมพ์ใบเสร็จ"
                                                        onClick={() => handlePrint(tx)}
                                                    >
                                                        <Printer className="h-4 w-4" />
                                                    </Button>
                                                    {isAdmin() && tx.payment_status !== 'VOIDED' && (
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="text-red-500"
                                                            aria-label="ยกเลิกบิล"
                                                            onClick={() => setVoidTxId(tx.transaction_id)}
                                                        >
                                                            <Ban className="h-4 w-4" />
                                                        </Button>
                                                    )}
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </div>

                    {/* Pagination */}
                    {totalPages > 1 && (
                        <div className="flex items-center justify-between mt-4">
                            <p className="text-sm text-muted-foreground">
                                หน้า {page} จาก {totalPages}
                            </p>
                            <div className="flex gap-2">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    disabled={page <= 1}
                                    onClick={() => setPage(page - 1)}
                                    aria-label="หน้าก่อน"
                                >
                                    <ChevronLeft className="h-4 w-4" />
                                </Button>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    disabled={page >= totalPages}
                                    onClick={() => setPage(page + 1)}
                                    aria-label="หน้าถัดไป"
                                >
                                    <ChevronRight className="h-4 w-4" />
                                </Button>
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Transaction Detail Dialog */}
            <Dialog open={!!selectedTx} onOpenChange={(open) => !open && setSelectedTx(null)}>
                <DialogContent className="max-w-lg">
                    <DialogHeader>
                        <DialogTitle>รายละเอียดบิล #{selectedTx?.transaction_id}</DialogTitle>
                        <DialogDescription className="sr-only">
                            รายละเอียดเต็มของบิลสำหรับ{selectedTx?.customer.first_name} {selectedTx?.customer.last_name}
                        </DialogDescription>
                    </DialogHeader>

                    {selectedTx && (
                        <div className="space-y-4">
                            {/* Customer Card */}
                            <div className="flex items-center gap-3 p-3 rounded-xl bg-amber-50 border border-amber-100">
                                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-amber-200 text-sm font-bold text-amber-800">
                                    {selectedTx.customer.first_name.charAt(0)}
                                </div>
                                <div>
                                    <p className="font-semibold text-slate-800">{selectedTx.customer.first_name} {selectedTx.customer.last_name}</p>
                                    <p className="text-xs text-amber-700 font-mono">{selectedTx.customer.hn_code}</p>
                                </div>
                            </div>

                            {/* Items */}
                            <div>
                                <p className="text-sm font-medium mb-2">รายการ</p>
                                <div className="space-y-2">
                                    {selectedTx.transaction_item.map((item) => (
                                        <div key={item.item_id} className="flex justify-between text-sm">
                                            <span>
                                                {item.product?.product_name || item.course?.course_name} x{item.qty}
                                            </span>
                                            <span>{formatCurrency(Number(item.subtotal))}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Summary */}
                            <div className="space-y-2 pt-2 border-t">
                                <div className="flex justify-between text-sm">
                                    <span>ยอดรวม</span>
                                    <span>{formatCurrency(Number(selectedTx.total_amount))}</span>
                                </div>
                                {Number(selectedTx.discount) > 0 && (
                                    <div className="flex justify-between text-sm text-red-600">
                                        <span>ส่วนลด</span>
                                        <span>-{formatCurrency(Number(selectedTx.discount))}</span>
                                    </div>
                                )}
                                <div className="flex justify-between font-bold">
                                    <span>สุทธิ</span>
                                    <span>{formatCurrency(Number(selectedTx.net_amount))}</span>
                                </div>
                            </div>

                            {/* Payments */}
                            {selectedTx.payment_log.length > 0 && (
                                <div className="pt-2 border-t">
                                    <p className="text-sm font-medium mb-2">การชำระเงิน</p>
                                    <div className="space-y-2">
                                        {selectedTx.payment_log.map((pay) => (
                                            <div key={pay.payment_id} className="flex justify-between text-sm">
                                                <span>{pay.payment_method} • {formatDateTime(pay.payment_date)}</span>
                                                <span className="text-green-600">+{formatCurrency(Number(pay.amount_paid))}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Status */}
                            <div className="flex justify-between items-center pt-2 border-t">
                                <span className="text-sm">สถานะ</span>
                                {getStatusBadge(selectedTx.payment_status)}
                            </div>

                            {Number(selectedTx.remaining_balance) > 0 && (
                                <div className="flex items-center gap-3 p-3 rounded-xl border-l-4 border-red-400 bg-red-50">
                                    <div className="shrink-0 text-red-500">
                                        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                                    </div>
                                    <div>
                                        <p className="text-xs font-semibold uppercase tracking-wide text-red-500">ยอดค้างชำระ</p>
                                        <p className="text-lg font-bold text-red-600">{formatCurrency(Number(selectedTx.remaining_balance))}</p>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </DialogContent>
            </Dialog>

            {/* Void Confirmation */}
            <AlertDialog open={!!voidTxId} onOpenChange={(open) => !open && setVoidTxId(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>ยืนยันยกเลิกบิล</AlertDialogTitle>
                        <AlertDialogDescription>
                            คุณต้องการยกเลิกบิล #{voidTxId} หรือไม่? การกระทำนี้ไม่สามารถย้อนกลับได้
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>ยกเลิก</AlertDialogCancel>
                        <AlertDialogAction
                            className="bg-red-600 hover:bg-red-700"
                            onClick={() => voidTxId && voidMutation.mutate(voidTxId)}
                        >
                            {voidMutation.isPending ? 'กำลังดำเนินการ...' : 'ยืนยันยกเลิก'}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    )
}
