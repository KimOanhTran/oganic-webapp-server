const mongoose = require('mongoose');
const { toJSON } = require('./plugins');

const productSchema = mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      unique: true
    },
    desc: { type: String, default: '', trim: true },
    code: {
      type: String,
      required: true,
      trim: true,
      unique: true
    },

    image_id: { type: String },
    colors: [
      {
        color: { type: String, required: true, trim: true },
        image_id: String,
        image_url: String,
        quantity: { type: Number, default: 0 }
      }
    ],
    category: String,
    specs: mongoose.Schema.Types.Mixed,
    price: { type: Number, required: [true, 'Product price cannot be empty'] },
    sale: {
      type: Number,
      default: 0,
      min: [0, 'Product discount percent must more than or equal 0'],
      max: [100, 'Product discount percent must less than or equal 100']
    },
    catalogue: [
      {
        image_id: String,
        image_url: String
      }
    ],
    sold: { type: Number, default: 0 },
    total_rate: { type: Number, default: 0 },
    comments: [
      {
        account: { type: mongoose.Schema.Types.ObjectId, required: true, ref: 'Account' },
        name: String,
        message: String,
        rate: { type: Number, default: 0 },
        at: { type: Date, default: Date.now }
      }
    ],
    /**
     * 0: inactive
     * 1: active
     */
    enable: {
      type: Boolean,
      default: true
    },
    image_url: {
      type: String
    },
    supplier_name: {
      type: String,
      required: true,
      trim: true
    }
  },
  {
    timestamps: true
  }
);

productSchema.plugin(toJSON);

const Product = mongoose.model('Product', productSchema);

module.exports = Product;
