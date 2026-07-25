const API = "http://localhost:5000/api";

const token = localStorage.getItem("token");

if (!token) {
    window.location.href = "login.html";
}

// =============================
// Toast helpers
// =============================
function ensureToastUI() {
    if (document.getElementById("toast")) return;

    const style = document.createElement("style");
    style.id = "toast-style";
    style.textContent = `
        #toast{
            position:fixed;
            top:24px;
            right:24px;
            min-width:260px;
            max-width:360px;
            padding:16px 20px;
            border-radius:12px;
            color:#fff;
            font-weight:700;
            font-size:15px;
            line-height:1.4;
            box-shadow:0 16px 34px rgba(0,0,0,.28);
            z-index:99999;
            opacity:0;
            transform:translateX(420px);
            transition:opacity .3s ease, transform .3s ease;
            pointer-events:none;
            background:#334155;
        }

        #toast.show{
            opacity:1;
            transform:translateX(0);
        }

        #toast.success{
            background:linear-gradient(135deg, #22c55e, #16a34a);
        }

        #toast.error{
            background:linear-gradient(135deg, #ef4444, #dc2626);
        }

        #toast.info{
            background:linear-gradient(135deg, #38bdf8, #0ea5e9);
        }
    `;
    document.head.appendChild(style);

    const toast = document.createElement("div");
    toast.id = "toast";
    toast.setAttribute("role", "status");
    toast.setAttribute("aria-live", "polite");
    document.body.appendChild(toast);
}

function showToast(message, type = "info") {
    ensureToastUI();

    const toast = document.getElementById("toast");
    toast.className = "";
    toast.id = "toast";
    toast.classList.add(type);

    toast.textContent = String(message ?? "");

    requestAnimationFrame(() => {
        toast.classList.add("show");
    });

    clearTimeout(window.__campusbiteToastTimer);
    window.__campusbiteToastTimer = setTimeout(() => {
        toast.classList.remove("show");
    }, 2800);
}

// =============================
// Helpers
// =============================
function escapeHTML(value) {
    return String(value ?? "")
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}

function formatDateTime(value) {
    if (!value) return "-";

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) return "-";

    const datePart = date.toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
    });

    const timePart = date.toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
    });

    return `${datePart}<br>${timePart}`;
}

function statusBadge(status) {
    const normalized = String(status || "Pending").toLowerCase();

    let badgeClass = "status-pending";

    if (normalized === "accepted") {
        badgeClass = "status-accepted";
    } else if (normalized === "declined") {
        badgeClass = "status-declined";
    }

    return `<span class="statusBadge ${badgeClass}">${escapeHTML(status || "Pending")}</span>`;
}

function availabilityBadge(isAvailable) {
    return isAvailable
        ? `<span class="badge available">Available</span>`
        : `<span class="badge unavailable">Unavailable</span>`;
}

function tokenText(response) {
    if (
        response.orderTokenNumber !== null &&
        response.orderTokenNumber !== undefined
    ) {
        return String(response.orderTokenNumber);
    }

    if (response.token) {
        return response.token;
    }

    return "-";
}

// =============================
// Logout
// =============================
document.getElementById("logoutBtn").addEventListener("click", () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    window.location.href = "login.html";
});

// =============================
// Load Menus
// =============================
async function loadMenus() {
    try {
        const res = await fetch(`${API}/menu`);
        const data = await res.json();

        const table = document.getElementById("menuTable");
        table.innerHTML = "";

        if (!data.success) return;

        document.getElementById("menuCount").innerText = data.count;

        data.menus.forEach((menu) => {
            table.innerHTML += `
                <tr>
                    <td>${escapeHTML(menu.name)}</td>
                    <td>₹${escapeHTML(menu.price)}</td>
                    <td>${escapeHTML(menu.category)}</td>
                    <td>${availabilityBadge(menu.available)}</td>
                    <td>
                        <button class="actionBtn deleteBtn" onclick="deleteMenu('${menu._id}')">
                            Delete
                        </button>
                    </td>
                </tr>
            `;
        });
    } catch (err) {
        console.error(err);
    }
}

// =============================
// Create Menu
// =============================
document.getElementById("publishBtn").addEventListener("click", createMenu);

async function createMenu() {
    const body = {
        name: document.getElementById("name").value.trim(),
        description: document.getElementById("description").value.trim(),
        price: Number(document.getElementById("price").value),
        category: document.getElementById("category").value.trim(),
        image: document.getElementById("image").value.trim(),
        available: true,
    };

    try {
        const res = await fetch(`${API}/menu`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify(body),
        });

        const data = await res.json();

        if (data.success) {
            showToast(data.message || "Menu item created", "success");

            document.getElementById("name").value = "";
            document.getElementById("description").value = "";
            document.getElementById("price").value = "";
            document.getElementById("category").value = "";
            document.getElementById("image").value = "";

            await loadMenus();
            return;
        }

        showToast(data.message || "Failed to create menu item", "error");
    } catch (err) {
        console.error(err);
        showToast("Failed to create menu item", "error");
    }
}

// =============================
// Delete Menu
// =============================
async function deleteMenu(id) {
    if (!confirm("Delete this menu item?")) return;

    try {
        const res = await fetch(`${API}/menu/${id}`, {
            method: "DELETE",
            headers: {
                Authorization: `Bearer ${token}`,
            },
        });

        const data = await res.json();

        if (data.success) {
            showToast(data.message || "Menu deleted", "success");
            await loadMenus();
            return;
        }

        showToast(data.message || "Failed to delete menu", "error");
    } catch (err) {
        console.error(err);
        showToast("Failed to delete menu", "error");
    }
}

// =============================
// Send Today's Menu
// =============================
document.getElementById("sendMenuBtn").addEventListener("click", sendMenu);

async function sendMenu() {
    try {
        const res = await fetch(`${API}/invitations/send`, {
            method: "POST",
            headers: {
                Authorization: `Bearer ${token}`,
            },
        });

        const data = await res.json();

        if (data.success) {
            showToast(data.message || "Menu sent", "success");
            await loadStats();
            await loadResponses();
            return;
        }

        showToast(data.message || "Failed to send menu", "error");
    } catch (err) {
        console.error(err);
        showToast("Failed to send menu", "error");
    }
}

// =============================
// Load Dashboard Stats
// =============================
async function loadStats() {
    try {
        const res = await fetch(`${API}/invitations/stats`, {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        });

        const data = await res.json();

        if (!data.success) return;

        document.getElementById("acceptedCount").innerText =
            data.stats.acceptedCount ?? 0;

        document.getElementById("declinedCount").innerText =
            data.stats.declinedCount ?? 0;

        document.getElementById("pendingCount").innerText =
            data.stats.pendingCount ?? 0;
    } catch (err) {
        console.error(err);
    }
}

// =============================
// Load Faculty Responses
// =============================
async function loadResponses() {
    try {
        const res = await fetch(`${API}/invitations/responses`, {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        });

        const data = await res.json();

        if (!data.success) return;

        const table = document.getElementById("responseTable");
        table.innerHTML = "";

        data.responses.forEach((response) => {
            const facultyName =
                response.facultyName ||
                response.facultyEmail ||
                "Unknown";

            table.innerHTML += `
                <tr>
                    <td>${escapeHTML(facultyName)}</td>
                    <td>${statusBadge(response.status)}</td>
                    <td>${escapeHTML(tokenText(response))}</td>
                    <td>${formatDateTime(
                        response.respondedAt || response.sentAt || response.createdAt
                    )}</td>
                </tr>
            `;
        });
    } catch (err) {
        console.error(err);
    }
}

// =============================
// Initial Load
// =============================
loadMenus();
loadStats();
loadResponses();