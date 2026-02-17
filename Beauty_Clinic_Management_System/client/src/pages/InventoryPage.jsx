import React, { useState, useEffect } from 'react';
import { Package, ArrowRight, AlertTriangle, Search, Filter, Plus, Camera, Trash2, ArrowUp, ArrowDown } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import SearchableSelect from '../components/SearchableSelect';
import Skeleton from '../components/Skeleton';
import { useSortableData } from '../hooks/useSortableData';

const InventoryPage = () => {
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('overview');
    const [searchTerm, setSearchTerm] = useState('');
    const [filterCategory, setFilterCategory] = useState('');
    const { token, user } = useAuth();
    const toast = useToast();

    // Forms State
    const [stockInItems, setStockInItems] = useState([{ product_id: '', qty_main: 1, lot_number: '', expiry_date: '' }]);
    const [stockInMeta, setStockInMeta] = useState({ supplier: '', evidence_image: '', note: '' });

    const [transferItems, setTransferItems] = useState([{ product_id: '', qty_main: 1 }]);
    const [transferMeta, setTransferMeta] = useState({ destination: '', evidence_image: '', note: '' });

    const [adjustForm, setAdjustForm] = useState({ product_id: '', qty_main: 0, qty_sub: 0, reason: 'ADJUST_DAMAGED', evidence_image: '', note: '' });

    useEffect(() => {
        fetchProducts();
    }, []);

    const fetchProducts = async () => {
        setLoading(true);
        try {
            const res = await fetch('http://localhost:5000/api/products', {
                headers: { Authorization: `Bearer ${token}` }
            });
            const data = await res.json();
            setProducts(data);
        } catch (error) {
            console.error('Error fetching products:', error);
            toast.error('Failed to load products');
        } finally {
            setLoading(false);
        }
    };

    const productOptions = products.map(p => ({
        value: p.product_id,
        label: `${p.product_code} - ${p.product_name}`,
        pack_size: p.pack_size,
        sub_unit: p.sub_unit
    }));

    // --- Sorting & Filtering ---
    const filteredProducts = products.filter(p => {
        const matchesSearch = p.product_name.toLowerCase().includes(searchTerm.toLowerCase()) || p.product_code.includes(searchTerm);
        const matchesCategory = filterCategory ? p.category === filterCategory : true;
        return matchesSearch && matchesCategory;
    });

    const { items: sortedProducts, requestSort, sortConfig } = useSortableData(filteredProducts);

    const getClassNamesFor = (name) => {
        if (!sortConfig) return;
        return sortConfig.key === name ? sortConfig.direction : undefined;
    };

    // --- Bulk Stock In Handlers ---
    const addStockInRow = () => setStockInItems([...stockInItems, { product_id: '', qty_main: 1, lot_number: '', expiry_date: '' }]);
    const removeStockInRow = (index) => setStockInItems(stockInItems.filter((_, i) => i !== index));
    const updateStockInRow = (index, field, value) => {
        const newItems = [...stockInItems];
        newItems[index][field] = value;
        setStockInItems(newItems);
    };

    const handleStockIn = async (e) => {
        e.preventDefault();
        try {
            const res = await fetch('http://localhost:5000/api/stock-in', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify({ items: stockInItems, ...stockInMeta, staff_id: user.id })
            });
            if (res.ok) {
                toast.success('รับสินค้าเข้าเรียบร้อย');
                setStockInItems([{ product_id: '', qty_main: 1, lot_number: '', expiry_date: '' }]);
                setStockInMeta({ supplier: '', evidence_image: '', note: '' });
                fetchProducts();
                setActiveTab('overview');
            } else {
                toast.error('Failed to stock in');
            }
        } catch (error) {
            toast.error('Error stock in');
        }
    };

    // --- Bulk Transfer Handlers ---
    const addTransferRow = () => setTransferItems([...transferItems, { product_id: '', qty_main: 1 }]);
    const removeTransferRow = (index) => setTransferItems(transferItems.filter((_, i) => i !== index));
    const updateTransferRow = (index, field, value) => {
        const newItems = [...transferItems];
        newItems[index][field] = value;
        setTransferItems(newItems);
    };

    const handleTransfer = async (e) => {
        e.preventDefault();
        if (!transferMeta.evidence_image) return toast.error('กรุณาอัพโหลดรูปถ่ายหลักฐาน (กล่องพัสดุ)');

        try {
            const res = await fetch('http://localhost:5000/api/stock-transfer', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify({ items: transferItems, ...transferMeta, staff_id: user.id })
            });
            if (res.ok) {
                toast.success('โอนย้ายสินค้าเรียบร้อย');
                setTransferItems([{ product_id: '', qty_main: 1 }]);
                setTransferMeta({ destination: '', evidence_image: '', note: '' });
                fetchProducts();
                setActiveTab('overview');
            } else {
                toast.error('Failed to transfer');
            }
        } catch (error) {
            toast.error('Error transfer');
        }
    };

    // --- Adjust Handler ---
    const handleAdjust = async (e) => {
        e.preventDefault();
        if (!adjustForm.evidence_image) return toast.error('กรุณาอัพโหลดรูปถ่ายหลักฐาน (ของเสีย/แตก)');

        try {
            const res = await fetch('http://localhost:5000/api/stock-adjust', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify({ ...adjustForm, staff_id: user.id })
            });
            if (res.ok) {
                toast.success('ปรับยอดสินค้าเรียบร้อย');
                setAdjustForm({ product_id: '', qty_main: 0, qty_sub: 0, reason: 'ADJUST_DAMAGED', evidence_image: '', note: '' });
                fetchProducts();
                setActiveTab('overview');
            } else {
                toast.error('Failed to adjust');
            }
        } catch (error) {
            toast.error('Error adjust');
        }
    };

    const handleImageUpload = (setter, current) => {
        const mockUrl = `/uploads/mock_${Date.now()}.jpg`;
        setter({ ...current, evidence_image: mockUrl });
        toast.success(`จำลองการอัพโหลดรูปภาพสำเร็จ`);
    };

    // Helper for Unit Conversion
    const getConversionText = (productId, qty) => {
        const product = products.find(p => p.product_id === productId);
        if (!product || !qty) return null;
        return `System will add: ${(qty * product.pack_size).toLocaleString()} ${product.sub_unit} to stock`;
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold text-gray-800">การจัดการคลังสินค้า (Inventory)</h1>
            </div>

            {/* Tabs */}
            <div className="bg-white rounded-xl shadow-sm border p-1 flex gap-1 overflow-x-auto">
                <button onClick={() => setActiveTab('overview')} className={`px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 transition ${activeTab === 'overview' ? 'bg-blue-100 text-blue-700' : 'text-gray-600 hover:bg-gray-50'}`}><Package className="w-4 h-4" /> ภาพรวมสต๊อก</button>
                <button onClick={() => setActiveTab('in')} className={`px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 transition ${activeTab === 'in' ? 'bg-green-100 text-green-700' : 'text-gray-600 hover:bg-gray-50'}`}><Plus className="w-4 h-4" /> รับสินค้าเข้า (Bulk)</button>
                <button onClick={() => setActiveTab('transfer')} className={`px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 transition ${activeTab === 'transfer' ? 'bg-orange-100 text-orange-700' : 'text-gray-600 hover:bg-gray-50'}`}><ArrowRight className="w-4 h-4" /> โอนย้าย (Bulk)</button>
                <button onClick={() => setActiveTab('adjust')} className={`px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 transition ${activeTab === 'adjust' ? 'bg-red-100 text-red-700' : 'text-gray-600 hover:bg-gray-50'}`}><AlertTriangle className="w-4 h-4" /> ปรับยอด (Adjust)</button>
            </div>

            {/* Content */}
            <div className="bg-white rounded-xl shadow p-6">

                {/* 1. Overview Tab */}
                {activeTab === 'overview' && (
                    <div className="space-y-4">
                        <div className="flex gap-4">
                            <div className="relative flex-1">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                                <input
                                    type="text"
                                    placeholder="🔍 ค้นหาด่วน (ชื่อสินค้า, รหัส)..."
                                    className="w-full pl-10 pr-4 py-2 border rounded-lg"
                                    value={searchTerm}
                                    onChange={e => setSearchTerm(e.target.value)}
                                />
                            </div>
                            <select className="border rounded-lg px-4 py-2" value={filterCategory} onChange={e => setFilterCategory(e.target.value)}>
                                <option value="">ทุกหมวดหมู่</option>
                                <option value="Botox">Botox</option>
                                <option value="Filler">Filler</option>
                                <option value="Medicine">Medicine</option>
                                <option value="Equipment">Equipment</option>
                            </select>
                        </div>

                        {loading ? (
                            <div className="space-y-2">
                                {[1, 2, 3, 4, 5].map(i => <Skeleton key={i} className="h-12 w-full" />)}
                            </div>
                        ) : (
                            <table className="w-full text-left">
                                <thead className="bg-gray-50 text-gray-600 text-sm">
                                    <tr>
                                        <th className="p-3 cursor-pointer hover:bg-gray-100" onClick={() => requestSort('product_name')}>
                                            <div className="flex items-center gap-1">
                                                สินค้า {getClassNamesFor('product_name') === 'ascending' && <ArrowUp className="w-3 h-3" />}
                                                {getClassNamesFor('product_name') === 'descending' && <ArrowDown className="w-3 h-3" />}
                                            </div>
                                        </th>
                                        <th className="p-3">หมวดหมู่</th>
                                        <th className="p-3 text-center bg-blue-50 text-blue-800 cursor-pointer hover:bg-blue-100" onClick={() => requestSort('full_qty')}>
                                            <div className="flex items-center justify-center gap-1">
                                                🔴 Full Stock {getClassNamesFor('full_qty') === 'ascending' && <ArrowUp className="w-3 h-3" />}
                                                {getClassNamesFor('full_qty') === 'descending' && <ArrowDown className="w-3 h-3" />}
                                            </div>
                                        </th>
                                        <th className="p-3 text-center bg-green-50 text-green-800 cursor-pointer hover:bg-green-100" onClick={() => requestSort('opened_qty')}>
                                            <div className="flex items-center justify-center gap-1">
                                                🟢 Opened Stock {getClassNamesFor('opened_qty') === 'ascending' && <ArrowUp className="w-3 h-3" />}
                                                {getClassNamesFor('opened_qty') === 'descending' && <ArrowDown className="w-3 h-3" />}
                                            </div>
                                        </th>
                                        <th className="p-3 text-right">มูลค่าคงเหลือ</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y">
                                    {sortedProducts.map(p => (
                                        <tr key={p.product_id} className="hover:bg-gray-50">
                                            <td className="p-3 font-medium text-gray-800">{p.product_name}</td>
                                            <td className="p-3 text-sm text-gray-500">{p.category}</td>
                                            <td className="p-3 text-center font-bold text-blue-600 bg-blue-50/30">{p.full_qty} <span className="text-xs font-normal text-gray-500">{p.main_unit}</span></td>
                                            <td className="p-3 text-center font-bold text-green-600 bg-green-50/30">{p.opened_qty} <span className="text-xs font-normal text-gray-500">{p.sub_unit}</span></td>
                                            <td className="p-3 text-right text-gray-600">{(p.full_qty * p.standard_price).toLocaleString()} ฿</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </div>
                )}

                {/* 2. Bulk Stock In Tab */}
                {activeTab === 'in' && (
                    <form onSubmit={handleStockIn} className="space-y-6">
                        <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2"><Plus className="w-6 h-6 text-green-600" /> รับสินค้าเข้า (Bulk Stock In)</h2>

                        <div className="grid grid-cols-2 gap-4 bg-gray-50 p-4 rounded-lg">
                            <div>
                                <label className="block text-sm font-medium text-gray-700">ซัพพลายเออร์</label>
                                <input type="text" className="w-full border rounded-lg p-2 mt-1" value={stockInMeta.supplier} onChange={e => setStockInMeta({ ...stockInMeta, supplier: e.target.value })} />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">รูปถ่ายใบส่งของ</label>
                                <button type="button" onClick={() => handleImageUpload(setStockInMeta, stockInMeta)} className="mt-1 px-4 py-2 bg-white border rounded-lg flex items-center gap-2 text-sm hover:bg-gray-50">
                                    <Camera className="w-4 h-4" /> {stockInMeta.evidence_image ? 'เปลี่ยนรูป' : 'อัพโหลดรูป'}
                                </button>
                            </div>
                        </div>

                        <div className="space-y-2">
                            {stockInItems.map((item, index) => (
                                <div key={index} className="flex gap-2 items-end border p-3 rounded-lg bg-white shadow-sm relative">
                                    <div className="flex-1 min-w-[200px]">
                                        <label className="text-xs text-gray-500 mb-1 block">สินค้า</label>
                                        <SearchableSelect
                                            options={productOptions}
                                            value={item.product_id}
                                            onChange={(val) => updateStockInRow(index, 'product_id', val)}
                                            placeholder="ค้นหาสินค้า..."
                                        />
                                    </div>
                                    <div className="w-24">
                                        <label className="text-xs text-gray-500 mb-1 block">จำนวน</label>
                                        <input type="number" min="1" className="w-full border rounded p-2 text-sm" value={item.qty_main} onChange={(e) => updateStockInRow(index, 'qty_main', e.target.value)} />
                                    </div>
                                    <div className="w-32">
                                        <label className="text-xs text-gray-500 mb-1 block">Lot No.</label>
                                        <input type="text" className="w-full border rounded p-2 text-sm" value={item.lot_number} onChange={(e) => updateStockInRow(index, 'lot_number', e.target.value)} />
                                    </div>
                                    <div className="w-36">
                                        <label className="text-xs text-gray-500 mb-1 block">Exp Date</label>
                                        <input type="date" className="w-full border rounded p-2 text-sm" value={item.expiry_date} onChange={(e) => updateStockInRow(index, 'expiry_date', e.target.value)} />
                                    </div>
                                    <button type="button" onClick={() => removeStockInRow(index)} className="p-2 text-red-500 hover:bg-red-50 rounded mb-[1px]">
                                        <Trash2 className="w-5 h-5" />
                                    </button>

                                    {/* Real-time Unit Conversion Badge */}
                                    {item.product_id && item.qty_main > 0 && (
                                        <div className="absolute -bottom-6 left-2 text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded-full font-medium flex items-center gap-1">
                                            <ArrowRight className="w-3 h-3" />
                                            {getConversionText(item.product_id, item.qty_main)}
                                        </div>
                                    )}
                                </div>
                            ))}
                            <div className="h-4"></div> {/* Spacer for badges */}
                            <button type="button" onClick={addStockInRow} className="w-full py-2 border-2 border-dashed border-gray-300 rounded-lg text-gray-500 hover:border-blue-500 hover:text-blue-500 flex items-center justify-center gap-2 font-medium">
                                <Plus className="w-5 h-5" /> เพิ่มรายการ (Add Item)
                            </button>
                        </div>

                        <button type="submit" className="w-full bg-green-600 text-white py-3 rounded-lg font-bold hover:bg-green-700">บันทึกรับของเข้าทั้งหมด</button>
                    </form>
                )}

                {/* 3. Bulk Transfer Tab */}
                {activeTab === 'transfer' && (
                    <form onSubmit={handleTransfer} className="space-y-6">
                        <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2"><ArrowRight className="w-6 h-6 text-orange-600" /> โอนย้ายสินค้า (Bulk Transfer)</h2>

                        <div className="grid grid-cols-2 gap-4 bg-gray-50 p-4 rounded-lg">
                            <div>
                                <label className="block text-sm font-medium text-gray-700">สาขาปลายทาง</label>
                                <input type="text" className="w-full border rounded-lg p-2 mt-1" value={transferMeta.destination} onChange={e => setTransferMeta({ ...transferMeta, destination: e.target.value })} />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">รูปถ่ายกล่องพัสดุ (บังคับ)</label>
                                <button type="button" onClick={() => handleImageUpload(setTransferMeta, transferMeta)} className="mt-1 px-4 py-2 bg-white border rounded-lg flex items-center gap-2 text-sm hover:bg-gray-50">
                                    <Camera className="w-4 h-4" /> {transferMeta.evidence_image ? 'เปลี่ยนรูป' : 'อัพโหลดรูป'}
                                </button>
                            </div>
                        </div>

                        <div className="space-y-2">
                            {transferItems.map((item, index) => (
                                <div key={index} className="flex gap-2 items-end border p-3 rounded-lg bg-white shadow-sm">
                                    <div className="flex-1 min-w-[200px]">
                                        <label className="text-xs text-gray-500 mb-1 block">สินค้า</label>
                                        <SearchableSelect
                                            options={productOptions}
                                            value={item.product_id}
                                            onChange={(val) => updateTransferRow(index, 'product_id', val)}
                                            placeholder="ค้นหาสินค้า..."
                                        />
                                    </div>
                                    <div className="w-32">
                                        <label className="text-xs text-gray-500 mb-1 block">จำนวน</label>
                                        <input type="number" min="1" className="w-full border rounded p-2 text-sm" value={item.qty_main} onChange={(e) => updateTransferRow(index, 'qty_main', e.target.value)} />
                                    </div>
                                    <button type="button" onClick={() => removeTransferRow(index)} className="p-2 text-red-500 hover:bg-red-50 rounded mb-[1px]">
                                        <Trash2 className="w-5 h-5" />
                                    </button>
                                </div>
                            ))}
                            <button type="button" onClick={addTransferRow} className="w-full py-2 border-2 border-dashed border-gray-300 rounded-lg text-gray-500 hover:border-blue-500 hover:text-blue-500 flex items-center justify-center gap-2 font-medium">
                                <Plus className="w-5 h-5" /> เพิ่มรายการ (Add Item)
                            </button>
                        </div>

                        <button type="submit" className="w-full bg-orange-600 text-white py-3 rounded-lg font-bold hover:bg-orange-700">ยืนยันการโอนย้ายทั้งหมด</button>
                    </form>
                )}

                {/* 4. Adjust Tab (Single Item) */}
                {activeTab === 'adjust' && (
                    <form onSubmit={handleAdjust} className="max-w-2xl mx-auto space-y-4">
                        <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2"><AlertTriangle className="w-6 h-6 text-red-600" /> ปรับยอด / ตัดของเสีย</h2>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="col-span-2">
                                <label className="block text-sm font-medium text-gray-700">เลือกสินค้า</label>
                                <SearchableSelect options={productOptions} value={adjustForm.product_id} onChange={(val) => setAdjustForm({ ...adjustForm, product_id: val })} placeholder="ค้นหาสินค้า..." />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">จำนวน (Main)</label>
                                <input type="number" min="0" className="w-full border rounded-lg p-2 mt-1" value={adjustForm.qty_main} onChange={e => setAdjustForm({ ...adjustForm, qty_main: e.target.value })} />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">จำนวนย่อย (Sub)</label>
                                <input type="number" min="0" className="w-full border rounded-lg p-2 mt-1" value={adjustForm.qty_sub} onChange={e => setAdjustForm({ ...adjustForm, qty_sub: e.target.value })} />
                            </div>
                            <div className="col-span-2">
                                <label className="block text-sm font-medium text-gray-700">สาเหตุ</label>
                                <select className="w-full border rounded-lg p-2 mt-1" value={adjustForm.reason} onChange={e => setAdjustForm({ ...adjustForm, reason: e.target.value })}>
                                    <option value="ADJUST_DAMAGED">ของเสีย / ชำรุด</option>
                                    <option value="ADJUST_EXPIRED">หมดอายุ</option>
                                    <option value="ADJUST_LOST">ของหาย</option>
                                </select>
                            </div>
                            <div className="col-span-2">
                                <label className="block text-sm font-medium text-gray-700">รูปถ่ายหลักฐาน (บังคับ)</label>
                                <button type="button" onClick={() => handleImageUpload(setAdjustForm, adjustForm)} className="mt-1 px-4 py-2 bg-white border rounded-lg flex items-center gap-2 text-sm hover:bg-gray-50">
                                    <Camera className="w-4 h-4" /> {adjustForm.evidence_image ? 'เปลี่ยนรูป' : 'อัพโหลดรูป'}
                                </button>
                            </div>
                        </div>
                        <button type="submit" className="w-full bg-red-600 text-white py-3 rounded-lg font-bold hover:bg-red-700 mt-6">ยืนยันการปรับยอด</button>
                    </form>
                )}

            </div>
        </div>
    );
};

export default InventoryPage;
