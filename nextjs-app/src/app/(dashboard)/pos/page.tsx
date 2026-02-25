'use client'

import { useState, useEffect, useRef } from 'react'
import { useHotkeys } from '@/hooks/use-hotkeys'

// ... (in component)
// ... (in component)



// ... (render)
// Product Search Input needs ref
// <Input ref={searchInputRef} ... />

// Product Cards
// <Card 
//     role="button"
//     tabIndex={0}
//     onKeyDown={(e) => {
//         if (e.key === 'Enter' || e.key === ' ') {
//             e.preventDefault()
//             addCourse(course)
//         }
//     }}
// ...

// Quantity Controls
// <Button aria-label="Decrease quantity" ... />
// <Button aria-label="Increase quantity" ... />
// <Button aria-label="Remove item" ... />

import {
    Search, ShoppingCart, Trash2, Plus, Minus,
    CreditCard, Banknote, QrCode, AlertTriangle,
    User, Stethoscope, HandHelping, ChevronDown, Wallet, Printer,
    X, Keyboard, UserPlus
} from 'lucide-react'
import Link from 'next/link'
import { EmptyState } from '@/components/ui/empty-state'
import { toast } from 'sonner'
import { useQuery } from '@tanstack/react-query'
import { useProducts, useCourses } from '@/hooks/use-products'
import { useSearchCustomers } from '@/hooks/use-customers'
import { useCreateTransaction, useAddPayment } from '@/hooks/use-transactions'
import { useCartStore } from '@/stores/cart-store'
import { useAuthStore } from '@/stores/auth-store'
import { formatCurrency } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import {
    CollapsibleContent,
    CollapsibleTrigger,
} from '@/components/ui/collapsible'
import {
    Sheet,
    SheetContent,
    SheetTrigger,
    SheetHeader,
    SheetTitle,
} from '@/components/ui/sheet'
import ProductCard from '@/components/pos/product-card'
import CartItem from '@/components/pos/cart-item'

interface Staff {
    staff_id: number
    full_name: string
    position: string
}

export default function POSPage() {
    const token = useAuthStore((s) => s.token)
    const isAdmin = useAuthStore((s) => s.isAdmin())

    const searchInputRef = useRef<HTMLInputElement>(null)
    const [searchProduct, setSearchProduct] = useState('')
    const [searchCustomer, setSearchCustomer] = useState('')
    const [showPaymentDialog, setShowPaymentDialog] = useState(false)
    const [isPartialPayment, setIsPartialPayment] = useState(false)
    const [expandedItem, setExpandedItem] = useState<string | null>(null)

    // Split payment state
    const [cashAmount, setCashAmount] = useState('')
    const [transferAmount, setTransferAmount] = useState('')
    const [creditAmount, setCreditAmount] = useState('')
    const [depositAmount, setDepositAmount] = useState('')
    const [customerDepositBalance, setCustomerDepositBalance] = useState(0)
    const [lastTransactionId, setLastTransactionId] = useState<number | null>(null)
    const [showReceiptPrompt, setShowReceiptPrompt] = useState(false)

    const { data: products = [] } = useProducts({ search: searchProduct })
    const { data: courses = [] } = useCourses()
    const { data: customers = [] } = useSearchCustomers(searchCustomer)

    // Fetch doctors and therapists
    const { data: doctors = [] } = useQuery<Staff[]>({
        queryKey: ['staff', 'Doctor'],
        queryFn: async () => {
            const res = await fetch('/api/staff?position=Doctor', {
                headers: token ? { Authorization: `Bearer ${token}` } : {},
            })
            return res.json()
        },
    })

    const { data: therapists = [] } = useQuery<Staff[]>({
        queryKey: ['staff', 'Therapist'],
        queryFn: async () => {
            const res = await fetch('/api/staff?position=Therapist', {
                headers: token ? { Authorization: `Bearer ${token}` } : {},
            })
            return res.json()
        },
    })

    const createTransaction = useCreateTransaction()
    const addPayment = useAddPayment()

    const {
        items,
        customerId,
        customerName,
        customerAlerts,
        discount,
        addProduct,
        addCourse,
        updateQuantity,
        removeItem,
        clearCart,
        setCustomer,
        setDiscount,
        setItemStaff,
        getSubtotal,
        getTotal,
    } = useCartStore()

    useHotkeys('F2', () => searchInputRef.current?.focus())
    useHotkeys('F9', () => {
        if (items.length > 0 && customerId) {
            setShowPaymentDialog(true)
        }
    })

    // Calculate total payment from split amounts
    const getTotalPayment = () => {
        return (parseFloat(cashAmount) || 0) + (parseFloat(transferAmount) || 0) + (parseFloat(creditAmount) || 0) + (parseFloat(depositAmount) || 0)
    }

    const getRemainingBalance = () => {
        return Math.max(0, getTotal() - getTotalPayment())
    }

    const handleSelectCustomer = async (customer: {
        customer_id: number
        first_name: string
        last_name: string
        drug_allergy?: string | null
        underlying_disease?: string | null
    }) => {
        setCustomer(
            customer.customer_id,
            `${customer.first_name} ${customer.last_name}`,
            {
                drug_allergy: customer.drug_allergy || null,
                underlying_disease: customer.underlying_disease || null
            }
        )
        setSearchCustomer('')

        // Fetch customer deposit balance
        try {
            const res = await fetch(`/api/deposits/balance/${customer.customer_id}`)
            if (res.ok) {
                const data = await res.json()
                setCustomerDepositBalance(data.balance || 0)
            }
        } catch {
            setCustomerDepositBalance(0)
        }
    }

    const handleCheckout = async () => {
        if (!customerId) {
            toast.error('กรุณาเลือกลูกค้า')
            return
        }
        if (items.length === 0) {
            toast.error('กรุณาเพิ่มสินค้าในตะกร้า')
            return
        }

        const totalPaid = getTotalPayment()
        if (totalPaid <= 0) {
            toast.error('กรุณาระบุจำนวนเงินที่ชำระ')
            return
        }

        try {
            const transaction = await createTransaction.mutateAsync({
                customer_id: customerId,
                discount,
                items: items.map((item) => ({
                    product_id: item.product?.product_id || null,
                    course_id: item.course?.course_id || null,
                    qty: item.qty,
                    unit_price: item.unit_price,
                    subtotal: item.subtotal,
                })),
            })

            // Create payment logs for each payment method used
            const payments: Promise<unknown>[] = []

            if (parseFloat(cashAmount) > 0) {
                payments.push(addPayment.mutateAsync({
                    transaction_id: transaction.transaction_id,
                    amount_paid: parseFloat(cashAmount),
                    payment_method: 'CASH',
                }))
            }
            if (parseFloat(transferAmount) > 0) {
                payments.push(addPayment.mutateAsync({
                    transaction_id: transaction.transaction_id,
                    amount_paid: parseFloat(transferAmount),
                    payment_method: 'TRANSFER',
                }))
            }
            if (parseFloat(creditAmount) > 0) {
                payments.push(addPayment.mutateAsync({
                    transaction_id: transaction.transaction_id,
                    amount_paid: parseFloat(creditAmount),
                    payment_method: 'CREDIT',
                }))
            }
            if (parseFloat(depositAmount) > 0) {
                payments.push(addPayment.mutateAsync({
                    transaction_id: transaction.transaction_id,
                    amount_paid: parseFloat(depositAmount),
                    payment_method: 'DEPOSIT',
                    customer_id: customerId,
                }))
            }

            await Promise.all(payments)

            const remaining = getRemainingBalance()
            if (remaining > 0) {
                toast.success(`บันทึกสำเร็จ - ยอดค้างชำระ ${formatCurrency(remaining)}`)
            } else {
                toast.success('บันทึกการขายสำเร็จ')
            }

            // Save transaction ID for receipt
            setLastTransactionId(transaction.transaction_id)
            setShowReceiptPrompt(true)

            clearCart()
            setShowPaymentDialog(false)
            setCashAmount('')
            setTransferAmount('')
            setCreditAmount('')
            setDepositAmount('')
            setIsPartialPayment(false)
            setCustomerDepositBalance(0)
        } catch {
            toast.error('เกิดข้อผิดพลาดในการบันทึก')
        }
    }

    // Reset payment amounts when dialog opens
    useEffect(() => {
        if (showPaymentDialog) {
            setCashAmount(getTotal().toString())
            setTransferAmount('')
            setCreditAmount('')
            setDepositAmount('')
        }
    }, [showPaymentDialog])

    // Extracted Cart Content for reuse in Desktop and Mobile views
    const renderCartContent = () => (
        <div className="flex h-full flex-col p-4 w-full h-[calc(100vh-10rem)] md:h-[calc(100%-5rem)] overflow-y-auto">
            {/* Customer Selection */}
            <div className="mb-4">
                <Label className="mb-2 block">ลูกค้า</Label>
                {customerId ? (
                    <div className="space-y-2">
                        <div className="flex items-center justify-between rounded-lg bg-amber-50 p-3">
                            <div className="flex items-center gap-2">
                                <User className="h-5 w-5 text-amber-600" />
                                <span className="font-medium text-amber-700">{customerName}</span>
                            </div>
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setCustomer(0, '', undefined)}
                            >
                                เปลี่ยน
                            </Button>
                        </div>

                        {/* Medical Alert Banner */}
                        {(customerAlerts?.drug_allergy || customerAlerts?.underlying_disease) && (
                            <div className="animate-pulse rounded-lg bg-red-500 p-3 text-white">
                                <div className="flex items-center gap-2 font-bold">
                                    <AlertTriangle className="h-5 w-5" />
                                    ⚠️ ข้อควรระวัง
                                </div>
                                {customerAlerts.drug_allergy && (
                                    <p className="text-sm mt-1">💊 แพ้ยา: {customerAlerts.drug_allergy}</p>
                                )}
                                {customerAlerts.underlying_disease && (
                                    <p className="text-sm mt-1">🏥 โรคประจำตัว: {customerAlerts.underlying_disease}</p>
                                )}
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="relative">
                        <div className="flex gap-2">
                            <div className="relative flex-1">
                                <Input
                                    placeholder="ค้นหาลูกค้า..."
                                    value={searchCustomer}
                                    onChange={(e) => setSearchCustomer(e.target.value)}
                                    className="pr-8"
                                    aria-label="Search customers"
                                />
                                {searchCustomer && (
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => setSearchCustomer('')}
                                        className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8 text-slate-400 hover:text-slate-600 cursor-pointer"
                                    >
                                        <X className="h-4 w-4" />
                                    </Button>
                                )}
                            </div>
                            <Link
                                href="/patients/new"
                                target="_blank"
                                title="เพิ่มลูกค้าใหม่"
                                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md border border-input bg-background hover:bg-accent hover:text-accent-foreground"
                            >
                                <UserPlus className="h-4 w-4" />
                            </Link>
                        </div>
                        {customers.length > 0 && (
                            <div className="absolute z-10 mt-1 w-full rounded-lg border bg-white shadow-lg max-h-60 overflow-auto">
                                {customers.map((customer) => (
                                    <button
                                        type="button"
                                        key={customer.customer_id}
                                        className="w-full text-left p-3 hover:bg-muted transition-colors border-b last:border-0 focus-visible:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:relative z-10"
                                        onClick={() => handleSelectCustomer(customer)}
                                    >
                                        <p className="font-medium">
                                            {customer.first_name} {customer.last_name}
                                        </p>
                                        <p className="text-sm text-muted-foreground">{customer.hn_code} • {customer.phone_number}</p>
                                        {(customer.drug_allergy || customer.underlying_disease) && (
                                            <Badge className="mt-1 bg-red-100 text-red-700 text-xs">⚠️ มีข้อควรระวัง</Badge>
                                        )}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Cart Items */}
            <div className="flex-1 space-y-3 overflow-auto min-h-[50px] md:min-h-0">
                {items.length === 0 ? (
                    <EmptyState
                        icon={ShoppingCart}
                        title="ตะกร้าว่างเปล่า"
                        description="เลือกสินค้าหรือคอร์สจากรายการ"
                        className="h-full border-0 min-h-[200px]"
                    />
                ) : (
                    items.map((item) => (
                        <CartItem
                            key={item.id}
                            item={item}
                            expanded={expandedItem === item.id}
                            onToggleExpand={(open) => setExpandedItem(open ? item.id : null)}
                            onUpdateQuantity={updateQuantity}
                            onRemove={removeItem}
                        />
                    ))
                )}
            </div>

            {/* Summary */}
            <div className="border-t bg-card pt-4 pb-4 sticky bottom-0 mt-auto z-10 w-full md:shadow-[0_-15px_15px_-15px_rgba(0,0,0,0.05)]">
                <div className="mb-2 flex justify-between">
                    <span>ยอดรวม</span>
                    <span>{formatCurrency(getSubtotal())}</span>
                </div>
                <div className="mb-2 flex items-center justify-between">
                    <span>ส่วนลด</span>
                    <div className="flex items-center gap-1">
                        <span className="text-muted-foreground">฿</span>
                        <Input
                            type="number"
                            min={0}
                            value={discount || ''}
                            onChange={(e) => setDiscount(parseFloat(e.target.value.replace(/-/g, '')) || 0)}
                            className="w-24 text-right"
                            disabled={!isAdmin}
                            title={!isAdmin ? "เฉพาะผู้ดูแลระบบเท่านั้น" : "ส่วนลด"}
                        />
                    </div>
                </div>
                <div className="mb-4 flex justify-between text-lg font-bold">
                    <span>สุทธิ</span>
                    <span className="text-amber-600">{formatCurrency(getTotal())}</span>
                </div>

                <Dialog open={showPaymentDialog} onOpenChange={setShowPaymentDialog}>
                    <DialogTrigger asChild>
                        <Button
                            className="w-full bg-amber-500 hover:bg-amber-600 text-white font-semibold"
                            disabled={items.length === 0 || !customerId}
                        >
                            ชำระเงิน
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-md p-0 overflow-hidden rounded-2xl w-[95vw] mx-auto z-[100] sm:max-w-md">
                        {/* Dialog Header */}
                        <div className="bg-amber-500 px-6 py-5 text-white">
                            <DialogTitle className="text-lg font-bold text-white">ชำระเงิน</DialogTitle>
                            <DialogDescription className="text-amber-100 text-sm mt-0.5">
                                ระบุยอดเงินตามช่องทางที่ลูกค้าชำระ
                            </DialogDescription>
                            <div className="mt-3 flex items-end justify-between">
                                <span className="text-amber-100 text-sm">ยอดที่ต้องชำระ</span>
                                <span className="text-3xl font-bold tracking-tight">{formatCurrency(getTotal())}</span>
                            </div>
                        </div>
                        <div className="px-6 py-5 space-y-4 max-h-[70vh] overflow-y-auto">
                            {/* ... Inside content of Payment ... */}
                            {(customerAlerts?.drug_allergy || customerAlerts?.underlying_disease) && (
                                <div className="flex items-center gap-3 rounded-xl bg-red-50 border border-red-200 p-3">
                                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-red-100 shrink-0">
                                        <AlertTriangle className="h-4 w-4 text-red-600" />
                                    </div>
                                    <p className="text-sm font-medium text-red-700">
                                        ⚠️ {customerName} — ข้อควรระวัง
                                    </p>
                                </div>
                            )}

                            {/* Payment Method Rows */}
                            <div className="space-y-3">
                                {/* Cash */}
                                <div className="rounded-xl border border-green-200 bg-green-50">
                                    <div className="flex items-center gap-3 px-4 py-3">
                                        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-green-100 shrink-0">
                                            <Banknote className="h-4 w-4 text-green-600" />
                                        </div>
                                        <div className="flex-1">
                                            <p className="text-xs font-semibold text-green-700 mb-1.5">เงินสด</p>
                                            <div className="relative">
                                                <Input
                                                    type="number"
                                                    min={0}
                                                    inputMode="decimal"
                                                    value={cashAmount}
                                                    onChange={(e) => setCashAmount(e.target.value.replace(/-/g, ''))}
                                                    placeholder="0.00"
                                                    className="h-10 pr-24 bg-white border-green-200 focus-visible:ring-green-400"
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        const remaining = getRemainingBalance()
                                                        if (remaining > 0) {
                                                            setCashAmount(((parseFloat(cashAmount) || 0) + remaining).toString())
                                                        }
                                                    }}
                                                    className="absolute right-1.5 top-1/2 -translate-y-1/2 px-2.5 py-1 text-[11px] font-semibold text-amber-700 bg-amber-100 rounded-lg hover:bg-amber-200 transition-colors"
                                                >
                                                    เหลือทั้งหมด
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Transfer */}
                                <div className="rounded-xl border border-blue-200 bg-blue-50">
                                    <div className="flex items-center gap-3 px-4 py-3">
                                        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-100 shrink-0">
                                            <QrCode className="h-4 w-4 text-blue-600" />
                                        </div>
                                        <div className="flex-1">
                                            <p className="text-xs font-semibold text-blue-700 mb-1.5">โอนเงิน</p>
                                            <div className="relative">
                                                <Input
                                                    type="number"
                                                    min={0}
                                                    inputMode="decimal"
                                                    value={transferAmount}
                                                    onChange={(e) => setTransferAmount(e.target.value.replace(/-/g, ''))}
                                                    placeholder="0.00"
                                                    className="h-10 pr-24 bg-white border-blue-200 focus-visible:ring-blue-400"
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        const remaining = getRemainingBalance()
                                                        if (remaining > 0) {
                                                            setTransferAmount(((parseFloat(transferAmount) || 0) + remaining).toString())
                                                        }
                                                    }}
                                                    className="absolute right-1.5 top-1/2 -translate-y-1/2 px-2.5 py-1 text-[11px] font-semibold text-amber-700 bg-amber-100 rounded-lg hover:bg-amber-200 transition-colors"
                                                >
                                                    เหลือทั้งหมด
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Credit Card */}
                                <div className="rounded-xl border border-purple-200 bg-purple-50">
                                    <div className="flex items-center gap-3 px-4 py-3">
                                        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-purple-100 shrink-0">
                                            <CreditCard className="h-4 w-4 text-purple-600" />
                                        </div>
                                        <div className="flex-1">
                                            <p className="text-xs font-semibold text-purple-700 mb-1.5">บัตรเครดิต</p>
                                            <div className="relative">
                                                <Input
                                                    type="number"
                                                    min={0}
                                                    inputMode="decimal"
                                                    value={creditAmount}
                                                    onChange={(e) => setCreditAmount(e.target.value.replace(/-/g, ''))}
                                                    placeholder="0.00"
                                                    className="h-10 pr-24 bg-white border-purple-200 focus-visible:ring-purple-400"
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        const remaining = getRemainingBalance()
                                                        if (remaining > 0) {
                                                            setCreditAmount(((parseFloat(creditAmount) || 0) + remaining).toString())
                                                        }
                                                    }}
                                                    className="absolute right-1.5 top-1/2 -translate-y-1/2 px-2.5 py-1 text-[11px] font-semibold text-amber-700 bg-amber-100 rounded-lg hover:bg-amber-200 transition-colors"
                                                >
                                                    เหลือทั้งหมด
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Deposit */}
                                {customerDepositBalance > 0 && (
                                    <div className="rounded-xl border border-emerald-200 bg-emerald-50">
                                        <div className="flex items-center gap-3 px-4 py-3">
                                            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-100 shrink-0">
                                                <Wallet className="h-4 w-4 text-emerald-600" />
                                            </div>
                                            <div className="flex-1">
                                                <div className="flex items-center justify-between mb-1.5">
                                                    <p className="text-xs font-semibold text-emerald-700">เงินมัดจำ</p>
                                                    <span className="text-xs text-emerald-600 bg-emerald-100 px-2 py-0.5 rounded-full font-medium">
                                                        คงเหลือ ฿{customerDepositBalance.toLocaleString()}
                                                    </span>
                                                </div>
                                                <div className="relative">
                                                    <Input
                                                        type="number"
                                                        min={0}
                                                        inputMode="decimal"
                                                        value={depositAmount}
                                                        onChange={(e) => {
                                                            const val = parseFloat(e.target.value.replace(/-/g, '')) || 0
                                                            if (val <= customerDepositBalance) {
                                                                setDepositAmount(e.target.value.replace(/-/g, ''))
                                                            } else {
                                                                setDepositAmount(customerDepositBalance.toString())
                                                            }
                                                        }}
                                                        placeholder="0.00"
                                                        max={customerDepositBalance}
                                                        className="h-10 pr-20 bg-white border-emerald-200 focus-visible:ring-emerald-400"
                                                    />
                                                    <button
                                                        onClick={() => setDepositAmount(customerDepositBalance.toString())}
                                                        className="absolute right-1.5 top-1/2 -translate-y-1/2 px-2.5 py-1 text-[11px] font-semibold text-amber-700 bg-amber-100 rounded-lg hover:bg-amber-200 transition-colors"
                                                    >
                                                        ทั้งหมด
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Payment Summary */}
                            <div className="rounded-xl bg-slate-50 border border-slate-200 overflow-hidden">
                                <div className="px-4 py-3 flex items-center justify-between">
                                    <span className="text-sm text-slate-500">รวมที่ชำระ</span>
                                    <span className="text-lg font-bold text-emerald-600">{formatCurrency(getTotalPayment())}</span>
                                </div>
                                {getRemainingBalance() > 0 && (
                                    <div className="px-4 py-2 flex items-center justify-between bg-red-50 border-t border-red-100">
                                        <span className="text-sm text-red-600">ยังขาดอีก</span>
                                        <span className="text-sm font-bold text-red-600">{formatCurrency(getRemainingBalance())}</span>
                                    </div>
                                )}
                                {getTotalPayment() > getTotal() && (
                                    <div className="px-4 py-2 flex items-center justify-between bg-blue-50 border-t border-blue-100">
                                        <span className="text-sm text-blue-600">เงินทอน</span>
                                        <span className="text-sm font-bold text-blue-600">{formatCurrency(getTotalPayment() - getTotal())}</span>
                                    </div>
                                )}
                            </div>

                            {/* Partial Payment Notice */}
                            {getRemainingBalance() > 0 && (
                                <div className="flex items-center gap-2 rounded-xl bg-amber-50 border border-amber-200 px-4 py-3">
                                    <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0" />
                                    <p className="text-sm text-amber-700">
                                        ลูกค้าจะมียอดค้างชำระ <span className="font-bold">{formatCurrency(getRemainingBalance())}</span>
                                    </p>
                                </div>
                            )}

                            <Button
                                className="w-full h-12 bg-amber-500 hover:bg-amber-600 text-white font-bold text-base rounded-xl"
                                onClick={handleCheckout}
                                disabled={createTransaction.isPending || addPayment.isPending || getTotalPayment() <= 0}
                            >
                                {createTransaction.isPending || addPayment.isPending
                                    ? 'กำลังบันทึก...'
                                    : getRemainingBalance() > 0
                                        ? `ยืนยัน (ค้างชำระ ${formatCurrency(getRemainingBalance())})`
                                        : 'ยืนยันชำระเงิน'}
                            </Button>
                        </div>
                    </DialogContent>
                </Dialog>
            </div>
        </div>
    )

    return (
        <div className="flex flex-col md:flex-row h-[calc(100vh-8rem)] gap-0 md:gap-6 relative">
            {/* Courses Section */}
            <div className="flex-1 space-y-4 overflow-hidden pb-24 md:pb-0">
                <div className="flex items-center justify-between px-4 md:px-0 pt-4 md:pt-0">
                    <h2 className="text-2xl font-bold flex items-center gap-2">
                        <ShoppingCart className="h-6 w-6 text-primary" />
                        รายการสินค้า
                    </h2>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground bg-muted/50 px-2 py-1 rounded border">
                        <div className="flex items-center gap-1"><Keyboard className="h-3 w-3" /> <span className="font-mono bg-background px-1 rounded shadow-sm">F2</span> ค้นหา</div>
                        <div className="flex items-center gap-1"><span className="font-mono bg-background px-1 rounded shadow-sm">F9</span> ชำระเงิน</div>
                    </div>
                </div>
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                        ref={searchInputRef}
                        autoFocus
                        placeholder="ค้นหาคอร์ส..."
                        value={searchProduct}
                        onChange={(e) => setSearchProduct(e.target.value)}
                        className="pl-10 pr-8"
                        aria-label="Search products"
                    />
                    {searchProduct && (
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                                setSearchProduct('')
                                searchInputRef.current?.focus()
                            }}
                            className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8 text-slate-400 hover:text-slate-600 cursor-pointer"
                        >
                            <X className="h-4 w-4" />
                        </Button>
                    )}
                </div>

                <div className="h-[calc(100%-4rem)] overflow-auto">
                    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                        {courses
                            .filter(course =>
                                course.course_name.toLowerCase().includes(searchProduct.toLowerCase())
                            )
                            .map((course) => (
                                <ProductCard
                                    key={course.course_id}
                                    item={course}
                                    onAdd={addCourse}
                                    type="course"
                                />
                            ))}
                    </div>
                </div>
            </div>

            {/* Cart Section - Desktop */}
            <Card className="hidden md:flex flex-col w-[420px] flex-shrink-0">
                <CardHeader className="border-b py-4">
                    <CardTitle className="flex items-center gap-2">
                        <ShoppingCart className="h-5 w-5" />
                        ตะกร้าสินค้า
                    </CardTitle>
                </CardHeader>
                {renderCartContent()}
            </Card>

            {/* Mobile Bottom Bar & Cart Sheet */}
            <div className="md:hidden fixed bottom-16 left-0 right-0 z-40 bg-white border-t p-3 shadow-lg flex items-center justify-between pb-safe">
                <div className="flex flex-col">
                    <span className="text-xs text-muted-foreground">{items.length} รายการ</span>
                    <span className="font-bold text-amber-600">{formatCurrency(getTotal())}</span>
                </div>
                <Sheet>
                    <SheetTrigger asChild>
                        <Button className="bg-amber-500 hover:bg-amber-600 text-white rounded-xl">
                            <ShoppingCart className="h-4 w-4 mr-2" />
                            เปิดตะกร้า
                        </Button>
                    </SheetTrigger>
                    <SheetContent side="bottom" className="h-[90vh] p-0 flex flex-col rounded-t-xl z-[90]">
                        <SheetHeader className="px-4 py-3 border-b text-left">
                            <SheetTitle className="flex items-center gap-2">
                                <ShoppingCart className="h-5 w-5" />
                                ตะกร้าสินค้า
                            </SheetTitle>
                        </SheetHeader>
                        {renderCartContent()}
                    </SheetContent>
                </Sheet>
            </div>

            {/* Receipt Prompt Dialog */}
            <Dialog open={showReceiptPrompt} onOpenChange={setShowReceiptPrompt}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <Printer className="h-5 w-5 text-green-500" />
                            บันทึกสำเร็จ
                        </DialogTitle>
                    </DialogHeader>
                    <p className="text-muted-foreground">ต้องการพิมพ์ใบเสร็จหรือไม่?</p>
                    <div className="flex gap-2 justify-end mt-4">
                        <Button variant="outline" onClick={() => setShowReceiptPrompt(false)}>
                            ไม่ต้อง
                        </Button>
                        <Button
                            className="bg-amber-500 hover:bg-amber-600 text-white"
                            onClick={() => {
                                setShowReceiptPrompt(false)
                                if (lastTransactionId) {
                                    window.open(`/receipt/${lastTransactionId}`, '_blank')
                                }
                            }}
                        >
                            <Printer className="h-4 w-4 mr-2" />
                            พิมพ์ใบเสร็จ
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        </div >
    )
}
