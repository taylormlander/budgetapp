document.addEventListener("DOMContentLoaded", () => {
    const debtForm = document.getElementById("debt-form");
    const debtsList = document.getElementById("debts-list");
    const logoutButton = document.getElementById("logout-button");

    let editingDebtId = null;

    logoutButton.addEventListener("click", async () => {
        await fetch("/users/logout", {
            method: "POST",
        });
        window.location.href = "/static/index.html";
    });

    async function fetchTransactions() {
        const response = await fetch("/transactions/", {
            credentials: "include"
        });
        if (response.ok) {
            return await response.json();
        }
        return [];
    }

    async function fetchDebts() {
        const response = await fetch("/debts/", {
            credentials: "include"
        });

        if (response.ok) {
            const debts = await response.json();
            const transactions = await fetchTransactions();
            debtsList.innerHTML = "";
            debts.forEach(debt => {
                const debtElement = document.createElement("div");
                debtElement.className = "debt-item";
                const progress = debt.total_balance > 0
                    ? ((debt.total_balance - debt.current_balance) / debt.total_balance) * 100
                    : 0;

                // Find transactions linked to this debt
                const linkedTransactions = transactions.filter(t => t.debt_id === debt.id);

                let transactionsHtml = "";
                if (linkedTransactions.length > 0) {
                    transactionsHtml = `<div class="debt-transactions">
                        <h4>Linked Transactions (${linkedTransactions.length})</h4>`;
                    linkedTransactions.forEach(t => {
                        const amountClass = t.type === "income" ? "income-amount" : "expense-amount";
                        const prefix = t.type === "income" ? "+" : "-";
                        transactionsHtml += `
                            <div class="debt-transaction-item">
                                <span>${new Date(t.date).toLocaleDateString()} - ${t.description || "No description"}</span>
                                <span class="${amountClass}">${prefix}$${t.amount.toFixed(2)}</span>
                            </div>`;
                    });
                    transactionsHtml += `</div>`;
                }

                debtElement.innerHTML = `
                    <p><strong>Name:</strong> ${debt.name}</p>
                    <p><strong>Total Balance:</strong> $${debt.total_balance.toFixed(2)}</p>
                    <p><strong>Current Balance:</strong> $${debt.current_balance.toFixed(2)}</p>
                    ${debt.interest_rate ? `<p><strong>Interest Rate:</strong> ${debt.interest_rate}%</p>` : ``}
                    ${debt.minimum_payment ? `<p><strong>Minimum Payment:</strong> $${debt.minimum_payment.toFixed(2)}</p>` : ``}
                    <div class="debt-progress-bar">
                        <div class="debt-progress" style="width: ${Math.max(progress, 0).toFixed(2)}%;">${Math.max(progress, 0).toFixed(2)}% Paid</div>
                    </div>
                    ${transactionsHtml}
                    <button class="edit-debt" data-id="${debt.id}">Edit</button>
                    <button class="delete-debt" data-id="${debt.id}">Delete</button>
                `;
                debtsList.appendChild(debtElement);
            });

            document.querySelectorAll(".edit-debt").forEach(button => {
                button.addEventListener("click", (event) => editDebt(event.target.dataset.id));
            });

            document.querySelectorAll(".delete-debt").forEach(button => {
                button.addEventListener("click", (event) => deleteDebt(event.target.dataset.id));
            });

        } else if (response.status === 401) {
            window.location.href = "/static/index.html";
        } else {
            console.error("Failed to fetch debts");
        }
    }

    debtForm.addEventListener("submit", async (event) => {
        event.preventDefault();

        const name = document.getElementById("name").value;
        const totalBalance = parseFloat(document.getElementById("total-balance").value);
        const currentBalance = parseFloat(document.getElementById("current-balance").value);
        const interestRate = document.getElementById("interest-rate").value ? parseFloat(document.getElementById("interest-rate").value) : null;
        const minimumPayment = document.getElementById("minimum-payment").value ? parseFloat(document.getElementById("minimum-payment").value) : null;

        const debtData = {
            name,
            total_balance: totalBalance,
            current_balance: currentBalance,
            interest_rate: interestRate,
            minimum_payment: minimumPayment,
        };

        let response;
        if (editingDebtId) {
            response = await fetch(`/debts/${editingDebtId}`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(debtData),
                credentials: "include"
            });
        } else {
            response = await fetch("/debts/", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(debtData),
                credentials: "include"
            });
        }

        if (response.ok) {
            debtForm.reset();
            editingDebtId = null;
            await fetchDebts();
        } else if (response.status === 401) {
            window.location.href = "/static/index.html";
        } else {
            console.error("Failed to save debt");
        }
    });

    async function editDebt(id) {
        const response = await fetch(`/debts/${id}`, {
            credentials: "include"
        });

        if (response.ok) {
            const debt = await response.json();
            document.getElementById("debt-id").value = debt.id;
            document.getElementById("name").value = debt.name;
            document.getElementById("total-balance").value = debt.total_balance;
            document.getElementById("current-balance").value = debt.current_balance;
            document.getElementById("interest-rate").value = debt.interest_rate || "";
            document.getElementById("minimum-payment").value = debt.minimum_payment || "";
            editingDebtId = debt.id;
        } else if (response.status === 401) {
            window.location.href = "/static/index.html";
        } else {
            console.error("Failed to fetch debt for editing");
        }
    }

    async function deleteDebt(id) {
        if (!confirm("Are you sure you want to delete this debt?")) {
            return;
        }

        const response = await fetch(`/debts/${id}`, {
            method: "DELETE",
            credentials: "include"
        });

        if (response.ok) {
            await fetchDebts();
        } else if (response.status === 401) {
            window.location.href = "/static/index.html";
        } else {
            console.error("Failed to delete debt");
        }
    }

    fetchDebts();
});
