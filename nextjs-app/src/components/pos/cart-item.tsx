'use client'

import { memo } from 'react'
import { Button } from '@/components/ui/button'
import { Trash2, Plus, Minus } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'
import {
    Collapsible,
} from '@/components/ui/collapsible'

interface CartItemProps {
    item: any
    expanded: boolean
    onToggleExpand: (isOpen: boolean) => void
    onUpdateQuantity: (id: string, qty: number) => void
    onRemove: (id: string) => void
}

const CartItem = memo(({ item, expanded, onToggleExpand, onUpdateQuantity, onRemove }: CartItemProps) => {
    return (
        <Collapsible
            open={expanded}
            onOpenChange={onToggleExpand}
        >
            <div className="rounded-lg bg-muted p-3">
                <div className="flex items-center justify-between">
                    <div className="flex-1">
                        <p className="font-medium line-clamp-1">
                            {item.product?.product_name || item.course?.course_name}
                        </p>
                        <p className="text-sm text-muted-foreground">
                            {formatCurrency(item.unit_price)}
                        </p>
                    </div>
                    <div className="flex items-center gap-2">
                        <Button
                            variant="outline"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => onUpdateQuantity(item.id, item.qty - 1)}
                            aria-label="Decrease quantity"
                        >
                            <Minus className="h-3 w-3" />
                        </Button>
                        <span className="w-8 text-center">{item.qty}</span>
                        <Button
                            variant="outline"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => onUpdateQuantity(item.id, item.qty + 1)}
                            aria-label="Increase quantity"
                        >
                            <Plus className="h-3 w-3" />
                        </Button>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-red-500 hover:text-red-700 hover:bg-red-100"
                            onClick={() => onRemove(item.id)}
                            aria-label="Remove item"
                        >
                            <Trash2 className="h-4 w-4" />
                        </Button>
                    </div>
                </div>
            </div>
        </Collapsible>
    )
})

CartItem.displayName = 'CartItem'

export default CartItem
