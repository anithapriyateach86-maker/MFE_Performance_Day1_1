// FlightCard.jsx — wrapped with React.memo (TC1)
// Only re-renders when its own flight prop or onBook handler changes

import { memo }        from 'react';
import { Clock }       from 'lucide-react';
import { useAuth }     from '../../hooks/useAuth';

const FlightCard = memo(function FlightCard({ flight, onBook }) {
  const { user } = useAuth();

  const stopColor = flight.status === 'Nonstop'
    ? 'text-green-600'
    : 'text-orange-500';

  return (
    <div className="bg-white rounded-lg shadow-md p-6 mb-4 hover:shadow-lg transition-shadow">
      <div className="flex justify-between items-start flex-wrap gap-4">

        {/* Left side — flight info */}
        <div className="flex-1 min-w-[250px]">
          <div className="flex items-center gap-2 mb-4">
            <span className="text-indigo-600 font-bold text-lg">{flight.id}</span>
          </div>
          <div className="grid grid-cols-2 gap-4 text-sm text-gray-600">
            <div><span className="font-semibold">Aircraft:</span>  {flight.aircraft}</div>
            <div><span className="font-semibold">Distance:</span>  {flight.distance} miles</div>
            <div><span className="font-semibold">{flight.class}</span></div>
            <div><span className="font-semibold">Crew:</span>      {flight.crew}</div>
          </div>
        </div>

        {/* Right side — times, price, book */}
        <div className="text-right">
          <div className="flex items-center gap-4 mb-2">
            <div className="text-2xl font-bold text-gray-800">{flight.departure}</div>
            <div className="text-gray-400">→</div>
            <div className="text-2xl font-bold text-gray-800">{flight.arrival}</div>
          </div>

          <div className="flex items-center gap-2 text-sm mb-2 justify-end">
            <Clock size={16} className="text-gray-500" />
            <span className="text-gray-600">{flight.duration}</span>
            <span className={`font-semibold ml-2 ${stopColor}`}>
              • {flight.status}
            </span>
          </div>

          <div className="text-indigo-600 font-bold text-2xl mb-3">
            ${flight.price}
          </div>

          <button
            onClick={() => onBook(flight)}
            disabled={!user}
            className={`px-6 py-2 rounded-lg font-semibold transition-colors ${
              user
                ? 'bg-orange-500 text-white hover:bg-orange-600'
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }`}
          >
            Book Now
          </button>
        </div>
      </div>
    </div>
  );
});

export default FlightCard;