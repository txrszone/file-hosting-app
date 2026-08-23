import pool from './pool';
import bcrypt from 'bcrypt';

const seedData = async () => {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // Create admin user
    const adminPassword = process.env.ADMIN_PASSWORD || 'Admin123!@#';
    const adminEmail = process.env.ADMIN_EMAIL || 'admin@filehost.local';
    const passwordHash = await bcrypt.hash(adminPassword, 10);

    const adminUserRes = await client.query(
      `INSERT INTO users (email, username, password_hash, role, status)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (email) DO NOTHING
       RETURNING id`,
      [adminEmail, 'admin', passwordHash, 'admin', 'active']
    );

    if (adminUserRes.rows.length > 0) {
      console.log('✓ Admin user created');
    }

    // Insert default system settings
    const settings = [
      { key: 'file_retention_days', value: process.env.FILE_RETENTION_DAYS || '7' },
      { key: 'max_file_size', value: process.env.MAX_FILE_SIZE || '5368709120' },
      { key: 'upload_rate_limit', value: process.env.UPLOAD_RATE_LIMIT_MAX || '50' },
    ];

    for (const setting of settings) {
      await client.query(
        `INSERT INTO system_settings (key, value)
         VALUES ($1, $2)
         ON CONFLICT (key) DO NOTHING`,
        [setting.key, setting.value]
      );
    }

    console.log('✓ System settings initialized');

    await client.query('COMMIT');
    console.log('Database seeding completed successfully');
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Database seeding failed:', error);
    throw error;
  } finally {
    client.release();
  }
};

export default seedData;
