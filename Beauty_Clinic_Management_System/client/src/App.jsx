import { BrowserRouter as Router, Routes, Route, Link, useLocation, useNavigate } from 'react-router-dom';
import { LayoutDashboard, ShoppingCart, Package, LogOut, Users, BarChart, History } from 'lucide-react';
import InventoryPage from './pages/InventoryPage';
import POSPage from './pages/POSPage';
import DashboardPage from './pages/DashboardPage';
import LoginPage from './pages/LoginPage';
import PatientListPage from './pages/PatientListPage';
import PatientDetailPage from './pages/PatientDetailPage';
import ReportPage from './pages/ReportPage';
import TransactionHistoryPage from './pages/TransactionHistoryPage';
import DebtorPage from './pages/DebtorPage';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import ProtectedRoute from './components/ProtectedRoute';

const NavLink = ({ to, icon: Icon, label }) => {
    const location = useLocation();
    const isActive = location.pathname === to;

    return (
        <Link
            to={to}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition ${isActive
                ? 'bg-blue-600 text-white shadow-md'
                : 'text-gray-600 hover:bg-gray-100'
                }`}
        >
            <Icon className="w-5 h-5" />
            <span className="font-medium">{label}</span>
        </Link>
    );
};

const Layout = ({ children }) => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    return (
        <div className="min-h-screen bg-gray-100 flex flex-col">
            {/* Navbar */}
            <nav className="bg-white shadow-sm z-10">
                <div className="max-w-7xl mx-auto px-4">
                    <div className="flex justify-between h-16">
                        <div className="flex items-center gap-8">
                            <div className="flex items-center gap-2 text-blue-600 font-bold text-xl">
                                <LayoutDashboard className="w-8 h-8" />
                                <span>Beauty Clinic</span>
                            </div>

                            <div className="flex items-center gap-2">
                                <NavLink to="/" icon={LayoutDashboard} label="ภาพรวม" />
                                <NavLink to="/patients" icon={Users} label="คนไข้ (OPD)" />
                                <NavLink to="/inventory" icon={Package} label="คลังสินค้า" />
                                <NavLink to="/transactions" icon={History} label="ประวัติขาย" />
                                <NavLink to="/debtors" icon={Users} label="ติดตามหนี้" />
                                <NavLink to="/reports" icon={BarChart} label="รายงาน" />
                                <NavLink to="/pos" icon={ShoppingCart} label="จุดขาย (POS)" />
                            </div>
                        </div>

                        <div className="flex items-center gap-4">
                            <div className="text-sm text-right">
                                <div className="font-bold text-gray-800">{user?.name}</div>
                                <div className="text-gray-500">{user?.role}</div>
                            </div>
                            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-bold">
                                {user?.name?.charAt(0)}
                            </div>
                            <button onClick={handleLogout} className="p-2 hover:bg-red-50 text-red-500 rounded-full" title="Logout">
                                <LogOut className="w-5 h-5" />
                            </button>
                        </div>
                    </div>
                </div>
            </nav>

            {/* Content */}
            <main className="flex-1 max-w-7xl w-full mx-auto p-6">
                {children}
            </main>
        </div>
    );
};

function App() {
    return (
        <AuthProvider>
            <ToastProvider>
                <Router>
                    <Routes>
                        <Route path="/login" element={<LoginPage />} />

                        <Route element={<ProtectedRoute />}>
                            <Route path="/" element={<Layout><DashboardPage /></Layout>} />
                            <Route path="/patients" element={<Layout><PatientListPage /></Layout>} />
                            <Route path="/patients/:id" element={<Layout><PatientDetailPage /></Layout>} />
                            <Route path="/inventory" element={<Layout><InventoryPage /></Layout>} />

                            <Route path="/debtors" element={<Layout><DebtorPage /></Layout>} />
                            <Route path="/transactions" element={<Layout><TransactionHistoryPage /></Layout>} />
                            <Route path="/reports" element={<Layout><ReportPage /></Layout>} />
                            <Route path="/pos" element={<Layout><POSPage /></Layout>} />
                        </Route>
                    </Routes>
                </Router>
            </ToastProvider>
        </AuthProvider>
    );
}

export default App;
