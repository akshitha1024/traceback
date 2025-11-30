import { getMatchStrength, getMatchColor } from '../utils/matching';

export default function PotentialMatchCard({ foundItem, matchScore, lostItemId }) {
  const matchStrength = getMatchStrength(matchScore);
  const matchColorClass = getMatchColor(matchScore);

  return (
    <div className="bg-white/90 backdrop-blur-sm rounded-xl p-4 border border-amber-200 shadow-lg hover:shadow-xl transition-all duration-200 hover:-translate-y-1">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs font-medium">
            FOUND
          </span>
          <span className="bg-amber-100 text-amber-700 px-2 py-1 rounded-full text-xs font-medium">
            {foundItem.category}
          </span>
        </div>
        <div className={`px-2 py-1 rounded-full text-xs font-medium ${matchColorClass}`}>
          {matchScore.toFixed(2)}% Match
        </div>
      </div>

      <div className="mb-3">
        <div className="font-semibold text-gray-900 mb-1">{foundItem.title}</div>
        <div className="text-sm text-gray-700 bg-gray-50 p-2 rounded mb-4">
          📍 Location: {foundItem.location || foundItem.location_name || 'Not specified'} • 📅 Date: {foundItem.date_found ? new Date(foundItem.date_found).toLocaleDateString() : 'Not specified'}{foundItem.time_found && ` at ${foundItem.time_found}`}
        </div>
      </div>

      <div className="flex items-center justify-between gap-2">
        <div className={`text-xs font-medium px-2 py-1 rounded ${matchColorClass}`}>
          {matchStrength}
        </div>
        <div className="flex gap-2">
          <a
            href={`/verify/${foundItem.id}`}
            className="bg-amber-600 hover:bg-amber-700 text-white px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200"
          >
            🔐 VERIFY OWNERSHIP
          </a>
          <a
            href={`/report-abuse?type=item&id=${foundItem.id}`}
            className="bg-red-600 hover:bg-red-700 text-white px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200"
            title="Report abuse"
          >
            🚩
          </a>
        </div>
      </div>
    </div>
  );
}