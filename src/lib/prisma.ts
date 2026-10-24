import {PrismaClient} from '@/generated/prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'

const globaForPrisma = globalThis as unknown as {prisma?:PrismaClient}

function createClient() {
    const adapter = new PrismaPg({ connectionString: process.env.DIRECT_URL })
    return new PrismaClient({adapter})
}

export const prisma = globaForPrisma.prisma ?? createClient()

if(process.env.DIRECT_URL !== 'production'){
    globaForPrisma.prisma = prisma
}