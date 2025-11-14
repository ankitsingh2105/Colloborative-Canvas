
let backendLink = "http://192.168.0.103:3000";
// http://192.168.0.124
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

const socket = createSocket(roomID, username);
socket.connect();

socket.on("connect", () => {
  console.log(`✅ Connected as ${username} to room ${roomID}`);
});


export { socket };
