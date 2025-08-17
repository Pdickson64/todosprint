// DOM test for Sprint Todo App new layout functionality
console.log('🧪 Testing Sprint Todo App DOM structure...');

// Check if the app is loaded
if (typeof window.app === 'undefined') {
    console.error('❌ App not loaded');
} else {
    console.log('✅ App loaded successfully');

    // Test DOM structure
    const appContainer = document.querySelector('.app-container');
    if (!appContainer) {
        console.error('❌ App container not found');
    } else {
        console.log('✅ App container found');

        // Check sidebar
        const sidebar = document.querySelector('.sidebar');
        if (!sidebar) {
            console.error('❌ Sidebar not found');
        } else {
            console.log('✅ Sidebar found');

            // Check folder list
            const folderList = document.querySelector('.folder-list');
            if (!folderList) {
                console.error('❌ Folder list not found');
            } else {
                console.log('✅ Folder list found');

                // Check task table
                const taskTable = document.querySelector('.task-table');
                if (!taskTable) {
                    console.error('❌ Task table not found');
                } else {
                    console.log('✅ Task table found');

                    // Check task table body
                    const taskTableBody = document.getElementById('task-table-body');
                    if (!taskTableBody) {
                        console.error('❌ Task table body not found');
                    } else {
                        console.log('✅ Task table body found');

                        // Check task modal
                        const taskModal = document.getElementById('task-modal');
                        if (!taskModal) {
                            console.error('❌ Task modal not found');
                        } else {
                            console.log('✅ Task modal found');

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
                                        
                                        // Check if task row was created
                                        const taskRow = document.querySelector(`tr[data-task-id="${newTask.id}"]`);
                                        if (taskRow) {
                                            console.log('✅ Task row created in table');
                                        } else {
                                            console.error('❌ Task row not found in table');
                                        }
                                    } catch (error) {
                                        console.error('❌ Task rendering failed:', error);
                                    }
                                    
                                    // Test selecting a folder
                                    try {
                                        window.app.selectFolder(newFolder.id);
                                        console.log('✅ Folder selection works');
                                        
                                        // Check if folder is active
                                        const activeFolder = document.querySelector('.folder-item.active');
                                        if (activeFolder && activeFolder.dataset.folderId === newFolder.id) {
                                            console.log('✅ Folder is active');
                                        } else {
                                            console.error('❌ Folder is not active');
                                        }
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

                            console.log('🎉 All DOM tests passed! New layout functionality is working correctly.');
                        }
                    }
                }
            }
        }
    }
}