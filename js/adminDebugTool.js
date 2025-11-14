// -----------------------------------------------------------
// adminDebugTool.js
// Standalone admin debugging helper
// No logic changes, no integrations required
// -----------------------------------------------------------

export const AdminDebug = {

    log(title, data) {
        try {
            console.group(`🛠️ ADMIN DEBUG → ${title}`);
            console.log(JSON.parse(JSON.stringify(data)));
            console.groupEnd();
        } catch (e) {
            console.group(`🛠️ ADMIN DEBUG → ${title}`);
            console.log(data);
            console.groupEnd();
        }
    },

    error(title, err) {
        console.group(`❌ ADMIN ERROR → ${title}`);
        console.error(err);
        console.groupEnd();

        // Optional red popup on screen (non-blocking)
        try {
            const popup = document.createElement("div");
            popup.innerText = `Admin Error: ${title}`;
            popup.style.position = "fixed";
            popup.style.bottom = "20px";
            popup.style.right = "20px";
            popup.style.padding = "10px 16px";
            popup.style.background = "#e11d48";
            popup.style.color = "white";
            popup.style.fontFamily = "monospace";
            popup.style.borderRadius = "8px";
            popup.style.zIndex = "999999";
            document.body.appendChild(popup);
            setTimeout(() => popup.remove(), 5000);
        } catch (_) {}
    },

    inspectSession(session) {
        this.log("SESSION / JWT INFO", {
            user_id: session?.data?.session?.user?.id,
            email: session?.data?.session?.user?.email,
            jwt_role:
                session?.data?.session?.user?.user_metadata?.role ||
                session?.data?.session?.user?.role ||
                "ROLE NOT FOUND"
        });
    },

    inspectRequest(actionName, payload) {
        this.log(`${actionName} → REQUEST`, payload);
    },

    inspectResponse(actionName, response) {
        if (response?.error) {
            this.error(`${actionName} → SUPABASE ERROR`, response.error);
        } else {
            this.log(`${actionName} → RESPONSE OK`, response);
        }
    },

    inspectAPICall(actionName, url, requestPayload, responseData) {
        this.log(`${actionName} → API URL`, url);
        this.log(`${actionName} → API Payload`, requestPayload);

        if (responseData?.error || responseData?.message?.includes("error")) {
            this.error(`${actionName} → API ERROR`, responseData);
        } else {
            this.log(`${actionName} → API Response OK`, responseData);
        }
    }
};
