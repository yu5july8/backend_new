// Ensure DOM is fully loaded before running any scripts
document.addEventListener("DOMContentLoaded", function () {
    console.log("This is")
    console.log("DOM loaded. Running initialization functions...");

    let startChatButton = document.getElementById("start-chat-btn");
    let micButton = document.getElementById("microphone-btn");
    let typingButton = document.getElementById("typing-btn");

    if (startChatButton) startChatButton.addEventListener("click", startChat);
    if (micButton) micButton.addEventListener("click", () => startConversation("hearing-user"));
    if (typingButton) typingButton.addEventListener("click", () => startConversation("dhh-user"));

    if (document.getElementById("qr-code")) {
        generateQRCode();
    }

    checkIfLoggedIn();
    checkIfMonitor();
    setupWebSocket(); // ✅ Enable WebSocket connection
});

// ✅ Function to generate QR code dynamically
function generateQRCode() {
    let qrContainer = document.getElementById("qr-code");
    if (qrContainer) {
        console.log("Generating QR Code...");
        qrContainer.innerHTML = "";

        try {
            new QRCode(qrContainer, {
                text: window.location.origin + "/login/",
                width: 200,
                height: 200
            });
            console.log("QR Code generated successfully.");
        } catch (error) {
            console.error("Error generating QR Code:", error);
        }
    } else {
        console.error("QR container not found!");
    }
}

function checkIfMonitor() {
    let userName = sessionStorage.getItem("userName");

    if (!userName) {
        console.log("Monitor detected, redirecting to login...");
        
        // ✅ Prevent continuous redirects
        if (window.location.pathname !== "/login/") {
            window.location.href = "/login/";
        }
    } else {
        console.log("Valid user detected:", userName);
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

// ✅ Fetch Messages from API (Fallback if WebSocket fails)
function fetchMessages() {
    fetch("/api/chat/messages/")
        .then(response => response.json())
        .then(messages => {
            let chatDisplay = document.getElementById("chat_display");
            chatDisplay.innerHTML = "";

            messages.forEach(msg => {
                displayMessage(msg.user, msg.text, msg.user_type);
            });

            chatDisplay.scrollTop = chatDisplay.scrollHeight;
        })
        .catch(error => console.error("Error fetching messages:", error));
}

// ✅ Function to start chat from index.html
function startChat() {
    console.log("Redirecting to login page...");
    window.location.href = "/login/";
}

// ✅ Store user's name and input method, then request microphone if necessary
function startConversation(userType) {
    let nameInput = document.getElementById("your_name");
    let userName = nameInput ? nameInput.value.trim() : "";

    if (!userName) {
        alert("Please enter your name before proceeding.");
        return;
    }

    sessionStorage.setItem("userName", userName);
    sessionStorage.setItem("userType", userType);

    console.log("Logging in:", userName, "as", userType);

    if (userType === "hearing-user") {
        requestMicrophonePermission();
    }

    window.location.href = "/chatroom/";
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

// ✅ Function to Start & Stop Speaking (Handles Browser & AI Processing)
function startSpeaking() {
    if ("webkitSpeechRecognition" in window) {
        console.log("Using local speech recognition...");
        recognition.start();
    } else {
        console.log("Browser does not support speech recognition. Using AI processing...");
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

// ✅ Function to send a typed message
function typingSentence() {
    let inputField = document.getElementById("type_chat_box");
    if (inputField) {
        let message = inputField.value.trim();
        if (message !== "") {
            sendMessage(message, "dhh-user");
            inputField.value = "";
        }
    }
}

// ✅ Function to send a message (Handles Both Typing & Speech)
function sendMessage(message, userType) {
    let userName = sessionStorage.getItem("userName") || (userType === "hearing-user" ? "Hearing User" : "DHH User");

    let data = JSON.stringify({ user: userName, message: message, user_type: userType });

    if (socket.readyState === WebSocket.OPEN) {
        socket.send(data); // ✅ Send via WebSocket
    } else {
        fetch("/api/chat/send/", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: data
        });
    }
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