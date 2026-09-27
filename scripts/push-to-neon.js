const fs = require('fs');
const path = require('path');
const { Client } = require('pg');

const connectionString = 'postgresql://neondb_owner:npg_LFNBVJC4M9mZ@ep-blue-dream-b4fmcwi9-pooler.c-6.us-east-2.aws.neon.tech/neondb?sslmode=require';

async function main() {
  console.log('Connecting to Neon PostgreSQL database...');
  const client = new Client({
    connectionString,
    ssl: { rejectUnauthorized: false }
  });

  await client.connect();
  console.log('Connected successfully!');

  // Create table
  console.log('Creating "questions" table if not exists...');
  await client.query(`
    CREATE TABLE IF NOT EXISTS questions (
      id INT PRIMARY KEY,
      task_id VARCHAR(255) NOT NULL,
      title VARCHAR(512) NOT NULL,
      difficulty VARCHAR(50) NOT NULL,
      points INT NOT NULL DEFAULT 100,
      tags JSONB NOT NULL DEFAULT '[]',
      problem_description TEXT NOT NULL,
      starter_code TEXT,
      entry_point VARCHAR(255),
      starter_codes JSONB,
      input_output JSONB NOT NULL DEFAULT '[]',
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );
  `);
  console.log('Table "questions" is ready.');

  // Create indexes for fast querying
  await client.query(`
    CREATE INDEX IF NOT EXISTS idx_questions_difficulty ON questions(difficulty);
    CREATE INDEX IF NOT EXISTS idx_questions_task_id ON questions(task_id);
  `);

  // Read questions.json
  const questionsPath = path.join(__dirname, '..', 'src', 'data', 'questions.json');
  console.log(`Reading questions from ${questionsPath}...`);
  const rawData = fs.readFileSync(questionsPath, 'utf8');
  const questions = JSON.parse(rawData);
  console.log(`Loaded ${questions.length} questions from JSON file.`);

  // Batch insert into Neon DB
  const BATCH_SIZE = 100;
  let insertedCount = 0;

  console.log('Inserting questions into Neon PostgreSQL in batches...');

  for (let i = 0; i < questions.length; i += BATCH_SIZE) {
    const batch = questions.slice(i, i + BATCH_SIZE);
    
    // Build query with parameterized values
    const valueTuples = [];
    const queryParams = [];
    let paramIndex = 1;

    for (const q of batch) {
      valueTuples.push(
        `($${paramIndex}, $${paramIndex + 1}, $${paramIndex + 2}, $${paramIndex + 3}, $${paramIndex + 4}, $${paramIndex + 5}, $${paramIndex + 6}, $${paramIndex + 7}, $${paramIndex + 8}, $${paramIndex + 9}, $${paramIndex + 10})`
      );
      queryParams.push(
        q.id,
        q.taskId || '',
        q.title || '',
        q.difficulty || 'Easy',
        q.points || 100,
        JSON.stringify(q.tags || []),
        q.problemDescription || '',
        q.starterCode || '',
        q.entryPoint || '',
        q.starterCodes ? JSON.stringify(q.starterCodes) : null,
        JSON.stringify(q.inputOutput || [])
      );
      paramIndex += 11;
    }

    const insertQuery = `
      INSERT INTO questions (
        id, task_id, title, difficulty, points, tags, problem_description, starter_code, entry_point, starter_codes, input_output
      ) VALUES ${valueTuples.join(', ')}
      ON CONFLICT (id) DO UPDATE SET
        task_id = EXCLUDED.task_id,
        title = EXCLUDED.title,
        difficulty = EXCLUDED.difficulty,
        points = EXCLUDED.points,
        tags = EXCLUDED.tags,
        problem_description = EXCLUDED.problem_description,
        starter_code = EXCLUDED.starter_code,
        entry_point = EXCLUDED.entry_point,
        starter_codes = EXCLUDED.starter_codes,
        input_output = EXCLUDED.input_output;
    `;

    await client.query(insertQuery, queryParams);
    insertedCount += batch.length;
    process.stdout.write(`Pushed ${insertedCount} / ${questions.length} questions...\r`);
  }

  console.log(`\nSuccessfully pushed all ${insertedCount} questions to Neon DB!`);

  // Verify count from Neon DB
  const res = await client.query('SELECT COUNT(*) FROM questions;');
  console.log(`Verification - total rows in Neon DB "questions" table: ${res.rows[0].count}`);

  await client.end();
}

main().catch((err) => {
  console.error('Error seeding Neon DB:', err);
  process.exit(1);
});
