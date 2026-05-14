document.addEventListener("DOMContentLoaded", () => {
    const logoutButton = document.getElementById("logout-button");

    logoutButton.addEventListener("click", async () => {
        await fetch("/users/logout", {
            method: "POST",
            credentials: "include" // Important for cookies
        });
        window.location.href = "/static/index.html";
    });

    // Example of fetching user data (you'll use this pattern for protected routes)
    async function fetchUserData() {
        const response = await fetch("/users/me/", {
            method: "GET",
            credentials: "include" // Important for sending HttpOnly cookies
        });
        if (response.ok) {
            const userData = await response.json();
            document.querySelector(".container h1").textContent = `Dashboard - ${userData.email}`;
        } else if (response.status === 401) {
            // If unauthorized, redirect to login page
            window.location.href = "/static/index.html";
        } else {
            console.error("Failed to fetch user data");
        }
    }

    fetchUserData();
});