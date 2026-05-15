document.addEventListener("DOMContentLoaded", () => {
    const categoryForm = document.getElementById("category-form");
    const categoryId = document.getElementById("category-id");
    const categoryName = document.getElementById("category-name");
    const categoryColor = document.getElementById("category-color");
    const categoryIcon = document.getElementById("category-icon");
    const categoryFolderGroup = document.getElementById("category-folder-group");
    const categoriesList = document.getElementById("categories-list");
    const logoutButton = document.getElementById("logout-button");
    const browseTemplatesBtn = document.getElementById("browse-templates-btn");
    const templatesModal = document.getElementById("templates-modal");
    const modalClose = document.getElementById("modal-close");
    const modalCancel = document.getElementById("modal-cancel");
    const modalAddSelected = document.getElementById("modal-add-selected");
    const templateGroups = document.getElementById("template-groups");

    let debtsData = [];

    // Template definitions
    const TEMPLATES = {
        "Housing": [
            { name: "Rent/Mortgage", color: "#e74c3c", icon: "fa-solid fa-house" },
            { name: "Utilities", color: "#f39c12", icon: "fa-solid fa-bolt" },
            { name: "Home Insurance", color: "#e67e22", icon: "fa-solid fa-shield-halved" },
            { name: "Maintenance", color: "#d35400", icon: "fa-solid fa-wrench" },
            { name: "HOA Fees", color: "#c0392b", icon: "fa-solid fa-building" },
        ],
        "Transportation": [
            { name: "Car Payment", color: "#3498db", icon: "fa-solid fa-car" },
            { name: "Gas", color: "#2980b9", icon: "fa-solid fa-gas-pump" },
            { name: "Auto Insurance", color: "#2ecc71", icon: "fa-solid fa-car-burst" },
            { name: "Parking", color: "#27ae60", icon: "fa-solid fa-square-parking" },
            { name: "Public Transit", color: "#1abc9c", icon: "fa-solid fa-bus" },
            { name: "Maintenance", color: "#16a085", icon: "fa-solid fa-oil-can" },
        ],
        "Food": [
            { name: "Groceries", color: "#2ecc71", icon: "fa-solid fa-apple-whole" },
            { name: "Dining Out", color: "#27ae60", icon: "fa-solid fa-utensils" },
            { name: "Coffee Shops", color: "#1abc9c", icon: "fa-solid fa-mug-hot" },
        ],
        "Personal": [
            { name: "Clothing", color: "#9b59b6", icon: "fa-solid fa-shirt" },
            { name: "Haircare", color: "#8e44ad", icon: "fa-solid fa-scissors" },
            { name: "Gym Membership", color: "#2c3e50", icon: "fa-solid fa-dumbbell" },
            { name: "Hobbies", color: "#34495e", icon: "fa-solid fa-palette" },
        ],
        "Health": [
            { name: "Health Insurance", color: "#e74c3c", icon: "fa-solid fa-heart-pulse" },
            { name: "Prescriptions", color: "#c0392b", icon: "fa-solid fa-prescription" },
            { name: "Doctor Visits", color: "#e67e22", icon: "fa-solid fa-stethoscope" },
            { name: "Dental", color: "#f39c12", icon: "fa-solid fa-tooth" },
            { name: "Vision", color: "#d35400", icon: "fa-solid fa-glasses" },
        ],
        "Entertainment": [
            { name: "Streaming Services", color: "#3498db", icon: "fa-solid fa-film" },
            { name: "Movies", color: "#2980b9", icon: "fa-solid fa-clapperboard" },
            { name: "Concerts", color: "#9b59b6", icon: "fa-solid fa-music" },
            { name: "Games", color: "#8e44ad", icon: "fa-solid fa-gamepad" },
            { name: "Books", color: "#2c3e50", icon: "fa-solid fa-book" },
        ],
        "Bills & Subscriptions": [
            { name: "Phone", color: "#1abc9c", icon: "fa-solid fa-mobile-screen" },
            { name: "Internet", color: "#16a085", icon: "fa-solid fa-wifi" },
            { name: "Software Subscriptions", color: "#27ae60", icon: "fa-solid fa-cloud" },
        ],
        "Savings & Investments": [
            { name: "Emergency Fund", color: "#2ecc71", icon: "fa-solid fa-piggy-bank" },
            { name: "Retirement", color: "#27ae60", icon: "fa-solid fa-tree" },
            { name: "Investments", color: "#1abc9c", icon: "fa-solid fa-chart-line" },
        ],
        "Debt Payments": [
            { name: "Credit Cards", color: "#e74c3c", icon: "fa-solid fa-credit-card" },
            { name: "Student Loans", color: "#c0392b", icon: "fa-solid fa-graduation-cap" },
            { name: "Personal Loans", color: "#e67e22", icon: "fa-solid fa-hand-holding-dollar" },
        ],
    };

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

    async function fetchDebts() {
        try {
            const response = await fetch("/debts/", {
                credentials: "include"
            });
            if (response.ok) {
                debtsData = await response.json();
            }
        } catch (error) {
            console.error("Error fetching debts:", error);
        }
    }

    const fetchCategories = async () => {
        try {
            const response = await fetch("/categories/", {
                credentials: "include"
            });
            if (response.ok) {
                const categories = await response.json();
                await fetchDebts();
                displayCategories(categories);
            } else if (response.status === 401) {
                window.location.href = "/static/index.html";
            } else {
                console.error("Failed to fetch categories");
            }
        } catch (error) {
            console.error("Error fetching categories:", error);
        }
    };

    const displayCategories = (categories) => {
        categoriesList.innerHTML = "";
        const folderGroups = {};

        categories.forEach(category => {
            const groupName = category.folder_group || "Uncategorized";
            if (!folderGroups[groupName]) {
                folderGroups[groupName] = [];
            }
            folderGroups[groupName].push(category);
        });

        for (const groupName in folderGroups) {
            const groupDiv = document.createElement("div");
            groupDiv.classList.add("folder-group");

            const groupTitle = document.createElement("h3");
            groupTitle.textContent = groupName;
            groupDiv.appendChild(groupTitle);

            folderGroups[groupName].forEach(category => {
                const categoryDiv = document.createElement("div");
                categoryDiv.classList.add("category-item");
                if (category.is_debt_category) {
                    categoryDiv.classList.add("debt-category");
                }

                let extraHtml = "";
                if (category.is_debt_category && category.linked_debt_id) {
                    const linkedDebt = debtsData.find(d => d.id === category.linked_debt_id);
                    if (linkedDebt) {
                        const progress = linkedDebt.total_balance > 0
                            ? ((linkedDebt.total_balance - linkedDebt.current_balance) / linkedDebt.total_balance) * 100
                            : 0;
                        extraHtml = `
                            <div style="margin-top: 5px; font-size: 0.9em; color: #666;">
                                <span>Balance: $${linkedDebt.current_balance.toFixed(2)} / $${linkedDebt.total_balance.toFixed(2)}</span>
                            </div>
                            <div class="debt-progress-bar">
                                <div class="debt-progress" style="width: ${Math.max(progress, 0).toFixed(2)}%;">${Math.max(progress, 0).toFixed(2)}% Paid</div>
                            </div>
                        `;
                    }
                }

                categoryDiv.innerHTML = `
                    <div>
                        <span style="color: ${category.color || '#000000'}">${category.icon ? `<i class="${category.icon}"></i>` : ''} ${category.name}</span>
                        ${extraHtml}
                    </div>
                    <div>
                        ${category.is_debt_category
                            ? `<span style="color: #999; font-size: 0.85em;">Managed by Debt</span>`
                            : `<button data-id="${category.id}" class="edit-btn">Edit</button>
                               <button data-id="${category.id}" class="delete-btn">Delete</button>`
                        }
                    </div>
                `;
                groupDiv.appendChild(categoryDiv);
            });
            categoriesList.appendChild(groupDiv);
        }

        document.querySelectorAll(".edit-btn").forEach(button => {
            button.addEventListener("click", (e) => {
                const id = e.target.dataset.id;
                const categoryToEdit = categories.find(c => c.id == id);
                if (categoryToEdit) {
                    categoryId.value = categoryToEdit.id;
                    categoryName.value = categoryToEdit.name;
                    categoryColor.value = categoryToEdit.color || "#cccccc";
                    categoryIcon.value = categoryToEdit.icon || "";
                    categoryFolderGroup.value = categoryToEdit.folder_group || "";
                }
            });
        });

        document.querySelectorAll(".delete-btn").forEach(button => {
            button.addEventListener("click", async (e) => {
                const id = e.target.dataset.id;
                if (confirm("Are you sure you want to delete this category?")) {
                    try {
                        const response = await fetch(`/categories/${id}`, {
                            method: "DELETE",
                        });
                        if (response.ok) {
                            fetchCategories();
                        } else {
                            const errorData = await response.json();
                            alert(errorData.detail || "Failed to delete category");
                        }
                    } catch (error) {
                        console.error("Error deleting category:", error);
                    }
                }
            });
        });
    };

    categoryForm.addEventListener("submit", async (e) => {
        e.preventDefault();
        const id = categoryId.value;
        const method = id ? "PUT" : "POST";
        const url = id ? `/categories/${id}` : "/categories/";

        const categoryData = {
            name: categoryName.value,
            color: categoryColor.value,
            icon: categoryIcon.value,
            folder_group: categoryFolderGroup.value || null,
            is_debt_category: false,
            linked_debt_id: null,
        };

        try {
            const response = await fetch(url, {
                method: method,
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(categoryData),
            });

            if (response.ok) {
                categoryId.value = "";
                categoryName.value = "";
                categoryColor.value = "#cccccc";
                categoryIcon.value = "";
                categoryFolderGroup.value = "";
                fetchCategories();
            } else {
                const errorData = await response.json();
                console.error("Failed to save category:", errorData);
                alert(`Error: ${errorData.detail}`);
            }
        } catch (error) {
            console.error("Error saving category:", error);
        }
    });

    // Templates Modal Logic
    function openTemplatesModal() {
        templateGroups.innerHTML = "";
        for (const [groupName, items] of Object.entries(TEMPLATES)) {
            const groupDiv = document.createElement("div");
            groupDiv.className = "template-group";
            groupDiv.innerHTML = `<h4>${groupName}</h4>`;
            items.forEach(item => {
                const itemDiv = document.createElement("div");
                itemDiv.className = "template-item";
                itemDiv.innerHTML = `
                    <input type="checkbox" data-group="${groupName}" data-name="${item.name}" data-color="${item.color}" data-icon="${item.icon}">
                    <span class="color-swatch" style="background-color: ${item.color};"></span>
                    <span class="icon-preview"><i class="${item.icon}"></i></span>
                    <span>${item.name}</span>
                `;
                groupDiv.appendChild(itemDiv);
            });
            templateGroups.appendChild(groupDiv);
        }
        templatesModal.style.display = "block";
    }

    function closeTemplatesModal() {
        templatesModal.style.display = "none";
    }

    browseTemplatesBtn.addEventListener("click", openTemplatesModal);
    modalClose.addEventListener("click", closeTemplatesModal);
    modalCancel.addEventListener("click", closeTemplatesModal);
    window.addEventListener("click", (e) => {
        if (e.target === templatesModal) {
            closeTemplatesModal();
        }
    });

    modalAddSelected.addEventListener("click", async () => {
        const selectedItems = document.querySelectorAll("#template-groups input[type='checkbox']:checked");
        if (selectedItems.length === 0) {
            alert("Please select at least one category to add.");
            return;
        }

        for (const checkbox of selectedItems) {
            const categoryData = {
                name: checkbox.dataset.name,
                color: checkbox.dataset.color,
                icon: checkbox.dataset.icon,
                folder_group: checkbox.dataset.group,
                is_debt_category: false,
                linked_debt_id: null,
            };

            try {
                await fetch("/categories/", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify(categoryData),
                });
            } catch (error) {
                console.error("Error adding template category:", error);
            }
        }

        closeTemplatesModal();
        fetchCategories();
    });

    fetchCategories();
});
