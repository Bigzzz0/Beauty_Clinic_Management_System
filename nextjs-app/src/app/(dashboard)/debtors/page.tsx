'use client'

import { useState } from 'react'
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

export default function DebtorPage() {
    const token = useAuthStore((s) => s.token)
    const queryClient = useQueryClient()

    const [search, setSearch] = useState('')
    const [selectedDebtor, setSelectedDebtor] = useState<Debtor | null>(null)
    const [selectedTransaction, setSelectedTransaction] = useState<number | null>(null)
    const [payAmount, setPayAmount] = useState('')
    const [payMethod, setPayMethod] = useState<'CASH' | 'TRANSFER' | 'CREDIT'>('CASH')

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
            setPayAmount('')
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
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold flex items-center gap-2">
                        <Wallet className="h-6 w-6 text-destructive" />
                        ติดตามหนี้
                    </h1>
                    <p className="text-muted-foreground">ลูกค้าที่ค้างชำระ</p>
                </div>
                <Card className="bg-destructive/10 border-destructive/20">
                    <CardContent className="p-4">
                        <p className="text-sm text-destructive">ยอดหนี้รวม</p>
                        <p className="text-2xl font-bold text-destructive">{formatCurrency(totalDebt)}</p>
                    </CardContent>
                </Card>
            </div>

            {/* Search */}
            <Card>
                <CardContent className="p-4">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        <Input
                            placeholder="ค้นหา ชื่อ / HN / เบอร์โทร..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="pl-10"
                        />
                    </div>
                </CardContent>
            </Card>

            {/* Debtors Table */}
            <Card>
                <CardHeader>
                    <CardTitle>รายชื่อลูกหนี้ ({filteredDebtors.length} คน)</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="rounded-lg border overflow-hidden">
                        <Table>
                            <TableHeader>
                                <TableRow className="bg-muted/50">
                                    <TableHead>ลูกค้า</TableHead>
                                    <TableHead>เบอร์โทร</TableHead>
                                    <TableHead>จำนวนบิล</TableHead>
                                    <TableHead className="text-right">ยอดค้าง</TableHead>
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
                                    filteredDebtors.map((debtor) => (
                                        <TableRow key={debtor.customer_id}>
                                            <TableCell>
                                                <div>
                                                    <p className="font-medium">{debtor.full_name}</p>
                                                    <p className="text-xs text-slate-500 font-mono">{debtor.hn_code}</p>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-2 text-sm">
                                                    <Phone className="h-4 w-4 text-slate-400" />
                                                    {debtor.phone_number}
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant="secondary">{debtor.transactions.length} บิล</Badge>
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <span className="text-lg font-bold text-red-600">
                                                    {formatCurrency(debtor.total_debt)}
                                                </span>
                                            </TableCell>
                                            <TableCell>
                                                <Button
                                                    size="sm"
                                                    variant="success"
                                                    onClick={() => setSelectedDebtor(debtor)}
                                                >
                                                    <DollarSign className="h-4 w-4 mr-1" />
                                                    ชำระ
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>

            {/* Pay Debt Dialog */}
            <Dialog open={!!selectedDebtor} onOpenChange={(open) => !open && setSelectedDebtor(null)}>
                <DialogContent className="max-w-lg">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <DollarSign className="h-5 w-5 text-green-600" />
                            ชำระหนี้ - {selectedDebtor?.full_name}
                        </DialogTitle>
                    </DialogHeader>

                    {selectedDebtor && (
                        <div className="space-y-4">
                            {/* Customer Info */}
                            <div className="p-3 rounded-lg bg-muted">
                                <p className="text-sm text-slate-500">ยอดหนี้รวม</p>
                                <p className="text-2xl font-bold text-red-600">{formatCurrency(selectedDebtor.total_debt)}</p>
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
                                    <SelectTrigger>
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
                                        className="flex flex-col gap-1 py-4"
                                    >
                                        <Banknote className="h-5 w-5" />
                                        <span className="text-xs">เงินสด</span>
                                    </Button>
                                    <Button
                                        variant={payMethod === 'TRANSFER' ? 'default' : 'outline'}
                                        onClick={() => setPayMethod('TRANSFER')}
                                        className="flex flex-col gap-1 py-4"
                                    >
                                        <QrCode className="h-5 w-5" />
                                        <span className="text-xs">โอนเงิน</span>
                                    </Button>
                                    <Button
                                        variant={payMethod === 'CREDIT' ? 'default' : 'outline'}
                                        onClick={() => setPayMethod('CREDIT')}
                                        className="flex flex-col gap-1 py-4"
                                    >
                                        <CreditCard className="h-5 w-5" />
                                        <span className="text-xs">บัตร</span>
                                    </Button>
                                </div>
                            </div>

                            {/* Amount */}
                            <div>
                                <Label>จำนวนเงิน</Label>
                                <Input
                                    type="number"
                                    value={payAmount}
                                    onChange={(e) => setPayAmount(e.target.value)}
                                    placeholder="0"
                                    className="text-lg"
                                />
                            </div>

                            {/* Submit */}
                            <Button
                                className="w-full"
                                variant="success"
                                disabled={!selectedTransaction || !payAmount || payMutation.isPending}
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
