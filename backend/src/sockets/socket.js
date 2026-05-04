const socketHandler = (io, userSockets) => {
  io.on('connection', (socket) => {
    console.log('A user connected:', socket.id);

    socket.on('register', (userId) => {
      userSockets.set(userId, socket.id);
      console.log(`User ${userId} registered with socket ${socket.id}`);
      
      // Broadcast to everyone else that this user is online
      socket.broadcast.emit('userOnline', userId);

      // Send the current list of online users to this user
      socket.emit('onlineUsers', Array.from(userSockets.keys()));
    });

    socket.on('joinGroup', (groupId) => {
      socket.join(`group_${groupId}`);
    });

    socket.on('typing', ({ senderId, receiverId, groupId }) => {
      if (groupId) {
        socket.to(`group_${groupId}`).emit('typing', senderId);
      } else {
        const receiverSocketId = userSockets.get(receiverId);
        if (receiverSocketId) {
          io.to(receiverSocketId).emit('typing', senderId);
        }
      }
    });

    socket.on('stopTyping', ({ senderId, receiverId, groupId }) => {
      if (groupId) {
        socket.to(`group_${groupId}`).emit('stopTyping', senderId);
      } else {
        const receiverSocketId = userSockets.get(receiverId);
        if (receiverSocketId) {
          io.to(receiverSocketId).emit('stopTyping', senderId);
        }
      }
    });

    socket.on('disconnect', () => {
      console.log('User disconnected:', socket.id);
      for (const [userId, socketId] of userSockets.entries()) {
        if (socketId === socket.id) {
          userSockets.delete(userId);
          io.emit('userOffline', userId);
          break;
        }
      }
    });
  });
};

module.exports = socketHandler;
