const express = require('express');
const authRoute = require('./auth.route');
const userRoute = require('./user.route');
const categoryRoute = require('./category.route');
const productRoute = require('./product.route');
const locationRoute = require('./location.route');
const billRoute = require('./bill.route');
const discountRoute = require('./discount.route');
const chatRoute = require('./chat.route');
const supplierRoute = require('./supplier.route');
const router = express.Router();

const defaultRoutes = [
  {
    path: '/auth',
    route: authRoute
  },
  {
    path: '/users',
    route: userRoute
  },
  {
    path: '/category',
    route: categoryRoute
  },
  {
    path: '/product',
    route: productRoute
  },
  {
    path: '/location',
    route: locationRoute
  },
  {
    path: '/bill',
    route: billRoute
  },
  {
    path: '/discount',
    route: discountRoute
  },
  {
    path: '/chat',
    route: chatRoute
  },
  {
    path: '/supplier',
    route: supplierRoute
  }
];

defaultRoutes.forEach((route) => {
  router.use(route.path, route.route);
});

module.exports = router;
