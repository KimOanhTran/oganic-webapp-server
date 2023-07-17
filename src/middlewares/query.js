const customCategoryQuery = (req, res, next) => {
  if (req.query.name) {
    req.query.name = { $regex: req.query.name, $options: 'si' };
  }
  if (req.query.slug) {
    req.query.slug = { $regex: req.query.slug, $options: 'si' };
  }
  next();
};
const hello = (req, res, next) => {
  console.log('123');
  next();
};

module.exports = {
  customCategoryQuery,
  hello
};
