import React, { useState, useEffect, useRef } from 'react';
import { Search, ChevronDown, Check } from 'lucide-react';

const SearchableSelect = ({ options, value, onChange, placeholder = "Select...", labelKey = "label", valueKey = "value" }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const wrapperRef = useRef(null);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const filteredOptions = options.filter(option =>
        String(option[labelKey]).toLowerCase().includes(searchTerm.toLowerCase())
    );

    const selectedOption = options.find(option => option[valueKey] === value);

    return (
        <div className="relative" ref={wrapperRef}>
            <div
                className="w-full border rounded-lg p-2 bg-white flex items-center justify-between cursor-pointer focus-within:ring-2 focus-within:ring-blue-500"
                onClick={() => setIsOpen(!isOpen)}
            >
                <span className={selectedOption ? 'text-gray-800' : 'text-gray-400'}>
                    {selectedOption ? selectedOption[labelKey] : placeholder}
                </span>
                <ChevronDown className="w-4 h-4 text-gray-400" />
            </div>

            {isOpen && (
                <div className="absolute z-50 w-full mt-1 bg-white border rounded-lg shadow-lg max-h-60 overflow-auto">
                    <div className="p-2 sticky top-0 bg-white border-b">
                        <div className="relative">
                            <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <input
                                type="text"
                                className="w-full pl-8 pr-2 py-1 border rounded text-sm focus:outline-none focus:border-blue-500"
                                placeholder="Search..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                autoFocus
                                onClick={(e) => e.stopPropagation()}
                            />
                        </div>
                    </div>

                    {filteredOptions.length > 0 ? (
                        filteredOptions.map((option) => (
                            <div
                                key={option[valueKey]}
                                className={`px-4 py-2 text-sm cursor-pointer hover:bg-blue-50 flex items-center justify-between ${value === option[valueKey] ? 'bg-blue-50 text-blue-600 font-medium' : 'text-gray-700'}`}
                                onClick={() => {
                                    onChange(option[valueKey]);
                                    setIsOpen(false);
                                    setSearchTerm('');
                                }}
                            >
                                <span>{option[labelKey]}</span>
                                {value === option[valueKey] && <Check className="w-4 h-4" />}
                            </div>
                        ))
                    ) : (
                        <div className="px-4 py-2 text-sm text-gray-400 text-center">No results found</div>
                    )}
                </div>
            )}
        </div>
    );
};

export default SearchableSelect;
