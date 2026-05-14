document.addEventListener("DOMContentLoaded", () => {
    const categoryForm = document.getElementById("category-form");
    const categoryId = document.getElementById("category-id");
    const categoryName = document.getElementById("category-name");
    const categoryColor = document.getElementById("category-color");
    const categoryIcon = document.getElementById("category-icon");
    const categoryFolderGroup = document.getElementById("category-folder-group");
    const categoriesList = document.getElementById("categories-list");
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

    const fetchCategories = async () => {
        try {
            const response = await fetch("/categories/", {
                credentials: "include" // Important for sending HttpOnly cookies
            });
            if (response.ok) {
                const categories = await response.json();
                displayCategories(categories);
            } else if (response.status === 401) {
                // If unauthorized, redirect to login page
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
                categoryDiv.innerHTML = `
                    <span style="color: ${category.color || '#000000'}">${category.icon ? `<i class="${category.icon}"></i>` : ''} ${category.name}</span>
                    <div>
                        <button data-id="${category.id}" class="edit-btn">Edit</button>
                        <button data-id="${category.id}" class="delete-btn">Delete</button>
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
                            console.error("Failed to delete category");
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

    fetchCategories();
});