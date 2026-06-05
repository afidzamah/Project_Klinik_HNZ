require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const { Pool } = require('pg');
const { PrismaPg } = require('@prisma/adapter-pg');

const connectionString = process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/klinik_hnz?schema=public';
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("=== UPDATING DATABASE SUPERADMIN ROLE MENU_AKSES ===");

  // Find the superadmin role
  const superadminRole = await prisma.master_role.findUnique({
    where: { kode_role: 'superadmin' }
  });

  if (!superadminRole) {
    console.error("Superadmin role not found in database!");
    process.exit(1);
  }

  console.log("Current menu_akses for superadmin:", superadminRole.menu_akses);

  let menuAksesArray = [];
  if (Array.isArray(superadminRole.menu_akses)) {
    menuAksesArray = superadminRole.menu_akses;
  } else if (typeof superadminRole.menu_akses === 'string') {
    menuAksesArray = JSON.parse(superadminRole.menu_akses);
  }

  // Add the new path if not already there
  const newPath = '/superadmin/obat';
  if (!menuAksesArray.includes(newPath)) {
    menuAksesArray.push(newPath);
    console.log(`Adding ${newPath} to menu_akses...`);
    
    await prisma.master_role.update({
      where: { kode_role: 'superadmin' },
      data: {
        menu_akses: menuAksesArray
      }
    });

    console.log("Database updated successfully!");
  } else {
    console.log(`${newPath} is already present in superadmin menu_akses.`);
  }

  process.exit(0);
}

main().catch(err => {
  console.error("Error updating superadmin role:", err);
  process.exit(1);
});
