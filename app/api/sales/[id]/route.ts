import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Sale from '@/models/Sale';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { additionalPayment } = await request.json();

    if (additionalPayment === undefined || additionalPayment < 0) {
      return NextResponse.json(
        { error: 'Valid payment amount is required' },
        { status: 400 }
      );
    }

    await connectDB();

    const sale = await Sale.findById(id);
    if (!sale) {
      return NextResponse.json(
        { error: 'Sale not found' },
        { status: 404 }
      );
    }

    const newCashReceived = sale.cashReceived + additionalPayment;
    const newRemaining = Math.max(0, sale.remainingAmount - additionalPayment);

    let paymentStatus: 'paid' | 'partial' | 'pending' = 'partial';
    if (newRemaining === 0) {
      paymentStatus = 'paid';
    } else if (newCashReceived === 0) {
      paymentStatus = 'pending';
    }

    sale.cashReceived = newCashReceived;
    sale.remainingAmount = newRemaining;
    sale.paymentStatus = paymentStatus;

    await sale.save();

    const populatedSale = await Sale.findById(sale._id)
      .populate('product', 'name imageUrl')
      .populate('customer', 'name mobileNumber address');

    return NextResponse.json({ sale: populatedSale });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to update sale';
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}

