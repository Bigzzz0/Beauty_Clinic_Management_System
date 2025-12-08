'use client'

import { useState } from 'react'
import {
    FileText, Search, Eye, Printer, Ban, ChevronLeft, ChevronRight,
    CheckCircle, Clock, XCircle
} from 'lucide-react'
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
    payment_status: 'PAID' | 'PARTIAL' | 'UNPAID' | 'CANCELLED'
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
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold flex items-center gap-2">
                    <FileText className="h-6 w-6 text-blue-500" />
                    ประวัติบิล
                </h1>
                <p className="text-slate-500">รายการธุรกรรมทั้งหมด</p>
            </div>

            {/* Filters */}
            <Card>
                <CardContent className="p-4">
                    <div className="flex flex-col gap-4 md:flex-row md:items-center">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                            <Input
                                placeholder="ค้นหาเลขบิล / ชื่อลูกค้า / HN..."
                                value={search}
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
                    <div className="rounded-lg border overflow-hidden">
                        <Table>
                            <TableHeader>
                                <TableRow className="bg-slate-50">
                                    <TableHead>เลขบิล</TableHead>
                                    <TableHead>วันที่</TableHead>
                                    <TableHead>ลูกค้า</TableHead>
                                    <TableHead className="text-right">ยอดรวม</TableHead>
                                    <TableHead>สถานะ</TableHead>
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
                                        <TableCell colSpan={6} className="text-center py-12 text-slate-500">
                                            ไม่พบรายการ
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    transactions.map((tx) => (
                                        <TableRow key={tx.transaction_id}>
                                            <TableCell>
                                                <span className="font-mono font-medium">#{tx.transaction_id}</span>
                                            </TableCell>
                                            <TableCell>
                                                <span className="text-sm">{formatDateTime(tx.transaction_date)}</span>
                                            </TableCell>
                                            <TableCell>
                                                <div>
                                                    <p className="font-medium">{tx.customer.first_name} {tx.customer.last_name}</p>
                                                    <p className="text-xs text-slate-500">{tx.customer.hn_code}</p>
                                                </div>
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
                                                        onClick={() => setSelectedTx(tx)}
                                                    >
                                                        <Eye className="h-4 w-4" />
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        onClick={() => handlePrint(tx)}
                                                    >
                                                        <Printer className="h-4 w-4" />
                                                    </Button>
                                                    {isAdmin && tx.payment_status !== 'VOIDED' && (
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="text-red-500"
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
                            <p className="text-sm text-slate-500">
                                หน้า {page} จาก {totalPages}
                            </p>
                            <div className="flex gap-2">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    disabled={page <= 1}
                                    onClick={() => setPage(page - 1)}
                                >
                                    <ChevronLeft className="h-4 w-4" />
                                </Button>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    disabled={page >= totalPages}
                                    onClick={() => setPage(page + 1)}
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
                    </DialogHeader>

                    {selectedTx && (
                        <div className="space-y-4">
                            {/* Customer */}
                            <div className="p-3 rounded-lg bg-slate-50">
                                <p className="font-medium">{selectedTx.customer.first_name} {selectedTx.customer.last_name}</p>
                                <p className="text-sm text-slate-500">{selectedTx.customer.hn_code}</p>
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
                                <div className="p-3 rounded-lg bg-red-50 text-red-700">
                                    <p className="text-sm">ยอดค้างชำระ: <strong>{formatCurrency(Number(selectedTx.remaining_balance))}</strong></p>
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
