const httpStatus = require('http-status');
const pick = require('../utils/pick');
const ApiError = require('../utils/ApiError');
const catchAsync = require('../utils/catchAsync');
const { userService } = require('../services');
const config = require('../config/config');
const Discount = require('../models/discount.model');
const Account = require('../models/account.model');
const NodeCache = require('node-cache');
const codeCache = new NodeCache();
const {
  Types: { ObjectId: ObjectId }
} = require('mongoose');

const Create = async (req, res, next) => {
  const code = req.body.code;
  const enable = req.body.enable;

  const dateStart = req.body.dateStart;
  const dateEnd = req.body.dateEnd;
  const quantity = req.body.quantity;

  const minPrice = req.body.minPrice;
  const maxPrice = req.body.maxPrice;

  const is_percent = req.body.is_percent;
  const is_ship = req.body.is_ship;
  const is_oid = req.body.is_oid;
  const is_oic = req.body.is_oic;
  const value = req.body.value;
  console.log(value);

  if (!code) return res.status(400).send({ msg: config.message.errMissField + '[Code]. ' });
  if (!value) return res.status(400).send({ msg: config.message.errMissField + '[Value]. ' });

  const discount = new Discount({
    code,
    enable,
    dateStart,
    dateEnd,
    quantity,
    minPrice,
    maxPrice,
    is_percent,
    is_ship,
    is_oid,
    is_oic,
    value
  });
  console.log(value);

  discount.save((err, doc) => {
    if (err) return res.status(500).send({ msg: err.message });
    if (!doc) return res.status(400).send({ msg: config.message.errMissField });
    return res.send({ msg: config.message.success });
  });
};

const List = async (req, res, next) => {
  try {
    const skip = Number(req.body.skip) || 0;
    const limit = Number(req.body.limit) || 10000;
    const search = req.body.string;
    const is_percent = req.body.is_percent;
    const is_ship = req.body.is_ship;
    const is_oid = req.body.is_oid;
    const is_oic = req.body.is_oic;
    const sortValue = req.body.sortValue;
    const fromDate = req.body.fromDate;
    const toDate = req.body.toDate;

    var sortOptions = {};
    var queryOptions = {};

    if (!!fromDate) queryOptions['dateStart'] = { $gte: fromDate };

    if (is_percent != undefined) queryOptions['is_percent'] = is_percent;

    if (is_ship != undefined) queryOptions['is_ship'] = is_ship;

    if (is_oid != undefined) queryOptions['is_oid'] = is_oid;

    if (is_oic != undefined) queryOptions['is_oic'] = is_oic;

    if (!!toDate) queryOptions['dateEnd'] = { $lte: toDate };

    if (sortValue == 1 || sortValue == -1) {
      sortOptions['value'] = sortValue;
    }

    if (!!search) {
      const pattern = { $regex: '.*' + search + '.*', $options: 'i' };
      queryOptions['code'] = pattern;
    }

    const count = await Discount.countDocuments(queryOptions);
    Discount.find(queryOptions)
      .sort(sortOptions)
      .skip(skip)
      .limit(limit)
      .select('-products -categories -accounts -used')
      .exec((err, docs) => {
        if (err) return res.status(500).send({ msg: err.message });
        return res.send({ msg: config.message.success, data: docs, count: count });
      });
  } catch (err) {
    console.log(err);
    return res.status(500).send({ msg: config.message.errInternal });
  }
};

const Update = async (req, res, next) => {
  const _id = req.body._id;
  const code = req.body.code;
  const enable = req.body.enable;
  const is_percent = req.body.is_percent;
  const is_ship = req.body.is_ship;
  const is_oid = req.body.is_oid;
  const is_oic = req.body.is_oic;
  const dateStart = req.body.dateStart;
  const dateEnd = req.body.dateEnd;
  const quantity = req.body.quantity;
  const minPrice = req.body.minPrice;
  const maxPrice = req.body.maxPrice;
  const value = req.body.value;
  const categories_del = req.body.categories_del;
  const products_del = req.body.products_del;
  const accounts_del = req.body.accounts_del;
  const categories_add = req.body.categories_add;
  const products_add = req.body.products_add;
  const accounts_add = req.body.accounts_add;

  console.log('A');
  if (!_id || !code) return res.status(400).send({ msg: config.message.errMissField + '[_id]. va [code] ' });

  // Tìm kiếm mã khuyến mãi theo _id hoặc code
  const discount = await Discount.findOne({ $or: [{ _id: _id }] }).select('-used');
  console.log('a', discount);
  if (!discount) return res.status(400).send({ msg: config.message.errWrongField + '[_id]. ' });
  if (enable != undefined) {
    discount.markModified('enable');
    discount.enable = enable;
  }

  if (is_percent != undefined) {
    discount.markModified('is_percent');
    discount.is_percent = is_percent;
  }

  if (is_ship != undefined) {
    discount.markModified('is_ship');
    discount.is_ship = is_ship;
  }

  if (is_oid != undefined) {
    discount.markModified('is_oid');
    discount.is_oid = is_oid;
  }

  if (is_oic != undefined) {
    discount.markModified('is_oic');
    discount.is_oic = is_oic;
  }

  if (dateStart != undefined) {
    discount.markModified('dateStart');
    discount.dateStart = dateStart;
  }

  if (dateEnd != undefined) {
    discount.markModified('dateEnd');
    discount.dateEnd = dateEnd;
  }

  if (quantity != undefined) {
    discount.markModified('quanity');
    discount.quantity = quantity;
  }

  if (minPrice != undefined) {
    discount.markModified('minPrice');
    discount.minPrice = minPrice;
  }

  if (maxPrice != undefined) {
    discount.markModified('maxPrice');
    discount.maxPrice = maxPrice;
  }

  if (value != undefined) {
    discount.markModified('value');
    discount.value = value;
  }

  if (code != undefined) {
    discount.markModified('code');
    discount.code = code;
  }
  // Kiểm tra nếu sản phẩm đã có mã khuyến mãi thì không thêm mới
  // if (products_add && products_add.length > 0) {
  //   const existingProducts = discount.products;
  //   if (existingProducts && existingProducts.length > 0) {
  //     return res.status(400).send({ msg: 'Fail: Product already has a discount code.' });
  //   }
  // }

  // Kiểm tra nếu người dùng đã có mã khuyến mãi thì không thêm mới
  if (accounts_add && accounts_add.length > 0) {
    const existingAccounts = discount.accounts;
    if (existingAccounts && existingAccounts.length > 0) {
      const duplicateAccounts = accounts_add.filter((acc) => existingAccounts.includes(acc));
      if (duplicateAccounts.length > 0) {
        return res.status(400).send({ msg: 'Fail: Duplicate discount code for some accounts.' });
      }
    }
  }

  // Các trường thông tin khác tương tự

  // Xử lý xoá và thêm danh mục, sản phẩm, người dùng
  if (categories_del && categories_del.length > 0) {
    discount.markModified('categories');
    discount.categories = discount.categories.filter((e) => !categories_del.includes(e));
  }
  if (products_del && products_del.length > 0) {
    discount.markModified('products');
    discount.products = discount.products.filter((product) => {
      return !products_del.some((delProduct) => delProduct._id === product._id);
    });
  }
  if (accounts_del && accounts_del.length > 0) {
    discount.markModified('accounts');
    discount.accounts = discount.accounts.filter((accounts) => {
      return !accounts_del.some((delAccount) => delAccount._id === accounts._id);
    });
  }
  if (categories_add && categories_add.length > 0) {
    discount.markModified('categories');
    categories_add.forEach((e) => discount.categories.push(e));
  }
  if (products_add && products_add.length > 0) {
    discount.markModified('products');
    products_add.forEach((e) => discount.products.push(e));
  }
  if (!!accounts_add) {
    discount.markModified('accounts');
    for (const e of accounts_add) {
      const isAlreadyAdded = discount.accounts.includes(e);
      if (!isAlreadyAdded) {
        const message = 'Bạn vừa được liên kết với mã Discount ' + discount.code;
        await Account.findByIdAndUpdate(e, {
          $push: { notifications: { $each: [{ message }], $position: 0 } }
        })
          .select('_id')
          .exec();
        discount.accounts.push(e);
      }
    }
  }

  if (quantity !== undefined) {
    discount.markModified('quantity');
    discount.quantity = quantity;
  }

  // Lưu thay đổi vào cơ sở dữ liệu
  discount.save((err, doc) => {
    if (err) return res.status(500).send({ msg: err.message });
    if (!doc) return res.status(400).send({ msg: config.message.errMissField });
    return res.send({ msg: config.message.success });
  });
};

const Read = async (req, res, next) => {
  const _id = req.body._id;
  const code = req.body.code;

  if (!_id && !code) return res.status(400).send({ msg: mess.errMissField + '[_id/code]. ' });
  const discount = await Discount.findOne({ $or: [{ _id: _id }, { code: code }] }).select('-used');
  if (!discount) return res.status(400).send({ msg: mess.errWrongField + '[_id/code]. ' });

  var desc = '';
  desc += `Bắt đầu từ ${discount.dateStart} và ${
    !discount.dateEnd ? 'không có hạn kết thúc' : 'kết thúc vào ' + discount.dateEnd.toString()
  }. \n`;
  desc += !discount.quantity ? 'Không có số lượng cụ thể. ' : `Tổng cộng còn ${discount.quantity} lượt dùng. ` + '\n';
  desc += `Đơn hàng ${
    !discount.minPrice ? 'không có hạn mức thấp nhất' : 'phải đạt trên ' + discount.minPrice
  } để sử dụng mã này. \n`;
  desc += discount.is_oic ? 'Mỗi khách hàng chỉ dùng 1 lần. \n' : 'Không có giới hạn sử dụng đối với khách hàng. \n';
  desc += `Khuyến mãi ${
    !discount.maxPrice ? 'không có hạn mức cao nhất' : 'có hạn mức cao nhất là ' + discount.maxPrice
  }. \n`;
  desc += `Khuyến mãi ${
    discount.is_percent ? 'giảm ' + discount.value + ' phần trăm' : 'giảm ' + discount.value + ' VND'
  } `;
  desc += ` của ${discount.is_ship ? 'phí ship' : 'đơn hàng'}. \n`;
  desc += discount.is_oid ? 'Mỗi ngày chỉ dùng 1 lần. \n' : 'Không có giới hạn sử dụng trong ngày. \n';
  desc += discount.is_oic ? 'Mỗi khách hàng chỉ dùng 1 lần. \n' : 'Không có giới hạn sử dụng đối với khách hàng. \n';
  return res.send({ msg: config.message.success, data: { code, desc } });
};

const getADiscount = catchAsync(async (req, res, next) => {
  const _id = req.params.discountId;
  console.log(_id);
  const discount = await Discount.findOne({ $or: [{ _id: _id }] });
  console.log(discount);
  if (!discount) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Discount not found');
  }
  res.send(discount);
});

const Delete = async (req, res, next) => {
  try {
    const code = req.body.code;
    const _id = req.body.id;
    console.log(_id);
    if (!_id) return res.status(400).send({ msg: config.message.err400 });

    const discount = await Discount.findOne({ $or: [{ _id: _id }, { code: code }] });
    if (!discount) return res.status(400).send({ msg: config.message.errNotExists });
    if (discount.products.length > 0) {
      return res.send({
        msg: config.message.errProductValid,
        reason: `Discount relate ${discount.products.length} products`
      });
    }
    if (discount.accounts.length > 0) {
      return res.send({
        msg: config.message.errProductValid,
        reason: `Discount relate ${category.products.length} accounts`
      });
    }
    discount.deleteOne((err) => {
      if (err) return res.status(500).send({ msg: config.message.err500 });
      return res.send({ msg: config.message.success });
    });
  } catch (err) {
    console.log(err);
    return res.status(500).send({ msg: config.message.err500 });
  }
};

const getHistoryDiscountProduct = async (req, res, next) => {
  try {
    const discount = await Discount.find({ _id: req.body.id })
      .populate('products')
      .exec((err, listImport) => {
        // console.log(listImport);
        if (err) {
          return res.status(500).send({ msg: `error ${err}` });
        } else if (listImport && listImport.length > 0) {
          return res.send({ msg: config.message.success, data: listImport });
        } else {
          return res.status(400).send({ msg: 'Not found!' });
        }
      });
  } catch (err) {
    console.log(err);
    return res.status(500).send({ msg: config.message.err500 });
  }
};

const getHistoryDiscountAccount = async (req, res, next) => {
  try {
    const discount = await Discount.find({ _id: req.body.id })
      .populate('accounts')
      .exec((err, listImport) => {
        // console.log(listImport);
        if (err) {
          return res.status(500).send({ msg: `error ${err}` });
        } else if (listImport && listImport.length > 0) {
          return res.send({ msg: config.message.success, data: listImport });
        } else {
          return res.status(400).send({ msg: 'Not found!' });
        }
      });
  } catch (err) {
    console.log(err);
    return res.status(500).send({ msg: config.message.err500 });
  }
};

const getHistory = async (req, res, next) => {
  try {
    console.log(req.body.id);
    const discount = await Discount.find({ _id: req.body.id }).populate('products').populate('accounts').exec();

    if (discount && discount.length > 0) {
      return res.send({ msg: config.message.success, data: discount });
    } else {
      return res.status(400).send({ msg: 'Not found!' });
    }
  } catch (err) {
    console.log(err);
    return res.status(500).send({ msg: config.message.err500 });
  }
};

module.exports = {
  Create,
  List,
  Update,
  Read,
  Delete,
  getADiscount,
  getHistoryDiscountProduct,
  getHistoryDiscountAccount,
  getHistory
};
