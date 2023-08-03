const mongoose = require('mongoose');
const { toJSON } = require('./plugins');
const Product = require('../models/product.model');
//Định nghĩa cấu trúc của schema danh mục bằng cách sử dụng contructor 'Schema' của monggoose.
const categorySchema = mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      unique: true
    },
    slug: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true
    },
    // enable: {
    //   type: Boolean,
    //   default: true
    // },
    image_id: { type: String },
    products: [{ type: mongoose.Schema.Types.ObjectId, required: true, ref: 'Product' }],
    specsModel: [
      {
        name: { type: String, required: [true, 'Category specsModel name cannot be empty'] },
        values: [
          {
            value: { type: String, required: [true, 'Category specsModel values unit cannot be empty'], trim: true },
            products: [{ type: mongoose.Schema.Types.ObjectId, required: true, ref: 'Product' }]
          }
        ]
      }
    ],
    /**
     * 0: inactive
     * 1: active
     */
    status: {
      type: Number,
      default: 1
    },
    image_url: {
      type: String
    },
    icon_url: {
      type: String
    },
    icon_id: {
      type: String
    }
  },
  {
    timestamps: true
  }
);

//hai thuoc tinh ao ('virtual'): info va surface
//Phuong thuc info trả về một đối tượng chứa thông tin danh mục
categorySchema.virtual('info').get(function () {
  var specsModelReduce = [];
  this.specsModel.forEach((m) => {
    var values = [];
    m.values.forEach((v) => {
      values.push({ _id: v._id, value: v.value, products_length: v.products.length });
    });
    specsModelReduce.push({ _id: m._id, name: m.name, values });
  });

  return {
    _id: this._id,
    name: this.name,
    image_url: this.image_url,
    icon_url: this.icon_url,
    slug: this.slug,
    products_length: this.products.length,
    specsModel: specsModelReduce
  };
});
//surface trả về một đối tượng nhỏ hơn chỉ chứa một số thông tin cơ bản của danh mục
categorySchema.virtual('surface').get(function () {
  return {
    _id: this._id,
    name: this.name,
    image_url: this.image_url,
    icon_url: this.icon_url,
    slug: this.slug,
    products_length: this.products.length,
    createdAt: this.createdAt,
    updatedAt: this.updatedAt
  };
});

//categorySchema.statics định nghĩa một số phương thức tĩnh, trong đó surface là một pt tĩnh
// để truy xuất ds các đối tượng 'surface' của tất cả danh mục
categorySchema.statics.surfaces = async function (email) {
  var docs = await Category.find();
  var result = [];
  docs.forEach((element) => {
    // @ts-ignore
    result.push(element.surface);
  });
  return result;
};
//categorySchema.statics.checkSpecsModel kiểm tra tính hợp lệ của specsModel là một mảng các thông số kỹ thuật
//Nếu các thông số kỹ thuật không hợp lệ, nó sẽ trả về false
categorySchema.statics.checkSpecsModel = function (specsModel) {
  let nameSet = new Set(specsModel.map((e) => e.name));
  if (nameSet.size < specsModel.length) {
    console.log('nameSet1', nameSet);
    console.log('nameSet2', specsModel);
    return false;
  }

  for (let i = 0; i < specsModel.length; i++) {
    if (!specsModel[i].values) continue;
    let valuesSet = new Set(specsModel[i].values.map((v) => v.value));
    if (valuesSet.size < specsModel[i].values.length || valuesSet.has('')) {
      console.log('nameSet3', valuesSet);
      console.log('nameSet4', specsModel[i].values);
      return false;
    }
  }
  return true;
};

//Định nghĩa các phương thức của đối tượng danh mục, bao gồm
//saveSpecsModel, addProduct và delProduct.
//Những phương thức này được sử dụng để thêm/sửa/xóa thông tin
//sản phẩm và thông số kỹ thuật của danh mục
categorySchema.methods.saveSpecsModel = async function (specsModel, session_opts) {
  // @ts-ignore
  if (!Category.checkSpecsModel(specsModel)) throw Error('Trùng specs');

  // if(!this.specsModel || this.products.length == 0) {
  //     // @ts-ignore
  //     this.specsModel = specsModel
  //     var tempDoc = await Category.findByIdAndUpdate(this._id, specsModel, session_opts).exec()
  //     if(!tempDoc)
  //         throw Error("Lỗi lưu")
  // }

  var relate_set = new Set();
  var name_tree = {};
  var value_tree = {};
  var newNameSet = new Set();
  var newValueSet = new Set();
  var editableSpecsModel = JSON.parse(JSON.stringify(this.specsModel));

  for (let i = 0; i < editableSpecsModel.length; i++) {
    if (editableSpecsModel[i]._id == undefined)
      // new value
      continue;
    var oitem = editableSpecsModel[i];
    var flag_item = false;
    for (var nitem of specsModel) {
      if (!nitem._id) {
        if (!newNameSet.has(nitem.name)) {
          var temp_values = [];
          nitem.values.forEach((i) => temp_values.push({ value: i.value }));
          editableSpecsModel.push({ name: nitem.name, values: temp_values });
          newNameSet.add(nitem.name);
          flag_item = true;
        }
        continue;
      }
      if (oitem._id != nitem._id) continue;

      flag_item = true;
      if (oitem.name != nitem.name) oitem.values.forEach((v) => v.products.forEach((c) => relate_set.add(c)));
      name_tree[oitem.name] = nitem.name;
      oitem.name = nitem.name;
      value_tree[nitem.name] = {};

      newValueSet.clear();
      for (let j = 0; j < oitem.values.length; j++) {
        if (oitem.values[j]._id == undefined)
          // new value
          continue;
        var ovalue = oitem.values[j];
        var flag_value = false;

        for (var nvalue of nitem.values) {
          if (!nvalue._id) {
            if (!newValueSet.has(nvalue.value)) {
              oitem.values.push({ value: nvalue.value });
              newValueSet.add(nvalue.value);
              flag_value = true;
            }
            continue;
          }

          if (ovalue._id != nvalue._id) continue;

          flag_value = true;
          if (ovalue.value != nvalue.value) ovalue.products.forEach((c) => relate_set.add(c));
          value_tree[nitem.name][ovalue.value] = nvalue.value;
          ovalue.value = nvalue.value;
        }
        if (!flag_value && ovalue.products.length == 0) {
          flag_value = true;
          // @ts-ignore
          oitem.values.splice(j, 1);
          j--;
        }
        if (!flag_value) {
          throw Error('Không thể xóa value đang có liên kết với product ' + ovalue.value);
        }
      }
    }

    // @ts-ignore
    if (!flag_item && oitem.values.reduce((p, i) => p + i.products.length, 0) == 0) {
      flag_item = true;
      // @ts-ignore
      editableSpecsModel.splice(i, 1);
      i--;
    }
    if (!flag_item) {
      throw Error('Không thể xóa spec đang có liên kết với product');
    }
  }

  var categoryDoc = await Category.findByIdAndUpdate(this._id, { specsModel: editableSpecsModel }, session_opts).exec();
  if (!categoryDoc) throw Error('Lỗi lưu');
  var affects = [...relate_set];
  var docs = await Product.find({ _id: { $in: affects } })
    .select('specs')
    .exec();
  if (!docs) throw Error('Lỗi load');

  for (let i = 0; i < docs.length; i++) {
    var new_specs = {};
    for (var name in docs[i].specs) {
      var value = docs[i].specs[name];
      var new_name = name_tree[name];
      var values = value_tree[name_tree[name]];
      new_specs[new_name] = values[value];
    }
    var productDoc = await Product.findByIdAndUpdate(docs[i]._id, { specs: new_specs }, session_opts).exec();
    if (!productDoc) throw Error();
  }
};

categorySchema.methods.addProduct = function (product) {
  // @ts-ignore
  if (this.products.includes(product._id)) return;
  this.products.push(product._id);
  for (let i = 0; i < this.specsModel.length; i++) {
    var e = this.specsModel[i];
    var name = e.name;
    if (product.specs.hasOwnProperty(name)) {
      // @ts-ignore
      for (let a = 0; a < e.values.length; a++) {
        var v = e.values[a];
        if (product.specs[name] == v.value) {
          v.products.push(product._id);
          break;
        }
      }
    }
  }
};

categorySchema.methods.delProduct = function (product) {
  // @ts-ignore
  if (!this.products.includes(product._id)) return;
  // @ts-ignore
  this.products.shift(product._id);
  for (let i = 0; i < this.specsModel.length; i++) {
    var e = this.specsModel[i];
    var name = e.name;
    if (product.specs.hasOwnProperty(name)) {
      // @ts-ignore
      for (let a = 0; a < e.values.length; a++) {
        var v = e.values[a];
        if (product.specs[name] == v.value) {
          // @ts-ignore
          v.products.shift(product._id);
          break;
        }
      }
    }
  }
};
categorySchema.plugin(toJSON);

const Category = mongoose.model('Category', categorySchema);

module.exports = Category;
