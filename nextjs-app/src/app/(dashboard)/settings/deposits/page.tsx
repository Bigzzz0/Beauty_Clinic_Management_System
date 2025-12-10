'use client'

import { useState } from 'react'
import {
    Wallet, Plus, Minus, Search, ArrowLeft,
    TrendingUp, History, DollarSign, RefreshCw
} from 'lucide-react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card'
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
import { Textarea } from '@/components/ui/textarea'
import Link from 'next/link'

interface Customer {
    customer_id: number
    hn_code: string
    full_name: string
}

interface DepositBalance {
    customer: Customer
    balance: number
    stats: {
        total_added: number
        total_deducted: number
        add_count: number
        deduct_count: number
    }
    recentHistory: Array<{
        id: number
        type: string
        amount: number
        balance_after: number
        note: string | null
        created_at: string
    }>
}

interface DepositTransaction {
    id: number
    customer: Customer
    type: string
    amount: number
    balance_after: number
    note: string | null
    created_at: string
}

function formatCurrency(amount: number) {
    return new Intl.NumberFormat('th-TH').format(amount)
}

function formatDate(dateStr: string) {
    return new Date(dateStr).toLocaleDateString('th-TH', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    })
}

// ... (imports remain)

// ... (interfaces remain)

// ... (helpers remain)

const typeLabels: Record<string, { label: string; color: string }> = {
    ADD: { label: 'เติมเงิน', color: 'bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20' },
    DEDUCT: { label: 'หักใช้งาน', color: 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20' },
    REFUND: { label: 'คืนเงิน', color: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20' },
    ADJUST: { label: 'ปรับยอด', color: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20' },
}

export default function DepositsPage() {
    const queryClient = useQueryClient()
    const [search, setSearch] = useState('')
    const [selectedCustomerId, setSelectedCustomerId] = useState<number | null>(null)
    const [showAddDialog, setShowAddDialog] = useState(false)
    const [formData, setFormData] = useState({
        customer_id: '',
        type: 'ADD',
        amount: '',
        note: '',
    })

    // Search customers
    const { data: customers } = useQuery<{ data: Customer[] }>({
        queryKey: ['customers-search', search],
        queryFn: async () => {
            if (!search) return { data: [] }
            const res = await fetch(`/api/customers/search?q=${search}&limit=10`)
            return res.json()
        },
        enabled: search.length > 0,
    })

    // Get selected customer balance
    const { data: balanceData, isLoading: balanceLoading } = useQuery<DepositBalance>({
        queryKey: ['deposit-balance', selectedCustomerId],
        queryFn: async () => {
            const res = await fetch(`/api/deposits/balance/${selectedCustomerId}`)
            return res.json()
        },
        enabled: !!selectedCustomerId,
    })

    // Get recent deposits globally
    const { data: recentDeposits } = useQuery<{ data: DepositTransaction[] }>({
        queryKey: ['deposits-recent'],
        queryFn: async () => {
            const res = await fetch('/api/deposits?limit=20')
            return res.json()
        },
    })

    // Add deposit mutation
    const addMutation = useMutation({
        mutationFn: async (data: typeof formData) => {
            const res = await fetch('/api/deposits', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    customer_id: parseInt(data.customer_id),
                    type: data.type,
                    amount: parseFloat(data.amount),
                    note: data.note || null,
                }),
            })
            if (!res.ok) {
                const err = await res.json()
                throw new Error(err.error || 'Failed')
            }
            return res.json()
        },
        onSuccess: (result) => {
            toast.success(`${typeLabels[formData.type].label}สำเร็จ - ยอดคงเหลือ: ฿${formatCurrency(result.balance_after)}`)
            queryClient.invalidateQueries({ queryKey: ['deposits-recent'] })
            queryClient.invalidateQueries({ queryKey: ['deposit-balance'] })
            setShowAddDialog(false)
            setFormData({ customer_id: '', type: 'ADD', amount: '', note: '' })
        },
        onError: (err: Error) => {
            toast.error(err.message || 'เกิดข้อผิดพลาด')
        },
    })

    const handleSelectCustomer = (customer: Customer) => {
        setSelectedCustomerId(customer.customer_id)
        setFormData({ ...formData, customer_id: customer.customer_id.toString() })
        setSearch('')
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    <Link href="/settings">
                        <Button variant="ghost" size="icon">
                            <ArrowLeft className="h-5 w-5" />
                        </Button>
                    </Link>
                    <div>
                        <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
                            <Wallet className="h-8 w-8 text-primary" />
                            ระบบมัดจำลูกค้า
                        </h1>
                        <p className="text-muted-foreground mt-1">จัดการเงินมัดจำและยอดคงเหลือ</p>
                    </div>
                </div>
                <Button
                    className="bg-primary hover:bg-primary/90 text-primary-foreground"
                    onClick={() => setShowAddDialog(true)}
                >
                    <Plus className="h-4 w-4 mr-2" />
                    เพิ่ม/หักเงินมัดจำ
                </Button>
            </div>

            {/* Customer Search & Balance */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Search */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Search className="h-5 w-5" />
                            ค้นหาลูกค้า
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <Input
                            placeholder="ค้นหา HN, ชื่อ, หรือเบอร์โทร..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                        {customers?.data && customers.data.length > 0 && (
                            <div className="space-y-2 max-h-60 overflow-y-auto">
                                {customers.data.map((c) => (
                                    <div
                                        key={c.customer_id}
                                        className="p-3 rounded-lg bg-muted/50 hover:bg-muted cursor-pointer transition-colors"
                                        onClick={() => handleSelectCustomer(c)}
                                    >
                                        <p className="font-medium text-foreground">{c.full_name}</p>
                                        <p className="text-sm text-muted-foreground">HN: {c.hn_code}</p>
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Balance Display */}
                <Card className="bg-gradient-to-br from-emerald-500/10 to-green-600/5 border-emerald-500/20">
                    <CardHeader>
                        <CardTitle className="text-foreground flex items-center gap-2">
                            <DollarSign className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                            ยอดมัดจำคงเหลือ
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        {selectedCustomerId ? (
                            balanceLoading ? (
                                <div className="flex items-center justify-center py-8">
                                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                                </div>
                            ) : balanceData ? (
                                <div className="space-y-4">
                                    <div className="text-center">
                                        <p className="text-muted-foreground">{balanceData.customer.full_name}</p>
                                        <p className="text-sm text-muted-foreground/80">HN: {balanceData.customer.hn_code}</p>
                                        <p className="text-5xl font-bold text-emerald-600 dark:text-emerald-400 mt-4">
                                            ฿{formatCurrency(balanceData.balance)}
                                        </p>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4 mt-6">
                                        <div className="text-center p-3 bg-green-500/10 rounded-lg">
                                            <p className="text-sm text-muted-foreground">เติมทั้งหมด</p>
                                            <p className="text-lg font-semibold text-green-600 dark:text-green-400">
                                                ฿{formatCurrency(balanceData.stats.total_added)}
                                            </p>
                                            <p className="text-xs text-muted-foreground/80">{balanceData.stats.add_count} ครั้ง</p>
                                        </div>
                                        <div className="text-center p-3 bg-red-500/10 rounded-lg">
                                            <p className="text-sm text-muted-foreground">ใช้ไปทั้งหมด</p>
                                            <p className="text-lg font-semibold text-red-600 dark:text-red-400">
                                                ฿{formatCurrency(balanceData.stats.total_deducted)}
                                            </p>
                                            <p className="text-xs text-muted-foreground/80">{balanceData.stats.deduct_count} ครั้ง</p>
                                        </div>
                                    </div>
                                </div>
                            ) : null
                        ) : (
                            <div className="text-center py-8">
                                <Wallet className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                                <p className="text-muted-foreground">ค้นหาและเลือกลูกค้าเพื่อดูยอดมัดจำ</p>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* Customer History */}
            {balanceData?.recentHistory && balanceData.recentHistory.length > 0 && (
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <History className="h-5 w-5" />
                            ประวัติการทำรายการ - {balanceData.customer.full_name}
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow className="bg-muted/50 hover:bg-muted/50">
                                    <TableHead>วันที่</TableHead>
                                    <TableHead>ประเภท</TableHead>
                                    <TableHead className="text-right">จำนวน</TableHead>
                                    <TableHead className="text-right">ยอดคงเหลือ</TableHead>
                                    <TableHead>หมายเหตุ</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {balanceData.recentHistory.map((h) => (
                                    <TableRow key={h.id}>
                                        <TableCell className="text-muted-foreground text-sm">
                                            {formatDate(h.created_at)}
                                        </TableCell>
                                        <TableCell>
                                            <Badge className={typeLabels[h.type]?.color}>
                                                {typeLabels[h.type]?.label}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className={`text-right font-semibold ${h.type === 'ADD' || h.type === 'REFUND' ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                                            }`}>
                                            {h.type === 'ADD' || h.type === 'REFUND' ? '+' : '-'}
                                            {formatCurrency(h.amount)}
                                        </TableCell>
                                        <TableCell className="text-right font-medium">
                                            ฿{formatCurrency(h.balance_after)}
                                        </TableCell>
                                        <TableCell className="text-muted-foreground text-sm">
                                            {h.note || '-'}
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            )}

            {/* Recent Global Transactions */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <RefreshCw className="h-5 w-5" />
                        รายการล่าสุดทั้งหมด
                    </CardTitle>
                    <CardDescription>20 รายการล่าสุด</CardDescription>
                </CardHeader>
                <CardContent>
                    {recentDeposits?.data && recentDeposits.data.length > 0 ? (
                        <Table>
                            <TableHeader>
                                <TableRow className="bg-muted/50 hover:bg-muted/50">
                                    <TableHead>วันที่</TableHead>
                                    <TableHead>HN</TableHead>
                                    <TableHead>ลูกค้า</TableHead>
                                    <TableHead>ประเภท</TableHead>
                                    <TableHead className="text-right">จำนวน</TableHead>
                                    <TableHead className="text-right">ยอดคงเหลือ</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {recentDeposits.data.map((d) => (
                                    <TableRow
                                        key={d.id}
                                        className="cursor-pointer"
                                        onClick={() => setSelectedCustomerId(d.customer.customer_id)}
                                    >
                                        <TableCell className="text-muted-foreground text-sm">
                                            {formatDate(d.created_at)}
                                        </TableCell>
                                        <TableCell className="font-mono text-primary text-sm">
                                            {d.customer.hn_code}
                                        </TableCell>
                                        <TableCell>
                                            {d.customer.full_name}
                                        </TableCell>
                                        <TableCell>
                                            <Badge className={typeLabels[d.type]?.color}>
                                                {typeLabels[d.type]?.label}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className={`text-right font-semibold ${d.type === 'ADD' || d.type === 'REFUND' ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                                            }`}>
                                            {d.type === 'ADD' || d.type === 'REFUND' ? '+' : '-'}
                                            ฿{formatCurrency(d.amount)}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            ฿{formatCurrency(d.balance_after)}
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    ) : (
                        <div className="text-center py-8">
                            <History className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                            <p className="text-muted-foreground">ยังไม่มีรายการมัดจำ</p>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Add/Deduct Dialog */}
            <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>เพิ่ม/หักเงินมัดจำ</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                        {/* Customer Search in Dialog */}
                        <div className="space-y-2">
                            <Label>ค้นหาลูกค้า</Label>
                            <Input
                                placeholder="HN, ชื่อ..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                            />
                            {customers?.data && customers.data.length > 0 && !formData.customer_id && (
                                <div className="space-y-1 max-h-40 overflow-y-auto">
                                    {customers.data.map((c) => (
                                        <div
                                            key={c.customer_id}
                                            className="p-2 rounded bg-muted hover:bg-muted/80 cursor-pointer text-sm"
                                            onClick={() => handleSelectCustomer(c)}
                                        >
                                            {c.full_name} ({c.hn_code})
                                        </div>
                                    ))}
                                </div>
                            )}
                            {formData.customer_id && balanceData && (
                                <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                                    <p className="font-medium text-foreground">{balanceData.customer.full_name}</p>
                                    <p className="text-sm text-muted-foreground">HN: {balanceData.customer.hn_code}</p>
                                    <p className="text-lg font-bold text-emerald-600 dark:text-emerald-400 mt-1">
                                        ยอดคงเหลือ: ฿{formatCurrency(balanceData.balance)}
                                    </p>
                                </div>
                            )}
                        </div>
                        <div className="space-y-2">
                            <Label>ประเภทรายการ</Label>
                            <Select value={formData.type} onValueChange={(v) => setFormData({ ...formData, type: v })}>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="ADD">➕ เติมเงินมัดจำ</SelectItem>
                                    <SelectItem value="DEDUCT">➖ หักใช้งาน</SelectItem>
                                    <SelectItem value="REFUND">↩️ คืนเงิน</SelectItem>
                                    <SelectItem value="ADJUST">⚙️ ปรับยอด</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label>จำนวนเงิน (บาท)</Label>
                            <Input
                                type="number"
                                placeholder="0.00"
                                value={formData.amount}
                                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                                className="text-lg"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>หมายเหตุ</Label>
                            <Textarea
                                placeholder="รายละเอียดเพิ่มเติม..."
                                value={formData.note}
                                onChange={(e) => setFormData({ ...formData, note: e.target.value })}
                            />
                        </div>
                        <Button
                            className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
                            onClick={() => addMutation.mutate(formData)}
                            disabled={!formData.customer_id || !formData.amount || addMutation.isPending}
                        >
                            {addMutation.isPending ? 'กำลังบันทึก...' : 'บันทึก'}
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    )
}
