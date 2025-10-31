import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Sale from '@/models/Sale';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await connectDB();

    const sales = await Sale.find({ customer: id });

    const totalPurchaseAmount = sales.reduce(
      (sum, sale) => sum + sale.totalAmount,
      0
    );

    const totalOutstanding = sales.reduce(
      (sum, sale) => sum + sale.remainingAmount,
      0
    );

    return NextResponse.json({
      totalPurchaseAmount,
      totalOutstanding,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to fetch customer stats' },
      { status: 500 }
    );
  }
}

