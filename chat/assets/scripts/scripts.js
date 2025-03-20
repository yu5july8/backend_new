// Ensure DOM is fully loaded before running any scripts
document.addEventListener("DOMContentLoaded", function () {
    console.log("DOM loaded. Running initialization functions...");

    let micButton = document.getElementById("microphone-btn");
    let typingButton = document.getElementById("typing-btn");

    if (micButton) micButton.addEventListener("click", () => startConversation("hearing-user"));
    if (typingButton) typingButton.addEventListener("click", () => startConversation("dhh-user"));

    if (document.getElementById("qr-code")) {
        generateQRCode();
    }

    if (window.location.pathname !== "/") {
        checkIfLoggedIn();
        checkIfMonitor();
    }

    setupWebSocket(); // ✅ Enable WebSocket connection
});

// ✅ Ensure chatroom opens ONLY after login
function checkIfLoggedIn() {
    let userName = sessionStorage.getItem("userName");
    let userType = sessionStorage.getItem("userType");

    if (userName && userType) {
        console.log("User detected:", userName, "as", userType);

        if (isMobileDevice()) {
            // ✅ Only redirect AFTER the user selects input type
            if (window.location.pathname === "/login/") {
                if (userType === "hearing-user") {
                    console.log("Redirecting to speaking page...");
                    window.location.href = "/speaking/";
                } else {
                    console.log("Redirecting to typing page...");
                    window.location.href = "/typing/";
                }
            }
        } else {
            // ✅ Main monitor should move to chatroom
            if (window.location.pathname === "/") {
                console.log("Main monitor detected, moving to chatroom...");
                window.location.href = "/chatroom/";
            }
        }
    }
}

// ✅ Function to Detect Mobile Devices
function isMobileDevice() {
    return /Mobi|Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
}

// ✅ Store user's name and input method, then redirect accordingly
function startConversation(userType) {
    let nameInput = document.getElementById("your_name");
    let userName = nameInput ? nameInput.value.trim() : "";

    if (!userName) {
        alert("Please enter your name before proceeding.");
        return;
    }

    // ✅ Store login details
    sessionStorage.setItem("userName", userName);
    sessionStorage.setItem("userType", userType);

    console.log("Logging in:", userName, "as", userType);

    // ✅ Redirect mobile users to the correct page
    if (isMobileDevice()) {
        if (userType === "hearing-user") {
            console.log("Redirecting to speaking page...");
            window.location.href = "/speaking/";
        } else {
            console.log("Redirecting to typing page...");
            window.location.href = "/typing/";
        }
    } else {
        console.log("Main monitor detected.");
        sessionStorage.setItem("monitorLoggedIn", "true"); // ✅ Track that the main screen is in use
    }

    // ✅ Notify the main screen to update
    notifyMainScreen(userName, userType);
}

// ✅ Function to notify main screen that a user has joined
function notifyMainScreen(userName, userType) {
    if (socket.readyState === WebSocket.OPEN) {
        let data = JSON.stringify({
            event: "user_joined",
            user: userName,
            user_type: userType
        });
        socket.send(data);
    }
}

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

// ✅ WebSocket Setup for Real-Time Chat
let socket;
function setupWebSocket() {
    socket = new WebSocket("ws://127.0.0.1:8000/ws/chatroom/");

    socket.onmessage = function (event) {
        let data = JSON.parse(event.data);
        displayMessage(data.user, data.message, data.user_type);
    };

    socket.onclose = function () {
        console.warn("WebSocket disconnected. Falling back to polling...");
        setInterval(fetchMessages, 3000); // Polling fallback every 3 seconds
    };
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

// ✅ Function to Send Reaction
function sendReaction(emoji) {
    console.log("Sending reaction:", emoji);
    sendMessage(emoji, "dhh-user"); // ✅ Reaction messages now work
}


// ✅ Function to Start & Stop Speaking
function startSpeaking() {
    if ("webkitSpeechRecognition" in window) {
        console.log("Using browser speech recognition...");
        recognition.start();
    } else {
        console.log("Browser does not support speech recognition. Using AI...");
        requestMicrophoneAndUpload();
    }
}

// ✅ Request Microphone & Upload to Whisper API
function requestMicrophoneAndUpload() {
    navigator.mediaDevices.getUserMedia({ audio: true })
        .then(stream => {
            let mediaRecorder = new MediaRecorder(stream);
            let audioChunks = [];

            mediaRecorder.ondataavailable = event => {
                audioChunks.push(event.data);
            };

            mediaRecorder.onstop = () => {
                let audioBlob = new Blob(audioChunks, { type: "audio/wav" });
                sendAudioToWhisper(audioBlob);
            };

            mediaRecorder.start();
            setTimeout(() => {
                mediaRecorder.stop();
            }, 5000);
        })
        .catch(error => {
            console.error("Microphone access denied:", error);
            alert("Microphone access is required for speech input.");
        });
}

// ✅ Send Audio to Django API (Whisper)
function sendAudioToWhisper(audioBlob) {
    let formData = new FormData();
    formData.append("audio", audioBlob, "recording.wav");

    fetch("/api/chat/speech_to_text/", {
        method: "POST",
        body: formData
    })
    .then(response => response.json())
    .then(data => {
        if (data.text) {
            sendMessage(data.text, "hearing-user");
        } else {
            console.error("Error from API:", data.error);
        }
    })
    .catch(error => console.error("Error sending audio:", error));
}