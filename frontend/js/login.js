const API_URL = "https://campusbite-v2.onrender.com/api";

const params = new URLSearchParams(window.location.search);

const role = params.get("role");

let roleFromUrl = "admin";

if (role === "vendor") {
    roleFromUrl = "vendor";
} else if (role === "faculty") {
    roleFromUrl = "faculty";
}

const portalTitle = document.getElementById("portalTitle");
const portalHint = document.getElementById("portalHint");
const roleBadgeText = document.getElementById("roleBadgeText");
const roleBadgeIcon = document.querySelector("#roleBadge i");
const loginForm = document.getElementById("loginForm");
const message = document.getElementById("message");

function applyRoleUI() {
    if (roleFromUrl === "admin") {
        portalTitle.textContent = "Admin Portal";
        portalHint.textContent = "Administrator login";
        roleBadgeText.textContent = "Admin";
        roleBadgeIcon.className = "fa-solid fa-user-shield";
    } else if (roleFromUrl === "vendor") {
        portalTitle.textContent = "Vendor Portal";
        portalHint.textContent = "Vendor login";
        roleBadgeText.textContent = "Vendor";
        roleBadgeIcon.className = "fa-solid fa-store";
    } else {
        portalTitle.textContent = "Faculty Portal";
        portalHint.textContent = "Faculty login";
        roleBadgeText.textContent = "Faculty";
        roleBadgeIcon.className = "fa-solid fa-user-graduate";
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
        } else if (roleFromUrl === "vendor") {
            if (data.user.role !== "vendor") {
                throw new Error("This account is not a vendor.");
            }
            window.location.href = "vendor_dashboard.html";
        } else {
            if (data.user.role !== "faculty") {
                throw new Error("This account is not a faculty member.");
            }
            window.location.href = "faculty_dashboard.html";
        }
    } catch (err) {
        message.style.color = "#ff4d4d";
        message.textContent = err.message;
    }
});