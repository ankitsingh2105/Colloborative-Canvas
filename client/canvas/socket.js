import {backendlink} from "../backendlink.js";
console.log("Backend Link:", backendlink);
function createSocket(roomID, username) {
  const socket = io(backendlink, {
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
