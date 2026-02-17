import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { Users, DollarSign, CheckCircle } from 'lucide-react';

const DebtorPage = () => {
    const [debtors, setDebtors] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedTx, setSelectedTx] = useState(null); // For Pay Modal
    const [payAmount, setPayAmount] = useState(0);
    const [payMethod, setPayMethod] = useState('TRANSFER');

    const { token, user } = useAuth();
    const toast = useToast();

    useEffect(() => {
        fetchDebtors();
    }, []);

    const fetchDebtors = async () => {
        setLoading(true);
        try {
            const res = await fetch('http://localhost:5000/api/debtors', {
                headers: { Authorization: `Bearer ${token}` }
            });
            const data = await res.json();
            setDebtors(data);
        } catch (error) {
            toast.error('Failed to load debtors');
        } finally {
            setLoading(false);
        }
    };

    const handlePayDebt = async () => {
        if (!selectedTx) return;
        if (payAmount <= 0 || payAmount > selectedTx.remaining_balance) {
            toast.error('ยอดชำระไม่ถูกต้อง');
            return;
        }

        try {
            const res = await fetch('http://localhost:5000/api/debtors/pay', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify({
                    transaction_id: selectedTx.transaction_id,
                    amount: payAmount,
                    payment_method: payMethod,
                    staff_id: user.id
                })
            });

            if (res.ok) {
                toast.success('บันทึกการชำระหนี้สำเร็จ');
                setSelectedTx(null);
                fetchDebtors();
            } else {
                const err = await res.json();
                toast.error(err.message || 'Failed to pay debt');
            }
        } catch (error) {
            toast.error('Error paying debt');
        }
    };

    return (
        <div className="space-y-6">
            <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                <Users className="w-8 h-8 text-red-600" /> ติดตามหนี้ค้างชำระ (Debtor Tracking)
            </h1>

            <div className="bg-white rounded-xl shadow overflow-hidden">
                <table className="w-full text-left">
                    <thead className="bg-red-50 text-red-800 text-sm">
                        <tr>
                            <th className="p-4">ID</th>
                            <th className="p-4">วันที่</th>
                            <th className="p-4">ลูกค้า</th>
                            <th className="p-4">เบอร์โทร</th>
                            <th className="p-4 text-right">ยอดทั้งหมด</th>
                            <th className="p-4 text-right">ค้างชำระ</th>
                            <th className="p-4 text-center">จัดการ</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y">
                        {debtors.map(tx => (
                            <tr key={tx.transaction_id} className="hover:bg-gray-50">
                                <td className="p-4 font-mono text-sm">#{tx.transaction_id}</td>
                                <td className="p-4 text-sm">{new Date(tx.transaction_date).toLocaleDateString()}</td>
                                <td className="p-4 font-bold">{tx.customer_name}</td>
                                <td className="p-4 text-gray-500">{tx.phone_number}</td>
                                <td className="p-4 text-right">{Number(tx.net_amount).toLocaleString()} ฿</td>
                                <td className="p-4 text-right font-bold text-red-600">{Number(tx.remaining_balance).toLocaleString()} ฿</td>
                                <td className="p-4 text-center">
                                    <button
                                        onClick={() => {
                                            setSelectedTx(tx);
                                            setPayAmount(Number(tx.remaining_balance));
                                        }}
                                        className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700 flex items-center gap-1 mx-auto"
                                    >
                                        <DollarSign className="w-4 h-4" /> ชำระหนี้
                                    </button>
                                </td>
                            </tr>
                        ))}
                        {debtors.length === 0 && !loading && (
                            <tr>
                                <td colSpan="7" className="p-8 text-center text-gray-500">ไม่มีรายการค้างชำระ</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* Pay Modal */}
            {selectedTx && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-white p-6 rounded-xl shadow-xl w-96">
                        <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                            <DollarSign className="w-6 h-6 text-green-600" /> ชำระหนี้บิล #{selectedTx.transaction_id}
                        </h3>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">ยอดค้างชำระ</label>
                                <div className="text-xl font-bold text-red-600">{Number(selectedTx.remaining_balance).toLocaleString()} ฿</div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">ยอดที่ชำระวันนี้</label>
                                <input
                                    type="number"
                                    className="w-full border rounded-lg p-2 text-right font-bold"
                                    value={payAmount}
                                    onChange={(e) => setPayAmount(Number(e.target.value))}
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">ช่องทางชำระ</label>
                                <select
                                    className="w-full border rounded-lg p-2"
                                    value={payMethod}
                                    onChange={(e) => setPayMethod(e.target.value)}
                                >
                                    <option value="CASH">เงินสด (Cash)</option>
                                    <option value="TRANSFER">โอนเงิน (Transfer)</option>
                                    <option value="CREDIT">บัตรเครดิต (Credit Card)</option>
                                </select>
                            </div>

                            <div className="flex gap-2 pt-4">
                                <button onClick={() => setSelectedTx(null)} className="flex-1 py-2 border rounded-lg hover:bg-gray-50">ยกเลิก</button>
                                <button onClick={handlePayDebt} className="flex-1 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-bold">ยืนยัน</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default DebtorPage;
