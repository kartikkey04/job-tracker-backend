import { db } from '../../config/db';
import { AppError } from '../../middlewares/errorHandler';
import { JobApplication, JobStatus, CreateJobBody, UpdateJobBody } from '../../types';

interface ListJobsOptions {
  userId: string;
  status?: JobStatus;
  page: number;
  limit: number;
  sort: string;
  order: string;
}

export const createJob = async (
  userId: string,
  body: CreateJobBody
): Promise<JobApplication> => {
  const result = await db.query(
    `INSERT INTO job_applications
      (user_id, company_name, role_title, job_description, status, applied_date, interview_date, salary_range, job_url, notes)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
     RETURNING *`,
    [
      userId,
      body.company_name,
      body.role_title,
      body.job_description ?? null,
      body.status ?? 'applied',
      body.applied_date ?? new Date(),
      body.interview_date ?? null,
      body.salary_range ?? null,
      body.job_url ?? null,
      body.notes ?? null,
    ]
  );

  const job = result.rows[0] as JobApplication;

  // Log initial status in history
  await db.query(
    `INSERT INTO status_history (job_id, old_status, new_status, note)
     VALUES ($1, NULL, $2, 'Initial application')`,
    [job.id, job.status]
  );

  return job;
};

export const listJobs = async (
  options: ListJobsOptions
): Promise<{ jobs: JobApplication[]; total: number; page: number; totalPages: number }> => {
  const { userId, status, page, limit, sort, order } = options;
  const offset = (page - 1) * limit;

  const conditions = ['user_id = $1'];
  const params: unknown[] = [userId];

  if (status) {
    params.push(status);
    conditions.push(`status = $${params.length}`);
  }

  const where = conditions.join(' AND ');
  const allowedSorts = ['applied_date', 'created_at', 'company_name'];
  const safeSort = allowedSorts.includes(sort) ? sort : 'created_at';
  const safeOrder = order === 'asc' ? 'ASC' : 'DESC';

  const [jobsResult, countResult] = await Promise.all([
    db.query(
      `SELECT * FROM job_applications WHERE ${where}
       ORDER BY ${safeSort} ${safeOrder}
       LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
      [...params, limit, offset]
    ),
    db.query(`SELECT COUNT(*) FROM job_applications WHERE ${where}`, params),
  ]);

  const total = parseInt(countResult.rows[0].count);
  return {
    jobs: jobsResult.rows as JobApplication[],
    total,
    page,
    totalPages: Math.ceil(total / limit),
  };
};

export const getJobById = async (
  jobId: string,
  userId: string
): Promise<JobApplication & { history: unknown[] }> => {
  const [jobResult, historyResult] = await Promise.all([
    db.query('SELECT * FROM job_applications WHERE id = $1 AND user_id = $2', [jobId, userId]),
    db.query('SELECT * FROM status_history WHERE job_id = $1 ORDER BY changed_at DESC', [jobId]),
  ]);

  if (!jobResult.rows[0]) throw new AppError('Job not found', 404);

  return { ...(jobResult.rows[0] as JobApplication), history: historyResult.rows };
};

export const updateJob = async (
  jobId: string,
  userId: string,
  body: UpdateJobBody
): Promise<JobApplication> => {
  // Get current job first
  const current = await db.query(
    'SELECT * FROM job_applications WHERE id = $1 AND user_id = $2',
    [jobId, userId]
  );
  if (!current.rows[0]) throw new AppError('Job not found', 404);

  const currentJob = current.rows[0] as JobApplication;

  const fields: string[] = [];
  const values: unknown[] = [];
  let idx = 1;

  const updatable: (keyof UpdateJobBody)[] = [
    'company_name', 'role_title', 'job_description', 'status',
    'applied_date', 'interview_date', 'salary_range', 'job_url', 'notes',
  ];

  for (const key of updatable) {
    if (body[key] !== undefined) {
      fields.push(`${key} = $${idx++}`);
      values.push(body[key]);
    }
  }

  if (fields.length === 0) throw new AppError('No fields to update', 400);

  fields.push(`updated_at = NOW()`);
  values.push(jobId, userId);

  const result = await db.query(
    `UPDATE job_applications SET ${fields.join(', ')}
     WHERE id = $${idx++} AND user_id = $${idx}
     RETURNING *`,
    values
  );

  // If status changed, log it
  if (body.status && body.status !== currentJob.status) {
    await db.query(
      `INSERT INTO status_history (job_id, old_status, new_status)
       VALUES ($1, $2, $3)`,
      [jobId, currentJob.status, body.status]
    );
  }

  return result.rows[0] as JobApplication;
};

export const deleteJob = async (jobId: string, userId: string): Promise<void> => {
  const result = await db.query(
    'DELETE FROM job_applications WHERE id = $1 AND user_id = $2 RETURNING id',
    [jobId, userId]
  );
  if (!result.rows[0]) throw new AppError('Job not found', 404);
};

export const getJobStats = async (
  userId: string
): Promise<Record<string, number>> => {
  const result = await db.query(
    `SELECT status, COUNT(*)::int as count
     FROM job_applications WHERE user_id = $1
     GROUP BY status`,
    [userId]
  );

  const stats: Record<string, number> = {
    applied: 0, screening: 0, interview: 0,
    offer: 0, rejected: 0, withdrawn: 0, total: 0,
  };

  for (const row of result.rows) {
    stats[row.status as string] = row.count as number;
    stats.total += row.count as number;
  }

  return stats;
};
