import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { authConfig } from "./authconfig";
import { connectToDB } from "./lib/utils";
import { User } from "./lib/models";
import bcrypt from "bcrypt";

const login = async (credentials) => {
  try {
    await connectToDB();
    const user = await User.findOne({ username: credentials.username });

    if (!user) throw new Error("Wrong credentials!");

    const isPasswordCorrect = await bcrypt.compare(
      credentials.password,
      user.password
    );

    if (!isPasswordCorrect) throw new Error("Wrong credentials!");

    // Return the user object with the role
    return {
      id: user._id.toString(),
      username: user.username,
      email: user.email,
      role: user.role, // Ensure the role is included
      img: user.img,
    };
  } catch (err) {
    console.error("Login error:", err);
    throw new Error("Failed to login");
  }
};

export const { signIn, signOut, auth } = NextAuth({
  ...authConfig,
  session: {
    strategy: "jwt", // Add this line
  },

    cookies: {
    sessionToken: {
      name: process.env.NODE_ENV === 'production' 
        ? '__Secure-authjs.session-token' 
        : 'authjs.session-token',
      options: {
        httpOnly: true,
        sameSite: 'lax', // Changed from 'none'
        path: '/',
        secure: process.env.NODE_ENV === 'production',
        domain: process.env.NODE_ENV === 'production' ? '.smartvisionss.com' : undefined,
      },
    },
  },
  // Add this to handle token refresh
  callbacks: {
    async jwt({ token, user, trigger }) {
      // Debug log
      console.log('JWT callback - trigger:', trigger, 'user:', !!user, 'token:', !!token)
      
      if (user) {
        token.id = user.id;
        token.username = user.username;
        token.email = user.email;
        token.role = user.role;
        token.img = user.img;
      }
      return token;
    },
    async session({ session, token }) {
      console.log('Session callback - token:', !!token)
      
      if (token) {
        session.user.id = token.id;
        session.user.username = token.username;
        session.user.email = token.email;
        session.user.role = token.role;
        session.user.img = token.img;
      }
      return session;
    },
  },
  providers: [
    CredentialsProvider({
      async authorize(credentials) {
        try {
          const user = await login(credentials);
          return user;
        } catch (err) {
          console.error("Authorization error:", err);
          return null;
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.username = user.username;
        token.email = user.email;
        token.role = user.role; // Ensure the role is included
        token.img = user.img;
      }
      return token;
    },
    async session({ session, token }) {
      session.user.id = token.id;
      session.user.username = token.username;
      session.user.email = token.email;
      session.user.role = token.role; // Ensure the role is included
      session.user.img = token.img;
      return session;
    },
  },
});