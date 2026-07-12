import bcrypt from 'bcrypt';
import { initializeDatabase, query, closeDatabase } from '../../utils/database';
import logger from '../../utils/logger';

async function seedDatabase() {
  try {
    initializeDatabase();
    logger.info('Starting database seeding...');

    // 1. Admin user and Departments
    const passwordHash = await bcrypt.hash('Admin@123', 12);
    
    // Departments
    const deptResult = await query(
      `INSERT INTO departments (name, status) VALUES 
      ('IT Support', 'Active'), 
      ('Human Resources', 'Active') 
      RETURNING id, name`
    );
    const itDeptId = deptResult.rows.find((d: any) => d.name === 'IT Support').id;

    await query(
      `INSERT INTO users (name, email, password_hash, department_id, role, status)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id`,
      ['Admin User', 'admin@assetflow.com', passwordHash, itDeptId, 'Admin', 'Active']
    );

    // Categories
    const catResult = await query(
      `INSERT INTO categories (name, custom_fields) VALUES 
       ('Laptops', '{"warranty_months": 36}'), 
       ('Projectors', '{"resolution": "1080p"}') 
       RETURNING id, name`
    );
    const laptopCatId = catResult.rows.find((c: any) => c.name === 'Laptops').id;
    const projectorCatId = catResult.rows.find((c: any) => c.name === 'Projectors').id;

    // Assets
    await query(
      `INSERT INTO assets (asset_tag, category_id, name, serial_number, acquisition_date, acquisition_cost, condition, location, is_shared, status)
       VALUES 
       ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10),
       ($11, $12, $13, $14, $15, $16, $17, $18, $19, $20),
       ($21, $22, $23, $24, $25, $26, $27, $28, $29, $30)
      `,
      [
        'AF-0001', laptopCatId, 'Dell XPS 15', 'SN-DELL-001', '2023-01-15', 1500.00, 'New', 'IT Storage', false, 'Available',
        'AF-0002', laptopCatId, 'MacBook Pro 16', 'SN-MAC-002', '2023-02-20', 2500.00, 'Good', 'IT Storage', false, 'Available',
        'AF-0003', projectorCatId, 'Epson Pro EX9220', 'SN-EPS-003', '2022-11-05', 800.00, 'Good', 'Conference Room A', true, 'Available'
      ]
    );

    logger.info('Database seeding completed successfully.');
  } catch (error) {
    logger.error('Database seeding failed:', error);
    process.exit(1);
  } finally {
    await closeDatabase();
  }
}

seedDatabase();
