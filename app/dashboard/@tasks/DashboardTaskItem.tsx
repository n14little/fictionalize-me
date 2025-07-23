"use client";

import { useState } from "react";
import { Task } from "@/lib/models/Task";
import {
  toggleTaskCompletion,
  deleteTask,
} from "@/app/dashboard/@tasks/actions";
import { CsrfTokenInput } from "@/components/CsrfTokenInput";
import Link from "next/link";

interface DashboardTaskItemProps {
  task: Task;
}

export function DashboardTaskItem({ task }: DashboardTaskItemProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const [isToggling, setIsToggling] = useState(false);

  async function handleToggleCompletion(formData: FormData) {
    setIsToggling(true);
    try {
      await toggleTaskCompletion(formData);
    } catch (error) {
      // Check if this is a Next.js redirect error - if so, let it propagate
      if (
        error instanceof Error &&
        (error.message.includes("NEXT_REDIRECT") ||
          error.toString().includes("NEXT_REDIRECT") ||
          error.name === "RedirectError")
      ) {
        throw error;
      }
      console.error("Error toggling task completion:", error);
    } finally {
      setIsToggling(false);
    }
  }

  async function handleDelete(formData: FormData) {
    if (confirm("Are you sure you want to delete this task?")) {
      setIsDeleting(true);
      try {
        await deleteTask(formData);
      } catch (error) {
        // Check if this is a Next.js redirect error - if so, let it propagate
        if (
          error instanceof Error &&
          (error.message.includes("NEXT_REDIRECT") ||
            error.toString().includes("NEXT_REDIRECT") ||
            error.name === "RedirectError")
        ) {
          throw error;
        }
        console.error("Error deleting task:", error);
        setIsDeleting(false);
      }
    }
  }

  return (
    <div className="p-3 border border-gray-200 rounded-md hover:bg-gray-50 transition-colors">
      <div className="flex items-start gap-2">
        <form action={handleToggleCompletion}>
          <CsrfTokenInput />
          <input type="hidden" name="taskId" value={task.id} />
          <button
            type="submit"
            disabled={isToggling}
            className={`w-4 h-4 rounded border mt-0.5 ${
              task.completed
                ? "bg-blue-500 border-blue-600 text-white flex items-center justify-center"
                : "border-gray-400"
            }`}
            aria-label={
              task.completed ? "Mark as incomplete" : "Mark as complete"
            }
          >
            {task.completed && (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 20 20"
                fill="currentColor"
                className="w-2.5 h-2.5"
              >
                <path
                  fillRule="evenodd"
                  d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z"
                  clipRule="evenodd"
                />
              </svg>
            )}
          </button>
        </form>

        <div className="flex-1 min-w-0">
          <h3
            className={`text-sm font-medium ${
              task.completed ? "line-through text-gray-400" : "text-gray-700"
            }`}
          >
            {task.title}
          </h3>
          {task.description && (
            <p
              className={`mt-1 text-xs ${
                task.completed ? "text-gray-400" : "text-gray-500"
              } line-clamp-2`}
            >
              {task.description}
            </p>
          )}
          <div className="flex items-center gap-2 text-xs text-gray-400 mt-1">
            <span>{new Date(task.created_at).toLocaleDateString()}</span>
            <Link
              href={`/journals/${task.journal_id}`}
              className="text-blue-600 hover:text-blue-800 hover:underline"
            >
              Journal →
            </Link>
          </div>
        </div>

        <form action={handleDelete}>
          <CsrfTokenInput />
          <input type="hidden" name="taskId" value={task.id} />
          <button
            type="submit"
            disabled={isDeleting}
            className="text-red-500 hover:text-red-700 p-1 rounded hover:bg-red-50 transition-colors"
            aria-label="Delete task"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
              className="w-3 h-3"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916M12 9v2.25"
              />
            </svg>
          </button>
        </form>
      </div>
    </div>
  );
}
