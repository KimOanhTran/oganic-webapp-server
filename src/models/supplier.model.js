const mongoose = require('mongoose');
const { toJSON } = require('./plugins');
const PHONE_REGEX = /(84|0[3|5|7|8|9|1|2|4|6])+([0-9]{8})\b/;
const supplierSchema = mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      unique: true
    },
    desc: { type: String, default: '', trim: true },
    slug: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true
    },
    products: [{ type: mongoose.Schema.Types.ObjectId, required: true, ref: 'Product' }],
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
    address: {
      province: String,
      district: String,
      address: String
    }
  },
  {
    timestamps: true
  }
);

//Su dung thuoc tinh ao virtual de tinh toan va tra ve du lieu theo yeu cau
supplierSchema.virtual('info').get(function () {});

supplierSchema.virtual('surface').get(function () {
  return {
    _id: this.id,
    name: this.name,
    desc: this.desc,
    slug: this.slug,
    phone: this.phone,
    address: this.address,
    createdAt: this.createdAt,
    updatedAt: this.updatedAt
  };
});
/**
 * Check if email is taken
 * @param {string} name - The user's email
 * @param {ObjectId} [excludeSupplierId] - The id of the user to be excluded
 * @returns {Promise<boolean>}
 */
supplierSchema.statics.isNameTaken = async function (name, excludeSupplierId) {
  const supplier = await this.findOne({ name, _id: { $ne: excludeSupplierId } });
  return !!supplier;
};

supplierSchema.statics.isPhoneTaken = async function (phone, excludeSupplierId) {
  const supplier = await this.findOne({
    phone,
    _id: { $ne: excludeSupplierId }
  });
  return !!supplier;
};

supplierSchema.statics.checkSupplier = function (phone) {
  // Kiểm tra tính hợp lệ của số điện thoại
  if (!phone.match(PHONE_REGEX)) {
    return { isValid: false, message: 'Invalid phone number. Please try again.' };
  }

  // Thêm các kiểm tra khác cho trường khác nếu cần

  // Nếu không có lỗi, trả về kết quả hợp lệ
  return { isValid: true };
};

supplierSchema.methods.addProduct = function (product) {
  // @ts-ignore
  if (this.products.includes(product._id)) return;
  this.products.push(product._id);
};

supplierSchema.plugin(toJSON);

const Supplier = mongoose.model('Supplier', supplierSchema);

module.exports = Supplier;
