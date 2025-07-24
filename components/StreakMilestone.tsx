'use client';

import { useEffect, useState } from 'react';
import { Modal } from './Modal';

interface StreakMilestoneProps {
  currentStreak: number;
  longestStreak: number;
  totalDays: number;
  isVisible: boolean;
  onClose: () => void;
}

export function StreakMilestone({
  currentStreak,
  longestStreak,
  totalDays,
  isVisible,
  onClose,
}: StreakMilestoneProps) {
  const [message, setMessage] = useState('');
  const [title, setTitle] = useState('');

  // Determine milestone message based on streak data
  useEffect(() => {
    // Current streak milestones
    if (currentStreak === 3) {
      setTitle('3-Day Streak!');
      setMessage(
        "You've journaled for 3 days in a row. You're building a great habit!"
      );
    } else if (currentStreak === 7) {
      setTitle('One Week Streak!');
      setMessage('A whole week of journaling! Your consistency is impressive.');
    } else if (currentStreak === 14) {
      setTitle('Two Week Streak!');
      setMessage(
        'Two weeks of consistent journaling! Your commitment to reflection is admirable.'
      );
    } else if (currentStreak === 21) {
      setTitle('21-Day Milestone!');
      setMessage(
        '21 days is often cited as the time it takes to form a habit. Your journaling practice is becoming part of your routine!'
      );
    } else if (currentStreak === 30) {
      setTitle('30-Day Achievement!');
      setMessage(
        'A full month of daily journaling! This is a significant achievement in developing your journaling habit.'
      );
    } else if (currentStreak === 50) {
      setTitle('50-Day Streak!');
      setMessage(
        'Fifty days of consistent journaling! Your dedication is truly remarkable.'
      );
    } else if (currentStreak === 100) {
      setTitle('100-Day Milestone!');
      setMessage(
        'One hundred days of journaling! This level of consistency shows true commitment to your personal growth.'
      );
    } else if (currentStreak > 0 && currentStreak % 100 === 0) {
      setTitle(`${currentStreak}-Day Milestone!`);
      setMessage(
        `Incredible! You've journaled for ${currentStreak} consecutive days. Your commitment to reflection is truly inspiring.`
      );
    }
    // Total days milestones
    else if (totalDays === 10) {
      setTitle('10 Journal Entries!');
      setMessage(
        "You've written 10 journal entries in total. Keep up the great work!"
      );
    } else if (totalDays === 25) {
      setTitle('25 Journal Entries!');
      setMessage(
        '25 journal entries! Your collection of thoughts and reflections is growing nicely.'
      );
    } else if (totalDays === 50) {
      setTitle('50 Journal Entries!');
      setMessage(
        "You've written 50 journal entries in total. What an impressive archive of your thoughts!"
      );
    } else if (totalDays === 100) {
      setTitle('Century of Journaling!');
      setMessage(
        "100 total journal entries! You've built an incredible repository of your thoughts and experiences."
      );
    } else if (totalDays > 0 && totalDays % 100 === 0) {
      setTitle(`${totalDays} Journal Entries!`);
      setMessage(
        `You\'ve written ${totalDays} journal entries in total. Your dedication to journaling is remarkable!`
      );
    }
  }, [currentStreak, longestStreak, totalDays]);

  if (!isVisible || !message) {
    return null;
  }

  return (
    <Modal onClose={onClose} isFullscreen={false}>
      <div className="text-center py-8 px-4">
        <div className="mb-4">
          <div className="inline-block p-4 rounded-full bg-yellow-100 text-yellow-600">
            <svg
              className="w-12 h-12"
              fill="currentColor"
              viewBox="0 0 20 20"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                fillRule="evenodd"
                d="M5 2a1 1 0 011 1v1h1a1 1 0 010 2H6v1a1 1 0 01-2 0V6H3a1 1 0 010-2h1V3a1 1 0 011-1zm0 10a1 1 0 011 1v1h1a1 1 0 110 2H6v1a1 1 0 11-2 0v-1H3a1 1 0 110-2h1v-1a1 1 0 011-1zm7-10a1 1 0 01.707.293l.707.707.707-.707A1 1 0 0116 2.414l.707.707-.707.707a1 1 0 01-1.414-1.414l-.707-.707a1 1 0 01.707-.293zm0 10a1 1 0 01.707.293l.707.707.707-.707A1 1 0 0116 12.414l.707.707-.707.707a1 1 0 01-1.414-1.414l-.707-.707a1 1 0 01.707-.293z"
                clipRule="evenodd"
              ></path>
            </svg>
          </div>
        </div>

        <h2 className="text-2xl font-bold mb-2">{title}</h2>
        <p className="text-gray-600 mb-6">{message}</p>

        <button
          onClick={onClose}
          className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-md font-medium"
        >
          Continue Journaling!
        </button>
      </div>
    </Modal>
  );
}
