const httpStatus = require('http-status');
const pick = require('../utils/pick');
const ApiError = require('../utils/ApiError');
const catchAsync = require('../utils/catchAsync');
const config = require('../config/config');
const { supplierService } = require('../services');
const mongoose = require('mongoose');
const Product = require('../models/product.model');
const { Supplier } = require('../models');
const image = require('../services/image.service');
const { responseError, responseSuccess } = require('../utils/responseType');
const { Category } = require('../models');

var supplierInfosTemp = {};
var supplierTempExist = false;
var supplierTempExist = {};
var supplierSurfacesTemp = [];
//Đây là một hàm bất đồng bộ không nhận bất kỳ tham số nào. Hàm này được
//sử dụng để yêu cầu danh sách các danh mục từ csdl và xử lý dl sau đó
const RequestSupplier = async () => {
  try {
    // Lấy danh sách các nhà cung cấp từ cơ sở dữ liệu
    var list = await Supplier.find();

    // Khởi tạo các biến tạm thời để lưu trữ dữ liệu
    var temp = {};
    var infos = {};
    var surfaces = [];

    // Xử lý danh sách nhà cung cấp
    list.forEach((supplier) => {
      temp[supplier.name] = supplier;
      temp[supplier._id.toString()] = supplier;

      // Lưu trữ thông tin nhà cung cấp (tùy chỉnh cho ứng dụng của bạn)
      infos[supplier.name] = supplier.desc; // Ví dụ: Lưu trữ mô tả nhà cung cấp
      infos[supplier._id.toString()] = infos[supplier.name];

      // Lưu trữ surface của nhà cung cấp
      surfaces.push({
        _id: supplier._id,
        name: supplier.name,
        phone: supplier.phone,
        address: supplier.address
      });
    });

    // Gán dữ liệu vào biến toàn cầu (tùy chỉnh cho ứng dụng của bạn)
    supplierTemp = temp;
    supplierInfosTemp = infos;
    supplierSurfacesTemp = surfaces;
    supplierTempExist = true;

    return true;
  } catch (err) {
    console.log(err);
    supplierTempExist = false;
    return false;
  }
};

//Đoạn mã trên để lấy danh sách các giá trị cơ bản từ các đối tượng danh mục trong csdl
//và gửi phản hồi chứa các giá trị cơ bản đó về cho người dùng
const List = catchAsync(async (req, res, next) => {
  try {
    const list = await Supplier.find();
    const arr = [];

    console.log(list);
    //list.forEach(c): lặp qua danh sách các đối tượng danh mục và thực hiện các bước xử lý
    list.forEach((c) => {
      console.log(c.surface);
      arr.push(c.surface);
    });
    return res.send({ msg: config.message.success, data: arr });
  } catch (err) {
    console.log(err);
    return res.status(500).send({ msg: config.message.err500 });
  }
});

const getASupplier = catchAsync(async (req, res, next) => {
  const supplier = await supplierService.getSupplierById(req.params.supplierId);
  if (!supplier) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Supplier not found');
  }
  res.send(supplier);
});

const ValidSpecs = function (category, specs) {
  var new_specs = {};
  for (let i = 0; i < category.specsModel.length; i++) {
    var e = category.specsModel[i];
    if (specs.hasOwnProperty(e.name)) {
      for (let j = 0; j < e.values.length; j++) {
        if (specs[e.name] == e.values[j].value) {
          new_specs[e.name] = e.values[j].value;
          break;
        }
      }
    }
  }
  return new_specs;
};

//catchAsync(async(req, res, next)): hàm trung gian catchAsync được sử dụng để bắt lỗi trong hàm xử lý yêu cầu. Nếu có bất kỳ lỗi nào xảu ra trong hàm này, nó sẽ chuyển nó đến hàm xử lý lỗi để xử lý
const createSupplier = catchAsync(async (req, res, next) => {
  try {
    const { name, slug, desc, phone, address } = req.body;

    console.log(req.body);
    // Kiểm tra xem tên đã tồn tại và được cung cấp trong yêu cầu hay chưa
    const isNameTaken = await Supplier.isNameTaken(name, null);
    if (isNameTaken) {
      throw new ApiError(httpStatus.BAD_REQUEST, 'Name already taken');
    }

    // Kiểm tra xem số điện thoại đã tồn tại trong CSDL hay chưa
    const isPhoneTaken = await Supplier.isPhoneTaken(phone, null);
    if (isPhoneTaken) {
      throw new ApiError(httpStatus.BAD_REQUEST, 'Phone already taken');
    }

    // Kiểm tra tính hợp lệ của số điện thoại
    if (!Supplier.checkSupplier(phone)) {
      throw new ApiError(httpStatus.BAD_REQUEST, config.message.err400);
    }

    // Tạo đối tượng nhà cung cấp mới
    const supplier = new Supplier({
      name: name,
      slug: slug,
      desc: desc,
      phone: phone,
      address: {
        province: address.address.province,
        district: address.address.district,
        address: address.address.address
      }
    });

    console.log(supplier.address);
    // Lưu nhà cung cấp vừa mới được tạo
    const savedSupplier = await supplier.save();
    if (!savedSupplier) {
      throw new ApiError(httpStatus.BAD_REQUEST, config.message.err400);
    }

    // Yêu cầu danh sách nhà cung cấp từ CSDL và cập nhật dữ liệu tạm thời
    await RequestSupplier();

    // Phản hồi với mã thành công và thông báo thành công
    return responseSuccess({ res, message: config.message.success });
  } catch (err) {
    console.log(err);
    // Xử lý lỗi và phản hồi với mã lỗi tương ứng
    return responseError({
      res,
      statusCode: err.status || httpStatus.INTERNAL_SERVER_ERROR,
      message: err.message || config.message.err500
    });
  }
});

const Delete = async (req, res, next) => {
  try {
    const name = req.body.name;
    const _id = req.body._id;
    if (!name && !_id) return res.status(400).send({ msg: config.message.err400 });

    const category = await Category.findOne({ $or: [{ _id: _id }, { name: name }] });
    if (!category) return res.status(400).send({ msg: config.message.errNotExists });
    if (category.products.length > 0) {
      return res.send({ msg: config.message.failure, reason: `Category relate ${category.products.length} products` });
    }
    category.deleteOne((err) => {
      if (err) return res.status(500).send({ msg: config.message.err500 });
      image.destroy(category.image_id);
      return res.send({ msg: config.message.success });
    });
  } catch (err) {
    console.log(err);
    return res.status(500).send({ msg: config.message.err500 });
  }
};

const specsModelMerge = (specsModel, newSpecsInput) => {
  const valuesId_2d = [];
  specsModel.forEach((spec) => {
    const temp = [];
    // @ts-ignore
    spec.values.forEach((value) => {
      temp.push(value._id);
    });
    valuesId_2d.push(temp);
  });

  const result = [];
  // console.log("newspecs",newSpecsInput)
  // console.log("specs",specsModel)
  newSpecsInput.forEach((spec, i) => {
    if (!spec.name) return; // delete spec
    var temp;
    if (specsModel[i] == undefined || specsModel[i]._id == undefined) temp = { name: spec.name, values: [] };
    else temp = { _id: specsModel[i]._id, name: spec.name, values: [] };
    // @ts-ignore
    spec.values.split(';').forEach((value, j) => {
      if (!value) return; // delete value
      var id = valuesId_2d.length > i ? (valuesId_2d[i].length > j ? valuesId_2d[i][j] : undefined) : undefined;
      if (id == undefined) temp.values.push({ value: value });
      else temp.values.push({ _id: id, value: value });
    });
    result.push(temp);
  });
  console.log('result', result);
  return result;
};
const updateSupplier = catchAsync(async (req, res, next) => {
  console.log(req.body);
  const updateSupplier = await supplierService.updateSupplierById(req.params.supplierId, req.body);
  if (!updateSupplier) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Supplier not found');
  }
  res.send({ msg: 'Thành công', supplier: updateSupplier });
});
const deleteSupplier = catchAsync(async (req, res, next) => {
  const supplier = await supplierService.getSupplierById(req.params.supplierId);
  if (supplier.products.length > 0) {
    return res.send({
      msg: config.message.errProductValid,
      reason: `Category relate ${supplier.products.length} products`
    });
  }
  await supplierService.deleteSupplierById(req.params.supplierId);
  responseSuccess({ res, msg: config.message.success });
});
module.exports = {
  createSupplier,
  getASupplier,
  deleteSupplier,
  updateSupplier,
  ValidSpecs,
  List,
  Delete
};
