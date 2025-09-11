'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/contexts/auth';

interface SearchHistoryItem {
  name: string;
  symbol: string;
}

export default function SearchHistorySidebar() {
  const router = useRouter();
  const { logout } = useAuth();
  const [history, setHistory] = useState<SearchHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSearchHistory();
  }, []);

  const fetchSearchHistory = async () => {
    try {
      const response = await fetch('/api/search-history');
      if (response.ok) {
        const data = await response.json();
        setHistory(data);
      }
    } catch (error) {
      console.error('Failed to fetch search history:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    router.push('/auth/login');
  };

  return (
    <div className="w-64 bg-gray-900 border-r border-gray-800 p-4 flex flex-col h-screen">
      <h2 className="text-lg font-semibold mb-4">Search History</h2>
      
      <div className="flex-grow overflow-y-auto">
        {loading ? (
          <div className="flex justify-center items-center h-32">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
          </div>
        ) : history.length > 0 ? (
          <ul className="space-y-2">
            {history.map((item, index) => (
              <li
                key={`${item.symbol}-${index}`}
                className="p-2 hover:bg-gray-800 rounded cursor-pointer"
              >
                <span className="font-medium">{item.symbol}</span>
                <p className="text-sm text-gray-400">{item.name}</p>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-gray-400 text-sm">No search history</p>
        )}
      </div>

      {/* Logout Button */}
      <button
        onClick={handleLogout}
        className="mt-4 w-full bg-red-500 hover:bg-red-600 text-white font-medium py-2 px-4 rounded transition-colors"
      >
        Logout
      </button>
    </div>
  );
}
