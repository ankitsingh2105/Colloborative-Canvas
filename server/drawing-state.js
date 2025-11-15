
const individualUndoRedoMap = new Map(); // mapping the sokcetID to its current operation, prevent overlapping operations

export function startStroke(socketID, firstPoint) {
  individualUndoRedoMap.set(socketID, [firstPoint]);
}

export function appendToStroke(socketID, point) {
  if (!individualUndoRedoMap.has(socketID)) return;
  individualUndoRedoMap.get(socketID).push(point);
}

export function completeStroke(socketID) {
  const current = individualUndoRedoMap.get(socketID);
  if (!current || current.length === 0) return null;

  const eventActionObject = {
    socketID,
    operation_id: Date.now() + socketID,
    color: current[0].color,
    strokeSize: current[0].strokeSize,
    playerName: current[0].playerName,
    coordinate_batch_array: current,
  };

  individualUndoRedoMap.set(socketID, []);
  return eventActionObject;
}

export { individualUndoRedoMap };
