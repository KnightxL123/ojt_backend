import dotenv from "dotenv";
import pkg from "pg";

// Load env variables
dotenv.config();

const { Pool } = pkg;

// Log connection config (without password)
console.log("📋 Database Configuration:", {
  host: process.env.PGHOST,
  port: process.env.PGPORT,
  user: process.env.PGUSER,
  database: process.env.PGDATABASE,
  hasPassword: !!process.env.PGPASSWORD,
  passwordLength: process.env.PGPASSWORD?.length,
});

// PostgreSQL connection pool
export const pool = new Pool({
  host: process.env.PGHOST,
  port: process.env.PGPORT,
  user: process.env.PGUSER,
  password: process.env.PGPASSWORD,
  database: process.env.PGDATABASE,
  ssl: {
      require: true,
    rejectUnauthorized: false,
  },
});

// Test connection on startup
pool.connect((err, client, release) => {
  if (err) {
    console.error("\n❌ PostgreSQL Connection Failed!");
    console.error("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.error("RAW ERROR FROM RENDER/POSTGRES:");
    console.error("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.error(err);
    console.error("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.error("ERROR OBJECT PROPERTIES:");
    console.error("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.error("code:", err.code);
    console.error("message:", err.message);
    console.error("name:", err.name);
    console.error("severity:", err.severity);
    console.error("detail:", err.detail);
    console.error("hint:", err.hint);
    console.error("position:", err.position);
    console.error("where:", err.where);
    console.error("schema:", err.schema);
    console.error("table:", err.table);
    console.error("column:", err.column);
    console.error("dataType:", err.dataType);
    console.error("constraint:", err.constraint);
    console.error("file:", err.file);
    console.error("line:", err.line);
    console.error("routine:", err.routine);
    console.error("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.error("FULL ERROR AS JSON:");
    console.error("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.error(JSON.stringify(err, Object.getOwnPropertyNames(err), 2));
    console.error("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");
  } else {
    console.log("\n✅ PostgreSQL Connected Successfully!");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("Database:", process.env.PGDATABASE);
    console.log("Host:", process.env.PGHOST);
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");
    release();
  }
});

// Handle pool errors
pool.on('error', (err, client) => {
  console.error('\n⚠️  Unexpected error on idle PostgreSQL client');
  console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.error('RAW ERROR:', err);
  console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.error('FULL ERROR AS JSON:', JSON.stringify(err, Object.getOwnPropertyNames(err), 2));
  console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
});
