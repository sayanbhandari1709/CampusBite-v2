const API = "http://localhost:5000/api";

const token = localStorage.getItem("token");

if (!token) {
    window.location.href = "login.html";
}

// ===============================
// Modal Elements
// ===============================
const modalOverlay = document.getElementById("modalOverlay");
const modalTitle = document.getElementById("modalTitle");
const modalName = document.getElementById("modalName");
const modalEmail = document.getElementById("modalEmail");
const modalPassword = document.getElementById("modalPassword");
const saveModal = document.getElementById("saveModal");
const cancelModal = document.getElementById("cancelModal");

let currentMode = ""; // "faculty" or "vendor"

function openModal(mode) {
    currentMode = mode;

    modalOverlay.classList.add("show");

    modalName.value = "";
    modalEmail.value = "";
    modalPassword.value = "";

    if (mode === "faculty") {
        modalTitle.innerText = "Add Faculty";
        saveModal.innerText = "Create Faculty";
    } else {
        modalTitle.innerText = "Add Vendor";
        saveModal.innerText = "Create Vendor";
    }

    setTimeout(() => {
        modalName.focus();
    }, 100);
}

function closeModal() {
    modalOverlay.classList.remove("show");
    currentMode = "";
}

cancelModal.onclick = closeModal;

modalOverlay.addEventListener("click", (e) => {
    if (e.target === modalOverlay) {
        closeModal();
    }
});

document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
        closeModal();
    }
});

// ===============================
// Toast
// ===============================
function toast(message, type = "success") {
    let div = document.getElementById("toast");

    if (!div) {
        div = document.createElement("div");
        div.id = "toast";
        div.style.position = "fixed";
        div.style.top = "20px";
        div.style.right = "20px";
        div.style.padding = "15px 22px";
        div.style.borderRadius = "12px";
        div.style.color = "#fff";
        div.style.fontWeight = "bold";
        div.style.zIndex = "9999";
        div.style.transition = ".3s";
        div.style.boxShadow = "0 12px 28px rgba(0,0,0,.25)";
        document.body.appendChild(div);
    }

    div.style.background = type === "success" ? "#22c55e" : "#ef4444";
    div.innerText = message;
    div.style.opacity = "1";

    clearTimeout(window.__campusbiteAdminToastTimer);
    window.__campusbiteToastTimer = setTimeout(() => {
        div.style.opacity = "0";
    }, 2500);
}

// ===============================
// Helpers
// ===============================
function escapeHTML(value) {
    return String(value ?? "")
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}

// ===============================
// Logout
// ===============================
document.getElementById("logoutBtn").onclick = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    location.href = "login.html";
};

// ===============================
// Admin Role Verification
// ===============================
const user = JSON.parse(localStorage.getItem("user") || "{}");

if (user.role !== "admin") {
    toast("Access denied", "error");

    setTimeout(() => {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        window.location.href = "login.html";
    }, 1200);
}

// ===============================
// Dashboard
// ===============================
async function loadDashboard() {
    try {
        const res = await fetch(`${API}/admin/dashboard`, {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        });

        const data = await res.json();

        if (!data.success) return;

        document.getElementById("facultyCount").innerText =
            data.stats.totalFaculty ?? 0;

        document.getElementById("vendorCount").innerText =
            data.stats.totalVendors ?? 0;

        document.getElementById("menuCount").innerText =
            data.stats.totalMenus ?? 0;

        document.getElementById("invitationCount").innerText =
            data.stats.totalInvitations ?? 0;
    } catch (err) {
        console.error(err);
        toast("Cannot load dashboard", "error");
    }
}

// ===============================
// Faculty Management
// ===============================
document.getElementById("addFacultyBtn").onclick = () => {
    openModal("faculty");
};

async function loadFaculties() {
    try {
        const res = await fetch(`${API}/admin/faculties`, {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        });

        const data = await res.json();

        if (!data.success) return;

        const table = document.getElementById("facultyTable");
        table.innerHTML = "";

        data.faculties.forEach((faculty) => {
            table.innerHTML += `
                <tr>
                    <td>${escapeHTML(faculty.name || "-")}</td>
                    <td>${escapeHTML(faculty.email || "-")}</td>
                    <td>${escapeHTML(faculty.role || "-")}</td>
                    <td>
                        <button class="deleteBtn" onclick="deleteFaculty('${faculty._id}')">
                            Delete
                        </button>
                    </td>
                </tr>
            `;
        });
    } catch (err) {
        console.error(err);
        toast("Cannot load faculties", "error");
    }
}

async function addFaculty() {
    const name = modalName.value.trim();
    const email = modalEmail.value.trim();
    const password = modalPassword.value.trim();

    if (!name || !email || !password) {
        toast("Please fill all faculty fields", "error");
        return;
    }

    try {
        const res = await fetch(`${API}/admin/faculties`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
                name,
                email,
                password,
            }),
        });

        const data = await res.json();

        if (data.success) {
            toast(data.message || "Faculty added", "success");
            closeModal();
            await loadFaculties();
            await loadDashboard();
            return;
        }

        toast(data.message || "Failed to add faculty", "error");
    } catch (err) {
        console.error(err);
        toast("Failed to add faculty", "error");
    }
}

async function deleteFaculty(id) {
    if (!confirm("Delete this faculty member?")) return;

    try {
        const res = await fetch(`${API}/admin/users/${id}`, {
            method: "DELETE",
            headers: {
                Authorization: `Bearer ${token}`,
            },
        });

        const data = await res.json();

        if (data.success) {
            toast(data.message || "Faculty deleted", "success");
            await loadFaculties();
            await loadDashboard();
            return;
        }

        toast(data.message || "Failed to delete faculty", "error");
    } catch (err) {
        console.error(err);
        toast("Failed to delete faculty", "error");
    }
}

// ===============================
// Vendor Management
// ===============================
document.getElementById("addVendorBtn").onclick = () => {
    openModal("vendor");
};

async function loadVendors() {
    try {
        const res = await fetch(`${API}/admin/vendors`, {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        });

        const data = await res.json();

        if (!data.success) return;

        const table = document.getElementById("vendorTable");
        table.innerHTML = "";

        data.vendors.forEach((vendor) => {
            table.innerHTML += `
                <tr>
                    <td>${escapeHTML(vendor.name || "-")}</td>
                    <td>${escapeHTML(vendor.email || "-")}</td>
                    <td>${escapeHTML(vendor.role || "-")}</td>
                    <td>
                        <button class="deleteBtn" onclick="deleteVendor('${vendor._id}')">
                            Delete
                        </button>
                    </td>
                </tr>
            `;
        });
    } catch (err) {
        console.error(err);
        toast("Cannot load vendors", "error");
    }
}

async function addVendor() {
    const name = modalName.value.trim();
    const email = modalEmail.value.trim();
    const password = modalPassword.value.trim();

    if (!name || !email || !password) {
        toast("Please fill all vendor fields", "error");
        return;
    }

    try {
        const res = await fetch(`${API}/admin/vendors`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
                name,
                email,
                password,
            }),
        });

        const data = await res.json();

        if (data.success) {
            toast(data.message || "Vendor added", "success");
            closeModal();
            await loadVendors();
            await loadDashboard();
            return;
        }

        toast(data.message || "Failed to add vendor", "error");
    } catch (err) {
        console.error(err);
        toast("Failed to add vendor", "error");
    }
}

async function deleteVendor(id) {
    if (!confirm("Delete this vendor?")) return;

    try {
        const res = await fetch(`${API}/admin/users/${id}`, {
            method: "DELETE",
            headers: {
                Authorization: `Bearer ${token}`,
            },
        });

        const data = await res.json();

        if (data.success) {
            toast(data.message || "Vendor deleted", "success");
            await loadVendors();
            await loadDashboard();
            return;
        }

        toast(data.message || "Failed to delete vendor", "error");
    } catch (err) {
        console.error(err);
        toast("Failed to delete vendor", "error");
    }
}

// ===============================
// Modal Save
// ===============================
saveModal.onclick = () => {
    if (currentMode === "faculty") {
        addFaculty();
    } else if (currentMode === "vendor") {
        addVendor();
    }
};

// ===============================
// Refresh Everything
// ===============================
async function refreshDashboard() {
    await loadDashboard();
    await loadFaculties();
    await loadVendors();
}

// ===============================
// Auto Refresh
// ===============================
setInterval(() => {
    refreshDashboard();
}, 30000);

// ===============================
// Initial Load
// ===============================
document.addEventListener("DOMContentLoaded", async () => {
    await refreshDashboard();
});

// ===============================
// Expose Functions
// ===============================
window.deleteFaculty = deleteFaculty;
window.deleteVendor = deleteVendor;
window.addFaculty = addFaculty;
window.addVendor = addVendor;
