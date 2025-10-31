import mongoose, { Schema, model, models, Types } from 'mongoose';

export interface ISale extends mongoose.Document {
  product: Types.ObjectId;
  customer: Types.ObjectId;
  quantity: number;
  unitPrice: number;
  totalAmount: number;
  cashReceived: number;
  remainingAmount: number;
  paymentStatus: 'paid' | 'partial' | 'pending';
  saleDate: Date;
  createdAt: Date;
  updatedAt: Date;
}

const SaleSchema = new Schema<ISale>(
  {
    product: {
      type: Schema.Types.ObjectId,
      ref: 'Product',
      required: [true, 'Product is required'],
    },
    customer: {
      type: Schema.Types.ObjectId,
      ref: 'Customer',
      required: [true, 'Customer is required'],
    },
    quantity: {
      type: Number,
      required: [true, 'Quantity is required'],
      min: 1,
    },
    unitPrice: {
      type: Number,
      required: [true, 'Unit price is required'],
      min: 0,
    },
    totalAmount: {
      type: Number,
      required: [true, 'Total amount is required'],
      min: 0,
    },
    cashReceived: {
      type: Number,
      required: [true, 'Cash received is required'],
      default: 0,
      min: 0,
    },
    remainingAmount: {
      type: Number,
      required: [true, 'Remaining amount is required'],
      default: 0,
      min: 0,
    },
    paymentStatus: {
      type: String,
      enum: ['paid', 'partial', 'pending'],
      default: 'pending',
    },
    saleDate: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

const Sale = models.Sale || model<ISale>('Sale', SaleSchema);

export default Sale;

