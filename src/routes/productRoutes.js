const express = require('express');
const Product = require('../models/Product');

const router = express.Router();

function positiveInt(value, field) {
  const n = Number(value);
  if (!Number.isInteger(n) || n < 1) {
    const err = new Error(`${field} must be a positive integer`);
    err.statusCode = 400;
    throw err;
  }
  return n;
}

router.post('/', async (req, res, next) => {
  try {
    const product = await Product.create(req.body);
    res.status(201).json({ success: true, data: product });
  } catch (err) {
    next(err);
  }
});

router.get('/', async (req, res, next) => {
  try {
    const {
      search, category, minPrice, maxPrice, minQuantity, maxQuantity,
      sortBy = 'createdAt', order = 'desc', page = 1, limit = 10
    } = req.query;

    const pageNumber = positiveInt(page, 'page');
    const limitNumber = positiveInt(limit, 'limit');
    if (limitNumber > 100) {
      const err = new Error('limit cannot exceed 100');
      err.statusCode = 400;
      throw err;
    }

    const filter = {};

    if (category) filter.category = category;
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { sku: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    if (minPrice !== undefined || maxPrice !== undefined) {
      filter.price = {};
      if (minPrice !== undefined) filter.price.$gte = Number(minPrice);
      if (maxPrice !== undefined) filter.price.$lte = Number(maxPrice);
    }

    if (minQuantity !== undefined || maxQuantity !== undefined) {
      filter.quantity = {};
      if (minQuantity !== undefined) filter.quantity.$gte = Number(minQuantity);
      if (maxQuantity !== undefined) filter.quantity.$lte = Number(maxQuantity);
    }

    const allowedSortFields = ['name', 'sku', 'category', 'price', 'quantity', 'createdAt', 'updatedAt'];
    if (!allowedSortFields.includes(sortBy)) {
      const err = new Error(`Invalid sortBy. Use one of: ${allowedSortFields.join(', ')}`);
      err.statusCode = 400;
      throw err;
    }

    const sort = { [sortBy]: order === 'asc' ? 1 : -1 };
    const skip = (pageNumber - 1) * limitNumber;

    const [products, total] = await Promise.all([
      Product.find(filter).sort(sort).skip(skip).limit(limitNumber),
      Product.countDocuments(filter)
    ]);

    res.json({
      success: true,
      data: products,
      pagination: {
        total,
        page: pageNumber,
        limit: limitNumber,
        pages: Math.ceil(total / limitNumber)
      }
    });
  } catch (err) {
    next(err);
  }
});

router.get('/:id', async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      const err = new Error('Product not found');
      err.statusCode = 404;
      throw err;
    }
    res.json({ success: true, data: product });
  } catch (err) {
    next(err);
  }
});

router.put('/:id', async (req, res, next) => {
  try {
    const product = await Product.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    if (!product) {
      const err = new Error('Product not found');
      err.statusCode = 404;
      throw err;
    }
    res.json({ success: true, data: product });
  } catch (err) {
    next(err);
  }
});

router.patch('/:id/stock', async (req, res, next) => {
  try {
    const { operation, quantity } = req.body;
    const amount = Number(quantity);

    if (!['restock', 'sale'].includes(operation)) {
      const err = new Error('operation must be restock or sale');
      err.statusCode = 400;
      throw err;
    }

    if (!Number.isInteger(amount) || amount < 1) {
      const err = new Error('quantity must be a positive integer');
      err.statusCode = 400;
      throw err;
    }

    let update;
    if (operation === 'restock') {
      update = { $inc: { quantity: amount } };
    } else {
      update = {
        $inc: { quantity: -amount }
      };
    }

    const query = operation === 'sale'
      ? { _id: req.params.id, quantity: { $gte: amount } }
      : { _id: req.params.id };

    const product = await Product.findOneAndUpdate(
      query,
      update,
      { new: true, runValidators: true }
    );

    if (!product) {
      const exists = await Product.exists({ _id: req.params.id });
      if (!exists) {
        const err = new Error('Product not found');
        err.statusCode = 404;
        throw err;
      }
      const err = new Error('Insufficient stock for this sale');
      err.statusCode = 400;
      throw err;
    }

    res.json({
      success: true,
      message: operation === 'restock' ? 'Stock restocked successfully' : 'Sale recorded successfully',
      data: product
    });
  } catch (err) {
    next(err);
  }
});

router.delete('/:id', async (req, res, next) => {
  try {
    const product = await Product.findByIdAndDelete(req.params.id);
    if (!product) {
      const err = new Error('Product not found');
      err.statusCode = 404;
      throw err;
    }
    res.json({ success: true, message: 'Product deleted successfully', data: product });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
