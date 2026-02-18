'use client'

import { useState, useMemo } from 'react'
import { Search, Package, ChevronDown } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface Product {
    product_id: number
    product_code: string | null
    product_name: string
    category: string
    main_unit?: string
    sub_unit?: string
}

interface ProductSearchSelectProps {
    products: Product[]
    value: number | null
    onSelect: (productId: number) => void
    placeholder?: string
    className?: string
}

const categories = [
    { value: 'all', label: 'ทั้งหมด' },
    { value: 'Botox', label: 'Botox' },
    { value: 'Filler', label: 'Filler' },
    { value: 'Treatment', label: 'Treatment' },
    { value: 'Medicine', label: 'Medicine' },
    { value: 'Equipment', label: 'Equipment' },
    { value: 'Skin', label: 'Skin' },
]

const getCategoryColor = (cat: string) => {
    const colors: Record<string, string> = {
        Botox: 'bg-pink-100 text-pink-700 border-pink-200',
        Filler: 'bg-purple-100 text-purple-700 border-purple-200',
        Treatment: 'bg-blue-100 text-blue-700 border-blue-200',
        Medicine: 'bg-green-100 text-green-700 border-green-200',
        Equipment: 'bg-slate-100 text-slate-700 border-slate-200',
        Skin: 'bg-amber-100 text-amber-700 border-amber-200',
    }
    return colors[cat] || 'bg-slate-100 text-slate-700 border-slate-200'
}

export function ProductSearchSelect({
    products,
    value,
    onSelect,
    placeholder = 'ค้นหาสินค้า...',
    className,
}: ProductSearchSelectProps) {
    const [open, setOpen] = useState(false)
    const [search, setSearch] = useState('')
    const [category, setCategory] = useState('all')

    const selectedProduct = products.find(p => p.product_id === value)

    const filteredProducts = useMemo(() => {
        return products.filter(p => {
            const matchesSearch = search === '' ||
                p.product_name.toLowerCase().includes(search.toLowerCase()) ||
                (p.product_code?.toLowerCase().includes(search.toLowerCase()))

            const matchesCategory = category === 'all' || p.category === category

            return matchesSearch && matchesCategory
        })
    }, [products, search, category])

    const handleSelect = (productId: number) => {
        onSelect(productId)
        setOpen(false)
        setSearch('')
    }

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={open}
                    className={cn(
                        'w-full justify-between font-normal text-left',
                        !selectedProduct && 'text-muted-foreground',
                        className
                    )}
                >
                    {selectedProduct ? (
                        <div className="flex items-center gap-2 truncate">
                            <Badge className={cn('text-xs', getCategoryColor(selectedProduct.category))}>
                                {selectedProduct.category}
                            </Badge>
                            <span className="truncate">{selectedProduct.product_name}</span>
                        </div>
                    ) : (
                        <span>{placeholder}</span>
                    )}
                    <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[400px] p-0" align="start">
                <div className="p-3 border-b space-y-3">
                    {/* Search Input */}
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                        <Input
                            placeholder="พิมพ์ค้นหาชื่อหรือรหัสสินค้า..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="pl-9"
                            autoFocus
                        />
                    </div>

                    {/* Category Filter */}
                    <div className="flex flex-wrap gap-1.5">
                        {categories.map((cat) => (
                            <button
                                key={cat.value}
                                onClick={() => setCategory(cat.value)}
                                className={cn(
                                    'px-2 py-1 text-xs rounded-full border transition-colors',
                                    category === cat.value
                                        ? 'bg-purple-100 text-purple-700 border-purple-300'
                                        : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                                )}
                                aria-pressed={category === cat.value}
                            >
                                {cat.label}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Product List */}
                <div className="max-h-[300px] overflow-y-auto">
                    {filteredProducts.length === 0 ? (
                        <div className="py-8 text-center text-slate-500">
                            <Package className="h-8 w-8 mx-auto mb-2 opacity-50" />
                            <p className="text-sm">ไม่พบสินค้า</p>
                        </div>
                    ) : (
                        <div className="py-1">
                            {filteredProducts.map((product) => (
                                <button
                                    key={product.product_id}
                                    onClick={() => handleSelect(product.product_id)}
                                    className={cn(
                                        'w-full px-3 py-2 text-left hover:bg-slate-50 flex items-center gap-3 transition-colors',
                                        value === product.product_id && 'bg-purple-50'
                                    )}
                                >
                                    <Badge className={cn('text-xs shrink-0', getCategoryColor(product.category))}>
                                        {product.category}
                                    </Badge>
                                    <div className="flex-1 min-w-0">
                                        <p className="font-medium truncate">{product.product_name}</p>
                                        <p className="text-xs text-slate-500">{product.product_code}</p>
                                    </div>
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="p-2 border-t bg-slate-50 text-xs text-slate-500">
                    {filteredProducts.length} รายการ
                </div>
            </PopoverContent>
        </Popover>
    )
}
