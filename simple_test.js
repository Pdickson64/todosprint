// Simple test to verify the sprint board fix without DOM dependencies
console.log('=== Testing Sprint Board Fix (Simple) ===');

// Mock localStorage for testing
const mockLocalStorage = {
    data: {},
    getItem: function(key) { return this.data[key] || null; },
    setItem: function(key, value) { this.data[key] = value; },
    removeItem: function(key) { delete this.data[key]; }
};

// Mock document object
const mockDocument = {
    getElementById: function(id) { return null; }
};

// Set up global objects that app.js expects
global.localStorage = mockLocalStorage;
global.document = mockDocument;

// Load and execute the app.js code
const fs = require('fs');
const appCode = fs.readFileSync('app.js', 'utf8');

// Remove DOM event listeners to avoid errors
const cleanCode = appCode.replace(/document\.addEventListener\(['"]DOMContentLoaded['"].*?\n.*?\}/gs, '');

// Execute the cleaned code
eval(cleanCode);

// Create app instance
const app = new SprintTodoApp();

console.log('\n1. Creating test sprint...');
const sprint = app.createSprint({
    name: 'Test Sprint',
    startDate: '2025-08-17',
    endDate: '2025-08-24',
    duration: 7
});
console.log('Created sprint:', sprint.name, '(ID:', sprint.id, ')');

console.log('\n2. Creating test task with sprint assignment...');
const task = app.createTask({
    title: 'Test Task for Sprint',
    description: 'This should appear on sprint board',
    points: 5,
    priority: 'high',
    sprintId: sprint.id
});
console.log('Created task:', task.title);
console.log('Task sprint ID:', task.sprintId);
console.log('Task status:', task.status);

console.log('\n3. Setting current sprint...');
app.currentSprint = sprint;
console.log('Current sprint set to:', app.currentSprint.name);

console.log('\n4. Testing getFlatTasksForSprintBoard...');
const flatTasks = app.getFlatTasksForSprintBoard(sprint.id);
console.log('Found', flatTasks.length, 'tasks for sprint board');
flatTasks.forEach((task, index) => {
    console.log(`Task ${index + 1}:`, task.title, '(Status:', task.status, ')');
});

console.log('\n5. Testing assignTaskToSprint method...');
const newTask = app.createTask({
    title: 'Another Test Task',
    description: 'This will be assigned via assignTaskToSprint',
    points: 3,
    priority: 'medium'
});
console.log('Created new task:', newTask.title, '(Status:', newTask.status, ')');

// Mock the sprint selector
const mockSprintSelector = {
    value: sprint.id
};
mockDocument.getElementById = function(id) {
    if (id === 'sprint-selector') return mockSprintSelector;
    return null;
};

app.assignTaskToSprint(newTask.id, sprint.id);
console.log('After assignment:');
console.log('Task sprint ID:', newTask.sprintId);
console.log('Task status:', newTask.status);
console.log('Current sprint:', app.currentSprint ? app.currentSprint.name : 'None');

console.log('\n6. Checking if task appears in sprint board after assignment...');
const updatedFlatTasks = app.getFlatTasksForSprintBoard(sprint.id);
console.log('Found', updatedFlatTasks.length, 'tasks for sprint board');
updatedFlatTasks.forEach((task, index) => {
    console.log(`Task ${index + 1}:`, task.title, '(Status:', task.status, ')');
});

console.log('\n=== Test Complete ===');