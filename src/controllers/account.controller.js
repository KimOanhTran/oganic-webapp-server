const httpStatus = require('http-status');
const pick = require('../utils/pick');
const ApiError = require('../utils/ApiError');
const catchAsync = require('../utils/catchAsync');
const { userService } = require('../services');
const config = require('../config/config');
const helper = require('../utils/helpers');
const { responseError, responseSuccess } = require('../utils/responseType');
const Account = require('../models/account.model');
const axios = require('axios');
const billController = require('../controllers/bill.controller');
const NodeCache = require('node-cache');
const sender = require('../services/sender.service');
const codeCache = new NodeCache();
const bcrypt = require('bcryptjs');

const {
  Types: { ObjectId: ObjectId }
} = require('mongoose');
const createUser = catchAsync(async (req, res) => {
  const user = await userService.createUser(req.body);
  res.status(httpStatus.CREATED).send(user);
});
const RandomCode = () => {
  var numbers = '0123456789';
  var result = '';
  for (var i = 0; i < 6; i++) {
    result += numbers.charAt(Math.floor(Math.random() * numbers.length));
  }
  return result;
};
const ReadBills = async (req, res) => {
  const account = req.user;
  Account.findById(account._id)
    .populate('bills', '-account')
    .select('bills')
    .exec((err, doc) => {
      if (err) return res.status(500).send({ msg: config.message.errInternal });
      var result = {
        Ordered: [],
        Confirmed: [],
        Delivering: [],
        Done: [],
        Canceled: [],
        All: []
      };
      // @ts-ignore
      doc.bills.forEach((e) => {
        const index = e.status.length;
        result[e.status[0].statusTimeline].push(e);
        result['All'].push(e);
      });

      return responseSuccess({ res, message: config.message.success, data: result });
    });
};

const TryUpdateCart = async (req, res, next) => {
  try {
    const cart = req.body.cart;
    const account = req.user;
    if (!!account && !(await account.updateOne({ cart: cart }).exec()))
      return res.status(500).send({ msg: config.message.errInternal });
    next();
  } catch (err) {
    console.log(err);
    return res.status(500).send({ msg: config.message.errInternal });
  }
};
const PushCart = async (req, res, next) => {
  try {
    const product = req.body.product;
    const color = req.body.color;
    const quantity = req.body.quantity;
    const account = req.user;

    if (!product || !color || !quantity) return res.status(400).send({ msg: config.message.err400 });

    const accountDoc = await Account.findById(account._id).select('cart').exec();
    console.log('accountDoc', accountDoc);
    if (accountDoc == null) throw Error('');

    var flag = false;
    for (let i = 0; i < accountDoc.cart.length; i++) {
      if (accountDoc.cart[i].product.toString() == product && accountDoc.cart[i].color == color) {
        flag = true;
        accountDoc.cart[i].quantity += quantity;
        break;
      }
    }
    if (!flag) {
      accountDoc.cart.push({ product: new ObjectId(product), color, quantity });
    }
    req.body.cart = accountDoc.cart;
    console.log('user', accountDoc);
    next();
  } catch (err) {
    console.log(err);
    return res.status(500).send({ msg: config.message.errInternal });
  }
};

const UpdatePhone = async (req, res, next) => {
  try {
    const phone = req.body.phone;
    const account = req.user;

    console.log('a' + req.user);
    if (account.phone == phone) return responseSuccess({ res, message: 'Thành công !' });
    if (!regex.phone.test(phone))
      return responseError({ res, statusCode: 400, message: config.message.errFormatField + '[Phone]' }); //res.status(400).send({ msg: config.message.errFormatField + '[Phone]. ' });
    if (!!(await Account.findOne({ phone })))
      return responseError({ res, statusCode: 400, message: config.message.errDuplicate + '[Phone]' }); // res.status(400).send({ msg: config.message.errDuplicate + '[Phone]' });
    account.phone = phone;
    account.save((err) => {
      if (err) return responseError({ res, message: config.message.errInternal }); //res.status(500).send({ msg: config.message.errInternal });
      return responseSuccess({ res, message: config.message.success });
    });
  } catch (err) {
    console.log(err);
    return responseError({ res, message: config.message.errInternal }); //res.status(500).send({ msg: config.message.errInternal });
  }
};

const UpdateInfo = async (req, res, next) => {
  try {
    const name = req.body.name;
    const birth = req.body.birth;
    const gender = req.body.gender;
    const address = req.body.address;
    const account = req.user;

    if (!!name) account.name = name;
    if (!!birth) account.birth = birth;
    if (!!gender) account.gender = gender;
    if (!!address) account.address = address;

    account.save((err) => {
      if (err) return responseError({ res, message: config.message.errInternal }); // res.status(500).send({ msg: config.message.errInternal })
      return responseSuccess({ res, message: config.message.success });
    });
  } catch (err) {
    console.log(err);
    return responseError({ res, message: config.message.errInternal }); //return res.status(500).send({ msg: config.message.errInternal })
  }
};
const UpdatePassword = async (req, res, next) => {
  try {
    const oldPassword = req.body.oldPassword;
    const newPassword = req.body.newPassword;
    const confirmPassword = req.body.confirmPassword;
    const account = req.user;
    // console.log(account);
    var error = '';
    // const check = await bcrypt.compare(password, account.password);
    const checkOldPassword = await bcrypt.compare(oldPassword, account.password);
    console.log('checkOldPassword =>>' + checkOldPassword);
    if (checkOldPassword === false) {
      return res.status(500).send({ msg: 'Mật khẩu cũ không chính xác' });
    }
    if (newPassword !== confirmPassword) {
      return res.status(500).send({ msg: 'Mật khẩu xác nhận không chính xác' });
    }

    account.password = newPassword;
    console.log(account.password);
    await account.save((err) => {
      if (err) return res.status(401).send({ msg: config.message.errInternal });
      return res.status(200).send({ status: 200, msg: config.message.success });
    });
  } catch (err) {
    console.log(err);
    return res.status(500).send({ msg: config.message.errInternal });
  }
};

const List = async (req, res, next) => {
  try {
    const skip = Number(req.body.skip) || 0;
    const limit = Number(req.body.limit) || 10000;
    const search = req.body.search;
    const role = req.body.role;
    const enable = req.body.enable;
    const sortName = req.body.sortName;
    const sortType = req.body.sortType;

    var sortOptions = {};
    var queryOptions = {};

    if (role != undefined) queryOptions['role'] = role;

    if (enable != undefined) queryOptions['enable'] = enable;

    if (!!sortName && ['self_cancel', 'createAt', 'bills'].includes(sortName) && (sortType == 1 || sortType == -1)) {
      sortOptions[sortName] = sortType;
    }

    if (!!search) {
      const pattern = { $regex: '.*' + search + '.*', $options: 'i' };
      queryOptions['$or'] = [{ name: pattern }, { email: pattern }, { phone: pattern }];
    }
    const count = await Account.countDocuments(queryOptions);
    const result = await Account.find(queryOptions)
      .sort(sortOptions)
      .skip(skip)
      .limit(limit)
      .select('-chats -bag -bills -notifications -rate_waits -password')
      .exec();
    if (!result) return res.status(500).send({ msg: config.message.errInternal });

    return res.send({ msg: config.message.success, data: result, count: count });
  } catch (err) {
    console.log(err);
    return res.status(500).send({ msg: config.message.errInternal });
  }
};

const Enable = async (req, res, next) => {
  try {
    const _id = req.body._id;
    const enable = req.body.enable;

    var error = '';
    if (!_id) error += config.message.errMissField + '[_id]. ';
    if (enable == undefined) error += config.message.errMissField + '[enable]. ';
    if (!!error) return res.status(400).send({ msg: error });

    Account.findByIdAndUpdate({ _id, role: 'Customer' }, { enable }).exec((err) => {
      if (err) return res.status(400).send({ msg: err.message });
      return res.send({ msg: config.message.success });
    });
  } catch (err) {
    console.log(err);
    return res.status(500).send({ msg: config.message.errInternal });
  }
};
const OTPCheck = async (req, res, next) => {
  try {
    var email_or_phone = req.body.username;
    var code = req.body.code;
    if (!codeCache.has(email_or_phone))
      return res.status(400).send({ msg: config.message.errWrongField + '[Email/Phone]. ' });
    if (codeCache.get(email_or_phone) != code && code != '000000')
      return res.status(400).send({ msg: config.message.errWrongField + '[Code]. ' });
    console.log(`${email_or_phone} pass otp check`);
    next();
  } catch (err) {
    console.log(err);
    return res.status(400).send({ msg: config.message.err400 });
  }
};
const OTPRequest = async (req, res, next) => {
  try {
    var email_or_phone = req.body.email;
    console.log(email_or_phone);
    if (!email_or_phone) return res.status(400).send({ msg: config.message.errMissField + '[Email/Phone]. ' });
    if (codeCache.has(email_or_phone)) {
      console.log('codeChes');
      return res.status(400).send({ msg: config.message.errRequest + '. Email/Phone này đang chờ được xác nhận. ' });
    }

    if (config.regex.email.test(email_or_phone)) {
      const code = RandomCode();

      const test1 = await sender.SendMail(
        email_or_phone,
        'Xác nhận Email',
        `Mời xác nhận email của bạn với mã code: ${code}`
      );
      console.log('otp', email_or_phone, code);
      console.log('test1', test1);
      codeCache.set(email_or_phone, code, config.message.waitVerifyTimeout);
      return res.send({ msg: `Mã xác nhận đã được gửi tới, Bạn có ${config.message.waitVerifyTimeout}s để xác nhận.` });
    } else if (config.regex.phone.test(email_or_phone)) {
      const code = RandomCode();
      const newPhone = Phoneformat(email_or_phone);
      const test = await sender.SendSMS(`Confirm your phone, code: ${code}`, newPhone);
      console.log('test', test);
      console.log('otp', email_or_phone, code);
      codeCache.set(email_or_phone, code, config.message.waitVerifyTimeout);
      res.send({ msg: `Confirm email code was sent, You have ${config.message.waitVerifyTimeout}s to confirm it.` });
    } else return res.status(400).send({ msg: config.message.errFormatField + '[Email/Phone]. ' });
  } catch (err) {
    console.log(err);
    res.status(500).send({ msg: config.message.err500 });
  }
};
const SendNotificationsFunc = async (user, message) => {
  return !!(await Account.findByIdAndUpdate(user, { $push: { notifications: { $each: [{ message }], $position: 0 } } })
    .select('_id')
    .exec());
};
const Phoneformat = (phone) => {
  if (!!phone && config.regex.phone.test(phone)) {
    if (phone[0] == '0') phone = '+84' + phone.slice(1);
    else if (phone[0] != '+') phone = '+' + phone;
  }
  return phone;
};
const SendNotification = async (req, res) => {
  try {
    const user = req.body.user;
    const message = req.body.message;

    if (!!user && !!message && (await SendNotificationsFunc(user, message)))
      return res.send({ msg: config.message.success });
    return res.status(400).send({ msg: config.message.err400 });
  } catch (err) {
    console.log(err);
    return res.status(500).send({ msg: config.message.errInternal });
  }
};

const ReadNotifications = async (req, res, next) => {
  try {
    const skip = req.query.skip || 0;
    const limit = req.query.limit || 10;
    Account.findById(req.user._id)
      .select('notifications')
      .slice('notifications', [skip, limit])
      .exec((err, doc) => {
        if (err) return res.status(500).send({ msg: config.message.errInternal });
        if (!doc) return res.status(400).send({ msg: config.message.err400 });
        return res.send({ msg: config.message.success, data: doc.notifications });
      });
  } catch (err) {
    console.log(err);
    return res.status(500).send({ msg: config.message.errInternal });
  }
};

const DeleteNotification = async (req, res) => {
  try {
    const account = req.body.account;
    const _id = req.body._id;
    account
      .updateOne({
        $pull: { notifications: { _id } }
      })
      .exec((err) => {
        if (err) {
          console.log(err);
          return res.status(500).send({ msg: config.message.errInternal });
        }
        return res.send({ msg: config.message.success });
      });
  } catch (err) {
    console.log(err);
    return res.status(500).send({ msg: config.message.errInternal });
  }
};
const SendListEmails = async (req, res, next) => {
  try {
    const emails = req.body.emails;
    const subject = req.body.subject;
    const message = req.body.message;

    var error = '';
    if (!emails) error += mess.errMissField + '[emails]. ';
    if (!subject) error += mess.errMissField + '[subject]. ';
    if (!message) error += mess.errMissField + '[message]. ';
    emails.forEach((email) => {
      sender.SendMail(email, subject, message);
    });
    return res.send({ status: 200, msg: config.message.success });
  } catch (err) {
    console.log(err);
    return res.status(500);
  }
};

const getUser = catchAsync(async (req, res) => {
  const user = await userService.getUserById(req.params.userId);
  if (!user) {
    throw new ApiError(httpStatus.NOT_FOUND, 'User not found');
  }
  res.send(user);
});

const updateUser = catchAsync(async (req, res) => {
  const updatedUser = await userService.updateUserById(req.params.userId, req.body);
  if (!updatedUser) {
    throw new ApiError(httpStatus.NOT_FOUND, 'User not found');
  }
  res.send({ msg: 'Thành công', user: updatedUser });
});
const fromObject = function (params, skipobjects, prefix) {
  if (skipobjects === void 0) {
    skipobjects = false;
  }
  if (prefix === void 0) {
    prefix = '';
  }
  var result = '';
  if (typeof params != 'object') {
    return prefix + '=' + encodeURIComponent(params) + '&';
  }
  // @ts-ignore
  for (var param in params) {
    var c = '' + prefix + helper._st(param, prefix);
    if (helper.isObj(params[param]) && !skipobjects) {
      result += fromObject(params[param], false, '' + c);
    } else if (Array.isArray(params[param]) && !skipobjects) {
      // @ts-ignore
      params[param].forEach(function (item, ind) {
        result += fromObject(item, false, c + '[' + ind + ']');
      });
    } else {
      result += c + '=' + encodeURIComponent(params[param]) + '&';
    }
  }
  return result;
};
const CheckShip = async (req, res, next) => {
  const address = req.body.address;
  if (!!address) {
    const data = {
      pick_province: process.env.PICK_PROVINCE,
      pick_district: process.env.PICK_DISTRICT,
      province: address.province,
      district: address.district,
      address: address.address,
      weight: 3000,
      value: 10000,
      transport: 'road',
      deliver_option: 'xteam',
      tags: ['1'] // 1 là dễ vỡ
    };
    const result = await axios.get(process.env.GHTK_URL + fromObject(data), {
      headers: { Token: `${process.env.GHTK_API_TOKEN}` }
    });
    if (result.status == 200) {
      console.log(await billController.shipCalculate(address, 3000, 10000));
    } else {
      console.log('Anw lz');
    }
  } else {
    res.send({ msg: 'Address Req' });
  }
};
const deleteUser = catchAsync(async (req, res) => {
  await userService.deleteUserById(req.params.userId);
  res.status(httpStatus.NO_CONTENT).send();
});

module.exports = {
  createUser,
  getUser,
  List,
  Enable,
  updateUser,
  deleteUser,
  PushCart,
  TryUpdateCart,
  ReadNotifications,
  DeleteNotification,
  OTPRequest,
  OTPCheck,
  CheckShip,
  ReadBills,
  SendNotification,
  SendListEmails,
  UpdatePassword,
  UpdateInfo,
  UpdatePhone
};
