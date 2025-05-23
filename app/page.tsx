import Link from 'next/link';

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-4 md:p-24">
      <div className="max-w-3xl text-center">
        <h1 className="text-4xl md:text-5xl font-bold mb-8">
          Welcome to Fictionalize Me
        </h1>
        
        <p className="text-xl mb-8">
          Your personal journal with a creative twist. Write your thoughts and memories,
          then explore AI-powered fiction based on your real-life experiences.
        </p>
        
        <div className="flex flex-col md:flex-row gap-4 justify-center">
          <Link 
            href="/waitlist" 
            className="px-6 py-3 text-lg font-medium bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
          >
            Join the Waitlist
          </Link>
        </div>
      </div>
    </main>
  );
}
