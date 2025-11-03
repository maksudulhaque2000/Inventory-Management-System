import NextAuth, { type NextAuthConfig } from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';
import FacebookProvider from 'next-auth/providers/facebook';
import CredentialsProvider from 'next-auth/providers/credentials';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import { verifyPassword } from '@/lib/auth';

const authConfig: NextAuthConfig = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || '',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
      authorization: {
        params: {
          prompt: 'consent',
          access_type: 'offline',
          response_type: 'code',
        },
      },
    }),
    FacebookProvider({
      clientId: process.env.FACEBOOK_CLIENT_ID || '',
      clientSecret: process.env.FACEBOOK_CLIENT_SECRET || '',
      authorization: {
        params: {
          scope: 'email public_profile',
        },
      },
    }),
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error('Email and password are required');
        }

        await connectDB();

        const user = await User.findOne({ email: credentials.email });
        if (!user) {
          throw new Error('Invalid credentials');
        }

        if (!user.password) {
          throw new Error('Please use social login for this account');
        }

        const isValid = await verifyPassword(credentials.password as string, user.password);
        if (!isValid) {
          throw new Error('Invalid credentials');
        }

        return {
          id: user._id.toString(),
          name: user.name,
          email: user.email,
          image: user.profileImage || undefined,
        };
      },
    }),
  ],
  callbacks: {
    async signIn({ user, account }) {
      try {
        await connectDB();

        if (account?.provider === 'google' || account?.provider === 'facebook') {
          const existingUser = await User.findOne({
            $or: [
              { email: user.email },
              { providerId: account.providerAccountId, provider: account.provider },
            ],
          });

          if (existingUser) {
            // Update profile image if from OAuth
            if (user.image && user.image !== existingUser.profileImage) {
              existingUser.profileImage = user.image;
              await existingUser.save();
            }
            return true;
          }

          // Create new user
          await User.create({
            name: user.name || '',
            email: user.email || '',
            profileImage: user.image || '',
            provider: account.provider as 'google' | 'facebook',
            providerId: account.providerAccountId,
          });
        }

        return true;
      } catch (error) {
        console.error('Sign in error:', error);
        return false;
      }
    },
    async jwt({ token, user, account }) {
      if (user) {
        token.id = user.id;
      }

      if (account) {
        await connectDB();
        const dbUser = await User.findOne({
          $or: [
            { email: token.email },
            { providerId: account.providerAccountId, provider: account.provider },
          ],
        });

        if (dbUser) {
          token.id = dbUser._id.toString();
          token.name = dbUser.name;
          token.email = dbUser.email;
          token.image = dbUser.profileImage || undefined;
        }
      }

      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
      }
      return session;
    },
    async redirect({ url, baseUrl }) {
      // Get base URL from environment variable or use provided baseUrl
      const siteUrl = process.env.NEXTAUTH_URL || baseUrl;
      
      // Allow callback URL with proper base URL
      if (url.startsWith('/auth/callback')) {
        return `${siteUrl}${url}`;
      }
      // Allow relative callback URLs
      if (url.startsWith('/')) {
        return `${siteUrl}${url}`;
      }
      // Allow callback URLs on the same origin
      try {
        const urlObj = new URL(url);
        const siteUrlObj = new URL(siteUrl);
        if (urlObj.origin === siteUrlObj.origin) {
          return url;
        }
      } catch {
        // Invalid URL, use siteUrl
      }
      return siteUrl;
    },
  },
  pages: {
    signIn: '/login',
  },
  session: {
    strategy: 'jwt',
  },
  secret: process.env.NEXTAUTH_SECRET,
};

const nextAuth = NextAuth(authConfig);

export const { handlers, auth, signIn, signOut } = nextAuth;

export const GET = handlers.GET;
export const POST = handlers.POST;
