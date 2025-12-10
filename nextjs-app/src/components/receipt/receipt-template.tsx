'use client'

import { clinicConfig } from '@/lib/clinic-config'
import { formatCurrency, formatDate } from '@/lib/utils'

interface ReceiptItem {
    name: string
    price: number
    remaining: number
    paid: number
}

interface ReceiptData {
    transactionId: number
    billNumber: string
    date: string
    customer: {
        name: string
        phone: string
    }
    items: ReceiptItem[]
    subtotal: number
    discount: number
    total: number
    paid: number
    remaining: number
    cashier?: string
}

interface ReceiptTemplateProps {
    data: ReceiptData
    showCopy?: boolean
}

export function ReceiptTemplate({ data, showCopy = true }: ReceiptTemplateProps) {
    const renderReceipt = (isClinicCopy: boolean) => (
        <div
            className="receipt-section bg-white mx-auto relative overflow-hidden"
            style={{
                fontFamily: "'Sarabun', 'Prompt', Arial, sans-serif",
                maxWidth: '210mm',
                padding: '0',
            }}
        >
            {/* Decorative Top Border */}
            <div
                style={{
                    background: 'linear-gradient(90deg, #f8f4e8 0%, #c9a227 25%, #d4af37 50%, #c9a227 75%, #f8f4e8 100%)',
                    height: '8px',
                }}
            />

            {/* Header Section */}
            <div
                style={{
                    background: 'linear-gradient(135deg, #fffef8 0%, #faf6e8 50%, #f8f4e0 100%)',
                    padding: '28px 32px',
                    borderBottom: '2px solid #d4af37',
                }}
            >
                <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                    {/* Logo */}
                    <div
                        style={{
                            width: '85px',
                            height: '85px',
                            background: 'linear-gradient(135deg, #d4af37 0%, #f4d03f 50%, #d4af37 100%)',
                            borderRadius: '14px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            boxShadow: '0 6px 20px rgba(212, 175, 55, 0.35)',
                            border: '3px solid #c9a227',
                        }}
                    >
                        <span
                            style={{
                                fontWeight: '800',
                                fontSize: '26px',
                                color: '#fff',
                                letterSpacing: '-1px',
                                textShadow: '1px 1px 2px rgba(0,0,0,0.2)',
                            }}
                        >
                            jiin
                        </span>
                    </div>

                    {/* Clinic Info */}
                    <div style={{ flex: 1 }}>
                        <h1
                            style={{
                                fontSize: '24px',
                                fontWeight: '700',
                                margin: '0 0 6px 0',
                                color: '#8b6914',
                            }}
                        >
                            {clinicConfig.name}
                        </h1>
                        <p style={{ fontSize: '14px', margin: '0 0 4px 0', color: '#5c4a0f' }}>
                            {clinicConfig.branch} • {clinicConfig.address}
                        </p>
                        <p style={{ fontSize: '13px', margin: '0', color: '#7a6420' }}>
                            เลขประจำตัวผู้เสียภาษี: {clinicConfig.taxId}
                        </p>
                    </div>
                </div>

                {/* Contact Info */}
                <div
                    style={{
                        marginTop: '16px',
                        paddingTop: '14px',
                        borderTop: '1px dashed #d4af37',
                        display: 'flex',
                        justifyContent: 'center',
                        gap: '28px',
                        fontSize: '13px',
                        color: '#6b5a1e',
                    }}
                >
                    <span>📞 {clinicConfig.phone}</span>
                    <span>💬 Line: {clinicConfig.line}</span>
                    <span>📱 Facebook: {clinicConfig.facebook}</span>
                </div>
            </div>

            {/* Bill Number & Customer Info */}
            <div
                style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '20px 32px',
                    background: '#fff',
                    borderBottom: '1px solid #e8e0c8',
                }}
            >
                <div>
                    <p style={{ margin: '0 0 6px 0', fontSize: '12px', color: '#999', fontWeight: '500', letterSpacing: '0.5px' }}>
                        ข้อมูลลูกค้า
                    </p>
                    <p style={{ margin: '0', fontSize: '18px', fontWeight: '600', color: '#333' }}>
                        {data.customer.name}
                    </p>
                    <p style={{ margin: '4px 0 0 0', fontSize: '14px', color: '#666' }}>
                        📱 {data.customer.phone}
                    </p>
                </div>

                <div style={{ textAlign: 'right' }}>
                    <div
                        style={{
                            display: 'inline-block',
                            background: 'linear-gradient(135deg, #d4af37 0%, #e8c547 100%)',
                            color: '#fff',
                            padding: '12px 24px',
                            borderRadius: '12px',
                            boxShadow: '0 4px 15px rgba(212, 175, 55, 0.4)',
                        }}
                    >
                        <p style={{ margin: '0', fontSize: '10px', letterSpacing: '1.5px', opacity: 0.9, fontWeight: '500' }}>
                            BILL NO.
                        </p>
                        <p style={{ margin: '0', fontSize: '28px', fontWeight: '800', textShadow: '1px 1px 2px rgba(0,0,0,0.15)' }}>
                            {data.billNumber}
                        </p>
                    </div>
                    <p style={{ margin: '10px 0 0 0', fontSize: '13px', color: '#666' }}>
                        📅 {formatDate(data.date)}
                    </p>
                    <p
                        style={{
                            margin: '4px 0 0 0',
                            fontSize: '12px',
                            color: isClinicCopy ? '#d4af37' : '#22c55e',
                            fontWeight: '600',
                        }}
                    >
                        {isClinicCopy ? '📋 สำเนาคลินิก' : '🧾 สำเนาลูกค้า'}
                    </p>
                </div>
            </div>

            {/* Items Table */}
            <div style={{ padding: '24px 32px' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
                    <thead>
                        <tr>
                            <th
                                style={{
                                    background: 'linear-gradient(135deg, #d4af37 0%, #e8c547 100%)',
                                    color: '#fff',
                                    padding: '14px 16px',
                                    textAlign: 'center',
                                    borderRadius: '10px 0 0 0',
                                    width: '45px',
                                    fontWeight: '600',
                                }}
                            >
                                #
                            </th>
                            <th
                                style={{
                                    background: 'linear-gradient(135deg, #d4af37 0%, #e8c547 100%)',
                                    color: '#fff',
                                    padding: '14px 16px',
                                    textAlign: 'left',
                                    fontWeight: '600',
                                }}
                            >
                                รายการ
                            </th>
                            <th
                                style={{
                                    background: 'linear-gradient(135deg, #d4af37 0%, #e8c547 100%)',
                                    color: '#fff',
                                    padding: '14px 16px',
                                    textAlign: 'right',
                                    fontWeight: '600',
                                    width: '120px',
                                }}
                            >
                                ราคา
                            </th>
                            <th
                                style={{
                                    background: 'linear-gradient(135deg, #d4af37 0%, #e8c547 100%)',
                                    color: '#fff',
                                    padding: '14px 16px',
                                    textAlign: 'right',
                                    fontWeight: '600',
                                    width: '120px',
                                }}
                            >
                                คงค้าง
                            </th>
                            <th
                                style={{
                                    background: 'linear-gradient(135deg, #d4af37 0%, #e8c547 100%)',
                                    color: '#fff',
                                    padding: '14px 16px',
                                    textAlign: 'right',
                                    borderRadius: '0 10px 0 0',
                                    fontWeight: '600',
                                    width: '120px',
                                }}
                            >
                                ชำระ
                            </th>
                        </tr>
                    </thead>
                    <tbody>
                        {data.items.map((item, i) => (
                            <tr
                                key={i}
                                style={{
                                    background: i % 2 === 0 ? '#fff' : '#fdfcf7',
                                    borderBottom: '1px solid #f0e8d0',
                                }}
                            >
                                <td style={{ padding: '16px', textAlign: 'center', color: '#b8a040', fontWeight: '500' }}>
                                    {i + 1}
                                </td>
                                <td style={{ padding: '16px', fontWeight: '500', color: '#333' }}>
                                    {item.name}
                                </td>
                                <td style={{ padding: '16px', textAlign: 'right', color: '#555' }}>
                                    {formatCurrency(item.price).replace('฿', '')}
                                </td>
                                <td style={{ padding: '16px', textAlign: 'right', color: '#aaa' }}>
                                    -
                                </td>
                                <td style={{ padding: '16px', textAlign: 'right', color: '#aaa' }}>
                                    -
                                </td>
                            </tr>
                        ))}

                        {/* Empty rows to maintain minimum height */}
                        {data.items.length < 5 && [...Array(5 - data.items.length)].map((_, i) => (
                            <tr
                                key={`empty-${i}`}
                                style={{
                                    background: (data.items.length + i) % 2 === 0 ? '#fff' : '#fdfcf7',
                                    borderBottom: '1px solid #f0e8d0',
                                }}
                            >
                                <td style={{ padding: '16px', color: '#ddd', textAlign: 'center' }}>{data.items.length + i + 1}</td>
                                <td style={{ padding: '16px' }}>&nbsp;</td>
                                <td style={{ padding: '16px' }}></td>
                                <td style={{ padding: '16px' }}></td>
                                <td style={{ padding: '16px' }}></td>
                            </tr>
                        ))}

                        {/* Total Row */}
                        <tr
                            style={{
                                background: 'linear-gradient(135deg, #d4af37 0%, #e8c547 100%)',
                            }}
                        >
                            <td colSpan={2} style={{ padding: '16px', fontWeight: '700', color: '#fff', textAlign: 'right' }}>
                                รวม
                            </td>
                            <td style={{ padding: '16px', textAlign: 'right', fontWeight: '700', color: '#fff' }}>
                                {formatCurrency(data.total).replace('฿', '')}
                            </td>
                            <td style={{ padding: '16px', textAlign: 'right', fontWeight: '700', color: data.remaining > 0 ? '#fff' : '#fff' }}>
                                {data.remaining > 0 ? formatCurrency(data.remaining).replace('฿', '') : '-'}
                            </td>
                            <td style={{ padding: '16px', textAlign: 'right', fontWeight: '700', color: '#fff' }}>
                                {formatCurrency(data.paid).replace('฿', '')}
                            </td>
                        </tr>
                    </tbody>
                </table>

                {/* Summary Section */}
                <div
                    style={{
                        marginTop: '20px',
                        background: 'linear-gradient(135deg, #fffef8 0%, #faf6e8 100%)',
                        borderRadius: '14px',
                        padding: '22px 28px',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        border: '2px solid #d4af37',
                    }}
                >
                    <div style={{ display: 'flex', gap: '36px' }}>
                        {data.discount > 0 && (
                            <div style={{ textAlign: 'center' }}>
                                <p style={{ margin: '0 0 6px 0', fontSize: '12px', color: '#888', fontWeight: '500' }}>ส่วนลด</p>
                                <p style={{ margin: '0', fontSize: '20px', fontWeight: '700', color: '#f87171' }}>
                                    -{formatCurrency(data.discount)}
                                </p>
                            </div>
                        )}
                        <div style={{ textAlign: 'center' }}>
                            <p style={{ margin: '0 0 6px 0', fontSize: '12px', color: '#888', fontWeight: '500' }}>ยอดรวม</p>
                            <p style={{ margin: '0', fontSize: '20px', fontWeight: '700', color: '#8b6914' }}>
                                {formatCurrency(data.total)}
                            </p>
                        </div>
                        {data.remaining > 0 && (
                            <div style={{ textAlign: 'center' }}>
                                <p style={{ margin: '0 0 6px 0', fontSize: '12px', color: '#888', fontWeight: '500' }}>คงค้าง</p>
                                <p style={{ margin: '0', fontSize: '20px', fontWeight: '700', color: '#f87171' }}>
                                    {formatCurrency(data.remaining)}
                                </p>
                            </div>
                        )}
                    </div>

                    <div
                        style={{
                            background: 'linear-gradient(135deg, #d4af37 0%, #e8c547 100%)',
                            padding: '18px 36px',
                            borderRadius: '14px',
                            textAlign: 'center',
                            boxShadow: '0 6px 20px rgba(212, 175, 55, 0.35)',
                        }}
                    >
                        <p style={{ margin: '0 0 4px 0', fontSize: '12px', color: '#fff', opacity: 0.9, fontWeight: '500' }}>
                            ยอดชำระ
                        </p>
                        <p
                            style={{
                                margin: '0',
                                fontSize: '30px',
                                fontWeight: '800',
                                color: '#fff',
                                textShadow: '1px 1px 3px rgba(0,0,0,0.15)',
                            }}
                        >
                            ฿{formatCurrency(data.paid).replace('฿', '')}
                        </p>
                    </div>
                </div>
            </div>

            {/* Signature Section */}
            <div
                style={{
                    padding: '24px 32px',
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr',
                    gap: '48px',
                }}
            >
                <div style={{ textAlign: 'center' }}>
                    <div
                        style={{
                            height: '65px',
                            border: '2px dashed #d4af37',
                            borderRadius: '10px',
                            marginBottom: '10px',
                            background: '#fdfcf7',
                            display: 'flex',
                            alignItems: 'flex-end',
                            justifyContent: 'center',
                            paddingBottom: '10px',
                        }}
                    >
                        <span style={{ fontSize: '12px', color: '#bbb' }}>ลายเซ็น</span>
                    </div>
                    <p style={{ margin: '0', fontSize: '14px', fontWeight: '600', color: '#5c4a0f' }}>
                        ผู้รับเงิน / แคชเชียร์
                    </p>
                    {data.cashier && (
                        <p style={{ margin: '4px 0 0 0', fontSize: '12px', color: '#888' }}>
                            ({data.cashier})
                        </p>
                    )}
                </div>
                <div style={{ textAlign: 'center' }}>
                    <div
                        style={{
                            height: '65px',
                            border: '2px dashed #22c55e',
                            borderRadius: '10px',
                            marginBottom: '10px',
                            background: '#f8fdf8',
                            display: 'flex',
                            alignItems: 'flex-end',
                            justifyContent: 'center',
                            paddingBottom: '10px',
                        }}
                    >
                        <span style={{ fontSize: '12px', color: '#bbb' }}>ลายเซ็น</span>
                    </div>
                    <p style={{ margin: '0', fontSize: '14px', fontWeight: '600', color: '#166534' }}>
                        ลูกค้า / ผู้รับบริการ
                    </p>
                </div>
            </div>

            {/* Footer */}
            <div
                style={{
                    background: 'linear-gradient(135deg, #fffef8 0%, #faf6e8 100%)',
                    padding: '20px 32px',
                    textAlign: 'center',
                    borderTop: '2px solid #d4af37',
                }}
            >
                <p
                    style={{
                        margin: '0 0 8px 0',
                        fontSize: '15px',
                        color: '#8b6914',
                        fontWeight: '600',
                    }}
                >
                    ✨ ขอบคุณที่ใช้บริการ JIIN CLINIC ✨
                </p>
                <p style={{ margin: '0', fontSize: '12px', color: '#999' }}>
                    กรุณาเก็บใบเสร็จนี้ไว้เป็นหลักฐาน • สอบถามเพิ่มเติม {clinicConfig.phone}
                </p>
            </div>

            {/* Decorative Bottom Border */}
            <div
                style={{
                    background: 'linear-gradient(90deg, #f8f4e8 0%, #c9a227 25%, #d4af37 50%, #c9a227 75%, #f8f4e8 100%)',
                    height: '8px',
                }}
            />
        </div>
    )

    return (
        <div className="print-container">
            {/* Clinic Copy */}
            {renderReceipt(true)}

            {/* Page break for printing */}
            {showCopy && (
                <>
                    <div className="page-break my-8 border-b-2 border-dashed border-amber-300 print:hidden" />
                    <div className="print:break-before-page">
                        {renderReceipt(false)}
                    </div>
                </>
            )}

            {/* Print styles */}
            <style jsx global>{`
                @import url('https://fonts.googleapis.com/css2?family=Sarabun:wght@400;500;600;700;800&display=swap');
                
                @media print {
                    body * {
                        visibility: hidden;
                    }
                    .print-container, .print-container * {
                        visibility: visible;
                    }
                    .print-container {
                        position: absolute;
                        left: 0;
                        top: 0;
                        width: 100%;
                    }
                    .receipt-section {
                        page-break-inside: avoid;
                        box-shadow: none !important;
                    }
                    .print\\:break-before-page {
                        break-before: page;
                    }
                    .print\\:hidden {
                        display: none !important;
                    }
                    @page {
                        size: A4;
                        margin: 10mm;
                    }
                }

                @media screen {
                    .receipt-section {
                        box-shadow: 0 10px 40px rgba(212, 175, 55, 0.2);
                        border-radius: 16px;
                        overflow: hidden;
                    }
                }
            `}</style>
        </div>
    )
}
