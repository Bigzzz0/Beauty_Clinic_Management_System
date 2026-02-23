'use client'

import { useState } from 'react'
import {
    DollarSign, Plus, Search, Edit, Trash2, Save, X,
    Settings, ArrowLeft, RefreshCw
} from 'lucide-react'
import { toast } from 'sonner'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card'
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import Link from 'next/link'

interface CommissionRate {
    id: number
    category: string
    item_name: string
    rate_amount: number
    position_type: string | null
    is_active: boolean
}

// ... (previous imports)

// ... (previous interfaces)

const CATEGORIES = [
    { value: 'TREATMENT_COVER', label: 'หมอการคลุมทรีทเมนต์' },
    { value: 'LASER', label: 'เลเซอร์/ทรีทเมนต์' },
    { value: 'STAFF_ASSIST', label: 'ค่าช่วยผลักงานพนักงาน' },
]

const POSITIONS = [
    { value: 'Doctor', label: 'แพทย์' },
    { value: 'Therapist', label: 'ผู้ช่วยแพทย์' },
    { value: 'Admin', label: 'แอดมิน' },
    { value: 'Sale', label: 'ฝ่ายขาย' },
    { value: 'Cashier', label: 'แคชเชียร์' },
]

function getCategoryColor(category: string) {
    switch (category) {
        case 'TREATMENT_COVER':
            return 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20'
        case 'LASER':
            return 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20'
        case 'STAFF_ASSIST':
            return 'bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20'
        default:
            return 'bg-muted text-muted-foreground border-border'
    }
}

function getCategoryLabel(category: string) {
    return CATEGORIES.find(c => c.value === category)?.label || category
}

export default function CommissionRatesPage() {
    const queryClient = useQueryClient()
    const [search, setSearch] = useState('')
    const [selectedCategory, setSelectedCategory] = useState<string>('ALL')
    const [isDialogOpen, setIsDialogOpen] = useState(false)
    const [editingRate, setEditingRate] = useState<CommissionRate | null>(null)
    const [deleteId, setDeleteId] = useState<number | null>(null)

    // Form state
    const [formData, setFormData] = useState({
        category: 'TREATMENT_COVER',
        itemName: '',
        rateAmount: 30,
        positionType: '',
    })

    // ... (keep logic same)
    // Fetch commission rates
    const { data, isLoading } = useQuery<{ rates: CommissionRate[] }>({
        queryKey: ['commission-rates'],
        queryFn: async () => {
            const res = await fetch('/api/commission-rates')
            if (!res.ok) throw new Error('Failed to fetch rates')
            return res.json()
        },
    })

    // Create/Update mutation
    const saveMutation = useMutation({
        mutationFn: async (data: Partial<CommissionRate> & { itemName?: string; rateAmount?: number; positionType?: string }) => {
            const url = editingRate
                ? `/api/commission-rates/${editingRate.id}`
                : '/api/commission-rates'
            const method = editingRate ? 'PUT' : 'POST'

            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data),
            })
            if (!res.ok) throw new Error('Failed to save rate')
            return res.json()
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['commission-rates'] })
            toast.success(editingRate ? 'อัปเดตค่ามือสำเร็จ' : 'เพิ่มค่ามือสำเร็จ')
            handleCloseDialog()
        },
        onError: () => toast.error('เกิดข้อผิดพลาด'),
    })

    // Delete mutation
    const deleteMutation = useMutation({
        mutationFn: async (id: number) => {
            const res = await fetch(`/api/commission-rates/${id}`, {
                method: 'DELETE',
            })
            if (!res.ok) throw new Error('Failed to delete')
            return res.json()
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['commission-rates'] })
            toast.success('ลบค่ามือสำเร็จ')
            setDeleteId(null)
        },
        onError: () => toast.error('เกิดข้อผิดพลาด'),
    })

    const handleOpenDialog = (rate?: CommissionRate) => {
        if (rate) {
            setEditingRate(rate)
            setFormData({
                category: rate.category,
                itemName: rate.item_name,
                rateAmount: Number(rate.rate_amount),
                positionType: rate.position_type || '',
            })
        } else {
            setEditingRate(null)
            setFormData({
                category: 'TREATMENT_COVER',
                itemName: '',
                rateAmount: 30,
                positionType: '',
            })
        }
        setIsDialogOpen(true)
    }

    const handleCloseDialog = () => {
        setIsDialogOpen(false)
        setEditingRate(null)
        setFormData(prev => ({ ...prev, itemName: '' })) // Keep category, position, etc.
    }

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        if (!formData.itemName.trim()) {
            toast.error('กรุณากรอกชื่อรายการ')
            return
        }
        saveMutation.mutate({
            category: formData.category,
            itemName: formData.itemName,
            rateAmount: formData.rateAmount,
            positionType: formData.positionType || undefined,
        })
    }

    // Filter rates
    const filteredRates = data?.rates?.filter(rate => {
        const matchesSearch = rate.item_name.toLowerCase().includes(search.toLowerCase())
        const matchesCategory = selectedCategory === 'ALL' || rate.category === selectedCategory
        return matchesSearch && matchesCategory
    }) || []

    // Group by category for display
    const groupedRates = CATEGORIES.map(cat => ({
        ...cat,
        rates: filteredRates.filter(r => r.category === cat.value),
    })).filter(g => g.rates.length > 0 || selectedCategory === 'ALL')

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Link href="/settings">
                        <Button variant="ghost" size="icon">
                            <ArrowLeft className="h-5 w-5" />
                        </Button>
                    </Link>
                    <div>
                        <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
                            <DollarSign className="h-8 w-8 text-primary" />
                            ฐานข้อมูลค่ามือ
                        </h1>
                        <p className="text-muted-foreground mt-1">จัดการอัตราค่าคอมมิชชั่นตามประเภทบริการ</p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <Button variant="outline" onClick={() => queryClient.invalidateQueries({ queryKey: ['commission-rates'] })}>
                        <RefreshCw className="h-4 w-4 mr-2" />
                        รีเฟรช
                    </Button>
                    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                        <DialogTrigger asChild>
                            <Button
                                className="bg-primary hover:bg-primary/90 text-primary-foreground"
                                onClick={() => handleOpenDialog()}
                            >
                                <Plus className="h-4 w-4 mr-2" />
                                เพิ่มค่ามือ
                            </Button>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>
                                    {editingRate ? 'แก้ไขค่ามือ' : 'เพิ่มค่ามือใหม่'}
                                </DialogTitle>
                                <DialogDescription>
                                    กรอกข้อมูลอัตราค่าคอมมิชชั่น
                                </DialogDescription>
                            </DialogHeader>
                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div className="space-y-2">
                                    <Label>หมวดหมู่</Label>
                                    <Select
                                        value={formData.category}
                                        onValueChange={(v) => setFormData({ ...formData, category: v })}
                                    >
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {CATEGORIES.map((cat) => (
                                                <SelectItem key={cat.value} value={cat.value}>
                                                    {cat.label}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label>ชื่อรายการ</Label>
                                    <Input
                                        value={formData.itemName}
                                        onChange={(e) => setFormData({ ...formData, itemName: e.target.value })}
                                        placeholder="เช่น JIIN Bright, เลเซอร์รักแร้"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>ค่ามือ (บาท)</Label>
                                    <Input
                                        type="number"
                                        min={0}
                                        value={formData.rateAmount}
                                        onChange={(e) => setFormData({ ...formData, rateAmount: Number(e.target.value) })}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>ตำแหน่งที่ใช้ (ไม่บังคับ)</Label>
                                    <Select
                                        value={formData.positionType || "ALL"}
                                        onValueChange={(v) => setFormData({ ...formData, positionType: v === "ALL" ? "" : v })}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="ทุกตำแหน่ง" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="ALL">ทุกตำแหน่ง</SelectItem>
                                            {POSITIONS.map((pos) => (
                                                <SelectItem key={pos.value} value={pos.value}>
                                                    {pos.label}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="flex gap-2 justify-end">
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={handleCloseDialog}
                                    >
                                        <X className="h-4 w-4 mr-2" />
                                        ยกเลิก
                                    </Button>
                                    <Button
                                        type="submit"
                                        disabled={saveMutation.isPending}
                                    >
                                        <Save className="h-4 w-4 mr-2" />
                                        {saveMutation.isPending ? 'กำลังบันทึก...' : 'บันทึก'}
                                    </Button>
                                </div>
                            </form>
                        </DialogContent>
                    </Dialog>
                </div>
            </div>

            {/* Filters */}
            <Card>
                <CardContent className="pt-6">
                    <div className="flex flex-col md:flex-row gap-4">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="ค้นหาชื่อรายการ..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="pl-10"
                            />
                        </div>
                        <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                            <SelectTrigger className="w-full md:w-[200px]">
                                <SelectValue placeholder="เลือกหมวดหมู่" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="ALL">ทุกหมวดหมู่</SelectItem>
                                {CATEGORIES.map((cat) => (
                                    <SelectItem key={cat.value} value={cat.value}>
                                        {cat.label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </CardContent>
            </Card>

            {/* Rates by Category */}
            {isLoading ? (
                <div className="flex items-center justify-center py-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
            ) : groupedRates.length === 0 ? (
                <Card>
                    <CardContent className="py-12 text-center">
                        <DollarSign className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                        <p className="text-muted-foreground">ไม่พบข้อมูลค่ามือ</p>
                        <Button
                            className="mt-4"
                            onClick={() => handleOpenDialog()}
                        >
                            <Plus className="h-4 w-4 mr-2" />
                            เพิ่มค่ามือแรก
                        </Button>
                    </CardContent>
                </Card>
            ) : (
                groupedRates.map((group) => (
                    <Card key={group.value}>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Badge className={getCategoryColor(group.value)}>
                                    {group.label}
                                </Badge>
                                <span className="text-sm text-muted-foreground">
                                    ({group.rates.length} รายการ)
                                </span>
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <Table>
                                <TableHeader>
                                    <TableRow className="bg-muted/50 hover:bg-muted/50">
                                        <TableHead>ชื่อรายการ</TableHead>
                                        <TableHead className="text-right">ค่ามือ (บาท)</TableHead>
                                        <TableHead>ตำแหน่ง</TableHead>
                                        <TableHead className="text-right">จัดการ</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {group.rates.map((rate) => (
                                        <TableRow key={rate.id}>
                                            <TableCell className="font-medium">
                                                {rate.item_name}
                                            </TableCell>
                                            <TableCell className="text-right text-green-600 dark:text-green-400 font-semibold">
                                                {Number(rate.rate_amount).toLocaleString()}
                                            </TableCell>
                                            <TableCell className="text-muted-foreground">
                                                {rate.position_type
                                                    ? POSITIONS.find(p => p.value === rate.position_type)?.label
                                                    : 'ทุกตำแหน่ง'}
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <div className="flex justify-end gap-2">
                                                    <Button
                                                        size="icon"
                                                        variant="ghost"
                                                        className="h-8 w-8 text-blue-600 hover:text-blue-700 hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-blue-900/20"
                                                        onClick={() => handleOpenDialog(rate)}
                                                    >
                                                        <Edit className="h-4 w-4" />
                                                    </Button>
                                                    <Button
                                                        size="icon"
                                                        variant="ghost"
                                                        className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20"
                                                        onClick={() => setDeleteId(rate.id)}
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                ))
            )}

            {/* Delete Confirmation */}
            <AlertDialog open={deleteId !== null} onOpenChange={() => setDeleteId(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>ยืนยันการลบ</AlertDialogTitle>
                        <AlertDialogDescription>
                            คุณต้องการลบค่ามือนี้หรือไม่? การดำเนินการนี้ไม่สามารถย้อนกลับได้
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>
                            ยกเลิก
                        </AlertDialogCancel>
                        <AlertDialogAction
                            className="bg-destructive hover:bg-destructive/90 text-destructive-foreground"
                            onClick={() => deleteId && deleteMutation.mutate(deleteId)}
                        >
                            ลบ
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    )
}
