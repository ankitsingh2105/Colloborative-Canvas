const rooms = new Map();

// function to generate randome color for each user - in backeend only
export function getRandomColor() {
  const letters = '0123456789ABCDEF';
  let color = '#';
  for (let i = 0; i < 6; i++) {
    color += letters[Math.floor(Math.random() * 16)];
  }
  return color;
}

export function addPlayerToRoom(roomID, socketID, username) {
  const player = { socketID, username, color: getRandomColor() };

  if (rooms.has(roomID)) {
    rooms.get(roomID).push(player);
  } else {
    rooms.set(roomID, [player]);
  }

  return JSON.stringify(rooms.get(roomID));
}

export function removePlayerFromRoom(roomID, socketID) {
  if (!rooms.has(roomID)) return [];

  const updated = rooms.get(roomID).filter(p => p.socketID !== socketID);
  rooms.set(roomID, updated);
  return updated;
}

export { rooms };
