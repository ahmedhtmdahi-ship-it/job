'use server';
import {cookies} from 'next/headers';
import {revalidatePath} from 'next/cache';
import {auth} from '@/auth';
import prisma from '@/lib/db';

export async function setLocale(locale: 'ar' | 'en') {
  if (locale !== 'ar' && locale !== 'en') throw new Error('Invalid locale');
  const session = await auth();
  if (session?.user?.id) await prisma.user.update({where: {id: session.user.id}, data: {locale}});
  (await cookies()).set('locale', locale, {httpOnly: true, sameSite: 'lax', secure: process.env.NODE_ENV === 'production', path: '/', maxAge: 31536000});
  revalidatePath('/', 'layout');
}
