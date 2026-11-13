import {z} from 'zod'
import {prisma} from '@/lib/prisma'
import { Prisma } from '@/generated/prisma/client'

const productInput = z.object({
    sku: z.string().trim().min(1),
    name: z.string().trim().min(1),
    unit: z.string().trim().min(1).default('pcs'),
    minStock: z.number().int().min(0).default(10),
    categoryId: z.uuid().optional()
})


export async function GET(req: Request) {
    try {
        
        const {searchParams} = new URL(req.url)

        const search = searchParams.get('search')?.trim()
        const lowStock = searchParams.get('lowStock') === "true"

        const condition: Prisma.ProductWhereInput[] = []

        if(search){
            condition.push({OR: [ 
                {name: { contains: search, mode: 'insensitive'}},
                {sku: { contains: search, mode: 'insensitive'}}
            ]
        })
        }

        if(lowStock){
            condition.push({ stock: { lt: 10 } })
        }

        const product = await prisma.product.findMany({
            where: {AND: condition},
            orderBy: {createdAt: "desc"}
        })


        return Response.json({product, count: product.length}, {status: 200})
    } catch (e) {
        console.log(e)
        return Response.json({
            error: "Gagal membaca Produk"
        },{
            status: 500
        })
    }
}

export async function POST(req: Request) {
    const body = await req.json().catch(() => null)
    const parsed = productInput.safeParse(body)

    if(!parsed.success){
        const errors = z.flattenError(parsed.error)
        return Response.json(errors.fieldErrors, {status: 400})
    }

    try {
        

        const created = await prisma.product.create({data: {
            sku: parsed.data.sku,
            name: parsed.data.name,
            categoryId: parsed.data.categoryId
        }})
        return Response.json(created, {status: 201})
    } catch (e) {
        if((e as {code?: string}).code === "P2002"){
            return Response.json({error: "SKU sudah dipakai"}, {status: 409})
            }
        if((e as {code?: string}).code === "P2003"){
            return Response.json({error: "Kategori tidak ditemukan"}, {status: 400})
            }
        if((e as {code?: string}).code === "P2025"){
            return Response.json({error: "Delete Or Update gagal"}, {status: 404})
            }
        console.log(e)
        return Response.json({
            error: "Terjadi kesalah di server"
        },
        {
            status: 500
        }
    )
    }
}