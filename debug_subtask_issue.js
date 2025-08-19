// Debug script to identify subtask drag and drop issues
console.log('=== SUBTASK DRAG AND DROP DEBUG ===');

// Create a test app instance
const app = new SprintTodoApp();

// Clear existing data for clean testing
app.tasks = [];
app.sprints = [];
app.folders = [];

// Create test data
console.log('\n1. Creating test data...');

// Create a parent task
const parentTask = app.createTask({
    title: 'Parent Task',
    description: 'This is a parent task',
    points: 5,
    priority: 'high',
    folderId: null
});

console.log('Created parent task:', parentTask);

// Create a subtask
const subtask = app.createSubtask(parentTask.id, {
    title: 'Subtask 1',
    description: 'This is a subtask',
    points: 2,
    priority: 'medium'
});

console.log('Created subtask:', subtask);

// Create another subtask
const subtask2 = app.createSubtask(parentTask.id, {
    title: 'Subtask 2',
    description: 'This is another subtask',
    points: 1,
    priority: 'low'
});

console.log('Created subtask 2:', subtask2);

// Create another parent task for comparison
const parentTask2 = app.createTask({
    title: 'Another Parent Task',
    description: 'This is another parent task',
    points: 3,
    priority: 'medium',
    folderId: null
});

console.log('Created another parent task:', parentTask2);

console.log('\n2. Testing task array structure...');
console.log('Total tasks in array:', app.tasks.length);
console.log('Tasks in array:');
app.tasks.forEach((task, index) => {
    console.log(`  ${index}: ${task.title} (ID: ${task.id}, Parent: ${task.parentTaskId || 'none'}, Subtasks: ${task.subtasks ? task.subtasks.length : 0})`);
});

console.log('\n3. Testing getTasksAndSubtasksByFolder...');
const allTasks = app.getTasksAndSubtasksByFolder('all');
console.log('Tasks from getTasksAndSubtasksByFolder:', allTasks.length);
allTasks.forEach((task, index) => {
    console.log(`  ${index}: ${task.title} (ID: ${task.id}, Parent: ${task.parentTaskId || 'none'})`);
});

console.log('\n4. Testing renderTasks method...');
// Mock the DOM
document.getElementById = jest.fn().mockReturnValue({
    innerHTML: '',
    appendChild: jest.fn()
});

// Mock the DOM elements
document.querySelector = jest.fn().mockReturnValue({
    dataset: { folderId: 'all' },
    classList: { add: jest.fn(), remove: jest.fn() }
});

// Call renderTasks
app.renderTasks('all');

console.log('\n5. Testing drag and drop setup...');
const taskTableBody = {
    addEventListener: jest.fn(),
    querySelectorAll: jest.fn().mockReturnValue([])
};

// Mock document.getElementById
document.getElementById = jest.fn((id) => {
    if (id === 'task-table-body') {
        return taskTableBody;
    }
    return null;
});

// Setup drag and drop
app.setupBacklogTaskTableDragAndDrop();

console.log('\n6. Testing drag and drop simulation...');

// Simulate drag start
const dragStartEvent = {
    target: {
        closest: jest.fn().mockReturnValue({
            dataset: { taskId: subtask.id },
            classList: { contains: jest.fn().mockReturnValue(true) },
            add: jest.fn(),
            remove: jest.fn()
        }),
        outerHTML: '<div>Test row</div>'
    },
    dataTransfer: {
        effectAllowed: '',
        setData: jest.fn()
    }
};

// Simulate drag over
const dragOverEvent = {
    preventDefault: jest.fn(),
    dataTransfer: { dropEffect: '' },
    target: {
        closest: jest.fn().mockReturnValue({
            dataset: { taskId: parentTask.id },
            classList: { contains: jest.fn().mockReturnValue(false) },
            getBoundingClientRect: jest.fn().mockReturnValue({
                top: 100,
                height: 50
            }),
            add: jest.fn(),
            remove: jest.fn(),
            style: {}
        })
    },
    clientY: 120
};

// Simulate drop
const dropEvent = {
    preventDefault: jest.fn(),
    target: {
        closest: jest.fn().mockReturnValue({
            dataset: { taskId: parentTask.id },
            classList: { contains: jest.fn().mockReturnValue(false) },
            getBoundingClientRect: jest.fn().mockReturnValue({
                top: 100,
                height: 50
            })
        })
    },
    clientY: 120
};

// Test drag start
console.log('\nTesting drag start...');
taskTableBody.dispatchEvent(dragStartEvent);

console.log('Dragged element:', app.draggedElement);
console.log('Dragged task:', app.draggedTask);
console.log('Dragged index:', app.draggedIndex);

// Test drag over
console.log('\nTesting drag over...');
taskTableBody.dispatchEvent(dragOverEvent);

// Test drop
console.log('\nTesting drop...');
taskTableBody.dispatchEvent(dropEvent);

console.log('\n7. Testing reorderBacklogTasks...');
console.log('Before reordering:');
console.log('Tasks array:', app.tasks.map(t => t.title));

// Test reordering
app.reorderBacklogTasks(app.draggedTask, app.getTask(parentTask.id), true);

console.log('\nAfter reordering:');
console.log('Tasks array:', app.tasks.map(t => t.title));

console.log('\n8. Final state check...');
console.log('Total tasks:', app.tasks.length);
console.log('Tasks:');
app.tasks.forEach((task, index) => {
    console.log(`  ${index}: ${task.title} (ID: ${task.id}, Parent: ${task.parentTaskId || 'none'})`);
});

console.log('\n=== DEBUG COMPLETE ===');