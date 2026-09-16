const express = require("express");
const db = require("./database");

const app = express();

// Render provides PORT.
// 3000 is used when running locally.
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static("public"));


// =========================
// HOME PAGE
// =========================

app.get("/", (req, res) => {
    res.sendFile(
        __dirname + "/public/index.html"
    );
});


// =========================
// SAVE / UPDATE BUSINESS
// =========================

app.post("/api/business", async (req, res) => {

    try {

        const {
            companyName,
            businessType,
            ownerName
        } = req.body;


        if (!companyName || companyName.trim() === "") {
            return res.status(400).json({
                error: "Company name is required."
            });
        }


        if (!businessType || businessType.trim() === "") {
            return res.status(400).json({
                error: "Business type is required."
            });
        }


        if (!ownerName || ownerName.trim() === "") {
            return res.status(400).json({
                error: "Manager name is required."
            });
        }


        const cleanCompanyName = companyName.trim();
        const cleanBusinessType = businessType.trim();
        const cleanOwnerName = ownerName.trim();


        const result = await db.query(
            `SELECT id FROM business LIMIT 1`
        );


        if (result.rows.length > 0) {

            const businessId = result.rows[0].id;


            await db.query(
                `
                UPDATE business
                SET
                    company_name = $1,
                    business_type = $2,
                    owner_name = $3
                WHERE id = $4
                `,
                [
                    cleanCompanyName,
                    cleanBusinessType,
                    cleanOwnerName,
                    businessId
                ]
            );


            return res.json({
                message: "Business updated successfully.",
                companyName: cleanCompanyName,
                businessType: cleanBusinessType,
                ownerName: cleanOwnerName
            });

        }


        await db.query(
            `
            INSERT INTO business
            (
                company_name,
                business_type,
                owner_name
            )
            VALUES ($1, $2, $3)
            `,
            [
                cleanCompanyName,
                cleanBusinessType,
                cleanOwnerName
            ]
        );


        res.json({
            message: "Business saved successfully.",
            companyName: cleanCompanyName,
            businessType: cleanBusinessType,
            ownerName: cleanOwnerName
        });


    } catch (error) {

        console.error(
            "Business save error:",
            error.message
        );

        res.status(500).json({
            error: "Failed to save business."
        });
    }
});


// =========================
// GET BUSINESS
// =========================

app.get("/api/business", async (req, res) => {

    try {

        const result = await db.query(
            `
            SELECT
                company_name,
                business_type,
                owner_name
            FROM business
            LIMIT 1
            `
        );


        if (result.rows.length === 0) {

            return res.json({
                companyName: null,
                businessType: null,
                ownerName: null
            });

        }


        const row = result.rows[0];


        res.json({
            companyName: row.company_name,
            businessType: row.business_type,
            ownerName: row.owner_name
        });


    } catch (error) {

        console.error(
            "Business retrieval error:",
            error.message
        );

        res.status(500).json({
            error: "Failed to retrieve business."
        });
    }
});


// =========================
// ADD TRANSACTION
// =========================

app.post("/api/transactions", async (req, res) => {

    try {

        const {
            type,
            category,
            amount,
            description,
            date
        } = req.body;


        if (
            !type ||
            !category ||
            !amount ||
            !date
        ) {

            return res.status(400).json({
                error:
                    "Type, category, amount and date are required."
            });

        }


        const result = await db.query(
            `
            INSERT INTO transactions
            (
                type,
                category,
                amount,
                description,
                date
            )
            VALUES ($1, $2, $3, $4, $5)
            RETURNING id
            `,
            [
                type,
                category,
                amount,
                description || "",
                date
            ]
        );


        res.json({
            message: "Transaction added successfully.",
            transactionId: result.rows[0].id
        });


    } catch (error) {

        console.error(
            "Transaction insert error:",
            error.message
        );

        res.status(500).json({
            error: "Failed to save transaction."
        });
    }
});


// =========================
// GET ALL TRANSACTIONS
// =========================

app.get("/api/transactions", async (req, res) => {

    try {

        const result = await db.query(
            `
            SELECT *
            FROM transactions
            ORDER BY id DESC
            `
        );


        res.json(result.rows);


    } catch (error) {

        console.error(
            "Transaction retrieval error:",
            error.message
        );

        res.status(500).json({
            error: "Failed to retrieve transactions."
        });
    }
});


// =========================
// DELETE TRANSACTION
// =========================

app.delete(
    "/api/transactions/:id",
    async (req, res) => {

        try {

            const transactionId = req.params.id;


            const result = await db.query(
                `
                DELETE FROM transactions
                WHERE id = $1
                `,
                [transactionId]
            );


            if (result.rowCount === 0) {

                return res.status(404).json({
                    error: "Transaction not found."
                });

            }


            res.json({
                message:
                    "Transaction deleted successfully."
            });


        } catch (error) {

            console.error(
                "Delete transaction error:",
                error.message
            );

            res.status(500).json({
                error: "Failed to delete transaction."
            });
        }
    }
);


// =========================
// BUSINESS SUMMARY
// =========================

app.get("/api/summary", async (req, res) => {

    try {

        const result = await db.query(
            `
            SELECT

                COALESCE(
                    SUM(
                        CASE
                            WHEN type = 'income'
                            THEN amount
                            ELSE 0
                        END
                    ),
                    0
                ) AS income,


                COALESCE(
                    SUM(
                        CASE
                            WHEN type = 'expense'
                            THEN amount
                            ELSE 0
                        END
                    ),
                    0
                ) AS expenses

            FROM transactions
            `
        );


        const income =
            Number(result.rows[0].income);


        const expenses =
            Number(result.rows[0].expenses);


        const profit =
            income - expenses;


        let profitMargin = 0;


        if (income > 0) {

            profitMargin =
                (profit / income) * 100;

        }


        res.json({

            income,
            expenses,
            profit,
            profitMargin

        });


    } catch (error) {

        console.error(
            "Summary error:",
            error.message
        );

        res.status(500).json({
            error: "Failed to calculate summary."
        });
    }
});


// =========================
// WEEKLY ANALYTICS
// =========================

app.get(
    "/api/analytics/weekly",
    async (req, res) => {

        try {

            const result = await db.query(
                `
                SELECT

                    date,


                    COALESCE(
                        SUM(
                            CASE
                                WHEN type = 'income'
                                THEN amount
                                ELSE 0
                            END
                        ),
                        0
                    ) AS income,


                    COALESCE(
                        SUM(
                            CASE
                                WHEN type = 'expense'
                                THEN amount
                                ELSE 0
                            END
                        ),
                        0
                    ) AS expenses

                FROM transactions

                WHERE date >=
                    TO_CHAR(
                        CURRENT_DATE - INTERVAL '6 days',
                        'YYYY-MM-DD'
                    )

                GROUP BY date

                ORDER BY date ASC
                `
            );


            const analytics =
                result.rows.map((row) => {

                    const income =
                        Number(row.income);


                    const expenses =
                        Number(row.expenses);


                    const profit =
                        income - expenses;


                    return {

                        date: row.date,

                        income,

                        expenses,

                        profit

                    };

                });


            res.json(analytics);


        } catch (error) {

            console.error(
                "Weekly analytics error:",
                error.message
            );

            res.status(500).json({
                error:
                    "Failed to calculate weekly analytics."
            });
        }
    }
);


// =========================
// START SERVER
// =========================

app.listen(
    PORT,
    "0.0.0.0",
    () => {

        console.log(
            `Server is running on port ${PORT}`
        );

    }
);