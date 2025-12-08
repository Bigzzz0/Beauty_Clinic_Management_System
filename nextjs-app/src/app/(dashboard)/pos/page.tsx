'use client'

import { useState, useEffect } from 'react'
import {
    Search, ShoppingCart, Trash2, Plus, Minus,
    CreditCard, Banknote, QrCode, AlertTriangle,
    User, Stethoscope, HandHelping, ChevronDown
} from 'lucide-react'
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
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import {
    Collapsible,
    CollapsibleContent,
    CollapsibleTrigger,
} from '@/components/ui/collapsible'

interface Staff {
    staff_id: number
    full_name: string
    position: string
}

export default function POSPage() {
    const token = useAuthStore((s) => s.token)

    const [searchProduct, setSearchProduct] = useState('')
    const [searchCustomer, setSearchCustomer] = useState('')
    const [showPaymentDialog, setShowPaymentDialog] = useState(false)
    const [isPartialPayment, setIsPartialPayment] = useState(false)
    const [expandedItem, setExpandedItem] = useState<string | null>(null)

    // Split payment state
    const [cashAmount, setCashAmount] = useState('')
    const [transferAmount, setTransferAmount] = useState('')
    const [creditAmount, setCreditAmount] = useState('')

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

    // Calculate total payment from split amounts
    const getTotalPayment = () => {
        return (parseFloat(cashAmount) || 0) + (parseFloat(transferAmount) || 0) + (parseFloat(creditAmount) || 0)
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

            await Promise.all(payments)

            const remaining = getRemainingBalance()
            if (remaining > 0) {
                toast.success(`บันทึกสำเร็จ - ยอดค้างชำระ ${formatCurrency(remaining)}`)
            } else {
                toast.success('บันทึกการขายสำเร็จ')
            }

            clearCart()
            setShowPaymentDialog(false)
            setCashAmount('')
            setTransferAmount('')
            setCreditAmount('')
            setIsPartialPayment(false)
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
        }
    }, [showPaymentDialog])

    return (
        <div className="flex h-[calc(100vh-8rem)] gap-6">
            {/* Products Section */}
            <div className="flex-1 space-y-4 overflow-hidden">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <Input
                        placeholder="ค้นหาสินค้า/คอร์ส..."
                        value={searchProduct}
                        onChange={(e) => setSearchProduct(e.target.value)}
                        className="pl-10"
                    />
                </div>

                <Tabs defaultValue="courses" className="h-full">
                    <TabsList>
                        <TabsTrigger value="courses">คอร์ส</TabsTrigger>
                        <TabsTrigger value="products">สินค้า</TabsTrigger>
                    </TabsList>

                    <TabsContent value="courses" className="h-[calc(100%-3rem)] overflow-auto">
                        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                            {courses.map((course) => (
                                <Card
                                    key={course.course_id}
                                    className="cursor-pointer transition-all hover:ring-2 hover:ring-purple-200"
                                    onClick={() => addCourse(course)}
                                >
                                    <CardContent className="p-4">
                                        <Badge variant="secondary" className="mb-2 bg-purple-100 text-purple-700">
                                            คอร์ส
                                        </Badge>
                                        <h4 className="font-medium">{course.course_name}</h4>
                                        <p className="mt-1 text-lg font-bold text-purple-600">
                                            {formatCurrency(course.standard_price)}
                                        </p>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    </TabsContent>

                    <TabsContent value="products" className="h-[calc(100%-3rem)] overflow-auto">
                        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                            {products.map((product) => (
                                <Card
                                    key={product.product_id}
                                    className="cursor-pointer transition-all hover:ring-2 hover:ring-pink-200"
                                    onClick={() => addProduct(product)}
                                >
                                    <CardContent className="p-4">
                                        <Badge className="mb-2">{product.category}</Badge>
                                        <h4 className="font-medium">{product.product_name}</h4>
                                        <p className="mt-1 text-lg font-bold text-pink-600">
                                            {formatCurrency(product.standard_price)}
                                        </p>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    </TabsContent>
                </Tabs>
            </div>

            {/* Cart Section */}
            <Card className="w-[420px] flex-shrink-0">
                <CardHeader className="border-b">
                    <CardTitle className="flex items-center gap-2">
                        <ShoppingCart className="h-5 w-5" />
                        ตะกร้าสินค้า
                    </CardTitle>
                </CardHeader>
                <CardContent className="flex h-[calc(100%-5rem)] flex-col p-4">
                    {/* Customer Selection */}
                    <div className="mb-4">
                        <Label className="mb-2 block">ลูกค้า</Label>
                        {customerId ? (
                            <div className="space-y-2">
                                <div className="flex items-center justify-between rounded-lg bg-pink-50 p-3">
                                    <div className="flex items-center gap-2">
                                        <User className="h-5 w-5 text-pink-600" />
                                        <span className="font-medium text-pink-700">{customerName}</span>
                                    </div>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => setCustomer(0, '', null)}
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
                                <Input
                                    placeholder="ค้นหาลูกค้า (ชื่อ/เบอร์/HN)..."
                                    value={searchCustomer}
                                    onChange={(e) => setSearchCustomer(e.target.value)}
                                />
                                {customers.length > 0 && (
                                    <div className="absolute z-10 mt-1 w-full rounded-lg border bg-white shadow-lg max-h-60 overflow-auto">
                                        {customers.map((customer) => (
                                            <div
                                                key={customer.customer_id}
                                                className="cursor-pointer p-3 hover:bg-slate-50"
                                                onClick={() => handleSelectCustomer(customer)}
                                            >
                                                <p className="font-medium">
                                                    {customer.first_name} {customer.last_name}
                                                </p>
                                                <p className="text-sm text-slate-500">{customer.hn_code} • {customer.phone_number}</p>
                                                {(customer.drug_allergy || customer.underlying_disease) && (
                                                    <Badge className="mt-1 bg-red-100 text-red-700 text-xs">⚠️ มีข้อควรระวัง</Badge>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Cart Items */}
                    <div className="flex-1 space-y-3 overflow-auto">
                        {items.length === 0 ? (
                            <p className="py-8 text-center text-slate-400">ไม่มีสินค้าในตะกร้า</p>
                        ) : (
                            items.map((item) => (
                                <Collapsible
                                    key={item.id}
                                    open={expandedItem === item.id}
                                    onOpenChange={(open) => setExpandedItem(open ? item.id : null)}
                                >
                                    <div className="rounded-lg bg-slate-50 p-3">
                                        <div className="flex items-center justify-between">
                                            <div className="flex-1">
                                                <p className="font-medium">
                                                    {item.product?.product_name || item.course?.course_name}
                                                </p>
                                                <p className="text-sm text-slate-500">
                                                    {formatCurrency(item.unit_price)}
                                                </p>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <Button
                                                    variant="outline"
                                                    size="icon"
                                                    className="h-8 w-8"
                                                    onClick={() => updateQuantity(item.id, item.qty - 1)}
                                                >
                                                    <Minus className="h-3 w-3" />
                                                </Button>
                                                <span className="w-8 text-center">{item.qty}</span>
                                                <Button
                                                    variant="outline"
                                                    size="icon"
                                                    className="h-8 w-8"
                                                    onClick={() => updateQuantity(item.id, item.qty + 1)}
                                                >
                                                    <Plus className="h-3 w-3" />
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-8 w-8 text-red-500"
                                                    onClick={() => removeItem(item.id)}
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </div>

                                        {/* Staff Assignment Toggle */}
                                        <CollapsibleTrigger asChild>
                                            <Button variant="ghost" size="sm" className="w-full mt-2 text-xs">
                                                <ChevronDown className={`h-4 w-4 mr-1 transition-transform ${expandedItem === item.id ? 'rotate-180' : ''}`} />
                                                {item.staff?.doctor_name || item.staff?.therapist_name
                                                    ? `👨‍⚕️ ${item.staff.doctor_name || '-'} | 👩‍⚕️ ${item.staff.therapist_name || '-'}`
                                                    : 'กำหนดแพทย์/พนักงาน'
                                                }
                                            </Button>
                                        </CollapsibleTrigger>

                                        <CollapsibleContent className="mt-2 space-y-2">
                                            <div>
                                                <Label className="text-xs flex items-center gap-1">
                                                    <Stethoscope className="h-3 w-3" />
                                                    แพทย์ (DF)
                                                </Label>
                                                <Select
                                                    value={item.staff?.doctor_id?.toString() || ''}
                                                    onValueChange={(v) => {
                                                        const doc = doctors.find(d => d.staff_id === parseInt(v))
                                                        setItemStaff(item.id, {
                                                            ...item.staff,
                                                            doctor_id: parseInt(v) || null,
                                                            doctor_name: doc?.full_name || null,
                                                            therapist_id: item.staff?.therapist_id || null,
                                                            therapist_name: item.staff?.therapist_name || null,
                                                        })
                                                    }}
                                                >
                                                    <SelectTrigger className="h-8 text-xs">
                                                        <SelectValue placeholder="เลือกแพทย์" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        {doctors.map((doc) => (
                                                            <SelectItem key={doc.staff_id} value={doc.staff_id.toString()}>
                                                                {doc.full_name}
                                                            </SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                            </div>

                                            <div>
                                                <Label className="text-xs flex items-center gap-1">
                                                    <HandHelping className="h-3 w-3" />
                                                    พนักงาน (Hand Fee)
                                                </Label>
                                                <Select
                                                    value={item.staff?.therapist_id?.toString() || ''}
                                                    onValueChange={(v) => {
                                                        const th = therapists.find(t => t.staff_id === parseInt(v))
                                                        setItemStaff(item.id, {
                                                            ...item.staff,
                                                            doctor_id: item.staff?.doctor_id || null,
                                                            doctor_name: item.staff?.doctor_name || null,
                                                            therapist_id: parseInt(v) || null,
                                                            therapist_name: th?.full_name || null,
                                                        })
                                                    }}
                                                >
                                                    <SelectTrigger className="h-8 text-xs">
                                                        <SelectValue placeholder="เลือกพนักงาน" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        {therapists.map((th) => (
                                                            <SelectItem key={th.staff_id} value={th.staff_id.toString()}>
                                                                {th.full_name}
                                                            </SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                        </CollapsibleContent>
                                    </div>
                                </Collapsible>
                            ))
                        )}
                    </div>

                    {/* Summary */}
                    <div className="border-t pt-4">
                        <div className="mb-2 flex justify-between">
                            <span>ยอดรวม</span>
                            <span>{formatCurrency(getSubtotal())}</span>
                        </div>
                        <div className="mb-2 flex items-center justify-between">
                            <span>ส่วนลด</span>
                            <div className="flex items-center gap-1">
                                <span className="text-slate-500">฿</span>
                                <Input
                                    type="number"
                                    value={discount}
                                    onChange={(e) => setDiscount(parseFloat(e.target.value) || 0)}
                                    className="w-24 text-right"
                                />
                            </div>
                        </div>
                        <div className="mb-4 flex justify-between text-lg font-bold">
                            <span>สุทธิ</span>
                            <span className="text-pink-600">{formatCurrency(getTotal())}</span>
                        </div>

                        <Dialog open={showPaymentDialog} onOpenChange={setShowPaymentDialog}>
                            <DialogTrigger asChild>
                                <Button
                                    className="w-full bg-gradient-to-r from-green-500 to-green-600"
                                    disabled={items.length === 0 || !customerId}
                                >
                                    ชำระเงิน
                                </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-md">
                                <DialogHeader>
                                    <DialogTitle>ชำระเงิน</DialogTitle>
                                </DialogHeader>
                                <div className="space-y-4">
                                    {/* Customer Alert in Payment */}
                                    {(customerAlerts?.drug_allergy || customerAlerts?.underlying_disease) && (
                                        <div className="rounded-lg bg-red-100 border border-red-300 p-3">
                                            <div className="flex items-center gap-2 text-red-700 font-medium">
                                                <AlertTriangle className="h-4 w-4" />
                                                ⚠️ {customerName} - ข้อควรระวัง
                                            </div>
                                        </div>
                                    )}

                                    {/* Split Payment Inputs */}
                                    <div className="space-y-3">
                                        <div className="flex items-center gap-3 p-3 rounded-lg bg-green-50">
                                            <Banknote className="h-5 w-5 text-green-600" />
                                            <div className="flex-1">
                                                <Label className="text-xs">เงินสด</Label>
                                                <Input
                                                    type="number"
                                                    value={cashAmount}
                                                    onChange={(e) => setCashAmount(e.target.value)}
                                                    placeholder="0"
                                                    className="h-9"
                                                />
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-3 p-3 rounded-lg bg-blue-50">
                                            <QrCode className="h-5 w-5 text-blue-600" />
                                            <div className="flex-1">
                                                <Label className="text-xs">โอนเงิน</Label>
                                                <Input
                                                    type="number"
                                                    value={transferAmount}
                                                    onChange={(e) => setTransferAmount(e.target.value)}
                                                    placeholder="0"
                                                    className="h-9"
                                                />
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-3 p-3 rounded-lg bg-purple-50">
                                            <CreditCard className="h-5 w-5 text-purple-600" />
                                            <div className="flex-1">
                                                <Label className="text-xs">บัตรเครดิต</Label>
                                                <Input
                                                    type="number"
                                                    value={creditAmount}
                                                    onChange={(e) => setCreditAmount(e.target.value)}
                                                    placeholder="0"
                                                    className="h-9"
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    {/* Summary */}
                                    <div className="rounded-lg bg-slate-100 p-4 space-y-2">
                                        <div className="flex justify-between">
                                            <span>ยอดที่ต้องชำระ</span>
                                            <span className="font-bold text-pink-600">{formatCurrency(getTotal())}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span>รวมที่ชำระ</span>
                                            <span className="font-bold text-green-600">{formatCurrency(getTotalPayment())}</span>
                                        </div>
                                        {getRemainingBalance() > 0 && (
                                            <div className="flex justify-between text-red-600">
                                                <span>ยอดค้างชำระ</span>
                                                <span className="font-bold">{formatCurrency(getRemainingBalance())}</span>
                                            </div>
                                        )}
                                        {getTotalPayment() > getTotal() && (
                                            <div className="flex justify-between text-blue-600">
                                                <span>เงินทอน</span>
                                                <span className="font-bold">{formatCurrency(getTotalPayment() - getTotal())}</span>
                                            </div>
                                        )}
                                    </div>

                                    {/* Partial Payment Toggle */}
                                    {getRemainingBalance() > 0 && (
                                        <div className="p-3 rounded-lg bg-amber-50 border border-amber-200">
                                            <p className="text-sm text-amber-700 flex items-center gap-2">
                                                <AlertTriangle className="h-4 w-4" />
                                                ลูกค้าจะมียอดค้างชำระ {formatCurrency(getRemainingBalance())}
                                            </p>
                                        </div>
                                    )}

                                    <Button
                                        className="w-full bg-gradient-to-r from-green-500 to-green-600"
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
                </CardContent>
            </Card>
        </div>
    )
}
