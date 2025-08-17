// Test script for subtask functionality
console.log('Starting subtask functionality test...');

// Wait for the app to initialize
setTimeout(() => {
    if (window.app) {
        console.log('✅ App is initialized');
        
        // Clear existing tasks for clean test
        window.app.tasks = [];
        window.app.saveData();
        
        // Create a parent task
        const parentTask = {
            title: 'Parent Task Test',
            description: 'This is a parent task for testing',
            points: 5,
            priority: 'high',
            dueDate: '2025-08-20',
            folderId: 'work'
        };
        
        // Create the parent task
        const createdParent = window.app.createTask(parentTask);
        console.log('✅ Created parent task:', createdParent);
        
        // Create a subtask
        const subtask = {
            title: 'Subtask 1 Test',
            description: 'This is a subtask for testing',
            points: 2,
            priority: 'medium',
            dueDate: '2025-08-18',
            folderId: 'work'
        };
        
        const createdSubtask = window.app.createSubtask(createdParent.id, subtask);
        console.log('✅ Created subtask:', createdSubtask);
        
        // Create another subtask
        const subtask2 = {
            title: 'Subtask 2 Test',
            description: 'This is another subtask for testing',
            points: 3,
            priority: 'low',
            dueDate: '2025-08-19',
            folderId: 'work'
        };
        
        const createdSubtask2 = window.app.createSubtask(createdParent.id, subtask2);
        console.log('✅ Created subtask 2:', createdSubtask2);
        
        // Check if the parent task has subtasks
        const parentTaskData = window.app.getTask(createdParent.id);
        console.log('✅ Parent task data:', parentTaskData);
        
        // Check if subtasks are properly nested
        if (parentTaskData.subtasks && parentTaskData.subtasks.length > 0) {
            console.log('✅ Parent task has subtasks:', parentTaskData.subtasks);
        } else {
            console.log('❌ Parent task does not have subtasks');
        }
        
        // Test rendering tasks
        console.log('Testing task rendering...');
        window.app.renderTasks('work');
        console.log('✅ Rendered tasks for work folder');
        
        // Test toggle functionality
        if (parentTaskData.subtasks && parentTaskData.subtasks.length > 0) {
            console.log('Testing toggle functionality...');
            window.app.toggleSubtasks(createdParent.id);
            console.log('✅ Toggled subtasks for parent task');
            
            // Check if expanded state changed
            const updatedParentTask = window.app.getTask(createdParent.id);
            console.log('✅ Updated parent task expanded state:', updatedParentTask.expanded);
            
            // Toggle back
            window.app.toggleSubtasks(createdParent.id);
            console.log('✅ Toggled subtasks back');
        }
        
        // Test folder view
        console.log('Testing folder view...');
        window.app.renderTasks('all');
        console.log('✅ Rendered all tasks');
        
        console.log('🎉 Subtask functionality test completed successfully!');
        
    } else {
        console.log('❌ App is not initialized');
    }
}, 2000);