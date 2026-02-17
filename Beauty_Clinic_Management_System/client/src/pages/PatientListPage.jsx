import React, { useState, useEffect } from 'react';
import { Search, UserPlus, FileText, AlertCircle, Filter, Crown, DollarSign } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const PatientListPage = () => {
    const [patients, setPatients] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterLevel, setFilterLevel] = useState('');
    const [filterDebt, setFilterDebt] = useState(false);
    const { token } = useAuth();

    useEffect(() => {
        fetchPatients();
    }, [searchTerm, filterLevel, filterDebt]);

    const fetchPatients = async () => {
        try {
            let url = `http://localhost:5000/api/patients?search=${searchTerm}`;
            if (filterLevel) url += `&member_level=${filterLevel}`;
            if (filterDebt) url += `&has_debt=true`;

            const res = await fetch(url, {
                headers: { Authorization: `Bearer ${token}` }
            });
            const data = await res.json();
            setPatients(data);
        } catch (error) {
            console.error('Error fetching patients:', error);
        }
    };

    const getMemberBadge = (level) => {
        switch (level) {
            case 'Platinum':
                return <span className="bg-purple-100 text-purple-700 px-2 py-1 rounded-full text-xs font-bold flex items-center gap-1"><Crown className="w-3 h-3" /> Platinum</span>;
            case 'Platinum Gold':
                return <span className="bg-purple-50 text-purple-600 px-2 py-1 rounded-full text-xs font-bold flex items-center gap-1"><Crown className="w-3 h-3" /> Platinum Gold</span>;
            case 'Gold':
                return <span className="bg-yellow-100 text-yellow-700 px-2 py-1 rounded-full text-xs font-bold flex items-center gap-1"><Crown className="w-3 h-3" /> Gold</span>;
            default:
                return <span className="bg-gray-100 text-gray-600 px-2 py-1 rounded-full text-xs font-bold">General</span>;
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold text-gray-800">ทะเบียนคนไข้ (Patients)</h1>
                <button className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-700">
                    <UserPlus className="w-5 h-5" />
                    <span>ลงทะเบียนคนไข้ใหม่</span>
                </button>
            </div>

            {/* Search & Filter Bar */}
            <div className="flex flex-col md:flex-row gap-4">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input
                        type="text"
                        placeholder="ค้นหาด้วย ชื่อ, ชื่อเล่น, HN, หรือ เบอร์โทร..."
                        className="w-full pl-10 pr-4 py-3 border rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>

                <div className="flex gap-2">
                    <select
                        className="border rounded-lg px-4 py-2 bg-white shadow-sm text-gray-700 focus:ring-2 focus:ring-blue-500"
                        value={filterLevel}
                        onChange={(e) => setFilterLevel(e.target.value)}
                    >
                        <option value="">ทุกระดับสมาชิก</option>
                        <option value="Platinum">Platinum</option>
                        <option value="Platinum Gold">Platinum Gold</option>
                        <option value="Gold">Gold</option>
                        <option value="General">General</option>
                    </select>

                    <button
                        className={`px-4 py-2 rounded-lg border flex items-center gap-2 font-medium transition ${filterDebt
                                ? 'bg-red-50 border-red-200 text-red-600'
                                : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
                            }`}
                        onClick={() => setFilterDebt(!filterDebt)}
                    >
                        <DollarSign className="w-4 h-4" />
                        <span>ติดเงิน</span>
                    </button>
                </div>
            </div>

            {/* Patient List */}
            <div className="bg-white rounded-lg shadow overflow-hidden">
                <table className="w-full text-left">
                    <thead className="bg-gray-50 text-gray-600 text-sm">
                        <tr>
                            <th className="p-4">HN / ชื่อ-นามสกุล</th>
                            <th className="p-4">สถานะสมาชิก</th>
                            <th className="p-4">เบอร์โทร / ที่ปรึกษา</th>
                            <th className="p-4">สถานะ</th>
                            <th className="p-4 text-center">จัดการ</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y">
                        {patients.map((patient) => (
                            <tr key={patient.customer_id} className="hover:bg-gray-50">
                                <td className="p-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center text-gray-500 font-bold">
                                            {patient.nickname ? patient.nickname.charAt(0) : patient.full_name.charAt(0)}
                                        </div>
                                        <div>
                                            <div className="font-bold text-gray-800">{patient.full_name} {patient.nickname && <span className="text-gray-500 font-normal">({patient.nickname})</span>}</div>
                                            <div className="text-xs text-gray-500">HN: {patient.hn_code}</div>
                                        </div>
                                    </div>
                                </td>
                                <td className="p-4">
                                    {getMemberBadge(patient.member_level)}
                                </td>
                                <td className="p-4">
                                    <div className="text-gray-800">{patient.phone_number}</div>
                                    <div className="text-xs text-gray-500">Consult: {patient.personal_consult || '-'}</div>
                                </td>
                                <td className="p-4">
                                    <div className="flex flex-col gap-1 items-start">
                                        {(patient.drug_allergy || patient.underlying_disease) && (
                                            <div className="flex items-center gap-1 text-red-600 bg-red-50 px-2 py-0.5 rounded text-xs font-bold">
                                                <AlertCircle className="w-3 h-3" />
                                                <span>Medical Alert</span>
                                            </div>
                                        )}
                                        {Number(patient.total_debt) > 0 && (
                                            <div className="flex items-center gap-1 text-white bg-red-500 px-2 py-0.5 rounded text-xs font-bold">
                                                <DollarSign className="w-3 h-3" />
                                                <span>ติดเงิน {Number(patient.total_debt).toLocaleString()}</span>
                                            </div>
                                        )}
                                    </div>
                                </td>
                                <td className="p-4 text-center">
                                    <Link
                                        to={`/patients/${patient.customer_id}`}
                                        className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-800 font-medium"
                                    >
                                        <FileText className="w-4 h-4" />
                                        ดูประวัติ
                                    </Link>
                                </td>
                            </tr>
                        ))}
                        {patients.length === 0 && (
                            <tr>
                                <td colSpan="5" className="p-8 text-center text-gray-400">ไม่พบข้อมูลคนไข้</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default PatientListPage;
