import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { History, XCircle, AlertTriangle, Eye } from 'lucide-react';
import { useSortableData } from '../hooks/useSortableData';

const TransactionHistoryPage = () => {
    const [transactions, setTransactions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedTx, setSelectedTx] = useState(null); // For Void Modal
    const [voidReason, setVoidReason] = useState('BOOKING_CANCEL');
    const { token, user } = useAuth();
    const toast = useToast();

    useEffect(() => {
        fetchTransactions();
    }, []);

    const fetchTransactions = async () => {
        setLoading(true);
        try {
            const res = await fetch('http://localhost:5000/api/transactions', {
                headers: { Authorization: `Bearer ${token}` }
            });
            const data = await res.json();
            setTransactions(data);
        } catch (error) {
            toast.error('Failed to load transactions');
        } finally {
            setLoading(false);
        }
    };

    const handleVoid = async () => {
        if (!selectedTx) return;
        if (!confirm(`ยืนยันการยกเลิกบิล #${selectedTx.transaction_id}?`)) return;

        try {
            const res = await fetch(`http://localhost:5000/api/transactions/${selectedTx.transaction_id}/void`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify({ reason: voidReason, staff_id: user.id })
            });

            if (res.ok) {
                toast.success('ยกเลิกบิลเรียบร้อย');
                setSelectedTx(null);
                fetchTransactions();
            } else {
                const err = await res.json();
                toast.error(err.message || 'Failed to void');
            }
        } catch (error) {
            toast.error('Error voiding transaction');
        }
    };

    const { items: sortedTx, requestSort, sortConfig } = useSortableData(transactions);

    return (
        <div className="space-y-6">
            <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                <History className="w-8 h-8 text-blue-600" /> ประวัติการขาย (Transaction History)
            </h1>

            <div className="bg-white rounded-xl shadow overflow-hidden">
                <table className="w-full text-left">
                    <thead className="bg-gray-50 text-gray-600 text-sm">
                        <tr>
                            <th className="p-4 cursor-pointer" onClick={() => requestSort('transaction_id')}>ID</th>
                            <th className="p-4 cursor-pointer" onClick={() => requestSort('transaction_date')}>วันที่</th>
                            <th className="p-4 cursor-pointer" onClick={() => requestSort('customer_name')}>ลูกค้า</th>
                            <th className="p-4 cursor-pointer" onClick={() => requestSort('net_amount')}>ยอดสุทธิ</th>
                            <th className="p-4 cursor-pointer" onClick={() => requestSort('status')}>สถานะ</th>
                            <th className="p-4">จัดการ</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y">
                        {sortedTx.map(tx => (
                            <tr key={tx.transaction_id} className={`hover:bg-gray-50 ${tx.status === 'VOIDED' ? 'bg-red-50 text-gray-400' : ''}`}>
                                <td className="p-4 font-mono text-sm">#{tx.transaction_id}</td>
                                <td className="p-4 text-sm">{new Date(tx.transaction_date).toLocaleString()}</td>
                                <td className="p-4 font-medium">{tx.customer_name}</td>
                                <td className="p-4 font-bold">{Number(tx.net_amount).toLocaleString()} ฿</td>
                                <td className="p-4">
                                    <span className={`px-2 py-1 rounded-full text-xs font-bold ${tx.status === 'VOIDED' ? 'bg-red-200 text-red-700' : 'bg-green-100 text-green-700'
                                        }`}>
                                        {tx.status}
                                    </span>
                                </td>
                                <td className="p-4 flex gap-2">
                                    {tx.status !== 'VOIDED' && (
                                        <button
                                            onClick={() => setSelectedTx(tx)}
                                            className="p-2 text-red-500 hover:bg-red-50 rounded-lg flex items-center gap-1 text-xs border border-red-200"
                                        >
                                            <XCircle className="w-4 h-4" /> ยกเลิก (Void)
                                        </button>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Void Modal */}
            {selectedTx && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-white p-6 rounded-xl shadow-xl w-96">
                        <h3 className="text-lg font-bold text-red-600 mb-4 flex items-center gap-2">
                            <AlertTriangle className="w-6 h-6" /> ยกเลิกบิล #{selectedTx.transaction_id}
                        </h3>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">สาเหตุการยกเลิก</label>
                                <select
                                    className="w-full border rounded-lg p-2"
                                    value={voidReason}
                                    onChange={(e) => setVoidReason(e.target.value)}
                                >
                                    <option value="BOOKING_CANCEL">ยกเลิกจอง (คืนสต๊อก)</option>
                                    <option value="CLAIM">เคลม / คืนเงิน (ตัดของเสีย)</option>
                                </select>
                                <p className="text-xs text-gray-500 mt-1">
                                    {voidReason === 'BOOKING_CANCEL'
                                        ? 'สินค้าจะถูกคืนกลับเข้าสต๊อก (Stock In)'
                                        : 'สินค้าจะไม่ถูกคืน แต่จะถูกบันทึกเป็นของเสีย (Stock Adjust)'}
                                </p>
                            </div>

                            <div className="flex gap-2 pt-4">
                                <button onClick={() => setSelectedTx(null)} className="flex-1 py-2 border rounded-lg hover:bg-gray-50">ยกเลิก</button>
                                <button onClick={handleVoid} className="flex-1 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-bold">ยืนยัน</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default TransactionHistoryPage;
