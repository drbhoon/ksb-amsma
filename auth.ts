import NextAuth from 'next-auth';
import Google from 'next-auth/providers/google';
import { prisma } from '@/lib/db';
import { recordAudit } from '@/lib/audit';

export const { handlers, auth, signIn, signOut } = NextAuth({
  trustHost: true,
  providers: [Google],
  pages: { signIn: '/portal/login', error: '/portal/login' },
  callbacks: {
    async signIn({ account, profile }) {
      if (account?.provider !== 'google') return false;
      const googleProfile = profile as { email?: string; email_verified?: boolean } | undefined;
      const email = googleProfile?.email?.toLowerCase().trim();
      if (!email || googleProfile?.email_verified !== true) return false;
      const user = await prisma.portalUser.findUnique({ where: { email } });
      if (!user?.active) return false;
      await prisma.portalUser.update({ where: { id: user.id }, data: { lastLoginAt: new Date() } });
      await recordAudit({ actorUserId: user.id, event: 'GOOGLE_OAUTH_LOGIN' });
      return true;
    },
  },
});

