# Sub-Tasks Feature Implementation Plan

## Overview

This document outlines the implementation plan for adding sub-task functionality to the existing task system. Sub-tasks will be implemented using a self-referential approach within the existing `tasks` table, allowing tasks to have parent-child relationships.

## Goals

- Allow users to create hierarchical task structures
- Maintain existing functionality and performance
- Provide intuitive UI for managing task hierarchies
- Ensure data consistency and prevent circular references

## Technical Architecture

### Database Changes

- **Add `parent_task_id` column** to existing `tasks` table
- **Add database index** for performance optimization
- **Add constraint** to prevent circular references
- **Migration**: V12\_\_add_task_hierarchy.sql

### Data Model Updates

```typescript
interface Task {
  // ... existing fields
  parent_task_id: string | null; // Reference to parent task
}

interface CreateTask {
  // ... existing fields
  parent_task_id?: string;
}

interface UpdateTask {
  // ... existing fields
  parent_task_id?: string;
}
```

### Business Rules

1. **Hierarchy Depth**: Maximum 3 levels deep (task -> sub-task -> sub-sub-task)
2. **Circular Reference Prevention**: Tasks cannot be their own ancestors
3. **Journal Inheritance**: Sub-tasks inherit the parent's journal_id (cannot be changed)
4. **Priority Ordering**: Sub-tasks are ordered within their parent's context
5. **Completion Logic**:
   - Completing a parent task prompts to complete all incomplete sub-tasks
   - Completing all sub-tasks does NOT auto-complete the parent
6. **Deletion**: Deleting a parent task promotes sub-tasks to top-level

## Implementation Phases

### Phase 1: Core Infrastructure ✅

- [x] Database migration for `parent_task_id` column
- [x] Update Task model interfaces
- [x] Add repository methods for hierarchical queries
- [x] Add service layer methods for sub-task operations
- [x] Add validation for circular references and depth limits

### Phase 2: Basic UI Implementation ✅

- [x] Update TaskForm to support parent task selection
- [x] Update TasksList to show hierarchical structure with indentation
- [x] Add "Add Sub-task" functionality to existing tasks
- [x] Update TaskItem to show parent-child relationships
- [x] Basic visual hierarchy (indentation, icons)

### Phase 3: Advanced Features ✅

- [x] Completion logic with user prompts
- [x] Prevent invalid parent-child assignments
- [x] Update priority handling for hierarchical structure
- [x] Add breadcrumb navigation in edit forms

## Database Schema

### Migration: V12\_\_add_task_hierarchy.sql

```sql
-- Add parent_task_id column for hierarchical tasks
ALTER TABLE tasks ADD COLUMN parent_task_id UUID REFERENCES tasks(id) ON DELETE SET NULL;

-- Add index for performance
CREATE INDEX idx_tasks_parent_task_id ON tasks (parent_task_id);

-- Add constraint to prevent tasks from being too deep (max 3 levels)
-- This will be enforced at the application level due to complexity of SQL recursive checks
```

## API Changes

### Repository Methods

- `findByParentId(parentId: string): Promise<Task[]>` - Get direct children
- `findHierarchy(userId: number): Promise<Task[]>` - Get all tasks with proper ordering
- `getTaskAncestors(taskId: string): Promise<Task[]>` - Get path to root
- `validateParentAssignment(taskId: string, parentId: string): Promise<boolean>` - Prevent cycles

### Service Methods

- `createSubTask(userId: number, parentId: string, data: CreateTask): Promise<Task>`
- `validateTaskHierarchy(taskId: string, newParentId: string): Promise<boolean>`
- `promoteSubTasksToTopLevel(parentId: string): Promise<void>`

## UI/UX Design

### Visual Hierarchy

- **Indentation**: 20px per level (max 60px for 3 levels)
- **Icons**:
  - Parent with children: `📁` (folder icon)
  - Sub-task: `└─` (tree branch)
  - Last sub-task: `└─` (same, but could be different)
- **Visual Grouping**: Sub-tasks immediately follow their parent

### User Interactions

1. **Create Sub-task**: "Add Sub-task" button on each task item
2. **Edit Parent**: Dropdown in edit form (limited to valid parents)
3. **Completion**: Modal prompt when completing parent with incomplete children
4. **Visual Feedback**: Clear parent-child relationships in all views

### Responsive Design

- Mobile: Reduced indentation (10px per level)
- Desktop: Full indentation (20px per level)
- Consistent across dashboard and tasks page

## Validation Rules

### Application Level

1. **Max Depth**: 3 levels maximum
2. **Circular Reference**: Task cannot be ancestor of itself
3. **Journal Consistency**: Sub-tasks must have same journal_id as parent
4. **User Ownership**: All tasks in hierarchy must belong to same user

### Database Level

- Foreign key constraint on parent_task_id
- Cascade behavior: SET NULL on parent deletion (then promote children)

## Testing Strategy

### Unit Tests

- Task hierarchy validation logic
- Circular reference prevention
- Completion logic with sub-tasks

### Integration Tests

- Database queries for hierarchical data
- Service layer operations
- API endpoint behavior

### User Acceptance Testing

- Create/edit/delete sub-tasks
- Visual hierarchy display
- Completion workflows
- Mobile responsiveness

## Performance Considerations

### Database Optimization

- Index on parent_task_id for fast child lookups
- Efficient recursive queries using PostgreSQL WITH RECURSIVE
- Limit query depth to prevent performance issues

### Caching Strategy

- Cache task hierarchies per user
- Invalidate cache on task modifications
- Consider pre-computing hierarchy metadata

## Migration Strategy

### Backward Compatibility

- Existing tasks become top-level (parent_task_id = NULL)
- No breaking changes to existing API
- Graceful degradation if sub-tasks are disabled

### Rollout Plan

1. Deploy database migration
2. Update backend services
3. Deploy frontend with feature flag
4. Enable feature for all users
5. Monitor performance and user feedback

## Security Considerations

### Authorization

- Users can only create sub-tasks under their own tasks
- No cross-user task hierarchies
- Validate ownership at every level

### Data Integrity

- Prevent orphaned tasks
- Ensure consistent journal assignments
- Validate all hierarchy operations

## Future Enhancements

### Phase 4: Advanced Features (Future)

- Drag-and-drop reorganization
- Bulk operations on hierarchies
- Template sub-tasks for recurring tasks
- Advanced filtering/sorting options
- Progress visualization for parent tasks

### Potential Improvements

- Time tracking inheritance
- Due date dependencies
- Automatic completion rules (configurable)
- Sub-task templates

## Success Metrics

### Functional Metrics

- All existing task functionality preserved
- Sub-tasks can be created, edited, deleted successfully
- Proper visual hierarchy displayed
- No circular references or orphaned tasks

### Performance Metrics

- Page load times remain under 2 seconds
- Database queries complete under 100ms
- No memory leaks in recursive operations

### User Experience Metrics

- Intuitive sub-task creation workflow
- Clear visual hierarchy
- Responsive design works on all devices
- Completion logic feels natural

## Implementation Checklist

### Database

- [x] Create migration V12\_\_add_task_hierarchy.sql
- [x] Add parent_task_id column
- [x] Add performance index
- [x] Test migration rollback

### Backend

- [x] Update Task model interfaces
- [x] Add repository methods for hierarchy
- [x] Add service layer validation
- [x] Add hierarchy query methods
- [x] Update existing CRUD operations

### Frontend

- [x] Update TaskForm with parent selection
- [x] Update TasksList with hierarchy display
- [x] Add "Add Sub-task" buttons
- [x] Update TaskItem component
- [x] Add completion logic prompts
- [x] Update all imports to use path aliases

### Testing

- [ ] Unit tests for hierarchy validation
- [ ] Integration tests for database queries
- [ ] E2E tests for user workflows
- [ ] Performance testing with large hierarchies

### Documentation

- [x] Update API documentation
- [x] Create user guide for sub-tasks
- [x] Update technical documentation

## Risk Mitigation

### Technical Risks

- **Performance**: Monitor query performance with large datasets
- **Complexity**: Keep UI simple and intuitive
- **Data Integrity**: Extensive validation and testing

### User Experience Risks

- **Confusion**: Clear visual indicators and help text
- **Overwhelm**: Limit depth and provide collapsible views
- **Migration**: Seamless transition for existing users

### Mitigation Strategies

- Feature flags for gradual rollout
- Comprehensive testing suite
- User feedback collection
- Performance monitoring
- Rollback plan if issues arise

---

_This document serves as the source of truth for the sub-tasks feature implementation. All code changes should align with this specification._
