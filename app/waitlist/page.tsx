import Link from 'next/link';
import { FormButton } from '../../components/FormButton';
import { joinWaitlist } from './actions';

export default function Waitlist() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-4 md:p-24">
      <div className="w-full max-w-md">
        <h1 className="text-3xl font-bold mb-6 text-center">Join the Waitlist</h1>
        
        <form action={joinWaitlist} className="space-y-4">
          <div>
            <label htmlFor="email" className="block text-sm font-medium mb-1">
              Email address *
            </label>
            <input
              id="email"
              name="email"
              type="email"
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
              name="interest"
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          
          <FormButton className="w-full">Join Waitlist</FormButton>
          
          <div className="text-center mt-4">
            <Link href="/" className="text-blue-600 hover:text-blue-800 text-sm">
              Back to Home
            </Link>
          </div>
        </form>
      </div>
    </main>
  );
}