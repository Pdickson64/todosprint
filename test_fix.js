// Test script to verify the sprint board fix
// Load the app.js file first
const fs = require('fs');
const appCode = fs.readFileSync('app.js', 'utf8');
eval(appCode);

const app = new SprintTodoApp();

console.log('=== Testing Sprint Board Fix ===');

// Test 1: Create a sprint
console.log('\n1. Creating test sprint...');
const sprint = app.createSprint({
    name: 'Test Sprint',
    startDate: '2025-08-17',
    endDate: '2025-08-24',
    duration: 7
});
console.log('Created sprint:', sprint.name, '(ID:', sprint.id, ')');

// Test 2: Create a task and assign it to sprint
console.log('\n2. Creating test task...');
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

// Test 3: Set current sprint and test render logic
console.log('\n3. Setting current sprint...');
app.currentSprint = sprint;
console.log('Current sprint set to:', app.currentSprint.name);

// Test 4: Test getFlatTasksForSprintBoard
console.log('\n4. Testing getFlatTasksForSprintBoard...');
const flatTasks = app.getFlatTasksForSprintBoard(sprint.id);
console.log('Found', flatTasks.length, 'tasks for sprint board');
flatTasks.forEach((task, index) => {
    console.log(`Task ${index + 1}:`, task.title, '(Status:', task.status, ')');
});

// Test 5: Test assignTaskToSprint method directly
console.log('\n5. Testing assignTaskToSprint method...');
const newTask = app.createTask({
    title: 'Another Test Task',
    description: 'This will be assigned via assignTaskToSprint',
    points: 3,
    priority: 'medium'
});
console.log('Created new task:', newTask.title, '(Status:', newTask.status, ')');

app.assignTaskToSprint(newTask.id, sprint.id);
console.log('After assignment:');
console.log('Task sprint ID:', newTask.sprintId);
console.log('Task status:', newTask.status);

// Test 6: Check if task appears in sprint board
console.log('\n6. Checking if task appears in sprint board after assignment...');
const updatedFlatTasks = app.getFlatTasksForSprintBoard(sprint.id);
console.log('Found', updatedFlatTasks.length, 'tasks for sprint board');
updatedFlatTasks.forEach((task, index) => {
    console.log(`Task ${index + 1}:`, task.title, '(Status:', task.status, ')');
});

console.log('\n=== Test Complete ===');