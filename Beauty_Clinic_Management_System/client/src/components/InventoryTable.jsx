import React, { useEffect, useState } from 'react';
import { Package, AlertCircle } from 'lucide-react';

const InventoryTable = () => {
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        fetchProducts();
    }, []);

    const fetchProducts = async () => {
        try {
            const response = await fetch('http://localhost:5000/api/products');
            if (!response.ok) throw new Error('Failed to fetch products');
            const data = await response.json();
            setProducts(data);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <div className="text-center p-4">กำลังโหลดข้อมูล...</div>;
    if (error) return <div className="text-center text-red-500 p-4">เกิดข้อผิดพลาด: {error}</div>;

    return (
        <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="p-4 border-b flex items-center gap-2">
                <Package className="text-blue-600" />
                <h2 className="text-xl font-bold text-gray-800">คลังสินค้า (Inventory)</h2>
            </div>
            <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="p-4 border-b font-semibold text-gray-600">รหัสสินค้า</th>
                            <th className="p-4 border-b font-semibold text-gray-600">ชื่อสินค้า</th>
                            <th className="p-4 border-b font-semibold text-gray-600">หมวดหมู่</th>
                            <th className="p-4 border-b font-semibold text-gray-600 text-center">สต๊อกเต็ม (Full)</th>
                            <th className="p-4 border-b font-semibold text-gray-600 text-center">สต๊อกเปิด (Opened)</th>
                            <th className="p-4 border-b font-semibold text-gray-600 text-right">ราคาปกติ</th>
                        </tr>
                    </thead>
                    <tbody>
                        {products.map((product) => (
                            <tr key={product.product_id} className="hover:bg-gray-50">
                                <td className="p-4 border-b text-gray-500 font-mono text-sm">{product.product_code || '-'}</td>
                                <td className="p-4 border-b font-medium text-gray-800">{product.product_name}</td>
                                <td className="p-4 border-b">
                                    <span className="px-2 py-1 bg-gray-100 rounded-full text-xs text-gray-600">
                                        {product.category}
                                    </span>
                                </td>
                                <td className="p-4 border-b text-center">
                                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-bold ${product.full_qty > 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                                        }`}>
                                        {product.full_qty} {product.main_unit}
                                    </span>
                                </td>
                                <td className="p-4 border-b text-center">
                                    {product.is_liquid || product.category === 'Botox' ? (
                                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-bold ${product.opened_qty > 0 ? 'bg-orange-100 text-orange-700' : 'bg-gray-100 text-gray-400'
                                            }`}>
                                            {product.opened_qty} {product.sub_unit}
                                        </span>
                                    ) : (
                                        <span className="text-gray-300">-</span>
                                    )}
                                </td>
                                <td className="p-4 border-b text-right font-mono">
                                    {Number(product.standard_price).toLocaleString()} ฿
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default InventoryTable;
