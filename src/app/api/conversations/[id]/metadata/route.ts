import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { 
      priority, sentiment, status, lead_status, 
      phone, email, birthday, address, city, state, zip_code 
    } = await req.json();

    const data: any = {};
    if (priority !== undefined) data.priority = priority;
    if (sentiment !== undefined) data.sentiment = sentiment;
    if (status !== undefined) data.status = status;
    if (lead_status !== undefined) data.lead_status = lead_status;
    if (phone !== undefined) data.phone = phone;
    if (email !== undefined) data.email = email;
    if (birthday !== undefined) data.birthday = birthday;
    if (address !== undefined) data.address = address;
    if (city !== undefined) data.city = city;
    if (state !== undefined) data.state = state;
    if (zip_code !== undefined) data.zip_code = zip_code;

    const updated = await db.conversation.update({
      where: { id },
      data
    });

    return NextResponse.json({ data: updated });
  } catch (error) {
    console.error('[METADATA_PUT]', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
