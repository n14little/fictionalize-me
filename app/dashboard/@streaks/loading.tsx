export default function Loading() {
  return (
    <div className="w-full p-4 bg-white rounded-lg shadow mb-8">
      <div className="h-6 w-40 bg-gray-200 rounded mb-4"></div>
      <div className="flex gap-4">
        <div className="h-16 w-16 bg-gray-200 rounded-full"></div>
        <div className="flex-1">
          <div className="h-5 w-24 bg-gray-200 rounded mb-2"></div>
          <div className="h-4 w-40 bg-gray-200 rounded"></div>
        </div>
      </div>
    </div>
  );
}
