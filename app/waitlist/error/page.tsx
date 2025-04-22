import Link from 'next/link';

export default function WaitlistError() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-4 md:p-24">
      <div className="w-full max-w-md">
        <div className="bg-red-50 p-6 rounded-lg border border-red-200 mb-6">
          <h1 className="text-2xl font-bold text-red-700 mb-3">Something went wrong</h1>
          <p className="text-red-600 mb-4">
            We encountered an error while processing your waitlist submission. 
            Please try again or contact support if the problem persists.
          </p>
        </div>
        
        <div className="flex flex-col space-y-4">
          <Link 
            href="/waitlist" 
            className="px-4 py-2 bg-blue-600 text-white text-center rounded-lg hover:bg-blue-700 transition-colors"
          >
            Try Again
          </Link>
          
          <Link 
            href="/" 
            className="px-4 py-2 border border-gray-300 text-gray-700 text-center rounded-lg hover:bg-gray-50 transition-colors"
          >
            Return to Home
          </Link>
        </div>
      </div>
    </main>
  );
}