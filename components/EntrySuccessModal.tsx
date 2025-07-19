'use client';

import { useRouter } from 'next/navigation';
import { Modal } from './Modal';
import { UserStreakStats } from '../lib/models/JournalStreak';

interface EntriesStats {
  totalEntries: number;
}

interface EntrySuccessModalProps {
  onClose: () => void;
  entriesStats: EntriesStats;
  streakStats: UserStreakStats;
  journalId?: string; // Optional - if missing, redirect to dashboard
  isNewEntry: boolean;
}

export function EntrySuccessModal({
  onClose,
  entriesStats,
  streakStats,
  journalId,
  isNewEntry
}: EntrySuccessModalProps) {
  const router = useRouter();

  const handleClose = () => {
    onClose();
    // If journalId is missing, redirect to dashboard, otherwise to journal
    if (!journalId) {
      router.push('/dashboard');
    } else {
      router.push(`/journals/${journalId}`);
    }
  };

  const isFromDashboard = !journalId;

  return (
    <Modal onClose={handleClose}>
      <div className="bg-white p-6 rounded-lg max-w-xl w-full mx-auto">
        <div className="text-center mb-6">
          <div className="flex items-center justify-center mb-4">
            <div className="bg-green-100 rounded-full p-3">
              <svg className="h-8 w-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
              </svg>
            </div>
          </div>
          <h3 className="text-xl font-bold text-gray-900">
            {isNewEntry ? "Entry Created Successfully!" : "Entry Updated Successfully!"}
          </h3>
          <p className="text-gray-600 mt-2">
            Your journaling streak is growing! Check out your updated stats below.
          </p>
        </div>
        
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="bg-blue-50 p-4 rounded-md text-center">
            <div className="text-2xl font-bold text-blue-600">{streakStats.currentStreak}</div>
            <div className="text-sm text-gray-600">Current Streak</div>
          </div>
          
          <div className="bg-purple-50 p-4 rounded-md text-center">
            <div className="text-2xl font-bold text-purple-600">{streakStats.totalDays}</div>
            <div className="text-sm text-gray-600">Total Days</div>
          </div>
        </div>
        
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="bg-teal-50 p-4 rounded-md text-center">
            <div className="text-2xl font-bold text-teal-600">{entriesStats.totalEntries}</div>
            <div className="text-sm text-gray-600">Total Entries</div>
          </div>

        </div>
        
        <div className="flex justify-center">
          <button
            onClick={handleClose}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {isFromDashboard ? 'Return to Dashboard' : 'Continue to Journal'}
          </button>
        </div>
      </div>
    </Modal>
  );
}
