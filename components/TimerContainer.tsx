import { journalEntryService } from '../lib/services/journalEntryService';
import { journalService } from '../lib/services/journalService';
import { authService } from '../lib/services/authService';
import Timer from './Timer';

interface JournalEntryData {
  id: string;
  journalId: string;
  title: string;
}

export async function TimerContainer() {
  // Get the current user
  const currentUser = await authService.getCurrentUser();
  
  if (!currentUser) {
    // If not authenticated, render Timer without entries
    return <Timer entries={[]} />;
  }

  // Fetch all user's journals
  const journals = await journalService.getUserJournals(currentUser.id);

  // For each journal, get entries
  const entriesPromises = journals.map(async journal => {
    const entries = await journalEntryService.getJournalEntries(journal.id, currentUser.id);
    return entries.map(entry => ({
      id: entry.id,
      journalId: journal.id,
      title: entry.title
    }));
  });

  // Resolve all promises
  const entriesArrays = await Promise.all(entriesPromises);
  
  // Flatten the array of arrays into a single array
  const allEntries: JournalEntryData[] = entriesArrays.flat();

  return <Timer entries={allEntries} />;
}