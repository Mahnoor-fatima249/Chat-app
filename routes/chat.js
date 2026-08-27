const express = require('express');
const Chat = require('../models/Chat');
const Message = require('../models/Message');
const { protect } = require('../middleware/auth');

const router = express.Router();

router.post('/', protect, async (req, res) => {
  try {
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a user ID',
      });
    }

    const isChat = await Chat.findOne({
      isGroupChat: false,
      $and: [
        { participants: { $elemMatch: { $eq: req.user._id } } },
        { participants: { $elemMatch: { $eq: userId } } },
      ],
    })
      .populate('participants', '-__v -password')
      .populate('lastMessage');

    if (isChat) {
      return res.status(200).json({ success: true, data: isChat });
    }

    const chatData = {
      chatName: 'sender',
      isGroupChat: false,
      participants: [req.user._id, userId],
    };

    const createdChat = await Chat.create(chatData);
    const fullChat = await Chat.findById(createdChat._id).populate(
      'participants',
      '-__v -password'
    );

    res.status(201).json({ success: true, data: fullChat });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: err.message });
  }
});

router.get('/', protect, async (req, res) => {
  try {
    const chats = await Chat.find({
      participants: { $elemMatch: { $eq: req.user._id } },
    })
      .populate('participants', '-__v -password')
      .populate('groupAdmin', '-__v -password')
      .populate('lastMessage')
      .sort({ updatedAt: -1 });

    res.status(200).json({ success: true, count: chats.length, data: chats });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: err.message });
  }
});

router.post('/group', protect, async (req, res) => {
  try {
    const { name, users } = req.body;

    if (!name || !users || users.length < 2) {
      return res.status(400).json({
        success: false,
        message: 'Provide a group name and at least 2 users',
      });
    }

    const groupChat = await Chat.create({
      chatName: name,
      isGroupChat: true,
      participants: [...users, req.user._id],
      groupAdmin: req.user._id,
    });

    const fullGroupChat = await Chat.findById(groupChat._id)
      .populate('participants', '-__v -password')
      .populate('groupAdmin', '-__v -password');

    res.status(201).json({ success: true, data: fullGroupChat });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: err.message });
  }
});

router.get('/:chatId/messages', protect, async (req, res) => {
  try {
    const messages = await Message.find({ chatId: req.params.chatId })
      .populate('sender', '-__v -password')
      .populate('readBy', '-__v -password')
      .sort({ createdAt: 1 });

    res.status(200).json({
      success: true,
      count: messages.length,
      data: messages,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
