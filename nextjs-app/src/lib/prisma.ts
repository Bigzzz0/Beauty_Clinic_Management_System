import { PrismaClient } from '@prisma/client'
import { getContext } from './context'

const globalForPrisma = globalThis as unknown as {
    prisma: ReturnType<typeof createPrismaClient> | undefined
}

function createPrismaClient() {
    const prismaBase = new PrismaClient()
    return prismaBase.$extends({
        query: {
            $allModels: {
                async create({ model, operation, args, query }) {
                    const result = await query(args);
                    try {
                        if (model !== 'audit_log' && model !== 'staff') {
                            const ctx = getContext()
                            await prismaBase.audit_log.create({
                                data: {
                                    user_id: ctx?.staffId || null,
                                    action: `CREATE_${model.toUpperCase()}`,
                                    target_resource: model,
                                    target_id: result && typeof result === 'object' && 'id' in result ? String((result as any).id) : (result && typeof result === 'object' && 'customer_id' in result ? String((result as any).customer_id) : 'unknown'),
                                    details: JSON.stringify(args.data),
                                }
                            })
                        }
                    } catch (e) {
                        console.error('Audit create error:', e)
                    }
                    return result;
                },
                async update({ model, operation, args, query }) {
                    const MathContext = await query(args);
                    const result = MathContext;
                    try {
                        if (model !== 'audit_log' && model !== 'staff' && model !== 'customer_consent') {
                            const ctx = getContext()
                            await prismaBase.audit_log.create({
                                data: {
                                    user_id: ctx?.staffId || null,
                                    action: `UPDATE_${model.toUpperCase()}`,
                                    target_resource: model,
                                    target_id: result && typeof result === 'object' && 'id' in result ? String((result as any).id) : (result && typeof result === 'object' && 'customer_id' in result ? String((result as any).customer_id) : 'unknown'),
                                    details: JSON.stringify(args.data),
                                }
                            })
                        }
                    } catch (e) {
                        console.error('Audit update error:', e)
                    }
                    return result;
                },
                async delete({ model, operation, args, query }) {
                    const result = await query(args);
                    try {
                        if (model !== 'audit_log' && model !== 'staff') {
                            const ctx = getContext()
                            await prismaBase.audit_log.create({
                                data: {
                                    user_id: ctx?.staffId || null,
                                    action: `DELETE_${model.toUpperCase()}`,
                                    target_resource: model,
                                    target_id: result && typeof result === 'object' && 'id' in result ? String((result as any).id) : (result && typeof result === 'object' && 'customer_id' in result ? String((result as any).customer_id) : 'unknown'),
                                    details: 'Deleted record',
                                }
                            })
                        }
                    } catch (e) {
                        console.error('Audit delete error:', e)
                    }
                    return result;
                }
            }
        }
    })
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient()

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma
