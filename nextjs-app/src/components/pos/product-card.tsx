'use client'

import { memo } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { formatCurrency } from '@/lib/utils'

interface ProductCardProps {
    item: any // efficient to use any here for now, or define strict type if available
    onAdd: (item: any) => void
    type: 'course' | 'product'
}

const ProductCard = memo(({ item, onAdd, type }: ProductCardProps) => {
    return (
        <Card
            className="cursor-pointer transition-all hover:ring-2 hover:ring-amber-400/60 hover:shadow-md selection:bg-transparent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400"
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
            <CardContent className="p-4">
                <Badge variant="secondary" className="mb-2 bg-amber-100 text-amber-700">
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
