import {z} from 'zod'
import {prisma} from '@/lib/prisma'

const CategoryInput = z.object({
    name: z.string().trim().min(1)
})


export async function GET(){
    try {
        const categories = await prisma.category.findMany({
            include: {_count: {select: {product: true}}},
            orderBy: {createdAt: 'desc'}
        })

        return Response.json(categories, {status: 200})
    } catch (e) {
        console.error(e)
        return Response.json({error: "Terjadi kesalah di server"})
    }
}

export async function POST(req: Request) {
    
    const body = await req.json().catch(() => null)
    const parsed = CategoryInput.safeParse(body)

    if(!parsed.success){
        const errors = z.flattenError(parsed.error)
        return Response.json(errors.fieldErrors, {status: 400})
    }

    try {
        const category = await prisma.category.create({data: parsed.data})
        return Response.json(category, {status: 201})
    } catch (e) {
         const code = (e as {code?: string}).code
        if(code === "P2002") return Response.json({error: "Nama Category sama"}, {status: 409})

        return Response.json({error: "Terjadi kesalahan di server"}, {status: 500})
    }

}