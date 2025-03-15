import type { MetaFunction } from "@remix-run/node";
import { json } from '@remix-run/node';
import { useLoaderData } from '@remix-run/react';

export const meta: MetaFunction = () => {
  return [
    { title: "French Laudure" },
    { name: "description", content: "Discover the finest in French dining" },
  ];
};

interface LoaderData {
  data?: any;
  error?: string;
}

export const loader = async () => {
  try {
    const response = await fetch('http://localhost:8000/dining-data');
    const data = await response.json();
    return json<LoaderData>({ data });
  } catch (error) {
    return json<LoaderData>({ error: 'Failed to fetch dining data' });
  }
};

export default function Index() {
  const { data, error } = useLoaderData<typeof loader>();

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

