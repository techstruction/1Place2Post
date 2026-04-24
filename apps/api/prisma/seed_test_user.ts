import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
    const email = 'tony@test.com';
    const password = 'Password123!';
    const passwordHash = await bcrypt.hash(password, 12);

    const user = await prisma.user.upsert({
        where: { email },
        update: { passwordHash },
        create: {
            email,
            passwordHash,
            name: 'Tony G',
        },
    });

    console.log(`Test user created/updated: ${user.email}`);
    console.log(`Password is: ${password}`);
}

main()
    .catch(e => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
