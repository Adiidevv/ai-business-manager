// =========================
// BUSINESS ID
// =========================

let businessId = localStorage.getItem("businessId");


// =========================
// PAGE ELEMENTS
// =========================

const setupPage =
    document.getElementById("setupPage");

const dashboardPage =
    document.getElementById("dashboardPage");

const nextButton =
    document.getElementById("nextButton");


// =========================
// SHOW SETUP PAGE
// =========================

function showSetupPage() {

    setupPage.style.display = "block";

    dashboardPage.style.display = "none";

}


// =========================
// SHOW DASHBOARD
// =========================

function showDashboardPage() {

    setupPage.style.display = "none";

    dashboardPage.style.display = "block";

}


// =========================
// CHECK BUSINESS
// =========================

async function checkBusiness() {

    // No business stored in this browser
    if (!businessId) {

        showSetupPage();

        return;

    }


    try {

        const response =
            await fetch(
                `/api/business/${businessId}`
            );


        // Business doesn't exist
        if (!response.ok) {

            localStorage.removeItem(
                "businessId"
            );

            businessId = null;

            showSetupPage();

            return;

        }


        const business =
            await response.json();


        displayBusiness(business);

        showDashboardPage();

        loadDashboard();


    } catch (error) {

        console.error(
            "Business check error:",
            error
        );

        showSetupPage();

    }

}


// =========================
// CREATE BUSINESS
// =========================

if (nextButton) {

    nextButton.addEventListener(
        "click",
        async function () {

            const companyName =
                document.getElementById(
                    "companyName"
                ).value.trim();


            const businessType =
                document.getElementById(
                    "businessType"
                ).value;


            const ownerName =
                document.getElementById(
                    "ownerName"
                ).value.trim();


            if (!companyName) {

                alert(
                    "Please enter your company name."
                );

                return;

            }


            if (!businessType) {

                alert(
                    "Please select your business type."
                );

                return;

            }


            if (!ownerName) {

                alert(
                    "Please enter the manager / owner name."
                );

                return;

            }


            try {

                nextButton.disabled = true;

                nextButton.textContent =
                    "Creating...";


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

                    alert(
                        data.error ||
                        "Failed to create business."
                    );

                    nextButton.disabled = false;

                    nextButton.textContent =
                        "Next →";

                    return;

                }


                // Save the unique business ID
                localStorage.setItem(
                    "businessId",
                    data.businessId
                );


                businessId =
                    data.businessId;


                displayBusiness(data);

                showDashboardPage();

                loadDashboard();


            } catch (error) {

                console.error(
                    "Business creation error:",
                    error
                );

                alert(
                    "Something went wrong. Please try again."
                );

            }


            nextButton.disabled = false;

            nextButton.textContent =
                "Next →";

        }
    );

}


// =========================
// DISPLAY BUSINESS
// =========================

function displayBusiness(business) {

    const companyNameElement =
        document.getElementById(
            "businessName"
        );


    const welcomeElement =
        document.getElementById(
            "welcomeMessage"
        );


    if (companyNameElement) {

        companyNameElement.textContent =
            business.companyName;

    }


    if (welcomeElement) {

        welcomeElement.textContent =
            `Welcome, ${business.ownerName}. Manage your business simply.`;

    }

}


// =========================
// LOAD DASHBOARD
// =========================

async function loadDashboard() {

    if (!businessId) {

        showSetupPage();

        return;

    }


    await loadSummary();

    await loadTransactions();

    await loadAnalytics();

    await generateAdvice();

}


// =========================
// LOAD SUMMARY
// =========================

async function loadSummary() {

    try {

        const response =
            await fetch(
                `/api/summary/${businessId}`
            );


        const data =
            await response.json();


        document.getElementById(
            "totalIncome"
        ).textContent =
            `₹${Number(data.income).toFixed(2)}`;


        document.getElementById(
            "totalExpenses"
        ).textContent =
            `₹${Number(data.expenses).toFixed(2)}`;


        document.getElementById(
            "totalProfit"
        ).textContent =
            `₹${Number(data.profit).toFixed(2)}`;


        document.getElementById(
            "profitMargin"
        ).textContent =
            `${Number(data.profitMargin).toFixed(1)}%`;


    } catch (error) {

        console.error(
            "Summary loading error:",
            error
        );

    }

}


// =========================
// LOAD TRANSACTIONS
// =========================

async function loadTransactions() {

    try {

        const response =
            await fetch(
                `/api/transactions/${businessId}`
            );


        const transactions =
            await response.json();


        const container =
            document.getElementById(
                "transactionsList"
            );


        if (!container) {

            return;

        }


        if (
            !transactions ||
            transactions.length === 0
        ) {

            container.innerHTML = `
                <p class="empty-message">
                    No transactions yet.
                </p>
            `;

            return;

        }


        container.innerHTML =
            transactions.map(
                transaction => {

                    const amount =
                        Number(
                            transaction.amount
                        ).toFixed(2);


                    const type =
                        transaction.type;


                    const sign =
                        type === "income"
                            ? "+"
                            : "-";


                    return `

                        <div class="transaction-item">

                            <div>
                                ${type}
                            </div>

                            <div>
                                ${transaction.category}
                            </div>

                            <div class="${type}">
                                ${sign}₹${amount}
                            </div>

                            <div>
                                ${transaction.date}
                            </div>

                            <div>

                                <button
                                    onclick="deleteTransaction(${transaction.id})"
                                >
                                    Delete
                                </button>

                            </div>

                        </div>

                    `;

                }
            ).join("");


    } catch (error) {

        console.error(
            "Transaction loading error:",
            error
        );

    }

}


// =========================
// ADD TRANSACTION
// =========================

const transactionForm =
    document.getElementById(
        "transactionForm"
    );


if (transactionForm) {

    transactionForm.addEventListener(
        "submit",
        async function (event) {

            event.preventDefault();


            if (!businessId) {

                alert(
                    "Business not found."
                );

                return;

            }


            const type =
                document.getElementById(
                    "transactionType"
                ).value;


            const category =
                document.getElementById(
                    "transactionCategory"
                ).value.trim();


            const amount =
                document.getElementById(
                    "transactionAmount"
                ).value;


            const description =
                document.getElementById(
                    "transactionDescription"
                ).value.trim();


            const date =
                document.getElementById(
                    "transactionDate"
                ).value;


            if (
                !category ||
                !amount ||
                !date
            ) {

                alert(
                    "Please fill in all required fields."
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

                                businessId,

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


                loadDashboard();


            } catch (error) {

                console.error(
                    "Transaction error:",
                    error
                );

                alert(
                    "Something went wrong."
                );

            }

        }
    );

}


// =========================
// DELETE TRANSACTION
// =========================

async function deleteTransaction(
    transactionId
) {

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
                `/api/transactions/${transactionId}`,
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


        loadDashboard();


    } catch (error) {

        console.error(
            "Delete error:",
            error
        );

    }

}


// =========================
// WEEKLY ANALYTICS
// =========================

let weeklyChart = null;


async function loadAnalytics() {

    try {

        const response =
            await fetch(
                `/api/analytics/weekly/${businessId}`
            );


        const data =
            await response.json();


        const canvas =
            document.getElementById(
                "weeklyChart"
            );


        if (!canvas) {

            return;

        }


        const labels =
            data.map(
                item => item.date
            );


        const profits =
            data.map(
                item => item.profit
            );


        if (weeklyChart) {

            weeklyChart.destroy();

        }


        weeklyChart =
            new Chart(
                canvas,
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
                                    0.3,

                                fill:
                                    false

                            }

                        ]

                    },

                    options: {

                        responsive: true,

                        maintainAspectRatio:
                            false

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


// =========================
// BUSINESS ADVICE
// =========================

async function generateAdvice() {

    try {

        const response =
            await fetch(
                `/api/summary/${businessId}`
            );


        const data =
            await response.json();


        const adviceElement =
            document.getElementById(
                "aiAdvice"
            );


        if (!adviceElement) {

            return;

        }


        const income =
            Number(data.income);


        const expenses =
            Number(data.expenses);


        const profit =
            Number(data.profit);


        const margin =
            Number(data.profitMargin);


        let advice = "";


        if (
            income === 0 &&
            expenses === 0
        ) {

            advice =
                "Start adding your daily income and expenses to receive business advice.";

        }

        else if (profit < 0) {

            advice =
                "Your business is currently spending more than it earns. Review your major expenses and look for areas where costs can be reduced.";

        }

        else if (margin < 10) {

            advice =
                "Your profit margin is currently below 10%. Keep an eye on expenses and look for ways to improve your revenue or reduce unnecessary costs.";

        }

        else if (margin < 25) {

            advice =
                "Your business is generating a positive profit. Continue monitoring your expenses and look for opportunities to improve your profit margin.";

        }

        else {

            advice =
                "Your current profit margin is strong. Keep monitoring your daily income and expenses so you can maintain this performance.";

        }


        adviceElement.textContent =
            advice;


    } catch (error) {

        console.error(
            "Advice error:",
            error
        );

    }

}


// =========================
// START APPLICATION
// =========================

checkBusiness();