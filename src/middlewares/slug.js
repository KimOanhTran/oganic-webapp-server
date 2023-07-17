const slugify = require('slugify');

const createSlug = (text) =>
  slugify(text, {
    lower: true
  });
module.exports = createSlug;
