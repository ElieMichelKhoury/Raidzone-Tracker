// app/api/auth/signout/route.js
import { NextResponse } from 'next/server';
import { destroySession } from '@/lib/session';

export async function POST() {
  await destroySession();
  return NextResponse.redirect(process.env.NEXTAUTH_URL + '/');
}
