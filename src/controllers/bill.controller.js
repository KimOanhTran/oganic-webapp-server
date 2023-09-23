const httpStatus = require('http-status');
const Account = require('../models/account.model');
const mongoose = require('mongoose');
const Bill = require('../models/bill.model');
const Import = require('../models/import.model');
const config = require('../config/config');
const sender = require('../services/sender.service');
const { responseSuccess, responseError } = require('../utils/responseType');
const Product = require('../models/product.model');
const Discount = require('../models/discount.model');
const { sortObject, formatDate, isObj, _st } = require('../utils/helpers');
const querystring = require('qs');
const crypto = require('crypto');
const axios = require('axios');
const { date } = require('joi');

// const Revenue = async (req, res, next) => {
//   try {
//     //Lấy thông tin từ request
//     var dateStartStr = req.body.dateStart;
//     var dateEndStr = req.body.dateEnd;
//     var step = req.body.step;
//     var type = req.body.type;
//     //Xử lý dữ liệu thời gian
//     //khởi tạo biến dateStart với giá trị mặc định là 1/2/1970
//     var dateStart = new Date(1970, 1, 1);
//     //khởi tạo dateEnd bằng giá trị hiện tại
//     var dateEnd = new Date(Date.now());

//     //Nếu dataStartStr và dateEndStr có giá trị thì biến dateStart và dateEnd sẽ được cập nhập thành
//     //các giá trị tương ứng
//     if (!!dateEndStr) dateEnd = new Date(dateEndStr);
//     if (!!dateStartStr) dateStart = new Date(dateStartStr);
//     //nếu step không hợp lệ và không thuộc danh sách second, day... thì mặc định sẽ là month
//     if (!step || !['second', 'day', 'month', 'year'].includes(step)) step = 'month';
//     //dùng điều kiện kiểm tra nếu type không hợp lệ thì type sẽ được cập nhập thành bill
//     if (!type || !['bill', 'import'].includes(type)) type = 'bill';

//     //dựa vào giá trị của biến step sẽ xác định được số tgian tương ứng
//     //hoặc sẽ bằng 1 nếu không thuộc các trường hợp trên
//     var step_time =
//       step == 'year' ? config.yearlong : step == 'month' ? config.monthlong : step == 'day' ? config.daylong : 1;
//     //smallest được tính bằng việc trừ giá trị thời gian của dataEnd với step-time
//     var smallest = dateEnd.getTime() - step_time;
//     //Nếu dateStart không có giá trị hoặc lớn hơn thì dateStart sẽ được cập nhập thành smallest
//     //để đảm bảo tgian truy vấn nằm trong ghan hợp lệ
//     if (!dateStart || dateStart.getTime() > smallest) dateStart = new Date(smallest);

//     console.log(dateStart, dateEnd);
//     //định nghĩa type cho câu truy vấn là bill hay import
//     const tempModel = type == 'bill' ? Bill : Import;
//     //biến option được xác định dụa vào type nếu type là bill thì sẽ thêm điều kiện
//     //đơn hàng phải có trạng thái bằng done
//     const option =
//       type == 'bill'
//         ? {
//             createdAt: {
//               $gt: dateStart,
//               $lt: dateEnd
//             },
//             'status.0.statusTimeline': { $in: 'Done' }
//           }
//         : {
//             createdAt: {
//               $gt: dateStart,
//               $lt: dateEnd
//             }
//           };
//     var products1 = [];
//     //@ts-ignore
//     //Thực hiện truy vấn trong csdl và nhận kq là một mảng các đối tượng "bills"
//     //câu truy vấn dữ liệu lấy danh sách hóa đơn hoặc nhập kho tuy thuộc vào biến opptions
//     tempModel.find(option).exec((err, bills) => {
//       if (err) return res.status(500).send({ msg: config.message.err500 });
//       if (bills.length == 0)
//         return responseSuccess({ res, message: config.success, data: { graph: [], products: [] } });
//       // Gom nhom du lieu
//       var counter = {};
//       var graph = [];

//       var time = bills[0].createdAt; //lấy tgian của phần từ đầu tiên trong ds
//       var threshold = time.getTime() + step_time; //tính toán ngưỡng tgian cho mốc tgian tiếp theo
//       //dựa vào tgian của phần từ đầu tiên và step time
//       //khởi tạo một điểm dl để gom nhóm thông tin hóa đơn
//       var point = { bills: [], total: 0, time, count: 0 };
//       //duyệt qua danh sách đơn nhập hoặc đơn xuất để gom nhóm dữ liệu
//       bills.forEach((b) => {
//         //kiểm tra xem thời gian của đơn có nằm ngoài mốc tgian hiện tại không
//         //nếu có thì lưu thông tin của mốc tgian hiện tại vào graph va tạo một điểm dl mới
//         if (b.createdAt.getTime() > threshold) {
//           graph.push(point);
//           time = b.createdAt;
//           threshold = time.getTime() + step_time;
//           point = { bills: [], total: 0, time, count: 0 };
//         }
//         var total = 0;
//         var count = 0;
//         b.products.forEach((d) => {
//           var key = d.product.toString();
//           var price = d.quantity * d.price;
//           if (counter.hasOwnProperty(d.product)) {
//             counter[key].count += d.quantity;
//             counter[key].total += price;
//           } else {
//             counter[key] = { count: d.quantity, total: price };
//           }
//           count += d.quantity;
//           total += price;
//         });
//         point.bills.push({ _id: b._id, price: total });
//         point.total += total;
//         point.count += count;
//       });

//       //nếu tổng doanh thu hiện tại lớn hơn không thì thêm mốc tgian hiện tại vào grap
//       if (point.total > 0) graph.push(point);

//       //tạo mảng id chứa danh sách các ID sản phẩm trong couter
//       var ids = Array.from(Object.keys(counter));
//       Product.find({ _id: { $in: ids } })
//         .select('name code colors image_url')
//         .exec((err, docs) => {
//           if (err) return res.send({ msg: config.success, data: { graph } });
//           // @ts-ignore
//           // var products = [];
//           docs.forEach((d) => {
//             var key = d._id.toString();
//             products1.push({
//               _id: d._id,
//               name: d.name,
//               code: d.code,
//               image_url: d.image_url,
//               quantity: d.colors.reduce((a, b) => a + b.quantity, 0),
//               sold: counter[key].count,
//               total: counter[key].total
//             });
//           });
//         });
//     });

//     /********************************************************************************* */
//     const tempModel1 = type == 'bill' ? Import : Bill;
//     const optionTemp =
//       type == 'bill'
//         ? {
//             createdAt: {
//               $gt: dateStart,
//               $lt: dateEnd
//             }
//           }
//         : {
//             createdAt: {
//               $gt: dateStart,
//               $lt: dateEnd
//             },
//             'status.0.statusTimeline': { $in: 'Done' }
//           };
//     tempModel1.find(optionTemp).exec((err, bills) => {
//       // if (err) return res.status(500).send({ msg: config.message.err500 });
//       // if (bills.length == 0)
//       //   return responseSuccess({ res, message: config.success, data: { graph: [], products: [] } });
//       // Gom nhom du lieu
//       var counter = {};
//       var graph = [];

//       var time = bills[0].createdAt; //lấy tgian của phần từ đầu tiên trong ds
//       var threshold = time.getTime() + step_time; //tính toán ngưỡng tgian cho mốc tgian tiếp theo
//       //dựa vào tgian của phần từ đầu tiên và step time
//       //khởi tạo một điểm dl để gom nhóm thông tin hóa đơn
//       var point = { bills: [], total: 0, time, count: 0 };
//       //duyệt qua danh sách đơn nhập hoặc đơn xuất để gom nhóm dữ liệu
//       bills.forEach((b) => {
//         //kiểm tra xem thời gian của đơn có nằm ngoài mốc tgian hiện tại không
//         //nếu có thì lưu thông tin của mốc tgian hiện tại vào graph va tạo một điểm dl mới
//         if (b.createdAt.getTime() > threshold) {
//           graph.push(point);
//           time = b.createdAt;
//           threshold = time.getTime() + step_time;
//           point = { bills: [], total: 0, time, count: 0 };
//         }
//         var total = 0;
//         var count = 0;
//         b.products.forEach((d) => {
//           var key = d.product.toString();
//           var price = d.quantity * d.price;
//           if (counter.hasOwnProperty(d.product)) {
//             counter[key].count += d.quantity;
//             counter[key].total += price;
//           } else {
//             counter[key] = { count: d.quantity, total: price };
//           }
//           count += d.quantity;
//           total += price;
//         });
//         point.bills.push({ _id: b._id, price: total });
//         point.total += total;
//         point.count += count;
//       });

//       //nếu tổng doanh thu hiện tại lớn hơn không thì thêm mốc tgian hiện tại vào grap
//       if (point.total > 0) graph.push(point);

//       //tạo mảng id chứa danh sách các ID sản phẩm trong couter
//       var ids = Array.from(Object.keys(counter));
//       Product.find({ _id: { $in: ids } })
//         .select('name code colors image_url')
//         .exec((err, docs) => {
//           // if (err) return res.send({ msg: config.success, data: { graph } });
//           // @ts-ignore
//           var temp = [];
//           docs.forEach((d) => {
//             var key = d._id.toString();
//             temp.push({
//               _id: d._id,
//               name: d.name,
//               code: d.code,
//               image_url: d.image_url,
//               quantity: d.colors.reduce((a, b) => a + b.quantity, 0),
//               sold: counter[key].count,
//               total: counter[key].total
//             });
//           });
//           return responseSuccess({ res, message: config.message.success, data: { graph, products1, temp } });
//         });
//     });
//   } catch (err) {
//     console.log(err);
//     return res.status(500).send({ msg: config.message.err500 });
//   }
// };
const processBills = async (model, option, step_time) => {
  const bills = await model.find(option).exec();
  console.log('------------------------' + bills);

  const counter = {};
  const graph = [];
  let time = bills[0]?.createdAt;
  let threshold = time?.getTime() + step_time;
  let point = { bills: [], total: 0, time, count: 0 };

  for (const b of bills) {
    if (b.createdAt.getTime() > threshold) {
      graph.push(point);
      time = b.createdAt;
      threshold = time.getTime() + step_time;
      point = { bills: [], total: 0, time, count: 0 };
    }
    let total = 0;
    let count = 0;

    for (const d of b.products) {
      const key = d.product.toString();
      // console.log(key);
      const price = d.quantity * d.price;
      if (counter[key]) {
        counter[key].count += d.quantity;
        counter[key].total += price;
      } else {
        counter[key] = { count: d.quantity, total: price };
      }

      count += d.quantity;
      total += price;
    }
    point.bills.push({ _id: b._id, price: total });
    point.total += total;
    point.count += count;
  }

  if (point.total > 0) {
    graph.push(point);
  }

  return { counter, graph };
};

const Revenue = async (req, res, next) => {
  try {
    const dateStartStr = req.body.dateStart;
    const dateEndStr = req.body.dateEnd;
    let step = req.body.step;
    let type = req.body.type;
    var listProduct = [];
    var tempListProduct = [];

    const dateStart = dateStartStr ? new Date(dateStartStr) : new Date(1970, 1, 1);
    const dateEnd = dateEndStr ? new Date(dateEndStr) : new Date();

    step = ['second', 'day', 'month', 'year'].includes(step) ? step : 'month';
    type = ['bill', 'import'].includes(type) ? type : 'bill';

    const step_time =
      step === 'year' ? config.yearlong : step === 'month' ? config.monthlong : step === 'day' ? config.daylong : 1;

    const smallest = dateEnd.getTime() - step_time;
    if (!dateStart || dateStart.getTime() > smallest) {
      dateStart.setTime(smallest);
    }

    const tempModel = type === 'bill' ? Bill : Import;
    const option =
      type === 'bill'
        ? { createdAt: { $gt: dateStart, $lt: dateEnd }, 'status.0.statusTimeline': { $in: ['Done'] } }
        : { createdAt: { $gt: dateStart, $lt: dateEnd } };

    const { counter: counter1, graph: tempGraph } = await processBills(tempModel, option, step_time);
    const ids = Array.from(Object.keys(counter1));
    const docs = await Product.find({ _id: { $in: ids } })
      .select('name code colors image_url')
      .exec();

    listProduct = docs.map((d) => {
      const key = d._id.toString();
      return {
        _id: d._id,
        name: d.name,
        code: d.code,
        image_url: d.image_url,
        quantity: d.colors.reduce((a, b) => a + b.quantity, 0),
        sold: counter1[key].count,
        total: counter1[key].total
      };
    });

    const tempModel1 = type === 'bill' ? Import : Bill;
    const tempOption =
      type === 'bill'
        ? { createdAt: { $gt: dateStart, $lt: dateEnd } }
        : { createdAt: { $gt: dateStart, $lt: dateEnd }, 'status.0.statusTimeline': { $in: ['Done'] } };

    const { counter: counter2, graph } = await processBills(tempModel1, tempOption, step_time);
    const tempIds = Array.from(Object.keys(counter2));
    const tempDocs = await Product.find({ _id: { $in: tempIds } })
      .select('name code colors image_url')
      .exec();

    tempListProduct = tempDocs.map((d) => {
      const key = d._id.toString();
      return {
        _id: d._id,
        name: d.name,
        code: d.code,
        image_url: d.image_url,
        quantity: d.colors.reduce((a, b) => a + b.quantity, 0),
        sold: counter2[key].count,
        total: counter2[key].total
      };
    });

    return responseSuccess({
      res,
      message: config.message.success,
      data: { tempGraph, listProduct, tempListProduct }
    });
  } catch (err) {
    console.log(err);
    return res.status(500).send({ msg: config.message.err500 });
  }
};

// const calculateProfitLoss = async (req, res, next) => {
//   console.log('==================><');
//   try {
//     // Lấy thông tin từ request
//     const dateStartStr = req.body.dateStart;
//     const dateEndStr = req.body.dateEnd;
//     let step = req.body.step;
//     let type = req.body.type;

//     // Xử lý dữ liệu thời gian
//     const dateStart = new Date(1970, 1, 1); // Khởi tạo dateStart với giá trị mặc định
//     const dateEnd = new Date(); // Khởi tạo dateEnd với giá trị hiện tại

//     if (!!dateEndStr) dateEnd = new Date(dateEndStr);
//     if (!!dateStartStr) dateStart = new Date(dateStartStr);

//     // Xử lý step và type
//     if (!step || !['second', 'day', 'month', 'year'].includes(step)) {
//       step = 'month'; // Nếu step không hợp lệ, mặc định là month
//     }

//     if (!type || !['bill', 'import'].includes(type)) {
//       type = 'bill'; // Nếu type không hợp lệ, mặc định là bill
//     }

//     // Xác định khoảng thời gian dựa vào step
//     const step_time =
//       step === 'year' ? config.yearlong : step === 'month' ? config.monthlong : step === 'day' ? config.daylong : 1;

//     // Tính toán giới hạn thời gian nhỏ nhất (smallest)
//     const smallest = dateEnd.getTime() - step_time;

//     if (!dateStart || dateStart.getTime() > smallest) {
//       dateStart = new Date(smallest);
//     }

//     // Định nghĩa model dựa vào type
//     const tempModel = type === 'bill' ? Bill : Import;

//     // Xác định option cho truy vấn dữ liệu
//     const Bills = {
//       createdAt: {
//         $gt: dateStart,
//         $lt: dateEnd
//       },
//       'status.0.statusTimeline': { $in: ['Done'] }
//     };

//     const products = [];
//     // Thực hiện truy vấn và nhận kết quả là một mảng các đối tượng "bills"
//     tempModel.find(Bills).exec((err, bills) => {
//       if (err) {
//         // return res.status(500).send({ msg: config.message.err500 });
//       }

//       if (bills.length === 0) {
//         // return responseSuccess({ res, message: config.success, data: { graph: [], products: [] } });
//       }

//       // Gom nhóm dữ liệu
//       const counter = {};
//       const graph = [];

//       let time = bills[0].createdAt;
//       const threshold = time.getTime() + step_time;
//       let point = { bills: [], total: 0, time, count: 0 };

//       bills.forEach((b) => {
//         if (b.createdAt.getTime() > threshold) {
//           graph.push(point);
//           time = b.createdAt;
//           threshold = time.getTime() + step_time;
//           point = { bills: [], total: 0, time, count: 0 };
//         }

//         let total = 0;
//         let count = 0;

//         b.products.forEach((d) => {
//           const key = d.product.toString();
//           const price = d.quantity * d.price;

//           if (counter.hasOwnProperty(d.product)) {
//             counter[key].count += d.quantity;
//             counter[key].total += price;
//           } else {
//             counter[key] = { count: d.quantity, total: price };
//           }

//           count += d.quantity;
//           total += price;
//         });

//         point.bills.push({ _id: b._id, price: total });
//         point.total += total;
//         point.count += count;
//       });

//       if (point.total > 0) {
//         graph.push(point);
//       }

//       const ids = Array.from(Object.keys(counter));

//       Product.find({ _id: { $in: ids } })
//         .select('name code colors image_url')
//         .exec((err, docs) => {
//           if (err) {
//             // return res.send({ msg: config.success, data: { graph } });
//           }

//           docs.forEach((d) => {
//             const key = d._id.toString();
//             products.push({
//               _id: d._id,
//               name: d.name,
//               code: d.code,
//               image_url: d.image_url,
//               quantity: d.colors.reduce((a, b) => a + b.quantity, 0),
//               sold: counter[key].count,
//               total: counter[key].total
//             });
//           });
//           console.log('bill\n' + products.data);
//         });
//     });

//     /**************************************************** */
//     const Imports = {
//       createdAt: {
//         $gt: dateStart,
//         $lt: dateEnd
//       },
//       'status.0.statusTimeline': { $in: ['Done'] }
//     };
//     // Thực hiện truy vấn và nhận kết quả là một mảng các đối tượng "bills"
//     tempModel.find(Imports).exec((err, bills) => {
//       if (err) {
//         // return res.status(500).send({ msg: config.message.err500 });
//       }

//       if (bills.length === 0) {
//         // return responseSuccess({ res, message: config.success, data: { graph: [], products: [] } });
//       }

//       // Gom nhóm dữ liệu
//       const counter = {};
//       const graph = [];

//       let time = bills[0].createdAt;
//       const threshold = time.getTime() + step_time;
//       let point = { bills: [], total: 0, time, count: 0 };

//       bills.forEach((b) => {
//         if (b.createdAt.getTime() > threshold) {
//           graph.push(point);
//           time = b.createdAt;
//           threshold = time.getTime() + step_time;
//           point = { bills: [], total: 0, time, count: 0 };
//         }

//         let total = 0;
//         let count = 0;

//         b.products.forEach((d) => {
//           const key = d.product.toString();
//           const price = d.quantity * d.price;

//           if (counter.hasOwnProperty(d.product)) {
//             counter[key].count += d.quantity;
//             counter[key].total += price;
//           } else {
//             counter[key] = { count: d.quantity, total: price };
//           }

//           count += d.quantity;
//           total += price;
//         });

//         point.bills.push({ _id: b._id, price: total });
//         point.total += total;
//         point.count += count;
//       });

//       if (point.total > 0) {
//         graph.push(point);
//       }

//       const ids = Array.from(Object.keys(counter));

//       Product.find({ _id: { $in: ids } })
//         .select('name code colors image_url')
//         .exec((err, docs) => {
//           if (err) {
//             return res.send({ msg: config.success, data: { graph } });
//           }

//           const imports = [];
//           docs.forEach((d) => {
//             const key = d._id.toString();
//             imports.push({
//               _id: d._id,
//               name: d.name,
//               code: d.code,
//               image_url: d.image_url,
//               quantity: d.colors.reduce((a, b) => a + b.quantity, 0),
//               sold: counter[key].count,
//               total: counter[key].total
//             });
//           });

//           console.log('import\n' + imports);
//           return responseSuccess({ res, message: config.message.success, data: { graph, imports, products } });
//         });
//     });
//   } catch (err) {
//     console.log(err);
//     return res.status(500).send({ msg: config.message.err500 });
//   }
// };

const shipCalculate = async (address, weight, value) => {
  var result = { error: '', value: 200000 };
  if (!address || !address.province || !address.district || !address.address) {
    result.error += 'Địa chỉ thiếu. ';
    return result;
  }
  const data = {
    // "pick_province": process.env.PICK_PROVINCE,
    // "pick_district": process.env.PICK_PROVINCE,
    // "province": address.province,
    // "district": address.district,
    // "address": address.address,
    pick_province: 'TP Hồ Chí Minh',
    pick_district: 'Quận 1',
    province: address.province,
    district: address.district,
    value: value,
    weight: weight,
    transport: 'road',
    deliver_option: 'xteam',
    tags: ['1']
  };
  try {
    const ghtk = await axios.get(process.env.GHTK_URL + fromObject(data), {
      headers: { Token: `${process.env.GHTK_API_TOKEN}` }
    });
    if (ghtk.status != 200 || ghtk.data.success == false) {
      result.error += `Xảy ra lỗi khi tính toán giá ship. `;
      return result;
    }
    const fee = ghtk.data.fee.fee;
    console.log(ghtk);
    fee ? (result.value = fee) : (result.value = 200000);
    return result;
  } catch (err) {
    console.log(err);
    return result;
  }
};
const discountCalculate = async (code, cartItems, total, ship, account_id = '') => {
  var result = { error: '', value: 0, doc: undefined };

  // validate
  if (!code) return result;
  const discount = await Discount.findOne({ code });

  console.log(discount);
  if (!discount) {
    result.error += 'Mã discount không tồn tại. ';
    return result;
  }
  if (discount.quantity <= 0) {
    result.error += 'Mã discount hết số lượng. ';
    return result;
  }
  if (discount.is_oic && discount.used.hasOwnProperty(account_id)) {
    result.error += 'Mã discount không thể sử dụng nhiều lần. ';
    return result;
  }
  const currentTimestamp = new Date().getTime();
  console.log('date', currentTimestamp);
  if (discount.dateStart > currentTimestamp || discount.dateEnd < currentTimestamp) {
    result.error += 'Mã discount  ngoài thời gian áp dụng. ';
    return result;
  }
  if (
    discount.is_oid &&
    discount.used.hasOwnProperty(account_id) &&
    Date.now() - discount.used[account_id] < config.daylong
  ) {
    result.error += 'Mã discount không thể sử dụng nhiều lần trong 24h. ';
    return result;
  }
  if (total < discount.minPrice) {
    result.error += `Mã discount chỉ áp dụng cho đơn hàng > ${discount.minPrice}. `;
    return result;
  }

  // @ts-ignore
  if (discount.accounts.length > 0 && !discount.accounts.includes(account_id)) {
    result.error += `Mã discount chỉ áp dụng cho một vài tài khoản. `;
    return result;
  }
  if (discount.products.length > 0 && !discount.accounts.includes(account_id)) {
    const item = cartItems.find((e) => !discount.products.includes(e.product));
    if (!!item) {
      result.error += `Mã discount không thể áp dụng cho ${item.name}. `;
      return result;
    }
  }
  if (discount.categories.length > 0) {
    const item = cartItems.find((e) => !discount.categories.includes(e.category));
    if (!!item) {
      result.error += `Mã discount không thể áp dụng cho ${item.category}. `;
      return result;
    }
  }
  // calc
  var temp = discount.value;
  if (discount.is_ship) result.value = Math.min(discount.is_percent ? temp * ship : temp, discount.maxPrice, ship);
  else result.value = Math.min(discount.is_percent ? (temp * total) / 100 : temp, discount.maxPrice, total);
  result.doc = discount;
  return result;
};
const SubBill = async (req, res, next) => {
  try {
    const discountCode = req.body.discountCode;
    const cartItems = req.body.cartItems;
    var address = req.body.address;
    var account = req.user;
    var warning = req.body.warning;
    var addDiscount;
    if (discountCode == '') {
      addDiscount = false;
    } else {
      addDiscount = true;
    }

    var total = 0;
    var reduce = 0;
    var weight = 0;
    cartItems.forEach((e) => {
      total += e.price * e.quantity;
      reduce += (e.price * e.quantity * e.sale) / 100;
      weight += e.quantity * 500; // 500gr for each obj
    });

    if (!address) address = account.address;
    var result_ship = await shipCalculate(address, weight, total);
    var ship = 0;
    if (!!result_ship.error) {
      warning += result_ship.error;
    } else ship = result_ship.value;

    var result_discount = await discountCalculate(
      discountCode,
      cartItems,
      total,
      ship,
      account ? account._id.toString() : ''
    );
    reduce += result_discount.value;
    warning += result_discount.error;

    res.send({
      msg: config.message.success,
      warning,
      addDiscount: addDiscount,
      data: { cart_details: cartItems, ship, total, discount: reduce, discountCode, address }
    });
  } catch (err) {
    console.log(err);
    return res.status(500).send({ config: config.message.err500 });
  }
};

const Phoneformat = (phone) => {
  if (!!phone && config.regex.phone.test(phone)) {
    if (phone[0] == '0') phone = '+84' + phone.slice(1);
    else if (phone[0] != '+') phone = '+' + phone;
  }
  return phone;
};

const Create = async (req, res, next) => {
  console.log('create');
  try {
    const discountCode = req.body.discountCode;
    const cartItems = req.body.cartItems;
    const address = req.body.address;
    var account = req.user;
    const phone = req.body.phone;
    const email = req.body.email;
    const name = req.body.name;
    const cod = req.body.cod;
    var warning = req.body.warning;
    var verify = false;

    console.log(phone);

    if (!cartItems || cartItems.length == 0)
      return res.status(400).send({ status: 400, msg: 'Giỏ hàng rỗng. ' + warning });
    if (cod == undefined) return res.status(400).send({ status: 400, msg: 'Mời chọn phương thức thanh toán' });
    if (!phone) return res.status(400).send({ status: 400, msg: 'Thiếu số điện thoại. ' });
    if (!!account) {
      if (phone != account.phone) {
        if (!!(await Account.findOne({ phone })))
          return res.status(400).send({ status: 400, msg: 'Số điện thoại này đã liên kết với tài khoản khác' });
      } else if (email != account.email) {
        if (!!(await Account.findOne({ email })))
          return res.status(400).send({ status: 400, msg: 'Email này đã liên kết với tài khoản khác' });
      } else verify = true;
    } else {
      account = await Account.findOne({ phone });
      if (!account) {
        account = await new Account({ phone, name, email }).save();
        if (!account) return res.status(500).send({ status: 500, msg: config.message.err500 });
      }
    }

    if (!account.enable)
      return res.status(400).send({ status: 400, msg: 'Người dùng bị đóng băng khỏi việc mua bán. ' });

    if (!cartItems || cartItems.length == 0)
      return res.status(400).send({ status: 400, msg: 'Giỏ hàng rỗng. ' + warning });
    var total = 0;
    var reduce = 0;
    var weight = 0;
    cartItems.forEach((e) => {
      total += e.price * e.quantity;
      reduce += (e.price * e.quantity * e.sale) / 100;
      weight += e.quantity * 500; // 500gr for each obj
    });
    var result_ship = await shipCalculate(address, weight, total);
    var ship = 0;
    if (!!result_ship.error) {
      warning += result_ship.error;
    } else ship = result_ship.value;
    var result_discount = await discountCalculate(discountCode, cartItems, total, ship, account._id.toString() || '');
    reduce += result_discount.value;
    warning += result_discount.error;
    const discount = result_discount.doc;

    if (!!warning) return res.status(400).send({ status: 400, msg: warning });

    const products = [];
    cartItems.forEach((i) =>
      products.push({ product: i.product, color: i.color, quantity: i.quantity, price: i.price, sale: i.sale })
    );
    const status = [{ statusTimeline: 'Ordered', time: Date.now() }];
    const bill = new Bill({
      account: account._id,
      phone: phone,
      address,
      products,
      discountCode,
      ship,
      total,
      discount: reduce,
      verify,
      status
    });
    // console.log("bill",bill)
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
      const opts = { session };
      const billDoc = await bill.save(opts);
      const accountDoc = await account.updateOne({ $push: { bills: billDoc._id }, cart: [] }, opts).exec();

      if (!billDoc || !accountDoc) throw Error('Liên kết bill và account lỗi');

      // update discount
      if (!!discount) {
        if (!!discount.quantity) {
          discount.quantity -= 1;
        }
        discount.used[account._id.toString()] = Date.now();
        const discountSave = new Discount(discount);
        if (!(await discountSave.save())) throw Error('Không thể áp dụng discount');
      }
      for (let i = 0; i < products.length; i++) {
        const e = products[i];
        const product = await Product.findById(e.product);
        product.colors[cartItems[i].colorIndex].quantity -= e.quantity;
        product.sold += e.quantity;
        if (!(await product.save(opts))) throw Error('Không thể lưu sản phẩm');
      }
      await session.commitTransaction();
      session.endSession();
      if (!!account.email) sender.SendMail(account.email, 'Tạo Đơn Hàng Thành Công', 'Mã đơn: ' + billDoc._id);
      console.log('================> ' + account.email);
      // const newPhone = Phoneformat(phone);
      // sender.SendSMS('Tạo Đơn Hàng Thành Công, Mã đơn: ' + billDoc._id, newPhone);
      const ms_sc = 'Tạo Đơn Hàng Thành Công, Mã đơn: ' + billDoc._id;
      await Account.findByIdAndUpdate(bill.account._id.toString(), {
        $push: { notifications: { $each: [{ message: ms_sc }], $position: 0 } }
      })
        .select('_id')
        .exec();
      if (cod == true) return res.status(200).send({ status: 200, msg: config.message.success });
      else {
        req.body.createDate = formatDate(billDoc.createdAt);
        req.body.amount = total - reduce + ship;
        req.body.bill_id = bill._id;
        return next();
      }
    } catch (error) {
      console.log(error);
      const ms_fl = 'Tạo Đơn Hàng Thất Bại';
      await Account.findByIdAndUpdate(account._id.toString(), {
        $push: { notifications: { $each: [{ message: ms_fl }], $position: 0 } }
      })
        .select('_id')
        .exec();
      await session.abortTransaction();
      session.endSession();
      return res.status(400).send({ status: 400, msg: 'Lỗi không lưu bill' });
    }
  } catch (err) {
    console.log(err);
    return res.status(500).send({ status: 500, msg: config.message.err500 });
  }
};
const Update = async (req, res, next) => {
  try {
    const _id = req.body._id;
    const status = req.body.status;
    const account = req.user;
    const desc = req.body.desc;
    if (!_id || !status) return res.status(400).send({ msg: config.message.err400 });

    const bill = await Bill.findById(_id).populate('account', 'phone email').exec();
    if (!bill) return res.status(400).send({ msg: config.message.errNotExists });

    if (bill.status[0].statusTimeline == status || bill.status[0].statusTimeline == 'Canceled')
      return responseSuccess({ res, message: config.message.success });
    const list = bill.status.map((e) => e.statusTimeline);

    if (list.includes(status)) {
      return responseError({ res, message: 'Cập nhật thất bại !' });
    } else if (account.role == 'Customer' && status == 'Canceled') {
      // @ts-ignore
      const bills = (await Account.findById(account._id).select('bills')).bills;
      // @ts-ignore
      if (bills.includes(_id)) {
        const doc = await Account.findByIdAndUpdate(account._id, { $inc: { warning: 1 } });
        if (!doc) throw Error('Account cannot save');
      } else return res.status(400).send({ msg: config.message.errPermission });
    } else if (account.role == 'Customer') return res.status(400).send({ msg: config.message.errPermission });
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
      const opts = { session };
      bill.status.unshift({ statusTimeline: status, time: Date.now() });
      bill.desc = desc;
      bill.markModified('status');
      bill.markModified('desc');

      if (status == 'Canceled' && bill.paid == false) {
        bill.refund = true;
        bill.markModified('refund');
      }

      const billDoc = await bill.save(opts);
      if (!billDoc) throw Error('Fail');

      if (status == 'Canceled')
        // Refill product
        for (let i = 0; i < bill.products.length; i++) {
          const e = bill.products[i];
          const product = await Product.findById(e.product);
          if (!product) throw Error('Product không tồn tại');
          var colorIndex = -1;
          for (let i = 0; i < product.colors.length; i++) {
            if (product.colors[i].color == e.color) {
              colorIndex = i;
              break;
            }
          }
          if (colorIndex == -1) throw Error('Màu Product không tồn tại');
          product.colors[colorIndex].quantity += e.quantity;
          product.sold -= e.quantity;
          if (!(await product.save(opts))) throw Error('Không thể lưu sản phẩm');
        }
      else if (status == 'Done') {
        // Add product to rates of account
        const products = [];
        for (let i = 0; i < bill.products.length; i++) {
          products.push(bill.products[i].product);
        }
        console.log('bill', bill);
        if (
          !(await Account.findByIdAndUpdate(
            bill.account._id,
            { $push: { rate_waits: { $each: products } } },
            opts
          ).exec())
        )
          throw Error('Fail');
      }

      await session.commitTransaction();
      session.endSession();
      const message = 'Đơn hàng ' + billDoc._id + ' chuyển sang trạng thái ' + billDoc.status[0].statusTimeline;
      const newPhone = Phoneformat(bill.phone);
      // @ts-ignore
      if (!!bill.account.email) sender.SendMail(bill.account.email, 'Trạng Thái Đơn Hàng ' + billDoc._id, message);
      sender.SendSMS(message, newPhone);
      await Account.findByIdAndUpdate(bill.account._id.toString(), {
        $push: { notifications: { $each: [{ message }], $position: 0 } }
      })
        .select('_id')
        .exec();
      return responseSuccess({ res, message: config.message.success });
    } catch (error) {
      console.log(error);
      await session.abortTransaction();
      session.endSession();
      return res.status(400).send({ msg: 'Lỗi không lưu bill' });
    }
  } catch (err) {
    console.log(err);
    res.status(500).send({ msg: config.message.err500 });
  }
};

const List = async (req, res, next) => {
  try {
    const skip = Number(req.query.skip) || 0;
    const limit = Number(req.query.limit) || 10000;
    const search = req.query.search;
    const status = req.query.status;
    const sortName = req.query.sortName;
    const sortType = req.query.sortType;
    var sortOptions = {};
    var queryOptions = {};
    !!status ? (queryOptions['status.0.statusTimeline'] = { $in: status }) : (queryOptions = {});

    if (!!sortName && ['ship', 'total', 'discount'].includes(sortName) && (sortType == 1 || sortType == -1)) {
      sortOptions[sortName] = sortType;
    }

    if (!!search) {
      const pattern = { $regex: '.*' + search + '.*', $options: 'i' };
      queryOptions['$or'] = [{ phone: pattern }];
      console.log(pattern);
    }
    const count = await Bill.countDocuments(queryOptions);
    const result = await Bill.find(queryOptions)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .select('-products')
      .populate('account', 'name phone email')
      .exec();
    if (!result) return res.status(500).send({ msg: config.err500 });
    const total = result.reduce((pre, next) => pre + next.total, 0);
    return res.status(200).send({ status: 200, msg: config.success, data: result, count: count, total: total });
  } catch (err) {
    console.log(err);
    res.status(500).send({ status: 500, msg: config.err500 });
  }
};

const Read = async (req, res, next) => {
  try {
    const _id = req.body._id;
    const account = req.user;

    if (!!account && account.role == 'Customer' && !account.bills.includes(_id)) {
      return res.status(400).send({ status: 400, msg: config.message.errPermission });
    }

    Bill.findById(_id)
      .populate({
        path: 'products',
        populate: {
          path: 'product',
          model: 'Product',
          select: 'name code image_url colors'
        }
      })
      .populate('account', 'name email phone')
      .exec((err, doc) => {
        if (err) return res.status(500).send({ status: 500, msg: config.message.err500 });
        if (!doc) return res.status(400).send({ status: 400, msg: config.message.err400 });
        return res.send({ status: 200, msg: config.message.success, data: doc });
      });
  } catch (err) {
    console.log(err);
    res.status(500).send({ status: 500, msg: config.message.err500 });
  }
};
const Verity = async (req, res, next) => {
  try {
    const _id = req.body._id;
    Bill.findByIdAndUpdate(_id, { verify: true }).exec((err, doc) => {
      if (!!err) return res.status(500).send({ status: 500, msg: config.message.errInternal });
      return res.status(200).send({ status: 200, msg: config.message.success });
    });
  } catch (err) {
    console.log(err);
    return res.status(500).send({ status: 500, msg: config.message.errInternal });
  }
};
const Refund = async (req, res, next) => {
  try {
    const _id = req.body._id;
    Bill.findByIdAndUpdate(_id, { refund: true }).exec((err, doc) => {
      if (!!err) return res.status(500).send({ status: 500, msg: config.message.errInternal });
      return res.status(200).send({ status: 200, msg: config.message.success });
    });
  } catch (err) {
    console.log(err);
    return res.status(500).send({ status: 500, msg: config.message.errInternal });
  }
};
const VNPay = async (req, res, next) => {
  const amount = req.body.amount;
  const createDate = req.body.createDate;
  const bill_id = req.body.bill_id;

  var ipAddr = req.headers['x-forwarded-for'] || req.socket.remoteAddress || req.ip;

  var tmnCode = process.env.VNP_TMN_CODE;
  var secretKey = process.env.VNP_SECRET_KEY;
  var vnpUrl = process.env.VNP_URL;

  //var createDate = formatDate(billDoc.createdAt);
  //var amount = total - reduce + ship;

  var vnp_Params = {};
  vnp_Params['vnp_Version'] = '2.1.0';
  vnp_Params['vnp_Command'] = 'pay';
  vnp_Params['vnp_TmnCode'] = tmnCode;
  // vnp_Params['vnp_Merchant'] = ''
  vnp_Params['vnp_Locale'] = 'vn';
  vnp_Params['vnp_CurrCode'] = 'VND';
  vnp_Params['vnp_TxnRef'] = bill_id;
  vnp_Params['vnp_OrderInfo'] = 'Thanh toan bill ' + bill_id;
  vnp_Params['vnp_OrderType'] = 110000;
  vnp_Params['vnp_Amount'] = amount * 100;
  // vnp_Params['vnp_ReturnUrl'] = `${req.protocol}://${req.hostname}/api/bill/vnpay_ipn`;
  vnp_Params['vnp_ReturnUrl'] = `http://localhost:8000/api/bill/vnpay_ipn`;
  vnp_Params['vnp_IpAddr'] = ipAddr;
  vnp_Params['vnp_CreateDate'] = createDate;

  vnp_Params = sortObject(vnp_Params);

  var signData = querystring.stringify(vnp_Params, { encode: false });
  var hmac = crypto.createHmac('sha512', secretKey);
  var signed = hmac.update(Buffer.from(signData, 'utf-8')).digest('hex');
  vnp_Params['vnp_SecureHash'] = signed;
  vnpUrl += '?' + querystring.stringify(vnp_Params, { encode: false });

  res.status(200).send({ status: 200, msg: config.message.success, data: vnpUrl });
};
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
    var c = '' + prefix + _st(param, prefix);
    if (isObj(params[param]) && !skipobjects) {
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
const CheckVNPay = async (req, res, next) => {
  try {
    var vnp_Params = req.query;
    var secureHash = vnp_Params['vnp_SecureHash'];

    delete vnp_Params['vnp_SecureHash'];
    delete vnp_Params['vnp_SecureHashType'];

    vnp_Params = sortObject(vnp_Params);

    var secretKey = process.env.VNP_SECRET_KEY;
    var signData = querystring.stringify(vnp_Params, { encode: false });
    var hmac = crypto.createHmac('sha512', secretKey);
    var signed = hmac.update(Buffer.from(signData, 'utf-8')).digest('hex');

    if (secureHash === signed) {
      var orderId = vnp_Params['vnp_TxnRef'];
      var rspCode = vnp_Params['vnp_ResponseCode'];

      //Kiem tra du lieu co hop le khong, cap nhat trang thai don hang va gui ket qua cho VNPAY theo dinh dang duoi
      const bill = await Bill.findById(orderId).populate('account', 'phone email').exec();
      if (!!bill) {
        var message = '';
        if (rspCode == '00') {
          bill.verify = true;
          bill.paid = true;
          bill.desc = 'Thanh toán online thành công. ';
          if (!(await bill.save())) {
            res.status(301).redirect(process.env.VNP_RTN_URL);
            message = 'Bill ' + bill._id + ' thanh toán hoàn tất nhưng cập nhật thất bại. ';
            console.log(message);
            message += 'Bạn nhanh chóng liên hệ chuyên viên tư vấn của chúng tôi để được giải quyết nhanh nhất. ';
          } else {
            // res.status(301).redirect(process.env.VNP_RTN_URL + '/thanh-toan/thanh-cong');
            res.status(301).redirect('http://localhost:3000/thanh-toan/thanh-cong');
            message = 'Bill ' + bill._id + ' thanh toán hoàn tất';
          }
        } else {
          bill.verify = false;
          bill.paid = false;
          bill.desc = 'Thanh toán online thất bại. Việc thanh toán sẽ chuyển sang trực tiếp. ';
          if (!(await bill.save())) {
            res.status(301).redirect(process.env.VNP_RTN_URL);
            message = 'Bill ' + bill._id + ' không thanh toán hoàn tất nhưng hủy bill thất bại. ';
            console.log(message);
            message += 'Bạn nhanh chóng liên hệ chuyên viên tư vấn của chúng tôi để được giải quyết nhanh nhất. ';
          } else {
            res.status(301).redirect(process.env.VNP_RTN_URL);
            message = 'Bill ' + bill._id + ' thanh toán thất bại, đơn hàng chuyển sang trả tiền mặt. ';
          }
        }
        // @ts-ignore
        if (!!bill.account.email) SendMail(bill.account.email, 'Thanh Toán Đơn Hàng ' + bill._id, message);
        SendSMS(message, bill.phone);
        await Account.findByIdAndUpdate(bill.account._id.toString(), {
          $push: { notifications: { $each: [{ message }], $position: 0 } }
        })
          .select('_id')
          .exec();
      } else {
        //res.status(200).json({ RspCode: rspCode, Message: 'Bill không tồn tại. ' })
      }
    } else {
      //res.status(200).json({ RspCode: '97', Message: 'Fail checksum' })
    }
    // @ts-ignore
  } catch (err) {
    console.log(err);
  }
};
module.exports = {
  shipCalculate,
  Verity,
  List,
  Update,
  Create,
  SubBill,
  VNPay,
  discountCalculate,
  CheckVNPay,
  Read,
  Revenue,
  Refund
};
