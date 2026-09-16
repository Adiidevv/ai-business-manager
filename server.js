const express = require("express");
const db = require("./database");

const app = express();

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


        // Always create a new business
        const result = await db.query(
            `
            INSERT INTO business
            (
                company_name,
                business_type,
                owner_name
            )
            VALUES ($1, $2, $3)
            RETURNING id
            `,
            [
                cleanCompanyName,
                cleanBusinessType,
                cleanOwnerName
            ]
        );


        const businessId = result.rows[0].id;


        res.json({

            message: "Business created successfully.",

            businessId,

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
// GET BUSINESS BY ID
// =========================

app.get("/api/business/:id", async (req, res) => {

    try {

        const businessId = req.params.id;


        const result = await db.query(
            `
            SELECT
                id,
                company_name,
                business_type,
                owner_name
            FROM business
            WHERE id = $1
            `,
            [businessId]
        );


        if (result.rows.length === 0) {

            return res.status(404).json({
                error: "Business not found."
            });

        }


        const row = result.rows[0];


        res.json({

            businessId: row.id,

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
            businessId,
            type,
            category,
            amount,
            description,
            date
        } = req.body;


        if (
            !businessId ||
            !type ||
            !category ||
            !amount ||
            !date
        ) {

            return res.status(400).json({
                error:
                    "Business ID, type, category, amount and date are required."
            });

        }


        const result = await db.query(
            `
            INSERT INTO transactions
            (
                business_id,
                type,
                category,
                amount,
                description,
                date
            )
            VALUES ($1, $2, $3, $4, $5, $6)
            RETURNING id
            `,
            [
                businessId,
                type,
                category,
                amount,
                description || "",
                date
            ]
        );


        res.json({

            message:
                "Transaction added successfully.",

            transactionId:
                result.rows[0].id

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
// GET TRANSACTIONS
// =========================

app.get("/api/transactions/:businessId", async (req, res) => {

    try {

        const businessId = req.params.businessId;


        const result = await db.query(
            `
            SELECT *
            FROM transactions
            WHERE business_id = $1
            ORDER BY id DESC
            `,
            [businessId]
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

app.get("/api/summary/:businessId", async (req, res) => {

    try {

        const businessId = req.params.businessId;


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

            WHERE business_id = $1
            `,
            [businessId]
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
    "/api/analytics/weekly/:businessId",
    async (req, res) => {

        try {

            const businessId =
                req.params.businessId;


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

                WHERE business_id = $1

                AND date >=
                    TO_CHAR(
                        CURRENT_DATE - INTERVAL '6 days',
                        'YYYY-MM-DD'
                    )

                GROUP BY date

                ORDER BY date ASC
                `,
                [businessId]
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