'use client'

import { clinicConfig } from '@/lib/clinic-config'
import { formatCurrency, formatDate } from '@/lib/utils'

// ── Inline SVG icons (print-safe, no external dependency) ─────────────
const icons = {
    phone: (
        <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor" style={{ display: 'inline', verticalAlign: 'middle', marginRight: '4px', marginTop: '-1px' }}>
            <path d="M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z"/>
        </svg>
    ),
    line: (
        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 50 50" fill="currentColor" style={{ display: 'inline', verticalAlign: 'middle', marginRight: '4px', marginTop: '-1px' }}>
            <path d="M 9 4 C 6.24 4 4 6.24 4 9 L 4 41 C 4 43.76 6.24 46 9 46 L 41 46 C 43.76 46 46 43.76 46 41 L 46 9 C 46 6.24 43.76 4 41 4 L 9 4 z M 25 11 C 33.27 11 40 16.359219 40 22.949219 C 40 25.579219 38.959297 27.960781 36.779297 30.300781 C 35.209297 32.080781 32.660547 34.040156 30.310547 35.660156 C 27.960547 37.260156 25.8 38.519609 25 38.849609 C 24.68 38.979609 24.44 39.039062 24.25 39.039062 C 23.59 39.039062 23.649219 38.340781 23.699219 38.050781 C 23.739219 37.830781 23.919922 36.789063 23.919922 36.789062 C 23.969922 36.419063 24.019141 35.830937 23.869141 35.460938 C 23.699141 35.050938 23.029062 34.840234 22.539062 34.740234 C 15.339063 33.800234 10 28.849219 10 22.949219 C 10 16.359219 16.73 11 25 11 z M 23.992188 18.998047 C 23.488379 19.007393 23 19.391875 23 20 L 23 26 C 23 26.552 23.448 27 24 27 C 24.552 27 25 26.552 25 26 L 25 23.121094 L 27.185547 26.580078 C 27.751547 27.372078 29 26.973 29 26 L 29 20 C 29 19.448 28.552 19 28 19 C 27.448 19 27 19.448 27 20 L 27 23 L 24.814453 19.419922 C 24.602203 19.122922 24.294473 18.992439 23.992188 18.998047 z M 15 19 C 14.448 19 14 19.448 14 20 L 14 26 C 14 26.552 14.448 27 15 27 L 18 27 C 18.552 27 19 26.552 19 26 C 19 25.448 18.552 25 18 25 L 16 25 L 16 20 C 16 19.448 15.552 19 15 19 z M 21 19 C 20.448 19 20 19.448 20 20 L 20 26 C 20 26.552 20.448 27 21 27 C 21.552 27 22 26.552 22 26 L 22 20 C 22 19.448 21.552 19 21 19 z M 31 19 C 30.448 19 30 19.448 30 20 L 30 26 C 30 26.552 30.448 27 31 27 L 34 27 C 34.552 27 35 26.552 35 26 C 35 25.448 34.552 25 34 25 L 32 25 L 32 24 L 34 24 C 34.553 24 35 23.552 35 23 C 35 22.448 34.553 22 34 22 L 32 22 L 32 21 L 34 21 C 34.552 21 35 20.552 35 20 C 35 19.448 34.552 19 34 19 L 31 19 z"/>
        </svg>
    ),
    facebook: (
        <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor" style={{ display: 'inline', verticalAlign: 'middle', marginRight: '4px', marginTop: '-1px' }}>
            <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
        </svg>
    ),
    mobile: (
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ display: 'inline', verticalAlign: 'middle', marginRight: '4px', marginTop: '-1px' }}>
            <rect x="5" y="2" width="14" height="20" rx="2" ry="2" />
            <line x1="12" y1="18" x2="12.01" y2="18" />
        </svg>
    ),
    creditcard: (
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ display: 'inline', verticalAlign: 'middle', marginRight: '4px', marginTop: '-1px' }}>
            <rect x="1" y="4" width="22" height="16" rx="2" ry="2" />
            <line x1="1" y1="10" x2="23" y2="10" />
        </svg>
    ),
    calendar: (
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ display: 'inline', verticalAlign: 'middle', marginRight: '4px', marginTop: '-1px' }}>
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
            <line x1="16" y1="2" x2="16" y2="6" />
            <line x1="8" y1="2" x2="8" y2="6" />
            <line x1="3" y1="10" x2="21" y2="10" />
        </svg>
    ),
    copy: (
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ display: 'inline', verticalAlign: 'middle', marginRight: '4px', marginTop: '-1px' }}>
            <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
            <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
        </svg>
    ),
    receipt: (
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ display: 'inline', verticalAlign: 'middle', marginRight: '4px', marginTop: '-1px' }}>
            <polyline points="6 9 6 2 18 2 18 9" />
            <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" />
            <rect x="6" y="14" width="12" height="8" />
        </svg>
    ),
    sparkle: (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" style={{ display: 'inline', verticalAlign: 'middle', marginRight: '4px', marginTop: '-2px' }}>
            <polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26"/>
        </svg>
    ),
} as const


interface ReceiptItem {
    name: string
    qty: number
    unitPrice: number
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
    paymentMethod?: string
}

interface ReceiptTemplateProps {
    data: ReceiptData
    showCopy?: boolean
}

const printColorExact = {
    WebkitPrintColorAdjust: 'exact',
    printColorAdjust: 'exact',
    colorAdjust: 'exact',
} as React.CSSProperties

export function ReceiptTemplate({ data, showCopy = true }: ReceiptTemplateProps) {
    const renderReceipt = (isClinicCopy: boolean) => (
        <div
            className="receipt-section"
            style={{
                fontFamily: "'Sarabun', 'Prompt', Arial, sans-serif",
                maxWidth: '210mm',
                margin: '0 auto',
                background: '#fff',
                ...printColorExact,
            } as React.CSSProperties}
        >
            {/* ── Top gold bar ── */}
            <div
                style={{
                    background: 'linear-gradient(90deg, #f8f4e8 0%, #c9a227 25%, #d4af37 50%, #c9a227 75%, #f8f4e8 100%)',
                    height: '8px',
                    ...printColorExact,
                } as React.CSSProperties}
            />

            {/* ── Header ── */}
            <div
                className="print-header"
                style={{
                    background: 'linear-gradient(135deg, #fffef8 0%, #faf6e8 50%, #f8f4e0 100%)',
                    padding: '28px 32px',
                    borderBottom: '2px solid #d4af37',
                    position: 'relative',
                    ...printColorExact,
                } as React.CSSProperties}
            >
                {/* Copy Badge in the top right */}
                <div
                    style={{
                        position: 'absolute',
                        top: '20px',
                        right: '20px',
                        background: isClinicCopy ? '#fcf6e5' : '#e6f9ed',
                        border: isClinicCopy ? '1.5px solid #c9a227' : '1.5px solid #22c55e',
                        color: isClinicCopy ? '#8b6914' : '#15803d',
                        padding: '4px 12px',
                        borderRadius: '20px',
                        fontSize: '11px',
                        fontWeight: '700',
                        letterSpacing: '0.5px',
                        boxShadow: '0 2px 6px rgba(0, 0, 0, 0.05)',
                        ...printColorExact,
                    } as React.CSSProperties}
                >
                    {isClinicCopy ? <>{icons.copy}สำเนาสำหรับคลินิก (CLINIC COPY)</> : <>{icons.receipt}สำหรับลูกค้า (CUSTOMER COPY)</>}
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                    <div
                        style={{
                            width: '80px', height: '80px', flexShrink: 0,
                            background: 'linear-gradient(135deg, #d4af37 0%, #f4d03f 50%, #d4af37 100%)',
                            borderRadius: '14px',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            border: '3px solid #c9a227',
                            ...printColorExact,
                        } as React.CSSProperties}
                    >
                        <span style={{ fontWeight: '800', fontSize: '24px', color: '#fff', letterSpacing: '-1px' }}>
                            jiin
                        </span>
                    </div>
                    <div style={{ flex: 1 }}>
                        <h1 style={{ fontSize: '22px', fontWeight: '700', margin: '0 0 5px 0', color: '#8b6914' }}>
                            {clinicConfig.name}
                        </h1>
                        <p style={{ fontSize: '13px', margin: '0 0 3px 0', color: '#5c4a0f' }}>
                            {clinicConfig.branch} • {clinicConfig.address}
                        </p>
                        <p style={{ fontSize: '12px', margin: '0', color: '#7a6420' }}>
                            เลขประจำตัวผู้เสียภาษี: {clinicConfig.taxId}
                        </p>
                    </div>
                </div>

                {/* Contact row */}
                <div
                    style={{
                        marginTop: '14px', paddingTop: '12px',
                        borderTop: '1px dashed #d4af37',
                        display: 'flex', justifyContent: 'center', gap: '24px',
                        fontSize: '12px', color: '#6b5a1e',
                    }}
                >
                    <span>{icons.phone}{clinicConfig.phone}</span>
                    <span>{icons.line}Line: {clinicConfig.line}</span>
                    <span>{icons.facebook}Facebook: {clinicConfig.facebook}</span>
                </div>
            </div>

            {/* ── Customer & Bill number ── */}
            <div
                className="print-bill-row"
                style={{
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    padding: '18px 32px', background: '#fff', borderBottom: '1px solid #e8e0c8',
                }}
            >
                <div>
                    <p style={{ margin: '0 0 4px 0', fontSize: '11px', color: '#999', fontWeight: '500', letterSpacing: '0.5px' }}>
                        ข้อมูลลูกค้า
                    </p>
                    <p style={{ margin: '0', fontSize: '17px', fontWeight: '600', color: '#333' }}>
                        {data.customer.name}
                    </p>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', marginTop: '4px' }}>
                        <p style={{ margin: '0', fontSize: '13px', color: '#555' }}>
                            {icons.mobile}เบอร์โทรศัพท์: {data.customer.phone}
                        </p>
                        <p style={{ margin: '0', fontSize: '13px', color: '#555' }}>
                            {icons.creditcard}ชำระโดย: <span style={{ fontWeight: '600', color: '#333' }}>{data.paymentMethod || 'เงินสด'}</span>
                        </p>
                    </div>
                </div>

                <div style={{ textAlign: 'right' }}>
                    <div
                        style={{
                            display: 'inline-block',
                            background: 'linear-gradient(135deg, #fcebb6 0%, #f9d976 100%)',
                            color: '#332200', padding: '10px 20px', borderRadius: '12px',
                            boxShadow: '0 4px 15px rgba(212, 175, 55, 0.15)',
                            border: '1.5px solid #d4af37',
                            textAlign: 'center',
                            ...printColorExact,
                        } as React.CSSProperties}
                    >
                        <p style={{ margin: '0', fontSize: '12px', fontWeight: '700', color: '#332200', letterSpacing: '0.5px' }}>
                            ใบเสร็จรับเงิน / ใบกำกับภาษี
                        </p>
                        <p style={{ margin: '0 0 4px 0', fontSize: '9px', fontWeight: '500', color: '#332200', opacity: 0.9, letterSpacing: '0.5px' }}>
                            RECEIPT / TAX INVOICE
                        </p>
                        <div style={{ height: '1.5px', background: 'rgba(51, 34, 0, 0.15)', margin: '6px 0' }} />
                        <p style={{ margin: '0', fontSize: '9px', letterSpacing: '1px', opacity: 0.9, fontWeight: '500', color: '#332200' }}>
                            เลขที่เอกสาร / NO.
                        </p>
                        <p style={{ margin: '0', fontSize: '20px', fontWeight: '800', color: '#332200' }}>
                            {data.billNumber}
                        </p>
                    </div>
                    <p style={{ margin: '8px 0 0 0', fontSize: '12px', color: '#555' }}>
                        {icons.calendar}วันที่ออกเอกสาร: {formatDate(data.date)}
                    </p>
                </div>
            </div>

            {/* ── Items table ── */}
            <div className="print-items" style={{ padding: '20px 32px' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                    <thead>
                        <tr>
                            {[
                                { label: '#', w: '40px', align: 'center', first: true },
                                { label: 'รายการ', align: 'left' },
                                { label: 'จำนวน', w: '80px', align: 'center' },
                                { label: 'ราคาต่อหน่วย', w: '120px', align: 'right' },
                                { label: 'ราคารวม', w: '120px', align: 'right', last: true },
                            ].map((h) => (
                                <th
                                    key={h.label}
                                    style={{
                                        background: 'linear-gradient(135deg, #d4af37 0%, #e8c547 100%)',
                                        color: '#332200', padding: '12px 14px',
                                        textAlign: h.align as React.CSSProperties['textAlign'],
                                        fontWeight: '700', width: h.w,
                                        borderRadius: h.first ? '8px 0 0 0' : h.last ? '0 8px 0 0' : undefined,
                                        ...printColorExact,
                                    } as React.CSSProperties}
                                >
                                    {h.label}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {data.items.map((item, i) => (
                            <tr
                                key={i}
                                style={{
                                    background: i % 2 === 0 ? '#fff' : '#fdfcf7',
                                    borderBottom: '1px solid #f0e8d0',
                                    ...printColorExact,
                                } as React.CSSProperties}
                            >
                                <td style={{ padding: '13px 14px', textAlign: 'center', color: '#b8a040', fontWeight: '600' }}>
                                    {i + 1}
                                </td>
                                <td style={{ padding: '13px 14px', fontWeight: '600', color: '#333' }}>
                                    {item.name}
                                </td>
                                <td style={{ padding: '13px 14px', textAlign: 'center', color: '#333', fontWeight: '500' }}>
                                    {item.qty}
                                </td>
                                <td style={{ padding: '13px 14px', textAlign: 'right', color: '#555' }}>
                                    {formatCurrency(item.unitPrice).replace('฿', '')}
                                </td>
                                <td style={{ padding: '13px 14px', textAlign: 'right', fontWeight: '600', color: '#333' }}>
                                    {formatCurrency(item.price).replace('฿', '')}
                                </td>
                            </tr>
                        ))}

                        {/* Total row */}
                        <tr style={{ background: '#faf6e8', borderTop: '2px solid #d4af37', ...printColorExact } as React.CSSProperties}>
                            <td colSpan={2} style={{ padding: '14px 14px', fontWeight: '700', color: '#5c4a0f', textAlign: 'right' }}>
                                ยอดรวม (Subtotal)
                            </td>
                            <td style={{ padding: '14px 14px', textAlign: 'center', fontWeight: '700', color: '#5c4a0f' }}>
                                {data.items.reduce((sum, item) => sum + item.qty, 0)}
                            </td>
                            <td style={{ padding: '14px 14px', textAlign: 'right', fontWeight: '700', color: '#5c4a0f' }}>
                                -
                            </td>
                            <td style={{ padding: '14px 14px', textAlign: 'right', fontWeight: '700', color: '#5c4a0f' }}>
                                {formatCurrency(data.subtotal).replace('฿', '')}
                            </td>
                        </tr>
                    </tbody>
                </table>

                {/* Summary box */}
                <div
                    className="print-summary"
                    style={{
                        marginTop: '16px',
                        background: 'linear-gradient(135deg, #fffef8 0%, #faf6e8 100%)',
                        borderRadius: '12px', padding: '18px 24px',
                        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                        border: '2px solid #d4af37',
                        ...printColorExact,
                    } as React.CSSProperties}
                >
                    <div style={{ display: 'flex', gap: '28px', flexWrap: 'wrap' }}>
                        <div style={{ textAlign: 'center' }}>
                            <p style={{ margin: '0 0 4px 0', fontSize: '11px', color: '#888', fontWeight: '500' }}>ยอดรวมก่อนลด</p>
                            <p style={{ margin: '0', fontSize: '18px', fontWeight: '700', color: '#5c4a0f' }}>
                                {formatCurrency(data.subtotal)}
                            </p>
                        </div>
                        {data.discount > 0 && (
                            <div style={{ textAlign: 'center' }}>
                                <p style={{ margin: '0 0 4px 0', fontSize: '11px', color: '#888', fontWeight: '500' }}>ส่วนลด</p>
                                <p style={{ margin: '0', fontSize: '18px', fontWeight: '700', color: '#dc2626' }}>
                                    -{formatCurrency(data.discount)}
                                </p>
                            </div>
                        )}
                        <div style={{ textAlign: 'center' }}>
                            <p style={{ margin: '0 0 4px 0', fontSize: '11px', color: '#888', fontWeight: '500' }}>ยอดสุทธิ</p>
                            <p style={{ margin: '0', fontSize: '18px', fontWeight: '700', color: '#8b6914' }}>
                                {formatCurrency(data.total)}
                            </p>
                        </div>
                        <div style={{ textAlign: 'center' }}>
                            <p style={{ margin: '0 0 4px 0', fontSize: '11px', color: '#888', fontWeight: '500' }}>ชำระแล้ว</p>
                            <p style={{ margin: '0', fontSize: '18px', fontWeight: '700', color: '#16a34a' }}>
                                {formatCurrency(data.paid)}
                            </p>
                        </div>
                        {data.remaining > 0 && (
                            <div style={{ textAlign: 'center' }}>
                                <p style={{ margin: '0 0 4px 0', fontSize: '11px', color: '#888', fontWeight: '500' }}>คงค้าง</p>
                                <p style={{ margin: '0', fontSize: '18px', fontWeight: '700', color: '#dc2626' }}>
                                    {formatCurrency(data.remaining)}
                                </p>
                            </div>
                        )}
                    </div>

                    <div
                        style={{
                            background: 'linear-gradient(135deg, #fcebb6 0%, #f9d976 100%)',
                            padding: '14px 28px', borderRadius: '12px', textAlign: 'center',
                            boxShadow: '0 4px 16px rgba(212, 175, 55, 0.15)',
                            border: '1.5px solid #d4af37',
                            ...printColorExact,
                        } as React.CSSProperties}
                    >
                        <p style={{ margin: '0 0 3px 0', fontSize: '11px', color: '#332200', opacity: 0.9, fontWeight: '600' }}>
                            ยอดชำระเงินทั้งสิ้น
                        </p>
                        <p style={{ margin: '0', fontSize: '26px', fontWeight: '800', color: '#332200' }}>
                            ฿{formatCurrency(data.paid).replace('฿', '')}
                        </p>
                    </div>
                </div>
            </div>

            {/* ── Signature — no page break inside ── */}
            <div
                className="print-signature"
                style={{
                    padding: '20px 32px',
                    display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '40px',
                    pageBreakInside: 'avoid', breakInside: 'avoid',
                } as React.CSSProperties}
            >
                <div style={{ textAlign: 'center' }}>
                    <div
                        style={{
                            height: '58px', border: '2px dashed #d4af37', borderRadius: '8px',
                            marginBottom: '8px', background: '#fdfcf7',
                            display: 'flex', alignItems: 'flex-end', justifyContent: 'center', paddingBottom: '8px',
                            ...printColorExact,
                        } as React.CSSProperties}
                    >
                        <span style={{ fontSize: '11px', color: '#bbb' }}>ลายเซ็น</span>
                    </div>
                    <p style={{ margin: '0', fontSize: '13px', fontWeight: '600', color: '#5c4a0f' }}>
                        ผู้รับเงิน / แคชเชียร์
                    </p>
                    {data.cashier && (
                        <p style={{ margin: '3px 0 0 0', fontSize: '11px', color: '#888' }}>({data.cashier})</p>
                    )}
                </div>
                <div style={{ textAlign: 'center' }}>
                    <div
                        style={{
                            height: '58px', border: '2px dashed #22c55e', borderRadius: '8px',
                            marginBottom: '8px', background: '#f8fdf8',
                            display: 'flex', alignItems: 'flex-end', justifyContent: 'center', paddingBottom: '8px',
                            ...printColorExact,
                        } as React.CSSProperties}
                    >
                        <span style={{ fontSize: '11px', color: '#bbb' }}>ลายเซ็น</span>
                    </div>
                    <p style={{ margin: '0', fontSize: '13px', fontWeight: '600', color: '#166534' }}>
                        ลูกค้า / ผู้รับบริการ
                    </p>
                </div>
            </div>

            {/* ── Footer — keep with signature ── */}
            <div
                className="print-footer"
                style={{
                    background: 'linear-gradient(135deg, #fffef8 0%, #faf6e8 100%)',
                    padding: '16px 32px', textAlign: 'center',
                    borderTop: '2px solid #d4af37',
                    pageBreakInside: 'avoid', breakInside: 'avoid',
                    ...printColorExact,
                } as React.CSSProperties}
            >
                <p style={{ margin: '0 0 6px 0', fontSize: '14px', color: '#8b6914', fontWeight: '600' }}>
                    {icons.sparkle}ขอบคุณที่ใช้บริการ JIIN CLINIC{icons.sparkle}
                </p>
                <p style={{ margin: '0', fontSize: '11px', color: '#999' }}>
                    กรุณาเก็บใบเสร็จนี้ไว้เป็นหลักฐาน • สอบถามเพิ่มเติม {clinicConfig.phone}
                </p>
            </div>

            {/* Bottom gold bar */}
            <div
                style={{
                    background: 'linear-gradient(90deg, #f8f4e8 0%, #c9a227 25%, #d4af37 50%, #c9a227 75%, #f8f4e8 100%)',
                    height: '8px',
                    ...printColorExact,
                } as React.CSSProperties}
            />
        </div>
    )

    return (
        <div className="print-container">
            {/* First copy (clinic) */}
            {renderReceipt(true)}

            {/* Second copy (customer) — screen: divider; print: new page */}
            {showCopy && (
                <>
                    <div className="print:hidden my-8 border-b-2 border-dashed border-amber-300" />
                    <div className="print-page-break">
                        {renderReceipt(false)}
                    </div>
                </>
            )}

            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Sarabun:wght@400;500;600;700;800&display=swap');

                * {
                    -webkit-print-color-adjust: exact !important;
                    print-color-adjust: exact !important;
                    color-adjust: exact !important;
                }

                @media print {
                    html, body {
                        margin: 0 !important;
                        padding: 0 !important;
                        background: white !important;
                    }
                    body * { visibility: hidden; }
                    .print-container,
                    .print-container * { visibility: visible; }

                    .print-container {
                        position: absolute;
                        left: 0; top: 0; width: 100%;
                        -webkit-print-color-adjust: exact !important;
                        print-color-adjust: exact !important;
                    }

                    /* Each receipt copy occupies one page */
                    .receipt-section {
                        box-shadow: none !important;
                        border-radius: 0 !important;
                        overflow: visible !important;
                        page-break-after: always;
                    }

                    /* Second copy starts on a new page */
                    .print-page-break {
                        page-break-before: always;
                        break-before: page;
                    }

                    /* Compress paddings to fit A4 */
                    .print-header    { padding: 14px 24px !important; }
                    .print-bill-row  { padding: 10px 24px !important; }
                    .print-items     { padding: 10px 24px !important; }
                    .print-summary   { padding: 12px 18px !important; margin-top: 10px !important; }
                    .print-signature { padding: 10px 24px !important; }
                    .print-footer    { padding: 10px 24px !important; }

                    /* Compress table cells */
                    .print-items table td,
                    .print-items table th { padding: 7px 10px !important; }

                    /* Signature + footer must not split */
                    .print-signature,
                    .print-footer {
                        page-break-inside: avoid !important;
                        break-inside: avoid !important;
                    }

                    @page {
                        size: A4 portrait;
                        margin: 8mm;
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
