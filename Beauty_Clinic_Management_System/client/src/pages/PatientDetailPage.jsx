import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { User, Phone, Calendar, AlertTriangle, FileText, ArrowLeft, Activity, Image as ImageIcon, Edit, Save, Crown, DollarSign } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const PatientDetailPage = () => {
    const { id } = useParams();
    const [patient, setPatient] = useState(null);
    const [activeTab, setActiveTab] = useState('history'); // info, history, gallery
    const { token } = useAuth();

    // Edit Mode State
    const [isEditing, setIsEditing] = useState(false);
    const [editForm, setEditForm] = useState({});

    useEffect(() => {
        fetchPatientDetails();
    }, [id]);

    const fetchPatientDetails = async () => {
        try {
            const res = await fetch(`http://localhost:5000/api/patients/${id}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            const data = await res.json();
            setPatient(data);
            setEditForm(data);
        } catch (error) {
            console.error('Error fetching patient details:', error);
        }
    };

    const handleUpdateProfile = async () => {
        try {
            const res = await fetch(`http://localhost:5000/api/patients/${id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify(editForm)
            });
            if (res.ok) {
                setIsEditing(false);
                fetchPatientDetails();
            }
        } catch (error) {
            console.error('Error updating profile:', error);
        }
    };

    if (!patient) return <div className="p-8 text-center">Loading...</div>;

    const getMemberBadge = (level) => {
        switch (level) {
            case 'Platinum': return 'bg-purple-100 text-purple-700 border-purple-200';
            case 'Platinum Gold': return 'bg-purple-50 text-purple-600 border-purple-100';
            case 'Gold': return 'bg-yellow-100 text-yellow-700 border-yellow-200';
            default: return 'bg-gray-100 text-gray-600 border-gray-200';
        }
    };

    return (
        <div className="space-y-6">
            <Link to="/patients" className="flex items-center gap-2 text-gray-500 hover:text-gray-800">
                <ArrowLeft className="w-5 h-5" />
                กลับไปหน้ารายชื่อ
            </Link>

            {/* Header Section */}
            <div className="bg-white rounded-xl shadow-lg overflow-hidden border border-gray-100">
                <div className="p-6 flex flex-col md:flex-row justify-between items-start gap-6">
                    <div className="flex gap-6 items-center">
                        <div className="w-28 h-28 bg-gray-200 rounded-full flex items-center justify-center text-gray-400 border-4 border-white shadow-sm">
                            <User className="w-12 h-12" />
                        </div>
                        <div>
                            <div className="flex items-center gap-3">
                                <h1 className="text-3xl font-bold text-gray-800">{patient.full_name}</h1>
                                <span className={`px-3 py-1 rounded-full text-sm font-bold border flex items-center gap-1 ${getMemberBadge(patient.member_level)}`}>
                                    <Crown className="w-4 h-4" /> {patient.member_level || 'General'}
                                </span>
                            </div>
                            <div className="text-gray-500 mt-1 text-lg">ชื่อเล่น: {patient.nickname || '-'}</div>
                            <div className="flex items-center gap-4 mt-3 text-gray-600">
                                <span className="bg-blue-50 text-blue-700 px-3 py-1 rounded-lg text-sm font-bold">HN: {patient.hn_code}</span>
                                <div className="flex items-center gap-1">
                                    <Phone className="w-4 h-4" />
                                    {patient.phone_number}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Right Side Widgets */}
                    <div className="flex flex-col gap-3 w-full md:w-auto">
                        {Number(patient.total_debt) > 0 && (
                            <div className="bg-red-500 text-white p-4 rounded-xl shadow-md flex items-center justify-between gap-4 min-w-[250px]">
                                <div>
                                    <div className="text-xs opacity-90 font-medium">ยอดค้างชำระ (Debt)</div>
                                    <div className="text-2xl font-bold">{Number(patient.total_debt).toLocaleString()} ฿</div>
                                </div>
                                <Link to="/pos" className="bg-white text-red-600 px-3 py-1.5 rounded-lg text-sm font-bold hover:bg-red-50">
                                    ชำระเงิน
                                </Link>
                            </div>
                        )}

                        {(patient.drug_allergy || patient.underlying_disease) && (
                            <div className="bg-red-50 border border-red-200 rounded-xl p-4 min-w-[250px] animate-pulse">
                                <div className="flex items-center gap-2 text-red-700 font-bold mb-1">
                                    <AlertTriangle className="w-5 h-5" />
                                    <span>Medical Alert</span>
                                </div>
                                {patient.drug_allergy && <p className="text-red-600 text-sm">💊 แพ้: {patient.drug_allergy}</p>}
                                {patient.underlying_disease && <p className="text-red-600 text-sm">🏥 โรค: {patient.underlying_disease}</p>}
                            </div>
                        )}
                    </div>
                </div>

                {/* Tabs */}
                <div className="flex border-t px-6">
                    <button
                        onClick={() => setActiveTab('info')}
                        className={`px-6 py-4 font-medium text-sm flex items-center gap-2 border-b-2 transition ${activeTab === 'info' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
                    >
                        <User className="w-4 h-4" /> ข้อมูลส่วนตัว
                    </button>
                    <button
                        onClick={() => setActiveTab('history')}
                        className={`px-6 py-4 font-medium text-sm flex items-center gap-2 border-b-2 transition ${activeTab === 'history' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
                    >
                        <Activity className="w-4 h-4" /> ประวัติการรักษา
                    </button>
                    <button
                        onClick={() => setActiveTab('gallery')}
                        className={`px-6 py-4 font-medium text-sm flex items-center gap-2 border-b-2 transition ${activeTab === 'gallery' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
                    >
                        <ImageIcon className="w-4 h-4" /> รูปภาพ (Gallery)
                    </button>
                </div>
            </div>

            {/* Tab Content */}
            <div className="bg-white rounded-xl shadow-lg p-6 min-h-[400px]">

                {/* 1. Personal Info Tab */}
                {activeTab === 'info' && (
                    <div>
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-xl font-bold text-gray-800">ข้อมูลส่วนตัว (Personal Info)</h2>
                            {!isEditing ? (
                                <button onClick={() => setIsEditing(true)} className="text-blue-600 hover:bg-blue-50 px-3 py-1.5 rounded-lg flex items-center gap-2 font-medium">
                                    <Edit className="w-4 h-4" /> แก้ไข
                                </button>
                            ) : (
                                <div className="flex gap-2">
                                    <button onClick={() => setIsEditing(false)} className="text-gray-600 hover:bg-gray-100 px-3 py-1.5 rounded-lg font-medium">ยกเลิก</button>
                                    <button onClick={handleUpdateProfile} className="bg-blue-600 text-white px-3 py-1.5 rounded-lg flex items-center gap-2 font-medium hover:bg-blue-700">
                                        <Save className="w-4 h-4" /> บันทึก
                                    </button>
                                </div>
                            )}
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-500">ชื่อจริง</label>
                                    <input disabled={!isEditing} value={editForm.first_name || ''} onChange={e => setEditForm({ ...editForm, first_name: e.target.value })} className="w-full border rounded p-2 mt-1 disabled:bg-gray-50" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-500">นามสกุล</label>
                                    <input disabled={!isEditing} value={editForm.last_name || ''} onChange={e => setEditForm({ ...editForm, last_name: e.target.value })} className="w-full border rounded p-2 mt-1 disabled:bg-gray-50" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-500">ชื่อเล่น</label>
                                    <input disabled={!isEditing} value={editForm.nickname || ''} onChange={e => setEditForm({ ...editForm, nickname: e.target.value })} className="w-full border rounded p-2 mt-1 disabled:bg-gray-50" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-500">ระดับสมาชิก</label>
                                    <select disabled={!isEditing} value={editForm.member_level || 'General'} onChange={e => setEditForm({ ...editForm, member_level: e.target.value })} className="w-full border rounded p-2 mt-1 disabled:bg-gray-50">
                                        <option value="General">General</option>
                                        <option value="Gold">Gold</option>
                                        <option value="Platinum Gold">Platinum Gold</option>
                                        <option value="Platinum">Platinum</option>
                                    </select>
                                </div>
                            </div>
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-500">ที่อยู่</label>
                                    <textarea disabled={!isEditing} value={editForm.address || ''} onChange={e => setEditForm({ ...editForm, address: e.target.value })} className="w-full border rounded p-2 mt-1 disabled:bg-gray-50 h-[108px]" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-500">ที่ปรึกษา (Consult)</label>
                                    <input disabled={!isEditing} value={editForm.personal_consult || ''} onChange={e => setEditForm({ ...editForm, personal_consult: e.target.value })} className="w-full border rounded p-2 mt-1 disabled:bg-gray-50" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-red-500">ประวัติแพ้ยา</label>
                                    <input disabled={!isEditing} value={editForm.drug_allergy || ''} onChange={e => setEditForm({ ...editForm, drug_allergy: e.target.value })} className="w-full border border-red-200 bg-red-50 rounded p-2 mt-1 text-red-700" />
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* 2. Treatment History Tab */}
                {activeTab === 'history' && (
                    <div className="space-y-6">
                        <h2 className="text-xl font-bold text-gray-800 mb-4">ประวัติการรักษา (Treatment History)</h2>
                        {patient.history && patient.history.map((tx) => (
                            <div key={tx.transaction_id} className="flex gap-4 relative pb-8 border-l-2 border-gray-200 pl-8 last:border-0 last:pb-0">
                                <div className="absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-blue-500 border-2 border-white shadow"></div>
                                <div className="flex-1 bg-gray-50 rounded-lg p-4">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <p className="text-sm text-gray-500 font-medium">
                                                {new Date(tx.transaction_date).toLocaleDateString('th-TH', {
                                                    year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit'
                                                })}
                                            </p>
                                            <h3 className="text-lg font-bold text-gray-800 mt-1">{tx.treatments}</h3>
                                            <p className="text-gray-600 text-sm mt-1">แพทย์ผู้รักษา: {tx.doctor_name}</p>
                                        </div>
                                        <div className="text-right">
                                            <span className="block font-bold text-gray-800">{Number(tx.total_amount).toLocaleString()} ฿</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                        {(!patient.history || patient.history.length === 0) && (
                            <p className="text-center text-gray-400 py-8">ยังไม่มีประวัติการรักษา</p>
                        )}
                    </div>
                )}

                {/* 3. Gallery Tab */}
                {activeTab === 'gallery' && (
                    <div>
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-xl font-bold text-gray-800">รูปภาพ (Gallery)</h2>
                            <button className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-700">
                                <ImageIcon className="w-4 h-4" /> อัพโหลดรูปใหม่
                            </button>
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                            {patient.gallery && patient.gallery.map((img) => (
                                <div key={img.gallery_id} className="group relative aspect-square bg-gray-100 rounded-lg overflow-hidden border">
                                    {/* Mock Image Display - In real app use img.image_path */}
                                    <div className="w-full h-full flex items-center justify-center text-gray-400 bg-gray-200">
                                        {img.image_path ? (
                                            // Since we don't have real uploads, we might display a placeholder or try to show the path text
                                            <div className="text-xs p-2 break-all">{img.image_path}</div>
                                        ) : (
                                            <ImageIcon className="w-8 h-8" />
                                        )}
                                    </div>

                                    <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-40 transition-all flex flex-col justify-end p-3">
                                        <span className="text-white font-bold opacity-0 group-hover:opacity-100 transform translate-y-2 group-hover:translate-y-0 transition-all">
                                            {img.image_type}
                                        </span>
                                        <span className="text-white text-xs opacity-0 group-hover:opacity-100 transform translate-y-2 group-hover:translate-y-0 transition-all delay-75">
                                            {new Date(img.taken_date).toLocaleDateString('th-TH')}
                                        </span>
                                    </div>

                                    <div className={`absolute top-2 right-2 px-2 py-1 rounded text-xs font-bold ${img.image_type === 'Before' ? 'bg-orange-100 text-orange-700' : 'bg-green-100 text-green-700'}`}>
                                        {img.image_type}
                                    </div>
                                </div>
                            ))}
                        </div>

                        {(!patient.gallery || patient.gallery.length === 0) && (
                            <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-200">
                                <ImageIcon className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                                <p className="text-gray-500">ยังไม่มีรูปภาพในแกลเลอรี่</p>
                            </div>
                        )}
                    </div>
                )}

            </div>
        </div>
    );
};

export default PatientDetailPage;
