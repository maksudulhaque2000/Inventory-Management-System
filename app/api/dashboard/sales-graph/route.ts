import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Sale from '@/models/Sale';
import { startOfDay, endOfDay, startOfMonth, endOfMonth, startOfYear, endOfYear, format } from 'date-fns';

export async function GET() {
  try {
    await connectDB();

    const now = new Date();
    
    // Daily sales (last 30 days)
    const dailySales: { date: string; amount: number }[] = [];
    for (let i = 29; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);
      const dayStart = startOfDay(date);
      const dayEnd = endOfDay(date);

      const sales = await Sale.find({
        saleDate: { $gte: dayStart, $lte: dayEnd },
      });

      const amount = sales.reduce((sum, sale) => sum + sale.totalAmount, 0);
      dailySales.push({
        date: format(date, 'yyyy-MM-dd'),
        amount,
      });
    }

    // Monthly sales (current year)
    const monthlySales: { month: string; amount: number }[] = [];
    for (let month = 0; month < 12; month++) {
      const date = new Date(now.getFullYear(), month, 1);
      const monthStart = startOfMonth(date);
      const monthEnd = endOfMonth(date);

      const sales = await Sale.find({
        saleDate: { $gte: monthStart, $lte: monthEnd },
      });

      const amount = sales.reduce((sum, sale) => sum + sale.totalAmount, 0);
      monthlySales.push({
        month: format(date, 'MMM'),
        amount,
      });
    }

    // Yearly sales (last 5 years)
    const yearlySales: { year: string; amount: number }[] = [];
    for (let yearOffset = 4; yearOffset >= 0; yearOffset--) {
      const year = now.getFullYear() - yearOffset;
      const yearStart = startOfYear(new Date(year, 0, 1));
      const yearEnd = endOfYear(new Date(year, 11, 31));

      const sales = await Sale.find({
        saleDate: { $gte: yearStart, $lte: yearEnd },
      });

      const amount = sales.reduce((sum, sale) => sum + sale.totalAmount, 0);
      yearlySales.push({
        year: year.toString(),
        amount,
      });
    }

    return NextResponse.json({
      daily: dailySales,
      monthly: monthlySales,
      yearly: yearlySales,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to fetch sales graph data';
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}

