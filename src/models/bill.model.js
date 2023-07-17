const mongoose = require('mongoose');
const { toJSON } = require('./plugins');

const billSchema = mongoose.Schema(
  {
    account: {type: mongoose.Schema.Types.ObjectId, ref: "Account"},
    phone: {type: String, required: [true, "Bill phone cannot be empty"]},
    name: String,
    address:  {
        province: String,
        district: String, 
        address: String
    },
    // Bill Info
    products: [{
        product: {
            type: mongoose.Schema.Types.ObjectId, required: [true, 'Product id in bill cannot be empty.'],
            ref: 'Product'
        },
        color: {
            type: String,
            required: [true, 'Product color in bill cannot be empty.'],
        },
        quantity: {
            type: Number,
            required: [true, 'Product quantity in bill cannot be empty.'],
        },
        price: {
            type: Number,
            required: [true, 'Product price in bill cannot be empty.'],
        },
        sale: {
            type: Number,
            default: 0
        }
    }],
    discountCode: {type: String, ref: 'Discount'},
    status: [{
        statusTimeline : {
            type: String,
            enum: {
            values: ['Ordered','Confirmed', 'Delivering', 'Done', 'Canceled'], 
            message: 'Value {VALUE} is not supported'
        },
        default: 'Ordered',
        },
        time : {
            type : Date,
            default : Date.now()
        }
    }],

    refund: {type: Boolean, default: false},
    paid: {type: Boolean, default: false},
    ship: {type: Number, required: true}, 
    total: {type: Number, required: true}, 
    discount: {type: Number, required: true}, 
    verify: {type: Boolean, required: true}
  },
  {
    timestamps: true
  }
);
billSchema.virtual('cash').get(function () {
    return this.total - this.discount;
});
billSchema.plugin(toJSON);

const Bill = mongoose.model('Bill', billSchema);

module.exports = Bill;
