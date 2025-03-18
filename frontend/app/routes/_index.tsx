import type { MetaFunction } from "@remix-run/node";
import { json } from '@remix-run/node';
import { useLoaderData, useNavigate } from '@remix-run/react';
import { useState, useEffect } from 'react';

export const meta: MetaFunction = () => {
  return [
    { title: "French Laudure" },
    { name: "description", content: "Discover the finest in French dining" },
  ];
};

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
  data?: any;
  stats?: DailyStats;
  error?: string;
  initialAttendance?: number[];
  initialAssignments?: Assignment[];
}

export const loader = async () => {
  try {
    const [diningResponse, attendanceResponse, statsResponse] = await Promise.all([
      fetch('http://localhost:8000/dining-data'),
      fetch('http://localhost:8000/attendance'),
      fetch('http://localhost:8000/daily-stats')
    ]);
    const [diningData, attendanceData, statsData] = await Promise.all([
      diningResponse.json(),
      attendanceResponse.json(),
      statsResponse.json()
    ]);
    return json<LoaderData>({
      data: diningData,
      stats: statsData,
      initialAttendance: attendanceData.waiter_ids,
      initialAssignments: attendanceData.assignments
    });
  } catch (error) {
    return json<LoaderData>({ error: 'Failed to fetch data' });
  }
};

export default function Index() {
  const { data, stats, error, initialAttendance } = useLoaderData<typeof loader>();
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const waiters = [
    { id: 1, name: "Sauman Das" },
    { id: 2, name: "Danny Bessonov" },
    { id: 3, name: "Justin Zhou" },
    { id: 4, name: "Amélie Rousseau" },
    { id: 5, name: "Philippe Lefebvre" },
    { id: 6, name: "Sophie Beaumont" },
    { id: 7, name: "Lucas Girard" },
    { id: 8, name: "Isabelle Dupont" },
    { id: 9, name: "Antoine Mercier" },
    { id: 10, name: "Claire Fontaine" }
  ];

  const [attendanceList, setAttendanceList] = useState<number[]>(initialAttendance || []);

  const handleAttendanceChange = (waiterId: number) => {
    const newAttendance = attendanceList.includes(waiterId)
      ? attendanceList.filter(id => id !== waiterId)
      : [...attendanceList, waiterId];
    
    setAttendanceList(newAttendance);
    setSubmitError(null);
  };

  const handleFinishRollCall = async () => {
    if (attendanceList.length === 0) {
      setSubmitError('Please select at least one waiter');
      return;
    }

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      const response = await fetch('http://localhost:8000/attendance', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ waiter_ids: attendanceList }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to submit attendance');
      }

      navigate('/assignments');
    } catch (error) {
      console.error('Failed to submit attendance:', error);
      setSubmitError('Failed to submit attendance. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  useEffect(() => {
    if (initialAttendance) {
      setAttendanceList(initialAttendance);
    }
  }, [initialAttendance]);

  return (
    <div className="min-h-screen bg-[#faf7f2]">
      <header className="bg-white shadow-lg border-b border-[#e2d9c8]">
        <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-5xl font-bold text-[#2c1810] font-serif italic">French Laudure</h1>
          <p className="mt-4 text-xl text-[#65544a] font-serif">Découvrez l'excellence de la cuisine française</p>
          <p className="mt-2 text-lg text-[#8b7355]">Discover the finest in French dining</p>
        </div>
      </header>

      <main className="max-w-7xl mx-auto py-16 px-4 sm:px-6 lg:px-8">
        {stats && (
          <div className="mb-12 bg-white rounded-lg shadow-lg border border-[#e2d9c8] p-6">
            <h3 className="text-2xl font-serif text-[#2c1810] text-center mb-6">Today's Customers at a Glance</h3>
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
            <h3 className="text-2xl font-serif text-[#2c1810] text-center mb-6 mt-6">Let's get started!</h3>
          </div>
        )}

        <div className="mb-16 bg-white overflow-hidden shadow-lg rounded-lg border border-[#e2d9c8] p-8 space-y-8">
          <div className="flex items-center justify-center mb-6">
            <div className="h-12 w-12 rounded-full bg-[#2c1810] bg-opacity-5 flex items-center justify-center mr-4">
              <svg className="w-6 h-6 text-[#2c1810]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <h2 className="text-3xl font-semibold text-[#2c1810] font-serif text-center">Today's Staff Attendance</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {waiters.map(waiter => (
              <div key={waiter.id} className="flex items-center space-x-3 p-3 rounded-lg hover:bg-[#faf7f2] transition-colors border border-transparent hover:border-[#e2d9c8]">
                <input
                  type="checkbox"
                  id={`waiter-${waiter.id}`}
                  checked={attendanceList.includes(waiter.id)}
                  onChange={() => handleAttendanceChange(waiter.id)}
                  className="h-5 w-5 rounded border-[#e2d9c8] text-[#2c1810] focus:ring-[#2c1810]"
                />
                <label
                  htmlFor={`waiter-${waiter.id}`}
                  className="text-lg text-[#65544a] cursor-pointer select-none"
                >
                  {waiter.name}
                </label>
              </div>
            ))}
          </div>
          <div className="mt-6 text-center space-y-6">
            <div className="inline-flex items-center px-4 py-2 rounded-full bg-[#2c1810] bg-opacity-5">
              <svg className="w-5 h-5 text-[#2c1810] mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="text-[#2c1810] font-medium">
                {attendanceList.length} staff members present today
              </span>
            </div>

            {submitError && (
              <div className="inline-flex items-center px-6 py-3 rounded-lg bg-red-50">
                <svg className="h-5 w-5 text-red-500 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="text-red-500 font-medium">{submitError}</span>
              </div>
            )}

            <button
              onClick={handleFinishRollCall}
              disabled={isSubmitting}
              className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-[#2c1810] hover:bg-[#1a0f0a] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#2c1810] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isSubmitting ? (
                <>
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Submitting...
                </>
              ) : (
                'Finish Roll Call'
              )}
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-10 sm:grid-cols-2 lg:grid-cols-3">
          <div className="bg-white overflow-hidden shadow-lg rounded-lg transition-all duration-300 hover:shadow-xl hover:scale-105 border border-[#e2d9c8]">
            <div className="px-8 py-10">
              <div className="h-16 w-16 mx-auto mb-6 rounded-full bg-[#2c1810] bg-opacity-5 flex items-center justify-center">
                <svg className="w-8 h-8 text-[#2c1810]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h3 className="text-2xl font-semibold text-[#2c1810] mb-4 text-center font-serif">AI-Powered Recommendations</h3>
              <p className="text-[#65544a] text-center leading-relaxed">
                Our sophisticated AI system will analyze your preferences to suggest the perfect French dining experiences.
              </p>
            </div>
          </div>
          
          <div className="bg-white overflow-hidden shadow-lg rounded-lg transition-all duration-300 hover:shadow-xl hover:scale-105 border border-[#e2d9c8]">
            <div className="px-8 py-10">
              <div className="h-16 w-16 mx-auto mb-6 rounded-full bg-[#2c1810] bg-opacity-5 flex items-center justify-center">
                <svg className="w-8 h-8 text-[#2c1810]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                </svg>
              </div>
              <h3 className="text-2xl font-semibold text-[#2c1810] mb-4 text-center font-serif">Curated Experiences</h3>
              <p className="text-[#65544a] text-center leading-relaxed">
                Explore hand-picked selections from the finest French restaurants and culinary experts.
              </p>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow-lg rounded-lg transition-all duration-300 hover:shadow-xl hover:scale-105 border border-[#e2d9c8]">
            <div className="px-8 py-10">
              <div className="h-16 w-16 mx-auto mb-6 rounded-full bg-[#2c1810] bg-opacity-5 flex items-center justify-center">
                <svg className="w-8 h-8 text-[#2c1810]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
              </div>
              <h3 className="text-2xl font-semibold text-[#2c1810] mb-4 text-center font-serif">Fine Dining Dataset</h3>
              <p className="text-[#65544a] text-center leading-relaxed">
                Access our comprehensive collection of French culinary knowledge and expertise.
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

