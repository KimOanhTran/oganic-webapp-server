const mongoose = require('mongoose');
const validator = require('validator');
const bcrypt = require('bcryptjs');
const { toJSON, paginate } = require('./plugins');
const { roles } = require('../config/roles');
const { PHONE_REGEX } = require('../constants/index');

const accountSchema = mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true
    },
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
      validate(value) {
        if (!validator.isEmail(value)) {
          throw new Error('Invalid email');
        }
      }
    },
    phone: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      validate: {
        validator: function (val) {
          return val.match(PHONE_REGEX);
        },
        message: 'Number phone {VALUE} is invalid. Please try again.'
      }
    },
    password: {
      type: String,
      trim: true,
      minlength: 8,
      validate(value) {
        if (!value.match(/\d/) || !value.match(/[a-zA-Z]/)) {
          throw new Error('Password must contain at least one letter and one number');
        }
      },
      private: true // used by the toJSON plugin
    },
    birth: String,
    gender: String,
    address: {
      province: String,
      district: String,
      address: String
    },
    role: {
      type: String,
      enum: {
        values: ['Customer', 'Sale', 'Admin', 'Warehouse'],
        message: 'Role {VALUE} is not supported'
      },
      default: 'Customer'
    },
    isEmailVerified: {
      type: Boolean,
      default: false
    },
    chats: [{ type: mongoose.Schema.Types.ObjectId, required: true, ref: 'Chat' }],
    cart: [
      {
        product: { type: mongoose.Schema.Types.ObjectId, required: true, ref: 'Product' },
        color: String,
        quantity: Number
      }
    ],
    rate_waits: [{ type: mongoose.Schema.Types.ObjectId, required: true, ref: 'Product' }],
    bills: [{ type: mongoose.Schema.Types.ObjectId, required: true, ref: 'Bill' }],
    notifications: [
      {
        message: { type: String, required: true, trim: true },
        createdAt: { type: Date, default: Date.now }
      }
    ],
    warning: { type: Number, default: 0 },
    enable: { type: Boolean, default: true }
  },
  {
    timestamps: true
  }
);
accountSchema.methods.AccountInfo = async (_id) => await Account.findById(_id).select('-notifications -rate_waits');
accountSchema.methods.AccountSurface = async (_id) => {
  var pipeline = [
    {
      $project: {
        email: '$email',
        name: '$name',
        phone: '$phone',
        role: '$role',
        notifications_length: { $size: '$notifications' },
        cart_items: '$cart',
        bills_length: { $sum: '$bills.quantity' }
      }
    },
    {
      $match: { _id }
    }
  ];
  var docs = await Account.aggregate(pipeline);
  if (docs.length > 0) {
    var doc = docs[0];
    doc.cart_items_length = doc.cart_items.reduce((a, b) => a + b.quantity, 0);
    var temp = new Set();
    doc.cart_items.forEach((u) => temp.add(u.product));
    delete doc.cart_items;
    doc.cart_products = [...temp];
    return doc;
  } else return undefined;
};
// add plugin that converts mongoose to json
accountSchema.plugin(toJSON);
accountSchema.plugin(paginate);

/**
 * Check if email is taken
 * @param {string} email - The user's email
 * @param {ObjectId} [excludeAccountId] - The id of the user to be excluded
 * @returns {Promise<boolean>}
 */
accountSchema.statics.isEmailTaken = async function (email, excludeAccountId) {
  const account = await this.findOne({ email, _id: { $ne: excludeAccountId } });
  return !!account;
};

accountSchema.statics.isPhoneTaken = async function (phone, excludeAccountId) {
  const account = await this.findOne({
    phone,
    _id: { $ne: excludeAccountId }
  });
  return !!account;
};
/**
 * Check if password matches the user's password
 * @param {string} password
 * @returns {Promise<boolean>}
 */
accountSchema.methods.isPasswordMatch = async function (password) {
  const account = this;
  return await bcrypt.compare(password, account.password);
};

accountSchema.pre('save', async function (next) {
  const account = this;
  if (account.isModified('password')) {
    account.password = await bcrypt.hash(account.password, 8);
  }
  next();
});

/**
 * @typedef Account
 */
const Account = mongoose.model('Account', accountSchema);

module.exports = Account;
