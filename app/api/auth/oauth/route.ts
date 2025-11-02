import { NextRequest, NextResponse } from 'next/server';
import { auth } from '../[...nextauth]/route';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import { generateToken } from '@/lib/auth';

export async function GET() {
  try {
    const session = await auth();

    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    await connectDB();

    const user = await User.findOne({ email: session.user.email });
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    const token = generateToken(user._id.toString());

    return NextResponse.json({
      success: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        profileImage: user.profileImage,
      },
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to authenticate';
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}

