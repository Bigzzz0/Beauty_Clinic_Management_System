import React, { useState, useEffect } from 'react';
import { Search, AlertTriangle } from 'lucide-react';

const CustomerSearch = ({ onSelectCustomer }) => {
    const [query, setQuery] = useState('');
    const [customers, setCustomers] = useState([]); // In real app, fetch from API
    const [filtered, setFiltered] = useState([]);

    // Mock data for demo
    useEffect(() => {
        // Ideally fetch from /api/customers
        setCustomers([
            { customer_id: 1, full_name: 'คุณภูธเนศ สภา', hn_code: 'HN00001', drug_allergy: null },
            { customer_id: 2, full_name: 'คุณมัลลิกา หาญพละ', hn_code: 'HN00002', drug_allergy: 'แพ้ Penicillin', underlying_disease: 'ความดันโลหิตสูง' },
            { customer_id: 4, full_name: 'คุณอานัลตาชา ชมชื่น', hn_code: 'HN07533', drug_allergy: null },
        ]);
    }, []);

    useEffect(() => {
        if (query.length > 1) {
            setFiltered(customers.filter(c =>
                c.full_name.includes(query) || c.hn_code.includes(query)
            ));
        } else {
            setFiltered([]);
        }
    }, [query, customers]);

    return (
        <div className="bg-white p-4 rounded-lg shadow mb-4">
            <div className="relative">
                <Search className="absolute left-3 top-3 text-gray-400 w-5 h-5" />
                <input
                    type="text"
                    placeholder="ค้นหาลูกค้า (ชื่อ หรือ HN)..."
                    className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={query}
                    onChange={e => setQuery(e.target.value)}
                />
            </div>

            {filtered.length > 0 && (
                <div className="absolute z-10 w-full bg-white border rounded-lg shadow-lg mt-1 max-w-md">
                    {filtered.map(customer => (
                        <div
                            key={customer.customer_id}
                            className="p-3 hover:bg-gray-50 cursor-pointer border-b last:border-b-0"
                            onClick={() => {
                                onSelectCustomer(customer);
                                setQuery('');
                                setFiltered([]);
                            }}
                        >
                            <div className="font-bold text-gray-800">{customer.full_name} <span className="text-gray-500 text-sm">({customer.hn_code})</span></div>
                            {(customer.drug_allergy || customer.underlying_disease) && (
                                <div className="flex items-center gap-1 text-red-600 text-sm mt-1 animate-pulse font-bold">
                                    <AlertTriangle className="w-4 h-4" />
                                    <span>
                                        {customer.drug_allergy ? `แพ้: ${customer.drug_allergy}` : ''}
                                        {customer.drug_allergy && customer.underlying_disease ? ', ' : ''}
                                        {customer.underlying_disease ? `โรค: ${customer.underlying_disease}` : ''}
                                    </span>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default CustomerSearch;
