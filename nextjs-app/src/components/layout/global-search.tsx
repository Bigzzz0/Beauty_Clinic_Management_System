'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Search, Loader2, User, Package } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface SearchResult {
    customers: {
        customer_id: number;
        first_name: string;
        last_name: string;
        hn_code: string;
        phone_number: string;
    }[];
    products: {
        product_id: number;
        product_name: string;
        product_code: string;
        category: string;
    }[];
}

export function GlobalSearch() {
    const router = useRouter()
    const [query, setQuery] = useState('')
    const [results, setResults] = useState<SearchResult>({ customers: [], products: [] })
    const [isLoading, setIsLoading] = useState(false)
    const [isOpen, setIsOpen] = useState(false)
    const [selectedIndex, setSelectedIndex] = useState(-1)
    const containerRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsOpen(false)
            }
        }
        document.addEventListener('mousedown', handleClickOutside)
        return () => document.removeEventListener('mousedown', handleClickOutside)
    }, [])

    useEffect(() => {
        setSelectedIndex(-1)
        const delayDebounceFn = setTimeout(async () => {
            if (query.trim().length >= 2) {
                setIsLoading(true)
                try {
                    const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`)
                    const data = await res.json()
                    setResults(data)
                    setIsOpen(true)
                } catch (error) {
                    console.error('Search failed', error)
                } finally {
                    setIsLoading(false)
                }
            } else {
                setResults({ customers: [], products: [] })
                setIsOpen(false)
            }
        }, 300)

        return () => clearTimeout(delayDebounceFn)
    }, [query])

    const handleSelect = (path: string) => {
        setIsOpen(false)
        setQuery('')
        router.push(path)
    }

    const hasResults = results.customers.length > 0 || results.products.length > 0

    return (
        <div ref={containerRef} className="relative hidden md:block">
            <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                    placeholder="ค้นหาลูกค้า, สินค้า..."
                    className="w-64 pl-9 pr-9"
                    aria-label="Global search"
                    value={query}
                    onChange={(e) => {
                        setQuery(e.target.value)
                        if (!isOpen && e.target.value.length >= 2) setIsOpen(true)
                    }}
                    onFocus={() => {
                        if (query.length >= 2) setIsOpen(true)
                    }}
                    onKeyDown={(e) => {
                        if (!isOpen) return
                        const totalItems = results.customers.length + results.products.length
                        if (e.key === 'ArrowDown') {
                            e.preventDefault()
                            setSelectedIndex(prev => (prev < totalItems - 1 ? prev + 1 : prev))
                        } else if (e.key === 'ArrowUp') {
                            e.preventDefault()
                            setSelectedIndex(prev => (prev > 0 ? prev - 1 : 0))
                        } else if (e.key === 'Enter' && selectedIndex >= 0) {
                            e.preventDefault()
                            if (selectedIndex < results.customers.length) {
                                handleSelect(`/patients/${results.customers[selectedIndex].customer_id}`)
                            } else {
                                const pIdx = selectedIndex - results.customers.length
                                handleSelect(`/inventory?search=${encodeURIComponent(results.products[pIdx].product_code || results.products[pIdx].product_name)}`)
                            }
                        }
                    }}
                />
                {isLoading && (
                    <Loader2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-muted-foreground" />
                )}
            </div>

            {isOpen && query.length >= 2 && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-popover text-popover-foreground rounded-md border shadow-md z-50 overflow-hidden max-h-[80vh] overflow-y-auto">
                    {!isLoading && !hasResults && (
                        <div className="p-4 text-center text-sm text-muted-foreground">
                            ไม่พบผลลัพธ์
                        </div>
                    )}

                    {results.customers.length > 0 && (
                        <div className="py-2">
                            <div className="px-3 py-1 text-xs font-semibold text-muted-foreground bg-muted/50">
                                คนไข้
                            </div>
                            {results.customers.map((customer, idx) => (
                                <button
                                    key={`c-${customer.customer_id}`}
                                    className={cn("w-full text-left px-3 py-2 text-sm hover:bg-accent hover:text-accent-foreground flex items-center gap-2 focus-visible:outline-none focus-visible:bg-accent focus-visible:text-accent-foreground rounded-sm", selectedIndex === idx ? "bg-accent text-accent-foreground" : "")}
                                    onClick={() => handleSelect(`/patients/${customer.customer_id}`)}
                                >
                                    <User className="h-4 w-4 text-muted-foreground shrink-0" />
                                    <div className="flex-1 overflow-hidden">
                                        <p className="truncate font-medium">{customer.first_name} {customer.last_name}</p>
                                        <p className="text-xs text-muted-foreground truncate">HN: {customer.hn_code} • โทร: {customer.phone_number}</p>
                                    </div>
                                </button>
                            ))}
                        </div>
                    )}

                    {results.products.length > 0 && (
                        <div className="py-2">
                            <div className="px-3 py-1 text-xs font-semibold text-muted-foreground bg-muted/50">
                                สินค้า
                            </div>
                            {results.products.map((product, pIdx) => {
                                const index = results.customers.length + pIdx;
                                return (
                                    <button
                                        key={`p-${product.product_id}`}
                                        className={cn("w-full text-left px-3 py-2 text-sm hover:bg-accent hover:text-accent-foreground flex items-center gap-2 focus-visible:outline-none focus-visible:bg-accent focus-visible:text-accent-foreground rounded-sm", selectedIndex === index ? "bg-accent text-accent-foreground" : "")}
                                        onClick={() => handleSelect(`/inventory?search=${encodeURIComponent(product.product_code || product.product_name)}`)}
                                    >
                                        <Package className="h-4 w-4 text-muted-foreground shrink-0" />
                                        <div className="flex-1 overflow-hidden">
                                            <p className="truncate font-medium">{product.product_name}</p>
                                            <p className="text-xs text-muted-foreground truncate">รหัส: {product.product_code || '-'} • หมวดหมู่: {product.category}</p>
                                        </div>
                                    </button>
                                )
                            })}
                        </div>
                    )}
                </div>
            )}
        </div>
    )
}
