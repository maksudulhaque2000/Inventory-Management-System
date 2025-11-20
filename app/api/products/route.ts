import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Product from '@/models/Product';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const search = searchParams.get('search') || '';

    await connectDB();

    const query = search
      ? {
          name: { $regex: search, $options: 'i' },
        }
      : {};

    const products = await Product.find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit);

    const total = await Product.countDocuments(query);

    return NextResponse.json({
      products,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to fetch products';
    return NextResponse.json(
      { error: errorMessage },
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
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to create product';
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}
