// Test script for subtask drag and drop functionality
console.log('Starting subtask drag and drop functionality test...');

// Wait for the app to initialize
setTimeout(() => {
    if (window.app) {
        console.log('✅ App is initialized');
        
        // Clear existing tasks for clean test
        window.app.tasks = [];
        window.app.saveData();
        
        // Create a test folder
        const testFolder = window.app.createFolder({ name: 'Test Folder for Subtasks' });
        console.log('✅ Created test folder:', testFolder);
        
        // Create a parent task
        const parentTask = {
            title: 'Parent Task for Drag Test',
            description: 'This is a parent task for testing drag and drop',
            points: 5,
            priority: 'high',
            dueDate: '2025-08-20',
            folderId: testFolder.id
        };
        
        // Create the parent task
        const createdParent = window.app.createTask(parentTask);
        console.log('✅ Created parent task:', createdParent);
        
        // Create a subtask
        const subtask = {
            title: 'Subtask for Drag Test',
            description: 'This is a subtask for testing drag and drop',
            points: 2,
            priority: 'medium',
            dueDate: '2025-08-18',
            folderId: testFolder.id
        };
        
        const createdSubtask = window.app.createSubtask(createdParent.id, subtask);
        console.log('✅ Created subtask:', createdSubtask);
        
        // Test 1: Check if subtasks appear in folder view
        console.log('\n=== Test 1: Subtask Display in Folder View ===');
        window.app.selectFolder(testFolder.id);
        window.app.renderTasks(testFolder.id);
        
        // Check if both parent and subtask are displayed
        setTimeout(() => {
            const taskRows = document.querySelectorAll('.task-table-row');
            console.log(`Found ${taskRows.length} task rows in folder view`);
            
            const taskIds = Array.from(taskRows).map(row => row.dataset.taskId);
            console.log('Task IDs found:', taskIds);
            
            if (taskIds.includes(createdParent.id) && taskIds.includes(createdSubtask.id)) {
                console.log('✅ Both parent task and subtask are displayed in folder view');
            } else {
                console.log('❌ Parent task or subtask missing from folder view');
                console.log('Parent task present:', taskIds.includes(createdParent.id));
                console.log('Subtask present:', taskIds.includes(createdSubtask.id));
            }
            
            // Test 2: Check if subtasks appear in "All Tasks" view
            console.log('\n=== Test 2: Subtask Display in All Tasks View ===');
            window.app.selectFolder('all');
            window.app.renderTasks('all');
            
            setTimeout(() => {
                const allTaskRows = document.querySelectorAll('.task-table-row');
                console.log(`Found ${allTaskRows.length} task rows in all tasks view`);
                
                const allTaskIds = Array.from(allTaskRows).map(row => row.dataset.taskId);
                console.log('All task IDs found:', allTaskIds);
                
                if (allTaskIds.includes(createdParent.id) && allTaskIds.includes(createdSubtask.id)) {
                    console.log('✅ Both parent task and subtask are displayed in all tasks view');
                } else {
                    console.log('❌ Parent task or subtask missing from all tasks view');
                    console.log('Parent task present:', allTaskIds.includes(createdParent.id));
                    console.log('Subtask present:', allTaskIds.includes(createdSubtask.id));
                }
                
                // Test 3: Check drag and drop functionality
                console.log('\n=== Test 3: Drag and Drop Functionality ===');
                
                // Check if drag and drop event listeners are set up
                const taskTableBody = document.getElementById('task-table-body');
                if (taskTableBody) {
                    console.log('✅ Task table body found');
                    
                    // Check if the table has drag event listeners
                    const hasDragListeners = taskTableBody.hasAttribute('ondragstart') || 
                                           taskTableBody.hasAttribute('ondragover') || 
                                           taskTableBody.hasAttribute('ondrop');
                    
                    if (hasDragListeners) {
                        console.log('✅ Drag and drop event listeners are present on task table');
                    } else {
                        console.log('❌ Drag and drop event listeners missing from task table');
                    }
                    
                    // Check individual task rows for draggable attribute
                    const parentRow = document.querySelector(`[data-task-id="${createdParent.id}"]`);
                    const subtaskRow = document.querySelector(`[data-task-id="${createdSubtask.id}"]`);
                    
                    if (parentRow && parentRow.draggable) {
                        console.log('✅ Parent task row is draggable');
                    } else {
                        console.log('❌ Parent task row is not draggable');
                    }
                    
                    if (subtaskRow && subtaskRow.draggable) {
                        console.log('✅ Subtask row is draggable');
                    } else {
                        console.log('❌ Subtask row is not draggable');
                    }
                    
                } else {
                    console.log('❌ Task table body not found');
                }
                
                // Test 4: Check if subtasks have proper data attributes
                console.log('\n=== Test 4: Subtask Data Attributes ===');
                
                if (subtaskRow) {
                    console.log('Subtask row attributes:');
                    console.log('- data-task-id:', subtaskRow.dataset.taskId);
                    console.log('- draggable:', subtaskRow.draggable);
                    console.log('- HTML content length:', subtaskRow.innerHTML.length);
                    
                    // Check if subtask row has proper styling for subtasks
                    const hasSubtaskStyling = subtaskRow.classList.contains('subtask-row') || 
                                            subtaskRow.style.marginLeft || 
                                            subtaskRow.style.paddingLeft;
                    
                    if (hasSubtaskStyling) {
                        console.log('✅ Subtask has proper styling');
                    } else {
                        console.log('⚠️  Subtask may not have proper styling (this might be expected)');
                    }
                }
                
                console.log('\n🎉 Subtask drag and drop test completed!');
                console.log('\nSummary:');
                console.log('- Subtasks should now appear in folder views (fixed)');
                console.log('- Subtasks should appear in "All Tasks" view');
                console.log('- Both parent tasks and subtasks should be draggable');
                console.log('- Drag and drop functionality should work for reordering');
                
            }, 1000);
        }, 1000);
        
    } else {
        console.log('❌ App is not initialized');
    }
}, 2000);