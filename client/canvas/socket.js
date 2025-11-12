
let backendLink = "http://192.168.0.103:3000";
function createSocket(roomID, username) {
  const socket = io(backendLink, {
    autoConnect: false,
    transports: ["websocket"],
    query: {
      roomID,
      username
    }
  });

  return socket;
}

const params = new URLSearchParams(window.location.search);
const roomID = params.get("room");
const username = params.get("user");
// Initialize and connect socket
const socket = createSocket(roomID, username);
socket.connect();

// Connection events
socket.on("connect", () => {
  console.log(`✅ Connected as ${username} to room ${roomID}`);
});

socket.on("connect_error", (err) => {
  console.error("⚠️ Connection error:", err.message);
});

export { socket };
