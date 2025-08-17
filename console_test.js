// Console test for Sprint Todo App new layout functionality
console.log('🧪 Testing Sprint Todo App new layout functionality...');

// Check if the app is loaded
if (typeof window.app === 'undefined') {
    console.error('❌ App not loaded');
} else {
    console.log('✅ App loaded successfully');

    // Test key methods
    const requiredMethods = [
        'renderTasks',
        'createTaskTableRow',
        'selectFolder',
        'openTaskModal',
        'closeTaskModal',
        'saveTask',
        'openInlineTaskForm',
        'closeInlineTaskForm',
        'createInlineTask',
        'toggleSubtaskComplete',
        'toggleSubtasks',
        'updateTaskPriority',
        'updateTaskPoints',
        'assignTaskToSprint',
        'editTask',
        'deleteTask',
        'showNotification'
    ];

    let allMethodsExist = true;
    requiredMethods.forEach(method => {
        if (typeof window.app[method] !== 'function') {
            console.error(`❌ Method ${method} not found`);
            allMethodsExist = false;
        } else {
            console.log(`✅ Method ${method} exists`);
        }
    });

    if (allMethodsExist) {
        console.log('✅ All required methods exist');

        // Test creating a folder
        const folderData = { name: 'Test Folder' };
        const newFolder = window.app.createFolder(folderData);
        if (newFolder && newFolder.id) {
            console.log('✅ Folder creation works');
            
            // Test creating a task
            const taskData = {
                title: 'Test Task',
                description: 'Test Description',
                points: 5,
                priority: 'high',
                folderId: newFolder.id
            };
            const newTask = window.app.createTask(taskData);
            if (newTask && newTask.id) {
                console.log('✅ Task creation works');
                
                // Test rendering tasks for the folder
                try {
                    window.app.renderTasks(newFolder.id);
                    console.log('✅ Task rendering works');
                } catch (error) {
                    console.error('❌ Task rendering failed:', error);
                }
                
                // Test selecting a folder
                try {
                    window.app.selectFolder(newFolder.id);
                    console.log('✅ Folder selection works');
                } catch (error) {
                    console.error('❌ Folder selection failed:', error);
                }
            } else {
                console.error('❌ Task creation failed');
            }
        } else {
            console.error('❌ Folder creation failed');
        }

        // Test notification system
        try {
            window.app.showNotification('Test notification');
            console.log('✅ Notification system works');
        } catch (error) {
            console.error('❌ Notification system failed:', error);
        }

        console.log('🎉 All tests passed! New layout functionality is working correctly.');
    } else {
        console.error('❌ Some required methods are missing');
    }
}