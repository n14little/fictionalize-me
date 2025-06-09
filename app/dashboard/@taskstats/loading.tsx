export default function Loading() {
  return (
    <div className="mt-8 w-full p-4 bg-white rounded-lg shadow">
      <div className="h-6 w-60 bg-gray-200 rounded mb-4"></div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="h-64 bg-gray-200 rounded"></div>
        <div className="h-64 bg-gray-200 rounded"></div>
      </div>
      <div className="h-64 bg-gray-200 rounded mt-4"></div>
    </div>
  );
}
