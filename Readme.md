it's use to generate secret key
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

<!-- 1. Socket.IO Methods (Server-Side)
Socket.IO is an event-driven library that provides features like automatic reconnection, rooms, and fallbacks. 
io.on('connection', callback): The primary listener for when a new client connects to the server. The callback receives a socket object specific to that user.
socket.emit('event_name', data): Sends a custom event and data to a single specific client.
io.emit('event_name', data): Broadcasts a message to all connected clients.
socket.on('event_name', callback): Listens for a specific custom event sent from the client.
socket.broadcast.emit('event_name', data): Sends a message to every client except the sender.
socket.join('room_name'): Adds the socket to a specific channel or "room" for targeted broadcasting.
io.to('room_name').emit('event_name', data): Sends a message only to clients who have joined a specific room.
socket.on('disconnect', callback): Fires when a client loses connection or closes the tab.  -->

<!-- MONGOOSE METHOD
MessageModel.find()
MessageModel.findById()
MessageModel.findOne()
MessageModel.findByIdAndUpdate()
MessageModel.findByIdAndDelete()
MessageModel.create()
MessageModel.deleteMany()
 -->