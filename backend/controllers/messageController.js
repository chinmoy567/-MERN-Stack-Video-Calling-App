const mongoose = require("mongoose");
const Message = require("../models/messageModel");

const isValidId = (id) => mongoose.Types.ObjectId.isValid(id);

// GET /api/messages/:userId — full conversation with one user (oldest → newest).
// Marks messages the other user sent to me as read.
const getMessages = async (req, res) => {
  try {
    const me = req.user.userId;
    const other = req.params.userId;

    if (!isValidId(other)) {
      return res.status(400).json({ success: false, msg: "Invalid user id" });
    }

    const messages = await Message.find({
      $or: [
        { sender: me, receiver: other },
        { sender: other, receiver: me },
      ],
    })
      .sort({ createdAt: 1 })
      .lean();

    await Message.updateMany(
      { sender: other, receiver: me, read: false },
      { $set: { read: true } }
    );

    return res.status(200).json({ success: true, data: messages });
  } catch (error) {
    return res.status(500).json({ success: false, msg: error.message });
  }
};

// GET /api/conversations — for each person I've chatted with: their id, the last
// message, and how many of their messages to me are still unread.
const getConversations = async (req, res) => {
  try {
    const me = new mongoose.Types.ObjectId(req.user.userId);

    const conversations = await Message.aggregate([
      { $match: { $or: [{ sender: me }, { receiver: me }] } },
      { $sort: { createdAt: -1 } },
      {
        $group: {
          _id: {
            $cond: [{ $eq: ["$sender", me] }, "$receiver", "$sender"],
          },
          lastMessage: { $first: "$text" },
          lastMessageAt: { $first: "$createdAt" },
          lastSender: { $first: "$sender" },
          unread: {
            $sum: {
              $cond: [
                {
                  $and: [
                    { $eq: ["$receiver", me] },
                    { $eq: ["$read", false] },
                  ],
                },
                1,
                0,
              ],
            },
          },
        },
      },
      { $sort: { lastMessageAt: -1 } },
    ]);

    const data = conversations.map((c) => ({
      userId: c._id,
      lastMessage: c.lastMessage,
      lastMessageAt: c.lastMessageAt,
      unread: c.unread,
    }));

    return res.status(200).json({ success: true, data });
  } catch (error) {
    return res.status(500).json({ success: false, msg: error.message });
  }
};

module.exports = { getMessages, getConversations };
