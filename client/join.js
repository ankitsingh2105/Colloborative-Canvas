document.getElementById('joinBtn').addEventListener('click', () => {
    const username = document.getElementById('username').value.trim();
    const room = document.getElementById('room').value.trim();
    const message = document.getElementById('message');

    if (!username || !room) {
        message.textContent = "Please enter both username and room ID.";
        return;
    }

    window.location.href =
        `/canvas/canvas.html?room=${room}&user=${username}`;
});


const container = document.getElementById("sessionItem");

const saved = localStorage.getItem("colloborative-canvas-session");
if (!saved) {
    container.innerHTML = `<p style="opacity:0.6">No saved session found.</p>`;
} else {
    const sessionArr = JSON.parse(saved);
    console.log("Loaded sessions:", sessionArr);

    if (!Array.isArray(sessionArr) || sessionArr.length === 0) {
        container.innerHTML = `<p style="opacity:0.6">No saved session found.</p>`;
    } else {
        sessionArr.forEach((sessionObj, index) => {
            const li = document.createElement("li");
            li.textContent = `${index + 1}. Room: ${sessionObj.sessionId},  Time : ${sessionObj.time}`;

            li.style.cursor = "pointer";
            li.style.padding = "10px";
            li.style.border = "1px solid #ccc";
            li.style.marginBottom = "10px";
            li.style.borderRadius = "6px";
            li.style.listStyle = "none";

            li.addEventListener("click", () => {
                const username = document.getElementById('username').value.trim();
                const room = document.getElementById('room').value.trim();

                if (username === "" || room === "") {
                    alert("Please enter both username and room ID.");
                    return;
                }
                window.location.href =
                    `/canvas/canvas.html?room=${room}&user=${username}&loadSession=${index}`;
            });

            container.appendChild(li);
        });
    }
}
