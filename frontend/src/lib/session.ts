import { cookies } from "next/headers"
import { redirect } from "next/navigation";
import { cache } from "react";

// Create session
export const createSession = async (token: string) => {
  const Cookies = await cookies();
  
  // Store token in an HTTP-only cookie for security
  Cookies.set('authToken', token, {
    // httpOnly: true, // More secure, not accessible via JavaScript
    // secure: process.env.NODE_ENV === "production", // Only sent over HTTPS in production
    maxAge: 60 * 60 * 72, // 3 day
    path: '/',
  });
};

// Verify session/authorization
export const verifySession = cache(async () => {
  const Cookies = await cookies();

  const authToken = Cookies.get('authToken')?.value;
 
  if (!authToken) {
    redirect('/');
  }
 
  return { authToken: authToken || null };
});

// Delete session
export const deleteSession = async () => {
  const Cookies = await cookies();

  Cookies.delete('authToken');
  redirect('/');
}