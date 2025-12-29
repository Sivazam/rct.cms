import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import connectDB from '@/lib/mongodb';
import { Variant } from '@/lib/models';

// JWT secret handling with error prevention
const getJwtSecret = (): string => {
  try {
    const secret = process.env.JWT_SECRET || 'your-secret-key';
    if (typeof secret !== 'string') {
      console.error('JWT_SECRET is not a string, using fallback');
      return 'your-secret-key';
    }
    return secret;
  } catch (error) {
    console.error('Error accessing JWT_SECRET:', error);
    return 'your-secret-key';
  }
};

// Buffer-based secret handling to avoid instanceof issues
const getSecretBuffer = (): Buffer => {
  const secret = getJwtSecret();
  try {
    return Buffer.from(secret);
  } catch (error) {
    console.error('Error creating buffer from secret:', error);
    return Buffer.from('your-secret-key');
  }
};

async function verifyAdmin(request: NextRequest) {
  const token = request.cookies.get('auth-token')?.value;
  if (!token) {
    return null;
  }

  try {
    // Try multiple verification approaches
    try {
      const secretBuffer = getSecretBuffer();
      return jwt.verify(token, secretBuffer);
    } catch (error) {
      console.warn('Buffer verification failed, trying string approach');
      const secretString = getJwtSecret();
      return jwt.verify(token, secretString, { algorithms: ['HS256'] });
    }
  } catch (error) {
    return null;
  }
}

export async function GET(request: NextRequest) {
  try {
    const admin = await verifyAdmin(request);
    if (!admin) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    await connectDB();

    const { searchParams } = new URL(request.url);
    const productId = searchParams.get('productId');

    let query = {};
    if (productId) {
      query = { productId };
    }

    const variants = await Variant.find(query)
      .populate('productId', 'name')
      .sort({ createdAt: -1 })
      .lean();

    return NextResponse.json({ variants });
  } catch (error) {
    console.error('Error fetching admin variants:', error);
    return NextResponse.json(
      { error: 'Failed to fetch variants' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const admin = await verifyAdmin(request);
    if (!admin) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const {
      productId,
      label,
      price,
      sku,
      inventory,
      discount,
      isDefault
    } = await request.json();

    if (!productId || !label || !price || !sku || inventory === undefined) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    await connectDB();

    // If this is set as default, remove default from other variants of this product
    if (isDefault) {
      await Variant.updateMany(
        { productId },
        { isDefault: false }
      );
    }

    const variant = new Variant({
      productId,
      label,
      price,
      sku,
      inventory,
      discount: discount || 0,
      isDefault: isDefault || false
    });

    await variant.save();

    return NextResponse.json(
      { message: 'Variant created successfully', variant },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating variant:', error);
    return NextResponse.json(
      { error: 'Failed to create variant' },
      { status: 500 }
    );
  }
}