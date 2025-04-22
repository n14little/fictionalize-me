'use server';

import { redirect } from 'next/navigation';
import { waitlistService } from '../../lib/services/waitlistService';

export async function joinWaitlist(formData: FormData) {
  const email = formData.get('email') as string;
  const interest = formData.get('interest') as string;
  
  // Validate form data
  if (!email || typeof email !== 'string' || !email.includes('@')) {
    throw new Error('A valid email is required');
  }
  
  try {
    // Add to waitlist
    const entry = await waitlistService.addToWaitlist(email, interest);
    
    if (!entry) {
      throw new Error('Failed to add to waitlist');
    }
  } catch (error) {
    console.error('Error joining waitlist:', error);
    // Redirect to an error page instead of throwing
    redirect('/waitlist/error');
  }
  
  // Redirect to the landing page on success (outside the try-catch)
  redirect('/');
}