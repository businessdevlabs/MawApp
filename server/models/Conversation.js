import mongoose from 'mongoose';

const conversationSchema = new mongoose.Schema({
  clientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  providerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ServiceProvider',
    required: true
  },
  lastMessage: {
    type: String,
    default: ''
  },
  lastMessageAt: {
    type: Date,
    default: Date.now
  },
  clientUnread: {
    type: Number,
    default: 0
  },
  providerUnread: {
    type: Number,
    default: 0
  }
}, { timestamps: true });

conversationSchema.index({ clientId: 1, providerId: 1 }, { unique: true });

export default mongoose.model('Conversation', conversationSchema);
