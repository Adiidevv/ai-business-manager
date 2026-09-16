const setupPage =
    document.getElementById("setupPage");

const dashboardPage =
    document.getElementById("dashboardPage");


/* ============================= */
/* BUSINESS SETUP */
/* ============================= */

const companyNameInput =
    document.getElementById("companyName");

const businessTypeInput =
    document.getElementById("businessType");

const ownerNameInput =
    document.getElementById("ownerName");

const nextButton =
    document.getElementById("nextButton");

const setupMessage =
    document.getElementById("setupMessage");

const businessName =
    document.getElementById("businessName");

const welcomeMessage =
    document.getElementById("welcomeMessage");


/* ============================= */
/* DASHBOARD */
/* ============================= */

const totalIncome =
    document.getElementById("totalIncome");

const totalExpenses =
    document.getElementById("totalExpenses");

const totalProfit =
    document.getElementById("totalProfit");

const profitMargin =
    document.getElementById("profitMargin");


/* ============================= */
/* TRANSACTIONS */
/* ============================= */

const transactionForm =
    document.getElementById("transactionForm");

const transactionType =
    document.getElementById("transactionType");

const transactionCategory =
    document.getElementById("transactionCategory");

const transactionAmount =
    document.getElementById("transactionAmount");

const transactionDescription =
    document.getElementById("transactionDescription");

const transactionDate =
    document.getElementById("transactionDate");

const transactionsList =
    document.getElementById("transactionsList");


/* ============================= */
/* AI */
/* ============================= */

const aiAdvice =
    document.getElementById("aiAdvice");


let weeklyChart = null;


/* ============================= */
/* HELPERS */
/* ============================= */

function formatCurrency(amount) {

    return Number(amount).toLocaleString(
        "en-IN",
        {
            style: "currency",
            currency: "INR",
            minimumFractionDigits: 2
        }
    );
}


function escapeHTML(value) {

    return String(value ?? "")
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}


function setTodayDate() {

    transactionDate.value =
        new Date()
            .toISOString()
            .split("T")[0];
}


/* ============================= */
/* LOAD BUSINESS */
/* ============================= */

async function loadBusiness() {

    try {

        const response =
            await fetch("/api/business");

        const business =
            await response.json();


        if (business.companyName) {

            companyNameInput.value =
                business.companyName;

            businessTypeInput.value =
                business.businessType || "";

            ownerNameInput.value =
                business.ownerName || "";


            showDashboard();

        } else {

            showSetup();

        }

    } catch (error) {

        console.error(
            "Business loading error:",
            error
        );

        setupMessage.textContent =
            "Unable to connect to server.";
    }
}


/* ============================= */
/* SHOW SETUP */
/* ============================= */

function showSetup() {

    setupPage.style.display =
        "flex";

    dashboardPage.style.display =
        "none";
}


/* ============================= */
/* SHOW DASHBOARD */
/* ============================= */

async function showDashboard() {

    setupPage.style.display =
        "none";

    dashboardPage.style.display =
        "block";


    businessName.textContent =
        companyNameInput.value;


    welcomeMessage.textContent =
        `Welcome, ${ownerNameInput.value}. Manage your business simply.`;


    await loadDashboard();
}


/* ============================= */
/* NEXT BUTTON */
/* ============================= */

nextButton.addEventListener(
    "click",
    async () => {

        const companyName =
            companyNameInput.value.trim();

        const businessType =
            businessTypeInput.value.trim();

        const ownerName =
            ownerNameInput.value.trim();


        if (!companyName) {

            setupMessage.textContent =
                "Please enter your company name.";

            return;
        }


        if (!businessType) {

            setupMessage.textContent =
                "Please select your business type.";

            return;
        }


        if (!ownerName) {

            setupMessage.textContent =
                "Please enter your name.";

            return;
        }


        setupMessage.textContent =
            "Saving...";


        try {

            const response =
                await fetch(
                    "/api/business",
                    {
                        method: "POST",

                        headers: {
                            "Content-Type":
                                "application/json"
                        },

                        body: JSON.stringify({
                            companyName,
                            businessType,
                            ownerName
                        })
                    }
                );


            const data =
                await response.json();


            if (!response.ok) {

                setupMessage.textContent =
                    data.error ||
                    "Something went wrong.";

                return;
            }


            setupMessage.textContent =
                "";


            showDashboard();


        } catch (error) {

            console.error(
                "Business save error:",
                error
            );

            setupMessage.textContent =
                "Unable to connect to server.";
        }

    }
);


/* ============================= */
/* ADD TRANSACTION */
/* ============================= */

transactionForm.addEventListener(
    "submit",
    async (event) => {

        event.preventDefault();


        const type =
            transactionType.value;

        const category =
            transactionCategory.value.trim();

        const amount =
            Number(transactionAmount.value);

        const description =
            transactionDescription.value.trim();

        const date =
            transactionDate.value;


        if (
            !type ||
            !category ||
            !amount ||
            !date
        ) {

            alert(
                "Please fill all required fields."
            );

            return;
        }


        try {

            const response =
                await fetch(
                    "/api/transactions",
                    {
                        method: "POST",

                        headers: {
                            "Content-Type":
                                "application/json"
                        },

                        body: JSON.stringify({
                            type,
                            category,
                            amount,
                            description,
                            date
                        })
                    }
                );


            const data =
                await response.json();


            if (!response.ok) {

                alert(
                    data.error ||
                    "Failed to add transaction."
                );

                return;
            }


            transactionForm.reset();

            setTodayDate();


            await loadDashboard();


        } catch (error) {

            console.error(
                "Transaction error:",
                error
            );

            alert(
                "Unable to connect to server."
            );
        }

    }
);


/* ============================= */
/* LOAD DASHBOARD */
/* ============================= */

async function loadDashboard() {

    await loadSummary();

    await loadTransactions();

    await loadWeeklyAnalytics();

    generateBusinessAdvice();
}


/* ============================= */
/* SUMMARY */
/* ============================= */

async function loadSummary() {

    try {

        const response =
            await fetch("/api/summary");

        const data =
            await response.json();


        totalIncome.textContent =
            formatCurrency(data.income);

        totalExpenses.textContent =
            formatCurrency(data.expenses);

        totalProfit.textContent =
            formatCurrency(data.profit);

        profitMargin.textContent =
            Number(data.profitMargin)
                .toFixed(1) + "%";


    } catch (error) {

        console.error(
            "Summary error:",
            error
        );
    }
}


/* ============================= */
/* LOAD TRANSACTIONS */
/* ============================= */

async function loadTransactions() {

    try {

        const response =
            await fetch("/api/transactions");

        const transactions =
            await response.json();


        transactionsList.innerHTML =
            "";


        if (transactions.length === 0) {

            transactionsList.innerHTML =
                `
                <p class="empty-message">
                    No transactions yet.
                </p>
                `;

            return;
        }


        transactions.forEach(
            (transaction) => {

                const row =
                    document.createElement(
                        "div"
                    );


                row.className =
                    "transaction-row";


                const typeClass =
                    transaction.type === "income"
                        ? "income"
                        : "expense";


                const sign =
                    transaction.type === "income"
                        ? "+"
                        : "-";


                row.innerHTML = `
                    <span class="${typeClass}">
                        ${escapeHTML(transaction.type)}
                    </span>

                    <span>
                        ${escapeHTML(transaction.category)}
                    </span>

                    <span class="${typeClass}">
                        ${sign}${formatCurrency(transaction.amount)}
                    </span>

                    <span>
                        ${escapeHTML(transaction.date)}
                    </span>

                    <span>
                        <button
                            class="delete-button"
                            data-id="${transaction.id}"
                        >
                            Delete
                        </button>
                    </span>
                `;


                const deleteButton =
                    row.querySelector(
                        ".delete-button"
                    );


                deleteButton.addEventListener(
                    "click",
                    () => {
                        deleteTransaction(
                            transaction.id
                        );
                    }
                );


                transactionsList.appendChild(
                    row
                );

            }
        );


    } catch (error) {

        console.error(
            "Transaction loading error:",
            error
        );
    }
}


/* ============================= */
/* DELETE TRANSACTION */
/* ============================= */

async function deleteTransaction(id) {

    const confirmed =
        confirm(
            "Are you sure you want to delete this transaction?"
        );


    if (!confirmed) {
        return;
    }


    try {

        const response =
            await fetch(
                `/api/transactions/${id}`,
                {
                    method: "DELETE"
                }
            );


        const data =
            await response.json();


        if (!response.ok) {

            alert(
                data.error ||
                "Failed to delete transaction."
            );

            return;
        }


        await loadDashboard();


    } catch (error) {

        console.error(
            "Delete error:",
            error
        );

        alert(
            "Unable to connect to server."
        );
    }
}


/* ============================= */
/* WEEKLY ANALYTICS */
/* ============================= */

async function loadWeeklyAnalytics() {

    try {

        const response =
            await fetch(
                "/api/analytics/weekly"
            );


        const data =
            await response.json();


        const labels =
            data.map(
                (item) => item.date
            );


        const profits =
            data.map(
                (item) => item.profit
            );


        const canvas =
            document.getElementById(
                "weeklyChart"
            );


        if (
            !canvas ||
            typeof Chart === "undefined"
        ) {
            return;
        }


        const ctx =
            canvas.getContext("2d");


        if (weeklyChart) {

            weeklyChart.destroy();

        }


        weeklyChart =
            new Chart(
                ctx,
                {
                    type: "line",

                    data: {

                        labels,

                        datasets: [
                            {
                                label:
                                    "Daily Profit",

                                data:
                                    profits,

                                tension:
                                    0.3
                            }
                        ]
                    },


                    options: {

                        responsive: true,

                        maintainAspectRatio:
                            false,


                        scales: {

                            y: {
                                beginAtZero:
                                    true
                            }

                        }

                    }

                }
            );


    } catch (error) {

        console.error(
            "Analytics error:",
            error
        );
    }
}


/* ============================= */
/* AI BUSINESS ADVICE */
/* ============================= */

function generateBusinessAdvice() {

    const income =
        Number(
            totalIncome.textContent
                .replace(/[^0-9.-]+/g, "")
        );


    const expenses =
        Number(
            totalExpenses.textContent
                .replace(/[^0-9.-]+/g, "")
        );


    const profit =
        Number(
            totalProfit.textContent
                .replace(/[^0-9.-]+/g, "")
        );


    if (
        income === 0 &&
        expenses === 0
    ) {

        aiAdvice.textContent =
            "Add some business transactions to receive advice.";

        return;
    }


    const margin =
        income > 0
            ? (profit / income) * 100
            : 0;


    let advice = "";


    if (profit < 0) {

        advice +=
            "⚠️ Your business is currently making a loss. Review your largest expenses and look for areas where costs can be reduced.\n\n";

    } else if (margin < 10) {

        advice +=
            "⚠️ Your profit margin is quite low. Try to reduce unnecessary expenses or improve your pricing.\n\n";

    } else if (margin < 25) {

        advice +=
            "💡 Your business is profitable, but there may be room to improve your profit margin. Watch your major expenses carefully.\n\n";

    } else {

        advice +=
            "✅ Your business is showing a healthy profit margin. Keep monitoring expenses and maintain your current performance.\n\n";
    }


    if (expenses > income * 0.6) {

        advice +=
            "📉 Expenses are taking a large share of your income. Review recurring costs, supplier prices and other major expenses.\n\n";
    }


    if (income > 0) {

        advice +=
            `📊 Current profit margin: ${margin.toFixed(1)}%.`;
    }


    aiAdvice.textContent =
        advice;
}


/* ============================= */
/* START APP */
/* ============================= */

setTodayDate();

loadBusiness();