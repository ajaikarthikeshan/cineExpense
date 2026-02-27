import { DataSource } from 'typeorm';
import * as bcrypt from 'bcrypt';

/**
 * Seed script for CineExpense Pro demo environment.
 * Creates one production, three departments, and five role-based demo users.
 *
 * Usage: npm run seed
 */

async function seed() {
  const dataSource = new DataSource({
    type: 'postgres',
    host: process.env.DB_HOST ?? 'localhost',
    port: parseInt(process.env.DB_PORT ?? '5432'),
    username: process.env.DB_USER ?? 'postgres',
    password: process.env.DB_PASS ?? 'postgres',
    database: process.env.DB_NAME ?? 'cineexpense',
  });

  await dataSource.initialize();
  const qr = dataSource.createQueryRunner();

  try {
    await qr.startTransaction();

    // ── 1. Create production ──────────────────────────────────────────
    const productionResult = await qr.query(
      `INSERT INTO productions (name, status, base_currency)
       VALUES ($1, $2, $3)
       ON CONFLICT DO NOTHING
       RETURNING id`,
      ['5 Star Creations', 'active', 'INR'],
    );

    let productionId: string;
    if (productionResult.length > 0) {
      productionId = productionResult[0].id;
    } else {
      const existing = await qr.query(
        `SELECT id FROM productions WHERE name = $1`,
        ['5 Star Creations'],
      );
      productionId = existing[0].id;
    }

    console.log(`Production: ${productionId}`);

    // ── 2. Create departments ─────────────────────────────────────────
    const departmentNames = ['Art', 'Camera', 'Production'];
    const departmentIds: Record<string, string> = {};

    for (const name of departmentNames) {
      const deptResult = await qr.query(
        `INSERT INTO departments (production_id, name, allocated_budget)
         VALUES ($1, $2, $3)
         ON CONFLICT DO NOTHING
         RETURNING id`,
        [productionId, name, 100000],
      );

      if (deptResult.length > 0) {
        departmentIds[name] = deptResult[0].id;
      } else {
        const existing = await qr.query(
          `SELECT id FROM departments WHERE production_id = $1 AND name = $2`,
          [productionId, name],
        );
        departmentIds[name] = existing[0].id;
      }
    }

    console.log('Departments:', departmentIds);

    // ── 3. Fetch role IDs ─────────────────────────────────────────────
    const roles = await qr.query(`SELECT id, name FROM roles`);
    const roleMap: Record<string, string> = {};
    for (const r of roles) {
      roleMap[r.name] = r.id;
    }

    // ── 4. Hash password once ─────────────────────────────────────────
    const passwordHash = await bcrypt.hash('Demo@123', 10);

    // ── 5. Create users ───────────────────────────────────────────────
    const users = [
      { email: 'admin@5starcreations.com', name: 'Admin User', role: 'ADMIN' },
      { email: 'supervisor@5starcreations.com', name: 'Supervisor User', role: 'SUPERVISOR' },
      { email: 'manager@5starcreations.com', name: 'Manager User', role: 'MANAGER' },
      { email: 'accounts@5starcreations.com', name: 'Accounts User', role: 'ACCOUNTS' },
      { email: 'producer@5starcreations.com', name: 'Producer User', role: 'PRODUCER' },
    ];

    const userIds: Record<string, string> = {};

    for (const u of users) {
      const userResult = await qr.query(
        `INSERT INTO users (production_id, role_id, role, name, email, password_hash)
         VALUES ($1, $2, $3, $4, $5, $6)
         ON CONFLICT (email) DO UPDATE SET password_hash = $6
         RETURNING id`,
        [productionId, roleMap[u.role], u.role, u.name, u.email, passwordHash],
      );
      userIds[u.role] = userResult[0].id;
      console.log(`  ${u.role}: ${u.email} → ${userResult[0].id}`);
    }

    // ── 6. Assign Supervisor to "Art" department ──────────────────────
    await qr.query(
      `INSERT INTO user_departments (user_id, department_id)
       VALUES ($1, $2)
       ON CONFLICT (user_id, department_id) DO NOTHING`,
      [userIds['SUPERVISOR'], departmentIds['Art']],
    );

    console.log(`Assigned SUPERVISOR to Art department`);

    await qr.commitTransaction();
    console.log('\n✅ Seed completed successfully!');
  } catch (error) {
    await qr.rollbackTransaction();
    console.error('❌ Seed failed:', error);
    throw error;
  } finally {
    await qr.release();
    await dataSource.destroy();
    process.exit(0);
  }
}

seed();
