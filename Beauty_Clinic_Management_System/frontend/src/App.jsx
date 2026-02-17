import { useState } from 'react'
import { LayoutDashboard } from 'lucide-react'

function App() {
    return (
        <div className="min-h-screen bg-gray-100 flex items-center justify-center">
            <div className="bg-white p-8 rounded-lg shadow-md text-center">
                <LayoutDashboard className="w-16 h-16 mx-auto text-blue-500 mb-4" />
                <h1 className="text-3xl font-bold text-gray-800 mb-2">Beauty Clinic System</h1>
                <p className="text-gray-600">Frontend is running successfully!</p>
            </div>
        </div>
    )
}

export default App
