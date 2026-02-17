import React, { useState, useEffect } from 'react';
import { ShoppingCart, User, Trash2, AlertCircle, Search, Plus, CreditCard } from 'lucide-react';
import CustomerSearch from '../components/CustomerSearch';
import SearchableSelect from '../components/SearchableSelect';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

const POSPage = () => {
    const [products, setProducts] = useState([]);
    const [cart, setCart] = useState([]);
    const [selectedCustomer, setSelectedCustomer] = useState(null);
    const [showPayment, setShowPayment] = useState(false);
    const [staffList, setStaffList] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');

    // Payment State
    const [payments, setPayments] = useState([{ method: 'CASH', amount: 0 }]);
    const [discount, setDiscount] = useState(0);

    const { user } = useAuth();
    const toast = useToast();

    useEffect(() => {
        fetchProducts();
        fetchStaff();
    }, []);

    const fetchProducts = async () => {
        try {
            const response = await fetch('http://localhost:5000/api/products');
            const data = await response.json();
            setProducts(data);
        } catch (error) {
            console.error('Failed to fetch products', error);
        }
    };

    const fetchStaff = async () => {
        // Mock staff for now, ideally fetch from API
        setStaffList([
            { id: 1, name: 'หมอ LEO', role: 'Doctor' },
            { id: 2, name: 'กิ๊ฟท์ (ผู้ช่วย)', role: 'Therapist' },
            { id: 3, name: 'Admin May', role: 'Admin' }
        ]);
    };

    const addToCart = (product) => {
        setCart([...cart, {
            ...product,
            qty_used: 1,
            price_type: 'STANDARD',
            unit_price: Number(product.standard_price),
            doctor_id: '',
            therapist_id: ''
        }]);
    };

    const removeFromCart = (index) => {
        const newCart = [...cart];
        newCart.splice(index, 1);
        setCart(newCart);
    };

    const updateCartItem = (index, field, value) => {
        const newCart = [...cart];
        newCart[index][field] = value;
        if (field === 'price_type') {
            newCart[index].unit_price = value === 'STAFF'
                ? Number(newCart[index].staff_price)
                : Number(newCart[index].standard_price);
        }
        setCart(newCart);
    };

    // Calculations
    const subTotal = cart.reduce((sum, item) => sum + (item.qty_used * item.unit_price), 0);
    const netTotal = subTotal - discount;
    const totalPaid = payments.reduce((sum, p) => sum + Number(p.amount), 0);
    const remaining = netTotal - totalPaid;

    const handlePaymentConfirm = async () => {
        if (!selectedCustomer) {
            toast.error('กรุณาเลือกลูกค้าก่อน');
            return;
        }

        const transactionData = {
            customer_id: selectedCustomer.customer_id,
            staff_id: user.id,
            items: cart.map(item => ({
                product_id: item.product_id,
                qty_used: item.qty_used,
                unit_price: item.unit_price,
                doctor_id: item.doctor_id || null,
                therapist_id: item.therapist_id || null
            })),
            total_amount: subTotal,
            discount: Number(discount),
            net_amount: netTotal,
            payments: payments.filter(p => p.amount > 0)
        };

        try {
            const response = await fetch('http://localhost:5000/api/transactions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify(transactionData)
            });

            const result = await response.json();
            if (response.ok) {
                toast.success('บันทึกรายการขายสำเร็จ!');
                setCart([]);
                setSelectedCustomer(null);
                setShowPayment(false);
                setPayments([{ method: 'CASH', amount: 0 }]);
                setDiscount(0);
                fetchProducts();
            } else {
                toast.error('เกิดข้อผิดพลาด: ' + result.message);
            }
        } catch (error) {
            toast.error('เกิดข้อผิดพลาดในการเชื่อมต่อ');
        }
    };

    // Payment Modal Logic
    const addPaymentMethod = () => setPayments([...payments, { method: 'TRANSFER', amount: 0 }]);
    const removePaymentMethod = (index) => setPayments(payments.filter((_, i) => i !== index));
    const updatePayment = (index, field, value) => {
        const newPayments = [...payments];
        newPayments[index][field] = value;
        setPayments(newPayments);
    };

    // Filter products
    const filteredProducts = products.filter(p =>
        p.product_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.product_code.includes(searchTerm)
    );

    const productOptions = products.map(p => ({
        value: p.product_id,
        label: `${p.product_code} - ${p.product_name}`
    }));

    return (
        <div className="flex h-[calc(100vh-100px)] gap-4 relative">
            {/* Allergy Alert Banner */}
            {selectedCustomer && (selectedCustomer.drug_allergy || selectedCustomer.underlying_disease) && (
                <div className="absolute top-0 left-0 right-0 bg-red-600 text-white p-2 z-10 animate-pulse flex justify-center items-center gap-2 font-bold shadow-lg">
                    <AlertCircle className="w-6 h-6" />
                    คำเตือน: ลูกค้ามีประวัติแพ้ยา ({selectedCustomer.drug_allergy}) หรือโรคประจำตัว ({selectedCustomer.underlying_disease})
                </div>
            )}

            {/* Left: Product List */}
            <div className="w-2/3 bg-white rounded-lg shadow p-4 flex flex-col pt-12">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-bold text-gray-800">สินค้าและบริการ</h2>
                    <div className="relative w-64">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                        <input
                            type="text"
                            placeholder="ค้นหาด่วน..."
                            className="w-full pl-9 pr-4 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>

                <div className="mb-4">
                    <SearchableSelect
                        options={productOptions}
                        value=""
                        onChange={(val) => {
                            const product = products.find(p => p.product_id === val);
                            if (product) addToCart(product);
                        }}
                        placeholder="พิมพ์ชื่อสินค้าเพื่อเพิ่มลงตะกร้า..."
                    />
                </div>

                <div className="grid grid-cols-3 gap-4 overflow-y-auto flex-1 content-start">
                    {filteredProducts.map(product => (
                        <div
                            key={product.product_id}
                            className="border rounded-lg p-4 hover:shadow-md cursor-pointer transition flex flex-col justify-between h-[100px] bg-gray-50 hover:bg-white hover:border-blue-300"
                            onClick={() => addToCart(product)}
                        >
                            <div>
                                <div className="font-bold text-gray-800 text-sm line-clamp-2">{product.product_name}</div>
                                <div className="text-xs text-gray-500">{product.category}</div>
                            </div>
                            <div className="flex justify-between items-end mt-1">
                                <div className="text-xs text-gray-500">
                                    {product.full_qty} {product.main_unit}
                                </div>
                                <div className="font-bold text-blue-600 text-sm">
                                    {Number(product.standard_price).toLocaleString()} ฿
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Right: Cart & Customer */}
            <div className="w-1/3 flex flex-col gap-4 pt-12">
                <CustomerSearch onSelectCustomer={setSelectedCustomer} />

                {selectedCustomer && (
                    <div className={`p-4 rounded-lg border ${selectedCustomer.drug_allergy ? 'bg-red-50 border-red-200' : 'bg-green-50 border-green-200'}`}>
                        <div className="flex items-center gap-2 font-bold text-gray-800">
                            <User className="w-5 h-5" />
                            {selectedCustomer.full_name}
                        </div>
                    </div>
                )}

                <div className="bg-white rounded-lg shadow flex-1 flex flex-col overflow-hidden">
                    <div className="p-4 bg-gray-50 border-b font-bold text-gray-700 flex items-center gap-2">
                        <ShoppingCart className="w-5 h-5" /> ตะกร้าสินค้า
                    </div>

                    <div className="flex-1 overflow-y-auto p-4 space-y-4">
                        {cart.map((item, index) => (
                            <div key={index} className="border-b pb-4 last:border-b-0 space-y-2">
                                <div className="flex justify-between">
                                    <span className="font-bold text-gray-800 text-sm">{item.product_name}</span>
                                    <button onClick={() => removeFromCart(index)} className="text-red-500 hover:text-red-700">
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>

                                <div className="flex gap-2">
                                    <select
                                        className="border rounded text-xs p-1"
                                        value={item.price_type}
                                        onChange={(e) => updateCartItem(index, 'price_type', e.target.value)}
                                    >
                                        <option value="STANDARD">ปกติ</option>
                                        <option value="STAFF">ทุน</option>
                                    </select>
                                    <input
                                        type="number"
                                        className="border rounded w-16 text-center text-sm"
                                        value={item.qty_used}
                                        onChange={(e) => updateCartItem(index, 'qty_used', Number(e.target.value))}
                                        min="1"
                                    />
                                    <div className="flex-1 text-right font-bold text-gray-700 text-sm">
                                        {(item.qty_used * item.unit_price).toLocaleString()} ฿
                                    </div>
                                </div>

                                {/* Staff Selection */}
                                <div className="grid grid-cols-2 gap-2">
                                    <select
                                        className="border rounded text-xs p-1 w-full"
                                        value={item.doctor_id}
                                        onChange={(e) => updateCartItem(index, 'doctor_id', e.target.value)}
                                    >
                                        <option value="">เลือกแพทย์ (DF)</option>
                                        {staffList.filter(s => s.role === 'Doctor').map(s => (
                                            <option key={s.id} value={s.id}>{s.name}</option>
                                        ))}
                                    </select>
                                    <select
                                        className="border rounded text-xs p-1 w-full"
                                        value={item.therapist_id}
                                        onChange={(e) => updateCartItem(index, 'therapist_id', e.target.value)}
                                    >
                                        <option value="">เลือกผู้ช่วย (Hand)</option>
                                        {staffList.filter(s => s.role === 'Therapist').map(s => (
                                            <option key={s.id} value={s.id}>{s.name}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                        ))}
                        {cart.length === 0 && <div className="text-center text-gray-400 mt-10 text-sm">ยังไม่มีสินค้าในตะกร้า</div>}
                    </div>

                    <div className="p-4 border-t bg-gray-50">
                        <div className="flex justify-between text-xl font-bold mb-4 text-gray-800">
                            <span>รวมทั้งสิ้น</span>
                            <span>{subTotal.toLocaleString()} ฿</span>
                        </div>
                        <button
                            className="w-full bg-blue-600 text-white py-3 rounded-lg font-bold hover:bg-blue-700 disabled:bg-gray-300 transition"
                            disabled={cart.length === 0 || !selectedCustomer}
                            onClick={() => {
                                setPayments([{ method: 'CASH', amount: subTotal }]); // Default full payment
                                setShowPayment(true);
                            }}
                        >
                            ชำระเงิน
                        </button>
                    </div>
                </div>
            </div>

            {/* Payment Modal */}
            {showPayment && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-white p-6 rounded-xl shadow-xl w-[500px] max-h-[90vh] overflow-y-auto">
                        <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                            <CreditCard className="w-6 h-6 text-blue-600" /> ชำระเงิน (Payment)
                        </h3>

                        <div className="space-y-4 mb-6">
                            <div className="flex justify-between text-gray-600">
                                <span>ยอดรวมสินค้า</span>
                                <span>{subTotal.toLocaleString()} ฿</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span>ส่วนลด (บาท)</span>
                                <input
                                    type="number"
                                    className="border rounded p-1 w-24 text-right"
                                    value={discount}
                                    onChange={(e) => setDiscount(Number(e.target.value))}
                                />
                            </div>
                            <div className="flex justify-between text-xl font-bold text-blue-600 border-t pt-2">
                                <span>ยอดสุทธิ (Net Total)</span>
                                <span>{netTotal.toLocaleString()} ฿</span>
                            </div>
                        </div>

                        <div className="space-y-3 mb-6">
                            <label className="block text-sm font-bold text-gray-700">วิธีการชำระเงิน (Split Payment)</label>
                            {payments.map((payment, index) => (
                                <div key={index} className="flex gap-2">
                                    <select
                                        className="border rounded p-2 flex-1"
                                        value={payment.method}
                                        onChange={(e) => updatePayment(index, 'method', e.target.value)}
                                    >
                                        <option value="CASH">เงินสด (Cash)</option>
                                        <option value="TRANSFER">โอนเงิน (Transfer)</option>
                                        <option value="CREDIT">บัตรเครดิต (Credit Card)</option>
                                    </select>
                                    <input
                                        type="number"
                                        className="border rounded p-2 w-32 text-right"
                                        value={payment.amount}
                                        onChange={(e) => updatePayment(index, 'amount', Number(e.target.value))}
                                    />
                                    {payments.length > 1 && (
                                        <button onClick={() => removePaymentMethod(index)} className="text-red-500">
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    )}
                                </div>
                            ))}
                            <button onClick={addPaymentMethod} className="text-sm text-blue-600 flex items-center gap-1 hover:underline">
                                <Plus className="w-4 h-4" /> เพิ่มช่องทางชำระเงิน
                            </button>
                        </div>

                        <div className={`p-3 rounded-lg mb-6 text-center font-bold ${remaining === 0 ? 'bg-green-100 text-green-700' : remaining > 0 ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'}`}>
                            {remaining === 0 ? 'ชำระครบถ้วน (PAID)' : remaining > 0 ? `ค้างชำระ (PARTIAL): ${remaining.toLocaleString()} ฿` : `รับเงินเกิน: ${Math.abs(remaining).toLocaleString()} ฿`}
                        </div>

                        <div className="flex gap-2">
                            <button onClick={() => setShowPayment(false)} className="flex-1 py-3 border rounded-lg hover:bg-gray-50">ยกเลิก</button>
                            <button
                                onClick={handlePaymentConfirm}
                                className="flex-1 py-3 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700 disabled:bg-gray-300"
                                disabled={remaining < 0} // Allow partial (remaining > 0) but not overpayment
                            >
                                ยืนยันการชำระเงิน
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default POSPage;
