import { json } from '@remix-run/node';
import { useLoaderData, useNavigate } from '@remix-run/react';
import { useState, useEffect } from 'react';

interface Table {
  diner_name: string;
  number_of_people: number;
  start_time: string;
  orders: Array<{
    item: string;
    dietary_tags: string[];
    price: number;
  }>;
}

interface Assignment {
  waiter_id: number;
  waiter_name: string;
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
      fetch('http://localhost:8001/attendance'),
      fetch('http://localhost:8001/daily-stats')
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

export default function Assignments() {
  const { assignments, stats, error } = useLoaderData<typeof loader>();
  const navigate = useNavigate();

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
            {/* <h3 className="text-2xl font-serif text-[#2c1810] text-center mb-6">Today's Customers at a Glance</h3> */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
              <div className="p-4 rounded-lg bg-[#faf7f2]">
                <div className="text-4xl font-bold text-[#2c1810]">{stats.total_reservations}</div>
                <div className="text-sm font-medium text-[#65544a] mt-2">Today's Reservations</div>
              </div>
              <div className="p-4 rounded-lg bg-[#faf7f2]">
                <div className="text-4xl font-bold text-[#2c1810]">{stats.total_guests}</div>
                <div className="text-sm font-medium text-[#65544a] mt-2">Expected Guests</div>
              </div>
              <div className="p-4 rounded-lg bg-[#faf7f2]">
                <div className="text-4xl font-bold text-[#2c1810]">{stats.special_events}</div>
                <div className="text-sm font-medium text-[#65544a] mt-2">Special Events</div>
              </div>
            </div>
            {/* <p className="text-sm text-[#8b7355] text-center mt-6">Let's get started!</p> */}
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
                <div className="flex items-center mb-6">
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
                
                <div className="divide-y divide-[#e2d9c8]">
                  {assignment.tables.map((table, index) => (
                    <div key={index} className="py-3 first:pt-0 last:pb-0">
                      <div className="flex justify-between items-center gap-4">
                        <div>
                          <div className="text-[#2c1810] font-medium">{table.diner_name}</div>
                          <div className="text-sm text-[#65544a]">Party of {table.number_of_people}</div>
                        </div>
                        <div className="text-sm font-medium text-[#8b7355] tabular-nums">
                          {formatTime(table.start_time)}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
