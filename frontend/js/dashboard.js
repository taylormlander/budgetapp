document.addEventListener("DOMContentLoaded", () => {
    const dashboardContent = document.getElementById("dashboard-content");
    const debtSummaryStats = document.getElementById("debt-summary-stats");
    const logoutButton = document.getElementById("logout-button");

    logoutButton.addEventListener("click", async () => {
        try {
            const response = await fetch("/users/logout", {
                method: "POST",
            });
            if (response.ok) {
                window.location.href = "/";
            } else {
                console.error("Logout failed");
            }
        } catch (error) {
            console.error("Error during logout:", error);
        }
    });

    async function fetchDebtSummary() {
        try {
            const response = await fetch("/debts/", {
                credentials: "include"
            });
            if (response.ok) {
                const debts = await response.json();
                const totalDebt = debts.reduce((sum, d) => sum + d.total_balance, 0);
                const totalCurrent = debts.reduce((sum, d) => sum + d.current_balance, 0);
                const totalPaidOff = totalDebt - totalCurrent;

                debtSummaryStats.innerHTML = `
                    <div class="debt-stat">
                        <div class="stat-value negative">$${totalDebt.toFixed(2)}</div>
                        <div class="stat-label">Total Debt</div>
                    </div>
                    <div class="debt-stat">
                        <div class="stat-value negative">$${totalCurrent.toFixed(2)}</div>
                        <div class="stat-label">Remaining Balance</div>
                    </div>
                    <div class="debt-stat">
                        <div class="stat-value positive">$${Math.max(totalPaidOff, 0).toFixed(2)}</div>
                        <div class="stat-label">Total Paid Off</div>
                    </div>
                    <div class="debt-stat">
                        <div class="stat-value">${debts.length}</div>
                        <div class="stat-label">Active Debts</div>
                    </div>
                `;
            }
        } catch (error) {
            console.error("Error fetching debt summary:", error);
        }
    }

    async function fetchDashboardData() {
        try {
            const response = await fetch("/transactions/", {
                credentials: "include"
            });

            if (response.ok) {
                const transactions = await response.json();
                const totalIncome = transactions
                    .filter(t => t.type === "income")
                    .reduce((sum, t) => sum + t.amount, 0);
                const totalExpenses = transactions
                    .filter(t => t.type === "expense")
                    .reduce((sum, t) => sum + t.amount, 0);
                const balance = totalIncome - totalExpenses;

                dashboardContent.innerHTML = `
                    <div class="dashboard-summary">
                        <h2>Summary</h2>
                        <p><strong>Total Income:</strong> $${totalIncome.toFixed(2)}</p>
                        <p><strong>Total Expenses:</strong> $${totalExpenses.toFixed(2)}</p>
                        <p><strong>Balance:</strong> $${balance.toFixed(2)}</p>
                    </div>
                `;
            } else if (response.status === 401) {
                window.location.href = "/static/index.html";
            } else {
                console.error("Failed to fetch dashboard data");
            }
        } catch (error) {
            console.error("Error fetching dashboard data:", error);
        }
    }

    fetchDebtSummary();
    fetchDashboardData();
});
