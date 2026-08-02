const API_URL = "https://campusbite-v2.onrender.com/api";

const params = new URLSearchParams(window.location.search);
const roleFromUrl = params.get("role") === "vendor" ? "vendor" : "admin";

const portalTitle = document.getElementById("portalTitle");
const portalHint = document.getElementById("portalHint");
const roleBadgeText = document.getElementById("roleBadgeText");
const roleBadgeIcon = document.querySelector("#roleBadge i");
const loginForm = document.getElementById("loginForm");
const message = document.getElementById("message");

function applyRoleUI() {
    if (roleFromUrl === "vendor") {
        portalTitle.textContent = "Vendor Portal";
        portalHint.textContent = "Vendor login";
        roleBadgeText.textContent = "Vendor";
        roleBadgeIcon.className = "fa-solid fa-store";
    } else {
        portalTitle.textContent = "Admin Portal";
        portalHint.textContent = "Admin login";
        roleBadgeText.textContent = "Admin";
        roleBadgeIcon.className = "fa-solid fa-user-shield";
    }
}

applyRoleUI();

loginForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    message.textContent = "";

    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value;

    try {
        const response = await fetch(`${API_URL}/auth/login`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                email,
                password
            })
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || "Login failed");
        }

        localStorage.setItem("token", data.token);
        localStorage.setItem("user", JSON.stringify(data.user));

        if (roleFromUrl === "admin") {
            if (data.user.role !== "admin") {
                throw new Error("This account is not an admin.");
            }
            window.location.href = "admin_dashboard.html";
        } else {
            if (data.user.role !== "vendor") {
                throw new Error("This account is not a vendor.");
            }
            window.location.href = "vendor_dashboard.html";
        }
    } catch (err) {
        message.style.color = "#ff4d4d";
        message.textContent = err.message;
    }
});