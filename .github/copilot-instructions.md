# Copilot Instructions for Journal App

This document provides instructions for an LLM (e.g., GitHub Copilot) to assist in developing a Next.js application for a journaling platform. The app uses Next.js with the App Router, server-side rendering (SSR), server actions for form submissions, and modern best practices to ensure performance, maintainability, and scalability. Follow these guidelines strictly to ensure consistency and alignment with project goals.

## General Guidelines

### 1. Use Next.js Best Practices

- Always use the latest stable version of Next.js, checking for updates as needed.
- Follow Next.js conventions for file naming, folder structure, and API design.
- Optimize for performance: use dynamic imports (`next/dynamic`) for heavy components, leverage automatic image optimization (`next/image`), and minimize client-side JavaScript.
- Use TypeScript for all code to ensure type safety and better developer experience. Enforce strict typing and avoid `any` types unless absolutely necessary.
- Use ESLint and Prettier with Next.js defaults for consistent code style. Follow Airbnb's JavaScript style guide unless specified otherwise.
- Write clean, modular, and reusable code. Break down components into smaller, focused units, and use hooks for state management.

### 2. Prioritize the App Router

- Use the Next.js App Router (`app/` directory) for all routing and page definitions. Do not use the Pages Router (`pages/` directory).
- Leverage App Router features like layouts (`layout.tsx`), loading states (`loading.tsx`), error boundaries (`error.tsx`), and route groups for organization.
- Use dynamic routes (e.g., `app/journals/[journalId]/page.tsx`) for parameterized URLs.
- Ensure all pages are server-rendered by default. Mark components as `'use client'` only when client-side interactivity (e.g., event handlers, hooks) is required.

### 3. Server-Side Rendering (SSR) and Server Components

- Prioritize server-side rendering (SSR) for all pages to improve SEO and initial load performance. Use server components by default in the App Router.
- Use React Server Components (RSC) by default. Only switch to client components (`'use client'`) for interactive features (e.g., form inputs).
- Fetch data server-side in server components using `fetch`. Avoid client-side data fetching (`useEffect` with `fetch`) unless necessary for dynamic updates.
- Pass data from server components to client components via props to minimize client-side API calls.

### 4. Server Actions for Form Submissions

- Use Next.js Server Actions for all form submissions to handle mutations (e.g., creating/updating journal entries).
- Define server actions in a `lib/actions.ts` file or directly within server components using the `"use server"` directive.
- Ensure forms use the `action` attribute to call server actions (e.g., `<form action={createEntry}>`).
- Handle form validation server-side within the action, returning errors to the client using `FormData` and revalidation with `revalidatePath` or `revalidateTag`.
- Use `redirect` from `next/navigation` in server actions to navigate after successful submissions (e.g., `redirect('/journals/[journalId]')`).
- Avoid client-side form submission libraries unless explicitly requested, as server actions provide a simpler, server-first approach.

### 5. Dependency Management

- Always use the latest stable versions of all dependencies. Check for updates before generating code using `npm outdated` or by searching on npmjs.com.
- Install dependencies with exact versions to avoid unexpected updates, but recommend upgrading to the latest stable version if a newer one exists.
- Avoid deprecated packages or APIs. Ensure all dependencies align with the latest Next.js conventions.

### 6. Error Handling and Logging

- Handle errors gracefully in API routes and server actions, returning appropriate status codes (e.g., 401 for unauthorized, 404 for not found).
- Log errors to the console in development (`console.error`) but avoid logging sensitive data.
- Use Next.js error boundaries (`error.tsx`) for UI error states, providing user-friendly messages (e.g., "Something went wrong, please try again").
- Remember that NextJS throws an error for redirects. Make sure to handle redirect errors gracefully.
- Do not put NextJS redirects inside of try/catch blocks unless you look and you rethrow Next redirects. Also, do not log error messages for next redirects.

### 7. Testing and Validation

- Validate all form inputs server-side in server actions (e.g., ensure `title` is not empty).
- Provide client-side feedback for form errors using Next.js's `useFormStatus` and `useFormState` hooks if needed.
- Test all code snippets for functionality, ensuring forms submit correctly and API routes return expected responses.

### 8. Performance Optimization

- Use `next/dynamic` to lazy-load heavy client components with `loading` states.
- Optimize API routes and server components to minimize response times.
- Leverage Next.js's automatic image optimization if images are added later.
- Minimize re-renders in React components using `React.memo` and `useCallback` where necessary.

### 9. Styling

- Use plain CSS for simplicity, matching the existing app's styles.
- Alternatively, if requested, use Tailwind CSS for faster styling, following Next.js's Tailwind setup guide.
- Ensure styles are scoped to components where possible (e.g., CSS modules or component-specific CSS files).
- Match the app's form width (`max-width: 800px`) and button styles (e.g., blue `bg-blue-600` for submit, gray `border-gray-300` for cancel).

### 10. Security

- Sanitize all user inputs to prevent XSS attacks.
- Use environment variables (`NEXT_PUBLIC_` for client-side, others for server-side) for sensitive data.
- Ensure all API routes and server actions are protected with authentication checks if authentication is added later.

### 11. Additional Notes

- Always generate code that matches the existing app's functionality (e.g., journal entry creation/editing).
- If unsure about a feature, ask for clarification rather than making assumptions.
- Do not put comments in the code.
- Do not type case with the `as` keyword in typescript.
- Suggest improvements (e.g., adding loading states, optimizing API responses) but do not implement them unless requested.

## Example Scenarios

### 1. Creating a New Journal Entry Page

- Use the App Router: `app/journals/[journalId]/entries/[entryId]/create/page.tsx`.
- Fetch the journal server-side to verify it exists.
- Render a form, using a server action to handle submission.
- Redirect to `/journals/[journalId]` on success.

### 2. Editing an Existing Entry

- Use the App Router: `app/journals/[journalId]/entries/[entryId]/edit/page.tsx`.
- Fetch the entry server-side via an API route (`GET /api/entries?entryId=...`) or directly in the server component.
- Pre-fill the form with the entry's data.
- Use a server action to update the entry and redirect on success.

### 3. API Routes

- Define API routes in `app/api/entries/route.ts` for CRUD operations.
- Return JSON responses with appropriate status codes.

## Final Notes

These instructions ensure a consistent, performant, and maintainable Next.js application. Prioritize server-side rendering, server actions, and the App Router in all implementations. Keep dependencies up-to-date, and follow Next.js best practices to deliver a high-quality journaling app. If any clarification is needed, ask before proceeding. Do not put comments in the code unless explicitly requested.
