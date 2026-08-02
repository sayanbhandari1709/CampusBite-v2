const API_URL = "https://campusbite-v2.onrender.com/api";

const params = new URLSearchParams(window.location.search);
const roleFromUrl = params.get("role");

let currentRole = roleFromUrl === "vendor" ? "vendor" : "admin";

const adminBtn = document.getElementById("adminBtn");
const vendorBtn = document.getElementById("vendorBtn");
const portalTitle = document.getElementById("portalTitle");
const loginForm = document.getElementById("loginForm");
const message = document.getElementById("message");

function syncRoleUI() {
    if (currentRole === "vendor") {
        vendorBtn.classList.add("active");
        adminBtn.classList.remove("active");
        portalTitle.textContent = "Vendor Portal";
    } else {
        adminBtn.classList.add("active");
        vendorBtn.classList.remove("active");
        portalTitle.textContent = "Admin Portal";
    }
}

function setRole(role) {
    currentRole = role;
    syncRoleUI();

    const newUrl = `${window.location.pathname}?role=${role}`;
    window.history.replaceState({}, "", newUrl);
}

// Initial UI
syncRoleUI();

// Switch to Admin
adminBtn.addEventListener("click", () => {
    setRole("admin");
});

// Switch to Vendor
vendorBtn.addEventListener("click", () => {
    setRole("vendor");
});

// Login
loginForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    message.textContent = "";

    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value;

    try {
        const response = await fetch(`${API_URL}/auth/login`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                email,
                password,
            }),
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || "Login failed");
        }

        localStorage.setItem("token", data.token);
        localStorage.setItem("user", JSON.stringify(data.user));

        if (currentRole === "admin") {
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