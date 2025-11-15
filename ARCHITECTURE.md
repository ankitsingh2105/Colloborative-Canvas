# ARCHITECTURE.md

This document describes the architecture based strictly on the existing code.

---

## Data Flow Diagram (User → Server → Clients → Canvas)

1. **User Interaction**
   - User draws on canvas.
   - `pointerdown` → emits `beginPath`
   - `pointermove` → emits `draw`
   - `pointerup/out` → emits `stopDrawing`
   - Coordinates are normalized before sending.

2. **Server Handling**
   - Stores ongoing stroke in `individualUndoRedoMap`.
   - `startStroke` records first point, `appendToStroke` adds more.
   - On `stopDrawing`, server creates `eventActionObject` containing all stroke points.
   - Server broadcasts events to everyone in the room.

3. **Client Rendering**
   - On `beginPath`: create path + floating label.
   - On `draw`: append points and render using smoothing (`smoothDrawUsingLast3`).
   - On `stopDrawing`: push stroke into `globalUndoStack` and reset redo.
   - Undo/redo triggers full canvas redraw using history.

This flow ensures every user receives all strokes in real-time with consistent rendering.

---

## WebSocket Protocol

The application uses a simple, event-driven WebSocket protocol where the client emits drawing actions and the server relays them to every user in the same room. Each event directly maps to a specific UI or canvas update, ensuring all clients stay synchronized in real time.

### Client → Server  
Events sent from the user’s browser to the server:

- **`beginPath`**  
  Sent when the user starts drawing. Includes stroke color, normalized coordinates, stroke size, room ID, and player name.

- **`draw`**  
  Sent on every pointer movement while drawing. Contains updated normalized coordinates and styling information.

- **`stopDrawing`**  
  Sent when the user stops drawing. Signals the server to finalize the stroke and create a stroke object.

- **`clear`, `undo`, `redo`**  
  Triggered when a user clicks the respective buttons or keyboard shortcuts. No payload; server handles broadcasting.

- **`ping-check`**  
  Sent every second with a timestamp to measure latency.

### Server → Clients  
Events broadcast to all users in the room:

- **`beginPath`, `draw`, `stopDrawing`**  
  Forwarded versions of client events used to update other users' canvases in real time.

- **`clear`, `undo`, `redo`**  
  Tell all clients to apply a global operation to maintain consistent canvas state.

- **`user-joined`**  
  Notifies clients that a new player entered, sending the updated player list.

- **`user-disconnected`**  
  Announces that a user left, allowing clients to clean up active strokes and UI indicators.

- **`pong-check`**  
  Server responds to `ping-check` so clients can calculate real-time ping.

This protocol keeps all users synchronized by broadcasting every significant action that affects the canvas or the room state.


---

## Undo / Redo Strategy

- Undo/redo history is **client-side only**.
- Server **only triggers** the command by broadcasting `undo`/`redo`.
- `globalUndoStack` stores completed strokes received from server.
- On undo:
  - Last stroke moved to `globalRedoStack`
  - Canvas is redrawn from history.
- On redo:
  - Stroke restored to undo stack and redrawn.

Stroke objects come from server via `eventActionObject`.

---

## Performance Decisions

The system includes several optimizations to keep drawing smooth and responsive, even when multiple users are active.

- **Normalized coordinates**  
  All coordinates are converted into fractional values before being sent. This reduces payload size and ensures strokes scale correctly across different screen sizes.

- **Stroke batching on the server**  
  Instead of processing tiny updates individually, the server groups points of a stroke using `individualUndoRedoMap`. A full stroke is sent only after completion, reducing unnecessary overhead.

- **3-point smoothing algorithm**  
  Rendering uses `smoothDrawUsingLast3`, which creates quadratic curves between points. This reduces jitter from fast mouse movements and makes strokes look more natural.

- **Active stroke separation**  
  The client keeps `activeStroke` separate from `globalUndoStack`, ensuring that undo/redo operations do not interfere with live drawing happening at the same time.

- **Ping/pong latency checks**  
  A simple `ping-check` and `pong-check` loop provides real-time latency feedback without affecting core performance or drawing flow.

---


## Conflict Resolution

The system avoids drawing conflicts by keeping each user's actions separate and ensuring all clients process events in the correct order.

- **Room isolation**  
  Each socket joins a specific room, so drawing events and updates only reach users in the same room, preventing cross-room interference.

- **Per-user stroke tracking**  
  The client tracks active strokes in `activeStroke`, while the server maintains in-progress strokes in `individualUndoRedoMap`. This prevents strokes from different users from mixing, even when they draw simultaneously.

- **Ordered event flow**  
  All drawing events (`beginPath`, `draw`, `stopDrawing`) are broadcast in sequence. Clients append points exactly as they arrive, keeping the shape of each stroke consistent.

- **Undo/redo synchronization**  
  When any user triggers undo or redo, the server broadcasts the same event to all clients, ensuring everybody updates their canvas history together.

- **Floating labels**  
  Each user’s drawing position is tagged with a floating label based on their `socketID`, allowing clients to distinguish who is drawing and avoid confusion during busy sessions.

---

