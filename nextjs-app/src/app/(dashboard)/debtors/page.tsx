'use client'

import { useState, useEffect } from 'react'
import {
    Wallet, Search, Phone, DollarSign, CreditCard, Banknote, QrCode,
    AlertTriangle
} from 'lucide-react'
import { EmptyState } from '@/components/ui/empty-state'
import { toast } from 'sonner'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuthStore } from '@/stores/auth-store'
import { formatCurrency, formatDate } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
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

interface Debtor {
    customer_id: number
    hn_code: string
    full_name: string
    phone_number: string
    total_debt: number
    transactions: Array<{
        transaction_id: number
        transaction_date: string
        net_amount: number
        remaining_balance: number
    }>
}

// Returns aging info from the oldest unpaid transaction date
const getAgingInfo = (transactions: Debtor['transactions']) => {
    if (!transactions.length) return null
    const oldest = transactions.reduce((oldest, tx) => {
        return new Date(tx.transaction_date) < new Date(oldest.transaction_date) ? tx : oldest
    })
    const days = Math.floor((Date.now() - new Date(oldest.transaction_date).getTime()) / 86400000)
    if (days <= 7) return { days, label: `${days} วัน`, className: 'bg-emerald-100 text-emerald-700 border border-emerald-200' }
    if (days <= 30) return { days, label: `${days} วัน`, className: 'bg-amber-100 text-amber-700 border border-amber-200' }
    return { days, label: `${days} วัน`, className: 'bg-red-100 text-red-700 border border-red-200 font-bold' }
}

export default function DebtorPage() {
    const token = useAuthStore((s) => s.token)
    const queryClient = useQueryClient()

    const [search, setSearch] = useState('')
    const [selectedDebtor, setSelectedDebtor] = useState<Debtor | null>(null)
    const [selectedTransaction, setSelectedTransaction] = useState<number | null>(null)
    const [payAmount, setPayAmount] = useState('')
    const [payMethod, setPayMethod] = useState<'CASH' | 'TRANSFER' | 'CREDIT'>('CASH')

    // Read search from URL if present
    useEffect(() => {
        const params = new URLSearchParams(window.location.search)
        const searchQuery = params.get('search')
        if (searchQuery) setSearch(searchQuery)
    }, [])

    const { data: debtors = [], isLoading } = useQuery<Debtor[]>({
        queryKey: ['debtors'],
        queryFn: async () => {
            const res = await fetch('/api/debtors', {
                headers: token ? { Authorization: `Bearer ${token}` } : {},
            })
            if (!res.ok) throw new Error('Failed to fetch')
            return res.json()
        },
    })

    const payMutation = useMutation({
        mutationFn: async (data: { transaction_id: number; amount_paid: number; payment_method: string }) => {
            const res = await fetch('/api/debtors', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...(token ? { Authorization: `Bearer ${token}` } : {}),
                },
                body: JSON.stringify(data),
            })
            if (!res.ok) throw new Error('Failed')
            return res.json()
        },
        onSuccess: (data) => {
            toast.success(`ชำระเงินสำเร็จ - ยอดคงเหลือ ${formatCurrency(data.new_balance)}`)
            queryClient.invalidateQueries({ queryKey: ['debtors'] })
            setSelectedDebtor(null)
            setSelectedTransaction(null)
            setPayAmount('')
            setPayMethod('CASH')
        },
        onError: () => {
            toast.error('เกิดข้อผิดพลาด')
        },
    })

    const handlePay = () => {
        if (!selectedTransaction || !payAmount || parseFloat(payAmount) <= 0) {
            toast.error('กรุณาระบุจำนวนเงิน')
            return
        }

        payMutation.mutate({
            transaction_id: selectedTransaction,
            amount_paid: parseFloat(payAmount),
            payment_method: payMethod,
        })
    }

    const filteredDebtors = debtors.filter((d) =>
        d.full_name.toLowerCase().includes(search.toLowerCase()) ||
        d.hn_code.toLowerCase().includes(search.toLowerCase()) ||
        d.phone_number.includes(search)
    )

    const totalDebt = debtors.reduce((sum, d) => sum + d.total_debt, 0)

    return (
        <div className="space-y-6 animate-fade-in">
            {/* Header */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold flex items-center gap-2">
                        <Wallet className="h-6 w-6 text-red-500" />
                        ติดตามหนี้
                    </h1>
                    <p className="text-muted-foreground text-sm mt-0.5">ลูกค้าที่ค้างชำระ</p>
                </div>
                <div
                    className="flex items-center gap-4 rounded-2xl px-5 py-4 shadow-md shadow-red-100"
                    style={{ background: 'linear-gradient(135deg, #fef2f2, #fee2e2)' }}
                >
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-100 animate-pulse-glow">
                        <AlertTriangle className="h-5 w-5 text-red-600" />
                    </div>
                    <div>
                        <p className="text-xs font-medium text-red-400 uppercase tracking-wide">ยอดหนี้รวม</p>
                        <p className="text-2xl font-bold text-red-600">{formatCurrency(totalDebt)}</p>
                    </div>
                </div>
            </div>

            {/* Search */}
            <Card>
                <CardContent className="p-4">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        <Input
                            placeholder="ค้นหา ชื่อ / HN / เบอร์โทร..."
                            value={search}
                            aria-label="ค้นเลือกลูกหนี้"
                            onChange={(e) => setSearch(e.target.value)}
                            className="pl-10"
                        />
                    </div>
                </CardContent>
            </Card>

            {/* Debtors Table */}
            <Card>
                    <CardHeader className="flex flex-row items-center justify-between">
                        <CardTitle className="flex items-center gap-2">
                            รายชื่อลูกหนี้
                            <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-600">
                                {filteredDebtors.length} คน
                            </span>
                        </CardTitle>
                    </CardHeader>
                <CardContent className="p-0 sm:p-6 sm:pt-0">
                    <div className="rounded-xl border overflow-hidden">
                        <Table>
                            <TableHeader>
                                <TableRow className="bg-slate-50 hover:bg-slate-50">
                                    <TableHead className="text-xs font-semibold uppercase tracking-wide text-slate-500">ลูกค้า</TableHead>
                                    <TableHead className="text-xs font-semibold uppercase tracking-wide text-slate-500">เบอร์โทร</TableHead>
                                    <TableHead className="text-xs font-semibold uppercase tracking-wide text-slate-500">จำนวนบิล</TableHead>
                                    <TableHead className="text-xs font-semibold uppercase tracking-wide text-slate-500">อายุหนี้</TableHead>
                                    <TableHead className="text-xs font-semibold uppercase tracking-wide text-slate-500 text-right">ยอดค้าง</TableHead>
                                    <TableHead className="w-32"></TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {isLoading ? (
                                    [...Array(5)].map((_, i) => (
                                        <TableRow key={i}>
                                            <TableCell colSpan={5}>
                                                <div className="h-12 animate-pulse rounded bg-slate-100" />
                                            </TableCell>
                                        </TableRow>
                                    ))
                                ) : filteredDebtors.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={5} className="h-64 text-center">
                                            <EmptyState
                                                icon={Wallet}
                                                title="ไม่มีรายการลูกหนี้"
                                                description={search ? `ไม่พบลูกหนี้ที่ตรงกับ "${search}"` : "ไม่พบลูกค้าที่มียอดค้างชำระในขณะนี้"}
                                            />
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    filteredDebtors.map((debtor) => {
                                        const aging = getAgingInfo(debtor.transactions)
                                        return (
                                        <TableRow key={debtor.customer_id} className="hover:bg-red-50/40 transition-colors border-l-4 border-l-transparent hover:border-l-red-200">
                                            <TableCell>
                                                <div className="flex items-center gap-2.5">
                                                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-red-400 to-red-500 text-xs font-bold text-white shadow-sm">
                                                        {debtor.full_name.charAt(0)}
                                                    </div>
                                                    <div>
                                                        <p className="font-semibold max-w-[180px] truncate text-sm" title={debtor.full_name}>{debtor.full_name}</p>
                                                        <p className="text-xs text-slate-400 font-mono">{debtor.hn_code}</p>
                                                    </div>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-1.5 text-sm">
                                                    <Phone className="h-3.5 w-3.5 text-slate-400" />
                                                    {debtor.phone_number}
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600">{debtor.transactions.length} บิล</span>
                                            </TableCell>
                                            <TableCell>
                                                {aging && (
                                                    <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs ${aging.className}`}>
                                                        <span className="h-1.5 w-1.5 rounded-full bg-current opacity-70" />
                                                        {aging.label}
                                                    </span>
                                                )}
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <span className="inline-flex items-center rounded-full bg-red-50 px-3 py-1 text-sm font-bold text-red-600 ring-1 ring-red-200">
                                                    {formatCurrency(debtor.total_debt)}
                                                </span>
                                            </TableCell>
                                            <TableCell>
                                                <Button
                                                    size="sm"
                                                    className="rounded-lg gap-1.5 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md"
                                                    style={{ background: 'linear-gradient(135deg, #16a34a, #22c55e)', color: 'white' }}
                                                    aria-label={`ชำระหนี้ของ ${debtor.full_name}`}
                                                    onClick={() => {
                                                        setSelectedDebtor(debtor)
                                                        setSelectedTransaction(null)
                                                        setPayAmount('')
                                                        setPayMethod('CASH')
                                                    }}
                                                >
                                                    <DollarSign className="h-3.5 w-3.5" />
                                                    ชำระ
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                        )
                                    })
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>

            {/* Pay Debt Dialog */}
            <Dialog open={!!selectedDebtor} onOpenChange={(open) => {
                if (!open) {
                    setSelectedDebtor(null)
                    setSelectedTransaction(null)
                    setPayAmount('')
                    setPayMethod('CASH')
                }
            }}>
                <DialogContent className="max-w-lg">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <DollarSign className="h-5 w-5 text-green-600" />
                            ชำระหนี้ - {selectedDebtor?.full_name}
                        </DialogTitle>
                        <DialogDescription className="sr-only">
                            ชำระบิลค้างชำระของ {selectedDebtor?.full_name}
                        </DialogDescription>
                    </DialogHeader>

                    {selectedDebtor && (
                        <div className="space-y-4">
                            {/* Customer Info */}
                            <div className="p-3 rounded-lg bg-muted flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-slate-500">ยอดหนี้รวม</p>
                                    <p className="text-2xl font-bold text-red-600">{formatCurrency(selectedDebtor.total_debt)}</p>
                                </div>
                                {selectedDebtor.transactions.length === 1 && (
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        className="text-xs border-red-200 text-red-600 hover:bg-red-50"
                                        onClick={() => {
                                            const tx = selectedDebtor.transactions[0]
                                            setSelectedTransaction(tx.transaction_id)
                                            setPayAmount(tx.remaining_balance.toString())
                                        }}
                                    >
                                        เลือกอัตโนมัติ
                                    </Button>
                                )}
                            </div>

                            {/* Transaction Select */}
                            <div>
                                <Label>เลือกบิลที่ต้องการชำระ</Label>
                                <Select
                                    value={selectedTransaction?.toString() || ''}
                                    onValueChange={(v) => {
                                        setSelectedTransaction(parseInt(v))
                                        const tx = selectedDebtor.transactions.find(t => t.transaction_id === parseInt(v))
                                        if (tx) setPayAmount(tx.remaining_balance.toString())
                                    }}
                                >
                                    <SelectTrigger aria-label="เลือกบิลที่ต้องการชำระ">
                                        <SelectValue placeholder="เลือกบิล" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {selectedDebtor.transactions.map((tx) => (
                                            <SelectItem key={tx.transaction_id} value={tx.transaction_id.toString()}>
                                                บิล #{tx.transaction_id} - {formatDate(tx.transaction_date)} - ค้าง {formatCurrency(Number(tx.remaining_balance))}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            {/* Payment Method */}
                            <div>
                                <Label>วิธีชำระ</Label>
                                <div className="grid grid-cols-3 gap-2 mt-2">
                                    <Button
                                        variant={payMethod === 'CASH' ? 'default' : 'outline'}
                                        onClick={() => setPayMethod('CASH')}
                                        disabled={!selectedTransaction}
                                        className="flex flex-col gap-1 py-4"
                                    >
                                        <Banknote className="h-5 w-5" />
                                        <span className="text-xs">เงินสด</span>
                                    </Button>
                                    <Button
                                        variant={payMethod === 'TRANSFER' ? 'default' : 'outline'}
                                        onClick={() => setPayMethod('TRANSFER')}
                                        disabled={!selectedTransaction}
                                        className="flex flex-col gap-1 py-4"
                                    >
                                        <QrCode className="h-5 w-5" />
                                        <span className="text-xs">โอนเงิน</span>
                                    </Button>
                                    <Button
                                        variant={payMethod === 'CREDIT' ? 'default' : 'outline'}
                                        onClick={() => setPayMethod('CREDIT')}
                                        disabled={!selectedTransaction}
                                        className="flex flex-col gap-1 py-4"
                                    >
                                        <CreditCard className="h-5 w-5" />
                                        <span className="text-xs">บัตร</span>
                                    </Button>
                                </div>
                            </div>

                            {/* Amount */}
                            <div>
                                <Label htmlFor="pay-amount">จำนวนเงิน</Label>
                                <Input
                                    id="pay-amount"
                                    type="number"
                                    min={0}
                                    value={payAmount}
                                    onChange={(e) => setPayAmount(e.target.value)}
                                    placeholder="0"
                                    disabled={!selectedTransaction}
                                    className="text-lg"
                                />
                                {/* Quick fill buttons */}
                                {selectedTransaction && (
                                    <div className="flex gap-2 mt-2">
                                        {[500, 1000, 2000, 5000].map(amt => (
                                            <button
                                                key={amt}
                                                type="button"
                                                onClick={() => setPayAmount(amt.toString())}
                                                className="flex-1 rounded-lg border border-slate-200 bg-slate-50 py-1 text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-colors"
                                            >
                                                {amt >= 1000 ? `${amt/1000}K` : amt}
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* Submit */}
                            <Button
                                className="w-full bg-green-600 hover:bg-green-700 text-white"
                                disabled={!selectedTransaction || !payAmount || payMutation.isPending}
                                aria-busy={payMutation.isPending}
                                onClick={handlePay}
                            >
                                {payMutation.isPending ? 'กำลังบันทึก...' : 'ยืนยันชำระเงิน'}
                            </Button>
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    )
}
