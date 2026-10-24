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

const authPage =
    document.getElementById("authPage");

const authMessage =
    document.getElementById("authMessage");

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

function showAuthPage() {
    if (authPage) authPage.style.display = "flex";
    setupPage.style.display = "none";
    dashboardPage.style.display = "none";
}

function showSetupPage() {

    if (authPage) authPage.style.display = "none";

    setupPage.style.display = "flex";

    dashboardPage.style.display = "none";

}


// =========================
// SHOW DASHBOARD
// =========================

function showDashboardPage() {

    if (authPage) authPage.style.display = "none";

    setupPage.style.display = "none";

    dashboardPage.style.display = "block";

}


// =========================
// CHECK BUSINESS
// =========================

async function checkBusiness() {

    // Verify the server-side login before loading any business data.
    try {
        const authResponse = await fetch("/api/auth/me");
        if (!authResponse.ok) {
            showAuthPage();
            return;
        }
    } catch (error) {
        console.error("Authentication check error:", error);
        showAuthPage();
        return;
    }

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

    await loadBusinessIntelligence();

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
// ACCOUNT REGISTRATION / LOGIN
// =========================

const loginForm = document.getElementById("loginForm");
const registerForm = document.getElementById("registerForm");
const showLoginButton = document.getElementById("showLoginButton");
const showRegisterButton = document.getElementById("showRegisterButton");
const loginPanel = document.getElementById("loginPanel");
const registerPanel = document.getElementById("registerPanel");
const logoutButton = document.getElementById("logoutButton");

function setAuthMode(mode) {
    if (!loginPanel || !registerPanel) return;
    loginPanel.style.display = mode === "login" ? "block" : "none";
    registerPanel.style.display = mode === "register" ? "block" : "none";
    if (authMessage) authMessage.textContent = "";
}

if (showLoginButton) showLoginButton.addEventListener("click", () => setAuthMode("login"));
if (showRegisterButton) showRegisterButton.addEventListener("click", () => setAuthMode("register"));

async function submitAuthForm(form, endpoint) {
    if (!form) return;
    form.addEventListener("submit", async (event) => {
        event.preventDefault();
        const submitButton = form.querySelector('button[type="submit"]');
        const formData = new FormData(form);
        const payload = Object.fromEntries(formData.entries());
        if (authMessage) authMessage.textContent = "";
        if (submitButton) {
            submitButton.disabled = true;
            submitButton.textContent = endpoint.endsWith("register") ? "Creating account..." : "Signing in...";
        }
        try {
            const response = await fetch(endpoint, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload)
            });
            const data = await response.json();
            if (!response.ok) {
                if (authMessage) authMessage.textContent = data.error || "Unable to continue.";
                return;
            }
            // The session is stored in an HttpOnly cookie, not localStorage.
            if (endpoint.endsWith("register")) {
                form.reset();
            }
            await checkBusiness();
        } catch (error) {
            console.error("Authentication request error:", error);
            if (authMessage) authMessage.textContent = "Connection problem. Please try again.";
        } finally {
            if (submitButton) {
                submitButton.disabled = false;
                submitButton.textContent = endpoint.endsWith("register") ? "Create account" : "Sign in";
            }
        }
    });
}

submitAuthForm(loginForm, "/api/auth/login");
submitAuthForm(registerForm, "/api/auth/register");

if (logoutButton) {
    logoutButton.addEventListener("click", async () => {
        try {
            await fetch("/api/auth/logout", { method: "POST" });
        } finally {
            localStorage.removeItem("businessId");
            businessId = null;
            showAuthPage();
            setAuthMode("login");
        }
    });
}

// =========================
// START APPLICATION
// =========================

checkBusiness();

// =========================
// PREMIUM BUSINESS INTELLIGENCE
// Uses existing transaction API; no database/server changes.
// =========================
let biMonthlyChart = null;
let biCategoryChart = null;
let biTransactions = [];

function biMoney(value) {
    return new Intl.NumberFormat("en-IN", {
        style: "currency", currency: "INR", maximumFractionDigits: 0
    }).format(Number(value) || 0);
}

function biDate(value) {
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? null : date;
}

async function loadBusinessIntelligence() {
    const dashboard = document.getElementById("dashboardPage");
    const weeklyCanvas = document.getElementById("weeklyChart");
    if (!dashboard || !weeklyCanvas) return;

    let section = document.getElementById("businessIntelligence");
    if (!section) {
        section = document.createElement("section");
        section.id = "businessIntelligence";
        section.className = "content-section bi-section";
        section.innerHTML = `
          <div class="section-title bi-section-heading">
            <div><span class="bi-eyebrow">BUSINESS INTELLIGENCE</span><h2>Performance overview</h2>
            <p>Understand trends and spending patterns from your recorded transactions.</p></div>
            <button type="button" class="bi-refresh" id="biRefreshButton">Refresh insights ↻</button>
          </div>
          <div class="bi-report-toolbar bi-panel">
            <div><strong>Financial report</strong><p>Choose a date range to export transactions as CSV or print/save a report as PDF.</p></div>
            <div class="bi-report-controls"><label>From <input type="date" id="biReportStart"></label><label>To <input type="date" id="biReportEnd"></label><button type="button" class="bi-action-button" id="biExportCsv">Export CSV</button><button type="button" class="bi-action-button bi-action-primary" id="biPrintReport">Print / Save PDF</button></div>
            <p id="biReportStatus" class="bi-report-status" aria-live="polite"></p>
          </div>
          <div class="bi-metric-grid">
            <article class="bi-metric"><span>Current month revenue</span><strong id="biRevenue">₹0</strong><small id="biRevenueNote">Income recorded this month</small></article>
            <article class="bi-metric"><span>Current month expenses</span><strong id="biExpenses">₹0</strong><small>Expenses recorded this month</small></article>
            <article class="bi-metric"><span>Current month net</span><strong id="biNet">₹0</strong><small id="biNetNote">Revenue minus expenses</small></article>
            <article class="bi-metric"><span>Break-even progress</span><strong id="biBreakEven">—</strong><small id="biBreakEvenNote">Revenue compared with expenses</small></article>
          </div>
          <article class="bi-panel bi-comparison-panel"><div class="bi-panel-heading"><div><h3>Month-over-month comparison</h3><p>Current calendar month compared with the previous month</p></div><span class="bi-chart-tag">CHANGE</span></div><div class="bi-comparison-grid"><div><span>Revenue change</span><strong id="biRevenueChange">—</strong><small id="biRevenueCompareNote">Compared with last month</small></div><div><span>Expense change</span><strong id="biExpenseChange">—</strong><small id="biExpenseCompareNote">Compared with last month</small></div><div><span>Net result change</span><strong id="biNetChange">—</strong><small id="biNetCompareNote">Compared with last month</small></div></div></article>
          <div class="bi-chart-grid">
            <article class="bi-panel"><div class="bi-panel-heading"><div><h3>Six-month trend</h3><p>Revenue, expenses and net result</p></div><span class="bi-chart-tag">MONTHLY</span></div><div class="bi-chart-wrap"><canvas id="biMonthlyChart"></canvas></div></article>
            <article class="bi-panel"><div class="bi-panel-heading"><div><h3>Expense breakdown</h3><p>Where recorded spending goes</p></div><span class="bi-chart-tag">CATEGORIES</span></div><div class="bi-chart-wrap bi-donut-wrap"><canvas id="biCategoryChart"></canvas></div><div id="biCategoryLegend" class="bi-category-legend"></div></article>
          </div>
          <article class="bi-panel bi-insights-panel"><div class="bi-panel-heading"><div><h3>Business signals</h3><p>Automatic observations based on your data</p></div><span class="bi-live-dot">● Calculated from your records</span></div><div id="biInsights" class="bi-insight-list"><p>Add transactions to generate insights.</p></div></article>
                    <article class="bi-panel ai-analyst-panel"><div class="bi-panel-heading"><div><span class="bi-eyebrow">SMART ANALYST</span><h3>Ask about your business</h3><p>Answers are calculated from your recorded transactions. No external AI service is connected yet.</p></div><span class="bi-chart-tag">DATA-DRIVEN</span></div><div class="ai-analyst-controls"><input id="aiAnalystQuestion" type="text" maxlength="240" placeholder="e.g. Which expense category costs me the most?" aria-label="Ask a question about your business"><button id="aiAnalystAsk" type="button" class="bi-action-button bi-action-primary">Analyze</button></div><div class="ai-analyst-prompts"><button type="button" data-analyst-question="How much revenue did I record this month?">This month's revenue</button><button type="button" data-analyst-question="Which expense category costs me the most?">Top expense category</button><button type="button" data-analyst-question="How much profit did I make this month?">This month's net result</button><button type="button" data-analyst-question="What was my best revenue month?">Best revenue month</button></div><div id="aiAnalystAnswer" class="ai-analyst-answer" aria-live="polite"><strong>Ready when you are</strong><p>Ask a question or choose one of the suggestions above.</p></div></article>
        `;
        const weeklySection = weeklyCanvas.closest(".content-section");
        dashboard.querySelector("main, .main-content")?.insertBefore(section, weeklySection || null);
        document.getElementById("biRefreshButton")?.addEventListener("click", loadBusinessIntelligence);
        const today = new Date();
        const first = new Date(today.getFullYear(), today.getMonth(), 1);
        const dateValue = d => `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
        const startInput = document.getElementById("biReportStart");
        const endInput = document.getElementById("biReportEnd");
        if (startInput) startInput.value = dateValue(first);
        if (endInput) endInput.value = dateValue(today);
        document.getElementById("biExportCsv")?.addEventListener("click", exportBiCsv);
        document.getElementById("biPrintReport")?.addEventListener("click", printBiReport);
        document.getElementById("aiAnalystAsk")?.addEventListener("click", answerAnalystQuestion);
        document.getElementById("aiAnalystQuestion")?.addEventListener("keydown", event => { if (event.key === "Enter") answerAnalystQuestion(); });
        document.querySelectorAll("[data-analyst-question]").forEach(button => button.addEventListener("click", () => { const input = document.getElementById("aiAnalystQuestion"); if (input) input.value = button.dataset.analystQuestion || ""; answerAnalystQuestion(); }));
    }

    createCustomerCreditPage(dashboard);
    setupWorkspaceNavigation(dashboard);

    const insights = document.getElementById("biInsights");
    try {
        const response = await fetch(`/api/transactions/${businessId}`);
        if (!response.ok) throw new Error("Could not load transactions");
        const raw = await response.json();
        const transactions = (Array.isArray(raw) ? raw : []).map(t => ({
            ...t, amount: Number(t.amount) || 0, dateObj: biDate(t.date),
            type: String(t.type || "").toLowerCase()
        })).filter(t => t.dateObj && (t.type === "income" || t.type === "expense"));
        biTransactions = transactions;

        const now = new Date();
        const thisMonth = transactions.filter(t => t.dateObj.getFullYear() === now.getFullYear() && t.dateObj.getMonth() === now.getMonth());
        const revenue = thisMonth.filter(t => t.type === "income").reduce((s,t) => s+t.amount, 0);
        const expenses = thisMonth.filter(t => t.type === "expense").reduce((s,t) => s+t.amount, 0);
        const net = revenue - expenses;
        const setText = (id, value) => { const el = document.getElementById(id); if (el) el.textContent = value; };
        setText("biRevenue", biMoney(revenue));
        setText("biExpenses", biMoney(expenses));
        setText("biNet", (net < 0 ? "−" : "") + biMoney(Math.abs(net)));
        const netEl = document.getElementById("biNet");
        if (netEl) netEl.classList.toggle("is-negative", net < 0);
        setText("biNetNote", net < 0 ? "Expenses exceed revenue this month" : "Revenue minus expenses this month");
        setText("biBreakEven", expenses === 0 ? (revenue > 0 ? "Above break-even" : "No data yet") : `${Math.round(revenue / expenses * 100)}%`);
        setText("biBreakEvenNote", expenses === 0 ? "Record expenses to calculate this ratio" : revenue >= expenses ? "Revenue covers recorded expenses" : `${biMoney(expenses - revenue)} more revenue needed to cover recorded expenses`);

        const previousStart = new Date(now.getFullYear(), now.getMonth()-1, 1);
        const currentStart = new Date(now.getFullYear(), now.getMonth(), 1);
        const sumPeriod = (start, end, type) => transactions.filter(t => t.type === type && t.dateObj >= start && t.dateObj < end).reduce((sum,t) => sum+t.amount, 0);
        const prevRevenue = sumPeriod(previousStart, currentStart, "income");
        const prevExpenses = sumPeriod(previousStart, currentStart, "expense");
        const prevNet = prevRevenue-prevExpenses;
        const currentEnd = new Date(now.getFullYear(), now.getMonth()+1, 1);
        const currentRevenue = sumPeriod(currentStart, currentEnd, "income");
        const currentExpenses = sumPeriod(currentStart, currentEnd, "expense");
        const currentNet = currentRevenue-currentExpenses;
        const setChange = (id, noteId, current, previous, lowerIsBetter=false) => {
            const el = document.getElementById(id);
            const note = document.getElementById(noteId);
            if (!el || !note) return;
            if (previous === 0) {
                el.textContent = current === 0 ? "No change" : "New activity";
                note.textContent = current === 0 ? "No recorded activity in either period" : `${biMoney(current)} this month; previous month was ₹0`;
                el.classList.toggle("is-positive", current !== 0 && !lowerIsBetter);
                el.classList.remove("is-negative");
                return;
            }
            const change = ((current-previous)/Math.abs(previous))*100;
            el.textContent = `${change > 0 ? "+" : ""}${change.toFixed(1)}%`;
            note.textContent = `${biMoney(current)} vs ${biMoney(previous)} last month`;
            el.classList.toggle("is-positive", lowerIsBetter ? change < 0 : change > 0);
            el.classList.toggle("is-negative", lowerIsBetter ? change > 0 : change < 0);
        };
        setChange("biRevenueChange", "biRevenueCompareNote", currentRevenue, prevRevenue);
        setChange("biExpenseChange", "biExpenseCompareNote", currentExpenses, prevExpenses, true);
        setChange("biNetChange", "biNetCompareNote", currentNet, prevNet);

        const monthStarts = [];
        for (let offset = 5; offset >= 0; offset--) {
            monthStarts.push(new Date(now.getFullYear(), now.getMonth() - offset, 1));
        }
        const monthLabels = monthStarts.map(d => d.toLocaleDateString("en-IN", { month: "short", year: "2-digit" }));
        const monthRevenue = [], monthExpenses = [], monthNet = [];
        monthStarts.forEach((start, i) => {
            const end = new Date(start.getFullYear(), start.getMonth()+1, 1);
            const group = transactions.filter(t => t.dateObj >= start && t.dateObj < end);
            const inc = group.filter(t => t.type === "income").reduce((s,t) => s+t.amount, 0);
            const exp = group.filter(t => t.type === "expense").reduce((s,t) => s+t.amount, 0);
            monthRevenue.push(inc); monthExpenses.push(exp); monthNet.push(inc-exp);
        });

        if (typeof Chart !== "undefined") {
            const monthlyCanvas = document.getElementById("biMonthlyChart");
            if (monthlyCanvas) {
                if (biMonthlyChart) biMonthlyChart.destroy();
                biMonthlyChart = new Chart(monthlyCanvas, {
                    type: "line",
                    data: { labels: monthLabels, datasets: [
                        { label: "Revenue", data: monthRevenue, borderColor: "#4f8cff", backgroundColor: "rgba(79,140,255,.12)", fill: true, tension: .35, borderWidth: 2, pointRadius: 3 },
                        { label: "Expenses", data: monthExpenses, borderColor: "#a78bfa", backgroundColor: "rgba(167,139,250,.08)", fill: false, tension: .35, borderWidth: 2, pointRadius: 3 },
                        { label: "Net", data: monthNet, borderColor: "#42d6a4", backgroundColor: "rgba(66,214,164,.06)", fill: false, tension: .35, borderWidth: 2, pointRadius: 3 }
                    ]},
                    options: { responsive: true, maintainAspectRatio: false, interaction: { mode: "index", intersect: false },
                        plugins: { legend: { labels: { color: "#b6bfd0", usePointStyle: true, boxWidth: 8 } }, tooltip: { callbacks: { label: c => `${c.dataset.label}: ${biMoney(c.raw)}` } } },
                        scales: { x: { ticks: { color: "#8994a8" }, grid: { color: "rgba(146,155,173,.08)" } }, y: { beginAtZero: true, ticks: { color: "#8994a8", callback: v => "₹" + Number(v).toLocaleString("en-IN") }, grid: { color: "rgba(146,155,173,.12)" } } }
                    }
                });
            }
            const categoryCanvas = document.getElementById("biCategoryChart");
            const categoryTotals = {};
            transactions.filter(t => t.type === "expense").forEach(t => {
                const category = String(t.category || "Uncategorized").trim() || "Uncategorized";
                categoryTotals[category] = (categoryTotals[category] || 0) + t.amount;
            });
            const sortedCategories = Object.entries(categoryTotals).sort((a,b) => b[1]-a[1]).slice(0,6);
            const palette = ["#a78bfa","#4f8cff","#42d6a4","#ff9f70","#f472b6","#facc15"];
            if (categoryCanvas) {
                if (biCategoryChart) biCategoryChart.destroy();
                biCategoryChart = new Chart(categoryCanvas, {
                    type: "doughnut",
                    data: { labels: sortedCategories.map(x => x[0]), datasets: [{ data: sortedCategories.map(x => x[1]), backgroundColor: palette, borderColor: "#11141c", borderWidth: 4, hoverOffset: 5 }] },
                    options: { responsive: true, maintainAspectRatio: false, cutout: "68%", plugins: { legend: { display: false }, tooltip: { callbacks: { label: c => `${c.label}: ${biMoney(c.raw)}` } } } }
                });
            }
            const legend = document.getElementById("biCategoryLegend");
            if (legend) legend.innerHTML = sortedCategories.length ? sortedCategories.map((x,i) => `<div class="bi-legend-row"><span class="bi-legend-name"><i style="background:${palette[i]}"></i>${escapeBiText(x[0])}</span><strong>${biMoney(x[1])}</strong></div>`).join("") : '<p class="bi-empty">No expense categories recorded yet.</p>';
        }

        const totalRevenue = transactions.filter(t => t.type === "income").reduce((s,t)=>s+t.amount,0);
        const totalExpenses = transactions.filter(t => t.type === "expense").reduce((s,t)=>s+t.amount,0);
        const largestExpense = transactions.filter(t=>t.type==="expense").sort((a,b)=>b.amount-a.amount)[0];
        const signals = [];
        if (!transactions.length) signals.push(["Start with your first record", "Add income and expenses to unlock trends, category analysis and performance signals."]);
        else {
            if (net < 0) signals.push(["Monthly loss", `Recorded expenses exceed this month's revenue by ${biMoney(Math.abs(net))}. Review discretionary costs and confirm all income has been entered.`]);
            else if (revenue > 0) signals.push(["Positive monthly position", `This month currently shows ${biMoney(net)} net after recorded expenses. Keep tracking both sides for a reliable picture.`]);
            if (totalExpenses > 0 && totalRevenue === 0) signals.push(["Expense-only records", "Expenses exist but no income is recorded. If the business earned revenue, add it to improve the analysis."]);
            if (largestExpense) {
                const allExpenses = transactions.filter(t => t.type === "expense");
                const averageExpense = allExpenses.reduce((sum,t)=>sum+t.amount,0) / allExpenses.length;
                const isLarge = averageExpense > 0 && largestExpense.amount >= averageExpense * 2;
                signals.push([isLarge ? "Unusually large expense" : "Largest recorded expense", `${largestExpense.category || "Uncategorized"} is the largest single expense at ${biMoney(largestExpense.amount)}${isLarge ? `, about ${(largestExpense.amount/averageExpense).toFixed(1)}× the average recorded expense of ${biMoney(averageExpense)}. Verify it is expected and correctly categorized.` : ". Check whether it is expected and recurring."}`]);
            }
            const prevMonthRevenueForSignals = sumPeriod(previousStart, currentStart, "income");
            const prevMonthExpensesForSignals = sumPeriod(previousStart, currentStart, "expense");
            const prevMonthNetForSignals = prevMonthRevenueForSignals - prevMonthExpensesForSignals;
            if (prevMonthRevenueForSignals > 0 && revenue < prevMonthRevenueForSignals) {
                const drop = ((prevMonthRevenueForSignals - revenue) / prevMonthRevenueForSignals) * 100;
                signals.push(["Revenue below last month", `Recorded revenue is down ${drop.toFixed(1)}% compared with the full previous calendar month. The current month may still be in progress, so compare equivalent dates before drawing conclusions.`]);
            }
            if (prevMonthExpensesForSignals > 0 && expenses > prevMonthExpensesForSignals) {
                const rise = ((expenses - prevMonthExpensesForSignals) / prevMonthExpensesForSignals) * 100;
                signals.push(["Expenses above last month", `Recorded expenses are up ${rise.toFixed(1)}% compared with the full previous calendar month. Because the current month may be incomplete, check this trend again near month-end.`]);
            }
            const recentMonthsWithData = monthRevenue.filter((v,i) => v > 0 || monthExpenses[i] > 0).length;
            if (recentMonthsWithData >= 3) {
                const lastThreeRevenue = monthRevenue.slice(-3);
                if (lastThreeRevenue[0] > lastThreeRevenue[1] && lastThreeRevenue[1] > lastThreeRevenue[2] && lastThreeRevenue[0] > 0) {
                    signals.push(["Revenue trending down", "Recorded revenue has decreased across the last three calendar months. Review customer activity, pricing, and whether all sales have been recorded; this pattern alone does not establish the cause."]);
                }
            }
            if (monthRevenue.every(v => v === 0) && monthExpenses.every(v => v === 0)) signals.push(["No recent activity", "There are no transactions in the last six calendar months. Older records remain included in totals elsewhere."]);
        }
        if (insights) insights.innerHTML = signals.map((s,i) => `<div class="bi-insight"><span class="bi-insight-number">${String(i+1).padStart(2,"0")}</span><div><strong>${escapeBiText(s[0])}</strong><p>${escapeBiText(s[1])}</p></div></div>`).join("");
    } catch (error) {
        console.error("Business intelligence error:", error);
        if (insights) insights.innerHTML = '<p class="bi-empty">Could not refresh insights. Please try again.</p>';
    }
    await loadCreditCustomers();
}

function answerAnalystQuestion() {
    const input = document.getElementById("aiAnalystQuestion");
    const output = document.getElementById("aiAnalystAnswer");
    if (!input || !output) return;
    const question = input.value.trim().toLowerCase();
    if (!question) {
        output.innerHTML = '<strong>Enter a question</strong><p>Try asking about revenue, expenses, net result, your top expense category, or your best revenue month.</p>';
        return;
    }
    const records = Array.isArray(biTransactions) ? biTransactions : [];
    if (!records.length) {
        output.innerHTML = '<strong>Not enough data yet</strong><p>Add some income and expense transactions first, then ask again.</p>';
        return;
    }
    const now = new Date();
    const thisMonth = records.filter(t => t.dateObj.getFullYear() === now.getFullYear() && t.dateObj.getMonth() === now.getMonth());
    const sum = (items, type) => items.filter(t => t.type === type).reduce((total,t) => total + t.amount, 0);
    const revenue = sum(thisMonth, "income");
    const expenses = sum(thisMonth, "expense");
    const net = revenue - expenses;
    let title = "Here's what your records show";
    let body = "";
    if (question.includes("category") || question.includes("spend most") || question.includes("largest expense") || question.includes("expense breakdown")) {
        const totals = {};
        records.filter(t => t.type === "expense").forEach(t => { const name = String(t.category || "Uncategorized").trim() || "Uncategorized"; totals[name] = (totals[name] || 0) + t.amount; });
        const top = Object.entries(totals).sort((a,b) => b[1]-a[1])[0];
        title = "Top expense category";
        body = top ? `${top[0]} has the highest total recorded spending at ${biMoney(top[1])} across all recorded dates. This is a spending total, not necessarily a monthly amount.` : "No expense transactions are recorded yet.";
    } else if (question.includes("best month") || question.includes("highest revenue month") || question.includes("most revenue")) {
        const months = {};
        records.filter(t => t.type === "income").forEach(t => { const key = `${t.dateObj.getFullYear()}-${String(t.dateObj.getMonth()+1).padStart(2,"0")}`; months[key] = (months[key] || 0) + t.amount; });
        const top = Object.entries(months).sort((a,b) => b[1]-a[1])[0];
        title = "Best recorded revenue month";
        if (top) { const [year,month] = top[0].split("-"); body = `${new Date(Number(year), Number(month)-1, 1).toLocaleDateString("en-IN", {month:"long", year:"numeric"})} had the highest recorded revenue: ${biMoney(top[1])}.`; }
        else body = "No income transactions are recorded yet.";
    } else if (question.includes("why") && (question.includes("profit") || question.includes("net"))) {
        const previousStart = new Date(now.getFullYear(), now.getMonth()-1, 1);
        const currentStart = new Date(now.getFullYear(), now.getMonth(), 1);
        const currentEnd = new Date(now.getFullYear(), now.getMonth()+1, 1);
        const periodSum = (start,end,type) => records.filter(t => t.type === type && t.dateObj >= start && t.dateObj < end).reduce((total,t)=>total+t.amount,0);
        const prevRevenue = periodSum(previousStart,currentStart,"income");
        const prevExpenses = periodSum(previousStart,currentStart,"expense");
        const prevNet = prevRevenue-prevExpenses;
        const reasons = [];
        if (revenue < prevRevenue) reasons.push(`revenue is ${biMoney(prevRevenue-revenue)} lower than the previous calendar month`);
        if (expenses > prevExpenses) reasons.push(`expenses are ${biMoney(expenses-prevExpenses)} higher than the previous calendar month`);
        if (!reasons.length) reasons.push("the current month's totals do not show lower revenue or higher expenses than the previous month on these measures");
        title = "What may explain the net result?";
        body = `This month: revenue ${biMoney(revenue)}, expenses ${biMoney(expenses)}, net ${biMoney(net)}. Previous month: revenue ${biMoney(prevRevenue)}, expenses ${biMoney(prevExpenses)}, net ${biMoney(prevNet)}. From these totals, ${reasons.join("; ")}. The current month may be incomplete, and these figures show changes—not the underlying cause.`;
    } else if (question.includes("focus") || question.includes("recommend") || question.includes("what should") || question.includes("improve")) {
        const expenseTotals = {};
        records.filter(t => t.type === "expense" && t.dateObj.getFullYear() === now.getFullYear() && t.dateObj.getMonth() === now.getMonth()).forEach(t => { const name = String(t.category || "Uncategorized").trim() || "Uncategorized"; expenseTotals[name] = (expenseTotals[name] || 0) + t.amount; });
        const topCategory = Object.entries(expenseTotals).sort((a,b)=>b[1]-a[1])[0];
        title = "Suggested next steps";
        const suggestions = [];
        if (net < 0) suggestions.push(`review expenses against revenue; the current recorded shortfall is ${biMoney(Math.abs(net))}`);
        if (topCategory) suggestions.push(`review the ${topCategory[0]} category, currently the largest expense category this month at ${biMoney(topCategory[1])}`);
        if (revenue === 0) suggestions.push("confirm that all income has been entered for this month");
        if (!suggestions.length) suggestions.push("keep recording income and expenses consistently so trends become more reliable");
        body = `${suggestions.join(". ")}. These are data-based prompts, not guarantees; check bills, business context, and whether the current month is complete before acting.`;
    } else if (question.includes("expense") || question.includes("cost") || question.includes("spending")) {
        title = "Expenses this month";
        body = `You have recorded ${biMoney(expenses)} in expenses this calendar month. ${revenue > 0 ? `Revenue is ${biMoney(revenue)}, leaving a net result of ${biMoney(net)}.` : "No revenue is recorded for this month yet."}`;
    } else if (question.includes("profit") || question.includes("net") || question.includes("left over")) {
        title = "This month's net result";
        body = `Recorded revenue is ${biMoney(revenue)} and recorded expenses are ${biMoney(expenses)}. Revenue minus expenses is ${biMoney(net)}${net < 0 ? ", so recorded expenses currently exceed revenue" : ""}. This simple net result is not a full accounting profit calculation.`;
    } else if (question.includes("revenue") || question.includes("income") || question.includes("earn")) {
        title = "Revenue this month";
        body = `You have recorded ${biMoney(revenue)} in income this calendar month from ${thisMonth.filter(t => t.type === "income").length} income transaction(s).`;
    } else {
        title = "Questions I can answer right now";
        body = "Ask about this month's revenue, income, expenses, net result, the expense category with the highest recorded total, or your best revenue month. Answers use recorded transactions and simple calculations; they are not generated by an external AI model.";
    }
    output.innerHTML = `<strong>${escapeBiText(title)}</strong><p>${escapeBiText(body)}</p><small>Based on ${records.length} recorded transaction(s). Check that all relevant transactions have been entered.</small>`;
}

function escapeBiText(value) {
    return String(value ?? "").replace(/[&<>"']/g, char => ({
        "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
    })[char]);
}


// Download a date-filtered CSV report using the transactions already loaded for this business.
function biSelectedReportTransactions() {
    const startValue = document.getElementById("biReportStart")?.value;
    const endValue = document.getElementById("biReportEnd")?.value;
    const status = document.getElementById("biReportStatus");
    if (!startValue || !endValue) {
        if (status) status.textContent = "Choose both a start and end date.";
        return null;
    }
    if (startValue > endValue) {
        if (status) status.textContent = "The start date must be on or before the end date.";
        return null;
    }
    const start = new Date(`${startValue}T00:00:00`);
    const end = new Date(`${endValue}T23:59:59.999`);
    const filtered = biTransactions.filter(t => t.dateObj >= start && t.dateObj <= end).sort((a,b) => a.dateObj-b.dateObj);
    if (status) status.textContent = `${filtered.length} transaction${filtered.length === 1 ? "" : "s"} included in the selected period.`;
    return { filtered, startValue, endValue };
}

function createCustomerCreditPage(dashboard) {
    if (document.getElementById("customerCreditPage")) return;
    const main = dashboard.querySelector("main, .main-content");
    if (!main) return;
    const page = document.createElement("section");
    page.id = "customerCreditPage";
    page.className = "content-section customer-credit-page";
    page.innerHTML = `
      <div class="section-title bi-section-heading">
        <div><span class="bi-eyebrow">BUSINESS OPERATIONS</span><h2>Customer credit tracking</h2><p>Manage customer balances and repayments in a dedicated workspace.</p></div>
        <span class="bi-chart-tag">CUSTOMERS</span>
      </div>
      <article class="bi-panel credit-panel">
        <div class="credit-summary-grid"><div><span>Total outstanding</span><strong id="creditTotalOutstanding">₹0</strong></div><div><span>Customers owing</span><strong id="creditCustomerCount">0</strong></div><div><span>Overdue accounts</span><strong id="creditOverdueCount">0</strong></div></div>
        <form id="creditCustomerForm" class="credit-form"><label>Customer name<input name="name" required minlength="2" maxlength="120" placeholder="e.g. Rahul Stores"></label><label>Phone (optional)<input name="phone" maxlength="40" placeholder="Contact number"></label><label>Amount owed (₹)<input name="amountOwed" type="number" min="0.01" step="0.01" required placeholder="0.00"></label><label>Due date (optional)<input name="dueDate" type="date"></label><label class="credit-notes-field">Notes (optional)<input name="notes" maxlength="1000" placeholder="Invoice or reason for credit"></label><button class="bi-action-button bi-action-primary" type="submit">Add customer balance</button></form>
        <p id="creditStatus" class="bi-report-status" aria-live="polite"></p>
        <div class="credit-table-wrap"><table class="credit-table"><thead><tr><th>Customer</th><th>Due date</th><th>Original amount</th><th>Paid</th><th>Outstanding</th><th>Action</th></tr></thead><tbody id="creditCustomersRows"><tr><td colspan="6">Loading customer records…</td></tr></tbody></table></div>
      </article>`;
    main.appendChild(page);
    page.querySelector("#creditCustomerForm")?.addEventListener("submit", saveCreditCustomer);
    page.querySelector("#creditCustomersRows")?.addEventListener("click", handleCreditAction);
}

function setupWorkspaceNavigation(dashboard) {
    if (document.getElementById("workspaceNavigation")) return;
    const header = dashboard.querySelector(".main-header");
    const main = dashboard.querySelector("main, .main-content");
    if (!header || !main) return;
    const nav = document.createElement("nav");
    nav.id = "workspaceNavigation";
    nav.className = "workspace-navigation";
    nav.setAttribute("aria-label", "Business workspace");
    nav.innerHTML = `<button type="button" class="workspace-nav-button active" data-workspace-view="overview">▦ Overview</button><button type="button" class="workspace-nav-button" data-workspace-view="customers">♙ Customer tracking</button><button type="button" class="workspace-nav-button" data-workspace-view="suppliers">▤ Supplier payments</button><button type="button" class="workspace-nav-button" data-workspace-view="inventory">▦ Inventory</button><button type="button" class="workspace-nav-button" data-workspace-view="cashflow">↗ Cash flow</button><button type="button" class="workspace-nav-button" data-workspace-view="ai">✦ AI assistant</button>`;
    header.insertAdjacentElement("afterend", nav);
    nav.addEventListener("click", event => {
        const button = event.target.closest("[data-workspace-view]");
        if (!button) return;
        showWorkspaceView(button.dataset.workspaceView);
    });
    showWorkspaceView("overview");
    if (typeof setupExtendedWorkspaces === "function") setupExtendedWorkspaces(dashboard);
}

function showWorkspaceView(view) {
    const main = document.querySelector("#dashboardPage main, #dashboardPage .main-content");
    const customerPage = document.getElementById("customerCreditPage");
    if (!main || !customerPage) return;
    const targetPage = view === "customers" ? customerPage : document.getElementById("workspace-" + view);
    if (view !== "overview" && !targetPage) return;
    Array.from(main.children).forEach(child => {
        child.hidden = view === "overview" ? child === customerPage || child.id?.startsWith("workspace-") : child !== targetPage;
    });
    document.querySelectorAll("[data-workspace-view]").forEach(button => {
        const active = button.dataset.workspaceView === view;
        button.classList.toggle("active", active);
        button.setAttribute("aria-current", active ? "page" : "false");
    });
    if (view === "customers") loadCreditCustomers();
    window.scrollTo({ top: 0, behavior: "smooth" });
}

async function loadCreditCustomers() {
    const tbody = document.getElementById("creditCustomersRows");
    if (!tbody || !businessId) return;
    try {
        const response = await fetch(`/api/credit/${businessId}`);
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || "Could not load customers.");
        const rows = Array.isArray(data) ? data : [];
        const outstanding = rows.reduce((sum, customer) => sum + Number(customer.outstanding || 0), 0);
        const today = new Date(); today.setHours(0,0,0,0);
        const overdue = rows.filter(c => Number(c.outstanding) > 0 && c.due_date && new Date(`${String(c.due_date).slice(0,10)}T00:00:00`) < today).length;
        document.getElementById("creditTotalOutstanding").textContent = biMoney(outstanding);
        document.getElementById("creditCustomerCount").textContent = String(rows.filter(c => Number(c.outstanding) > 0).length);
        document.getElementById("creditOverdueCount").textContent = String(overdue);
        tbody.innerHTML = rows.length ? rows.map(c => {
            const due = c.due_date ? String(c.due_date).slice(0,10) : "—";
            const isOverdue = c.due_date && new Date(`${due}T00:00:00`) < today && Number(c.outstanding) > 0;
            return `<tr><td><strong>${escapeBiText(c.name)}</strong>${c.phone ? `<small>${escapeBiText(c.phone)}</small>` : ""}${c.notes ? `<small>${escapeBiText(c.notes)}</small>` : ""}</td><td>${escapeBiText(due)}${isOverdue ? '<span class="credit-overdue">Overdue</span>' : ""}</td><td>${biMoney(c.opening_balance)}</td><td>${biMoney(c.paid_amount)}</td><td><strong>${biMoney(c.outstanding)}</strong></td><td>${Number(c.outstanding) > 0 ? `<button type="button" class="credit-pay-button" data-credit-pay="${Number(c.id)}" data-credit-balance="${Number(c.outstanding)}" data-credit-name="${escapeBiText(c.name)}">Record payment</button>` : '<span class="credit-settled">Settled</span>'}</td></tr>`;
        }).join("") : '<tr><td colspan="6">No customer credit records yet. Add a customer above to get started.</td></tr>';
    } catch (error) {
        tbody.innerHTML = `<tr><td colspan="6">${escapeBiText(error.message || "Could not load customer records.")}</td></tr>`;
    }
}

async function saveCreditCustomer(event) {
    event.preventDefault();
    const form = event.currentTarget;
    const status = document.getElementById("creditStatus");
    const values = Object.fromEntries(new FormData(form).entries());
    status.textContent = "Saving customer…";
    try {
        const response = await fetch("/api/credit", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ businessId, name: values.name, phone: values.phone, amountOwed: values.amountOwed, dueDate: values.dueDate, notes: values.notes }) });
        const result = await response.json();
        if (!response.ok) throw new Error(result.error || "Could not save customer.");
        form.reset(); status.textContent = "Customer balance saved."; await loadCreditCustomers();
    } catch (error) { status.textContent = error.message || "Could not save customer."; }
}

async function handleCreditAction(event) {
    const button = event.target.closest("[data-credit-pay]");
    if (!button) return;
    const balance = Number(button.dataset.creditBalance);
    const name = button.dataset.creditName || "customer";
    const rawAmount = window.prompt(`Outstanding balance for ${name}: ${biMoney(balance)}\nEnter payment received (₹):`);
    if (rawAmount === null) return;
    const amount = Number(rawAmount);
    if (!Number.isFinite(amount) || amount <= 0 || amount > balance + 0.005) { window.alert("Enter a payment greater than zero and no more than the outstanding balance."); return; }
    const paymentDate = window.prompt("Payment date (YYYY-MM-DD):", new Date().toISOString().slice(0,10));
    if (!paymentDate) return;
    const note = window.prompt("Payment note (optional):", "") || "";
    try {
        const response = await fetch(`/api/credit/${button.dataset.creditPay}/payments`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ amount, paymentDate, note }) });
        const result = await response.json();
        if (!response.ok) throw new Error(result.error || "Could not record payment.");
        document.getElementById("creditStatus").textContent = "Payment recorded successfully.";
        await loadCreditCustomers();
    } catch (error) { document.getElementById("creditStatus").textContent = error.message || "Could not record payment."; }
}

function exportBiCsv() {
    const report = biSelectedReportTransactions();
    if (!report) return;
    const csvCell = value => `"${String(value ?? "").replace(/"/g, '""')}"`;
    const rows = [["Date","Type","Category","Description","Amount (INR)"], ...report.filtered.map(t => [t.dateObj.toLocaleDateString("en-IN"), t.type, t.category || "Uncategorized", t.description || "", t.amount])];
    const csv = "\uFEFF" + rows.map(row => row.map(csvCell).join(",")).join("\r\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `business-report-${report.startValue}-to-${report.endValue}.csv`;
    document.body.appendChild(link); link.click(); link.remove(); URL.revokeObjectURL(url);
}

function printBiReport() {
    const report = biSelectedReportTransactions();
    if (!report) return;
    const revenue = report.filtered.filter(t => t.type === "income").reduce((s,t) => s+t.amount, 0);
    const expenses = report.filtered.filter(t => t.type === "expense").reduce((s,t) => s+t.amount, 0);
    const safe = value => escapeBiText(value);
    const rows = report.filtered.map(t => `<tr><td>${safe(t.dateObj.toLocaleDateString("en-IN"))}</td><td>${safe(t.type)}</td><td>${safe(t.category || "Uncategorized")}</td><td>${safe(t.description || "—")}</td><td class="amount">${biMoney(t.amount)}</td></tr>`).join("");
    const win = window.open("", "_blank");
    if (!win) {
        const status = document.getElementById("biReportStatus");
        if (status) status.textContent = "Your browser blocked the report window. Allow pop-ups for localhost and try again.";
        return;
    }
    win.document.write(`<!doctype html><html><head><meta charset="utf-8"><title>Business Financial Report</title><style>body{font:14px Arial,sans-serif;color:#172033;margin:32px}h1{margin-bottom:4px}p{color:#566176}.cards{display:flex;gap:12px;margin:24px 0}.card{border:1px solid #dbe1ea;border-radius:8px;padding:14px;flex:1}.card strong{display:block;font-size:20px;margin-top:8px}table{width:100%;border-collapse:collapse;margin-top:20px}th,td{border-bottom:1px solid #dbe1ea;text-align:left;padding:9px 7px}th{background:#f2f5f9}.amount{text-align:right;white-space:nowrap}@media print{body{margin:12mm}}</style></head><body><h1>Business Financial Report</h1><p>Period: ${safe(report.startValue)} to ${safe(report.endValue)} · Generated ${safe(new Date().toLocaleString("en-IN"))}</p><div class="cards"><div class="card">Revenue<strong>${biMoney(revenue)}</strong></div><div class="card">Expenses<strong>${biMoney(expenses)}</strong></div><div class="card">Net result<strong>${biMoney(revenue-expenses)}</strong></div></div><p>Based on ${report.filtered.length} recorded transactions. Net result is revenue minus recorded expenses and may not equal accounting profit.</p><table><thead><tr><th>Date</th><th>Type</th><th>Category</th><th>Description</th><th>Amount (INR)</th></tr></thead><tbody>${rows || '<tr><td colspan="5">No transactions in this period.</td></tr>'}</tbody></table><script>window.onload=()=>window.print();</script></body></html>`);
    win.document.close();
}
