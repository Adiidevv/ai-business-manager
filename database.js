const dotenv = require("dotenv");
dotenv.config({ path: [".env.local", ".env"] });

const { Pool } = require("pg");

if (!process.env.DATABASE_URL) {
    console.error("DATABASE_URL is missing. Check your local environment configuration.");
    process.exit(1);
}

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ...(process.env.PGSSL === "true" ? { ssl: { rejectUnauthorized: true } } : {})
});

pool.on("error", (error) => {
    console.error("Unexpected PostgreSQL connection error:", error.message);
});

async function initializeDatabase() {
    const client = await pool.connect();
    try {
        await client.query("BEGIN");
        await client.query(`
            CREATE TABLE IF NOT EXISTS users (
                id SERIAL PRIMARY KEY,
                email VARCHAR(254) NOT NULL UNIQUE,
                full_name VARCHAR(100) NOT NULL,
                password_hash TEXT NOT NULL,
                created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
            );
        `);
        await client.query(`
            CREATE TABLE IF NOT EXISTS business (
                id SERIAL PRIMARY KEY,
                company_name VARCHAR(255) NOT NULL,
                business_type VARCHAR(100) NOT NULL,
                owner_name VARCHAR(255) NOT NULL
            );
        `);
        // Safe additive migration: existing records remain intact and unassigned.
        await client.query(`
            ALTER TABLE business
            ADD COLUMN IF NOT EXISTS user_id INTEGER REFERENCES users(id) ON DELETE CASCADE;
        `);
        await client.query(`
            CREATE INDEX IF NOT EXISTS business_user_id_idx ON business(user_id);
        `);
        await client.query(`
            CREATE TABLE IF NOT EXISTS transactions (
                id SERIAL PRIMARY KEY,
                business_id INTEGER NOT NULL REFERENCES business(id) ON DELETE CASCADE,
                type VARCHAR(20) NOT NULL CHECK (type IN ('income', 'expense')),
                category VARCHAR(100) NOT NULL,
                amount NUMERIC(12, 2) NOT NULL CHECK (amount > 0),
                description TEXT DEFAULT '',
                date DATE NOT NULL
            );
        `);
        await client.query(`
            CREATE TABLE IF NOT EXISTS credit_customers (
                id SERIAL PRIMARY KEY,
                business_id INTEGER NOT NULL REFERENCES business(id) ON DELETE CASCADE,
                name VARCHAR(120) NOT NULL,
                phone VARCHAR(40) DEFAULT '',
                opening_balance NUMERIC(12,2) NOT NULL DEFAULT 0 CHECK (opening_balance >= 0),
                due_date DATE,
                notes TEXT DEFAULT '',
                created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
            );
        `);
        await client.query(`
            CREATE TABLE IF NOT EXISTS credit_payments (
                id SERIAL PRIMARY KEY,
                customer_id INTEGER NOT NULL REFERENCES credit_customers(id) ON DELETE CASCADE,
                amount NUMERIC(12,2) NOT NULL CHECK (amount > 0),
                payment_date DATE NOT NULL,
                note TEXT DEFAULT '',
                created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
            );
        `);
        await client.query(`CREATE INDEX IF NOT EXISTS credit_customers_business_idx ON credit_customers(business_id);`);
        await client.query(`CREATE INDEX IF NOT EXISTS credit_payments_customer_idx ON credit_payments(customer_id);`);
        await client.query(`
            CREATE TABLE IF NOT EXISTS suppliers (
                id SERIAL PRIMARY KEY,
                business_id INTEGER NOT NULL REFERENCES business(id) ON DELETE CASCADE,
                name VARCHAR(120) NOT NULL,
                phone VARCHAR(40) DEFAULT '',
                notes TEXT DEFAULT '',
                created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
            );
        `);
        await client.query(`
            CREATE TABLE IF NOT EXISTS supplier_bills (
                id SERIAL PRIMARY KEY,
                business_id INTEGER NOT NULL REFERENCES business(id) ON DELETE CASCADE,
                supplier_id INTEGER NOT NULL REFERENCES suppliers(id) ON DELETE CASCADE,
                description VARCHAR(255) NOT NULL,
                amount NUMERIC(12,2) NOT NULL CHECK (amount > 0),
                due_date DATE NOT NULL,
                bill_date DATE NOT NULL,
                created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
            );
        `);
        await client.query(`
            CREATE TABLE IF NOT EXISTS supplier_payments (
                id SERIAL PRIMARY KEY,
                bill_id INTEGER NOT NULL REFERENCES supplier_bills(id) ON DELETE CASCADE,
                amount NUMERIC(12,2) NOT NULL CHECK (amount > 0),
                payment_date DATE NOT NULL,
                note TEXT DEFAULT ''
            );
        `);
        await client.query(`
            CREATE TABLE IF NOT EXISTS inventory_items (
                id SERIAL PRIMARY KEY,
                business_id INTEGER NOT NULL REFERENCES business(id) ON DELETE CASCADE,
                name VARCHAR(150) NOT NULL,
                sku VARCHAR(80) DEFAULT '',
                quantity NUMERIC(12,2) NOT NULL DEFAULT 0 CHECK (quantity >= 0),
                unit_cost NUMERIC(12,2) NOT NULL DEFAULT 0 CHECK (unit_cost >= 0),
                low_stock_threshold NUMERIC(12,2) NOT NULL DEFAULT 5 CHECK (low_stock_threshold >= 0),
                updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
            );
        `);
        await client.query(`CREATE INDEX IF NOT EXISTS supplier_bills_business_idx ON supplier_bills(business_id);`);
        await client.query(`CREATE INDEX IF NOT EXISTS inventory_items_business_idx ON inventory_items(business_id);`);

        await client.query("COMMIT");
        console.log("Database tables are ready.");
    } catch (error) {
        await client.query("ROLLBACK");
        throw error;
    } finally {
        client.release();
    }
}

module.exports = { pool, initializeDatabase };
