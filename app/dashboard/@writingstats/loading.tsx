export default function Loading() {
  return (
    <div className="w-full p-4 bg-white rounded-lg shadow mb-8">
      <div className="h-6 w-40 bg-gray-200 rounded mb-4"></div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="h-24 bg-gray-200 rounded"></div>
        <div className="h-24 bg-gray-200 rounded"></div>
        <div className="h-24 bg-gray-200 rounded"></div>
      </div>
    </div>
  );
}
