document.addEventListener("DOMContentLoaded", function () {
    console.log("DOM loaded. Running initialization functions...");

    let micButton = document.getElementById("microphone-btn");
    let typingButton = document.getElementById("typing-btn");

    if (micButton) micButton.addEventListener("click", () => startConversation("hearing-user"));
    if (typingButton) typingButton.addEventListener("click", () => startConversation("dhh-user"));

    if (document.getElementById("qr-code")) {
        generateQRCode();
    }

    if (window.location.pathname === "/") {
        checkIfMonitor(); // ✅ Only main monitor
    } else {
        checkIfLoggedIn(); // ✅ Everyone else
    }

    setupWebSocket();
    generateQRCode();

    const exitBtn = document.getElementById("exit-button");

    if (exitBtn) {
        exitBtn.addEventListener("click", function () {
            console.log("🚪 Exit button clicked. Redirecting...");
            window.location.href = "/exit/"; // Make sure this matches your Django URL
        });
    }
});

function checkIfLoggedIn() {
    let nameInput = document.getElementById("userName");
    let userName = nameInput ? nameInput.value.trim() : "";
    let userType = sessionStorage.getItem("userType");

    if (!userName) {
        userName = sessionStorage.getItem("userName");
    }

    if (userName && userType) {
        console.log("✅ Logged-in user:", userName, "as", userType);

        if (isMobileDevice()) {
            if (
                window.location.pathname === "/login/" ||
                window.location.pathname === "/"
            ) {
                // ✅ Only redirect from login page (or root)
                if (userType === "hearing-user") {
                    window.location.href = "/speaking/";
                } else if (userType === "dhh-user") {
                    window.location.href = "/typing/";
                }
            }
        } else {
            // 🖥️ Main monitor
            if (window.location.pathname === "/") {
                window.location.href = "/chatroom/";
            }
        }
    } else {
        console.log("❌ No logged-in user detected.");
    }
}

// ✅ Function to Detect Mobile Devices
function isMobileDevice() {
    return /Mobi|Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
}

function checkIfMonitor() {
    if (isMobileDevice()) return; // ✅ Skip this entirely on mobile

    let userName = sessionStorage.getItem("userName");

    if (!userName && window.location.pathname !== "/login/") {
        console.log("🖥️ Monitor: No session yet. Staying idle on /");
        // Don't redirect — just idle
    } else {
        console.log("🖥️ Monitor: Valid session found:", userName);
    }
}

function startConversation(userType) {
    let nameInput = document.getElementById("userName");
    let userName = nameInput ? nameInput.value.trim() : "";

    if (!userName) {
        alert("Please enter your name before proceeding.");
        return;
    }

    // ✅ Store login details
    sessionStorage.setItem("userName", userName);
    sessionStorage.setItem("userType", userType);

    console.log("Logging in:", userName, "as", userType);

    // ✅ Notify the main screen **before** redirecting
    notifyMainScreen(userName, userType);

    // ✅ Redirect accordingly
    if (isMobileDevice()) {
        if (userType === "hearing-user") {
            console.log("Redirecting to speaking page...");
            setTimeout(() => {
                window.location.href = "/speaking/";
            }, 300); // Delay helps ensure socket message is sent
        } else {
            console.log("Redirecting to typing page...");
            setTimeout(() => {
                window.location.href = "/typing/";
            }, 300);
        }
    } else {
        console.log("Main monitor detected.");
        sessionStorage.setItem("monitorLoggedIn", "true");
    }
}

function notifyMainScreen(userName, userType, retries = 5) {
    if (socket && socket.readyState === WebSocket.OPEN) {
        const data = JSON.stringify({
            event: "user_joined",
            user: userName,
            user_type: userType
        });
        socket.send(data);
        console.log("✅ Notified monitor of user join.");
    } else if (retries > 0) {
        console.log("⏳ Waiting for WebSocket to open...");
        setTimeout(() => {
            notifyMainScreen(userName, userType, retries - 1);
        }, 500);
    } else {
        console.warn("❌ Could not notify monitor. WebSocket never connected.");
    }
}



document.getElementById("qr-code-index")
document.getElementById("qr-code-chatroom")
function generateQRCode() {
    let qrIndex = document.getElementById("qr-code-index");
    let qrChatroom = document.getElementById("qr-code-chatroom");

    if (qrIndex) {
        console.log("Generating QR Code for Index...");
        qrIndex.innerHTML = ""; // ✅ Clear previous QR code
        try {
            new QRCode(qrIndex, {
                text: window.location.origin + "/login/", 
                width: 200,
                height: 200
            });
            console.log("QR Code (Index) generated successfully.");
        } catch (error) {
            console.error("Error generating QR Code for Index:", error);
        }
    }

    if (qrChatroom) {
        console.log("Generating QR Code for Chatroom...");
        qrChatroom.innerHTML = ""; // ✅ Clear previous QR code
        try {
            new QRCode(qrChatroom, {
                text: window.location.origin + "/login/",
                width: 100,
                height: 100
            });
            console.log("QR Code (Chatroom) generated successfully.");
        } catch (error) {
            console.error("Error generating QR Code for Chatroom:", error);
        }
    }

    if (!qrIndex && !qrChatroom) {
        console.error("QR container not found!");
    }
}
// ✅ WebSocket Initialization

let socket;
let socketInitialized = false;

function setupWebSocket() {
    console.log('Initializing WebSocket...');
    let wsProtocol = window.location.protocol === "https:" ? "wss" : "ws";
    let wsUrl = `${wsProtocol}://${window.location.host}/ws/chatroom/`;

    socket = new WebSocket(wsUrl);

    socket.onopen = function () {
        console.log("✅ WebSocket connected!");
        socketInitialized = true;
    };

    socket.onmessage = function (event) {
        let data = JSON.parse(event.data);

        // ✅ Handle login event
        if (data.event === "user_joined") {
            console.log(`📲 User joined: ${data.user} (${data.user_type})`);

            if (window.location.pathname === "/") {
                console.log("🖥️ Main monitor redirecting to chatroom...");
                window.location.href = "/chatroom/";
            }
            return;
        }

        // ✅ Otherwise, treat as chat message
        displayMessage(data.user, data.message, data.user_type);
    };

    socket.onerror = function (error) {
        console.error("❌ WebSocket error:", error);
    };

    socket.onclose = function () {
        console.warn("⚠️ WebSocket disconnected. Falling back to polling...");
        setInterval(fetchMessages, 3000);
    };
}

let formData = new FormData();
formData.append("audio", audioBlob, "recording.wav");

fetch("/api/chat/speech_to_text_vosk/", {
    method: "POST",
    body: formData
})

function fetchMessages() {
    fetch("/api/chat/messages/")
        .then(response => response.json())
        .then(messages => {
            let chatDisplay = document.getElementById("chat_display");
            chatDisplay.innerHTML = "";  // Clear existing messages

            messages.forEach(msg => {
                if (msg.user && msg.message) {
                    displayMessage(msg.user, msg.message, msg.user_type);
                }
            });

            chatDisplay.scrollTop = chatDisplay.scrollHeight;
        })
        .catch(error => console.error("Error fetching messages:", error));
}

// ✅ Display Message in Chatroom
function displayMessage(user, message, userType) {
    let chatDisplay = document.getElementById("chat_display");
    let messageElement = document.createElement("p");
    messageElement.textContent = `${user}: ${message}`;
    messageElement.style.color = userType === "hearing-user" ? "blue" : "green";
    messageElement.style.fontWeight = "bold";

    chatDisplay.appendChild(messageElement);
    chatDisplay.scrollTop = chatDisplay.scrollHeight;
}

// ✅ Request Microphone Access
function requestMicrophonePermission() {
    if (!("webkitSpeechRecognition" in window)) {
        alert("Your browser does not support speech recognition.");
        return;
    }

    let testRecognition = new webkitSpeechRecognition();
    testRecognition.start();
    testRecognition.onend = function () {
        console.log("Microphone permission granted.");
    };
    testRecognition.onerror = function (event) {
        if (event.error === "not-allowed") {
            alert("Microphone access is required for speech input. Please enable it in your browser settings.");
        }
    };
}


document.addEventListener("DOMContentLoaded", function () {
    let reactions = {
        "good-btn": "👍",
        "smile-btn": "😊",
        "laugh-btn": "😂",
        "angry-btn": "😠"
    };

    for (let id in reactions) {
        let button = document.getElementById(id);
        if (button) {
            button.addEventListener("click", function () {
                sendReaction(reactions[id]);
            });
        }
    }
});

let mediaRecorder;
let audioChunks = [];

function setupHoldToSpeakButton() {
    const button = document.getElementById("speak-button");

    if (!button) return;

    button.addEventListener("pointerdown", startSpeaking);
    button.addEventListener("pointerup", stopSpeaking);
    button.addEventListener("pointerleave", stopSpeaking);  // Stop if finger/mouse leaves button
}

function startSpeaking() {
    console.log("Recording started...");

    navigator.mediaDevices.getUserMedia({ audio: true }).then(stream => {
        mediaRecorder = new MediaRecorder(stream);
        audioChunks = [];

        mediaRecorder.ondataavailable = event => {
            audioChunks.push(event.data);
        };

        mediaRecorder.onstop = () => {
            const audioBlob = new Blob(audioChunks, { type: "audio/wav" });
            sendAudioToWhisper(audioBlob);
        };

        mediaRecorder.start();
    }).catch(error => {
        console.error("Microphone access denied:", error);
        alert("Microphone access is required to speak.");
    });
}

function stopSpeaking() {
    if (mediaRecorder && mediaRecorder.state === "recording") {
        console.log("Recording stopped.");
        mediaRecorder.stop();
    }
}

function sendAudioToVosk(audioBlob) {
    const formData = new FormData();
    formData.append("audio", audioBlob, "recording.wav");

    fetch("/api/chat/speech_to_text/", {
        method: "POST",
        body: formData,
    })
    .then(response => response.json())
    .then(data => {
        if (data.text) {
            sendMessage(data.text, "hearing-user");
        } else {
            console.error("Speech-to-text error:", data.error);
        }
    })
    .catch(error => console.error("Failed to send audio:", error));
}


function sendMessage(message, userType) {
    let userName = sessionStorage.getItem("userName") || (userType === "hearing-user" ? "Hearing User" : "DHH User");

    let data = {
        user: userName,
        message: message,
        user_type: userType
    };

    // Send via WebSocket
    if (socket && socket.readyState === WebSocket.OPEN) {
        socket.send(JSON.stringify(data));
    }

    // Save to DB
    fetch("/api/chat/save/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data)
    });
}
