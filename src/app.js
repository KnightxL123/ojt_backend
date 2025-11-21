import express from "express";
import cors from "cors";
import { pool } from "./db.js";

const app = express();

app.use(cors());
app.use(express.json());

// Root API
app.get("/", (req, res) => {
  res.send("API is running...");
});

// Get student by student_id (e.g., /student/23-23001)
app.get("/student/:student_id", async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM students WHERE student_id = $1", [req.params.student_id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        error: "Student not found",
        student_id: req.params.student_id,
      });
    }
    
    res.json(result.rows[0]);
  } catch (err) {
    console.error("\n❌ /student/:student_id Route Error!");
    console.error("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.error(err);
    console.error("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");
    
    res.status(500).json({
      error: "Database query failed",
      connected: false,
      details: {
        code: err.code,
        message: err.message,
      },
    });
  }
});

// Get multiple students by student_ids (POST /students/batch)
app.post("/students/batch", async (req, res) => {
  try {
    const { student_ids } = req.body;
    
    // Validate input
    if (!student_ids || !Array.isArray(student_ids) || student_ids.length === 0) {
      return res.status(400).json({
        error: "Invalid request",
        message: "student_ids must be a non-empty array",
        example: { student_ids: ["23-23001", "23-23002"] }
      });
    }

    // Query database using ANY to match multiple student_ids
    const result = await pool.query(
      "SELECT * FROM students WHERE student_id = ANY($1::text[])",
      [student_ids]
    );
    
    res.json({
      count: result.rows.length,
      requested: student_ids.length,
      students: result.rows,
    });
  } catch (err) {
    console.error("\n❌ /students/batch Route Error!");
    console.error("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.error(err);
    console.error("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");
    
    res.status(500).json({
      error: "Database query failed",
      connected: false,
      details: {
        code: err.code,
        message: err.message,
      },
    });
  }
});

// Test DB API using pg Pool
app.get("/test-db", async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM students");
    res.json({
      message: "Database connected!",
      connected: true,
      serverTime: result,
    });
  } catch (err) {
    console.error("\n❌ /test-db Route Error!");
    console.error("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.error("RAW ERROR FROM RENDER/POSTGRES:");
    console.error("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.error(err);
    console.error("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.error("FULL ERROR AS JSON:");
    console.error("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.error(JSON.stringify(err, Object.getOwnPropertyNames(err), 2));
    console.error("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");
    
    res.status(500).json({
      error: "Database connection not established",
      connected: false,
      details: {
        code: err.code,
        message: err.message,
      },
    });
  }
});

export default app;
