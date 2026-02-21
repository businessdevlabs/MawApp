import express from 'express';
import mongoose from 'mongoose';
import Conversation from '../models/Conversation.js';
import Message from '../models/Message.js';
import ServiceProvider from '../models/ServiceProvider.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Helper: check if user is a participant in the conversation
const isParticipant = (conversation, user) => {
  if (user.role === 'client') {
    return conversation.clientId.toString() === user._id.toString();
  }
  if (user.role === 'provider') {
    // For providers, we need to compare with their ServiceProvider._id
    return true; // will be verified per-route using the provider doc
  }
  return false;
};

// POST /api/chat/conversations — find or create a conversation
// Clients call this with { providerId } to start a chat
router.post('/conversations', authenticateToken, async (req, res) => {
  try {
    const user = req.user;
    let clientId, providerId;

    if (user.role === 'client') {
      clientId = user._id;
      providerId = req.body.providerId;
    } else if (user.role === 'provider') {
      clientId = req.body.clientId;
      const providerDoc = await ServiceProvider.findOne({ userId: user._id });
      if (!providerDoc) return res.status(404).json({ error: 'Provider profile not found' });
      providerId = providerDoc._id;
    } else {
      return res.status(403).json({ error: 'Only clients and providers can start conversations' });
    }

    if (!clientId || !providerId) {
      return res.status(400).json({ error: 'clientId and providerId are required' });
    }

    let conversation = await Conversation.findOne({ clientId, providerId });
    if (!conversation) {
      conversation = await Conversation.create({ clientId, providerId });
    }

    res.json({ conversation });
  } catch (error) {
    console.error('Create conversation error:', error);
    res.status(500).json({ error: 'Failed to create conversation' });
  }
});

// GET /api/chat/conversations — list conversations for current user
router.get('/conversations', authenticateToken, async (req, res) => {
  try {
    const user = req.user;
    let query = {};

    if (user.role === 'client') {
      query.clientId = user._id;
    } else if (user.role === 'provider') {
      const providerDoc = await ServiceProvider.findOne({ userId: user._id });
      if (!providerDoc) return res.json({ conversations: [] });
      query.providerId = providerDoc._id;
    } else {
      return res.json({ conversations: [] });
    }

    const conversations = await Conversation.find(query)
      .populate('clientId', 'fullName email')
      .populate({ path: 'providerId', select: 'businessName profilePhoto', populate: { path: 'userId', select: 'fullName' } })
      .sort({ lastMessageAt: -1 });

    res.json({ conversations });
  } catch (error) {
    console.error('Get conversations error:', error);
    res.status(500).json({ error: 'Failed to fetch conversations' });
  }
});

// GET /api/chat/conversations/:conversationId/messages — message history
router.get('/conversations/:conversationId/messages', authenticateToken, async (req, res) => {
  try {
    const { conversationId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(conversationId)) {
      return res.status(400).json({ error: 'Invalid conversationId' });
    }

    const conversation = await Conversation.findById(conversationId);
    if (!conversation) return res.status(404).json({ error: 'Conversation not found' });

    const user = req.user;
    let isAllowed = false;

    if (user.role === 'client') {
      isAllowed = conversation.clientId.toString() === user._id.toString();
    } else if (user.role === 'provider') {
      const providerDoc = await ServiceProvider.findOne({ userId: user._id });
      isAllowed = providerDoc && conversation.providerId.toString() === providerDoc._id.toString();
    }

    if (!isAllowed) return res.status(403).json({ error: 'Access denied' });

    // Mark incoming messages as read
    await Message.updateMany(
      { conversationId, senderId: { $ne: user._id }, read: false },
      { read: true }
    );

    // Reset unread count for current user
    if (user.role === 'client') {
      await Conversation.findByIdAndUpdate(conversationId, { clientUnread: 0 });
    } else {
      await Conversation.findByIdAndUpdate(conversationId, { providerUnread: 0 });
    }

    const messages = await Message.find({ conversationId })
      .sort({ createdAt: 1 })
      .limit(50);

    res.json({ messages });
  } catch (error) {
    console.error('Get messages error:', error);
    res.status(500).json({ error: 'Failed to fetch messages' });
  }
});

// POST /api/chat/conversations/:conversationId/messages — send a message
router.post('/conversations/:conversationId/messages', authenticateToken, async (req, res) => {
  try {
    const { conversationId } = req.params;
    const { content } = req.body;

    if (!content || !content.trim()) {
      return res.status(400).json({ error: 'content is required' });
    }
    if (!mongoose.Types.ObjectId.isValid(conversationId)) {
      return res.status(400).json({ error: 'Invalid conversationId' });
    }

    const conversation = await Conversation.findById(conversationId);
    if (!conversation) return res.status(404).json({ error: 'Conversation not found' });

    const user = req.user;
    let isAllowed = false;
    let senderRole = user.role;

    if (user.role === 'client') {
      isAllowed = conversation.clientId.toString() === user._id.toString();
    } else if (user.role === 'provider') {
      const providerDoc = await ServiceProvider.findOne({ userId: user._id });
      isAllowed = providerDoc && conversation.providerId.toString() === providerDoc._id.toString();
    }

    if (!isAllowed) return res.status(403).json({ error: 'Access denied' });

    const message = await Message.create({
      conversationId,
      senderId: user._id,
      senderRole,
      content: content.trim()
    });

    // Update conversation metadata
    const unreadUpdate = user.role === 'client'
      ? { providerUnread: conversation.providerUnread + 1 }
      : { clientUnread: conversation.clientUnread + 1 };

    await Conversation.findByIdAndUpdate(conversationId, {
      lastMessage: content.trim().substring(0, 100),
      lastMessageAt: new Date(),
      ...unreadUpdate
    });

    // Emit to Socket.io room — req.app.get('io') is set in server.js
    const io = req.app.get('io');
    if (io) {
      io.to(conversationId).emit('new_message', message);
    }

    res.status(201).json({ message });
  } catch (error) {
    console.error('Send message error:', error);
    res.status(500).json({ error: 'Failed to send message' });
  }
});

export default router;
