'use client';

import { useEffect, useState, Suspense, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import toast from 'react-hot-toast';

function AuthCallbackContent() {
  const searchParams = useSearchParams();
  const { data: session, status } = useSession();
  const [loading, setLoading] = useState(true);
  const hasProcessed = useRef(false);

  useEffect(() => {
    let timeoutId: NodeJS.Timeout;

    // Prevent duplicate execution
    if (hasProcessed.current) {
      return;
    }

    const handleOAuthCallback = async () => {
      if (status === 'loading') {
        // Set timeout to prevent infinite loading
        timeoutId = setTimeout(() => {
          if (!hasProcessed.current) {
            toast.error('Authentication timeout. Please try again.');
            window.location.href = '/login';
            setLoading(false);
          }
        }, 10000); // 10 second timeout
        return;
      }

      // Clear timeout if status is not loading
      if (timeoutId) {
        clearTimeout(timeoutId);
      }

      // Mark as processed to prevent duplicate execution
      if (hasProcessed.current) {
        return;
      }

      if (status === 'authenticated' && session?.user?.email) {
        hasProcessed.current = true;
        try {
          // Fetch OAuth token
          const response = await fetch('/api/auth/oauth', {
            credentials: 'include',
          });
          const data = await response.json();

          if (response.ok && data.token) {
            localStorage.setItem('token', data.token);
            toast.success('Login successful!');
            
            // Get the callback URL or default to dashboard
            const callbackUrl = searchParams.get('callbackUrl') || '/dashboard';
            // Use window.location.href for reliable redirect in production
            window.location.href = callbackUrl;
          } else {
            toast.error(data.error || 'Failed to complete OAuth login');
            window.location.href = '/login';
          }
        } catch (error) {
          console.error('OAuth callback error:', error);
          toast.error('Failed to complete OAuth login');
          window.location.href = '/login';
        }
      } else if (status === 'unauthenticated') {
        hasProcessed.current = true;
        toast.error('Authentication failed');
        window.location.href = '/login';
      }

      setLoading(false);
    };

    handleOAuthCallback();

    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, [status, session, searchParams]);

  if (loading || status === 'loading') {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Completing authentication...</p>
        </div>
      </div>
    );
  }

  return null;
}

export default function AuthCallbackPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading...</p>
          </div>
        </div>
      }
    >
      <AuthCallbackContent />
    </Suspense>
  );
}

