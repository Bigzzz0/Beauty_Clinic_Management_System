import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { BarChart, TrendingUp, Users, DollarSign, Award } from 'lucide-react';
import Skeleton from '../components/Skeleton';

const ReportPage = () => {
    const [activeTab, setActiveTab] = useState('financial');
    const [financialData, setFinancialData] = useState(null);
    const [staffData, setStaffData] = useState(null);
    const [retentionData, setRetentionData] = useState(null);
    const { token } = useAuth();

    useEffect(() => {
        fetchData(activeTab);
    }, [activeTab]);

    const fetchData = async (tab) => {
        try {
            const res = await fetch(`http://localhost:5000/api/reports/${tab}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            const data = await res.json();
            if (tab === 'financial') setFinancialData(data);
            if (tab === 'staff') setStaffData(data);
            if (tab === 'retention') setRetentionData(data);
        } catch (error) {
            console.error('Error fetching report:', error);
        }
    };

    return (
        <div className="space-y-6">
            <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                <BarChart className="w-8 h-8 text-blue-600" /> รายงานและสถิติ (Reports)
            </h1>

            {/* Tabs */}
            <div className="flex gap-2 border-b">
                <button onClick={() => setActiveTab('financial')} className={`px-4 py-2 font-bold border-b-2 transition ${activeTab === 'financial' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500'}`}>การเงิน (Financial)</button>
                <button onClick={() => setActiveTab('staff')} className={`px-4 py-2 font-bold border-b-2 transition ${activeTab === 'staff' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500'}`}>พนักงาน (Staff)</button>
                <button onClick={() => setActiveTab('retention')} className={`px-4 py-2 font-bold border-b-2 transition ${activeTab === 'retention' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500'}`}>ลูกค้า (Retention)</button>
            </div>

            {/* Content */}
            <div className="bg-white rounded-xl shadow p-6 min-h-[400px]">

                {/* Financial Tab */}
                {activeTab === 'financial' && (
                    <div className="space-y-8">
                        {!financialData ? <Skeleton className="h-64 w-full" /> : (
                            <>
                                <div className="grid grid-cols-3 gap-4">
                                    <div className="bg-green-50 p-4 rounded-lg border border-green-100">
                                        <h3 className="text-green-800 font-bold flex items-center gap-2"><DollarSign className="w-5 h-5" /> ยอดขายรวม (30 วัน)</h3>
                                        <p className="text-2xl font-bold text-green-600 mt-2">
                                            {financialData.sales.reduce((sum, d) => sum + Number(d.total_sales), 0).toLocaleString()} ฿
                                        </p>
                                    </div>
                                    <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
                                        <h3 className="text-blue-800 font-bold flex items-center gap-2"><TrendingUp className="w-5 h-5" /> จำนวนบิล</h3>
                                        <p className="text-2xl font-bold text-blue-600 mt-2">
                                            {financialData.sales.reduce((sum, d) => sum + d.tx_count, 0)} ใบ
                                        </p>
                                    </div>
                                </div>

                                <div>
                                    <h3 className="font-bold text-gray-700 mb-4">ยอดขายรายวัน</h3>
                                    <div className="h-64 flex items-end gap-2 border-b border-l p-4">
                                        {financialData.sales.map((d, i) => (
                                            <div key={i} className="flex-1 bg-blue-500 hover:bg-blue-600 rounded-t transition relative group" style={{ height: `${Math.min(d.total_sales / 1000, 100)}%` }}>
                                                <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-1 hidden group-hover:block bg-black text-white text-xs p-1 rounded z-10">
                                                    {new Date(d.date).toLocaleDateString()}: {Number(d.total_sales).toLocaleString()}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <div>
                                    <h3 className="font-bold text-gray-700 mb-4">สัดส่วนช่องทางการขาย</h3>
                                    <div className="flex gap-4">
                                        {financialData.channels.map((c, i) => (
                                            <div key={i} className="flex-1 bg-gray-50 p-4 rounded-lg text-center">
                                                <div className="text-lg font-bold text-gray-800">{c.channel}</div>
                                                <div className="text-2xl font-bold text-blue-600">{c.count} เคส</div>
                                                <div className="text-sm text-gray-500">{Number(c.total).toLocaleString()} ฿</div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </>
                        )}
                    </div>
                )}

                {/* Staff Tab */}
                {activeTab === 'staff' && (
                    <div className="space-y-6">
                        <h3 className="font-bold text-gray-700 flex items-center gap-2"><Award className="w-6 h-6 text-yellow-500" /> Top Performance (Commission)</h3>
                        {!staffData ? <Skeleton className="h-40 w-full" /> : (
                            <table className="w-full text-left">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="p-3">อันดับ</th>
                                        <th className="p-3">พนักงาน</th>
                                        <th className="p-3 text-right">คอมมิชชั่นรวม</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {staffData.top_staff.map((s, i) => (
                                        <tr key={i} className="border-b">
                                            <td className="p-3 font-bold text-gray-500">#{i + 1}</td>
                                            <td className="p-3 font-medium">{s.full_name}</td>
                                            <td className="p-3 text-right font-bold text-green-600">{Number(s.total_commission).toLocaleString()} ฿</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </div>
                )}

                {/* Retention Tab */}
                {activeTab === 'retention' && (
                    <div className="grid grid-cols-2 gap-8">
                        <div>
                            <h3 className="font-bold text-red-600 mb-4 flex items-center gap-2"><Users className="w-5 h-5" /> ลูกค้าที่หายไป ({'>'} 90 วัน)</h3>
                            {!retentionData ? <Skeleton className="h-40 w-full" /> : (
                                <ul className="space-y-2">
                                    {retentionData.lost_customers.map((c, i) => (
                                        <li key={i} className="p-3 border rounded-lg hover:bg-red-50 flex justify-between items-center">
                                            <div>
                                                <div className="font-bold text-gray-800">{c.full_name}</div>
                                                <div className="text-xs text-gray-500">{c.phone_number}</div>
                                            </div>
                                            <div className="text-xs text-red-500 font-medium">
                                                Last: {new Date(c.last_visit).toLocaleDateString()}
                                            </div>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>
                        <div>
                            <h3 className="font-bold text-gold-600 mb-4 flex items-center gap-2 text-yellow-600"><Award className="w-5 h-5" /> Top Spenders (VIP)</h3>
                            {!retentionData ? <Skeleton className="h-40 w-full" /> : (
                                <ul className="space-y-2">
                                    {retentionData.top_spenders.map((c, i) => (
                                        <li key={i} className="p-3 border rounded-lg bg-yellow-50/50 flex justify-between items-center">
                                            <div className="font-bold text-gray-800">#{i + 1} {c.full_name}</div>
                                            <div className="font-bold text-blue-600">{Number(c.total_spent).toLocaleString()} ฿</div>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>
                    </div>
                )}

            </div>
        </div>
    );
};

export default ReportPage;
