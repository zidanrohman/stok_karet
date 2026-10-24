import {z} from 'zod'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

const movementInput  = z.object({
    type: z.enum(["in", "out"]),
    qty: z.number().int().positive(),
    note: z.string().optional()
})

type Ctx = { params: Promise<{id: string}> }

export async  function GET(_req: Request, {params}: Ctx ){
    const {id} = await params;

    try {
        const rows = await prisma.stockMovement.findMany({
            where: {productId: id},
            orderBy: {createdAt: "desc"}
        })
        return Response.json(rows)
    } catch (e) {
        console.log(e)
        return Response.json({
            error: "Gagal membaca riwayat"
        },
        {
            status: 500
        }
    )
    }
}

export async function POST(req: Request, {params}: Ctx){
    const {id} = await params;

    const body = await req.json().catch(() => null)
    const parsed = movementInput.safeParse(body)
    if(!parsed.success){
        const errors = z.flattenError(parsed.error)
        return Response.json(errors.fieldErrors, {status: 400})
    }

    const {qty, note} = parsed.data
    const type = parsed.data.type === "in" ? "IN" : "OUT"

    try {
        const result = await prisma.$transaction(async (tx) => {
            if(type === 'OUT'){
                // dicek dan dikurangi dalam satu perintah atomik
                const upd = await tx.product.updateMany({
                    where: {id, stock: {gte: qty}},
                    data: {stock: {decrement: qty}}
                })

                if(upd.count === 0){
                    const exists = await tx.product.findUnique({
                        where: {id}
                    })
                    throw new Error(exists ? "STOK_KURANG" : "NOT_FOUND")
                }
            } else {
                const upd = await tx.product.updateMany({
                    where: {id},
                    data: {stock: {increment: qty}}
                })
                if(upd.count === 0) throw new Error ("NOT_FOUND")
            }

            const movement = await tx.stockMovement.create({
                data: {productId: id, type, qty, note}
            })
            const product = await tx.product.findUniqueOrThrow({
                where: {id}
            })
            return {stock: product.stock, movement}
        })

        return Response.json(result, {status: 201})

    } catch (e) {
        const msg = (e as Error).message
        if(msg === 'NOT_FOUND')
            return Response.json({error: "Produk tidak ditemukan"}, { status: 404})
        if(msg === 'STOK_KURANG')
            return Response.json({error: "Stok tidak cukup"}, {status: 400})
        console.log(e)
        return Response.json({error: "Terjadi kesalah server"}, {status: 500})
    }
}