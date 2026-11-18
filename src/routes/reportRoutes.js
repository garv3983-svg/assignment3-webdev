const express = require('express');
const Product = require('../models/Product');

const router = express.Router();

router.get('/low-stock', async (req, res, next) => {
  try {
    const products = await Product.aggregate([
      {
        $match: {
          $expr: { $lte: ['$quantity', '$lowStockThreshold'] }
        }
      },
      {
        $project: {
          _id: 1,
          name: 1,
          sku: 1,
          category: 1,
          quantity: 1,
          lowStockThreshold: 1,
          price: 1
        }
      },
      { $sort: { quantity: 1, name: 1 } }
    ]);

    res.json({
      success: true,
      count: products.length,
      data: products
    });
  } catch (err) {
    next(err);
  }
});

router.get('/category-summary', async (req, res, next) => {
  try {
    const summary = await Product.aggregate([
      {
        $group: {
          _id: '$category',
          productCount: { $sum: 1 },
          totalUnits: { $sum: '$quantity' },
          totalInventoryValue: {
            $sum: { $multiply: ['$price', '$quantity'] }
          },
          averagePrice: { $avg: '$price' }
        }
      },
      {
        $project: {
          _id: 0,
          category: '$_id',
          productCount: 1,
          totalUnits: 1,
          totalInventoryValue: { $round: ['$totalInventoryValue', 2] },
          averagePrice: { $round: ['$averagePrice', 2] }
        }
      },
      { $sort: { totalInventoryValue: -1 } }
    ]);

    res.json({ success: true, data: summary });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
