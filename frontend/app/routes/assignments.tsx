import { json } from '@remix-run/node';
import { useLoaderData, useNavigate } from '@remix-run/react';
import { useState, useEffect } from 'react';

interface Table {
  diner_name: string;
  number_of_people: number;
  start_time: string;
  allergies: string;
  orders: Array<{
    item: string;
    dietary_tags: string[];
    price: number;
  }>;
}

interface Assignment {
  waiter_id: number;
  waiter_name: string;
  summary: string;
  tables: Table[];
}

interface DailyStats {
  total_reservations: number;
  total_guests: number;
  special_events: number;
}

interface LoaderData {
  assignments?: Assignment[];
  stats?: DailyStats;
  error?: string;
}

export const loader = async () => {
  try {
    const [attendanceResponse, statsResponse] = await Promise.all([
      fetch('http://localhost:8000/attendance'),
      fetch('http://localhost:8000/daily-stats')
    ]);
    const [attendanceData, statsData] = await Promise.all([
      attendanceResponse.json(),
      statsResponse.json()
    ]);
    return json<LoaderData>({
      assignments: attendanceData.assignments,
      stats: statsData
    });
  } catch (error) {
    return json<LoaderData>({ error: 'Failed to fetch assignments' });
  }
};

const formatTime = (timeStr: string) => {
  // Time string is already in 12-hour format from backend
  return timeStr;
};

const formatSummary = (summary: string) => {
  // Split the text into sections based on line breaks
  const sections = summary.split('\n').map(line => line.trim()).filter(Boolean);
  
  return sections.map((section, index) => {
    // Check if the section starts with a bullet point
    if (section.startsWith('-')) {
      // Remove the bullet and trim
      const content = section.substring(1).trim();
      // If it starts with a category (like "Dietary Restrictions:"), make it bold
      if (content.includes(':')) {
        const [category, details] = content.split(':');
        return (
          <div key={index} className="flex items-start space-x-2 mb-2">
            <span className="text-[#8b7355] mt-1">•</span>
            <span>
              <strong className="text-[#2c1810]">{category}:</strong>
              {details}
            </span>
          </div>
        );
      }
      // Regular bullet point
      return (
        <div key={index} className="flex items-start space-x-2 mb-2">
          <span className="text-[#8b7355] mt-1">•</span>
          <span>{content}</span>
        </div>
      );
    }
    // Non-bullet text (like the introduction)
    return <p key={index} className="mb-3">{section}</p>;
  });
};

export default function Assignments() {
  const { assignments, stats, error } = useLoaderData<typeof loader>();
  const navigate = useNavigate();
  const [expandedTables, setExpandedTables] = useState<{[key: string]: boolean}>({});
  const [allergies, setAllergies] = useState<{[key: string]: string}>({});
  const [specialEvents, setSpecialEvents] = useState<{[key: string]: string | null}>({});
  const [preferences, setPreferences] = useState<{[key: string]: string[]}>({});
  const [loadingPreferences, setLoadingPreferences] = useState<{[key: string]: boolean}>({});

  // Tables are already sorted by time from the backend
  const sortedAssignments = assignments;

  if (error) {
    return (
      <div className="min-h-screen bg-[#faf7f2] py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="inline-flex items-center px-6 py-3 rounded-lg bg-red-50">
              <svg className="h-5 w-5 text-red-500 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="text-red-500 font-medium">{error}</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#faf7f2] py-8">
      <header className="bg-[#2c1810] py-6 mb-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-serif text-white">French Laudure</h1>
            <button
              onClick={() => navigate('/')}
              className="px-4 py-2 text-sm font-medium text-[#2c1810] bg-white rounded-md hover:bg-opacity-90 transition-colors"
            >
              Back to Roll Call
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {stats && (
          <div className="mb-8 bg-white rounded-lg shadow-lg border border-[#e2d9c8] p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-center">
              <div className="p-4 rounded-lg bg-[#faf7f2]">
                <div className="text-4xl font-bold text-[#2c1810]">{stats.total_reservations}</div>
                <div className="text-sm font-medium text-[#65544a] mt-2">Today's Reservations</div>
              </div>
              <div className="p-4 rounded-lg bg-[#faf7f2]">
                <div className="text-4xl font-bold text-[#2c1810]">{stats.total_guests}</div>
                <div className="text-sm font-medium text-[#65544a] mt-2">Expected Guests</div>
              </div>
            </div>
          </div>
        )}
        <div className="mb-16 bg-white overflow-hidden shadow-lg rounded-lg border border-[#e2d9c8] p-8 space-y-8">
          <div className="flex items-center justify-center mb-6">
            <div className="h-12 w-12 rounded-full bg-[#2c1810] bg-opacity-5 flex items-center justify-center mr-4">
              <svg className="w-6 h-6 text-[#2c1810]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
            <h2 className="text-3xl font-serif text-[#2c1810]">Table Assignments</h2>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {sortedAssignments?.map((assignment) => (
              <div key={assignment.waiter_id} className="bg-[#faf7f2] p-6 rounded-lg border border-[#e2d9c8]">
                <div className="flex items-center mb-4">
                  <div className="h-10 w-10 rounded-full bg-[#2c1810] bg-opacity-5 flex items-center justify-center mr-3">
                    <svg className="w-5 h-5 text-[#2c1810]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </div>
                  <div>
                    <h4 className="text-xl font-semibold text-[#2c1810]">{assignment.waiter_name}</h4>
                    <p className="text-sm text-[#8b7355]">{assignment.tables.length} tables assigned</p>
                  </div>
                </div>
                {assignment.summary && (
                  <div className="mb-6 p-4 bg-white rounded-lg border border-[#e2d9c8] text-sm text-[#2c1810] leading-relaxed">
                    {formatSummary(assignment.summary)}
                  </div>
                )}
                
                <div className="divide-y divide-[#e2d9c8]">
                  {assignment.tables.map((table, index) => {
                    const tableKey = `${assignment.waiter_id}-${index}`;
                    const isExpanded = expandedTables[tableKey];
                    
                    return (
                      <div key={index} className="py-3 first:pt-0 last:pb-0">
                        <button 
                          onClick={async () => {
                            setExpandedTables(prev => {
                              const newState = { ...prev, [tableKey]: !prev[tableKey] };
                              
                              // If expanding and data hasn't been loaded
                              if (newState[tableKey]) {
                                if (!allergies[tableKey]) {
                                  // Set loading state for allergies and special events
                                  setAllergies(prev => ({
                                    ...prev,
                                    [tableKey]: 'Loading...'
                                  }));
                                  setSpecialEvents(prev => ({
                                    ...prev,
                                    [tableKey]: 'Loading...'
                                  }));

                                  // Load allergies and special events
                                  fetch(`http://localhost:8000/allergies/${encodeURIComponent(table.diner_name)}`)
                                  .then(response => response.json())
                                  .then(data => {
                                    setAllergies(prev => ({
                                      ...prev,
                                      [tableKey]: data.allergies
                                    }));
                                    setSpecialEvents(prev => ({
                                      ...prev,
                                      [tableKey]: data.special_event || 'None'
                                    }));
                                  })
                                  .catch(error => {
                                    console.error('Error fetching allergies:', error);
                                    setAllergies(prev => ({
                                      ...prev,
                                      [tableKey]: 'Error loading allergies'
                                    }));
                                    setSpecialEvents(prev => ({
                                      ...prev,
                                      [tableKey]: 'Error loading special events'
                                    }));
                                  });
                                }

                                if (!preferences[tableKey]) {
                                  // Set loading state for preferences
                                  setLoadingPreferences(prev => ({
                                    ...prev,
                                    [tableKey]: true
                                  }));

                                  // Load preferences
                                  fetch(`http://localhost:8000/preferences/${encodeURIComponent(table.diner_name)}`)
                                  .then(response => response.json())
                                  .then(data => {
                                    if (data && Array.isArray(data.preferences)) {
                                      setPreferences(prev => ({
                                        ...prev,
                                        [tableKey]: data.preferences
                                      }));
                                    } else {
                                      console.error('Invalid preferences data:', data);
                                      setPreferences(prev => ({
                                        ...prev,
                                        [tableKey]: []
                                      }));
                                    }
                                  })
                                  .catch(error => {
                                    console.error('Error fetching preferences:', error);
                                    setPreferences(prev => ({
                                      ...prev,
                                      [tableKey]: []
                                    }));
                                  })
                                  .finally(() => {
                                    setLoadingPreferences(prev => ({
                                      ...prev,
                                      [tableKey]: false
                                    }));
                                  });
                                }
                              }
                              
                              return newState;
                            });
                          }}
                          className="w-full text-left"
                        >
                          <div className="flex justify-between items-center gap-4">
                            <div>
                              <div className="text-[#2c1810] font-medium group-hover:text-[#65544a]">
                                <span>{table.diner_name}</span>
                                <span className="ml-2">
                                  {isExpanded ? (
                                    <svg className="w-4 h-4 inline-block" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                                    </svg>
                                  ) : (
                                    <svg className="w-4 h-4 inline-block" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                                    </svg>
                                  )}
                                </span>
                              </div>
                              <div className="flex items-center gap-1 mt-1">
                                {[...Array(table.number_of_people)].map((_, i) => (
                                  <svg key={i} className="w-4 h-4 text-[#65544a]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                  </svg>
                                ))}
                              </div>
                            </div>
                            <div className="text-sm font-medium text-[#8b7355] tabular-nums">
                              {formatTime(table.start_time)}
                            </div>
                          </div>
                        </button>
                        
                        {isExpanded && (
                          <div className="mt-3 pl-4 border-l-2 border-[#e2d9c8]">
                            <div className="text-sm">
                              <div className="mb-2">
                                <span className="font-medium text-[#2c1810]">Allergies/Dietary Restrictions:</span>
                                <span className="ml-2 text-[#65544a]">{allergies[tableKey] || table.allergies}</span>
                              </div>
                              <div className="mb-2">
                                <span className="font-medium text-[#2c1810]">Special Event:</span>
                                <span className="ml-2 text-[#65544a] capitalize">
                                  {specialEvents[tableKey] || 'Loading...'}
                                </span>
                              </div>
                              {loadingPreferences[tableKey] ? (
                                <div className="mb-2">
                                  <span className="font-medium text-[#2c1810]">Dining Preferences:</span>
                                  <span className="ml-2 text-[#65544a]">Loading...</span>
                                </div>
                              ) : preferences[tableKey]?.length > 0 ? (
                                <div className="mb-2">
                                  <span className="font-medium text-[#2c1810]">Dining Preferences:</span>
                                  <ul className="mt-1 space-y-1 pl-4 list-disc">
                                    {preferences[tableKey].map((pref, i) => (
                                      <li key={i} className="text-[#65544a]">{pref}</li>
                                    ))}
                                  </ul>
                                </div>
                              ) : null}
                              <div>
                                <span className="font-medium text-[#2c1810]">Orders:</span>
                                <ul className="mt-1 space-y-1">
                                  {table.orders.map((order, i) => (
                                    <li key={i} className="text-[#65544a]">
                                      {order.item}
                                      {order.dietary_tags.length > 0 && (
                                        <span className="text-[#8b7355] ml-2">({order.dietary_tags.join(', ')})</span>
                                      )}
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
