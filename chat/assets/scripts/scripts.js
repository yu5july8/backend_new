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
    console.log("DOM fully loaded. Running QR Code generator...");
    generateQRCode();
});

// ✅ Ensure chatroom opens ONLY after login
function checkIfLoggedIn() {
    let nameInput = document.getElementById("userName");
    let userName = nameInput ? nameInput.value.trim() : "";
    let userType = sessionStorage.getItem("userType");

    if (userName && userType) {
        console.log("User detected:", userName, "as", userType);

        if (isMobileDevice()) {
            // ✅ If user is on the login page and has selected an input method, redirect them
            if (window.location.pathname === "/login/") {
                if (userType === "hearing-user") {
                    console.log("Redirecting to speaking page...");
                    window.location.href = "/speaking/";
                } else if (userType === "dhh-user") {
                    console.log("Redirecting to typing page...");
                    window.location.href = "/typing/";
                }
            }
        } else {
            // ✅ Ensure main monitor moves to chatroom when a user logs in
            if (window.location.pathname === "/") {
                console.log("Main monitor detected, moving to chatroom...");
                window.location.href = "/chatroom/";
            }
        }
    } else {
        console.log("No logged-in user detected.");
    }
}

// ✅ Function to Detect Mobile Devices
function isMobileDevice() {
    return /Mobi|Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
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

// ✅ Store user's name and input method, then redirect accordingly
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

// // ✅ Function to notify main screen that a user has joined
// function notifyMainScreen(userName, userType) {
//     if (socket.readyState === WebSocket.OPEN) {
//         let data = JSON.stringify({
//             event: "user_joined",
//             user: userName,
//             user_type: userType
//         });
//         socket.send(data);
//     }
// }
// ✅ Retry logic for notifying main screen
function notifyMainScreen(userName, userType, attempt = 1) {
    const MAX_ATTEMPTS = 5;

    if (socket && socket.readyState === WebSocket.OPEN) {
        const data = JSON.stringify({
            event: "user_joined",
            user: userName,
            user_type: userType
        });
        socket.send(data);
        console.log("✅ Notified main screen about login!");
    } else {
        if (attempt <= MAX_ATTEMPTS) {
            console.log(`🔁 WebSocket not ready. Retrying in 1 second... (Attempt ${attempt})`);
            setTimeout(() => {
                notifyMainScreen(userName, userType, attempt + 1);
            }, 1000);
        } else {
            console.error("❌ Failed to notify main screen after multiple attempts.");
        }
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

// ✅ WebSocket Setup for Real-Time Chat
// let socket;

// function setupWebSocket() {
//     console.log('listen');
//     let wsProtocol = window.location.protocol === "https:" ? "wss" : "ws";
//     let wsUrl = `${wsProtocol}://${window.location.host}/ws/chatroom/`;
    
//     socket = new WebSocket(wsUrl);

//     socket.onopen = function () {
//         console.log("WebSocket connected successfully!");
//     };

//     socket.onmessage = function (event) {
//         let data = JSON.parse(event.data);
//         displayMessage(data.user, data.message, data.user_type);
//     };

//     socket.onerror = function (error) {
//         console.error("WebSocket error:", error);
//     };

//     socket.onclose = function () {
//         console.warn("WebSocket disconnected. Falling back to polling...");
//         setInterval(fetchMessages, 3000); // Polling fallback every 3 seconds
//     };
// }

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

function fetchMessages() {
    fetch("/api/chat/messages/")
        .then(response => response.json())
        .then(messages => {
            let chatDisplay = document.getElementById("chat_display");
            chatDisplay.innerHTML = "";  // Clear existing messages

            messages.forEach(msg => {
                displayMessage(msg.user, msg.text, msg.user_type);
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

let recognition;
let mediaRecorder;
let audioChunks = [];
// ✅ Declare global recognition instance

if ("webkitSpeechRecognition" in window) {
    recognition = new webkitSpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;

    recognition.onresult = function (event) {
        let transcript = event.results[0][0].transcript;
        console.log("Recognized Speech:", transcript);
        sendMessage(transcript, "hearing-user"); // ✅ Send recognized speech to chat
    };

    recognition.onerror = function (event) {
        console.error("Speech recognition error:", event.error);
    };

    recognition.onend = function () {
        console.log("Speech recognition ended.");
    };
} else {
    console.warn("Browser does not support Speech Recognition.");
}

// ✅ Start Speaking
function startSpeaking() {
    if (!recognition) {
        alert("Speech recognition is not supported in this browser.");
        return;
    }

    console.log("Starting speech recognition...");
    recognition.start();
}

// ✅ Stop Speaking
function stopSpeaking() {
    if (!recognition) return;
    console.log("Stopping speech recognition...");
    recognition.stop();
}

// ✅ Function to request microphone & upload to AI speech-to-text API
function requestMicrophoneAndUpload() {
    navigator.mediaDevices.getUserMedia({ audio: true })
        .then(stream => {
            mediaRecorder = new MediaRecorder(stream);
            audioChunks = [];

            mediaRecorder.ondataavailable = event => {
                audioChunks.push(event.data);
            };

            mediaRecorder.onstop = () => {
                let audioBlob = new Blob(audioChunks, { type: "audio/wav" });
                sendAudioToWhisper(audioBlob);
            };

            mediaRecorder.start();
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
            sendMessage(data.text, "hearing-user"); // ✅ Send recognized text as a message
        } else {
            console.error("Error from API:", data.error);
        }
    })
    .catch(error => console.error("Error sending audio:", error));
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