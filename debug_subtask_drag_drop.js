// Debug script to test subtask drag and drop functionality
console.log('=== Subtask Drag and Drop Debug Script ===');

// Wait for the app to initialize
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM loaded, checking app...');
    
    // Check if app exists
    if (!window.app) {
        console.error('App not found!');
        return;
    }
    
    console.log('App found:', window.app);
    
    // Create test data with subtasks
    console.log('Creating test data...');
    
    // Create a parent task
    const parentTask = window.app.createTask({
        title: 'Parent Task for Testing',
        description: 'This is a parent task with subtasks',
        points: 5,
        priority: 'high'
    });
    
    console.log('Created parent task:', parentTask);
    
    // Create subtasks
    const subtask1 = window.app.createSubtask(parentTask.id, {
        title: 'Subtask 1',
        description: 'First subtask',
        points: 2,
        priority: 'medium'
    });
    
    const subtask2 = window.app.createSubtask(parentTask.id, {
        title: 'Subtask 2', 
        description: 'Second subtask',
        points: 3,
        priority: 'low'
    });
    
    console.log('Created subtasks:', { subtask1, subtask2 });
    
    // Switch to backlog view
    console.log('Switching to backlog view...');
    window.app.switchView('backlog');
    
    // Check if tasks are rendered
    setTimeout(() => {
        const taskTableBody = document.getElementById('task-table-body');
        console.log('Task table body:', taskTableBody);
        
        if (taskTableBody) {
            const taskRows = taskTableBody.querySelectorAll('.task-table-row');
            console.log('Task rows found:', taskRows.length);
            
            taskRows.forEach((row, index) => {
                console.log(`Row ${index}:`, {
                    taskId: row.dataset.taskId,
                    isSubtask: row.classList.contains('subtask-row'),
                    parentTaskId: row.dataset.parentTaskId,
                    draggable: row.draggable,
                    html: row.outerHTML.substring(0, 200)
                });
            });
            
            // Test drag and drop setup
            console.log('Testing drag and drop setup...');
            const setupMethod = window.app.setupBacklogTaskTableDragAndDrop;
            if (setupMethod) {
                console.log('Drag and drop method exists');
                // Call it to ensure it's set up
                setupMethod();
                console.log('Drag and drop setup completed');
            } else {
                console.error('Drag and drop method not found!');
            }
            
            // Test drag events
            console.log('Testing drag events...');
            taskRows.forEach((row, index) => {
                if (row.draggable) {
                    console.log(`Row ${index} is draggable, testing drag start...`);
                    
                    // Simulate drag start
                    const dragStartEvent = new DragEvent('dragstart', {
                        bubbles: true,
                        cancelable: true,
                        dataTransfer: {
                            effectAllowed: 'move',
                            setData: function() { console.log('Data set for row:', row.dataset.taskId); }
                        }
                    });
                    
                    // Dispatch the event
                    row.dispatchEvent(dragStartEvent);
                    
                    // Check if app state was updated
                    console.log('App state after drag start:', {
                        draggedElement: window.app.draggedElement,
                        draggedTask: window.app.draggedTask,
                        draggedIndex: window.app.draggedIndex
                    });
                }
            });
            
        } else {
            console.error('Task table body not found!');
        }
    }, 1000);
});

// Add event listeners to monitor drag and drop events
document.addEventListener('dragstart', function(e) {
    console.log('Global dragstart:', {
        target: e.target,
        taskId: e.target.closest('.task-table-row')?.dataset.taskId,
        isSubtask: e.target.closest('.task-table-row')?.classList.contains('subtask-row')
    });
});

document.addEventListener('dragend', function(e) {
    console.log('Global dragend:', {
        target: e.target,
        taskId: e.target.closest('.task-table-row')?.dataset.taskId
    });
});

document.addEventListener('drop', function(e) {
    console.log('Global drop:', {
        target: e.target,
        taskId: e.target.closest('.task-table-row')?.dataset.taskId,
        parentTaskId: e.target.closest('.task-table-row')?.dataset.parentTaskId
    });
});