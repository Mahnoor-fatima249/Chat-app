const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Message = require('../models/Message');
const Chat = require('../models/Chat');
const { getRedisClient } = require('../config/redis');

const onlineUsers = new Map();

const initSocket = (io) => {
  io.use(async (socket, next) => {
    try {
      const token =
        socket.handshake.auth.token ||
        socket.handshake.headers.authorization?.split(' ')[1];

      if (!token) {
        return next(new Error('Authentication error'));
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.id);

      if (!user) {
        return next(new Error('User not found'));
      }

      socket.user = user;
      next();
    } catch (err) {
      next(new Error('Authentication error'));
    }
  });

  io.on('connection', async (socket) => {
    console.log(`User connected: ${socket.user.username}`);

    // store socket id
    onlineUsers.set(socket.user._id.toString(), socket.id);

    // update user status in db
    await User.findByIdAndUpdate(socket.user._id, { isOnline: true });

    // broadcast online status
    io.emit('user-online', { userId: socket.user._id });

    // send online users list
    const redis = getRedisClient();
    if (redis) {
      await redis.set(
        `online:${socket.user._id}`,
        socket.id,
        { EX: 86400 }
      );
    }

    // join user's personal room
    socket.join(socket.user._id.toString());

    // handle new message
    socket.on('send-message', async (data, callback) => {
      try {
        const { chatId, text } = data;

        if (!chatId || !text?.trim()) {
          return callback?.({ error: 'Invalid message data' });
        }

        // check if user is participant
        const chat = await Chat.findById(chatId);
        if (!chat) {
          return callback?.({ error: 'Chat not found' });
        }

        const isParticipant = chat.participants.some(
          (p) => p.toString() === socket.user._id.toString()
        );

        if (!isParticipant) {
          return callback?.({ error: 'Not authorized' });
        }

        // create message
        const message = await Message.create({
          chatId,
          sender: socket.user._id,
          text: text.trim(),
          readBy: [socket.user._id],
        });

        // update last message in chat
        await Chat.findByIdAndUpdate(chatId, {
          lastMessage: message._id,
          updatedAt: new Date(),
        });

        const fullMessage = await Message.findById(message._id)
          .populate('sender', '-__v -password')
          .populate('readBy', '-__v -password');

        // emit to all participants
        chat.participants.forEach((participantId) => {
          io.to(participantId.toString()).emit('new-message', fullMessage);
        });

        callback?.({ success: true, data: fullMessage });
      } catch (err) {
        console.error('Send message error:', err.message);
        callback?.({ error: 'Failed to send message' });
      }
    });

    // handle typing indicator
    socket.on('typing', (data) => {
      const { chatId } = data;
      if (!chatId) return;

      socket.to(chatId).emit('user-typing', {
        userId: socket.user._id,
        username: socket.user.username,
        chatId,
      });
    });

    // handle stop typing
    socket.on('stop-typing', (data) => {
      const { chatId } = data;
      if (!chatId) return;

      socket.to(chatId).emit('user-stop-typing', {
        userId: socket.user._id,
        chatId,
      });
    });

    // join a chat room
    socket.on('join-chat', (chatId) => {
      if (chatId) {
        socket.join(chatId);
      }
    });

    // leave a chat room
    socket.on('leave-chat', (chatId) => {
      if (chatId) {
        socket.leave(chatId);
      }
    });

    // handle message read
    socket.on('mark-read', async (data) => {
      try {
        const { chatId, messageId } = data;

        const message = await Message.findById(messageId);
        if (!message) return;

        if (!message.readBy.includes(socket.user._id)) {
          message.readBy.push(socket.user._id);
          await message.save();
        }

        io.to(chatId).emit('message-read', {
          messageId,
          userId: socket.user._id,
          readBy: message.readBy,
        });
      } catch (err) {
        console.error('Mark read error:', err.message);
      }
    });

    // handle disconnect
    socket.on('disconnect', async () => {
      console.log(`User disconnected: ${socket.user.username}`);

      onlineUsers.delete(socket.user._id.toString());

      await User.findByIdAndUpdate(socket.user._id, {
        isOnline: false,
        lastSeen: new Date(),
      });

      io.emit('user-offline', {
        userId: socket.user._id,
        lastSeen: new Date(),
      });

      if (redis) {
        await redis.del(`online:${socket.user._id}`);
      }
    });
  });
};

module.exports = initSocket;
