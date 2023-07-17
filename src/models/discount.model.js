const mongoose = require('mongoose');
const { toJSON } = require('./plugins');

const discountSchema = mongoose.Schema(
  {
    code: {type: String, required: [true, "Discount code cannot be empty"], unique: true, trim: true, lowercase: true},
    enable: {type: Boolean, default: false},
    // Limit of discounts
    dateStart: {type: Date, default: Date.now},
    dateEnd: Date,
    quantity: Number,

    // Price range of discounts
    minPrice: Number,
    maxPrice: Number,

    // Type of discount
    is_percent: {type: Boolean, default: false},
    is_ship: {type: Boolean, default: false},
    is_oid: {type: Boolean, default: true},
    is_oic: {type: Boolean, default: true}, 
    value: {type: Number, required: true}, 

    // depend on
    products: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Product' }], 
    categories: [String], 
    accounts: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Account' }],

    used: { type: mongoose.Schema.Types.Mixed, default: {}}
  },
  {
    timestamps: true
  }
);
discountSchema.plugin(toJSON);

const Discount = mongoose.model('Discount', discountSchema);

module.exports = Discount;
