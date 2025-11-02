import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Product from '@/models/Product';
import Sale from '@/models/Sale';
import { startOfDay, endOfDay } from 'date-fns';

export async function GET() {
  try {
    await connectDB();

    const today = new Date();
    const todayStart = startOfDay(today);
    const todayEnd = endOfDay(today);

    // Total inventory value
    const products = await Product.find();
    const totalInventoryValue = products.reduce(
      (sum, product) => sum + product.quantity * product.purchasePrice,
      0
    );

    // Today's purchases (products added today)
    const todayPurchases = await Product.find({
      createdAt: { $gte: todayStart, $lte: todayEnd },
    });
    const todayPurchaseValue = todayPurchases.reduce(
      (sum, product) => sum + product.quantity * product.purchasePrice,
      0
    );

    // Today's sales
    const todaySales = await Sale.find({
      saleDate: { $gte: todayStart, $lte: todayEnd },
    });
    const todaySalesAmount = todaySales.reduce(
      (sum, sale) => sum + sale.totalAmount,
      0
    );

    // Total outstanding credit
    const allSales = await Sale.find();
    const totalOutstanding = allSales.reduce(
      (sum, sale) => sum + sale.remainingAmount,
      0
    );

    return NextResponse.json({
      totalInventoryValue,
      todayPurchaseValue,
      todaySalesAmount,
      totalOutstanding,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to fetch dashboard stats';
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}

