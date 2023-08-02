const mongoose = require('mongoose');
const { toJSON } = require('./plugins');

const importSchema = mongoose.Schema(
  {
    products: [
      {
        product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
        quantity: Number,
        price: Number,
        color: String
      }
    ],
    admin: { type: mongoose.Schema.Types.ObjectId, ref: 'Account' }
    // updater_name: {
    //   type: String
    // }
  },
  {
    timestamps: true
  }
);
importSchema.plugin(toJSON);
const Import = mongoose.model('Import', importSchema);
module.exports = Import;
