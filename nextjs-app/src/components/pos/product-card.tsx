'use client'

import { memo } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { formatCurrency } from '@/lib/utils'
import { Sparkles } from 'lucide-react'

interface ProductCardProps {
    item: any // efficient to use any here for now, or define strict type if available
    onAdd: (item: any) => void
    type: 'course' | 'product'
}

const ProductCard = memo(({ item, onAdd, type }: ProductCardProps) => {
    return (
        <Card
            className="group relative cursor-pointer overflow-hidden transition-all duration-300 hover:scale-[1.02] hover:bg-amber-50/30 hover:ring-2 hover:ring-amber-400/60 hover:shadow-lg selection:bg-transparent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 active:scale-[0.98]"
            onClick={() => onAdd(item)}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault()
                    onAdd(item)
                }
            }}
        >
            <div className="absolute right-3 top-3 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                <Sparkles className="h-5 w-5 text-amber-500" />
            </div>
            <CardContent className="p-4">
                <Badge variant="secondary" className="mb-2 bg-amber-100/80 text-amber-700 shadow-sm transition-colors group-hover:bg-amber-200">
                    {type === 'course' ? 'คอร์ส' : 'สินค้า'}
                </Badge>
                <h4 className="font-medium line-clamp-2 min-h-[3rem]">
                    {type === 'course' ? item.course_name : item.product_name}
                </h4>
                <p className="mt-1 text-lg font-bold text-amber-600">
                    {formatCurrency(type === 'course' ? item.standard_price : item.price)}
                </p>
            </CardContent>
        </Card>
    )
})

ProductCard.displayName = 'ProductCard'

export default ProductCard
