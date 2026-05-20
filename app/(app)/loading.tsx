export default function Loading() {
  return (
    <div className="animate-pulse">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="space-y-2">
          <div className="h-3 w-32 bg-gray-100 rounded" />
          <div className="h-7 w-56 bg-gray-100 rounded" />
        </div>
        <div className="h-9 w-32 bg-gray-100 rounded" />
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="border border-gray-100 rounded-xl p-4 space-y-3">
            <div className="h-2.5 w-20 bg-gray-100 rounded" />
            <div className="h-6 w-24 bg-gray-100 rounded" />
            <div className="h-2.5 w-16 bg-gray-100 rounded" />
          </div>
        ))}
      </div>

      {/* Table */}
      <div className="border border-gray-100 rounded-xl overflow-hidden">
        <div className="h-10 bg-gray-50 border-b border-gray-100" />
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="flex items-center gap-4 px-4 py-3.5 border-b border-gray-50 last:border-0">
            <div className="h-3.5 w-28 bg-gray-100 rounded" />
            <div className="h-3.5 w-24 bg-gray-100 rounded" />
            <div className="h-3.5 w-16 bg-gray-100 rounded ml-auto" />
            <div className="h-4 w-16 bg-gray-100 rounded" />
          </div>
        ))}
      </div>
    </div>
  )
}
