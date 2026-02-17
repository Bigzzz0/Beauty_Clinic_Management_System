import React, { useState } from 'react';
import { X, CreditCard, Banknote, QrCode } from 'lucide-react';

const PaymentModal = ({ totalAmount, onClose, onConfirm }) => {
    const [discount, setDiscount] = useState(0);
    const [amountPaid, setAmountPaid] = useState(totalAmount);
    const [paymentMethod, setPaymentMethod] = useState('CASH');

    const netAmount = totalAmount - discount;
    const remaining = netAmount - amountPaid;

    const handleSubmit = () => {
        onConfirm({
            discount: Number(discount),
            amount_paid: Number(amountPaid),
            payment_method: paymentMethod
        });
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg w-full max-w-md p-6">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-bold text-gray-800">ชำระเงิน (Payment)</h2>
                    <button onClick={onClose}><X className="text-gray-500" /></button>
                </div>

                <div className="space-y-4">
                    <div className="flex justify-between text-lg">
                        <span>ยอดรวม:</span>
                        <span className="font-bold">{totalAmount.toLocaleString()} ฿</span>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">ส่วนลด (Discount)</label>
                        <input
                            type="number"
                            className="w-full border rounded p-2 text-right"
                            value={discount}
                            onChange={e => setDiscount(e.target.value)}
                        />
                    </div>

                    <div className="flex justify-between text-lg font-bold text-blue-600 border-t pt-2">
                        <span>ยอดสุทธิ:</span>
                        <span>{netAmount.toLocaleString()} ฿</span>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">ชำระจริง (Amount Paid)</label>
                        <input
                            type="number"
                            className="w-full border rounded p-2 text-right font-bold text-green-700"
                            value={amountPaid}
                            onChange={e => setAmountPaid(e.target.value)}
                        />
                    </div>

                    {remaining > 0 && (
                        <div className="bg-yellow-50 p-3 rounded text-yellow-800 text-sm flex justify-between">
                            <span>ค้างชำระ (ผ่อน):</span>
                            <span className="font-bold">{remaining.toLocaleString()} ฿</span>
                        </div>
                    )}

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">ช่องทางชำระเงิน</label>
                        <div className="grid grid-cols-3 gap-2">
                            <button
                                className={`p-2 border rounded flex flex-col items-center gap-1 ${paymentMethod === 'CASH' ? 'bg-blue-50 border-blue-500 text-blue-700' : 'hover:bg-gray-50'}`}
                                onClick={() => setPaymentMethod('CASH')}
                            >
                                <Banknote className="w-5 h-5" /> เงินสด
                            </button>
                            <button
                                className={`p-2 border rounded flex flex-col items-center gap-1 ${paymentMethod === 'TRANSFER' ? 'bg-blue-50 border-blue-500 text-blue-700' : 'hover:bg-gray-50'}`}
                                onClick={() => setPaymentMethod('TRANSFER')}
                            >
                                <QrCode className="w-5 h-5" /> โอนเงิน
                            </button>
                            <button
                                className={`p-2 border rounded flex flex-col items-center gap-1 ${paymentMethod === 'CREDIT' ? 'bg-blue-50 border-blue-500 text-blue-700' : 'hover:bg-gray-50'}`}
                                onClick={() => setPaymentMethod('CREDIT')}
                            >
                                <CreditCard className="w-5 h-5" /> บัตรเครดิต
                            </button>
                        </div>
                    </div>

                    <button
                        className="w-full bg-green-600 text-white py-3 rounded-lg font-bold text-lg hover:bg-green-700 mt-4"
                        onClick={handleSubmit}
                    >
                        ยืนยันการชำระเงิน
                    </button>
                </div>
            </div>
        </div>
    );
};

export default PaymentModal;
