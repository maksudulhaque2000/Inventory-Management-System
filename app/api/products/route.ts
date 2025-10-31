import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Product from '@/models/Product';

export async function GET(request: NextRequest) {
  try {
    await connectDB();
    const products = await Product.find().sort({ createdAt: -1 });
    return NextResponse.json({ products });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to fetch products' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { name, imageUrl, quantity, purchasePrice, sellingPrice } = await request.json();

    if (!name || !imageUrl || purchasePrice === undefined || sellingPrice === undefined) {
      return NextResponse.json(
        { error: 'All fields are required' },
        { status: 400 }
      );
    }

    await connectDB();

    // Check if product exists
    const existingProduct = await Product.findOne({ name: name.trim() });
    
    if (existingProduct) {
      // Add to existing quantity
      existingProduct.quantity += quantity || 0;
      await existingProduct.save();
      return NextResponse.json({ product: existingProduct }, { status: 200 });
    }

    const product = await Product.create({
      name: name.trim(),
      imageUrl,
      quantity: quantity || 0,
      purchasePrice,
      sellingPrice,
    });

    return NextResponse.json({ product }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to create product' },
      { status: 500 }
    );
  }
}

