require("dotenv").config();

const { Pool } = require("pg");

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
        rejectUnauthorized: false
    }
});

pool.on("connect", () => {
    console.log("Connected to PostgreSQL database.");
});

pool.on("error", (err) => {
    console.error("PostgreSQL error:", err.message);
});


async function initializeDatabase() {

    try {

        // =========================
        // BUSINESS TABLE
        // =========================

        await pool.query(`
            CREATE TABLE IF NOT EXISTS business (
                id SERIAL PRIMARY KEY,
                company_name TEXT NOT NULL,
                business_type TEXT,
                owner_name TEXT
            )
        `);

        console.log("Business table is ready.");


        // =========================
        // TRANSACTIONS TABLE
        // =========================

        await pool.query(`
            CREATE TABLE IF NOT EXISTS transactions (
                id SERIAL PRIMARY KEY,
                business_id INTEGER,
                type TEXT NOT NULL,
                category TEXT NOT NULL,
                amount REAL NOT NULL,
                description TEXT,
                date TEXT NOT NULL
            )
        `);

        console.log("Transactions table is ready.");


        // =========================
        // ADD business_id TO OLD TABLE
        // =========================

        await pool.query(`
            ALTER TABLE transactions
            ADD COLUMN IF NOT EXISTS business_id INTEGER
        `);

        console.log("Business ID column is ready.");


    } catch (error) {

        console.error(
            "Database initialization error:",
            error.message
        );

    }
}


initializeDatabase();

module.exports = pool;