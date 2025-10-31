import mongoose, { Schema, model, models } from 'mongoose';

export interface IProduct extends mongoose.Document {
  name: string;
  imageUrl: string;
  quantity: number;
  purchasePrice: number;
  sellingPrice: number;
  createdAt: Date;
  updatedAt: Date;
}

const ProductSchema = new Schema<IProduct>(
  {
    name: {
      type: String,
      required: [true, 'Product name is required'],
    },
    imageUrl: {
      type: String,
      required: [true, 'Image URL is required'],
    },
    quantity: {
      type: Number,
      required: [true, 'Quantity is required'],
      default: 0,
      min: 0,
    },
    purchasePrice: {
      type: Number,
      required: [true, 'Purchase price is required'],
      min: 0,
    },
    sellingPrice: {
      type: Number,
      required: [true, 'Selling price is required'],
      min: 0,
    },
  },
  {
    timestamps: true,
  }
);

const Product = models.Product || model<IProduct>('Product', ProductSchema);

export default Product;

