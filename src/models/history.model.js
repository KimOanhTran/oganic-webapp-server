const mongoose = require('mongoose');
const { toJSON } = require('./plugins');

const historySchema = mongoose.Schema(
  {
    code_product: {
      type: String
    },
    name_product: {
      type: String
    },
    admin: { type: mongoose.Schema.Types.ObjectId, ref: 'Account' },
    old_price: {
      type: Number
    },
    new_price: {
      type: Number
    }
  },
  {
    timestamps: true
  }
);

historySchema.plugin(toJSON);
const History = mongoose.model('History', historySchema);
module.exports = History;
