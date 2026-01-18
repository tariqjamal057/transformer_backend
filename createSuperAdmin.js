
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const readline = require('readline');

const prisma = new PrismaClient();

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

async function main() {
  rl.question('Enter name: ', (name) => {
    rl.question('Enter loginId: ', (loginId) => {
      rl.question('Enter number: ', (number) => {
        rl.question('Enter password: ', async (password) => {
          const hashedPassword = await bcrypt.hash(password, 10);

          try {
            const user = await prisma.user.create({
              data: {
                name,
                loginId,
                number,
                password: hashedPassword,
                role: 'OWNER',
                pages: ["*"],
              },
            });

            console.log('Super admin created successfully:');
            // Exclude password from output
            const userWithoutPassword = { ...user };
            delete userWithoutPassword.password;
            console.log(userWithoutPassword);
          } catch (error) {
            console.error('Error creating super admin:', error);
          } finally {
            await prisma.$disconnect();
            rl.close();
          }
        });
      });
    });
  });
}

main();
