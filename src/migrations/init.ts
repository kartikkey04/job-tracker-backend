import { db } from '../config/db';

export const runMigrations = async (): Promise<void> => {
  const client = await db.connect();

  try {
    await client.query('BEGIN');

    // Enable UUID extension
    await client.query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`);

    // Users table
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        name VARCHAR(100) NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        refresh_token TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )
    `);

    // Status enum
    await client.query(`
      DO $$ BEGIN
        CREATE TYPE job_status AS ENUM (
          'applied', 'screening', 'interview', 'offer', 'rejected', 'withdrawn'
        );
      EXCEPTION WHEN duplicate_object THEN null;
      END $$
    `);

    // Job applications table
    await client.query(`
      CREATE TABLE IF NOT EXISTS job_applications (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        company_name VARCHAR(200) NOT NULL,
        role_title VARCHAR(200) NOT NULL,
        job_description TEXT,
        status job_status NOT NULL DEFAULT 'applied',
        applied_date DATE NOT NULL DEFAULT CURRENT_DATE,
        interview_date TIMESTAMP WITH TIME ZONE,
        salary_range VARCHAR(100),
        job_url TEXT,
        notes TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )
    `);

    // Status history table
    await client.query(`
      CREATE TABLE IF NOT EXISTS status_history (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        job_id UUID NOT NULL REFERENCES job_applications(id) ON DELETE CASCADE,
        old_status job_status,
        new_status job_status NOT NULL,
        note TEXT,
        changed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )
    `);

    // AI cache table
    await client.query(`
      CREATE TABLE IF NOT EXISTS ai_cache (
        cache_key VARCHAR(255) PRIMARY KEY,
        response TEXT NOT NULL,
        type VARCHAR(50) NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        expires_at TIMESTAMP WITH TIME ZONE NOT NULL
      )
    `);

    // Indexes for performance
    await client.query(`CREATE INDEX IF NOT EXISTS idx_jobs_user_id ON job_applications(user_id)`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_jobs_status ON job_applications(status)`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_status_history_job_id ON status_history(job_id)`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_users_email ON users(email)`);

    await client.query('COMMIT');
    console.log('Migrations ran successfully');
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Migration failed:', error);
    throw error;
  } finally {
    client.release();
  }
};
