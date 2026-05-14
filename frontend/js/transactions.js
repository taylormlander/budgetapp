document.addEventListener("DOMContentLoaded", () => {
    const transactionForm = document.getElementById("transaction-form");
    const transactionsList = document.getElementById("transactions-list");
    const categorySelect = document.getElementById("category-select");
    const logoutButton = document.getElementById("logout-button");

    let editingTransactionId = null;

    logoutButton.addEventListener("click", async () => {
        await fetch("/users/logout", {
            method: "POST",
        });
        window.location.href = "/";
    });

    async function fetchCategories() {
        const response = await fetch("/categories/", {
            credentials: "include" // Important for sending HttpOnly cookies
        });

        if (response.ok) {
            const categories = await response.json();
            categorySelect.innerHTML = 
                `<option value="">Uncategorized</option>`;
            categories.forEach(category => {
                const option = document.createElement("option");
                option.value = category.id;
                option.textContent = category.name;
                categorySelect.appendChild(option);
            });
        } else if (response.status === 401) {
            window.location.href = "/static/index.html";
        } else {
            console.error("Failed to fetch categories");
        }
    }

    async function fetchTransactions() {
        const response = await fetch("/transactions/", {
            credentials: "include" // Important for sending HttpOnly cookies
        });

        if (response.ok) {
            const transactions = await response.json();
            transactionsList.innerHTML = "";
            transactions.forEach(transaction => {
                const transactionElement = document.createElement("div");
                const amountClass = transaction.type === "income" ? "income-amount" : "expense-amount";
                const amountPrefix = transaction.type === "income" ? "+" : "-";

                transactionElement.className = "transaction-item";
                transactionElement.innerHTML = `
                    <p><strong class="${amountClass}">${amountPrefix}$${transaction.amount.toFixed(2)}</strong></p>
                    <p><strong>Date:</strong> ${new Date(transaction.date).toLocaleDateString()}</p>
                    ${transaction.vendor ? `<p><strong>Vendor:</strong> ${transaction.vendor}</p>` : ``}
                    ${transaction.description ? `<p><strong>Description:</strong> ${transaction.description}</p>` : ``}
                    <p><strong>Category:</strong> ${transaction.category ? transaction.category.name : "Uncategorized"}</p>
                    ${transaction.notes ? `<p><strong>Notes:</strong> ${transaction.notes}</p>` : ``}
                    <button class="edit-transaction" data-id="${transaction.id}">Edit</button>
                    <button class="delete-transaction" data-id="${transaction.id}">Delete</button>
                `;
                transactionsList.appendChild(transactionElement);
            });

            document.querySelectorAll(".edit-transaction").forEach(button => {
                button.addEventListener("click", (event) => editTransaction(event.target.dataset.id));
            });

            document.querySelectorAll(".delete-transaction").forEach(button => {
                button.addEventListener("click", (event) => deleteTransaction(event.target.dataset.id));
            });

        } else if (response.status === 401) {
            window.location.href = "/static/index.html";
        } else {
            console.error("Failed to fetch transactions");
        }
    }

    transactionForm.addEventListener("submit", async (event) => {
        event.preventDefault();

        const amount = parseFloat(document.getElementById("amount").value);
        const date = document.getElementById("date").value;
        const description = document.getElementById("description").value;
        const categoryId = categorySelect.value === "" ? null : parseInt(categorySelect.value);
        const type = document.querySelector("input[name=\'transaction-type\']:checked").value;
        const notes = document.getElementById("notes").value;
        const vendor = document.getElementById("vendor").value;

        const transactionData = {
            amount,
            date: new Date(date).toISOString(),
            description,
            category_id: categoryId,
            type,
            vendor,
            notes,
        };

        let response;
        if (editingTransactionId) {
            response = await fetch(`/transactions/${editingTransactionId}`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(transactionData),
                credentials: "include" // Important for sending HttpOnly cookies
            });
        } else {
            response = await fetch("/transactions/", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(transactionData),
                credentials: "include" // Important for sending HttpOnly cookies
            });
        }

        if (response.ok) {
            transactionForm.reset();
            editingTransactionId = null;
            await fetchTransactions();
        } else if (response.status === 401) {
            window.location.href = "/static/index.html";
        } else {
            console.error("Failed to save transaction");
        }
    });

    async function editTransaction(id) {
        const response = await fetch(`/transactions/${id}`, {
            credentials: "include" // Important for sending HttpOnly cookies
        });

        if (response.ok) {
            const transaction = await response.json();
            document.getElementById("amount").value = transaction.amount;
            document.getElementById("date").value = new Date(transaction.date).toISOString().split("T")[0];
            document.getElementById("description").value = transaction.description;
            categorySelect.value = transaction.category_id || "";
            document.querySelector(`input[name=\'transaction-type\"][value=\'${transaction.type}\\']`).checked = true;
            document.getElementById("vendor").value = transaction.vendor || "";
            document.getElementById("notes").value = transaction.notes || "";
            editingTransactionId = transaction.id;
        } else if (response.status === 401) {
            window.location.href = "/static/index.html";
        } else {
            console.error("Failed to fetch transaction for editing");
        }
    }

    async function deleteTransaction(id) {
        if (!confirm("Are you sure you want to delete this transaction?")) {
            return;
        }

        const response = await fetch(`/transactions/${id}`, {
            method: "DELETE",
            credentials: "include" // Important for sending HttpOnly cookies
        });

        if (response.ok) {
            await fetchTransactions();
        } else if (response.status === 401) {
            window.location.href = "/static/index.html";
        } else {
            console.error("Failed to delete transaction");
        }
    }

    fetchCategories();
    fetchTransactions();
});