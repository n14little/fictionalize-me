'use client';

import { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function Waitlist() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [interest, setInterest] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    
    if (!email) {
      setError('Email is required');
      return;
    }
    
    setIsSubmitting(true);
    setError(null);
    
    try {
      const response = await fetch('/api/waitlist', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, interest }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to join waitlist');
      }
      
      setSuccess(true);
      setEmail('');
      setInterest('');
      
      // Redirect to home after successful submission with a delay
      setTimeout(() => {
        router.push('/');
      }, 3000);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-4 md:p-24">
      <div className="w-full max-w-md">
        <h1 className="text-3xl font-bold mb-6 text-center">Join the Waitlist</h1>
        
        {success ? (
          <div className="bg-green-50 p-4 rounded-lg mb-6 border border-green-200">
            <p className="text-green-800 font-medium">
              Thank you for joining our waitlist! We'll notify you when we launch.
            </p>
            <p className="text-green-600 text-sm mt-2">
              Redirecting you to the homepage...
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="bg-red-50 p-3 rounded-lg border border-red-200">
                <p className="text-red-700 text-sm">{error}</p>
              </div>
            )}
            
            <div>
              <label htmlFor="email" className="block text-sm font-medium mb-1">
                Email address *
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@email.com"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
            
            <div>
              <label htmlFor="interest" className="block text-sm font-medium mb-1">
                What interests you about Fictionalize Me? (Optional)
              </label>
              <textarea
                id="interest"
                value={interest}
                onChange={(e) => setInterest(e.target.value)}
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            
            <button
              type="submit"
              disabled={isSubmitting}
              className={`w-full px-4 py-2 text-white bg-blue-600 rounded-lg ${
                isSubmitting ? 'opacity-70 cursor-not-allowed' : 'hover:bg-blue-700'
              } transition-colors`}
            >
              {isSubmitting ? 'Submitting...' : 'Join Waitlist'}
            </button>
            
            <div className="text-center mt-4">
              <Link href="/" className="text-blue-600 hover:text-blue-800 text-sm">
                Back to Home
              </Link>
            </div>
          </form>
        )}
      </div>
    </main>
  );
}