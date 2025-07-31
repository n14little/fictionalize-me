# SQL Query Refactoring - Single Statement Queries

## Overview

This document outlines the changes made to convert multi-statement SQL queries into single statement SQL queries in the repository layer, and to optimize service methods to use single database trips.

## Changes Made

### TaskRepository Refactoring

Two complex methods in `lib/repositories/taskRepository.ts` were refactored to use single statement SQL queries:

#### 1. `createTasksFromReferenceTasksForUser`

**Before:** Used a complex WITH clause combining:

- CTE for eligible reference tasks selection
- CTE for tasks to create selection
- INSERT operation within CTE
- UPDATE operation within CTE
- Final SELECT for counting

**After:** Broken down into 3 separate single statement queries:

1. **SELECT** - Get eligible reference tasks
2. **INSERT** - Create new tasks from eligible reference tasks
3. **UPDATE** - Update next_scheduled_date for reference tasks that had tasks created

#### 2. `createTasksFromReferenceTasksForDate`

**Before:** Similar complex WITH clause structure as above but for all users

**After:** Broken down into 4 separate single statement queries:

1. **SELECT** - Get eligible reference tasks across all users
2. **INSERT** - Create new tasks from eligible reference tasks
3. **SELECT** - Count distinct users processed
4. **UPDATE** - Update next_scheduled_date for reference tasks that had tasks created

### Service Layer Optimization

Service methods were optimized to use single database trips instead of multiple repository calls:

#### Added Repository Methods for Single-Trip Operations:

- `createSubTaskWithValidation` - Validates parent task and creates sub-task in one query
- `getValidParentTasksForTask` - Gets valid parent tasks with hierarchy validation in one query
- `completeTaskWithSubTaskInfo` - Updates task completion and retrieves sub-task info in one query

#### Optimized Service Methods:

- **`createSubTask`**: Now uses single query that validates parent ownership, checks depth limits, and creates sub-task
- **`getValidParentTasks`**: Now uses single query that calculates depths and filters valid parents
- **`handleTaskCompletion`**: Now uses single query that updates completion and retrieves sub-task information

#### Removed Unused Methods:

- `validateTaskHierarchy` - Not called anywhere in the codebase
- `getTaskBreadcrumbs` - Not called anywhere in the codebase
- `completeAllSubTasks` - Not called anywhere in the codebase
- `getTaskAncestors` (repository) - Not used after service cleanup
- `validateParentAssignment` (repository) - Not used after service cleanup
- `getTaskDepth` (repository) - Not used after service cleanup
- `completeAllSubTasksRecursively` (repository) - Not used after service cleanup

## Benefits

1. **Simplicity**: Each query performs a single operation, making them easier to understand and debug
2. **Database Compatibility**: Single statement queries are more portable across different database systems
3. **Performance**:
   - Separating operations allows for better query optimization and easier monitoring
   - Reduced database round trips through single-trip service methods
   - Less network overhead and more efficient query execution
4. **Maintainability**: Individual queries are easier to modify and test
5. **Error Handling**: Each operation can be individually wrapped with error handling if needed
6. **Cleaner Codebase**: Removed unused methods reduce maintenance burden

## Implementation Details

### Error Handling

- Both refactored repository methods include early returns when no eligible tasks are found
- TypeScript types are properly maintained for query results
- Conditional execution for UPDATE operations (only when tasks were created)

### Performance Considerations

- The refactored approach may result in slightly more database round trips for complex operations
- However, each individual query is simpler and can be better optimized
- Early exits when no work is needed reduce unnecessary operations
- Service layer optimizations significantly reduce total database calls for common operations

### Type Safety

- All query results are properly typed using TypeScript interfaces
- Result counting and mapping operations use appropriate type assertions

## Files Modified

- `lib/repositories/taskRepository.ts` - Primary changes to complex query methods and added single-trip methods
- `lib/services/taskService.ts` - Optimized to use single-trip repository methods and removed unused methods

## Migration Files

Migration files (`db/migrations/*.sql`) were examined but not modified as they contain legitimate stored procedures and functions that appropriately use transaction blocks for data migration purposes.

## Testing

- ESLint passes without warnings or errors
- TypeScript compilation succeeds without type errors
- All existing functionality is preserved with the same API contracts
- Removed methods were verified to have no usages in the codebase before removal

- Both methods include early returns when no eligible tasks are found
- TypeScript types are properly maintained for query results
- Conditional execution for UPDATE operations (only when tasks were created)

### Performance Considerations

- The refactored approach may result in slightly more database round trips
- However, each individual query is simpler and can be better optimized
- Early exits when no work is needed reduce unnecessary operations

### Type Safety

- All query results are properly typed using TypeScript interfaces
- Result counting and mapping operations use appropriate type assertions

## Files Modified

- `lib/repositories/taskRepository.ts` - Primary changes to the two mentioned methods

## Migration Files

Migration files (`db/migrations/*.sql`) were examined but not modified as they contain legitimate stored procedures and functions that appropriately use transaction blocks for data migration purposes.

## Testing

- ESLint passes without warnings or errors
- TypeScript compilation succeeds without type errors
- All existing functionality is preserved with the same API contracts
