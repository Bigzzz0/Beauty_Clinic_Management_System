'use client'

import { useState } from 'react'
import {
    Tags, Plus, Edit, Trash2, Save, Package, DollarSign, ArrowLeft
} from 'lucide-react'
import Link from 'next/link'
import { toast } from 'sonner'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog'
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
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table'

interface Category {
    id: number
    type: string
    name: string
    code: string
    description: string | null
    is_active: boolean
    sort_order: number
}

const CATEGORY_TYPES = [
    { value: 'PRODUCT', label: 'หมวดสินค้า', icon: Package },
    { value: 'COMMISSION', label: 'หมวดค่ามือ', icon: DollarSign },
]

export default function CategoriesPage() {
    const queryClient = useQueryClient()
    const [activeTab, setActiveTab] = useState('PRODUCT')
    const [showDialog, setShowDialog] = useState(false)
    const [editingCategory, setEditingCategory] = useState<Partial<Category> | null>(null)
    const [deleteId, setDeleteId] = useState<number | null>(null)

    // Fetch categories
    const { data: categories = [] } = useQuery<Category[]>({
        queryKey: ['categories', activeTab],
        queryFn: async () => {
            const res = await fetch(`/api/categories?type=${activeTab}`)
            const data = await res.json()
            return Array.isArray(data) ? data : []
        },
    })

    // Create/Update mutation
    const saveMutation = useMutation({
        mutationFn: async (data: Partial<Category>) => {
            const url = data.id ? `/api/categories/${data.id}` : '/api/categories'
            const method = data.id ? 'PUT' : 'POST'

            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ...data, type: activeTab }),
            })

            if (!res.ok) {
                const err = await res.json()
                throw new Error(err.error || 'Failed to save')
            }
            return res.json()
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['categories'] })
            toast.success(editingCategory?.id ? 'แก้ไขสำเร็จ' : 'เพิ่มสำเร็จ')
            handleCloseDialog()
        },
        onError: (err: Error) => {
            toast.error(err.message || 'เกิดข้อผิดพลาด')
        },
    })

    // Delete mutation
    const deleteMutation = useMutation({
        mutationFn: async (id: number) => {
            const res = await fetch(`/api/categories/${id}`, { method: 'DELETE' })
            if (!res.ok) throw new Error('Failed to delete')
            return res.json()
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['categories'] })
            toast.success('ลบสำเร็จ')
            setDeleteId(null)
        },
        onError: () => {
            toast.error('ไม่สามารถลบได้')
        },
    })

    const handleOpenCreate = () => {
        setEditingCategory({ name: '', code: '', description: '', sort_order: 0 })
        setShowDialog(true)
    }

    const handleOpenEdit = (cat: Category) => {
        setEditingCategory(cat)
        setShowDialog(true)
    }

    const handleCloseDialog = () => {
        setShowDialog(false)
        setEditingCategory(null)
    }

    const handleSave = () => {
        if (!editingCategory?.name || !editingCategory?.code) {
            toast.error('กรุณากรอกชื่อและรหัส')
            return
        }
        saveMutation.mutate(editingCategory)
    }

    const getCategoryLabel = (type: string) => {
        return CATEGORY_TYPES.find(t => t.value === type)?.label || type
    }

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
                        <h1 className="text-2xl font-bold flex items-center gap-2">
                            <Tags className="h-6 w-6 text-purple-500" />
                            จัดการหมวดหมู่
                        </h1>
                        <p className="text-slate-500">เพิ่ม แก้ไข ลบ หมวดหมู่สินค้าและค่ามือ</p>
                    </div>
                </div>
            </div>

            {/* Tabs */}
            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
                <TabsList>
                    {CATEGORY_TYPES.map(type => (
                        <TabsTrigger key={type.value} value={type.value} className="gap-2">
                            <type.icon className="h-4 w-4" />
                            {type.label}
                        </TabsTrigger>
                    ))}
                </TabsList>

                {CATEGORY_TYPES.map(type => (
                    <TabsContent key={type.value} value={type.value}>
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between">
                                <div>
                                    <CardTitle>{type.label} ({categories.length})</CardTitle>
                                    <CardDescription>
                                        {type.value === 'PRODUCT'
                                            ? 'หมวดหมู่สำหรับจัดกลุ่มสินค้าในคลัง'
                                            : 'หมวดหมู่สำหรับจัดกลุ่มอัตราค่ามือ'}
                                    </CardDescription>
                                </div>
                                <Button onClick={handleOpenCreate}>
                                    <Plus className="h-4 w-4 mr-2" />
                                    เพิ่มหมวดหมู่
                                </Button>
                            </CardHeader>
                            <CardContent>
                                <div className="rounded-lg border overflow-hidden">
                                    <Table>
                                        <TableHeader>
                                            <TableRow className="bg-slate-50">
                                                <TableHead className="w-24">รหัส</TableHead>
                                                <TableHead>ชื่อหมวดหมู่</TableHead>
                                                <TableHead>คำอธิบาย</TableHead>
                                                <TableHead className="text-center w-24">ลำดับ</TableHead>
                                                <TableHead className="w-24">สถานะ</TableHead>
                                                <TableHead className="w-24"></TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {categories.map((cat) => (
                                                <TableRow key={cat.id}>
                                                    <TableCell className="font-mono text-sm">
                                                        {cat.code}
                                                    </TableCell>
                                                    <TableCell className="font-medium">
                                                        {cat.name}
                                                    </TableCell>
                                                    <TableCell className="text-slate-500">
                                                        {cat.description || '-'}
                                                    </TableCell>
                                                    <TableCell className="text-center">
                                                        {cat.sort_order}
                                                    </TableCell>
                                                    <TableCell>
                                                        <Badge variant={cat.is_active ? 'default' : 'secondary'}>
                                                            {cat.is_active ? 'ใช้งาน' : 'ปิดใช้'}
                                                        </Badge>
                                                    </TableCell>
                                                    <TableCell>
                                                        <div className="flex gap-1">
                                                            <Button
                                                                variant="ghost"
                                                                size="icon"
                                                                onClick={() => handleOpenEdit(cat)}
                                                            >
                                                                <Edit className="h-4 w-4" />
                                                            </Button>
                                                            <Button
                                                                variant="ghost"
                                                                size="icon"
                                                                className="text-red-500"
                                                                onClick={() => setDeleteId(cat.id)}
                                                            >
                                                                <Trash2 className="h-4 w-4" />
                                                            </Button>
                                                        </div>
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                            {categories.length === 0 && (
                                                <TableRow>
                                                    <TableCell colSpan={6} className="text-center py-8 text-slate-500">
                                                        ยังไม่มีหมวดหมู่ กดปุ่ม "เพิ่มหมวดหมู่" เพื่อสร้าง
                                                    </TableCell>
                                                </TableRow>
                                            )}
                                        </TableBody>
                                    </Table>
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>
                ))}
            </Tabs>

            {/* Create/Edit Dialog */}
            <Dialog open={showDialog} onOpenChange={setShowDialog}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle>
                            {editingCategory?.id ? 'แก้ไขหมวดหมู่' : 'เพิ่มหมวดหมู่ใหม่'}
                        </DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                        <div>
                            <Label>รหัสหมวดหมู่ (Code) *</Label>
                            <Input
                                value={editingCategory?.code || ''}
                                onChange={(e) => setEditingCategory({
                                    ...editingCategory,
                                    code: e.target.value.toUpperCase().replace(/\s/g, '_')
                                })}
                                placeholder="เช่น BOTOX, TREATMENT_COVER"
                            />
                            <p className="text-xs text-slate-500 mt-1">
                                ใช้ตัวพิมพ์ใหญ่และ _ แทนเว้นวรรค
                            </p>
                        </div>
                        <div>
                            <Label>ชื่อหมวดหมู่ *</Label>
                            <Input
                                value={editingCategory?.name || ''}
                                onChange={(e) => setEditingCategory({
                                    ...editingCategory,
                                    name: e.target.value
                                })}
                                placeholder="เช่น โบท็อกซ์, หมอการคลุมทรีทเมนต์"
                            />
                        </div>
                        <div>
                            <Label>คำอธิบาย</Label>
                            <Input
                                value={editingCategory?.description || ''}
                                onChange={(e) => setEditingCategory({
                                    ...editingCategory,
                                    description: e.target.value
                                })}
                                placeholder="คำอธิบายเพิ่มเติม (ไม่บังคับ)"
                            />
                        </div>
                        <div>
                            <Label>ลำดับการแสดง</Label>
                            <Input
                                type="number"
                                value={editingCategory?.sort_order || 0}
                                onChange={(e) => setEditingCategory({
                                    ...editingCategory,
                                    sort_order: parseInt(e.target.value) || 0
                                })}
                            />
                        </div>
                        <Button
                            className="w-full"
                            onClick={handleSave}
                            disabled={saveMutation.isPending}
                        >
                            <Save className="h-4 w-4 mr-2" />
                            {saveMutation.isPending ? 'กำลังบันทึก...' : 'บันทึก'}
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Delete Confirmation */}
            <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>ยืนยันการลบ</AlertDialogTitle>
                        <AlertDialogDescription>
                            คุณต้องการลบหมวดหมู่นี้หรือไม่? การลบจะไม่กระทบข้อมูลที่ใช้หมวดหมู่นี้อยู่
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>ยกเลิก</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={() => deleteId && deleteMutation.mutate(deleteId)}
                            className="bg-red-600 hover:bg-red-700"
                        >
                            ลบ
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    )
}
