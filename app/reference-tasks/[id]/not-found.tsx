import Link from 'next/link';

export default function NotFound() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-4">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">404</h1>
        <h2 className="text-xl font-semibold text-gray-700 mb-4">
          Reference Task Not Found
        </h2>
        <p className="text-gray-600 mb-6">
          The reference task you&apos;re looking for doesn&apos;t exist or you
          don&apos;t have permission to access it.
        </p>
        <div className="space-x-4">
          <Link
            href="/reference-tasks"
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md inline-block"
          >
            Back to Reference Tasks
          </Link>
          <Link
            href="/dashboard"
            className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-md inline-block"
          >
            Back to Dashboard
          </Link>
        </div>
      </div>
    </main>
  );
}
