// auth.js
document.addEventListener("DOMContentLoaded", () => {
    const loginForm = document.getElementById("login-form");
    const registerForm = document.getElementById("register-form");
    const logoutButton = document.getElementById("logout-button");

    if (loginForm) {
        loginForm.addEventListener("submit", async (e) => {
            e.preventDefault();
            const email = loginForm.email.value;
            const password = loginForm.password.value;

            try {
                const response = await fetch("/users/token", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({ email, password }),
                });

                if (response.ok) {
                    window.location.href = "dashboard.html";
                } else {
                    alert("Login failed: " + (await response.json()).detail);
                }
            } catch (error) {
                console.error("Error during login:", error);
                alert("An error occurred during login.");
            }
        });
    }

    if (registerForm) {
        registerForm.addEventListener("submit", async (e) => {
            e.preventDefault();
            const email = registerForm.email.value;
            const password = registerForm.password.value;

            try {
                const response = await fetch("/users/register", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({ email, password }),
                });

                if (response.ok) {
                    alert("Registration successful! Please log in.");
                    window.location.href = "index.html";
                } else {
                    alert("Registration failed: " + (await response.json()).detail);
                }
            } catch (error) {
                console.error("Error during registration:", error);
                alert("An error occurred during registration.");
            }
        });
    }

    if (logoutButton) {
        logoutButton.addEventListener("click", async () => {
            try {
                const response = await fetch("/users/logout", {
                    method: "POST",
                });

                if (response.ok) {
                    window.location.href = "index.html";
                } else {
                    alert("Logout failed.");
                }
            } catch (error) {
                console.error("Error during logout:", error);
                alert("An error occurred during logout.");
            }
        });
    }
});