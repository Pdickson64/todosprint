// Test script for subtask drag and drop functionality
document.addEventListener('DOMContentLoaded', function() {
    // Wait for the app to initialize
    setTimeout(() => {
        console.log('Starting subtask drag and drop test...');
        
        // Add debug logging to the app
        const originalSetupDragAndDrop = app.setupBacklogTaskTableDragAndDrop;
        app.setupBacklogTaskTableDragAndDrop = function() {
            console.log('🔧 setupBacklogTaskTableDragAndDrop called');
            const result = originalSetupDragAndDrop.call(this);
            console.log('✅ setupBacklogTaskTableDragAndDrop completed');
            return result;
        };
        
        // Override the reorderBacklogTasks method to add debugging
        const originalReorderBacklogTasks = app.reorderBacklogTasks;
        app.reorderBacklogTasks = function(draggedTaskId, targetTaskId, dropBefore) {
            console.log('🔄 reorderBacklogTasks called:', {
                draggedTaskId,
                targetTaskId,
                dropBefore
            });
            
            const result = originalReorderBacklogTasks.call(this, draggedTaskId, targetTaskId, dropBefore);
            console.log('✅ reorderBacklogTasks completed');
            return result;
        };
        
        // Test function to create sample tasks with subtasks
        window.createTestTasks = function() {
            console.log('📝 Creating test tasks...');
            
            // Clear existing tasks
            app.tasks = [];
            app.saveData();
            
            // Create parent task
            const parentTask = app.createTask({
                title: 'Parent Task 1',
                description: 'This is a parent task with subtasks',
                points: 5,
                priority: 'high',
                folderId: null
            });
            
            if (parentTask) {
                console.log('✅ Parent task created:', parentTask.id);
                
                // Create subtasks
                const subtask1 = app.createSubtask(parentTask.id, {
                    title: 'Subtask 1.1',
                    description: 'First subtask',
                    points: 2,
                    priority: 'medium'
                });
                
                const subtask2 = app.createSubtask(parentTask.id, {
                    title: 'Subtask 1.2',
                    description: 'Second subtask',
                    points: 3,
                    priority: 'high'
                });
                
                console.log('✅ Subtasks created:', subtask1.id, subtask2.id);
                
                // Create another parent task
                const parentTask2 = app.createTask({
                    title: 'Parent Task 2',
                    description: 'Another parent task',
                    points: 3,
                    priority: 'medium',
                    folderId: null
                });
                
                if (parentTask2) {
                    console.log('✅ Second parent task created:', parentTask2.id);
                    
                    // Create subtask for second parent
                    const subtask3 = app.createSubtask(parentTask2.id, {
                        title: 'Subtask 2.1',
                        description: 'Subtask for second parent',
                        points: 1,
                        priority: 'low'
                    });
                    
                    console.log('✅ Third subtask created:', subtask3.id);
                }
            }
            
            // Refresh the task table
            app.renderTasks('all');
            
            // Log the current task structure
            console.log('📊 Current task structure:');
            console.log('Parent tasks:', app.tasks.filter(t => !t.parentTaskId));
            console.log('Subtasks:', app.tasks.filter(t => t.parentTaskId));
        };
        
        // Clear debug log function
        window.clearDebugLog = function() {
            const debugLog = document.getElementById('debug-log');
            if (debugLog) {
                debugLog.textContent = 'Debug log cleared...\n';
            }
        };
        
        // Clear all tasks function
        window.clearAllTasks = function() {
            console.log('🗑️ Clearing all tasks...');
            app.tasks = [];
            app.saveData();
            app.renderTasks('all');
        };
        
        // Enhanced logging function
        function logToDebugPanel(message) {
            const debugLog = document.getElementById('debug-log');
            if (debugLog) {
                const timestamp = new Date().toLocaleTimeString();
                debugLog.textContent += `[${timestamp}] ${message}\n`;
                debugLog.scrollTop = debugLog.scrollHeight;
            }
        }
        
        // Override console.log to also log to debug panel
        const originalLog = console.log;
        console.log = function(...args) {
            originalLog.apply(console, args);
            logToDebugPanel(args.join(' '));
        };
        
        // Test drag and drop functionality
        function testDragAndDrop() {
            console.log('🧪 Testing drag and drop functionality...');
            
            // Wait for tasks to be rendered
            setTimeout(() => {
                const taskRows = document.querySelectorAll('.task-table-row');
                console.log(`Found ${taskRows.length} task rows`);
                
                if (taskRows.length >= 2) {
                    console.log('✅ Task rows found, testing drag and drop...');
                    
                    // Test drag start on first task
                    const firstTaskRow = taskRows[0];
                    if (firstTaskRow) {
                        console.log('Testing drag start on first task row');
                        firstTaskRow.draggable = true;
                        
                        // Simulate drag start
                        const dragStartEvent = new DragEvent('dragstart', {
                            bubbles: true,
                            cancelable: true,
                            dataTransfer: {
                                setData: function() {},
                                effectAllowed: 'move'
                            }
                        });
                        firstTaskRow.dispatchEvent(dragStartEvent);
                    }
                    
                    // Test drag over on second task
                    const secondTaskRow = taskRows[1];
                    if (secondTaskRow) {
                        console.log('Testing drag over on second task row');
                        
                        // Simulate drag over
                        const dragOverEvent = new DragEvent('dragover', {
                            bubbles: true,
                            cancelable: true,
                            dataTransfer: {
                                dropEffect: 'move'
                            }
                        });
                        secondTaskRow.dispatchEvent(dragOverEvent);
                    }
                    
                    // Test drop on second task
                    if (secondTaskRow) {
                        console.log('Testing drop on second task row');
                        
                        // Simulate drop
                        const dropEvent = new DragEvent('drop', {
                            bubbles: true,
                            cancelable: true,
                            clientX: secondTaskRow.getBoundingClientRect().left + 10,
                            clientY: secondTaskRow.getBoundingClientRect().top + 10
                        });
                        secondTaskRow.dispatchEvent(dropEvent);
                    }
                } else {
                    console.log('❌ No task rows found to test drag and drop');
                }
            }, 1000);
        }
        
        // Add test button for drag and drop
        const testButton = document.createElement('button');
        testButton.textContent = 'Test Drag & Drop';
        testButton.className = 'test-btn';
        testButton.onclick = testDragAndDrop;
        
        const testControls = document.querySelector('.test-controls');
        if (testControls) {
            testControls.appendChild(testButton);
        }
        
        console.log('✅ Test script loaded successfully');
        console.log('📝 Click "Create Test Tasks" to create sample tasks with subtasks');
        console.log('🧪 Click "Test Drag & Drop" to test the drag and drop functionality');
    }, 1000);
});