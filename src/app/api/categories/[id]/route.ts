import {z} from 'zod'
import {prisma} from '@/lib/prisma'

const isSchema = z.uuid()
type Ctx = {params: Promise<{id: string}>}

const categoryInput = z.object({
    name: z.string().trim().min(1)
})



function inValid(){
    return Response.json({error: "Id tidak valid"}, {status: 400})
}
function notFound(){
    return Response.json({error: "Kategori tidak ditemukan"}, {status: 404})
}
function serverErr(e: unknown){
    const errCode = (e as {code?: string}).code

    if(errCode === "P2025"){
        return Response.json({error: "Kategori tidak ditemukan"}, {status: 404})
    }
    if(errCode === "P2002"){
        return Response.json({error: "Kategori sudah ada"}, {status: 409})
    }
    console.error(e)
    return Response.json({error: 'Terjadi kesalahan di server'}, {status: 500})
}

export async function GET(_req: Request, {params}: Ctx) {
    const {id} = await params 

    if(!isSchema.safeParse(id).success){
        return inValid()
    }

    try {
        const category = await prisma.category.findUnique({
            where: {id},
            include: {_count: {select: {product: true}}}
        })

        if(!category) return notFound()
        return Response.json(category, {status: 200})
    } catch (e) {
        
        return serverErr(e)
    }
}

export async function PUT(req: Request, {params}: Ctx) {
    const {id} = await params

    if(!isSchema.safeParse(id).success){
        return inValid()
    }

    const body = await req.json().catch(() => null)
    const parsed = categoryInput.safeParse(body)

    if(!parsed.success){
        const errors = z.flattenError(parsed.error).fieldErrors
        return Response.json(errors, {status: 400})
    }

    try {
        const updated = await prisma.category.update({
            where: {id},
            data: {name: parsed.data.name}
        })
        return Response.json(updated, {status: 200})
    } catch (e) {
        return serverErr(e)
    }
}

export async function DELETE(_req: Request, {params}: Ctx) {
    const {id} = await params

    if(!isSchema.safeParse(id).success){
        return inValid()
    }

    try {
        const deleted = await prisma.category.delete({
            where: {id}
        })
        return Response.json(deleted, {status: 200})
    } catch (e) {
        return serverErr(e)
    }
}