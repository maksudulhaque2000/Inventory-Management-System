import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Customer from '@/models/Customer';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const search = searchParams.get('search') || '';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');

    await connectDB();

    const query = search
      ? {
          $or: [
            { name: { $regex: search, $options: 'i' } },
            { mobileNumber: { $regex: search, $options: 'i' } },
          ],
        }
      : {};

    const customers = await Customer.find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit);

    const total = await Customer.countDocuments(query);

    return NextResponse.json({
      customers,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to fetch customers';
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { name, mobileNumber, address, imageUrl } = await request.json();

    if (!name || !mobileNumber || !address) {
      return NextResponse.json(
        { error: 'Name, mobile number, and address are required' },
        { status: 400 }
      );
    }

    await connectDB();

    const customer = await Customer.create({
      name,
      mobileNumber,
      address,
      imageUrl: imageUrl || '',
    });

    return NextResponse.json({ customer }, { status: 201 });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to create customer';
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}

