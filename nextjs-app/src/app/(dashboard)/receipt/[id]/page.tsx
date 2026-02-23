'use client'

import { use } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'
import { Printer, ArrowLeft, Download } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ReceiptTemplate } from '@/components/receipt/receipt-template'

interface TransactionDetail {
    transaction_id: number
    transaction_date: string
    total_amount: number
    discount: number
    net_amount: number
    customer: {
        full_name: string | null
        first_name: string
        last_name: string
        phone_number: string
    } | null
    transaction_item: Array<{
        product?: { product_name: string } | null
        course?: { course_name: string } | null
        qty: number
        unit_price: number
        subtotal: number
    }>
    payment_log: Array<{
        amount_paid: number
        payment_method: string
    }>
}

export default function ReceiptPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params)
    const router = useRouter()

    const { data: transaction, isLoading, error } = useQuery<TransactionDetail>({
        queryKey: ['transaction-receipt', id],
        queryFn: async () => {
            const res = await fetch(`/api/transactions/${id}`)
            if (!res.ok) throw new Error('Failed to fetch')
            return res.json()
        },
    })

    const handlePrint = () => {
        window.print()
    }

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500" />
            </div>
        )
    }

    if (error || !transaction) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen gap-4">
                <p className="text-red-500">ไม่พบข้อมูลใบเสร็จ</p>
                <Button variant="outline" onClick={() => router.back()}>
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    กลับ
                </Button>
            </div>
        )
    }

    // Transform data for receipt
    const paymentLogs = transaction.payment_log || []
    const details = transaction.transaction_item || []
    // If no payment logs, assume fully paid with net_amount
    const totalPaid = paymentLogs.length > 0
        ? paymentLogs.reduce((sum, p) => sum + Number(p.amount_paid || 0), 0)
        : Number(transaction.net_amount || 0)
    const remaining = Number(transaction.net_amount || 0) - totalPaid

    const receiptData = {
        transactionId: transaction.transaction_id,
        billNumber: String(transaction.transaction_id).padStart(5, '0'),
        date: transaction.transaction_date,
        customer: {
            name: transaction.customer?.full_name ||
                `${transaction.customer?.first_name || ''} ${transaction.customer?.last_name || ''}`.trim() ||
                'ลูกค้าทั่วไป',
            phone: transaction.customer?.phone_number || '-',
        },
        items: details.map(d => ({
            name: d.product?.product_name || d.course?.course_name || 'สินค้า',
            qty: d.qty,
            unitPrice: Number(d.unit_price || 0),
            price: Number(d.subtotal || 0),
            remaining: 0,
            paid: Number(d.subtotal || 0),
        })),
        subtotal: Number(transaction.total_amount || 0),
        discount: Number(transaction.discount || 0),
        total: Number(transaction.net_amount || 0),
        paid: totalPaid,
        remaining: remaining > 0 ? remaining : 0,
    }

    return (
        <div className="min-h-screen bg-gray-100 py-8">
            {/* Action buttons - hidden when printing */}
            <div className="print:hidden max-w-[210mm] mx-auto mb-4 flex gap-2 px-4">
                <Button variant="outline" onClick={() => router.back()}>
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    กลับ
                </Button>
                <Button onClick={handlePrint} className="bg-blue-500 hover:bg-blue-600">
                    <Printer className="h-4 w-4 mr-2" />
                    พิมพ์ใบเสร็จ
                </Button>
            </div>

            {/* Receipt */}
            <ReceiptTemplate data={receiptData} showCopy={true} />
        </div>
    )
}
