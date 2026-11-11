import {getRequestConfig} from 'next-intl/server';
import {cookies} from 'next/headers';
import {auth} from '@/auth';
import prisma from '@/lib/db';

export default getRequestConfig(async () => {
  const session = await auth();
  const user = session?.user?.id ? await prisma.user.findUnique({where: {id: session.user.id}, select: {locale: true}}) : null;
  const cookie = (await cookies()).get('locale')?.value;
  const locale = user?.locale ?? (cookie === 'en' ? 'en' : 'ar');
  return {locale, messages: (await import(`../../messages/${locale}.json`)).default, timeZone: 'Africa/Cairo'};
});
