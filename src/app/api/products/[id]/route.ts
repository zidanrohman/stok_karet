import {z} from 'zod'
import {prisma} from '@/lib/prisma'

type Ctx = {params: Promise<{id: string}>}

const idSchema = z.uuid()
const productDetail = z.object({
    name: z.string().trim().min(1)
})

function isNotFound(e: unknown){
    return (e as {code?: string}).code === 'P2025'
}

function inValid(){
    return Response.json({error: "Id tidak valid"}, {status: 400})
}
function notFound(){
    return Response.json({error: "Produk tidak ditemukan"}, {status: 404})
}
function serverErr(e: unknown){
    console.error(e)
    return Response.json({error: 'Terjadi kesalah di server'}, {status: 500})
}

export async function GET(_req: Request, {params}: Ctx) {
    const {id} = await params

    if(!idSchema.safeParse(id).success){
        return inValid()
    }

    try {
        const product = await prisma.product.findUnique({
            where: {id}
        })

        if(!product){
            return notFound()
        }
        return Response.json(product, {status: 200})
    } catch (e) {
        return serverErr(e)
    }
}

export async function PUT(req: Request, {params}: Ctx) {
   const {id} = await params
   
    if(!idSchema.safeParse(id).success){
        return inValid()
    }

   const body = await req.json().catch(() => null)
   const parsed = productDetail.safeParse(body)

   if(!parsed.success){
        const errors = z.flattenError(parsed.error).fieldErrors
        return Response.json(errors, {status: 400})
   }

   try {
     const update = await prisma.product.update({
        where: {id},
        data: {name: parsed.data.name}
     })
     return Response.json(update, {status: 200})
   } catch (e) {
    if(isNotFound(e)){
        return notFound()
    }
    return serverErr(e)
   }
}

export async function DELETE(_req: Request, {params}: Ctx) {
    const {id} = await params

    if(!idSchema.safeParse(id).success){
        return inValid()
    }

    try {
        const deleted = await prisma.product.delete({
            where: {id}
        })

        return Response.json(deleted, {status: 200})
    } catch (e) {
        if(isNotFound(e)){
            return notFound()
        }
        return serverErr(e)
    }
}