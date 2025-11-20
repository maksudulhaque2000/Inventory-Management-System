import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Sale from '@/models/Sale';
import Product from '@/models/Product';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');

    await connectDB();

    const sales = await Sale.find()
      .populate('product', 'name imageUrl')
      .populate('customer', 'name mobileNumber address imageUrl')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit);

    const total = await Sale.countDocuments();

    return NextResponse.json({
      sales,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to fetch sales';
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { productId, customerId, quantity, unitPrice, cashReceived } = await request.json();

    if (!productId || !customerId || !quantity || unitPrice === undefined) {
      return NextResponse.json(
        { error: 'All fields are required' },
        { status: 400 }
      );
    }

    await connectDB();

    const product = await Product.findById(productId);
    if (!product) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      );
    }

    if (product.quantity < quantity) {
      return NextResponse.json(
        { error: 'Insufficient stock' },
        { status: 400 }
      );
    }

    const totalAmount = quantity * unitPrice;
    const received = cashReceived || 0;
    const remaining = totalAmount - received;

    let paymentStatus: 'paid' | 'partial' | 'pending' = 'pending';
    if (remaining === 0) {
      paymentStatus = 'paid';
    } else if (received > 0) {
      paymentStatus = 'partial';
    }

    // Create sale
    const sale = await Sale.create({
      product: productId,
      customer: customerId,
      quantity,
      unitPrice,
      totalAmount,
      cashReceived: received,
      remainingAmount: remaining,
      paymentStatus,
      saleDate: new Date(),
    });

    // Update product quantity
    product.quantity -= quantity;
    await product.save();

    const populatedSale = await Sale.findById(sale._id)
      .populate('product', 'name imageUrl')
      .populate('customer', 'name mobileNumber address');

    return NextResponse.json({ sale: populatedSale }, { status: 201 });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to create sale';
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}

