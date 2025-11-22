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

app.post("/student/create", async (req, res) => {
  const { email, password, confirmPassword } = req.body;

  if (!email) {
    return res.status(400).json({
      error: "Email is required",
    });
  }

  try {
    const dbResult = await pool.query(
      "SELECT email FROM students WHERE email = $1",
      [email]
    );

    console.log(dbResult);
    const emailInDb = dbResult.rows[0]?.email || null;
    const isMatch = !!emailInDb && emailInDb === email;

    //Update Password and Status
    if (!emailInDb) {
      console.log("Email not found in students table");
      return res.status(404).json({
        error: "Email not found",
        request: { email },
      });
    }

    // if (password !== confirmPassword) {
    //   return res.status(400).json({
    //     error: "Passwords do not match",
    //   });
    // }

    const updateResult = await pool.query(
      "UPDATE students SET password = $1, status = $2 WHERE email = $3 RETURNING student_id, email, status",
      [password, "registered", email]
    );

    console.log("\n New /student/create request");
    console.log("Request Email:", email);
    console.log("DB Email:", emailInDb);
    console.log("Password:", password);
    console.log("Confirm Password:", confirmPassword);
    console.log("Email matches DB:", isMatch);
    console.log("Update result:", updateResult.rows[0]);

    res.status(201).json({
      message: "Student registered successfully",
      request: { email, password, confirmPassword },
      db: { email: emailInDb },
      comparison: { isMatch },
      update: updateResult.rows[0],
    });
  } catch (err) {
    console.error("\n❌ /student/create Email Check Error!");
    console.error("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.error(err);
    console.error("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");

    res.status(500).json({
      error: "Database query failed",
      details: {
        code: err.code,
        message: err.message,
      },
    });
  }
});

app.post("/auth/login", async (req, res) => {
  const { email, password } = req.body;

  //check email and password from DB
  if (!email || !password) {
    return res.status(400).json({
      error: "Email and password are required",
    });
  }

  try {
    const result = await pool.query(
      "SELECT student_id, email, status FROM students WHERE email = $1 AND password = $2",
      [email, password]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    const student = result.rows[0];

    console.log("\n New /auth/login request");
    console.log("Email:", email);
    console.log("Password:", password);
    console.log("DB Student:", student);

    res.status(200).json({
      success: true,
      message: "Login successful",
      student,
    });
  } catch (err) {
    console.error("\n❌ /auth/login Route Error!");
    console.error("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.error(err);
    console.error("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");

    res.status(500).json({
      error: "Database query failed",
      details: {
        code: err.code,
        message: err.message,
      },
    });
  }
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
