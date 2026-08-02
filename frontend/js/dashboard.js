// =============================
// Send Today's Menu
// =============================
const sendMenuBtn = document.getElementById("sendMenuBtn");
let isSendingMenu = false;

sendMenuBtn.addEventListener("click", sendMenu);

async function sendMenu() {
    if (isSendingMenu) return;

    isSendingMenu = true;
    sendMenuBtn.disabled = true;

    const originalHTML = sendMenuBtn.innerHTML;
    sendMenuBtn.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> Sending...`;

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
    } finally {
        isSendingMenu = false;
        sendMenuBtn.disabled = false;
        sendMenuBtn.innerHTML = originalHTML;
    }
}