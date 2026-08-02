const API = "https://campusbite-v2.onrender.com/api";

const token = localStorage.getItem("token");
const user = JSON.parse(localStorage.getItem("user") || "{}");

if (!token) {
    window.location.href = "index.html";
}

if (user.role && user.role !== "faculty") {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    window.location.href = "index.html";
}

// =============================
// Elements
// =============================
const facultyNameEl = document.getElementById("facultyName");
const facultyEmailEl = document.getElementById("facultyEmail");
const statusBadgeEl = document.getElementById("statusBadge");
const todayStatusEl = document.getElementById("todayStatus");
const todayStatusTextEl = document.getElementById("todayStatusText");
const tokenNumberEl = document.getElementById("tokenNumber");
const tokenTextEl = document.getElementById("tokenText");
const menuNameEl = document.getElementById("menuName");
const menuCategoryEl = document.getElementById("menuCategory");
const vendorNameEl = document.getElementById("vendorName");
const vendorEmailEl = document.getElementById("vendorEmail");
const editResponseBtn = document.getElementById("editResponseBtn");
const menuImageEl = document.getElementById("menuImage");
const menuImageFallbackEl = document.getElementById("menuImageFallback");
const menuTitleEl = document.getElementById("menuTitle");
const menuDescriptionEl = document.getElementById("menuDescription");
const menuPriceEl = document.getElementById("menuPrice");
const menuCategory2El = document.getElementById("menuCategory2");
const menuVendorEl = document.getElementById("menuVendor");
const invitationStatusEl = document.getElementById("invitationStatus");
const sentAtEl = document.getElementById("sentAt");
const respondedAtEl = document.getElementById("respondedAt");
const expiresAtEl = document.getElementById("expiresAt");
const historyTableEl = document.getElementById("historyTable");

const modalOverlay = document.getElementById("modalOverlay");
const modalAcceptBtn = document.getElementById("modalAcceptBtn");
const modalDeclineBtn = document.getElementById("modalDeclineBtn");
const closeModalBtn = document.getElementById("closeModalBtn");

const acceptBtn = document.getElementById("acceptBtn");
const declineBtn = document.getElementById("declineBtn");
const logoutBtn = document.getElementById("logoutBtn");

let currentInvitation = null;
let isUpdating = false;

// =============================
// Toast
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

function getStatusClass(status) {
    const normalized = String(status || "Pending").toLowerCase();

    if (normalized === "accepted") return "status-accepted";
    if (normalized === "declined") return "status-declined";
    return "status-pending";
}

function setBadge(el, status) {
    if (!el) return;
    el.classList.remove("status-accepted", "status-declined", "status-pending");
    el.classList.add(getStatusClass(status));
    el.textContent = status || "Pending";
}

function tokenValue(invitation) {
    if (!invitation) return "-";

    if (invitation.tokenNumber !== null && invitation.tokenNumber !== undefined) {
        return invitation.tokenNumber;
    }

    if (invitation.token !== null && invitation.token !== undefined) {
        return invitation.token;
    }

    return "-";
}

function setButtonsEnabled(enabled) {
    [acceptBtn, declineBtn, editResponseBtn, modalAcceptBtn, modalDeclineBtn].forEach(
        (btn) => {
            if (btn) btn.disabled = !enabled;
        }
    );
}

function closeModal() {
    if (modalOverlay) {
        modalOverlay.style.display = "none";
    }
}

function openModal() {
    if (!currentInvitation) {
        showToast("No invitation available yet.", "error");
        return;
    }

    if (!currentInvitation.canEdit) {
        showToast("This invitation is expired and cannot be edited.", "error");
        return;
    }

    if (modalOverlay) {
        modalOverlay.style.display = "flex";
    }
}

function renderEmptyHistory(message = "No history found.") {
    if (!historyTableEl) return;
    historyTableEl.innerHTML = `
        <tr>
            <td colspan="4" class="emptyRow">${escapeHTML(message)}</td>
        </tr>
    `;
}

function renderHistory(history) {
    if (!historyTableEl) return;

    if (!history || history.length === 0) {
        renderEmptyHistory("No order history found.");
        return;
    }

    historyTableEl.innerHTML = history
        .map((item) => {
            const menu = item.menu || {};
            const token = item.order?.tokenNumber ?? item.tokenNumber ?? item.token ?? "-";
            const status = item.status || "Pending";
            const date = item.respondedAt || item.sentAt || item.createdAt;

            return `
                <tr>
                    <td>${formatDateTime(date)}</td>
                    <td>
                        <strong>${escapeHTML(menu.name || "-")}</strong>
                    </td>
                    <td>
                        <span class="statusBadge ${getStatusClass(status)}">
                            ${escapeHTML(status)}
                        </span>
                    </td>
                    <td>${escapeHTML(String(token))}</td>
                </tr>
            `;
        })
        .join("");
}

function renderDashboard(payload) {
    const faculty = payload.faculty || {};
    const invitation = payload.invitation || null;
    const currentOrder = payload.currentOrder || null;

    if (facultyNameEl) facultyNameEl.textContent = faculty.name || "Faculty";
    if (facultyEmailEl) facultyEmailEl.textContent = faculty.email || "-";

    if (!invitation) {
        currentInvitation = null;

        setBadge(statusBadgeEl, "Pending");
        if (todayStatusEl) todayStatusEl.textContent = "Pending";
        if (todayStatusTextEl) todayStatusTextEl.textContent = "Waiting for invitation";
        if (tokenNumberEl) tokenNumberEl.textContent = "-";
        if (tokenTextEl) tokenTextEl.textContent = "No token generated yet";
        if (menuNameEl) menuNameEl.textContent = "-";
        if (menuCategoryEl) menuCategoryEl.textContent = "-";
        if (vendorNameEl) vendorNameEl.textContent = "-";
        if (vendorEmailEl) vendorEmailEl.textContent = "-";
        if (menuTitleEl) menuTitleEl.textContent = "No invitation yet";
        if (menuDescriptionEl) menuDescriptionEl.textContent = "Today's invitation has not been sent yet.";
        if (menuPriceEl) menuPriceEl.textContent = "₹0";
        if (menuCategory2El) menuCategory2El.textContent = "-";
        if (menuVendorEl) menuVendorEl.textContent = "-";
        if (invitationStatusEl) invitationStatusEl.textContent = "Pending";
        if (sentAtEl) sentAtEl.innerHTML = "-";
        if (respondedAtEl) respondedAtEl.innerHTML = "-";
        if (expiresAtEl) expiresAtEl.innerHTML = "-";

        if (menuImageEl) {
            menuImageEl.src = "";
            menuImageEl.style.display = "none";
        }
        if (menuImageFallbackEl) {
            menuImageFallbackEl.style.display = "flex";
        }

        setButtonsEnabled(false);
        return;
    }

    currentInvitation = invitation;

    const menu = invitation.menu || {};
    const vendor = invitation.vendor || {};
    const status = invitation.status || "Pending";
    const token = tokenValue(invitation);

    setBadge(statusBadgeEl, status);

    if (todayStatusEl) todayStatusEl.textContent = status;
    if (todayStatusTextEl) {
        todayStatusTextEl.textContent =
            status === "Accepted"
                ? "Your lunch has been confirmed"
                : status === "Declined"
                    ? "You declined today's invitation"
                    : "Waiting for your response";
    }

    if (tokenNumberEl) tokenNumberEl.textContent = token;
    if (tokenTextEl) {
        tokenTextEl.textContent =
            status === "Accepted"
                ? "Your token for today"
                : "No token generated yet";
    }

    if (menuNameEl) menuNameEl.textContent = menu.name || "-";
    if (menuCategoryEl) menuCategoryEl.textContent = menu.category || "-";
    if (vendorNameEl) vendorNameEl.textContent = vendor.name || "-";
    if (vendorEmailEl) vendorEmailEl.textContent = vendor.email || "-";

    if (menuTitleEl) menuTitleEl.textContent = menu.name || "Menu Item";
    if (menuDescriptionEl) menuDescriptionEl.textContent = menu.description || "No description available.";
    if (menuPriceEl) menuPriceEl.textContent = `₹${menu.price ?? 0}`;
    if (menuCategory2El) menuCategory2El.textContent = menu.category || "-";
    if (menuVendorEl) menuVendorEl.textContent = vendor.name || "-";

    if (invitationStatusEl) invitationStatusEl.textContent = status || "Pending";
    if (sentAtEl) sentAtEl.innerHTML = formatDateTime(invitation.sentAt || invitation.createdAt);
    if (respondedAtEl) respondedAtEl.innerHTML = formatDateTime(invitation.respondedAt);
    if (expiresAtEl) expiresAtEl.innerHTML = formatDateTime(invitation.expiresAt);

    if (menuImageEl && menuImageFallbackEl) {
        if (menu.image) {
            menuImageEl.src = menu.image;
            menuImageEl.alt = menu.name || "Menu Item";
            menuImageEl.style.display = "block";
            menuImageFallbackEl.style.display = "none";
        } else {
            menuImageEl.src = "";
            menuImageEl.style.display = "none";
            menuImageFallbackEl.style.display = "flex";
        }
    }

    const canEdit = Boolean(invitation.canEdit);
    setButtonsEnabled(canEdit);

    if (editResponseBtn) {
        editResponseBtn.disabled = !canEdit;
        editResponseBtn.style.opacity = canEdit ? "1" : "0.6";
        editResponseBtn.style.cursor = canEdit ? "pointer" : "not-allowed";
    }

    if (acceptBtn) acceptBtn.textContent = status === "Accepted" ? "Accepted" : "Accept";
    if (declineBtn) declineBtn.textContent = status === "Declined" ? "Declined" : "Decline";

    if (currentOrder && status === "Accepted") {
        if (tokenTextEl) tokenTextEl.textContent = "Your token for today";
    }
}

function attachActionHandlers() {
    if (logoutBtn) {
        logoutBtn.addEventListener("click", () => {
            localStorage.removeItem("token");
            localStorage.removeItem("user");
            window.location.href = "index.html";
        });
    }

    if (editResponseBtn) {
        editResponseBtn.addEventListener("click", openModal);
    }

    if (closeModalBtn) {
        closeModalBtn.addEventListener("click", closeModal);
    }

    if (modalOverlay) {
        modalOverlay.addEventListener("click", (e) => {
            if (e.target === modalOverlay) closeModal();
        });
    }

    document.addEventListener("keydown", (e) => {
        if (e.key === "Escape") closeModal();
    });

    const respond = async (status) => {
        if (isUpdating) return;

        if (!currentInvitation) {
            showToast("No invitation available.", "error");
            return;
        }

        if (!currentInvitation.canEdit) {
            showToast("This invitation has expired.", "error");
            return;
        }

        isUpdating = true;
        setButtonsEnabled(false);

        try {
            const res = await fetch(
                `${API}/faculty/response/${currentInvitation.id}`,
                {
                    method: "PUT",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${token}`,
                    },
                    body: JSON.stringify({ status }),
                }
            );

            const data = await res.json();

            if (!res.ok || !data.success) {
                throw new Error(data.message || "Failed to update response");
            }

            showToast(data.message || "Response updated successfully.", "success");
            closeModal();
            await Promise.all([loadDashboard(), loadHistory()]);
        } catch (err) {
            console.error(err);
            showToast(err.message || "Failed to update response", "error");
        } finally {
            isUpdating = false;
            setButtonsEnabled(Boolean(currentInvitation?.canEdit));
        }
    };

    if (acceptBtn) {
        acceptBtn.addEventListener("click", () => respond("Accepted"));
    }

    if (declineBtn) {
        declineBtn.addEventListener("click", () => respond("Declined"));
    }

    if (modalAcceptBtn) {
        modalAcceptBtn.addEventListener("click", () => respond("Accepted"));
    }

    if (modalDeclineBtn) {
        modalDeclineBtn.addEventListener("click", () => respond("Declined"));
    }
}

async function loadDashboard() {
    try {
        const res = await fetch(`${API}/faculty/dashboard`, {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        });

        const data = await res.json();

        if (!res.ok || !data.success) {
            throw new Error(data.message || "Failed to load faculty dashboard");
        }

        renderDashboard(data);
    } catch (err) {
        console.error(err);
        showToast(err.message || "Cannot load dashboard", "error");
        renderDashboard({
            faculty: user,
            invitation: null,
            currentOrder: null,
        });
    }
}

async function loadHistory() {
    try {
        const res = await fetch(`${API}/faculty/history`, {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        });

        const data = await res.json();

        if (!res.ok || !data.success) {
            throw new Error(data.message || "Failed to load history");
        }

        renderHistory(data.history || []);
    } catch (err) {
        console.error(err);
        renderEmptyHistory("Failed to load history.");
    }
}

// =============================
// Initial load
// =============================
attachActionHandlers();
closeModal();
loadDashboard();
loadHistory();