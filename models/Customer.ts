import mongoose, { Schema, model, models } from 'mongoose';

export interface ICustomer extends mongoose.Document {
  name: string;
  mobileNumber: string;
  address: string;
  imageUrl: string;
  createdAt: Date;
  updatedAt: Date;
}

const CustomerSchema = new Schema<ICustomer>(
  {
    name: {
      type: String,
      required: [true, 'Customer name is required'],
    },
    mobileNumber: {
      type: String,
      required: [true, 'Mobile number is required'],
    },
    address: {
      type: String,
      required: [true, 'Address is required'],
    },
    imageUrl: {
      type: String,
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

const Customer = models.Customer || model<ICustomer>('Customer', CustomerSchema);

export default Customer;

