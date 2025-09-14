import React from "react";

export default function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[40vh]">
      <img src="/no-data.svg" alt="No Help" className="w-32 h-32 mb-4 opacity-80" />
      <div className="text-xl font-bold text-gray-700 mb-2">No Help Received Yet</div>
      <div className="text-gray-500 text-center">
        You haven't received any help yet. Your assigned users will appear here once they are matched.
      </div>
    </div>
  );
} 