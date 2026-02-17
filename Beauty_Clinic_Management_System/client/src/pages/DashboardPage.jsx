import React, { useEffect, useState } from 'react';
import { TrendingUp, ShoppingBag, AlertTriangle } from 'lucide-react';

const DashboardPage = () => {
    const [stats, setStats] = useState({ daily_sales: 0, transaction_count: 0, low_stock_count: 0 });
    const [lowStockItems, setLowStockItems] = useState([]);

    useEffect(() => {
        fetchDashboardData();
    }, []);

    const fetchDashboardData = async () => {
        try {
            const statsRes = await fetch('http://localhost:5000/api/dashboard/stats');
            const statsData = await statsRes.json();
            setStats(statsData);

            const lowStockRes = await fetch('http://localhost:5000/api/dashboard/low-stock');
            const lowStockData = await lowStockRes.json();
            setLowStockItems(lowStockData);
        } catch (error) {
            console.error('Error fetching dashboard data:', error);
        }
    };

    return (
        <div className="space-y-6">
            <h1 className="text-2xl font-bold text-gray-800">ภาพรวม (Dashboard)</h1>

            {/* Stats Cards */}
            <div className="grid grid-cols-3 gap-6">
                <div className="bg-white p-6 rounded-lg shadow border-l-4 border-blue-500">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-gray-500 text-sm font-medium">ยอดขายวันนี้</p>
                            <p className="text-2xl font-bold text-gray-800 mt-1">{Number(stats.daily_sales).toLocaleString()} ฿</p>
                        </div>
                        <div className="p-3 bg-blue-50 rounded-full text-blue-600">
                            <TrendingUp className="w-6 h-6" />
                        </div>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-lg shadow border-l-4 border-green-500">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-gray-500 text-sm font-medium">จำนวนบิลขาย</p>
                            <p className="text-2xl font-bold text-gray-800 mt-1">{stats.transaction_count} รายการ</p>
                        </div>
                        <div className="p-3 bg-green-50 rounded-full text-green-600">
                            <ShoppingBag className="w-6 h-6" />
                        </div>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-lg shadow border-l-4 border-red-500">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-gray-500 text-sm font-medium">สินค้าใกล้หมด</p>
                            <p className="text-2xl font-bold text-gray-800 mt-1">{stats.low_stock_count} รายการ</p>
                        </div>
                        <div className="p-3 bg-red-50 rounded-full text-red-600">
                            <AlertTriangle className="w-6 h-6" />
                        </div>
                    </div>
                </div>
            </div>

            {/* Low Stock Table */}
            <div className="bg-white rounded-lg shadow overflow-hidden">
                <div className="p-4 border-b flex items-center gap-2">
                    <AlertTriangle className="text-red-500 w-5 h-5" />
                    <h2 className="text-lg font-bold text-gray-800">รายการสินค้าใกล้หมด (Low Stock)</h2>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-gray-50 text-gray-600 text-sm">
                            <tr>
                                <th className="p-4">ชื่อสินค้า</th>
                                <th className="p-4 text-center">คงเหลือ (เต็ม)</th>
                                <th className="p-4 text-center">คงเหลือ (เปิด)</th>
                                <th className="p-4 text-center">สถานะ</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y">
                            {lowStockItems.map((item, index) => (
                                <tr key={index} className="hover:bg-gray-50">
                                    <td className="p-4 font-medium text-gray-800">{item.product_name}</td>
                                    <td className="p-4 text-center font-bold text-gray-700">{item.full_qty} {item.main_unit}</td>
                                    <td className="p-4 text-center text-gray-500">{item.opened_qty}</td>
                                    <td className="p-4 text-center">
                                        <span className="px-2 py-1 bg-red-100 text-red-700 rounded text-xs font-bold">
                                            เติมด่วน
                                        </span>
                                    </td>
                                </tr>
                            ))}
                            {lowStockItems.length === 0 && (
                                <tr>
                                    <td colSpan="4" className="p-8 text-center text-gray-400">ไม่มีสินค้าใกล้หมด</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default DashboardPage;
