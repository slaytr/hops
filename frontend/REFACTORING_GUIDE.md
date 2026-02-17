# OperationsHub Refactoring Guide

## Overview
OperationsHub.vue is currently over 2600 lines with mixed business logic and presentation. This guide outlines how to split it into smaller, manageable pieces.

## Created Composables

### 1. `useTaskCalculations.ts`
Handles all task dimension and date calculations:
- `getTaskQuadrantWidth()` - Calculate task width
- `getTaskQuadrantOffset()` - Calculate horizontal position
- `getTaskDateRange()` - Get dates a task spans
- `getTasksInCell()` - Get all tasks overlapping with a date
- `formatDateISO()`, `isMultiDayTask()`, etc.

### 2. `useDragAndDrop.ts`
Manages drag & drop state and handlers:
- `draggedTask`, `dragPreview`, `pendingMove` - State refs
- `handleDragStart()`, `handleDrop()`, `handleDragEnd()` - Event handlers
- All drag-related logic in one place

### 3. `useTaskStacking.ts`
Handles task vertical positioning and stacking:
- `calculateTaskTracks()` - Assign vertical tracks to tasks
- `getTaskVerticalOffset()` - Calculate vertical position
- `calculateRowHeights()` - Calculate dynamic row heights

## How to Use in OperationsHub.vue

```vue
<script setup lang="ts">
import { useTaskCalculations } from '@/composables/useTaskCalculations'
import { useDragAndDrop } from '@/composables/useDragAndDrop'
import { useTaskStacking } from '@/composables/useTaskStacking'

const tasks = ref<HousekeepingTask[]>([])

// Use composables
const {
  getTaskQuadrantWidth,
  getTasksInCell,
  formatDateISO,
  quadrantToDateTime,
  getQuadrantFromDateTime,
  // ... other exports
} = useTaskCalculations(tasks)

const {
  draggedTask,
  dragPreview,
  pendingMove,
  handleDragStart,
  handleDrop,
  // ... other exports
} = useDragAndDrop(formatDateISO, quadrantToDateTime, getQuadrantFromDateTime)

const {
  getTaskVerticalOffset,
  calculateRowHeights,
  // ... other exports
} = useTaskStacking(tasks, getTasksInCell, getTaskDateRange)

// Rest of component logic...
</script>
```

## Further Refactoring Recommendations

### 1. Extract API Layer
Create `src/api/tasks.ts`:
```typescript
export async function fetchTasks(startDate: string, endDate: string) {
  const response = await fetch(`${API_URL}/tasks?startDate=${startDate}&endDate=${endDate}`)
  return response.json()
}

export async function updateTask(id: string, data: Partial<Task>) {
  const response = await fetch(`${API_URL}/tasks/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  })
  return response.json()
}
```

### 2. Split into Sub-Components
Break down the template:

- **CalendarHeader.vue** - Title and view selector
- **CalendarControls.vue** - Search, navigation, date picker
- **TaskActions.vue** - Task action buttons bar
- **TaskBlock.vue** - Individual task rendering
  ```vue
  <TaskBlock
    :task="task"
    :style="getTaskStyle(task, room.id, date)"
    @dragstart="handleDragStart($event, task, date)"
  />
  ```
- **AddTaskModal.vue** - Task creation modal
- **DateColumn.vue** - Reusable date column component

### 3. Create a Task Resize Composable
Extract `useTaskResize.ts`:
- `resizingTask`, `resizeEdge`, `resizePreview`
- `handleResizeStart()`, `handleResizeMove()`, `handleResizeEnd()`

### 4. Lazy Load Heavy Logic
For code that's not immediately needed:
```typescript
// Lazy load resize functionality
const { handleResizeStart, handleResizeEnd } = await import('./composables/useTaskResize')

// Lazy load modal
const AddTaskModal = defineAsyncComponent(() => import('./components/AddTaskModal.vue'))
```

### 5. Extract Utility Functions
Create `src/utils/dateFormatters.ts`:
```typescript
export function formatDateDisplay(date: Date): string {
  return date.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric'
  })
}

export function getDayName(date: Date): string {
  return date.toLocaleDateString('en-US', { weekday: 'short' }).toUpperCase()
}
```

## Benefits

1. **Maintainability** - Easier to find and update specific logic
2. **Testability** - Can unit test composables independently
3. **Reusability** - Composables can be used in other components
4. **Performance** - Lazy loading reduces initial bundle size
5. **Readability** - Main component focuses on orchestration, not implementation
6. **Collaboration** - Multiple developers can work on different composables

## Migration Strategy

1. **Phase 1** ✅ COMPLETE - Extract composables for calculations, drag & drop, stacking
   - Created `useTaskCalculations.ts`, `useDragAndDrop.ts`, `useTaskStacking.ts`

2. **Phase 2** ✅ COMPLETE - Extract API layer and utilities
   - Created `api/tasks.ts`, `api/rooms.ts`, `api/staff.ts`
   - Created `utils/dateFormatters.ts`
   - Created `composables/useTaskResize.ts`

3. **Phase 3** ✅ COMPLETE - Split into sub-components
   - ✅ Created `AddTaskModal.vue` (282 lines)
   - ✅ Created `TaskBlock.vue` (211 lines)
   - ✅ Created `CalendarHeader.vue` (138 lines)
   - ✅ Created `CalendarControls.vue` (286 lines)
   - ✅ Created `TaskActions.vue` (140 lines)
   - ✅ Created `CalendarLegend.vue` (99 lines)
   - ✅ Created `MoveConfirmButtons.vue` (84 lines)
   - ✅ Created `TaskPreview.vue` (169 lines) - Handles drag, move, and resize previews
   - ✅ Created `RoomColumn.vue` (104 lines)
   - ✅ Created `DateHeader.vue` (105 lines)

   **Remaining in OperationsHub.vue (1073 lines):**
   - Core calendar orchestration logic
   - Task positioning and rendering coordination
   - Drag & drop state management
   - Calendar navigation and scrolling
   - API data fetching and state management
   - Event handler coordination

4. **Phase 4** ✅ COMPLETE - Performance optimization
   - ✅ Extracted all preview rendering (TaskPreview handles drag/move/resize)
   - ✅ Lazy load heavy components (AddTaskModal using defineAsyncComponent)
   - 📋 Future: Add code splitting for routes (if needed)
   - 📋 Future: Optimize bundle size analysis

5. **Phase 5** - Testing & Documentation
   - Add unit tests for composables
   - Add component tests
   - Update component documentation
   - Add JSDoc comments for complex functions

## Progress

- **Original file size**: 2299 lines
- **Current file size**: 1075 lines
- **Reduction**: 1224 lines (53.2% smaller) 🎉
- **Files created**: 18 total
  - 4 composables: `useTaskCalculations`, `useDragAndDrop`, `useTaskStacking`, `useTaskResize`
  - 3 API modules: `api/tasks`, `api/rooms`, `api/staff`
  - 1 utility: `utils/dateFormatters`
  - 10 components: `AddTaskModal`, `TaskBlock`, `CalendarHeader`, `CalendarControls`, `TaskActions`, `CalendarLegend`, `MoveConfirmButtons`, `TaskPreview`, `RoomColumn`, `DateHeader`

## Refactoring Summary

### What Was Extracted
✅ **Business Logic** → Composables (calculations, drag & drop, stacking, resizing)
✅ **API Calls** → Dedicated API modules
✅ **Date Utilities** → Shared utility functions
✅ **UI Components** → 10 focused, reusable components
✅ **Preview Rendering** → Unified TaskPreview component
✅ **Performance** → Lazy loading for heavy modals

### What Remains in OperationsHub.vue
The core orchestration logic that ties everything together:
- Calendar state management (dates, rooms, tasks)
- Event handler coordination (drag, drop, resize, scroll)
- Task positioning calculations and rendering coordination
- Calendar navigation and scrolling logic
- Component composition and layout

This is appropriate as the main component's responsibility is to orchestrate the interaction between all the extracted pieces.

## Testing

Each composable can be tested independently:
```typescript
import { describe, it, expect } from 'vitest'
import { useTaskCalculations } from './useTaskCalculations'

describe('useTaskCalculations', () => {
  it('calculates task width correctly', () => {
    const tasks = ref([])
    const { getTaskQuadrantWidth } = useTaskCalculations(tasks)

    const task = {
      startDateTime: '2026-02-16T06:00:00Z',
      endDateTime: '2026-02-16T12:00:00Z'
    }

    expect(getTaskQuadrantWidth(task)).toBe(50) // 2 quadrants
  })
})
```

## Completion Status

🎉 **Refactoring Complete!** All major phases (1-4) are finished.

### Achievements
- **53.2% size reduction** (2299 → 1075 lines)
- **18 new files** extracted with clear responsibilities
- **Improved maintainability** through separation of concerns
- **Better testability** with isolated composables and components
- **Performance optimized** with lazy loading

### Future Enhancements (Phase 5 - Optional)
If needed in the future:
1. Add unit tests for composables (using Vitest)
2. Add component tests for complex interactions
3. Add JSDoc comments for complex functions
4. Measure and optimize bundle size with Vite's build analyzer
5. Consider code splitting if new routes are added

### Maintenance Guidelines
- ✅ Keep new UI features as separate components
- ✅ Add new calculations to appropriate composables
- ✅ Maintain the API layer for backend communication
- ✅ Use the utility functions for date formatting
- ✅ OperationsHub.vue should only orchestrate, not implement details
