'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import toast from 'react-hot-toast';

function AuthCallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session, status } = useSession();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let timeoutId: NodeJS.Timeout;

    const handleOAuthCallback = async () => {
      if (status === 'loading') {
        // Set timeout to prevent infinite loading
        timeoutId = setTimeout(() => {
          toast.error('Authentication timeout. Please try again.');
          router.push('/login');
          setLoading(false);
        }, 10000); // 10 second timeout
        return;
      }

      // Clear timeout if status is not loading
      if (timeoutId) {
        clearTimeout(timeoutId);
      }

      if (status === 'authenticated' && session?.user?.email) {
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
            router.push(callbackUrl);
          } else {
            toast.error(data.error || 'Failed to complete OAuth login');
            router.push('/login');
          }
        } catch (error) {
          console.error('OAuth callback error:', error);
          toast.error('Failed to complete OAuth login');
          router.push('/login');
        }
      } else if (status === 'unauthenticated') {
        toast.error('Authentication failed');
        router.push('/login');
      }

      setLoading(false);
    };

    handleOAuthCallback();

    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, [status, session, router, searchParams]);

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

