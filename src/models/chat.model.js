const mongoose = require('mongoose');
const { toJSON } = require('./plugins');

const chatSchema = mongoose.Schema(
  {
    customer: {type: mongoose.Schema.Types.ObjectId, ref: 'Account', required: true},
    saler: {type: mongoose.Schema.Types.ObjectId, ref: 'Account', required: true},
    messages: [{
        isCustomer: {type: Boolean, required: true},
        message: {type: String, required: true, trim: true},
        createdAt: {type: Date, default: Date.now}
    }],
    seen: {type: Boolean, default: false},
  },
  {
    timestamps: true
  }
);
chatSchema.plugin(toJSON);
const Chat = mongoose.model('Chat', chatSchema);
module.exports = Chat;
