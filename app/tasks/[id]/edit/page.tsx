import { redirect, notFound } from 'next/navigation';
import Link from 'next/link';
import { authService } from '@/lib/services/authService';
import { taskService } from '@/lib/services/taskService';
import { journalService } from '@/lib/services/journalService';
import { TaskForm } from '@/app/tasks/TaskForm';

export const dynamic = 'force-dynamic';

export default async function EditTaskPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await authService.getCurrentUser();

  if (!user) {
    redirect('/auth/signin');
  }

  const { id } = await params;

  const [task, journals] = await Promise.all([
    taskService.getTaskById(id, user.id),
    journalService.getUserJournals(user.id),
  ]);

  if (!task) {
    notFound();
  }

  return (
    <main className="flex min-h-screen flex-col items-center p-4 md:p-12">
      <div className="w-full max-w-2xl">
        <Link
          href="/tasks"
          className="text-blue-600 hover:text-blue-800 mb-4 block"
        >
          ← Back to Tasks
        </Link>
        <h1 className="text-2xl font-bold mb-8">Edit Task</h1>
        <TaskForm journals={journals} task={task} isEditing={true} />
      </div>
    </main>
  );
}
