// =========================
// BUSINESS ID
// =========================

let businessId =
    localStorage.getItem("businessId");


// =========================
// SUMMARY VIEW
// =========================

let summaryView = "total";


// =========================
// PAGE ELEMENTS
// =========================

const setupPage =
    document.getElementById("setupPage");

const dashboardPage =
    document.getElementById("dashboardPage");

const nextButton =
    document.getElementById("nextButton");

const totalViewButton =
    document.getElementById("totalViewButton");

const todayViewButton =
    document.getElementById("todayViewButton");


// =========================
// SHOW SETUP PAGE
// =========================

function showSetupPage() {

    setupPage.style.display = "flex";

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

        await loadDashboard();

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


            // =========================
            // VALIDATION
            // =========================

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


            // =========================
            // CREATE BUSINESS
            // =========================

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


                // =========================
                // SAVE BUSINESS ID
                // =========================

                localStorage.setItem(
                    "businessId",
                    data.businessId
                );

                businessId =
                    data.businessId;


                // =========================
                // DISPLAY BUSINESS
                // =========================

                displayBusiness(data);


                // =========================
                // OPEN DASHBOARD
                // =========================

                showDashboardPage();

                await loadDashboard();


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


        if (!response.ok) {

            console.error(
                "Failed to load summary."
            );

            return;

        }


        const data =
            await response.json();


        renderSummary(data);


    } catch (error) {

        console.error(
            "Summary loading error:",
            error
        );

    }

}


// =========================
// RENDER SUMMARY
// =========================

function renderSummary(data) {

    const incomeLabel =
        document.getElementById(
            "incomeLabel"
        );

    const expensesLabel =
        document.getElementById(
            "expensesLabel"
        );

    const profitLabel =
        document.getElementById(
            "profitLabel"
        );

    const marginLabel =
        document.getElementById(
            "marginLabel"
        );


    const totalIncomeElement =
        document.getElementById(
            "totalIncome"
        );

    const totalExpensesElement =
        document.getElementById(
            "totalExpenses"
        );

    const totalProfitElement =
        document.getElementById(
            "totalProfit"
        );

    const profitMarginElement =
        document.getElementById(
            "profitMargin"
        );


    let income;
    let expenses;
    let profit;
    let profitMargin;


    // =========================
    // TOTAL VIEW
    // =========================

    if (summaryView === "total") {

        income =
            Number(data.income) || 0;

        expenses =
            Number(data.expenses) || 0;

        profit =
            Number(data.profit) || 0;

        profitMargin =
            Number(data.profitMargin) || 0;


        if (incomeLabel) {

            incomeLabel.textContent =
                "Total Income";

        }

        if (expensesLabel) {

            expensesLabel.textContent =
                "Total Expenses";

        }

        if (profitLabel) {

            profitLabel.textContent =
                "Total Profit";

        }

        if (marginLabel) {

            marginLabel.textContent =
                "Total Profit Margin";

        }

    }


    // =========================
    // TODAY VIEW
    // =========================

    else {

        income =
            Number(data.todayIncome) || 0;

        expenses =
            Number(data.todayExpenses) || 0;

        profit =
            Number(data.todayProfit) || 0;

        profitMargin =
            Number(data.todayProfitMargin) || 0;


        if (incomeLabel) {

            incomeLabel.textContent =
                "Today's Income";

        }

        if (expensesLabel) {

            expensesLabel.textContent =
                "Today's Expenses";

        }

        if (profitLabel) {

            profitLabel.textContent =
                "Today's Profit";

        }

        if (marginLabel) {

            marginLabel.textContent =
                "Today's Profit Margin";

        }

    }


    // =========================
    // DISPLAY VALUES
    // =========================

    if (totalIncomeElement) {

        totalIncomeElement.textContent =
            `₹${income.toFixed(2)}`;

    }


    if (totalExpensesElement) {

        totalExpensesElement.textContent =
            `₹${expenses.toFixed(2)}`;

    }


    if (totalProfitElement) {

        totalProfitElement.textContent =
            `₹${profit.toFixed(2)}`;

    }


    if (profitMarginElement) {

        profitMarginElement.textContent =
            `${profitMargin.toFixed(1)}%`;

    }

}


// =========================
// TOTAL / TODAY BUTTONS
// =========================

if (totalViewButton) {

    totalViewButton.addEventListener(
        "click",
        async function () {

            summaryView = "total";


            totalViewButton.classList.add(
                "active"
            );

            todayViewButton.classList.remove(
                "active"
            );


            await loadSummary();

        }
    );

}


if (todayViewButton) {

    todayViewButton.addEventListener(
        "click",
        async function () {

            summaryView = "today";


            todayViewButton.classList.add(
                "active"
            );

            totalViewButton.classList.remove(
                "active"
            );


            await loadSummary();

        }
    );

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


        if (!response.ok) {

            console.error(
                "Failed to load transactions."
            );

            return;

        }


        const transactions =
            await response.json();


        const container =
            document.getElementById(
                "transactionsList"
            );


        if (!container) {

            return;

        }


        // Clear previous transactions

        container.innerHTML = "";


        // =========================
        // NO TRANSACTIONS
        // =========================

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


        // =========================
        // CREATE TRANSACTION ROWS
        // =========================

        transactions.forEach(
            transaction => {

                const row =
                    document.createElement(
                        "div"
                    );


                row.className =
                    "transaction-item";


                const typeElement =
                    document.createElement(
                        "div"
                    );

                const categoryElement =
                    document.createElement(
                        "div"
                    );

                const amountElement =
                    document.createElement(
                        "div"
                    );

                const dateElement =
                    document.createElement(
                        "div"
                    );

                const actionElement =
                    document.createElement(
                        "div"
                    );


                // =========================
                // TYPE
                // =========================

                typeElement.textContent =
                    transaction.type;


                typeElement.classList.add(
                    transaction.type
                );


                // =========================
                // CATEGORY
                // =========================

                categoryElement.textContent =
                    transaction.category;


                // =========================
                // AMOUNT
                // =========================

                const amount =
                    Number(
                        transaction.amount
                    ) || 0;


                const sign =
                    transaction.type === "income"
                        ? "+"
                        : "-";


                amountElement.textContent =
                    `${sign}₹${amount.toFixed(2)}`;


                amountElement.classList.add(
                    transaction.type
                );


                // =========================
                // DATE
                // =========================

                dateElement.textContent =
                    transaction.date;


                // =========================
                // DELETE BUTTON
                // =========================

                const deleteButton =
                    document.createElement(
                        "button"
                    );


                deleteButton.textContent =
                    "Delete";


                deleteButton.className =
                    "delete-button";


                deleteButton.addEventListener(
                    "click",
                    function () {

                        deleteTransaction(
                            transaction.id
                        );

                    }
                );


                actionElement.appendChild(
                    deleteButton
                );


                // =========================
                // ADD ALL COLUMNS
                // =========================

                row.appendChild(
                    typeElement
                );

                row.appendChild(
                    categoryElement
                );

                row.appendChild(
                    amountElement
                );

                row.appendChild(
                    dateElement
                );

                row.appendChild(
                    actionElement
                );


                container.appendChild(
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


            // =========================
            // CHECK BUSINESS
            // =========================

            if (!businessId) {

                alert(
                    "Business not found."
                );

                return;

            }


            // =========================
            // GET FORM VALUES
            // =========================

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


            // =========================
            // VALIDATION
            // =========================

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


            if (
                Number(amount) <= 0
            ) {

                alert(
                    "Amount must be greater than zero."
                );

                return;

            }


            // =========================
            // SAVE TRANSACTION
            // =========================

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

                                businessId:
                                    businessId,

                                type:
                                    type,

                                category:
                                    category,

                                amount:
                                    amount,

                                description:
                                    description,

                                date:
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


                // =========================
                // RESET FORM
                // =========================

                transactionForm.reset();


                // =========================
                // RELOAD DASHBOARD
                // =========================

                await loadDashboard();


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


        // Reload dashboard

        await loadDashboard();


    } catch (error) {

        console.error(
            "Delete error:",
            error
        );

        alert(
            "Something went wrong while deleting the transaction."
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


        if (!response.ok) {

            console.error(
                "Failed to load analytics."
            );

            return;

        }


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
                item =>
                    Number(item.profit) || 0
            );


        // =========================
        // DESTROY OLD CHART
        // =========================

        if (weeklyChart) {

            weeklyChart.destroy();

            weeklyChart = null;

        }


        // =========================
        // CREATE CHART
        // =========================

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

                        responsive:
                            true,

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


        if (!response.ok) {

            return;

        }


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
            Number(data.income) || 0;


        const expenses =
            Number(data.expenses) || 0;


        const profit =
            Number(data.profit) || 0;


        const margin =
            Number(data.profitMargin) || 0;


        let advice = "";


        // =========================
        // NO DATA
        // =========================

        if (
            income === 0 &&
            expenses === 0
        ) {

            advice =
                "Start adding your daily income and expenses to receive business advice.";

        }


        // =========================
        // LOSS
        // =========================

        else if (
            profit < 0
        ) {

            advice =
                "Your business is currently spending more than it earns. Review your major expenses and look for areas where costs can be reduced.";

        }


        // =========================
        // LOW MARGIN
        // =========================

        else if (
            margin < 10
        ) {

            advice =
                "Your profit margin is currently below 10%. Keep an eye on expenses and look for ways to improve your revenue or reduce unnecessary costs.";

        }


        // =========================
        // MEDIUM MARGIN
        // =========================

        else if (
            margin < 25
        ) {

            advice =
                "Your business is generating a positive profit. Continue monitoring your expenses and look for opportunities to improve your profit margin.";

        }


        // =========================
        // HIGHER MARGIN
        // =========================

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