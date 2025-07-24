import { redirect } from 'next/navigation';
import { authService } from '@/lib/services/authService';

export default async function Dashboard() {
  // Get the current user
  const user = await authService.getCurrentUser();

  // If not logged in, redirect to sign-in
  if (!user) {
    redirect('/auth/signin');
  }

  // This component doesn't render anything visible as the layout
  // already contains the header and parallel routes render the content
  return null;
}
