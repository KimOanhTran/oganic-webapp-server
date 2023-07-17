const PHONE_REGEX = /(84|0[3|5|7|8|9|1|2|4|6])+([0-9]{8})\b/;

module.exports = {
  PHONE_REGEX,
  PROVINCE_JSON: require('./tinh_tp.json'),
  DISTRICT_JSON: require('./quan_huyen.json'),
  WARD_JSON: require('./xa_phuong.json')
};
