// FlightSearchPage.jsx — core performance updates
// TC2  — useCallback for all handlers passed to child components
// TC3  — useMemo for filtered/sliced derived data
// TC5  — chunked rendering: only 20 flights rendered initially
// TC7  — ErrorBoundary wraps filter panel, summary, and results independently
// TC11 — IntersectionObserver loads more on scroll
// TC12 — filter inputs stay responsive; search fires on button click only
// TC13 — three isolated sections; one failure does not affect others

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useAuth }          from '../../hooks/useAuth';
import { useAsync }         from '../../hooks/useAsync';
import { api }              from '../../services/api';
import FlightCard           from './FlightCard';
import { ErrorBoundary }    from '../common/ErrorBoundary';
import {
  Search, MapPin, Calendar,
  DollarSign, Plane, Filter
} from 'lucide-react';

const CHUNK_SIZE = 20;

const FlightSearchPage = ({ onLoginClick }) => {

  const [filters, setFilters] = useState({
    from: 'NYC', to: 'LHR', date: '2025-10-01', maxPrice: '', airline: ''
  });

  const [allFlights,    setAllFlights]    = useState([]);
  const [visibleCount,  setVisibleCount]  = useState(CHUNK_SIZE);
  const [searchParams,  setSearchParams]  = useState({
    from: 'NYC', to: 'LHR', date: 'Wednesday, October 1, 2025'
  });

  const { execute, loading, error } = useAsync(api.searchFlights);
  const { user }                    = useAuth();

  // TC11 — sentinel ref watched by IntersectionObserver
  const sentinelRef = useRef(null);

  // ── Initial search on mount ─────────────────────────────────────────────────
  useEffect(() => {
    handleSearch();
  }, []);

  // ── TC11 — IntersectionObserver: load next chunk when sentinel is visible ───
  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setVisibleCount(prev => Math.min(prev + CHUNK_SIZE, allFlights.length));
        }
      },
      { threshold: 0.1 }
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [allFlights.length]);

  // ── TC2 — stable handler references via useCallback ─────────────────────────
  const handleInputChange = useCallback((e) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
  }, []);

  const handleSearch = useCallback(async () => {
    try {
      const results = await execute(filters);
      setAllFlights(results || []);
      // TC5 — reset visible count to first chunk on every new search
      setVisibleCount(CHUNK_SIZE);
      setSearchParams({
        from: filters.from,
        to:   filters.to,
        date: formatDate(filters.date),
      });
    } catch (err) {
      console.error('Search failed:', err);
    }
  }, [execute, filters]);

  const handleClearFilters = useCallback(() => {
    setFilters({ from: 'NYC', to: 'LHR', date: '2025-10-01', maxPrice: '', airline: '' });
  }, []);

  const handleBook = useCallback((flight) => {
    if (!user) {
      onLoginClick();
    } else {
      alert(
        `Booking initiated for flight ${flight.id}\nPrice: $${flight.price}\nStatus: Pending confirmation`
      );
    }
  }, [user, onLoginClick]);

  // ── TC3 — memoised derived slice; only recalculates when source data
  //          or visible count changes, not on every render ───────────────────
  const visibleFlights = useMemo(
    () => allFlights.slice(0, visibleCount),
    [allFlights, visibleCount]
  );

  const hasMore = visibleCount < allFlights.length;

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
    });
  };

  // ── Active filter tags ───────────────────────────────────────────────────────
  const activeFilters = useMemo(() =>
    Object.entries(filters)
      .filter(([, v]) => v)
      .map(([k, v]) => ({ key: k, label: `${k}: ${v}` })),
    [filters]
  );

  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="max-w-6xl mx-auto px-4 py-8">

        <h1 className="text-3xl font-bold text-gray-800 mb-6 flex items-center gap-2">
          <Plane className="text-indigo-600" />
          Search Flights
        </h1>

        {/* ── TC7/TC13 — FilterPanel isolated in its own ErrorBoundary ── */}
        <ErrorBoundary name="Filter Panel">
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <Filter size={24} className="text-indigo-600" />
              Flight Filters
            </h2>

            {/* TC12 — inputs are controlled; each keystroke updates only local
                state, search fires only on button click so UI never lags */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <MapPin size={16} className="inline mr-1 text-indigo-600" />
                  From (Source)
                </label>
                <input
                  type="text" name="from" value={filters.from}
                  onChange={handleInputChange}
                  placeholder="e.g., NYC, LAX"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <MapPin size={16} className="inline mr-1 text-indigo-600" />
                  To (Destination)
                </label>
                <input
                  type="text" name="to" value={filters.to}
                  onChange={handleInputChange}
                  placeholder="e.g., LHR, DXB"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Calendar size={16} className="inline mr-1 text-indigo-600" />
                  Travel Date
                </label>
                <input
                  type="date" name="date" value={filters.date}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <DollarSign size={16} className="inline mr-1 text-indigo-600" />
                  Max Price (USD)
                </label>
                <input
                  type="number" name="maxPrice" value={filters.maxPrice}
                  onChange={handleInputChange}
                  placeholder="e.g., 500" min="0" step="50"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Plane size={16} className="inline mr-1 text-indigo-600" />
                  Airline / Aircraft
                </label>
                <input
                  type="text" name="airline" value={filters.airline}
                  onChange={handleInputChange}
                  placeholder="e.g., Boeing, Airbus"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="flex items-end gap-2">
                <button
                  onClick={handleSearch}
                  disabled={loading}
                  className="flex-1 bg-indigo-600 text-white px-6 py-2 rounded-lg font-semibold hover:bg-indigo-700 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  <Search size={20} />
                  {loading ? 'Searching...' : 'Search'}
                </button>
                <button
                  onClick={handleClearFilters}
                  className="px-4 py-2 border border-gray-300 rounded-lg font-semibold hover:bg-gray-50"
                >
                  Clear
                </button>
              </div>
            </div>

            {/* Active filter tags */}
            {activeFilters.length > 0 && (
              <div className="mt-4 pt-4 border-t border-gray-200 flex flex-wrap gap-2 items-center">
                <span className="text-sm font-medium text-gray-700">Active Filters:</span>
                {activeFilters.map(f => (
                  <span
                    key={f.key}
                    className="bg-indigo-100 text-indigo-800 text-sm px-3 py-1 rounded-full"
                  >
                    {f.label}
                  </span>
                ))}
              </div>
            )}
          </div>
        </ErrorBoundary>

        {/* ── TC13 — Search Summary isolated in its own ErrorBoundary ── */}
        <ErrorBoundary name="Search Summary">
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-3">Current Search</h3>
            <div className="flex items-center gap-4 mb-2">
              <span className="text-xl font-bold text-gray-800">{searchParams.from}</span>
              <span className="text-gray-400 text-2xl">→</span>
              <span className="text-xl font-bold text-gray-800">{searchParams.to}</span>
            </div>
            <div className="text-gray-600">
              <span className="font-semibold">Date:</span> {searchParams.date}
            </div>
          </div>
        </ErrorBoundary>

        {/* ── TC13 — Results List isolated in its own ErrorBoundary ── */}
        <ErrorBoundary name="Results List">
          {error && !loading && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-center text-red-700 text-sm mb-4">
              {error}
            </div>
          )}

          {loading ? (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600" />
              <p className="mt-4 text-gray-600">Searching flights...</p>
            </div>

          ) : allFlights.length > 0 ? (
            <>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-gray-800">
                  Available Flights ({allFlights.length})
                </h2>
                {/* TC5 — shows how many of total are currently rendered */}
                <span className="text-sm text-gray-500">
                  Showing {visibleFlights.length} of {allFlights.length} flights
                </span>
              </div>

              {/* TC1/TC5 — only visibleFlights (initially 20) are in the DOM */}
              {visibleFlights.map(flight => (
                <FlightCard key={flight.id} flight={flight} onBook={handleBook} />
              ))}

              {/* TC11 — sentinel element; observer triggers next chunk load */}
              <div ref={sentinelRef} className="py-6 text-center text-gray-400 text-sm">
                {hasMore ? (
                  <span className="inline-flex items-center gap-2">
                    <span className="w-5 h-5 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin" />
                    Loading more flights...
                  </span>
                ) : (
                  <span>✓ All {allFlights.length} flights loaded</span>
                )}
              </div>
            </>

          ) : (
            <div className="text-center py-12 bg-white rounded-lg shadow-md">
              <Search size={48} className="text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 text-lg mb-2">No flights found matching your criteria.</p>
              <p className="text-gray-500 text-sm mb-4">Try adjusting your search filters.</p>
              <button
                onClick={handleClearFilters}
                className="bg-indigo-600 text-white px-6 py-2 rounded-lg font-semibold hover:bg-indigo-700"
              >
                Reset Filters
              </button>
            </div>
          )}
        </ErrorBoundary>

      </div>
    </div>
  );
};

export default FlightSearchPage;