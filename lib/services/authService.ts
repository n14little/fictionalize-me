import { User } from '../models/User';
import { userRepository } from '../repositories/userRepository';
import { Account, AuthOptions, getServerSession, Session } from 'next-auth';
import Auth0Provider from 'next-auth/providers/auth0';
import { JWT } from 'next-auth/jwt';

// Define enhanced user type with ID field
type EnhancedUser = Session["user"] & {
  id?: string;
}

// Define custom session type with enhanced user
type CustomSession = Session & {
  user: EnhancedUser;
  accessToken?: string;
}

// Define extended JWT with our custom fields
type ExtendedJWT = JWT & {
  user?: EnhancedUser;
  accessToken?: string;
}

export const authOptions: AuthOptions = {
  providers: [
    Auth0Provider({
      clientId: process.env.AUTH0_CLIENT_ID!,
      clientSecret: process.env.AUTH0_CLIENT_SECRET!,
      issuer: process.env.AUTH0_ISSUER_BASE_URL,
      authorization: {
        params: {
          prompt: "login",
        },
      },
    }),
  ],
  callbacks: {
    async session({ session, token }: { session: Session; token: ExtendedJWT }): Promise<CustomSession> {
      if (token) {
        const customSession: CustomSession = {
          ...session,
          user: {
            ...session.user,
            ...(token.user || {}),
          },
          accessToken: token.accessToken,
        };
        return customSession;
      }

      const customSession: CustomSession = {
        ...session,
        user: {
          id: undefined,
          ...session.user,
        },
      };
      
      return customSession;
    },
    async jwt({ token, account, user }: { token: JWT; account: Account | null; user: Session['user'] | null }): Promise<ExtendedJWT> {
      const extendedToken: ExtendedJWT = { ...token };
      
      if (account && user) {
        extendedToken.accessToken = account.access_token;
        
        const enhancedUser: EnhancedUser = {
          ...user,
        };
        extendedToken.user = enhancedUser;
      }
      return extendedToken;
    },
  },
  pages: {
    signIn: '/auth/signin',
    error: '/auth/error',
  },
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
};

export const authService = {
  getCurrentUser: async (): Promise<User | null> => {
    try {
      const session = await getServerSession<typeof authOptions, CustomSession>(authOptions);

      if (!session?.user?.email) {
        return null;
      }

      const now = new Date();
      console.log(`${now.getMinutes()}:${now.getSeconds()}.${now.getMilliseconds()}`);
      console.log('Session:', JSON.stringify(session, null, 2));

      const { email } = session.user;
      
      let externalUserId: string;

      if (session.user.id) {
        externalUserId = session.user.id;
      } else {
        const userEmail = session.user.email;
        externalUserId = `auth0-email|${userEmail}`;
        console.warn(`No external user ID found in session, using email-based fallback: ${externalUserId}`);
      }
      
      const user = await userRepository.findOrCreate({
        email,
        external_user_id: externalUserId,
      });
      
      return user;
    } catch (error) {
      console.error('Error getting current user:', error);
      return null;
    }
  },

  checkAccess: async (/*_userId: number, _resourceId?: string*/): Promise<boolean> => {
    return true;
  },
};