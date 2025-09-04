// Sprint Todo App - Main Application JavaScript
// Updated: 2025-08-14 14:31 - Fixed subtask display duplication issue
// forcing update to github
function SprintTodoApp() {
    if (!(this instanceof SprintTodoApp)) {
        return new SprintTodoApp();
    }
        this.tasks = [];
        this.sprints = [];
        this.folders = [];
        this.folderStates = {}; // { [folderId]: true|false }  true = collapsed
        this.currentView = 'backlog';
        this.currentSprint = null;
        this.draggedElement = null;
        this.draggedTask = null;
        this.draggedIndex = -1;
        
        // Chart instances
        this.burnupChart = null;
        this.burndownChart = null;
        this.velocityChart = null;
        
        // Board statuses
        this.boardStatuses = [];
        this.folderStates = {}; // { [folderId]: true (collapsed) | false (expanded) }

        
        // Initialize the app
        this.init();
    }

    SprintTodoApp.prototype.init = function() {
        // Load data from localStorage
        this.loadData();
        
        // Set up event listeners
        this.setupEventListeners();
        
        // Add event listener for create folder button
        const createFolderBtn = document.getElementById('create-folder-btn');
        if (createFolderBtn) {
            createFolderBtn.addEventListener('click', () => {
                this.showCreateFolderDialog();
            });
        }
        
        // Add event listeners for subtask collapse/expand buttons
        const expandAllSubtasksBtn = document.getElementById('expand-all-subtasks-btn');
        if (expandAllSubtasksBtn) {
            expandAllSubtasksBtn.addEventListener('click', () => {
                this.expandAllSubtasks();
            });
        }
        
        const collapseAllSubtasksBtn = document.getElementById('collapse-all-subtasks-btn');
        if (collapseAllSubtasksBtn) {
            collapseAllSubtasksBtn.addEventListener('click', () => {
                this.collapseAllSubtasks();
            });
        }
        
        // Add event listeners for task creation buttons
        const addTaskBtn = document.getElementById('add-task-btn');
        if (addTaskBtn) {
            addTaskBtn.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                console.log('Add Task button clicked');
                this.openTaskModal();
            });
        }
        
        const addToBacklogBtn = document.getElementById('add-to-backlog-btn');
        if (addToBacklogBtn) {
            addToBacklogBtn.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                console.log('Add to Backlog button clicked');
                this.openTaskModal();
            });
        }
        
        const addToFolderBtn = document.getElementById('add-task-to-folder-btn');
        if (addToFolderBtn) {
            addToFolderBtn.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                console.log('Add to Folder button clicked');
                
                // Get the currently selected folder
                const activeFolder = document.querySelector('.folder-item.active');
                const folderId = activeFolder ? activeFolder.dataset.folderId : null;
                
                // Open task modal with folder pre-selected
                this.openTaskModal({ folderId: folderId });
            });
        }
        
        // Add event listener for add task to sprint button
        const addTaskToSprintBtn = document.getElementById('add-task-to-sprint-btn');
        if (addTaskToSprintBtn) {
            addTaskToSprintBtn.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                console.log('Add Task to Sprint button clicked');
                
                // Get the currently selected sprint
                const currentSprintId = this.currentSprint ? this.currentSprint.id :
                    document.getElementById('sprint-selector').value;
                
                // Open task modal with sprint pre-selected
                this.openTaskModal({ sprintId: currentSprintId });
            });
        }
        
        // Inline task form submission is handled in setupEventListeners() to avoid duplication
        
        // Task modal form submission is handled in setupEventListeners() to avoid duplication
        
        // Set up event delegation for dynamic elements
        this.setupEventDelegation();
        
        // Initialize the UI
        this.render();
        
        // Set up drag and drop
        this.setupDragAndDrop();
        
        // Set up backlog drag and drop for task table
        this.setupBacklogTaskTableDragAndDrop();
        
        // Set up context menu
        this.setupContextMenu();
    }

    // Event Delegation
    SprintTodoApp.prototype.setupEventDelegation = function() {
        // Handle toggle subtasks button clicks
        document.addEventListener('click', (e) => {
            const toggleBtn = e.target.closest('.btn-toggle-subtasks');
            if (toggleBtn) {
                console.log('Toggle button clicked:', toggleBtn);
                e.preventDefault();
                e.stopPropagation();
                const taskElement = e.target.closest('.task-item');
                if (taskElement) {
                    console.log('Task element found:', taskElement);
                    const taskId = taskElement.dataset.taskId;
                    console.log('Task ID:', taskId);
                    if (taskId) {
                        this.toggleSubtasks(taskId);
                    }
                }
            }
        });
    }

    // Data Management
    SprintTodoApp.prototype.loadData = function() {
        const savedTasks = localStorage.getItem('sprint-todo-tasks');
        const savedSprints = localStorage.getItem('sprint-todo-sprints');
        const savedFolders = localStorage.getItem('sprint-todo-folders');
        const savedBoardStatuses = localStorage.getItem('sprint-todo-board-statuses');
        const savedFolderStates = localStorage.getItem('sprint-todo-folder-states');
        this.folderStates = savedFolderStates ? JSON.parse(savedFolderStates) : {};
        
        if (savedTasks) {
            this.tasks = JSON.parse(savedTasks);
        }
        
        if (savedSprints) {
            this.sprints = JSON.parse(savedSprints);
        }
        
        if (savedFolders) {
            this.folders = JSON.parse(savedFolders);
        }
        
        if (savedBoardStatuses) {
            this.boardStatuses = JSON.parse(savedBoardStatuses);
        } else {
            // Load default statuses if none saved
            this.boardStatuses = this.getDefaultBoardStatuses();
        }
        
        console.log('Board statuses loaded:', this.boardStatuses);
    }
    
    SprintTodoApp.prototype.getDefaultBoardStatuses = function() {
        const defaultStatuses = [
            { id: 'todo', name: 'To Do', color: '#6c757d' },
            { id: 'in-progress', name: 'In Progress', color: '#007bff' },
            { id: 'review', name: 'Review', color: '#ffc107' },
            { id: 'done', name: 'Done', color: '#28a745' }
        ];
        console.log('Default board statuses:', defaultStatuses);
        return defaultStatuses;
    }
    
    SprintTodoApp.prototype.getBoardStatuses = function() {
        console.log('getBoardStatuses called, returning:', this.boardStatuses);
        console.log('Board statuses array length:', this.boardStatuses.length);
        this.boardStatuses.forEach((status, index) => {
            console.log(`Status ${index}:`, status);
        });
        return this.boardStatuses;
    }

    SprintTodoApp.prototype.saveData = function() {
        localStorage.setItem('sprint-todo-tasks', JSON.stringify(this.tasks));
        localStorage.setItem('sprint-todo-sprints', JSON.stringify(this.sprints));
        localStorage.setItem('sprint-todo-folders', JSON.stringify(this.folders));
        localStorage.setItem('sprint-todo-board-statuses', JSON.stringify(this.boardStatuses));
        localStorage.setItem('sprint-todo-folder-states', JSON.stringify(this.folderStates));
        
    }

    // Task Management
    SprintTodoApp.prototype.createTask = function(taskData) {
        // Check if a task with the same title already exists to prevent duplicates
        const existingTask = this.tasks.find(task =>
            task.title === taskData.title &&
            task.folderId === (taskData.folderId || null) &&
            task.sprintId === (taskData.sprintId || null)
        );
        
        if (existingTask) {
            this.showNotification('A task with this title already exists in this location.', 'warning');
            return null;
        }
        
        // Set initial status based on whether task is assigned to a sprint
        const initialStatus = taskData.sprintId ? 'todo' : 'backlog';
        
        const task = {
            id: Date.now().toString(),
            title: taskData.title,
            description: taskData.description || '',
            points: taskData.points || 1,
            priority: taskData.priority || 'medium',
            dueDate: taskData.dueDate || null,
            sprintId: taskData.sprintId || null,
            folderId: taskData.folderId || null,
            status: initialStatus,
            subtasks: [],
            recurring: taskData.recurring || false,
            recurringType: taskData.recurringType || null,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            activityLog: []
        };
        
        this.tasks.push(task);
        this.saveData();
        
        // Refresh the task table if we're in backlog view
        if (this.currentView === 'backlog') {
            const activeFolder = document.querySelector('.folder-item.active');
            if (activeFolder) {
                const folderId = activeFolder.dataset.folderId || 'all';
                this.renderTasks(folderId);
            }
        }
        
        return task;
    }

    SprintTodoApp.prototype.createSubtask = function(parentTaskId, subtaskData) {
        const parentTask = this.getTask(parentTaskId);
        if (!parentTask) return null;
        
        // Set initial status based on whether subtask is assigned to a sprint
        const initialStatus = subtaskData.sprintId ? 'todo' : 'backlog';
        
        // Create a subtask reference (not a full task)
        const subtask = {
            id: Date.now().toString(),
            title: subtaskData.title,
            description: subtaskData.description || '',
            points: subtaskData.points || 1,
            priority: subtaskData.priority || 'medium',
            dueDate: subtaskData.dueDate || null,
            sprintId: subtaskData.sprintId || null,
            folderId: subtaskData.folderId || parentTask.folderId,
            status: initialStatus,
            subtasks: [],
            recurring: subtaskData.recurring || false,
            recurringType: subtaskData.recurringType || null,
            completed: false,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            activityLog: [],
            isSubtask: true,
            parentTaskId: parentTaskId
        };
        
        // Add to main tasks array for independent management
        this.tasks.push(subtask);
        
        // Also add to parent's subtasks array for hierarchy display
        parentTask.subtasks.push({
            id: subtask.id,
            title: subtask.title,
            completed: false
        });
        
        parentTask.updatedAt = new Date().toISOString();
        
        this.saveData();
        
        // Refresh the task table if we're in backlog view
        if (this.currentView === 'backlog') {
            const activeFolder = document.querySelector('.folder-item.active');
            if (activeFolder) {
                const folderId = activeFolder.dataset.folderId || 'all';
                this.renderTasks(folderId);
            }
        }
        
        return subtask;
    }

    SprintTodoApp.prototype.updateSubtask = function(parentTaskId, subtaskId, updates) {
        // Find the subtask in the main tasks array
        const subtask = this.getTask(subtaskId);
        if (!subtask) return null;
        
        // Update the subtask with all properties
        this.updateTask(subtaskId, updates);
        
        // Also update the parent's subtask reference
        const parentTask = this.getTask(parentTaskId);
        if (parentTask) {
            const subtaskRefIndex = parentTask.subtasks.findIndex(st => st.id === subtaskId);
            if (subtaskRefIndex !== -1) {
                parentTask.subtasks[subtaskRefIndex] = {
                    ...parentTask.subtasks[subtaskRefIndex],
                    ...updates
                };
                parentTask.updatedAt = new Date().toISOString();
            }
        }
        
        // Refresh the task table if we're in backlog view
        if (this.currentView === 'backlog') {
            const activeFolder = document.querySelector('.folder-item.active');
            if (activeFolder) {
                const folderId = activeFolder.dataset.folderId || 'all';
                this.renderTasks(folderId);
            }
        }
        
        return subtask;
    }

    SprintTodoApp.prototype.deleteSubtask = function(parentTaskId, subtaskId) {
        // Remove from main tasks array
        this.tasks = this.tasks.filter(t => t.id !== subtaskId);
        
        // Remove from parent's subtasks array
        const parentTask = this.getTask(parentTaskId);
        if (parentTask) {
            parentTask.subtasks = parentTask.subtasks.filter(st => st.id !== subtaskId);
            parentTask.updatedAt = new Date().toISOString();
        }
        
        this.saveData();
        
        // Refresh the task table if we're in backlog view
        if (this.currentView === 'backlog') {
            const activeFolder = document.querySelector('.folder-item.active');
            if (activeFolder) {
                const folderId = activeFolder.dataset.folderId || 'all';
                this.renderTasks(folderId);
            }
        }
        
        return true;
    }

    SprintTodoApp.prototype.toggleSubtaskComplete = function(parentTaskId, subtaskId) {
        const subtask = this.getSubtask(parentTaskId, subtaskId);
        if (subtask) {
            this.updateSubtask(parentTaskId, subtaskId, { completed: !subtask.completed });
            
            // Refresh the task table if we're in backlog view
            if (this.currentView === 'backlog') {
                const activeFolder = document.querySelector('.folder-item.active');
                if (activeFolder) {
                    const folderId = activeFolder.dataset.folderId || 'all';
                    this.renderTasks(folderId);
                }
            }
            
            return true;
        }
        return false;
    }

    SprintTodoApp.prototype.getSubtask = function(parentTaskId, subtaskId) {
        // Find the subtask in the main tasks array
        return this.getTask(subtaskId);
    }

    SprintTodoApp.prototype.getAllSubtasks = function(parentTaskId, includeNested) {
        includeNested = includeNested !== false;
        const parentTask = this.getTask(parentTaskId);
        if (!parentTask) return [];
        
        // Get direct subtasks from parent's subtasks array
        const directSubtasks = parentTask.subtasks || [];
        
        if (!includeNested) {
            return directSubtasks.map(subtask => this.getTask(subtask.id)).filter(Boolean);
        }
        
        // Get all nested subtasks recursively
        const allSubtasks = [];
        directSubtasks.forEach(subtask => {
            const fullSubtask = this.getTask(subtask.id);
            if (fullSubtask) {
                allSubtasks.push(fullSubtask);
                const nestedSubtasks = this.getAllSubtasks(fullSubtask.id, true);
                allSubtasks.push(...nestedSubtasks);
            }
        });
        
        return allSubtasks;
    }

    // Add method to get all tasks (including subtasks) for a sprint
    SprintTodoApp.prototype.getTasksAndSubtasksBySprint = function(sprintId) {
        const mainTasks = this.getTasksBySprint(sprintId);
        const allTasks = [...mainTasks];
        
        // Add all subtasks of these tasks
        mainTasks.forEach(task => {
            const subtasks = this.getAllSubtasks(task.id, true);
            allTasks.push(...subtasks);
        });
        
        return allTasks;
    }
    
    // Add method to get all tasks as flat list for sprint boards (no subtask nesting)
    SprintTodoApp.prototype.getFlatTasksForSprintBoard = function(sprintId) {
        console.log('getFlatTasksForSprintBoard called with sprintId:', sprintId);
        
        const mainTasks = this.getTasksBySprint(sprintId);
        console.log('Main tasks found by sprint:', mainTasks.length);
        console.log('Main tasks:', mainTasks.map(t => ({ id: t.id, title: t.title, status: t.status, sprintId: t.sprintId })));
        
        const allTasks = [];
        
        // Add main tasks and their subtasks as individual items
        mainTasks.forEach(task => {
            // Add the main task
            allTasks.push(task);
            console.log('Added main task:', task.id, task.title, 'with status:', task.status);
            
            // Add subtasks as individual tasks (flattened) - ONLY if they belong to the same sprint
            if (task.subtasks && task.subtasks.length > 0) {
                task.subtasks.forEach(subtask => {
                    // Find the full subtask data from main tasks array
                    const fullSubtask = this.getTask(subtask.id);
                    if (fullSubtask && fullSubtask.sprintId === sprintId) {
                        // Create a copy to avoid modifying the original
                        const subtaskCopy = { ...fullSubtask };
                        // Mark it as a subtask for display purposes
                        subtaskCopy.isSubtask = true;
                        subtaskCopy.parentId = task.id;
                        allTasks.push(subtaskCopy);
                        console.log('Added subtask:', subtaskCopy.id, subtaskCopy.title, 'with status:', subtaskCopy.status);
                    }
                });
            }
        });
        
        console.log('Total tasks returned:', allTasks.length);
        console.log('All tasks with statuses:', allTasks.map(t => ({ id: t.id, title: t.title, status: t.status })));
        
        return allTasks;
    }

    // Add method to get all tasks (including subtasks) for a folder
    SprintTodoApp.prototype.getTasksAndSubtasksByFolder = function(folderId) {
        // Get all tasks for the folder
        const folderTasks = this.getTasksByFolder(folderId);
        
        // Filter out completed tasks, but include both parent tasks and subtasks
        const activeTasks = folderTasks.filter(task => task.status !== 'done');
        
        return activeTasks;
    }
    
    // Add method to get only parent tasks for a folder (no subtask handling)
    SprintTodoApp.prototype.getParentTasksForFolder = function(folderId) {
        // Get all tasks for the folder
        const folderTasks = this.getTasksByFolder(folderId);
        
        // Filter out subtasks (tasks that have a parentTaskId) and completed tasks
        const parentTasks = folderTasks.filter(task => !task.parentTaskId && task.status !== 'done');
        
        return parentTasks;
    }
    

    SprintTodoApp.prototype.updateTask = function(taskId, updates) {
        console.log('updateTask called:', { taskId, updates });
        const taskIndex = this.tasks.findIndex(t => t.id === taskId);
        if (taskIndex !== -1) {
            const oldTask = { ...this.tasks[taskIndex] };
            this.tasks[taskIndex] = {
                ...this.tasks[taskIndex],
                ...updates,
                updatedAt: new Date().toISOString()
            };
            
            console.log('Task updated in array:', { oldTask, newTask: this.tasks[taskIndex] });
            console.log('Task object reference check - should match:', this.tasks[taskIndex] === this.getTask(taskId));
            
            // Add to activity log
            if (updates.comment) {
                this.tasks[taskIndex].activityLog.push({
                    timestamp: new Date().toISOString(),
                    comment: updates.comment
                });
            }
            
            this.saveData();
            
            // Refresh the task table if we're in backlog view
            if (this.currentView === 'backlog') {
                const activeFolder = document.querySelector('.folder-item.active');
                if (activeFolder) {
                    const folderId = activeFolder.dataset.folderId || 'all';
                    this.renderTasks(folderId);
                }
            }
            
            return this.tasks[taskIndex];
        }
        console.error('Task not found for update:', taskId);
        return null;
    }


    SprintTodoApp.prototype.getTask = function(taskId) {
        return this.tasks.find(t => t.id === taskId);
    }

    SprintTodoApp.prototype.getTasksByFolder = function(folderId) {
        return this.tasks.filter(t => t.folderId === folderId);
    }

    SprintTodoApp.prototype.getTasksBySprint = function(sprintId) {
        return this.tasks.filter(t => t.sprintId === sprintId);
    }

    // Sprint Management
    SprintTodoApp.prototype.createSprint = function(sprintData) {
        const sprint = {
            id: Date.now().toString(),
            name: sprintData.name,
            startDate: sprintData.startDate,
            endDate: sprintData.endDate,
            duration: sprintData.duration,
            status: 'upcoming', // upcoming, active, completed
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };
        
        this.sprints.push(sprint);
        this.saveData();
        return sprint;
    }

    SprintTodoApp.prototype.updateSprint = function(sprintId, updates) {
        const sprintIndex = this.sprints.findIndex(s => s.id === sprintId);
        if (sprintIndex !== -1) {
            this.sprints[sprintIndex] = {
                ...this.sprints[sprintIndex],
                ...updates,
                updatedAt: new Date().toISOString()
            };
            this.saveData();
            return this.sprints[sprintIndex];
        }
        return null;
    }

    SprintTodoApp.prototype.deleteSprint = function(sprintId) {
        // Move tasks from this sprint to backlog
        this.tasks.forEach(task => {
            if (task.sprintId === sprintId) {
                task.sprintId = null;
                task.status = 'backlog';
            }
        });
        
        this.sprints = this.sprints.filter(s => s.id !== sprintId);
        this.saveData();
    }

    SprintTodoApp.prototype.getSprint = function(sprintId) {
        return this.sprints.find(s => s.id === sprintId);
    }

    SprintTodoApp.prototype.getCurrentSprint = function() {
        return this.sprints.find(s => s.status === 'active');
    }

    // Folder Management
    SprintTodoApp.prototype.createFolder = function(folderData) {
        const folder = {
            id: Date.now().toString(),
            name: folderData.name,
            description: folderData.description || '',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };
        
        this.folders.push(folder);
         // NEW: default to expanded
        this.folderStates[folder.id] = false;
        this.saveData();
        
        // Refresh the folder sidebar if we're in backlog view
        if (this.currentView === 'backlog') {
            this.renderFolders();
        }
        
        return folder;
    }

    SprintTodoApp.prototype.updateFolder = function(folderId, updates) {
        const folderIndex = this.folders.findIndex(f => f.id === folderId);
        if (folderIndex !== -1) {
            this.folders[folderIndex] = {
                ...this.folders[folderIndex],
                ...updates,
                updatedAt: new Date().toISOString()
            };
            this.saveData();
            
            // Refresh the folder sidebar if we're in backlog view
            if (this.currentView === 'backlog') {
                this.renderFolders();
            }
            
            return this.folders[folderIndex];
        }
        return null;
    }

    SprintTodoApp.prototype.deleteFolder = function(folderId) {
        // Move tasks from this folder to backlog
        this.tasks.forEach(task => {
            if (task.folderId === folderId) {
                task.folderId = null;
            }
        });
        
        this.folders = this.folders.filter(f => f.id !== folderId);
        this.saveData();

        // NEW: forget its persisted collapsed state
        delete this.folderStates[folderId];
        
        // Refresh the folder sidebar if we're in backlog view
        if (this.currentView === 'backlog') {
            this.renderFolders();
            // Also refresh tasks to show updated folder assignments
            const activeFolder = document.querySelector('.folder-item.active');
            if (activeFolder) {
                const folderId = activeFolder.dataset.folderId || 'all';
                this.renderTasks(folderId);
            }
        }
    }

    SprintTodoApp.prototype.getFolder = function(folderId) {
        return this.folders.find(f => f.id === folderId);
    }
    
    // Collapse/Expand all subtasks functionality
    SprintTodoApp.prototype.expandAllSubtasks = function() {
        console.log('Expanding all subtasks');
        const activeFolder = document.querySelector('.folder-item.active');
        const folderId = activeFolder ? activeFolder.dataset.folderId : 'all';
        
        // Get all tasks in the current folder
        const tasksInFolder = this.tasks.filter(task => {
            if (folderId === 'all') {
                return !task.folderId;
            } else {
                return task.folderId === folderId;
            }
        });
        
        // Expand all subtasks for each task
        tasksInFolder.forEach(task => {
            if (task.subtasks && task.subtasks.length > 0) {
                task.expanded = true; // Set expanded state to true
            }
        });
        
        // Save the changes
        this.saveData();
        
        // Re-render the task table
        this.renderTasks(folderId);
        
        this.showNotification('All subtasks expanded', 'success');
    }
    
    SprintTodoApp.prototype.collapseAllSubtasks = function() {
        console.log('Collapsing all subtasks');
        const activeFolder = document.querySelector('.folder-item.active');
        const folderId = activeFolder ? activeFolder.dataset.folderId : 'all';
        
        // Get all tasks in the current folder
        const tasksInFolder = this.tasks.filter(task => {
            if (folderId === 'all') {
                return !task.folderId;
            } else {
                return task.folderId === folderId;
            }
        });
        
        // Collapse all subtasks for each task
        tasksInFolder.forEach(task => {
            if (task.subtasks && task.subtasks.length > 0) {
                task.expanded = false; // Set expanded state to false
            }
        });
        
        // Save the changes
        this.saveData();
        
        // Re-render the task table
        this.renderTasks(folderId);
        
        this.showNotification('All subtasks collapsed', 'success');
    }

    // Recurring Tasks
    SprintTodoApp.prototype.handleRecurringTask = function(task) {
        if (!task.recurring || !task.recurringType) return;
        
        let newDueDate = null;
        const today = new Date();
        
        switch (task.recurringType) {
            case 'completion':
                // Create new task for next sprint or backlog
                this.createTask({
                    title: task.title,
                    description: task.description,
                    points: task.points,
                    priority: task.priority,
                    folderId: task.folderId,
                    recurring: true,
                    recurringType: task.recurringType
                });
                break;
                
            case 'weekly':
                newDueDate = new Date(today);
                newDueDate.setDate(today.getDate() + 7);
                break;
                
            case 'biweekly':
                newDueDate = new Date(today);
                newDueDate.setDate(today.getDate() + 14);
                break;
                
            case 'monthly':
                newDueDate = new Date(today);
                newDueDate.setMonth(today.getMonth() + 1);
                break;
                
            case 'yearly':
                newDueDate = new Date(today);
                newDueDate.setFullYear(today.getFullYear() + 1);
                break;
        }
        
        if (newDueDate) {
            // Create new task with due date
            this.createTask({
                title: task.title,
                description: task.description,
                points: task.points,
                priority: task.priority,
                dueDate: newDueDate.toISOString().split('T')[0],
                folderId: task.folderId,
                recurring: true,
                recurringType: task.recurringType
            });
        }
        
        // Handle recurring for subtasks
        if (task.subtasks && task.subtasks.length > 0) {
            task.subtasks.forEach(subtask => {
                const fullSubtask = this.getTask(subtask.id);
                if (fullSubtask) {
                    this.handleRecurringTask(fullSubtask);
                }
            });
        }
    }

    // Sprint Board Status Management
    // Sprint Board Status Management
    SprintTodoApp.prototype.getDefaultBoardStatuses = function() {
        return [
            { id: 'todo', name: 'To Do', order: 1 },
            { id: 'in-progress', name: 'In Progress', order: 2 },
            { id: 'review', name: 'Review', order: 3 },
            { id: 'done', name: 'Done', order: 4 }
        ];
    }

    SprintTodoApp.prototype.getBoardStatuses = function() {
        // Return custom statuses if they exist, otherwise return defaults
        return this.boardStatuses.length > 0 ? this.boardStatuses : this.getDefaultBoardStatuses();
    }

    SprintTodoApp.prototype.addBoardStatus = function(statusData) {
        const status = {
            id: statusData.id || Date.now().toString(),
            name: statusData.name,
            order: statusData.order || this.boardStatuses.length + 1
        };
        
        this.boardStatuses.push(status);
        this.boardStatuses.sort((a, b) => a.order - b.order);
        this.saveData();
        return status;
    }

    SprintTodoApp.prototype.updateBoardStatus = function(statusId, updates) {
        const statusIndex = this.boardStatuses.findIndex(s => s.id === statusId);
        if (statusIndex !== -1) {
            this.boardStatuses[statusIndex] = {
                ...this.boardStatuses[statusIndex],
                ...updates
            };
            this.boardStatuses.sort((a, b) => a.order - b.order);
            this.saveData();
            return this.boardStatuses[statusIndex];
        }
        return null;
    }

    SprintTodoApp.prototype.deleteBoardStatus = function(statusId) {
        // Check if any tasks are using this status
        const tasksWithStatus = this.tasks.filter(task => task.status === statusId);
        if (tasksWithStatus.length > 0) {
            this.showNotification(`Cannot delete status: ${tasksWithStatus.length} tasks are using it.`, 'warning');
            return false;
        }
        
        this.boardStatuses = this.boardStatuses.filter(s => s.id !== statusId);
        this.saveData();
        return true;
    }

    SprintTodoApp.prototype.resetBoardStatuses = function() {
        this.boardStatuses = [];
        this.saveData();
        this.renderSprintBoard();
        this.showNotification('Board statuses reset to default');
    }

    // Status Management Modal Methods
    SprintTodoApp.prototype.openStatusModal = function() {
        const modal = document.getElementById('status-modal');
        modal.classList.add('active');
        this.renderStatusList();
    }

    SprintTodoApp.prototype.closeStatusModal = function() {
        const modal = document.getElementById('status-modal');
        modal.classList.remove('active');
        this.hideAddStatusForm();
    }

    SprintTodoApp.prototype.renderStatusList = function() {
        const statusList = document.getElementById('status-list');
        const statuses = this.getBoardStatuses();
        
        statusList.innerHTML = '';
        
        statuses.forEach((status, index) => {
            const statusItem = document.createElement('div');
            statusItem.className = 'status-item';
            statusItem.innerHTML = `
                <div class="status-info">
                    <span class="status-name">${status.name}</span>
                    <span class="status-order">Order: ${status.order}</span>
                </div>
                <div class="status-actions">
                    <button class="status-move-up-btn" ${index === 0 ? 'disabled' : ''} onclick="app.moveStatusUp('${status.id}')">
                        <i class="fas fa-chevron-up"></i>
                    </button>
                    <button class="status-move-down-btn" ${index === statuses.length - 1 ? 'disabled' : ''} onclick="app.moveStatusDown('${status.id}')">
                        <i class="fas fa-chevron-down"></i>
                    </button>
                    <button class="status-edit-btn" onclick="app.editStatus('${status.id}')">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="status-delete-btn" onclick="app.deleteStatus('${status.id}')">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            `;
            statusList.appendChild(statusItem);
        });
    }

    SprintTodoApp.prototype.showAddStatusForm = function() {
        const form = document.getElementById('add-status-form');
        if (form) {
            form.classList.add('active');
            document.getElementById('new-status-name').focus();
        }
    }

    SprintTodoApp.prototype.hideAddStatusForm = function() {
        const form = document.getElementById('add-status-form');
        if (form) {
            form.classList.remove('active');
            document.getElementById('new-status-name').value = '';
            document.getElementById('new-status-order').value = '';
        }
    }

    SprintTodoApp.prototype.addStatus = function() {
        const name = document.getElementById('new-status-name').value.trim();
        const order = parseInt(document.getElementById('new-status-order').value) || this.getBoardStatuses().length + 1;
        
        if (!name) {
            this.showNotification('Status name is required', 'warning');
            return;
        }
        
        // Generate a simple ID based on the name
        const id = name.toLowerCase().replace(/\s+/g, '');
        
        this.addBoardStatus({ id, name, order });
        this.renderStatusList();
        this.hideAddStatusForm();
        this.renderSprintBoard();
        this.showNotification('Status added successfully!');
    }

    SprintTodoApp.prototype.editStatus = function(statusId) {
        const status = this.boardStatuses.find(s => s.id === statusId);
        if (!status) return;
        
        const statusItem = document.querySelector(`[onclick="app.editStatus('${statusId}')"]`).closest('.status-item');
        statusItem.innerHTML = `
            <div class="status-edit-form">
                <input type="text" id="edit-status-name" value="${status.name}" placeholder="Status name">
                <input type="number" id="edit-status-order" value="${status.order}" min="1" placeholder="Order">
                <div class="status-edit-actions">
                    <button class="status-save-btn" onclick="app.saveStatus('${statusId}')">
                        <i class="fas fa-check"></i>
                    </button>
                    <button class="status-cancel-btn" onclick="app.renderStatusList()">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
            </div>
        `;
        
        document.getElementById('edit-status-name').focus();
    }

    SprintTodoApp.prototype.saveStatus = function(statusId) {
        const name = document.getElementById('edit-status-name').value.trim();
        const order = parseInt(document.getElementById('edit-status-order').value) || 1;
        
        if (!name) {
            this.showNotification('Status name is required', 'warning');
            return;
        }
        
        this.updateBoardStatus(statusId, { name, order });
        this.renderStatusList();
        this.renderSprintBoard();
        this.showNotification('Status updated successfully!');
    }

    SprintTodoApp.prototype.deleteStatus = function(statusId) {
        const status = this.boardStatuses.find(s => s.id === statusId);
        if (!status) return;
        
        if (confirm(`Are you sure you want to delete "${status.name}" status?`)) {
            if (this.deleteBoardStatus(statusId)) {
                this.renderStatusList();
                this.renderSprintBoard();
                this.showNotification('Status deleted successfully!');
            }
        }
    }

    SprintTodoApp.prototype.moveStatusUp = function(statusId) {
        const statuses = this.getBoardStatuses();
        const statusIndex = statuses.findIndex(s => s.id === statusId);
        
        if (statusIndex > 0) {
            const currentOrder = statuses[statusIndex].order;
            const previousOrder = statuses[statusIndex - 1].order;
            
            this.updateBoardStatus(statusId, { order: previousOrder });
            this.updateBoardStatus(statuses[statusIndex - 1].id, { order: currentOrder });
            
            this.renderStatusList();
            this.renderSprintBoard();
        }
    }

    SprintTodoApp.prototype.moveStatusDown = function(statusId) {
        const statuses = this.getBoardStatuses();
        const statusIndex = statuses.findIndex(s => s.id === statusId);
        
        if (statusIndex < statuses.length - 1) {
            const currentOrder = statuses[statusIndex].order;
            const nextOrder = statuses[statusIndex + 1].order;
            
            this.updateBoardStatus(statusId, { order: nextOrder });
            this.updateBoardStatus(statuses[statusIndex + 1].id, { order: currentOrder });
            
            this.renderStatusList();
            this.renderSprintBoard();
        }
    }

    // Event Listeners Setup
    SprintTodoApp.prototype.setupEventListeners = function() {
        // Navigation
        const navButtons = document.querySelectorAll('.nav-btn');
        if (navButtons.length > 0) {
            navButtons.forEach(btn => {
                btn.addEventListener('click', (e) => {
                    const view = e.currentTarget.dataset.view;
                    this.switchView(view);
                });
            });
        }
        
        // Task Modal form submission
        const taskForm = document.getElementById('task-form');
        if (taskForm) {
            taskForm.addEventListener('submit', (e) => {
                e.preventDefault();
                const taskId = taskForm.dataset.taskId;
                const taskData = {
                    id: taskId,
                    title: document.getElementById('task-title').value,
                    description: document.getElementById('task-description').value,
                    points: parseInt(document.getElementById('task-points').value) || 1,
                    priority: document.getElementById('task-priority').value,
                    dueDate: document.getElementById('task-due-date').value,
                    sprintId: document.getElementById('task-sprint').value || null,
                    recurring: document.getElementById('task-recurring').checked,
                    recurringType: document.getElementById('recurring-type').value,
                    folderId: taskForm.dataset.folderId || null
                };
                this.saveTask(taskData);
            });
        }
        
        // Recurring task checkbox
        const taskRecurring = document.getElementById('task-recurring');
        if (taskRecurring) {
            taskRecurring.addEventListener('change', (e) => {
                const recurringOptions = document.getElementById('recurring-options');
                if (recurringOptions) {
                    recurringOptions.style.display = e.target.checked ? 'block' : 'none';
                }
            });
        }
        
        // Sprint Modal
        const createSprintBtn = document.getElementById('create-sprint-btn');
        if (createSprintBtn) {
            createSprintBtn.addEventListener('click', () => {
                this.openSprintModal();
            });
        }
        
        const sprintForm = document.getElementById('sprint-form');
        if (sprintForm) {
            sprintForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.saveSprint();
            });
        }
        
        // Email Integration
        const emailTaskBtn = document.getElementById('email-task-btn');
        if (emailTaskBtn) {
            emailTaskBtn.addEventListener('click', () => {
                this.openEmailModal();
            });
        }
        
        const emailForm = document.getElementById('email-form');
        if (emailForm) {
            emailForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.createTaskFromEmail();
            });
        }
        
        // Sprint selector
        const sprintSelector = document.getElementById('sprint-selector');
        if (sprintSelector) {
            sprintSelector.addEventListener('change', (e) => {
                const sprintId = e.target.value;
                this.currentSprint = sprintId ? this.getSprint(sprintId) : null;
                console.log('Sprint selector changed:', {
                    sprintId: sprintId,
                    currentSprint: this.currentSprint
                });
                this.renderSprintBoard();
            });
        }
        
        const analysisSprintSelector = document.getElementById('analysis-sprint-selector');
        if (analysisSprintSelector) {
            analysisSprintSelector.addEventListener('change', (e) => {
                const sprintId = e.target.value;
                this.renderCharts(sprintId);
            });
        }
        
        // Modal close buttons
        const closeButtons = document.querySelectorAll('.close-btn, .cancel-btn');
        if (closeButtons.length > 0) {
            closeButtons.forEach(btn => {
                btn.addEventListener('click', () => {
                    this.closeModals();
                });
            });
        }
        
        // Click outside modal to close
        const modals = document.querySelectorAll('.modal');
        if (modals.length > 0) {
            modals.forEach(modal => {
                modal.addEventListener('click', (e) => {
                    if (e.target === modal) {
                        this.closeModals();
                    }
                });
            });
        }
        
        // Create folder button
        const createFolderBtn = document.getElementById('create-folder-btn');
        if (createFolderBtn) {
            createFolderBtn.addEventListener('click', () => {
                this.showCreateFolderDialog();
            });
        }
        
        // Inline task form
        const inlineTaskForm = document.getElementById('inline-task-form-element');
        if (inlineTaskForm) {
            inlineTaskForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.saveInlineTask();
            });
        }
        
        // Status Management Modal
        const manageStatusesBtn = document.getElementById('manage-statuses-btn');
        if (manageStatusesBtn) {
            manageStatusesBtn.addEventListener('click', () => {
                this.openStatusModal();
            });
        }
        
        const addStatusBtn = document.getElementById('add-status-btn');
        if (addStatusBtn) {
            addStatusBtn.addEventListener('click', () => {
                this.showAddStatusForm();
            });
        }
        
        const resetStatusesBtn = document.getElementById('reset-statuses-btn');
        if (resetStatusesBtn) {
            resetStatusesBtn.addEventListener('click', () => {
                if (confirm('Are you sure you want to reset board statuses to default? This will remove all custom statuses.')) {
                    this.resetBoardStatuses();
                    this.closeStatusModal();
                }
            });
        }
    }

    // UI Rendering
    SprintTodoApp.prototype.render = function() {
        this.renderBacklog();
        this.renderSprints();
        this.renderSprintSelectors();
        this.updateSprintStatuses();
    }

    SprintTodoApp.prototype.switchView = function(viewName) {
        // Clean up charts if switching away from analysis
        if (this.currentView === 'analysis' && viewName !== 'analysis') {
            this.destroyCharts();
        }
        
        // Hide all views
        document.querySelectorAll('.view').forEach(view => {
            view.classList.remove('active');
        });
        
        // Show selected view
        document.getElementById(`${viewName}-view`).classList.add('active');
        
        // Update navigation
        document.querySelectorAll('.nav-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        
        document.querySelector(`[data-view="${viewName}"]`).classList.add('active');
        
        this.currentView = viewName;
        
        // Render specific view content
        switch (viewName) {
            case 'backlog':
                this.renderBacklog();
                break;
            case 'sprints':
                this.renderSprints();
                break;
            case 'board':
                this.renderSprintBoard();
                break;
            case 'analysis':
                this.renderAnalysis();
                break;
        }
    }
    
    SprintTodoApp.prototype.destroyCharts = function() {
        if (this.burnupChart) {
            this.burnupChart.destroy();
            this.burnupChart = null;
        }
        if (this.burndownChart) {
            this.burndownChart.destroy();
            this.burndownChart = null;
        }
        if (this.velocityChart) {
            this.velocityChart.destroy();
            this.velocityChart = null;
        }
    }

    SprintTodoApp.prototype.renderBacklog = function() {
        const container = document.getElementById('backlog-view');
        if (!container) return;
        
        // Use the existing HTML structure
        const folderSidebar = document.getElementById('folder-sidebar');
        const taskTableBody = document.getElementById('task-table-body');
        const currentFolderTitle = document.getElementById('current-folder-title');
        
        // Clear existing content
        if (folderSidebar) {
            const folderList = folderSidebar.querySelector('.folder-list');
            if (folderList) folderList.innerHTML = '';
        }
        
        if (taskTableBody) {
            taskTableBody.innerHTML = '';
        }
        
        // Render folders
        this.renderFolders();
        
        // Render tasks for "All Tasks" by default
        this.renderTasks('all');
    }

    SprintTodoApp.prototype.renderFolders = function() {
        const folderSidebar = document.querySelector('.folder-sidebar');
        if (!folderSidebar) return;
        
        // Clear existing folders
        const folderList = folderSidebar.querySelector('.folder-list');
        if (folderList) {
            folderList.innerHTML = '';
        } else {
            folderSidebar.innerHTML = '';
        }
        
        // Add "All Tasks" folder
        const allTasksFolder = document.createElement('div');
        allTasksFolder.className = 'folder-item active';
        allTasksFolder.dataset.folderId = 'all';
        allTasksFolder.draggable = true;
        allTasksFolder.innerHTML = `
            <div class="folder-header" onclick="app.selectFolder('all')">
                <i class="fas fa-tasks"></i>
                <span>All Tasks</span>
            </div>
        `;
        
        if (folderList) {
            folderList.appendChild(allTasksFolder);
        } else {
            folderSidebar.appendChild(allTasksFolder);
        }
        
        // Add folders
        this.folders.forEach(folder => {
            const folderElement = document.createElement('div');
            folderElement.className = 'folder-item';
            folderElement.dataset.folderId = folder.id;
            folderElement.draggable = true;
            folderElement.innerHTML = `
                <div class="folder-header" onclick="app.selectFolder('${folder.id}')">
                    <i class="fas fa-folder"></i>
                    <span>${folder.name}</span>
                </div>
            `;
            
            if (folderList) {
                folderList.appendChild(folderElement);
            } else {
                folderSidebar.appendChild(folderElement);
            }
        });
        
        // Set up folder drag and drop
        this.setupFolderDragAndDrop();
    }

    SprintTodoApp.prototype.renderTasks = function(folderId) {
        const tableBody = document.getElementById('task-table-body');
        if (!tableBody) return;
        
        // Clear existing tasks
        tableBody.innerHTML = '';
        
        // Get tasks based on folder selection
        let tasks;
        if (folderId === 'all') {
            tasks = this.tasks.filter(task => task.status !== 'done');
        } else {
            tasks = this.getTasksAndSubtasksByFolder(folderId);
        }
        
        // Sort tasks - preserve manual order if it exists, otherwise sort by creation date
        tasks.sort((a, b) => {
            // If both tasks have manual order, use that
            if (a.manualOrder !== undefined && b.manualOrder !== undefined) {
                return a.manualOrder - b.manualOrder;
            }
            // If only one has manual order, prioritize it
            if (a.manualOrder !== undefined) {
                return -1;
            }
            if (b.manualOrder !== undefined) {
                return 1;
            }
            // Otherwise sort by creation date (newest first)
            return new Date(b.createdAt) - new Date(a.createdAt);
        });
        
        // Update current folder title
        const currentFolderTitle = document.getElementById('current-folder-title');
        if (currentFolderTitle) {
            if (folderId === 'all') {
                currentFolderTitle.textContent = 'All Tasks';
            } else {
                const folder = this.getFolder(folderId);
                currentFolderTitle.textContent = folder ? folder.name : 'Tasks';
            }
        }
    
    
        // Render tasks
        if (tasks.length === 0) {
            tableBody.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-tasks"></i>
                    <h3>No tasks found</h3>
                    <p>Create a new task to get started!</p>
                </div>
            `;
            return;
        }
        
        // Separate parent tasks and subtasks to avoid duplication
        const parentTasks = tasks.filter(task => !task.parentTaskId);
        const subtasks = tasks.filter(task => task.parentTaskId);
        
        // Render parent tasks first
        parentTasks.forEach(task => {
            const taskRow = this.createTaskTableRow(task);
            tableBody.appendChild(taskRow);
            
            // Render subtasks if expanded
            if (task.expanded !== false && task.subtasks && task.subtasks.length > 0) {
                task.subtasks.forEach(subtask => {
                    const fullSubtask = this.getTask(subtask.id);
                    if (fullSubtask) {
                        console.log('Creating subtask row for:', {
                            subtaskId: fullSubtask.id,
                            subtaskTitle: fullSubtask.title,
                            parentTaskId: task.id,
                            parentTaskTitle: task.title,
                            isSubtask: fullSubtask.parentTaskId || fullSubtask.isSubtask
                        });
                        const subtaskRow = this.createSubtaskTableRow(fullSubtask, task.id);
                        tableBody.appendChild(subtaskRow);
                    }
                });
            }
        });
        
        // Render standalone subtasks (subtasks that are not nested under a parent)
        subtasks.forEach(subtask => {
            const parentTask = this.getTask(subtask.parentTaskId);
            // Only render standalone subtasks if the parent doesn't exist (orphaned subtasks)
            // Don't show subtasks when parent is collapsed
            if (!parentTask) {
                console.log('Creating standalone subtask row for orphaned subtask:', {
                    subtaskId: subtask.id,
                    subtaskTitle: subtask.title,
                    parentTaskId: subtask.parentTaskId,
                    parentTaskTitle: parentTask ? parentTask.title : 'null',
                    isSubtask: subtask.parentTaskId || subtask.isSubtask
                });
                const subtaskRow = this.createSubtaskTableRow(subtask, subtask.parentTaskId);
                tableBody.appendChild(subtaskRow);
            }
        });
    }

    SprintTodoApp.prototype.createTaskTableRow = function(task) {
        const row = document.createElement('div');
        row.className = 'task-table-row';
        row.dataset.taskId = task.id;
        // Make the entire row draggable but prevent drag on interactive elements
        
        // Get available sprints for dropdown
        const availableSprints = this.sprints.filter(sprint =>
            sprint.status === 'upcoming' || sprint.status === 'active'
        );
        
        // Create sprint dropdown
        const sprintDropdown = availableSprints.length > 0 ? `
            <select onchange="app.assignTaskToSprint('${task.id}', this.value)">
                <option value="">No Sprint</option>
                ${availableSprints.map(sprint =>
                    `<option value="${sprint.id}" ${task.sprintId === sprint.id ? 'selected' : ''}>
                        ${sprint.name}
                    </option>`
                ).join('')}
            </select>
        ` : '<span class="no-sprint">No sprints available</span>';
        
        // Create priority dropdown with current value
        const priorityDropdown = `
            <select onchange="app.updateTaskPriority('${task.id}', this.value)" class="priority-display priority-${task.priority}">
                <option value="low" ${task.priority === 'low' ? 'selected' : ''}>Low</option>
                <option value="medium" ${task.priority === 'medium' ? 'selected' : ''}>Medium</option>
                <option value="high" ${task.priority === 'high' ? 'selected' : ''}>High</option>
                <option value="critical" ${task.priority === 'critical' ? 'selected' : ''}>Critical</option>
            </select>
        `;
        
        // Create story points dropdown with current value
        const pointsDropdown = `
            <select onchange="app.updateTaskPoints('${task.id}', this.value)" class="points-display">
                <option value="1" ${task.points == 1 ? 'selected' : ''}>1</option>
                <option value="2" ${task.points == 2 ? 'selected' : ''}>2</option>
                <option value="3" ${task.points == 3 ? 'selected' : ''}>3</option>
                <option value="5" ${task.points == 5 ? 'selected' : ''}>5</option>
                <option value="8" ${task.points == 8 ? 'selected' : ''}>8</option>
                <option value="13" ${task.points == 13 ? 'selected' : ''}>13</option>
                <option value="20" ${task.points == 20 ? 'selected' : ''}>20</option>
            </select>
        `;
        
        // Format sprint assignment
        const sprint = task.sprintId ? this.getSprint(task.sprintId) : null;
        const sprintAssignment = sprint ? sprint.name : 'No Sprint';
        
        // Create checkbox for subtasks
        const checkbox = task.parentTaskId ? `
            <input type="checkbox" ${task.completed ? 'checked' : ''}
                    onchange="app.toggleSubtaskComplete('${task.parentTaskId}', '${task.id}')">
        ` : '';
        
        // Add subtask toggle button for tasks with subtasks
        const subtaskToggle = task.subtasks && task.subtasks.length > 0 ? `
            <button class="btn-toggle-subtasks" onclick="app.toggleSubtasks('${task.id}')" title="Toggle subtasks">
                <i class="fas fa-chevron-${task.expanded !== false ? 'down' : 'right'}"></i>
            </button>
        ` : '';
        
        // Add drag handle indicator for visual feedback
        const dragHandle = task.parentTaskId ? '' : `
            <div class="drag-handle-indicator" title="Drag to reorder">
                <i class="fas fa-grip-vertical"></i>
            </div>
        `;
        
        row.innerHTML = `
            <div class="task-col-title">
                ${dragHandle}
                ${checkbox}
                ${subtaskToggle}
                <span class="task-title-text">${task.title}</span>
                ${task.parentTaskId ? '<span class="subtask-indicator">Subtask</span>' : ''}
            </div>
            <div class="task-col-points">
                ${pointsDropdown}
            </div>
            <div class="task-col-priority">
                ${priorityDropdown}
            </div>
            <div class="task-col-sprint">${sprintAssignment}</div>
            <div class="task-col-actions">
                <button class="btn-secondary" onclick="app.editTask('${task.id}')" title="Edit task">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="btn-secondary" onclick="app.deleteTask('${task.id}')" title="Delete task">
                    <i class="fas fa-trash"></i>
                </button>
                ${!task.parentTaskId ? `
                    <button class="btn-secondary" onclick="app.showAddSubtaskDialog('${task.id}')" title="Add subtask">
                        <i class="fas fa-plus"></i>
                    </button>
                ` : ''}
            </div>
        `;
        
        // Make the entire row draggable but prevent drag on interactive elements
        row.draggable = true;
        
        // Prevent drag on interactive elements
        row.addEventListener('dragstart', (e) => {
            // Check if the drag started from an interactive element
            const interactiveElements = e.target.closest('select, button, input[type="checkbox"]');
            if (interactiveElements) {
                e.preventDefault();
                return;
            }
            
            const taskRow = row;
            console.log('Task row drag start event:', {
                target: e.target,
                taskRow: taskRow,
                hasTaskId: taskRow && taskRow.dataset.taskId,
                isSubtask: taskRow && taskRow.classList.contains('subtask-row'),
                taskRowHtml: taskRow ? taskRow.outerHTML.substring(0, 200) : 'null'
            });
            
            if (taskRow && taskRow.dataset.taskId) {
                app.draggedElement = taskRow;
                app.draggedTask = app.getTask(taskRow.dataset.taskId);
                
                // Find the actual index in the tasks array, not just DOM position
                app.draggedIndex = app.tasks.findIndex(t => t.id === taskRow.dataset.taskId);
                
                console.log('Drag started from task row:', {
                    taskId: taskRow.dataset.taskId,
                    taskTitle: app.draggedTask ? app.draggedTask.title : 'null',
                    draggedIndex: app.draggedIndex,
                    domIndex: Array.from(taskTableBody.children).indexOf(taskRow),
                    isSubtask: taskRow.classList.contains('subtask-row')
                });
                
                taskRow.classList.add('dragging');
                e.dataTransfer.effectAllowed = 'move';
                e.dataTransfer.setData('text/html', taskRow.innerHTML);
            }
        });
        
        return row;
    }

    SprintTodoApp.prototype.createSubtaskTableRow = function(subtask, parentTaskId) {
        console.log('createSubtaskTableRow called with:', {
            subtaskId: subtask.id,
            subtaskTitle: subtask.title,
            parentTaskId: parentTaskId,
            isSubtask: subtask.parentTaskId || subtask.isSubtask,
            hasDragHandle: true
        });
        
        const row = document.createElement('div');
        row.className = 'task-table-row subtask-row';
        row.dataset.taskId = subtask.id;
        row.dataset.parentTaskId = parentTaskId;
        // Don't make the entire row draggable - add a drag handle instead
        
        // Get available sprints for dropdown
        const availableSprints = this.sprints.filter(sprint =>
            sprint.status === 'upcoming' || sprint.status === 'active'
        );
        
        // Create sprint dropdown
        const sprintDropdown = availableSprints.length > 0 ? `
            <select onchange="app.assignTaskToSprint('${subtask.id}', this.value)">
                <option value="">No Sprint</option>
                ${availableSprints.map(sprint =>
                    `<option value="${sprint.id}" ${subtask.sprintId === sprint.id ? 'selected' : ''}>
                        ${sprint.name}
                    </option>`
                ).join('')}
            </select>
        ` : '<span class="no-sprint">No sprints available</span>';
        
        // Create priority dropdown with current value
        const priorityDropdown = `
            <select onchange="app.updateTaskPriority('${subtask.id}', this.value)" class="priority-display priority-${subtask.priority}">
                <option value="low" ${subtask.priority === 'low' ? 'selected' : ''}>Low</option>
                <option value="medium" ${subtask.priority === 'medium' ? 'selected' : ''}>Medium</option>
                <option value="high" ${subtask.priority === 'high' ? 'selected' : ''}>High</option>
                <option value="critical" ${subtask.priority === 'critical' ? 'selected' : ''}>Critical</option>
            </select>
        `;
        
        // Create story points dropdown with current value
        const pointsDropdown = `
            <select onchange="app.updateTaskPoints('${subtask.id}', this.value)" class="points-display">
                <option value="1" ${subtask.points == 1 ? 'selected' : ''}>1</option>
                <option value="2" ${subtask.points == 2 ? 'selected' : ''}>2</option>
                <option value="3" ${subtask.points == 3 ? 'selected' : ''}>3</option>
                <option value="5" ${subtask.points == 5 ? 'selected' : ''}>5</option>
                <option value="8" ${subtask.points == 8 ? 'selected' : ''}>8</option>
                <option value="13" ${subtask.points == 13 ? 'selected' : ''}>13</option>
                <option value="20" ${subtask.points == 20 ? 'selected' : ''}>20</option>
            </select>
        `;
        
        // Format sprint assignment
        const sprint = subtask.sprintId ? this.getSprint(subtask.sprintId) : null;
        const sprintAssignment = sprint ? sprint.name : 'No Sprint';
        
        // Create checkbox for subtasks
        const checkbox = `
            <input type="checkbox" ${subtask.completed ? 'checked' : ''}
                    onchange="app.toggleSubtaskComplete('${parentTaskId}', '${subtask.id}')">
        `;
        
        // Add drag handle to the title area
        const dragHandle = `
            <div class="drag-handle" draggable="true" title="Drag to reorder">
                <i class="fas fa-grip-vertical"></i>
            </div>
        `;
        
        row.innerHTML = `
            <div class="task-col-title">
                ${dragHandle}
                ${checkbox}
                <span class="task-title-text">${subtask.title}</span>
                <span class="subtask-indicator">Subtask</span>
            </div>
            <div class="task-col-points">
                ${pointsDropdown}
            </div>
            <div class="task-col-priority">
                ${priorityDropdown}
            </div>
            <div class="task-col-sprint">${sprintAssignment}</div>
            <div class="task-col-actions">
                <button class="btn-secondary" onclick="app.editTask('${subtask.id}')" title="Edit task">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="btn-secondary" onclick="app.deleteTask('${subtask.id}')" title="Delete task">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        `;
        
        // Make the entire subtask row draggable but prevent drag on interactive elements
        row.draggable = true;
        
        // Prevent drag on interactive elements
        row.addEventListener('dragstart', (e) => {
            // Check if the drag started from an interactive element
            const interactiveElements = e.target.closest('select, button, input[type="checkbox"]');
            if (interactiveElements) {
                e.preventDefault();
                return;
            }
            
            const taskRow = row;
            console.log('Subtask row drag start event:', {
                target: e.target,
                taskRow: taskRow,
                hasTaskId: taskRow && taskRow.dataset.taskId,
                isSubtask: taskRow && taskRow.classList.contains('subtask-row'),
                taskRowHtml: taskRow ? taskRow.outerHTML.substring(0, 200) : 'null'
            });
            
            if (taskRow && taskRow.dataset.taskId) {
                app.draggedElement = taskRow;
                app.draggedTask = app.getTask(taskRow.dataset.taskId);
                
                // Find the actual index in the tasks array, not just DOM position
                app.draggedIndex = app.tasks.findIndex(t => t.id === taskRow.dataset.taskId);
                
                console.log('Subtask drag started from row:', {
                    taskId: taskRow.dataset.taskId,
                    taskTitle: app.draggedTask ? app.draggedTask.title : 'null',
                    draggedIndex: app.draggedIndex,
                    domIndex: Array.from(taskTableBody.children).indexOf(taskRow),
                    isSubtask: taskRow.classList.contains('subtask-row'),
                    parentTaskId: taskRow.dataset.parentTaskId
                });
                
                taskRow.classList.add('dragging');
                e.dataTransfer.effectAllowed = 'move';
                e.dataTransfer.setData('text/html', taskRow.innerHTML);
            }
        });
        
        return row;
    }

    SprintTodoApp.prototype.selectFolder = function(folderId) {
        // Update active folder in sidebar
        document.querySelectorAll('.folder-item').forEach(item => {
            item.classList.remove('active');
        });
        
        const selectedFolder = document.querySelector(`[data-folder-id="${folderId}"]`) ||
                              document.querySelector('.folder-item[data-folder-id="all"]');
        if (selectedFolder) {
            selectedFolder.classList.add('active');
        }
        
        // Render tasks for selected folder
        this.renderTasks(folderId);
    }


    SprintTodoApp.prototype.createFolderElement = function(folder) {
        const tasks = this.getParentTasksForFolder(folder.id).filter(task => task.status !== 'done');
        const folderElement = document.createElement('div');
        folderElement.className = 'folder';
        folderElement.dataset.folderId = folder.id;
        folderElement.innerHTML = `
            <div class="folder-header" onclick="app.toggleFolder('${folder.id}')">
                <div class="folder-title">
                    <i class="fas fa-chevron-down folder-toggle"></i>
                    ${folder.name}
                </div>
                <div class="folder-actions">
                    <button class="btn-secondary" onclick="event.stopPropagation(); app.editFolder('${folder.id}')">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn-secondary" onclick="event.stopPropagation(); app.deleteFolder('${folder.id}')">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
            <div class="folder-content">
                <div class="folder-tasks">
                    ${tasks.map(task => this.createTaskElement(task)).join('')}
                    ${tasks.length === 0 ? '<p class="empty-state">No tasks in this folder</p>' : ''}
                </div>
                <div class="inline-task-input">
                    <input type="text" placeholder="Add task..." onkeypress="if(event.key==='Enter') app.createQuickTask(this, '${folder.id}')">
                    <button class="add-btn" onclick="app.createQuickTask(this, '${folder.id}')">Add</button>
                </div>
            </div>
        `;
        // Apply persisted collapsed state
        const isCollapsed = !!this.folderStates[folder.id];
        if (isCollapsed) {
            folderElement.classList.add('collapsed');
            const icon = folderElement.querySelector('.folder-toggle');
            if (icon) icon.className = 'fas fa-chevron-right folder-toggle';
        }
        return folderElement;
    };

    SprintTodoApp.prototype.createTaskElement = function(task, isSubtask, parentTaskId, level) {
        isSubtask = isSubtask || false;
        parentTaskId = parentTaskId || null;
        level = level || 0;
        const priorityClass = `priority-${task.priority}`;
        const dueDate = task.dueDate ? new Date(task.dueDate).toLocaleDateString() : '';
        const indentClass = isSubtask ? 'subtask' : '';
        
        // Check if this is a real subtask (has parentTaskId) or just a nested display
        const isRealSubtask = task.parentTaskId || isSubtask;
        const checkbox = isRealSubtask ?
            `<input type="checkbox" ${task.completed ? 'checked' : ''}
                    onchange="app.toggleSubtaskComplete('${task.parentTaskId || parentTaskId}', '${task.id}')">` : '';
        
        // Get available sprints for dropdown
        const availableSprints = this.sprints.filter(sprint =>
            sprint.status === 'upcoming' || sprint.status === 'active'
        );
        
        // Create sprint dropdown
        const sprintDropdown = availableSprints.length > 0 ? `
            <div class="sprint-dropdown">
                <select onchange="app.assignTaskToSprint('${task.id}', this.value)">
                    <option value="">No Sprint</option>
                    ${availableSprints.map(sprint =>
                        `<option value="${sprint.id}" ${task.sprintId === sprint.id ? 'selected' : ''}>
                            ${sprint.name}
                        </option>`
                    ).join('')}
                </select>
            </div>
        ` : '<span class="no-sprint">No sprints available</span>';
        
        // Create priority dropdown
        const priorityDropdown = `
            <div class="priority-dropdown">
                <select onchange="app.updateTaskPriority('${task.id}', this.value)">
                    <option value="low" ${task.priority === 'low' ? 'selected' : ''}>Low</option>
                    <option value="medium" ${task.priority === 'medium' ? 'selected' : ''}>Medium</option>
                    <option value="high" ${task.priority === 'high' ? 'selected' : ''}>High</option>
                    <option value="critical" ${task.priority === 'critical' ? 'selected' : ''}>Critical</option>
                </select>
            </div>
        `;
        
        // Create story points dropdown
        const pointsDropdown = `
            <div class="points-dropdown">
                <select onchange="app.updateTaskPoints('${task.id}', this.value)">
                    <option value="1" ${task.points == 1 ? 'selected' : ''}>1</option>
                    <option value="2" ${task.points == 2 ? 'selected' : ''}>2</option>
                    <option value="3" ${task.points == 3 ? 'selected' : ''}>3</option>
                    <option value="5" ${task.points == 5 ? 'selected' : ''}>5</option>
                    <option value="8" ${task.points == 8 ? 'selected' : ''}>8</option>
                    <option value="13" ${task.points == 13 ? 'selected' : ''}>13</option>
                    <option value="20" ${task.points == 20 ? 'selected' : ''}>20</option>
                </select>
            </div>
        `;
        
        // Add subtask button and collapse/expand toggle for tasks with subtasks
        // Only show toggle for main tasks in backlog, not for sprint boards
        const isSprintBoard = this.currentView === 'board';
        const subtaskToggle = (!isSprintBoard && task.subtasks && task.subtasks.length > 0) ? `
            <button class="btn-toggle-subtasks" title="Toggle subtasks">
                <i class="fas fa-chevron-${task.expanded !== false ? 'down' : 'right'}"></i>
            </button>
        ` : '';
        
        console.log('Creating task element for task:', task.id, 'with subtasks:', task.subtasks);
        console.log('Subtask toggle HTML:', subtaskToggle);
        
        const addSubtaskBtn = `
            <button class="btn-subtask" onclick="app.showAddSubtaskDialog('${task.id}')" style="margin-left: 0.5rem;">
                <i class="fas fa-plus"></i> Subtask
            </button>
        `;
        
        const subtasksHtml = (!isSprintBoard && task.subtasks && task.subtasks.length > 0) ? `
            <div class="subtasks ${task.expanded === false ? 'collapsed' : ''}" id="subtasks-${task.id}">
                ${task.subtasks.map(subtask => {
                    // Find the full subtask data from main tasks array
                    const fullSubtask = this.getTask(subtask.id);
                    return fullSubtask ? this.createTaskElement(fullSubtask, true, task.id, level + 1) : '';
                }).join('')}
            </div>
        ` : '';
        
        return `
            <div class="task-item ${indentClass}" draggable="true" data-task-id="${task.id}" style="${isRealSubtask ? `margin-left: ${level * 20}px;` : ''}">
                <div class="task-header">
                    <div class="task-title">
                        ${checkbox}
                        ${subtaskToggle}
                        <span>${task.title}</span>
                        ${addSubtaskBtn}
                    </div>
                    <div class="task-actions">
                        <button class="btn-secondary" onclick="app.editTask('${task.id}')">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="btn-secondary" onclick="app.deleteTask('${task.id}')">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </div>
                <div class="task-meta">
                    <span class="task-points-label">Points:</span>
                    <span class="points-select">${pointsDropdown}</span>
                    <span class="task-points">${task.points} pts</span>
                    <span class="task-priority ${priorityClass}">${task.priority}</span>
                    <span class="task-priority-label">Priority:</span>
                    <span class="priority-select">${priorityDropdown}</span>
                    <span class="sprint-assign">Sprint: ${sprintDropdown}</span>
                    ${dueDate ? `<span class="task-due-date"><i class="fas fa-calendar"></i> ${dueDate}</span>` : ''}
                </div>
                ${task.description ? `<div class="task-description">${task.description}</div>` : ''}
                ${subtasksHtml}
            </div>
        `;
    }

    SprintTodoApp.prototype.renderSprints = function() {
        const container = document.getElementById('sprints-container');
        if (!container) return;
        
        container.innerHTML = '';
        
        this.sprints.forEach(sprint => {
            const sprintElement = this.createSprintElement(sprint);
            container.appendChild(sprintElement);
        });
        
        // Show empty state if no sprints
        if (this.sprints.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-calendar-alt"></i>
                    <h3>No sprints yet</h3>
                    <p>Create your first sprint to get started!</p>
                </div>
            `;
        }
    }

    SprintTodoApp.prototype.createSprintElement = function(sprint) {
        const tasks = this.getFlatTasksForSprintBoard(sprint.id);
        const totalPoints = tasks.reduce((sum, task) => sum + task.points, 0);
        const completedPoints = tasks
            .filter(task => task.status === 'done')
            .reduce((sum, task) => sum + task.points, 0);
        
        const sprintElement = document.createElement('div');
        sprintElement.className = 'sprint-card';
        sprintElement.innerHTML = `
            <div class="sprint-header">
                <div>
                    <h3 class="sprint-title">${sprint.name}</h3>
                    <div class="sprint-dates">
                        ${new Date(sprint.startDate).toLocaleDateString()} - ${new Date(sprint.endDate).toLocaleDateString()}
                    </div>
                </div>
                <div class="sprint-status">${sprint.status}</div>
            </div>
            <div class="sprint-content">
                <div class="sprint-stats">
                    <div>
                        <strong>Total Points:</strong> ${totalPoints}
                    </div>
                    <div>
                        <strong>Completed:</strong> ${completedPoints}
                    </div>
                    <div>
                        <strong>Remaining:</strong> ${totalPoints - completedPoints}
                    </div>
                </div>
                <div class="sprint-actions">
                    <button class="btn-primary" onclick="app.viewSprintBoard('${sprint.id}')">
                        View Board
                    </button>
                    <button class="btn-secondary" onclick="app.editSprint('${sprint.id}')">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn-secondary" onclick="app.deleteSprint('${sprint.id}')">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
        `;
        return sprintElement;
    }

    SprintTodoApp.prototype.renderSprintBoard = function() {
        console.log('renderSprintBoard called');
        const boardContainer = document.getElementById('board-container');
        if (!boardContainer) {
            console.error('board-container not found');
            return;
        }
        
        boardContainer.innerHTML = '';
        
        // Get sprint ID from selector first
        const sprintSelector = document.getElementById('sprint-selector');
        let sprintId = sprintSelector ? sprintSelector.value : null;
        
        // If no selector value, use currentSprint
        if (!sprintId && this.currentSprint) {
            sprintId = this.currentSprint.id;
        }
        
        console.log('Sprint ID determination:', {
            selectorValue: sprintSelector ? sprintSelector.value : null,
            currentSprint: this.currentSprint ? this.currentSprint.id : null,
            finalSprintId: sprintId
        });
        
        if (!sprintId) {
            boardContainer.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-columns"></i>
                    <h3>Select a Sprint</h3>
                    <p>Choose a sprint to view its board</p>
                </div>
            `;
            return;
        }
        
        // Ensure currentSprint is set to the selected sprint
        const sprint = this.getSprint(sprintId);
        if (sprint) {
            this.currentSprint = sprint;
        }
        
        const tasks = this.getFlatTasksForSprintBoard(sprintId);
        const statuses = this.getBoardStatuses();
        
        console.log('Tasks found:', tasks.length);
        console.log('Tasks with subtasks:', tasks.filter(t => t.subtasks && t.subtasks.length > 0).length);
        
        // Debug: Log all tasks and their statuses
        console.log('All tasks in sprint:', tasks.map(t => ({ id: t.id, title: t.title, status: t.status })));
        
        // Sort tasks by manualOrder to preserve drag and drop ordering
        tasks.sort((a, b) => {
            // If both tasks have manual order, use that
            if (a.manualOrder !== undefined && b.manualOrder !== undefined) {
                return a.manualOrder - b.manualOrder;
            }
            // If only one has manual order, prioritize it
            if (a.manualOrder !== undefined) {
                return -1;
            }
            if (b.manualOrder !== undefined) {
                return 1;
            }
            // Otherwise sort by creation date (newest first)
            return new Date(b.createdAt) - new Date(a.createdAt);
        });
        
        console.log('Tasks after sorting:', tasks.map(t => ({ id: t.id, title: t.title, manualOrder: t.manualOrder })));
        
        statuses.forEach(status => {
            const statusTasks = tasks.filter(task => task.status === status.id);
            const totalPoints = statusTasks.reduce((sum, task) => sum + task.points, 0);
            
            console.log(`Status ${status.name} (${status.id}):`, statusTasks.length, 'tasks');
            console.log('Tasks in this status:', statusTasks.map(t => ({ id: t.id, title: t.title, status: t.status })));
            
            const column = document.createElement('div');
            column.className = 'board-column';
            
            // Build task elements
            const taskElements = statusTasks.map(task => {
                console.log('Creating task element for task:', task.id);
                return this.createTaskElement(task);
            }).join('');
            
            // Create column using innerHTML for simplicity
            column.innerHTML = `
                <div class="column-header">
                    <div class="column-title">${status.name}</div>
                    <div class="column-points">${totalPoints} pts</div>
                </div>
                <div class="column-content" data-status="${status.id}">
                    ${taskElements}
                    ${statusTasks.length === 0 ? '<p class="empty-state">No tasks</p>' : ''}
                </div>
            `;
            boardContainer.appendChild(column);
        });
    }

    SprintTodoApp.prototype.renderSprintSelectors = function() {
        const selectors = [
            document.getElementById('sprint-selector'),
            document.getElementById('analysis-sprint-selector')
        ];
        
        selectors.forEach(selector => {
            if (selector) {
                selector.innerHTML = '<option value="">Select Sprint</option>';
                this.sprints.forEach(sprint => {
                    const option = document.createElement('option');
                    option.value = sprint.id;
                    option.textContent = sprint.name;
                    selector.appendChild(option);
                });
            }
        });
    }

    SprintTodoApp.prototype.renderAnalysis = function() {
        // This will be implemented with charts
        const currentSprint = this.getCurrentSprint();
        if (currentSprint) {
            this.renderCharts(currentSprint.id);
        };
    }

    SprintTodoApp.prototype.renderCharts = function(sprintId) {
        if (!sprintId) return;
        
        const sprint = this.getSprint(sprintId);
        if (!sprint) return;
        
        const tasks = this.getTasksBySprint(sprintId);
        const startDate = new Date(sprint.startDate);
        const endDate = new Date(sprint.endDate);
        const totalDays = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24)) + 1;
        
        // Generate chart data
        const chartData = this.generateChartData(sprint, tasks, startDate, endDate);
        
        // Render Burn Up Chart
        this.renderBurnUpChart(chartData);
        
        // Render Burn Down Chart
        this.renderBurnDownChart(chartData);
        
        // Render Velocity Chart
        this.renderVelocityChart(sprint);
    }
    
    SprintTodoApp.prototype.generateChartData = function(sprint, tasks, startDate, endDate) {
        const totalPoints = tasks.reduce((sum, task) => sum + task.points, 0);
        const completedPoints = tasks
            .filter(task => task.status === 'done')
            .reduce((sum, task) => sum + task.points, 0);
        
        // Generate daily data
        const chartData = {
            labels: [],
            ideal: [],
            actual: []
        };
        
        const totalDays = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24)) + 1;
        
        for (let i = 0; i <= totalDays; i++) {
            const currentDate = new Date(startDate);
            currentDate.setDate(startDate.getDate() + i);
            
            chartData.labels.push(currentDate.toLocaleDateString());
            
            // Ideal line (linear progress)
            const idealProgress = (i / totalDays) * totalPoints;
            chartData.ideal.push(idealProgress);
            
            // Actual progress (simplified - in real app, this would track daily progress)
            const actualProgress = Math.min(completedPoints, idealProgress);
            chartData.actual.push(actualProgress);
        }
        
        return { ...chartData, totalPoints, completedPoints };
    }
    
    SprintTodoApp.prototype.renderBurnUpChart = function(chartData) {
        const ctx = document.getElementById('burnup-chart');
        if (!ctx) return;
        
        // Destroy existing chart if it exists
        if (this.burnupChart) {
            this.burnupChart.destroy();
        }
        
        this.burnupChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: chartData.labels,
                datasets: [{
                    label: 'Ideal Progress',
                    data: chartData.ideal,
                    borderColor: 'rgb(75, 192, 192)',
                    backgroundColor: 'rgba(75, 192, 192, 0.1)',
                    tension: 0.1
                }, {
                    label: 'Actual Progress',
                    data: chartData.actual,
                    borderColor: 'rgb(54, 162, 235)',
                    backgroundColor: 'rgba(54, 162, 235, 0.1)',
                    tension: 0.1
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    title: {
                        display: true,
                        text: 'Sprint Burn Up Chart'
                    },
                    legend: {
                        position: 'top',
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        title: {
                            display: true,
                            text: 'Story Points'
                        }
                    },
                    x: {
                        title: {
                            display: true,
                            text: 'Date'
                        }
                    }
                }
            }
        });
    }
    
    SprintTodoApp.prototype.renderBurnDownChart = function(chartData) {
        const ctx = document.getElementById('burndown-chart');
        if (!ctx) return;
        
        // Destroy existing chart if it exists
        if (this.burndownChart) {
            this.burndownChart.destroy();
        }
        
        const remainingData = chartData.totalPoints - chartData.actual;
        
        this.burndownChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: chartData.labels,
                datasets: [{
                    label: 'Ideal Remaining',
                    data: chartData.totalPoints - chartData.ideal,
                    borderColor: 'rgb(255, 99, 132)',
                    backgroundColor: 'rgba(255, 99, 132, 0.1)',
                    tension: 0.1
                }, {
                    label: 'Actual Remaining',
                    data: remainingData,
                    borderColor: 'rgb(255, 159, 64)',
                    backgroundColor: 'rgba(255, 159, 64, 0.1)',
                    tension: 0.1
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    title: {
                        display: true,
                        text: 'Sprint Burn Down Chart'
                    },
                    legend: {
                        position: 'top',
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        title: {
                            display: true,
                            text: 'Story Points Remaining'
                        }
                    },
                    x: {
                        title: {
                            display: true,
                            text: 'Date'
                        }
                    }
                }
            }
        });
    }
    
    SprintTodoApp.prototype.renderVelocityChart = function(sprint) {
        const ctx = document.getElementById('velocity-chart');
        if (!ctx) return;
        
        // Destroy existing chart if it exists
        if (this.velocityChart) {
            this.velocityChart.destroy();
        }
        
        // Calculate velocity for this sprint
        const tasks = this.getTasksBySprint(sprint.id);
        const completedPoints = tasks
            .filter(task => task.status === 'done')
            .reduce((sum, task) => sum + task.points, 0);
        
        // Get previous sprints for comparison
        const previousSprints = this.sprints
            .filter(s => s.id !== sprint.id && s.status === 'completed')
            .slice(-5); // Last 5 sprints
        
        const previousVelocities = previousSprints.map(s => {
            const sTasks = this.getTasksBySprint(s.id);
            return sTasks
                .filter(task => task.status === 'done')
                .reduce((sum, task) => sum + task.points, 0);
        });
        
        this.velocityChart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: previousSprints.map(s => s.name).concat([sprint.name]),
                datasets: [{
                    label: 'Velocity (Story Points)',
                    data: [...previousVelocities, completedPoints],
                    backgroundColor: [
                        'rgba(54, 162, 235, 0.5)',
                        'rgba(54, 162, 235, 0.5)',
                        'rgba(54, 162, 235, 0.5)',
                        'rgba(54, 162, 235, 0.5)',
                        'rgba(54, 162, 235, 0.5)',
                        'rgba(75, 192, 192, 0.5)'
                    ],
                    borderColor: [
                        'rgb(54, 162, 235)',
                        'rgb(54, 162, 235)',
                        'rgb(54, 162, 235)',
                        'rgb(54, 162, 235)',
                        'rgb(54, 162, 235)',
                        'rgb(75, 192, 192)'
                    ],
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    title: {
                        display: true,
                        text: 'Sprint Velocity'
                    },
                    legend: {
                        position: 'top',
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        title: {
                            display: true,
                            text: 'Story Points'
                        }
                    },
                    x: {
                        title: {
                            display: true,
                            text: 'Sprint'
                        }
                    }
                }
            }
        });
    }

    // Modal Management
    SprintTodoApp.prototype.openTaskModal = function(taskData) {
        console.log('openTaskModal called with taskData:', taskData);
        taskData = taskData || {};
        const modal = document.getElementById('task-modal');
        const form = document.getElementById('task-form');
        
        if (!modal) {
            console.error('Task modal not found');
            return;
        }
        
        if (!form) {
            console.error('Task form not found');
            return;
        }
        
        console.log('Modal and form found, proceeding...');
        
        // Save current scroll position
        const scrollY = window.scrollY;
        
        // Reset form
        form.reset();
        
        // Remove any existing folder selection
        const existingFolderGroup = document.getElementById('task-folder-group');
        if (existingFolderGroup) {
            existingFolderGroup.remove();
        }
        
        // Store the task ID in a data attribute for editing
        form.dataset.taskId = taskData.id || '';
        
        // Set task data if editing
        if (taskData.id) {
            document.getElementById('modal-title').textContent = 'Edit Task';
            const task = this.getTask(taskData.id);
            if (task) {
                document.getElementById('task-title').value = task.title;
                document.getElementById('task-description').value = task.description;
                document.getElementById('task-points').value = task.points;
                document.getElementById('task-priority').value = task.priority;
                document.getElementById('task-due-date').value = task.dueDate || '';
                document.getElementById('task-recurring').checked = task.recurring;
                document.getElementById('recurring-options').style.display = task.recurring ? 'block' : 'none';
                document.getElementById('recurring-type').value = task.recurringType || '';
            }
        } else {
            document.getElementById('modal-title').textContent = 'Create Task';
        }
        
        // Restore scroll position after modal opens
        setTimeout(() => {
            window.scrollTo(0, scrollY);
        }, 0);
        
        // Set sprint options
        const sprintSelect = document.getElementById('task-sprint');
        if (sprintSelect) {
            sprintSelect.innerHTML = '<option value="">No Sprint</option>';
            this.sprints.forEach(sprint => {
                const option = document.createElement('option');
                option.value = sprint.id;
                option.textContent = sprint.name;
                sprintSelect.appendChild(option);
            });
            
            // Set the current sprint selection AFTER populating the dropdown
            if (taskData.id) {
                const task = this.getTask(taskData.id);
                if (task) {
                    sprintSelect.value = task.sprintId || '';
                }
            } else if (taskData.sprintId) {
                // Set sprint selection if provided in taskData (for "Add Task to Sprint" button)
                sprintSelect.value = taskData.sprintId;
            }
        }
        
        // Add folder selection if folderId is provided
        if (taskData.folderId) {
            const folderGroup = document.createElement('div');
            folderGroup.className = 'form-group';
            folderGroup.id = 'task-folder-group';
            folderGroup.innerHTML = `
                <label for="task-folder">Folder</label>
                <select id="task-folder">
                    <option value="">No Folder</option>
                    ${this.folders.map(folder =>
                        `<option value="${folder.id}" ${taskData.folderId === folder.id ? 'selected' : ''}>${folder.name}</option>`
                    ).join('')}
                </select>
            `;
            
            // Insert folder selection before the recurring task checkbox
            const recurringGroup = document.querySelector('#recurring-options').parentElement;
            recurringGroup.parentNode.insertBefore(folderGroup, recurringGroup);
            
            // Set the folder ID on the form so the submission handler can find it
            form.dataset.folderId = taskData.folderId;
        } else {
            // Ensure no folder ID is set on the form
            form.dataset.folderId = '';
        }
        
        modal.classList.add('active');
    }

    SprintTodoApp.prototype.openSprintModal = function(sprintData) {
        sprintData = sprintData || {};
        const modal = document.getElementById('sprint-modal');
        const form = document.getElementById('sprint-form');
        
        // Reset form
        form.reset();
        
        // Set sprint data if editing
        if (sprintData.id) {
            document.getElementById('sprint-modal-title').textContent = 'Edit Sprint';
            const sprint = this.getSprint(sprintData.id);
            if (sprint) {
                document.getElementById('sprint-name').value = sprint.name;
                document.getElementById('sprint-start-date').value = sprint.startDate;
                document.getElementById('sprint-end-date').value = sprint.endDate;
                document.getElementById('sprint-duration').value = sprint.duration;
            }
        } else {
            document.getElementById('sprint-modal-title').textContent = 'Create Sprint';
        }
        
        modal.classList.add('active');
    }

    SprintTodoApp.prototype.openEmailModal = function() {
        const modal = document.getElementById('email-modal');
        const form = document.getElementById('email-form');
        
        // Reset form
        form.reset();
        
        // Set sprint options
        const sprintSelect = document.getElementById('email-task-sprint');
        if (sprintSelect) {
            sprintSelect.innerHTML = '<option value="">No Sprint</option>';
            this.sprints.forEach(sprint => {
                const option = document.createElement('option');
                option.value = sprint.id;
                option.textContent = sprint.name;
                sprintSelect.appendChild(option);
            });
        }
        
        modal.classList.add('active');
    }

    SprintTodoApp.prototype.createTaskFromEmail = function() {
        const subject = document.getElementById('email-subject').value;
        const content = document.getElementById('email-content').value;
        
        const taskData = {
            title: subject,
            description: content,
            points: parseInt(document.getElementById('email-task-points').value),
            priority: document.getElementById('email-task-priority').value,
            dueDate: document.getElementById('email-task-due-date').value,
            sprintId: document.getElementById('email-task-sprint').value || null
        };
        
        // Create task
        this.createTask(taskData);
        
        // Close modal and refresh UI
        this.closeModals();
        this.render();
        
        // Show success message
        this.showNotification('Task created from email successfully!');
    }

    SprintTodoApp.prototype.closeModals = function() {
        document.querySelectorAll('.modal').forEach(modal => {
            modal.classList.remove('active');
        });
    }


    SprintTodoApp.prototype.saveSprint = function() {
        const sprintData = {
            name: document.getElementById('sprint-name').value,
            startDate: document.getElementById('sprint-start-date').value,
            endDate: document.getElementById('sprint-end-date').value,
            duration: parseInt(document.getElementById('sprint-duration').value)
        };
        
        // Create or update sprint
        this.createSprint(sprintData);
        
        // Close modal and refresh UI
        this.closeModals();
        this.render();
        
        // Show success message
        this.showNotification('Sprint created successfully!');
    }

    // Drag and Drop
    SprintTodoApp.prototype.setupDragAndDrop = function() {
        document.addEventListener('dragstart', (e) => {
            if (e.target.classList.contains('task-item')) {
                this.draggedElement = e.target;
                this.draggedTask = this.getTask(e.target.dataset.taskId);
                e.target.classList.add('dragging');
                
                // Set drag image to the element itself for better visual feedback
                const dragImage = e.target.cloneNode(true);
                dragImage.style.opacity = '0.5';
                dragImage.style.position = 'absolute';
                dragImage.style.pointerEvents = 'none';
                dragImage.style.zIndex = '9999';
                document.body.appendChild(dragImage);
                
                // Set the custom drag image
                e.dataTransfer.setDragImage(dragImage, 0, 0);
                
                // Remove the temporary drag image after a short delay
                setTimeout(() => {
                    if (dragImage.parentNode) {
                        dragImage.parentNode.removeChild(dragImage);
                    }
                }, 0);
            }
        });
        
        document.addEventListener('dragend', (e) => {
            if (e.target.classList.contains('task-item')) {
                e.target.classList.remove('dragging');
            }
            
            // Clean up all drag indicators
            document.querySelectorAll('.drag-over').forEach(el => {
                el.classList.remove('drag-over');
            });
            document.querySelectorAll('.drop-indicator').forEach(el => {
                el.remove();
            });
        });
        
        document.addEventListener('dragover', (e) => {
            e.preventDefault();
            const columnContent = e.target.closest('.column-content');
            if (columnContent && this.draggedElement) {
                columnContent.classList.add('drag-over');
                
                // Show drop indicator within the column
                this.showDropIndicator(columnContent, e);
            }
        });
        
        document.addEventListener('dragleave', (e) => {
            const columnContent = e.target.closest('.column-content');
            if (columnContent) {
                columnContent.classList.remove('drag-over');
                
                // Remove drop indicator when leaving column
                const indicator = columnContent.querySelector('.drop-indicator');
                if (indicator) {
                    indicator.remove();
                }
            }
        });
        
        document.addEventListener('drop', (e) => {
            e.preventDefault();
            const columnContent = e.target.closest('.column-content');
            if (columnContent && this.draggedElement && this.draggedTask) {
                columnContent.classList.remove('drag-over');
                
                // Remove drop indicator
                const indicator = columnContent.querySelector('.drop-indicator');
                if (indicator) {
                    indicator.remove();
                }
                
                // Check if this is a same-column reorder or cross-column status change
                const newStatus = columnContent.dataset.status;
                const isSameColumn = this.draggedTask.status === newStatus;
                
                if (isSameColumn) {
                    // Handle same-column reordering
                    this.handleSameColumnReorder(columnContent, e);
                } else {
                    // Handle cross-column status change
                    const sprintId = this.currentSprint ? this.currentSprint.id :
                        document.getElementById('sprint-selector').value;
                    
                    if (sprintId) {
                        this.updateTask(this.draggedTask.id, {
                            status: newStatus,
                            sprintId: sprintId
                        });
                        
                        // Refresh the board
                        this.renderSprintBoard();
                    }
                }
            }
        });
    }
    
    // Handle task reordering within the same column
    SprintTodoApp.prototype.handleSameColumnReorder = function(columnContent, event) {
        if (!this.draggedTask || !this.draggedElement) return;
        
        // Get all task elements in this column, excluding the dragged element
        const taskElements = Array.from(columnContent.querySelectorAll('.task-item')).filter(el => el !== this.draggedElement);
        let targetElement = null;
        let insertBefore = false;
        
        if (taskElements.length === 0) {
            // No other tasks in this column, nothing to reorder
            return;
        }
        
        // Find the target element and determine insert position
        for (let element of taskElements) {
            const rect = element.getBoundingClientRect();
            const midpoint = rect.top + rect.height / 2;
            
            if (event.clientY < midpoint) {
                targetElement = element;
                insertBefore = true;
                break;
            }
        }
        
        // If no target element found, insert at the end
        if (!targetElement) {
            targetElement = taskElements[taskElements.length - 1];
            insertBefore = false;
        }
        
        if (targetElement) {
            const targetTask = this.getTask(targetElement.dataset.taskId);
            if (targetTask) {
                console.log('Reordering tasks within same column:', {
                    draggedTask: this.draggedTask.title,
                    targetTask: targetTask.title,
                    insertBefore: insertBefore
                });
                
                // Reorder tasks in the data model
                this.reorderSprintBoardTasks(this.draggedTask, targetTask, insertBefore);
            }
        }
    }
    
    // Show drop indicator for better visual feedback
    SprintTodoApp.prototype.showDropIndicator = function(columnContent, event) {
        // Remove existing indicator
        const existingIndicator = columnContent.querySelector('.drop-indicator');
        if (existingIndicator) {
            existingIndicator.remove();
        }
        
        // Get all task elements in this column (excluding the dragged element)
        const taskElements = Array.from(columnContent.querySelectorAll('.task-item')).filter(el => el !== this.draggedElement);
        
        if (taskElements.length === 0) {
            // No other tasks, show indicator at the bottom
            const indicator = document.createElement('div');
            indicator.className = 'drop-indicator';
            indicator.style.cssText = `
                width: 100%;
                height: 3px;
                background-color: #007bff;
                margin: 8px 0;
                border-radius: 2px;
                animation: pulse 1s infinite;
            `;
            columnContent.appendChild(indicator);
            return;
        }
        
        // Find the best position for the indicator - improved positioning
        let bestElement = null;
        let bestPosition = null;
        let bestDistance = Infinity;
        
        for (let element of taskElements) {
            const rect = element.getBoundingClientRect();
            const columnRect = columnContent.getBoundingClientRect();
            const elementTop = rect.top - columnRect.top;
            const elementBottom = rect.bottom - columnRect.top;
            const elementMidpoint = elementTop + rect.height / 2;
            const elementQuarter = elementTop + rect.height / 4; // Quarter point for more precise positioning
            
            // Calculate distance from cursor to different points
            const distanceToMidpoint = Math.abs(event.clientY - (columnRect.top + elementMidpoint));
            const distanceToQuarter = Math.abs(event.clientY - (columnRect.top + elementQuarter));
            
            // Use quarter point for more precise positioning
            if (event.clientY < (columnRect.top + elementQuarter)) {
                if (distanceToQuarter < bestDistance) {
                    bestElement = element;
                    bestPosition = 'top';
                    bestDistance = distanceToQuarter;
                }
            }
        }
        
        // If no element found above cursor, place at the bottom
        if (!bestElement) {
            bestElement = taskElements[taskElements.length - 1];
            bestPosition = 'bottom';
        }
        
        // Create and insert the indicator
        const indicator = document.createElement('div');
        indicator.className = 'drop-indicator';
        indicator.style.cssText = `
            width: 100%;
            height: 3px;
            background-color: #007bff;
            border-radius: 2px;
            animation: pulse 1s infinite;
        `;
        
        if (bestPosition === 'top') {
            columnContent.insertBefore(indicator, bestElement);
        } else {
            columnContent.insertBefore(indicator, bestElement.nextSibling);
        }
    }
    
    // Reorder tasks within the sprint board
    SprintTodoApp.prototype.reorderSprintBoardTasks = function(draggedTask, targetTask, insertBefore) {
        // Get all tasks for the current sprint
        const sprintId = this.currentSprint ? this.currentSprint.id :
            document.getElementById('sprint-selector').value;
        
        if (!sprintId) return;
        
        const allTasks = this.getFlatTasksForSprintBoard(sprintId);
        const statusTasks = allTasks.filter(task => task.status === draggedTask.status);
        
        // Find indices in the status-specific array
        const draggedIndex = statusTasks.findIndex(task => task.id === draggedTask.id);
        const targetIndex = statusTasks.findIndex(task => task.id === targetTask.id);
        
        if (draggedIndex === -1 || targetIndex === -1) return;
        
        console.log('Reordering sprint board tasks:', {
            draggedTask: draggedTask.title,
            targetTask: targetTask.title,
            insertBefore: insertBefore,
            draggedIndex: draggedIndex,
            targetIndex: targetIndex
        });
        
        // Create a copy of the original status tasks for reference
        const originalStatusTasks = [...statusTasks];
        
        // Create a new array to avoid modifying the original during iteration
        const newStatusTasks = [...statusTasks];
        
        // Remove the dragged task from its current position
        newStatusTasks.splice(draggedIndex, 1);
        
        // Calculate the new position more precisely
        let newIndex;
        if (insertBefore) {
            // Insert before the target task
            if (draggedIndex < targetIndex) {
                // Moving forward: target index shifts left by 1 after removal
                newIndex = targetIndex - 1;
            } else {
                // Moving backward: target index stays the same
                newIndex = targetIndex;
            }
        } else {
            // Insert after the target task
            if (draggedIndex < targetIndex) {
                // Moving forward: target index stays the same
                newIndex = targetIndex + 1;
            } else {
                // Moving backward: target index stays the same
                newIndex = targetIndex + 1;
            }
        }
        
        // Insert the dragged task at the new position
        newStatusTasks.splice(newIndex, 0, originalStatusTasks[draggedIndex]);
        
        // Update manual order for all tasks in this status to preserve the new ordering
        newStatusTasks.forEach((task, index) => {
            const fullTask = this.getTask(task.id);
            if (fullTask) {
                fullTask.manualOrder = index;
                console.log(`Updated task ${fullTask.title} manualOrder to ${index}`);
            }
        });
        
        // Save data and refresh
        this.saveData();
        this.renderSprintBoard();
        
        console.log('Reordering completed successfully');
    }

    // Backlog Task Table Drag and Drop
    SprintTodoApp.prototype.setupBacklogTaskTableDragAndDrop = function() {
        const taskTableBody = document.getElementById('task-table-body');
        if (!taskTableBody) return;

        // Reset instance variables
        this.draggedElement = null;
        this.draggedTask = null;
        this.draggedIndex = -1;

        // Handle drag start
        taskTableBody.addEventListener('dragstart', (e) => {
            const taskRow = e.target.closest('.task-table-row');
            console.log('Drag start event:', {
                target: e.target,
                taskRow: taskRow,
                hasTaskId: taskRow && taskRow.dataset.taskId,
                isSubtask: taskRow && taskRow.classList.contains('subtask-row'),
                taskRowHtml: taskRow ? taskRow.outerHTML.substring(0, 200) : 'null'
            });
            
            if (taskRow && taskRow.dataset.taskId) {
                this.draggedElement = taskRow;
                this.draggedTask = this.getTask(taskRow.dataset.taskId);
                
                // Find the actual index in the tasks array, not just DOM position
                this.draggedIndex = this.tasks.findIndex(t => t.id === taskRow.dataset.taskId);
                
                console.log('Drag started:', {
                    taskId: taskRow.dataset.taskId,
                    taskTitle: this.draggedTask ? this.draggedTask.title : 'null',
                    draggedIndex: this.draggedIndex,
                    domIndex: Array.from(taskTableBody.children).indexOf(taskRow),
                    isSubtask: taskRow.classList.contains('subtask-row')
                });
                
                taskRow.classList.add('dragging');
                e.dataTransfer.effectAllowed = 'move';
                e.dataTransfer.setData('text/html', taskRow.innerHTML);
            } else {
                console.log('Drag start failed - no valid task row found');
            }
        });

        // Handle drag end
        taskTableBody.addEventListener('dragend', (e) => {
            if (this.draggedElement) {
                this.draggedElement.classList.remove('dragging');
                this.draggedElement = null;
                this.draggedTask = null;
                this.draggedIndex = -1;
            }
            // Clear all drag over styles
            taskTableBody.querySelectorAll('.drag-over').forEach(row => {
                row.classList.remove('drag-over');
            });
        });

        // Handle drag over
        taskTableBody.addEventListener('dragover', (e) => {
            e.preventDefault();
            e.dataTransfer.dropEffect = 'move';

            const taskRow = e.target.closest('.task-table-row');
            if (taskRow && taskRow !== this.draggedElement && taskRow.dataset.taskId) {
                const rect = taskRow.getBoundingClientRect();
                const midpoint = rect.top + rect.height / 2;
                
                // Clear previous drag over styles
                taskTableBody.querySelectorAll('.drag-over').forEach(row => {
                    row.classList.remove('drag-over');
                });

                // Add drag over style to current target
                taskRow.classList.add('drag-over');

                // Show visual feedback for drop position
                if (e.clientY < midpoint) {
                    taskRow.style.borderTop = '2px solid var(--primary-color)';
                    taskRow.style.borderBottom = 'none';
                } else {
                    taskRow.style.borderTop = 'none';
                    taskRow.style.borderBottom = '2px solid var(--primary-color)';
                }
            }
        });

        // Handle drag leave
        taskTableBody.addEventListener('dragleave', (e) => {
            const taskRow = e.target.closest('.task-table-row');
            if (taskRow) {
                taskRow.classList.remove('drag-over');
                taskRow.style.borderTop = 'none';
                taskRow.style.borderBottom = 'none';
            }
        });

        // Handle drop
        taskTableBody.addEventListener('drop', (e) => {
            e.preventDefault();
            
            const taskRow = e.target.closest('.task-table-row');
            console.log('Drop event:', {
                hasTaskRow: !!taskRow,
                taskRowId: taskRow ? taskRow.dataset.taskId : 'null',
                draggedElementId: this.draggedElement ? this.draggedElement.dataset.taskId : 'null',
                draggedTask: this.draggedTask ? this.draggedTask.title : 'null',
                targetTask: taskRow ? this.getTask(taskRow.dataset.taskId)?.title : 'null',
                isDraggedSubtask: this.draggedElement && this.draggedElement.classList.contains('subtask-row'),
                isTargetSubtask: taskRow && taskRow.classList.contains('subtask-row')
            });
            
            if (taskRow && taskRow !== this.draggedElement && taskRow.dataset.taskId) {
                const targetTask = this.getTask(taskRow.dataset.taskId);
                // Find the actual index in the tasks array, not just DOM position
                const targetIndex = this.tasks.findIndex(t => t.id === taskRow.dataset.taskId);
                
                if (targetTask && this.draggedTask) {
                    const rect = taskRow.getBoundingClientRect();
                    const midpoint = rect.top + rect.height / 2;
                    const dropBefore = e.clientY < midpoint;
                    
                    console.log('Reordering tasks:', {
                        draggedTask: this.draggedTask.title,
                        targetTask: targetTask.title,
                        dropBefore: dropBefore,
                        draggedIndex: this.draggedIndex,
                        targetIndex: targetIndex,
                        domTargetIndex: Array.from(taskTableBody.children).indexOf(taskRow),
                        isDraggedSubtask: this.draggedElement.classList.contains('subtask-row'),
                        isTargetSubtask: taskRow.classList.contains('subtask-row')
                    });
                    
                    // Reorder tasks
                    this.reorderBacklogTasks(this.draggedTask, targetTask, dropBefore);
                }
            } else {
                console.log('Drop failed - invalid target or same element');
            }
            
            // Clear all drag styles
            taskTableBody.querySelectorAll('.drag-over').forEach(row => {
                row.classList.remove('drag-over');
            });
            taskTableBody.querySelectorAll('.task-table-row').forEach(row => {
                row.style.borderTop = 'none';
                row.style.borderBottom = 'none';
            });
        });
    }

    SprintTodoApp.prototype.reorderBacklogTasks = function(draggedTask, targetTask, dropBefore) {
        const draggedIndex = this.tasks.findIndex(t => t.id === draggedTask.id);
        const targetIndex = this.tasks.findIndex(t => t.id === targetTask.id);
        
        console.log('reorderBacklogTasks called:', {
            draggedTask: draggedTask.title,
            isSubtask: draggedTask.parentTaskId || draggedTask.isSubtask,
            targetTask: targetTask.title,
            isTargetSubtask: targetTask.parentTaskId || targetTask.isSubtask,
            dropBefore: dropBefore,
            draggedIndex: draggedIndex,
            targetIndex: targetIndex,
            totalTasks: this.tasks.length
        });
        
        if (draggedIndex === -1 || targetIndex === -1) {
            console.error('Invalid indices:', { draggedIndex, targetIndex });
            return;
        }
        
        // Handle subtask reordering specially
        const isDraggedSubtask = draggedTask.parentTaskId || draggedTask.isSubtask;
        const isTargetSubtask = targetTask.parentTaskId || targetTask.isSubtask;
        
        if (isDraggedSubtask && isTargetSubtask) {
            // Both are subtasks - reorder within subtasks array of parent
            const draggedParentId = draggedTask.parentTaskId;
            const targetParentId = targetTask.parentTaskId;
            
            if (draggedParentId === targetParentId) {
                // Same parent - reorder within parent's subtasks
                const parentTask = this.getTask(draggedParentId);
                if (parentTask && parentTask.subtasks) {
                    const draggedSubtaskIndex = parentTask.subtasks.findIndex(st => st.id === draggedTask.id);
                    const targetSubtaskIndex = parentTask.subtasks.findIndex(st => st.id === targetTask.id);
                    
                    if (draggedSubtaskIndex !== -1 && targetSubtaskIndex !== -1) {
                        // Remove dragged subtask
                        const [removedSubtask] = parentTask.subtasks.splice(draggedSubtaskIndex, 1);
                        // Insert at new position
                        const newSubtaskIndex = dropBefore ? targetSubtaskIndex : targetSubtaskIndex + (draggedSubtaskIndex < targetSubtaskIndex ? 0 : 1);
                        parentTask.subtasks.splice(newSubtaskIndex, 0, removedSubtask);
                        
                        // Update manual order for subtasks to preserve the new ordering
                        parentTask.subtasks.forEach((subtask, index) => {
                            subtask.manualOrder = index;
                        });
                        
                        console.log('Subtasks reordered within parent:', parentTask.title);
                        this.saveData();
                        this.refreshTaskTable();
                        return;
                    }
                }
            } else {
                // Different parents - move subtask between parents
                console.log('Moving subtask between different parents - not implemented yet');
                this.refreshTaskTable();
                return;
            }
        } else if (!isDraggedSubtask && !isTargetSubtask) {
            // Both are parent tasks - reorder in main tasks array
            // Remove the dragged task from its current position
            const [removedTask] = this.tasks.splice(draggedIndex, 1);
            
            // Insert it at the new position
            const newIndex = dropBefore ? targetIndex : targetIndex + (draggedIndex < targetIndex ? 0 : 1);
            this.tasks.splice(newIndex, 0, removedTask);
            
            // Update manual order for all tasks to preserve the new ordering
            this.tasks.forEach((task, index) => {
                task.manualOrder = index;
            });
            
            console.log('Parent tasks reordered. New order:', this.tasks.map(t => t.title));
        } else {
            // Mixed - one is subtask, one is parent
            console.log('Mixed drag and drop (subtask with parent) - not implemented yet');
            this.refreshTaskTable();
            return;
        }
        
        this.saveData();
        this.refreshTaskTable();
    }
    
    SprintTodoApp.prototype.refreshTaskTable = function() {
        // Refresh the task table
        const activeFolder = document.querySelector('.folder-item.active');
        if (activeFolder) {
            const folderId = activeFolder.dataset.folderId || 'all';
            this.renderTasks(folderId);
        }
    }

    // Folder Drag and Drop
    SprintTodoApp.prototype.setupFolderDragAndDrop = function() {
        const folderSidebar = document.querySelector('.folder-sidebar');
        if (!folderSidebar) return;

        let draggedElement = null;
        let draggedFolderId = null;

        // Handle drag start
        folderSidebar.addEventListener('dragstart', (e) => {
            const folderItem = e.target.closest('.folder-item');
            if (folderItem && folderItem.dataset.folderId) {
                draggedElement = folderItem;
                draggedFolderId = folderItem.dataset.folderId;
                folderItem.classList.add('dragging');
                e.dataTransfer.effectAllowed = 'move';
                e.dataTransfer.setData('text/html', folderItem.innerHTML);
            }
        });

        // Handle drag end
        folderSidebar.addEventListener('dragend', (e) => {
            if (draggedElement) {
                draggedElement.classList.remove('dragging');
                draggedElement = null;
                draggedFolderId = null;
            }
            // Clear all drag over styles
            folderSidebar.querySelectorAll('.drag-over').forEach(folder => {
                folder.classList.remove('drag-over');
            });
        });

        // Handle drag over
        folderSidebar.addEventListener('dragover', (e) => {
            e.preventDefault();
            e.dataTransfer.dropEffect = 'move';

            const folderItem = e.target.closest('.folder-item');
            if (folderItem && folderItem !== draggedElement && folderItem.dataset.folderId) {
                const rect = folderItem.getBoundingClientRect();
                const midpoint = rect.top + rect.height / 2;
                
                // Clear previous drag over styles
                folderSidebar.querySelectorAll('.drag-over').forEach(folder => {
                    folder.classList.remove('drag-over');
                });

                // Add drag over style to current target
                folderItem.classList.add('drag-over');

                // Show visual feedback for drop position
                if (e.clientY < midpoint) {
                    folderItem.style.borderTop = '2px solid var(--primary-color)';
                    folderItem.style.borderBottom = 'none';
                } else {
                    folderItem.style.borderTop = 'none';
                    folderItem.style.borderBottom = '2px solid var(--primary-color)';
                }
            }
        });

        // Handle drag leave
        folderSidebar.addEventListener('dragleave', (e) => {
            const folderItem = e.target.closest('.folder-item');
            if (folderItem) {
                folderItem.classList.remove('drag-over');
                folderItem.style.borderTop = 'none';
                folderItem.style.borderBottom = 'none';
            }
        });

        // Handle drop
        folderSidebar.addEventListener('drop', (e) => {
            e.preventDefault();
            
            const folderItem = e.target.closest('.folder-item');
            if (folderItem && folderItem !== draggedElement && folderItem.dataset.folderId) {
                const targetFolderId = folderItem.dataset.folderId;
                const rect = folderItem.getBoundingClientRect();
                const midpoint = rect.top + rect.height / 2;
                const dropBefore = e.clientY < midpoint;
                
                // Reorder folders
                this.reorderFolders(draggedFolderId, targetFolderId, dropBefore);
            }
            
            // Clear all drag styles
            folderSidebar.querySelectorAll('.drag-over').forEach(folder => {
                folder.classList.remove('drag-over');
            });
            folderSidebar.querySelectorAll('.folder-item').forEach(folder => {
                folder.style.borderTop = 'none';
                folder.style.borderBottom = 'none';
            });
        });
    }

    SprintTodoApp.prototype.reorderFolders = function(draggedFolderId, targetFolderId, dropBefore) {
        // Handle special case for "All Tasks" folder (always stays at top)
        if (targetFolderId === 'all') {
            return; // Don't allow reordering above "All Tasks"
        }

        const draggedIndex = this.folders.findIndex(f => f.id === draggedFolderId);
        const targetIndex = this.folders.findIndex(f => f.id === targetFolderId);
        
        if (draggedIndex === -1 || targetIndex === -1) return;
        
        // Remove the dragged folder from its current position
        const [removedFolder] = this.folders.splice(draggedIndex, 1);
        
        // Insert it at the new position
        const newIndex = dropBefore ? targetIndex : targetIndex + (draggedIndex < targetIndex ? 0 : 1);
        this.folders.splice(newIndex, 0, removedFolder);
        
        this.saveData();
        
        // Refresh the folder sidebar
        this.renderFolders();
        
        // Refresh tasks to maintain current view
        const activeFolder = document.querySelector('.folder-item.active');
        if (activeFolder) {
            const folderId = activeFolder.dataset.folderId || 'all';
            this.renderTasks(folderId);
        }
    }

    // Utility Methods
    SprintTodoApp.prototype.updateSprintStatuses = function() {
        const today = new Date();
        
        this.sprints.forEach(sprint => {
            const startDate = new Date(sprint.startDate);
            const endDate = new Date(sprint.endDate);
            
            let newStatus = sprint.status;
            
            if (today < startDate) {
                newStatus = 'upcoming';
            } else if (today >= startDate && today <= endDate) {
                newStatus = 'active';
            } else {
                newStatus = 'completed';
            }
            
            if (newStatus !== sprint.status) {
                this.updateSprint(sprint.id, { status: newStatus });
            }
        });
    }

    SprintTodoApp.prototype.toggleFolder = function(folderId) {
        const folderElement = document.querySelector(`[data-folder-id="${folderId}"]`);
        if (!folderElement) return;

        // Toggle class
        folderElement.classList.toggle('collapsed');

        // Persist state (true = collapsed)
        const isCollapsed = folderElement.classList.contains('collapsed');
        this.folderStates[folderId] = isCollapsed;
        localStorage.setItem('sprint-todo-folder-states', JSON.stringify(this.folderStates));

        // Update chevron
        const icon = folderElement.querySelector('.folder-toggle');
        if (icon) {
            icon.className = `fas fa-chevron-${isCollapsed ? 'right' : 'down'} folder-toggle`;
        }
    };

    SprintTodoApp.prototype.showInlineTaskForm = function(folderId) {
        const form = document.getElementById('inline-task-form');
        const titleInput = document.getElementById('inline-task-title');
        
        // Set the folder ID in a data attribute
        form.dataset.folderId = folderId || '';
        
        // Show the form
        form.style.display = 'block';
        
        // Focus on the title input
        titleInput.focus();
        
        // Reset the form
        document.getElementById('inline-task-form-element').reset();
    }


    SprintTodoApp.prototype.createQuickTask = function(inputElement, folderId) {
        const taskTitle = inputElement.value.trim();
        if (!taskTitle) return;
        
        // Capture scroll position and focused element before any changes
        const container = document.getElementById('backlog-container');
        const scrollY = container ? container.scrollTop : window.scrollY;
        const activeElement = document.activeElement;
        
        console.log('createQuickTask: Capturing scroll position:', scrollY);
        
        // Create the task
        const taskData = {
            title: taskTitle,
            points: 1,
            priority: 'medium',
            folderId: folderId
        };
        this.createTask(taskData);
        inputElement.value = '';
        
        // Store scroll position for restoration
        this.pendingScrollRestore = { scrollY, activeElement, container };
        
        // Use the improved render method that prevents scroll jump
        this.render();
        
        // Use requestAnimationFrame for better timing to restore scroll position
        requestAnimationFrame(() => {
            if (this.pendingScrollRestore && this.pendingScrollRestore.scrollY > 0) {
                if (this.pendingScrollRestore.container) {
                    this.pendingScrollRestore.container.scrollTop = this.pendingScrollRestore.scrollY;
                    // Fallback to window scroll if container scroll doesn't work
                    if (this.pendingScrollRestore.container.scrollTop !== this.pendingScrollRestore.scrollY) {
                        window.scrollTo(0, this.pendingScrollRestore.scrollY);
                    }
                } else {
                    window.scrollTo(0, this.pendingScrollRestore.scrollY);
                }
                
                if (this.pendingScrollRestore.activeElement && this.pendingScrollRestore.activeElement.tagName === 'INPUT') {
                    this.pendingScrollRestore.activeElement.focus();
                }
                this.pendingScrollRestore = null;
            }
        });
        
        // Show success message
        this.showNotification('Task created successfully!');
    }


    SprintTodoApp.prototype.setupContextMenu = function() {
        const contextMenu = document.getElementById('context-menu');
        
        // Right-click on task items
        document.addEventListener('contextmenu', (e) => {
            const taskElement = e.target.closest('.task-item');
            if (taskElement) {
                e.preventDefault();
                this.contextMenuTaskId = taskElement.dataset.taskId;
                this.showContextMenu(e.clientX, e.clientY);
            }
        });
        
        // Hide context menu when clicking elsewhere
        document.addEventListener('click', () => {
            this.hideContextMenu();
        });
        
        // Hide context menu when pressing Escape
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.hideContextMenu();
            }
        });
    }

    SprintTodoApp.prototype.showContextMenu = function(x, y) {
        const contextMenu = document.getElementById('context-menu');
        
        // Position the context menu
        contextMenu.style.left = `${x}px`;
        contextMenu.style.top = `${y}px`;
        
        // Ensure the menu stays within viewport
        const rect = contextMenu.getBoundingClientRect();
        if (rect.right > window.innerWidth) {
            contextMenu.style.left = `${x - rect.width}px`;
        }
        if (rect.bottom > window.innerHeight) {
            contextMenu.style.top = `${y - rect.height}px`;
        }
        
        // Show the menu
        contextMenu.style.display = 'block';
    }

    SprintTodoApp.prototype.hideContextMenu = function() {
        const contextMenu = document.getElementById('context-menu');
        contextMenu.style.display = 'none';
        this.contextMenuTaskId = null;
    }

    SprintTodoApp.prototype.assignToSprint = function() {
        if (!this.contextMenuTaskId) return;
        
        const task = this.getTask(this.contextMenuTaskId);
        if (!task) return;
        
        // Get available sprints
        const availableSprints = this.sprints.filter(sprint =>
            sprint.status === 'upcoming' || sprint.status === 'active'
        );
        
        if (availableSprints.length === 0) {
            this.showNotification('No available sprints. Create a sprint first.', 'warning');
            return;
        }
        
        // If only one sprint, assign directly
        if (availableSprints.length === 1) {
            this.updateTask(this.contextMenuTaskId, {
                sprintId: availableSprints[0].id,
                status: 'todo'
            });
            this.showNotification(`Task assigned to ${availableSprints[0].name}`);
            this.render();
            return;
        }
        
        // Show sprint selection dialog
        this.showSprintSelectionDialog(availableSprints);
    }

    SprintTodoApp.prototype.showSprintSelectionDialog = function(sprints) {
        const dialog = document.createElement('div');
        dialog.className = 'sprint-selection-dialog';
        dialog.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: white;
            padding: 2rem;
            border-radius: 8px;
            box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
            z-index: 1003;
            max-width: 400px;
            width: 90%;
        `;
        
        // Create sprint selection items with inline onclick handlers
        const sprintItems = sprints.map(sprint => `
            <div class="sprint-option" style="padding: 0.75rem; border: 1px solid #eee; margin-bottom: 0.5rem; border-radius: 4px; cursor: pointer; background-color: #f9f9f9;"
                 onmouseover="this.style.backgroundColor='#f0f8ff'"
                 onmouseout="this.style.backgroundColor='#f9f9f9'"
                 onclick="window.app.confirmSprintAssignment('${sprint.id}'); window.app.hideContextMenu(); document.body.removeChild(this.closest('.sprint-selection-dialog'))">
                <div style="font-weight: 600;">${sprint.name}</div>
                <div style="font-size: 0.9rem; color: #666;">
                    ${new Date(sprint.startDate).toLocaleDateString()} - ${new Date(sprint.endDate).toLocaleDateString()}
                </div>
            </div>
        `).join('');
        
        dialog.innerHTML = `
            <h3 style="margin-bottom: 1rem;">Select Sprint</h3>
            <div style="margin-bottom: 1.5rem;">
                ${sprintItems}
            </div>
            <button class="cancel-btn" style="background: #ccc; border: none; padding: 0.5rem 1rem; border-radius: 4px; cursor: pointer;"
                    onclick="window.app.hideContextMenu(); document.body.removeChild(this.closest('.sprint-selection-dialog'))">
                Cancel
            </button>
        `;
        
        // Add dialog to DOM
        document.body.appendChild(dialog);
        
        // Close dialog when clicking outside
        setTimeout(() => {
            const closeDialog = (e) => {
                if (e.target === dialog) {
                    this.hideContextMenu();
                    document.body.removeChild(dialog);
                    document.removeEventListener('click', closeDialog);
                }
            };
            document.addEventListener('click', closeDialog);
        }, 100);
    }

    SprintTodoApp.prototype.confirmSprintAssignment = function(sprintId) {
        if (!this.contextMenuTaskId) return;
        
        const sprint = this.getSprint(sprintId);
        if (!sprint) return;
        
        // Update task
        this.updateTask(this.contextMenuTaskId, {
            sprintId: sprintId,
            status: 'todo'
        });
        
        this.showNotification(`Task assigned to ${sprint.name}`);
        this.render();
        this.hideContextMenu();
        
        // Remove dialog
        const dialog = document.querySelector('.sprint-selection-dialog');
        if (dialog) {
            document.body.removeChild(dialog);
        }
    }

    SprintTodoApp.prototype.editTaskFromMenu = function() {
        if (!this.contextMenuTaskId) return;
        this.editTask(this.contextMenuTaskId);
        this.hideContextMenu();
    }

    SprintTodoApp.prototype.deleteTaskFromMenu = function() {
        if (!this.contextMenuTaskId) return;
        this.deleteTask(this.contextMenuTaskId);
        this.hideContextMenu();
    }

    SprintTodoApp.prototype.assignTaskToSprint = function(taskId, sprintId) {
        console.log('assignTaskToSprint called:', { taskId, sprintId });
        if (!taskId) return;

        const task = this.getTask(taskId);
        if (!task) {
            console.error('Task not found:', taskId);
            return;
        }

        console.log('Task before assignment:', task);

        let newStatus;
        if (sprintId) {
            // Use the first status of the sprint board
            const statuses = this.getBoardStatuses();
            console.log('Available board statuses:', statuses);
            
            // Sort by order to get the first status
            const sortedStatuses = statuses.sort((a, b) => (a.order || 0) - (b.order || 0));
            console.log('Sorted board statuses:', sortedStatuses);
            
            newStatus = sortedStatuses.length > 0 ? sortedStatuses[0].id : 'todo';
            console.log('Selected new status:', newStatus);
        } else {
            newStatus = 'backlog';
        }

        console.log('Final updates to apply:', { sprintId: sprintId || null, status: newStatus });

        // Update the task object directly first to ensure immediate reflection
        const updates = { sprintId: sprintId || null, status: newStatus };
        Object.assign(task, updates, { updatedAt: new Date().toISOString() });
        
        console.log('Task after direct update:', task);

        // Then use updateTask method to save and trigger refreshes
        const updatedTask = this.updateTask(taskId, updates);
        
        console.log('Task after updateTask call:', updatedTask);

        if (updatedTask) {
            const sprint = sprintId ? this.getSprint(sprintId) : null;
            if (sprint) {
                this.showNotification(`Task assigned to ${sprint.name}`);
                
                // Update current sprint if this assignment is from the backlog
                if (this.currentView === 'backlog') {
                    this.currentSprint = sprint;
                    // Update sprint selector if it exists
                    const sprintSelector = document.getElementById('sprint-selector');
                    if (sprintSelector) {
                        sprintSelector.value = sprintId;
                    }
                }
            } else {
                this.showNotification('Task removed from sprint');
            }
            
            // Refresh the task table if we're in backlog view
            if (this.currentView === 'backlog') {
                const activeFolder = document.querySelector('.folder-item.active');
                if (activeFolder) {
                    const folderId = activeFolder.dataset.folderId || 'all';
                    this.renderTasks(folderId);
                }
            }
            
            // Always refresh the sprint board if we have a current sprint
            // This ensures tasks appear on the board when assigned from backlog
            if (this.currentSprint) {
                console.log('Refreshing sprint board for current sprint:', this.currentSprint.id);
                this.renderSprintBoard();
            }
        } else {
            console.error('Failed to update task:', taskId);
        }
    }

    SprintTodoApp.prototype.updateTaskPriority = function(taskId, priority) {
        if (!taskId || !priority) return;
        
        const task = this.getTask(taskId);
        if (!task) return;
        
        // Update task priority
        this.updateTask(taskId, { priority });
        
        // Show notification
        this.showNotification(`Task priority updated to ${priority}`);
        
        // Refresh the task table if we're in backlog view
        if (this.currentView === 'backlog') {
            const activeFolder = document.querySelector('.folder-item.active');
            if (activeFolder) {
                const folderId = activeFolder.dataset.folderId || 'all';
                this.renderTasks(folderId);
            }
        }
    }

    SprintTodoApp.prototype.updateTaskPoints = function(taskId, points) {
        if (!taskId || !points) return;
        
        const task = this.getTask(taskId);
        if (!task) return;
        
        // Update task points
        this.updateTask(taskId, { points: parseInt(points) });
        
        // Show notification
        this.showNotification(`Task points updated to ${points}`);
        
        // Refresh the task table if we're in backlog view
        if (this.currentView === 'backlog') {
            const activeFolder = document.querySelector('.folder-item.active');
            if (activeFolder) {
                const folderId = activeFolder.dataset.folderId || 'all';
                this.renderTasks(folderId);
            }
        }
    }

    SprintTodoApp.prototype.showNotification = function(message) {
        // Create a simple notification
        const notification = document.createElement('div');
        notification.className = 'notification';
        notification.textContent = message;
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background-color: var(--success-color);
            color: white;
            padding: 1rem;
            border-radius: var(--border-radius);
            box-shadow: var(--box-shadow);
            z-index: 1001;
            animation: slideIn 0.3s ease;
        `;
        
        document.body.appendChild(notification);
        
        // Remove after 3 seconds
        setTimeout(() => {
            notification.remove();
        }, 3000);
    }

    SprintTodoApp.prototype.toggleSubtasks = function(taskId) {
        console.log('toggleSubtasks called with taskId:', taskId);
        const task = this.getTask(taskId);
        if (!task) {
            console.log('Task not found:', taskId);
            return;
        }
        
        console.log('Task found:', task);
        
        // Toggle the expanded state
        task.expanded = task.expanded !== false ? false : true;
        console.log('Toggled expanded state:', task.expanded);
        
        // Save the change
        this.saveData();
        
        // Update the UI by re-rendering the task table
        const activeFolder = document.querySelector('.folder-item.active');
        if (activeFolder) {
            const folderId = activeFolder.dataset.folderId || 'all';
            this.renderTasks(folderId);
        }
        
        // Update the toggle button icon
        const toggleButton = document.querySelector(`[data-task-id="${taskId}"] .btn-toggle-subtasks i`);
        console.log('Toggle button:', toggleButton);
        if (toggleButton) {
            toggleButton.className = `fas fa-chevron-${task.expanded !== false ? 'down' : 'right'}`;
            console.log('Updated toggle button icon');
        }
    }

    SprintTodoApp.prototype.editTask = function(taskId) {
        const task = this.getTask(taskId);
        if (task) {
            this.openTaskModal(task);
        }
    }

    SprintTodoApp.prototype.deleteTask = function(taskId) {
        if (confirm('Are you sure you want to delete this task?')) {
            // Remove the task from the tasks array
            this.tasks = this.tasks.filter(t => t.id !== taskId);
            
            // Also remove any subtasks belonging to this task
            const subtasksToRemove = this.tasks.filter(t => t.parentTaskId === taskId);
            this.tasks = this.tasks.filter(t => t.parentTaskId !== taskId);
            
            this.saveData();
            
            // Refresh the task table if we're in backlog view
            if (this.currentView === 'backlog') {
                const activeFolder = document.querySelector('.folder-item.active');
                if (activeFolder) {
                    const folderId = activeFolder.dataset.folderId || 'all';
                    this.renderTasks(folderId);
                }
            }
            
            this.showNotification('Task deleted successfully!');
        }
    }

    SprintTodoApp.prototype.editSprint = function(sprintId) {
        const sprint = this.getSprint(sprintId);
        if (sprint) {
            this.openSprintModal(sprint);
        }
    }

    SprintTodoApp.prototype.deleteSprint = function(sprintId) {
        if (confirm('Are you sure you want to delete this sprint? Tasks will be moved to backlog.')) {
            // Move tasks from this sprint to backlog
            this.tasks.forEach(task => {
                if (task.sprintId === sprintId) {
                    task.sprintId = null;
                    task.status = 'backlog';
                }
            });
            
            // Remove the sprint
            this.sprints = this.sprints.filter(s => s.id !== sprintId);
            this.saveData();
            
            this.render();
            this.showNotification('Sprint deleted successfully!');
        }
    }

    SprintTodoApp.prototype.editFolder = function(folderId) {
        // Placeholder for folder editing
        console.log('Edit folder:', folderId);
    }

    SprintTodoApp.prototype.deleteFolder = function(folderId) {
        if (confirm('Are you sure you want to delete this folder? Tasks will be moved to unfiled.')) {
            // Move tasks from this folder to backlog
            this.tasks.forEach(task => {
                if (task.folderId === folderId) {
                    task.folderId = null;
                }
            });
            
            // Delete the folder
            this.folders = this.folders.filter(f => f.id !== folderId);
            
            // NEW: forget its persisted collapsed state
            delete this.folderStates[folderId];
            localStorage.setItem('sprint-todo-folder-states', JSON.stringify(this.folderStates));

            // Save and refresh
            this.saveData();
            this.render();
            this.showNotification('Folder deleted successfully!');
        }
    }

    SprintTodoApp.prototype.resetAllData = function() {
        if (confirm('Are you sure you want to reset ALL data? This will delete all tasks, sprints, and folders.')) {
            // Clear all arrays
            this.tasks = [];
            this.sprints = [];
            this.folders = [];
            this.boardStatuses = [];
            this.folderStates = {};
            
            // Clear localStorage
            localStorage.removeItem('sprint-todo-tasks');
            localStorage.removeItem('sprint-todo-sprints');
            localStorage.removeItem('sprint-todo-folders');
            localStorage.removeItem('sprint-todo-board-statuses');
            localStorage.removeItem('sprint-todo-folder-states');
            
            // Reset current state
            this.currentView = 'backlog';
            this.currentSprint = null;
            
            // Re-render the app
            this.render();
            this.showNotification('All data has been reset successfully!');
        }
    }

    SprintTodoApp.prototype.viewSprintBoard = function(sprintId) {
        console.log('viewSprintBoard called with sprintId:', sprintId);
        const sprint = this.getSprint(sprintId);
        if (!sprint) {
            console.error('Sprint not found:', sprintId);
            return;
        }
        
        this.currentSprint = sprint;
        document.getElementById('sprint-selector').value = sprintId;
        this.switchView('board');
        
        // Ensure the sprint board is rendered after switching views
        setTimeout(() => {
            this.renderSprintBoard();
        }, 100);
    }

    SprintTodoApp.prototype.showCreateFolderDialog = function() {
        const name = prompt('Enter folder name:');
        if (name) {
            this.createFolder({ name });
            this.showNotification('Folder created successfully!');
        }
    };


    SprintTodoApp.prototype.closeTaskModal = function() {
        const modal = document.getElementById('task-modal');
        modal.classList.remove('active');
    };

    SprintTodoApp.prototype.saveTask = function(taskData) {
        const taskId = taskData.id;
        
        if (taskId) {
            // Update existing task - check if sprint assignment changed and update status accordingly
            const existingTask = this.getTask(taskId);
            const sprintChanged = existingTask && existingTask.sprintId !== taskData.sprintId;
            
            // If sprint assignment changed, update status based on new sprint assignment
            if (sprintChanged && taskData.sprintId) {
                // Use the first status of the sprint board
                const statuses = this.getBoardStatuses();
                const sortedStatuses = statuses.sort((a, b) => (a.order || 0) - (b.order || 0));
                const newStatus = sortedStatuses.length > 0 ? sortedStatuses[0].id : 'todo';
                
                // Update taskData with the new status
                taskData.status = newStatus;
                
                console.log('Sprint assignment changed, updating status to:', newStatus);
            } else if (sprintChanged && !taskData.sprintId) {
                // Task removed from sprint, set to backlog
                taskData.status = 'backlog';
                console.log('Task removed from sprint, setting status to: backlog');
            }
            
            // Update existing task
            this.updateTask(taskId, taskData);
            this.showNotification('Task updated successfully!');
            
            // Refresh the current view
            if (this.currentView === 'backlog') {
                const activeFolder = document.querySelector('.folder-item.active');
                if (activeFolder) {
                    const folderId = activeFolder.dataset.folderId || 'all';
                    this.renderTasks(folderId);
                }
            } else if (this.currentView === 'board') {
                this.renderSprintBoard();
            }
        } else {
            // Create new task
            this.createTask(taskData);
            this.showNotification('Task created successfully!');
            
            // Refresh the current view
            if (this.currentView === 'backlog') {
                const activeFolder = document.querySelector('.folder-item.active');
                if (activeFolder) {
                    const folderId = activeFolder.dataset.folderId || 'all';
                    this.renderTasks(folderId);
                }
            }
        }
        
        this.closeTaskModal();
        // Reset the form to prevent duplicate submissions
        const taskForm = document.getElementById('task-form');
        if (taskForm) {
            taskForm.reset();
            taskForm.dataset.taskId = '';
        }
        
        // Only re-render if not already in the current view to avoid unnecessary refreshes
        if (this.currentView === 'sprints' || this.currentView === 'analysis') {
            this.render();
        }
    };

    SprintTodoApp.prototype.openInlineTaskForm = function() {
        const form = document.getElementById('inline-task-form');
        form.style.display = 'block';
        
        // Focus on title input
        document.getElementById('inline-task-title').focus();
        
        // Store current folder ID for task creation
        const activeFolder = document.querySelector('.folder-item.active');
        if (activeFolder) {
            form.dataset.folderId = activeFolder.dataset.folderId || 'all';
        }
    };

    SprintTodoApp.prototype.closeInlineTaskForm = function() {
        const form = document.getElementById('inline-task-form-element');
        if (form) {
            form.style.display = 'none';
            form.reset();
        }
    };

    SprintTodoApp.prototype.createInlineTask = function(taskData) {
        const folderId = taskData.folderId || null;
        const newTaskData = {
            title: taskData.title,
            description: taskData.description || '',
            points: parseInt(taskData.points) || 1,
            priority: taskData.priority || 'medium',
            dueDate: taskData.dueDate || null,
            folderId: folderId
        };
        
        this.createTask(newTaskData);
        this.closeInlineTaskForm();
        this.showNotification('Task created successfully!');
    };
    
    SprintTodoApp.prototype.showAddSubtaskDialog = function(parentTaskId) {
        const title = prompt('Enter subtask title:');
        if (title) {
            this.createSubtask(parentTaskId, { title });
            this.showNotification('Subtask created successfully!');
        }
    };

    // Sales Pipeline Methods
    SprintTodoApp.prototype.switchView = function(viewName) {
        console.log('switchView called with:', viewName);
        this.currentView = viewName;
        
        // Hide all views
        document.querySelectorAll('.view').forEach(view => {
            view.classList.remove('active');
        });
        
        // Show the requested view
        const targetView = document.getElementById(`${viewName}-view`);
        if (targetView) {
            targetView.classList.add('active');
            console.log(`Activated ${viewName} view`);
        } else {
            console.error(`View not found: ${viewName}-view`);
        }
        
        // Update navigation
        document.querySelectorAll('.nav-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        
        const activeNavBtn = document.querySelector(`[data-view="${viewName}"]`);
        if (activeNavBtn) {
            activeNavBtn.classList.add('active');
        }
        
        // Render the specific view
        switch(viewName) {
            case 'backlog':
                this.renderBacklog();
                break;
            case 'sprints':
                this.renderSprints();
                break;
            case 'board':
                this.renderSprintBoard();
                break;
            case 'analysis':
                this.renderAnalysis();
                break;
            case 'sales-backlog':
                this.renderSalesBacklog();
                break;
            case 'sales-pipeline':
                this.renderSalesPipeline();
                break;
        }
    };

    SprintTodoApp.prototype.renderSalesBacklog = function() {
        console.log('renderSalesBacklog called');
        
        // Clear existing content
        const salesBacklogView = document.getElementById('sales-backlog-view');
        if (!salesBacklogView) {
            console.error('Sales backlog view not found');
            return;
        }
        
        // Create sales backlog layout
        salesBacklogView.innerHTML = `
            <div class="sales-backlog-layout">
                <div class="sales-folder-sidebar">
                    <div class="sidebar-header">
                        <h3>Sales Backlog</h3>
                    </div>
                    <div class="sales-folder-list">
                        <div class="sales-folder-item active" data-folder="contacts">
                            <i class="fas fa-users"></i>
                            <span class="folder-name">Contacts</span>
                            <span class="folder-count">${this.getSalesContacts().length}</span>
                        </div>
                        <div class="sales-folder-item" data-folder="opportunities">
                            <i class="fas fa-briefcase"></i>
                            <span class="folder-name">Opportunities</span>
                            <span class="folder-count">${this.getSalesOpportunities().length}</span>
                        </div>
                    </div>
                    <div class="sales-actions" style="margin-top: 20px;">
                        <button class="btn-primary" onclick="app.showCreateSalesContactDialog()">
                            <i class="fas fa-user-plus"></i> Add Contact
                        </button>
                        <button class="btn-primary" onclick="app.showCreateSalesOpportunityDialog()">
                            <i class="fas fa-plus"></i> Add Opportunity
                        </button>
                    </div>
                </div>
                <div class="sales-main-content">
                    <div class="sales-header">
                        <h3 id="sales-current-folder">Contacts</h3>
                        <div class="sales-actions">
                            <button class="btn-secondary" onclick="app.exportSalesData()">
                                <i class="fas fa-download"></i> Export
                            </button>
                        </div>
                    </div>
                    <div class="sales-table-container">
                        <div class="sales-table-header">
                            <div>Name</div>
                            <div>Organization</div>
                            <div>Email</div>
                            <div>Phone</div>
                            <div>Value</div>
                            <div>Status</div>
                            <div>Actions</div>
                        </div>
                        <div class="sales-table-body" id="sales-items-container">
                            ${this.renderSalesItems('contacts')}
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        // Add event listeners for folder selection
        salesBacklogView.querySelectorAll('.sales-folder-item').forEach(item => {
            item.addEventListener('click', (e) => {
                const folder = e.currentTarget.dataset.folder;
                this.selectSalesFolder(folder);
            });
        });
    };

    SprintTodoApp.prototype.selectSalesFolder = function(folderName) {
        console.log('selectSalesFolder called with:', folderName);
        
        // Update active folder
        document.querySelectorAll('.sales-folder-item').forEach(item => {
            item.classList.remove('active');
        });
        
        const activeFolder = document.querySelector(`[data-folder="${folderName}"]`);
        if (activeFolder) {
            activeFolder.classList.add('active');
        }
        
        // Update header
        const header = document.getElementById('sales-current-folder');
        if (header) {
            header.textContent = folderName.charAt(0).toUpperCase() + folderName.slice(1);
        }
        
        // Render items
        const container = document.getElementById('sales-items-container');
        if (container) {
            container.innerHTML = this.renderSalesItems(folderName);
        }
    };

    SprintTodoApp.prototype.renderSalesItems = function(folderName) {
        console.log('renderSalesItems called with:', folderName);
        
        let items = [];
        if (folderName === 'contacts') {
            items = this.getSalesContacts();
        } else if (folderName === 'opportunities') {
            items = this.getSalesOpportunities();
        }
        
        if (items.length === 0) {
            return `
                <div class="empty-task-state">
                    <i class="fas fa-inbox"></i>
                    <p>No ${folderName} found</p>
                </div>
            `;
        }
        
        return items.map(item => {
            if (folderName === 'contacts') {
                return this.renderSalesContactItem(item);
            } else {
                return this.renderSalesOpportunityItem(item);
            }
        }).join('');
    };

    SprintTodoApp.prototype.renderSalesContactItem = function(contact) {
        return `
            <div class="sales-item" data-contact-id="${contact.id}">
                <div class="sales-col-name">${contact.name}</div>
                <div class="sales-col-organization">${contact.organization || '-'}</div>
                <div class="sales-col-email">${contact.email || '-'}</div>
                <div class="sales-col-phone">${contact.phone || '-'}</div>
                <div class="sales-col-value">-</div>
                <div class="sales-col-status">
                    <span class="badge bg-secondary">Active</span>
                </div>
                <div class="sales-col-actions">
                    <button class="sales-btn sales-btn-edit" onclick="app.editSalesContact('${contact.id}')">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="sales-btn sales-btn-delete" onclick="app.deleteSalesContact('${contact.id}')">
                        <i class="fas fa-trash"></i>
                    </button>
                    <button class="sales-btn sales-btn-assign" onclick="app.assignContactToOpportunity('${contact.id}')">
                        <i class="fas fa-link"></i>
                    </button>
                </div>
            </div>
        `;
    };

    SprintTodoApp.prototype.renderSalesOpportunityItem = function(opportunity) {
        const assignedContacts = opportunity.assignedContacts || [];
        const contactTags = assignedContacts.map(contactId => {
            const contact = this.getSalesContact(contactId);
            return contact ? `<span class="sales-contact-tag">${contact.name}</span>` : '';
        }).join('');
        
        return `
            <div class="sales-item" data-opportunity-id="${opportunity.id}">
                <div class="sales-col-name">${opportunity.title}</div>
                <div class="sales-col-organization">${opportunity.organization || '-'}</div>
                <div class="sales-col-email">${opportunity.email || '-'}</div>
                <div class="sales-col-phone">${opportunity.phone || '-'}</div>
                <div class="sales-col-value">$${opportunity.value || 0}</div>
                <div class="sales-col-status">
                    <span class="badge bg-primary">${opportunity.status || 'New'}</span>
                </div>
                <div class="sales-col-actions">
                    <button class="sales-btn sales-btn-edit" onclick="app.editSalesOpportunity('${opportunity.id}')">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="sales-btn sales-btn-delete" onclick="app.deleteSalesOpportunity('${opportunity.id}')">
                        <i class="fas fa-trash"></i>
                    </button>
                    <button class="sales-btn sales-btn-assign" onclick="app.assignOpportunityToPipeline('${opportunity.id}')">
                        <i class="fas fa-arrow-right"></i>
                    </button>
                </div>
            </div>
        `;
    };

    SprintTodoApp.prototype.getSalesContacts = function() {
        return this.tasks.filter(task => task.type === 'contact');
    };

    SprintTodoApp.prototype.getSalesOpportunities = function() {
        return this.tasks.filter(task => task.type === 'opportunity');
    };

    SprintTodoApp.prototype.getSalesContact = function(contactId) {
        return this.getSalesContacts().find(contact => contact.id === contactId);
    };

    SprintTodoApp.prototype.createSalesContact = function(contactData) {
        const contact = {
            id: Date.now().toString(),
            type: 'contact',
            name: contactData.name,
            organization: contactData.organization || '',
            email: contactData.email || '',
            phone: contactData.phone || '',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };
        
        this.tasks.push(contact);
        this.saveData();
        this.renderSalesBacklog();
        this.showNotification('Contact created successfully!');
        return contact;
    };

    SprintTodoApp.prototype.createSalesOpportunity = function(opportunityData) {
        const opportunity = {
            id: Date.now().toString(),
            type: 'opportunity',
            title: opportunityData.title,
            description: opportunityData.description || '',
            value: opportunityData.value || 0,
            organization: opportunityData.organization || '',
            email: opportunityData.email || '',
            phone: opportunityData.phone || '',
            status: 'new',
            assignedContacts: opportunityData.assignedContacts || [],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };
        
        this.tasks.push(opportunity);
        this.saveData();
        this.renderSalesBacklog();
        this.showNotification('Opportunity created successfully!');
        return opportunity;
    };

    SprintTodoApp.prototype.editSalesContact = function(contactId) {
        const contact = this.getSalesContact(contactId);
        if (!contact) return;
        
        const modal = document.getElementById('contact-modal');
        const form = document.getElementById('contact-form');
        
        // Populate form with existing data
        document.getElementById('contact-name').value = contact.name;
        document.getElementById('contact-organization').value = contact.organization;
        document.getElementById('contact-email').value = contact.email;
        document.getElementById('contact-phone').value = contact.phone;
        document.getElementById('contact-title').value = contact.title || '';
        document.getElementById('contact-notes').value = contact.notes || '';
        
        // Set modal title
        document.getElementById('contact-modal-title').textContent = 'Edit Contact';
        
        // Store contact ID for update
        form.dataset.contactId = contactId;
        
        // Show modal
        modal.classList.add('active');
        
        // Handle form submission
        form.onsubmit = (e) => {
            e.preventDefault();
            
            const contactData = {
                name: document.getElementById('contact-name').value,
                organization: document.getElementById('contact-organization').value,
                email: document.getElementById('contact-email').value,
                phone: document.getElementById('contact-phone').value,
                title: document.getElementById('contact-title').value,
                notes: document.getElementById('contact-notes').value,
                updatedAt: new Date().toISOString()
            };
            
            this.updateTask(contactId, contactData);
            this.closeContactModal();
            this.renderSalesBacklog();
            this.showNotification('Contact updated successfully!');
        };
    };

    SprintTodoApp.prototype.editSalesOpportunity = function(opportunityId) {
        const opportunity = this.getSalesOpportunities().find(o => o.id === opportunityId);
        if (!opportunity) return;
        
        const modal = document.getElementById('opportunity-modal');
        const form = document.getElementById('opportunity-form');
        
        // Populate form with existing data
        document.getElementById('opportunity-name').value = opportunity.title;
        document.getElementById('opportunity-description').value = opportunity.description;
        document.getElementById('opportunity-value').value = opportunity.value;
        document.getElementById('opportunity-currency').value = opportunity.currency || 'USD';
        document.getElementById('opportunity-close-date').value = opportunity.closeDate || '';
        document.getElementById('opportunity-probability').value = opportunity.probability || 50;
        
        // Populate contacts dropdown and select assigned contacts
        this.populateOpportunityContacts();
        const contactsSelect = document.getElementById('opportunity-contacts');
        if (opportunity.assignedContacts && opportunity.assignedContacts.length > 0) {
            Array.from(contactsSelect.options).forEach(option => {
                option.selected = opportunity.assignedContacts.includes(option.value);
            });
        }
        
        // Set modal title
        document.getElementById('opportunity-modal-title').textContent = 'Edit Opportunity';
        
        // Store opportunity ID for update
        form.dataset.opportunityId = opportunityId;
        
        // Show modal
        modal.classList.add('active');
        
        // Handle form submission
        form.onsubmit = (e) => {
            e.preventDefault();
            
            const selectedContacts = Array.from(document.getElementById('opportunity-contacts').selectedOptions)
                .map(option => option.value);
            
            const opportunityData = {
                title: document.getElementById('opportunity-name').value,
                description: document.getElementById('opportunity-description').value,
                value: parseFloat(document.getElementById('opportunity-value').value) || 0,
                currency: document.getElementById('opportunity-currency').value,
                closeDate: document.getElementById('opportunity-close-date').value,
                probability: parseInt(document.getElementById('opportunity-probability').value) || 50,
                assignedContacts: selectedContacts,
                updatedAt: new Date().toISOString()
            };
            
            this.updateTask(opportunityId, opportunityData);
            this.closeOpportunityModal();
            this.renderSalesBacklog();
            this.showNotification('Opportunity updated successfully!');
        };
    };

    SprintTodoApp.prototype.deleteSalesContact = function(contactId) {
        if (confirm('Are you sure you want to delete this contact?')) {
            this.tasks = this.tasks.filter(task => task.id !== contactId);
            this.saveData();
            this.renderSalesBacklog();
            this.showNotification('Contact deleted successfully!');
        }
    };

    SprintTodoApp.prototype.deleteSalesOpportunity = function(opportunityId) {
        if (confirm('Are you sure you want to delete this opportunity?')) {
            this.tasks = this.tasks.filter(task => task.id !== opportunityId);
            this.saveData();
            this.renderSalesBacklog();
            this.showNotification('Opportunity deleted successfully!');
        }
    };

    SprintTodoApp.prototype.assignContactToOpportunity = function(contactId) {
        const opportunities = this.getSalesOpportunities();
        if (opportunities.length === 0) {
            this.showNotification('No opportunities available to assign contact to.', 'warning');
            return;
        }
        
        const modal = document.getElementById('assign-contact-modal');
        const form = document.getElementById('assign-contact-form');
        
        // Populate opportunities dropdown
        const opportunitiesSelect = document.getElementById('assign-contact-opportunity');
        opportunitiesSelect.innerHTML = '';
        
        opportunities.forEach(opportunity => {
            const option = document.createElement('option');
            option.value = opportunity.id;
            option.textContent = opportunity.title;
            opportunitiesSelect.appendChild(option);
        });
        
        // Set modal title
        document.getElementById('assign-contact-modal-title').textContent = 'Assign Contact to Opportunity';
        
        // Store contact ID for assignment
        form.dataset.contactId = contactId;
        
        // Show modal
        modal.classList.add('active');
        
        // Handle form submission
        form.onsubmit = (e) => {
            e.preventDefault();
            
            const opportunityId = document.getElementById('assign-contact-opportunity').value;
            const opportunity = opportunities.find(opp => opp.id === opportunityId);
            
            if (opportunity) {
                // Add contact to opportunity's assigned contacts
                if (!opportunity.assignedContacts) {
                    opportunity.assignedContacts = [];
                }
                
                // Check if contact is already assigned
                if (!opportunity.assignedContacts.includes(contactId)) {
                    opportunity.assignedContacts.push(contactId);
                    
                    // Update the opportunity
                    this.updateTask(opportunityId, {
                        assignedContacts: opportunity.assignedContacts,
                        updatedAt: new Date().toISOString()
                    });
                    
                    this.closeAssignContactModal();
                    this.renderSalesBacklog();
                    this.showNotification('Contact assigned to opportunity successfully!');
                } else {
                    this.showNotification('Contact is already assigned to this opportunity.', 'warning');
                }
            }
        };
    };

    SprintTodoApp.prototype.closeAssignContactModal = function() {
        const modal = document.getElementById('assign-contact-modal');
        modal.classList.remove('active');
    };

    SprintTodoApp.prototype.assignOpportunityToPipeline = function(opportunityId) {
        const opportunity = this.getSalesOpportunities().find(opp => opp.id === opportunityId);
        if (!opportunity) {
            this.showNotification('Opportunity not found.', 'error');
            return;
        }
        
        // Switch to sales pipeline view
        this.switchView('sales-pipeline');
        
        // Store the opportunity ID for assignment
        this.pendingOpportunityAssignment = opportunityId;
        
        // Set default status for the opportunity
        const defaultStatus = this.getSalesPipelineStatuses()[0];
        if (defaultStatus) {
            this.updateTask(opportunityId, {
                status: defaultStatus.id,
                updatedAt: new Date().toISOString()
            });
            
            // Re-render the pipeline to show the newly assigned opportunity
            setTimeout(() => {
                this.renderSalesPipeline();
                
                // Add visual feedback - highlight the newly assigned opportunity
                const opportunityCard = document.querySelector(`[data-opportunity-id="${opportunityId}"]`);
                if (opportunityCard) {
                    opportunityCard.classList.add('newly-assigned');
                    opportunityCard.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    
                    // Remove the highlight after 3 seconds
                    setTimeout(() => {
                        opportunityCard.classList.remove('newly-assigned');
                    }, 3000);
                }
                
                this.showNotification(`Opportunity "${opportunity.title}" assigned to pipeline successfully!`);
            }, 100);
        } else {
            this.showNotification('No pipeline statuses available. Please configure statuses first.', 'warning');
        }
    };

    // Sales Pipeline Status Management Methods
    SprintTodoApp.prototype.showSalesPipelineStatusModal = function() {
        const modal = document.getElementById('sales-status-modal');
        if (modal) {
            modal.style.display = 'block';
            this.renderSalesPipelineStatuses();
        }
    };

    SprintTodoApp.prototype.closeSalesPipelineStatusModal = function() {
        const modal = document.getElementById('sales-status-modal');
        if (modal) {
            modal.style.display = 'none';
        }
    };

    SprintTodoApp.prototype.renderSalesPipelineStatuses = function() {
        const statusList = document.getElementById('sales-status-list');
        if (!statusList) return;

        const statuses = this.getSalesPipelineStatuses();
        statusList.innerHTML = '';

        statuses.forEach((status, index) => {
            const statusItem = document.createElement('div');
            statusItem.className = 'status-item';
            statusItem.innerHTML = `
                <div class="status-info">
                    <span class="status-color" style="background-color: ${status.color}"></span>
                    <span class="status-name">${status.name}</span>
                </div>
                <div class="status-actions">
                    <button class="btn-icon" onclick="app.editSalesPipelineStatus(${index})" title="Edit Status">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn-icon" onclick="app.deleteSalesPipelineStatus(${index})" title="Delete Status">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            `;
            statusList.appendChild(statusItem);
        });
    };

    SprintTodoApp.prototype.addSalesStatus = function() {
        const nameInput = document.getElementById('new-sales-status-name');
        const orderInput = document.getElementById('new-sales-status-order');
        
        if (!nameInput.value.trim()) {
            this.showNotification('Please enter a status name.', 'error');
            return;
        }

        const newStatus = {
            id: 'status_' + Date.now(),
            name: nameInput.value.trim(),
            order: parseInt(orderInput.value) || (this.getSalesPipelineStatuses().length + 1),
            color: this.getRandomColor()
        };

        this.salesPipelineStatuses.push(newStatus);
        this.saveData();
        this.renderSalesPipelineStatuses();
        this.renderSalesPipeline();
        
        // Reset form
        nameInput.value = '';
        orderInput.value = '';
        
        this.showNotification('Status added successfully!', 'success');
    };

    SprintTodoApp.prototype.editSalesPipelineStatus = function(index) {
        const statuses = this.getSalesPipelineStatuses();
        if (index < 0 || index >= statuses.length) return;

        const status = statuses[index];
        const newName = prompt('Enter new status name:', status.name);
        
        if (newName && newName.trim()) {
            status.name = newName.trim();
            this.saveData();
            this.renderSalesPipelineStatuses();
            this.renderSalesPipeline();
            this.showNotification('Status updated successfully!', 'success');
        }
    };

    SprintTodoApp.prototype.deleteSalesPipelineStatus = function(index) {
        const statuses = this.getSalesPipelineStatuses();
        if (index < 0 || index >= statuses.length) return;

        if (confirm('Are you sure you want to delete this status?')) {
            const deletedStatus = statuses[index];
            this.salesPipelineStatuses.splice(index, 1);
            
            // Update any tasks using this status
            this.getSalesOpportunities().forEach(opportunity => {
                if (opportunity.status === deletedStatus.id) {
                    opportunity.status = '';
                }
            });
            
            this.saveData();
            this.renderSalesPipelineStatuses();
            this.renderSalesPipeline();
            this.showNotification('Status deleted successfully!', 'success');
        }
    };

    SprintTodoApp.prototype.resetSalesPipelineStatuses = function() {
        if (confirm('Are you sure you want to reset all statuses to default?')) {
            this.salesPipelineStatuses = [
                { id: 'lead', name: 'Lead', order: 1, color: '#6c757d' },
                { id: 'qualified', name: 'Qualified', order: 2, color: '#007bff' },
                { id: 'proposal', name: 'Proposal', order: 3, color: '#28a745' },
                { id: 'negotiation', name: 'Negotiation', order: 4, color: '#ffc107' },
                { id: 'closed_won', name: 'Closed Won', order: 5, color: '#17a2b8' },
                { id: 'closed_lost', name: 'Closed Lost', order: 6, color: '#dc3545' }
            ];
            this.saveData();
            this.renderSalesPipelineStatuses();
            this.renderSalesPipeline();
            this.showNotification('Statuses reset to default!', 'success');
        }
    };

    // Assign Contact to Opportunity Methods
    SprintTodoApp.prototype.showAssignContactDialog = function(opportunityId) {
        const modal = document.getElementById('assign-contact-modal');
        if (!modal) return;

        this.pendingOpportunityAssignment = opportunityId;
        
        // Populate opportunity dropdown
        const opportunitySelect = document.getElementById('opportunity-select');
        opportunitySelect.innerHTML = '<option value="">Choose an opportunity...</option>';
        
        this.getSalesOpportunities().forEach(opp => {
            const option = document.createElement('option');
            option.value = opp.id;
            option.textContent = opp.title;
            opportunitySelect.appendChild(option);
        });

        // Populate contact dropdown
        const contactSelect = document.getElementById('contact-select');
        contactSelect.innerHTML = '<option value="">Choose a contact...</option>';
        
        this.getSalesContacts().forEach(contact => {
            const option = document.createElement('option');
            option.value = contact.id;
            option.textContent = contact.name;
            contactSelect.appendChild(option);
        });

        modal.style.display = 'block';
    };

    SprintTodoApp.prototype.closeAssignContactModal = function() {
        const modal = document.getElementById('assign-contact-modal');
        if (modal) {
            modal.style.display = 'none';
        }
    };

    SprintTodoApp.prototype.assignContactToOpportunity = function(event) {
        event.preventDefault();
        
        const opportunityId = document.getElementById('opportunity-select').value;
        const contactId = document.getElementById('contact-select').value;
        
        if (!opportunityId || !contactId) {
            this.showNotification('Please select both an opportunity and a contact.', 'error');
            return;
        }

        const opportunity = this.getSalesOpportunities().find(opp => opp.id === opportunityId);
        if (opportunity) {
            if (!opportunity.contacts) {
                opportunity.contacts = [];
            }
            
            // Check if contact is already assigned
            if (opportunity.contacts.includes(contactId)) {
                this.showNotification('Contact is already assigned to this opportunity.', 'warning');
                return;
            }
            
            opportunity.contacts.push(contactId);
            this.saveData();
            this.renderSalesBacklog();
            this.renderSalesPipeline();
            this.closeAssignContactModal();
            this.showNotification('Contact assigned successfully!', 'success');
        }
    };

    SprintTodoApp.prototype.renderSalesPipeline = function() {
        console.log('renderSalesPipeline called');
        
        // Clear existing content
        const salesPipelineView = document.getElementById('sales-pipeline-view');
        if (!salesPipelineView) {
            console.error('Sales pipeline view not found');
            return;
        }
        
        // Get sales pipeline statuses
        const statuses = this.getSalesPipelineStatuses();
        
        // Create sales pipeline layout
        salesPipelineView.innerHTML = `
            <div class="sales-pipeline-header">
                <div class="sales-pipeline-controls">
                    <select class="sales-pipeline-select" id="sales-pipeline-selector">
                        <option value="">Select Pipeline</option>
                        <option value="default">Default Pipeline</option>
                    </select>
                    <button class="btn-primary" onclick="app.showCreateSalesPipelineDialog()">
                        <i class="fas fa-plus"></i> New Pipeline
                    </button>
                    <button class="btn-secondary" onclick="app.editSalesPipelineStatuses()">
                        <i class="fas fa-cog"></i> Edit Statuses
                    </button>
                </div>
            </div>
            <div class="sales-pipeline-container">
                ${statuses.map(status => this.renderSalesPipelineColumn(status)).join('')}
            </div>
        `;
        
        // Add drag and drop for sales pipeline
        this.setupSalesPipelineDragAndDrop();
    };

    SprintTodoApp.prototype.renderSalesPipelineColumn = function(status) {
        const opportunities = this.getSalesOpportunities().filter(opp => opp.status === status.id);
        
        return `
            <div class="sales-pipeline-column" data-status-id="${status.id}">
                <div class="sales-column-header">
                    <div class="sales-column-title">
                        <i class="fas fa-circle" style="color: ${status.color}"></i>
                        <span>${status.name}</span>
                    </div>
                    <div class="sales-column-count">${opportunities.length}</div>
                </div>
                <div class="sales-column-content">
                    ${opportunities.map(opp => this.renderSalesPipelineOpportunityCard(opp)).join('')}
                    ${opportunities.length === 0 ? '<div class="empty-state">No opportunities</div>' : ''}
                </div>
            </div>
        `;
    };

    SprintTodoApp.prototype.renderSalesPipelineOpportunityCard = function(opportunity) {
        const assignedContacts = opportunity.assignedContacts || [];
        const contactTags = assignedContacts.map(contactId => {
            const contact = this.getSalesContact(contactId);
            return contact ? `<span class="sales-contact-tag">${contact.name}</span>` : '';
        }).join('');
        
        return `
            <div class="sales-opportunity-card" data-opportunity-id="${opportunity.id}" draggable="true">
                <div class="sales-opportunity-title">${opportunity.title}</div>
                <div class="sales-opportunity-meta">
                    <span>$${opportunity.value || 0}</span>
                    <span>${opportunity.createdAt ? new Date(opportunity.createdAt).toLocaleDateString() : ''}</span>
                </div>
                ${contactTags ? `<div class="sales-opportunity-contacts">${contactTags}</div>` : ''}
                <div class="sales-opportunity-footer">
                    <span>${opportunity.description ? opportunity.description.substring(0, 50) + '...' : ''}</span>
                    <div class="sales-opportunity-actions">
                        <button class="sales-mini-btn" onclick="app.editSalesOpportunity('${opportunity.id}')">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="sales-mini-btn" onclick="app.deleteSalesOpportunity('${opportunity.id}')">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </div>
            </div>
        `;
    };

    SprintTodoApp.prototype.getSalesPipelineStatuses = function() {
        // Default sales pipeline statuses
        const defaultStatuses = [
            { id: 'lead', name: 'Lead', color: '#6c757d' },
            { id: 'qualified', name: 'Qualified', color: '#007bff' },
            { id: 'proposal', name: 'Proposal', color: '#ffc107' },
            { id: 'negotiation', name: 'Negotiation', color: '#fd7e14' },
            { id: 'closed-won', name: 'Closed Won', color: '#28a745' },
            { id: 'closed-lost', name: 'Closed Lost', color: '#dc3545' }
        ];
        
        // Check if custom statuses exist in localStorage
        const savedStatuses = localStorage.getItem('sales-pipeline-statuses');
        return savedStatuses ? JSON.parse(savedStatuses) : defaultStatuses;
    };

    SprintTodoApp.prototype.saveSalesPipelineStatuses = function(statuses) {
        localStorage.setItem('sales-pipeline-statuses', JSON.stringify(statuses));
        this.renderSalesPipeline();
        this.showNotification('Sales pipeline statuses updated successfully!');
    };

    SprintTodoApp.prototype.addSalesPipelineStatus = function(statusData) {
        const statuses = this.getSalesPipelineStatuses();
        const status = {
            id: statusData.id || Date.now().toString(),
            name: statusData.name,
            color: statusData.color || '#6c757d'
        };
        
        statuses.push(status);
        this.saveSalesPipelineStatuses(statuses);
        return status;
    };

    SprintTodoApp.prototype.updateSalesPipelineStatus = function(statusId, updates) {
        const statuses = this.getSalesPipelineStatuses();
        const statusIndex = statuses.findIndex(s => s.id === statusId);
        
        if (statusIndex !== -1) {
            statuses[statusIndex] = {
                ...statuses[statusIndex],
                ...updates
            };
            this.saveSalesPipelineStatuses(statuses);
            return statuses[statusIndex];
        }
        return null;
    };

    SprintTodoApp.prototype.deleteSalesPipelineStatus = function(statusId) {
        const statuses = this.getSalesPipelineStatuses();
        
        // Check if any opportunities are using this status
        const opportunitiesWithStatus = this.getSalesOpportunities().filter(opp => opp.status === statusId);
        if (opportunitiesWithStatus.length > 0) {
            this.showNotification(`Cannot delete status: ${opportunitiesWithStatus.length} opportunities are using it.`, 'warning');
            return false;
        }
        
        const filteredStatuses = statuses.filter(s => s.id !== statusId);
        this.saveSalesPipelineStatuses(filteredStatuses);
        return true;
    };

    SprintTodoApp.prototype.resetSalesPipelineStatuses = function() {
        localStorage.removeItem('sales-pipeline-statuses');
        this.renderSalesPipeline();
        this.showNotification('Sales pipeline statuses reset to default');
    };

    // Edit Sales Pipeline Status
    SprintTodoApp.prototype.editSalesPipelineStatus = function(statusId) {
        const statuses = this.getSalesPipelineStatuses();
        const status = statuses.find(s => s.id === statusId);
        
        if (!status) {
            this.showNotification('Status not found.', 'error');
            return;
        }
        
        const modal = document.getElementById('sales-pipeline-status-modal');
        const statusList = modal.querySelector('.sales-pipeline-status-list');
        const statusForm = modal.querySelector('.sales-pipeline-status-form');
        
        // Hide the status list and show edit form
        statusList.style.display = 'none';
        statusForm.style.display = 'none';
        
        // Create edit form
        const editForm = document.createElement('div');
        editForm.className = 'sales-pipeline-status-edit-form';
        editForm.innerHTML = `
            <h3>Edit Status</h3>
            <form id="sales-pipeline-status-edit-form">
                <div class="form-group">
                    <label for="edit-sales-pipeline-status-name">Status Name:</label>
                    <input type="text" id="edit-sales-pipeline-status-name" value="${status.name}" required>
                </div>
                <div class="form-group">
                    <label for="edit-sales-pipeline-status-color">Color:</label>
                    <input type="color" id="edit-sales-pipeline-status-color" value="${status.color}">
                </div>
                <div class="form-actions">
                    <button type="submit" class="save-btn">Save Changes</button>
                    <button type="button" class="cancel-btn" onclick="app.cancelEditSalesPipelineStatus()">Cancel</button>
                </div>
            </form>
        `;
        
        modal.querySelector('.modal-body').appendChild(editForm);
        
        // Handle form submission
        const editFormElement = document.getElementById('sales-pipeline-status-edit-form');
        editFormElement.addEventListener('submit', (e) => {
            e.preventDefault();
            const name = document.getElementById('edit-sales-pipeline-status-name').value.trim();
            const color = document.getElementById('edit-sales-pipeline-status-color').value;
            
            if (name) {
                this.updateSalesPipelineStatus(statusId, { name, color });
                this.closeSalesPipelineStatusModal();
            }
        });
    };

    // Cancel Edit Sales Pipeline Status
    SprintTodoApp.prototype.cancelEditSalesPipelineStatus = function() {
        const modal = document.getElementById('sales-pipeline-status-modal');
        const editForm = modal.querySelector('.sales-pipeline-status-edit-form');
        const statusList = modal.querySelector('.sales-pipeline-status-list');
        const statusForm = modal.querySelector('.sales-pipeline-status-form');
        
        if (editForm) {
            editForm.remove();
        }
        
        statusList.style.display = 'block';
        statusForm.style.display = 'block';
    };

    // Update Sales Pipeline Status
    SprintTodoApp.prototype.updateSalesPipelineStatus = function(statusId, updates) {
        const statuses = this.getSalesPipelineStatuses();
        const statusIndex = statuses.findIndex(s => s.id === statusId);
        
        if (statusIndex !== -1) {
            statuses[statusIndex] = { ...statuses[statusIndex], ...updates };
            this.saveSalesPipelineStatuses(statuses);
            this.renderSalesPipelineStatuses();
            this.renderSalesPipeline();
            this.showNotification('Status updated successfully!');
        }
    };

    // Delete Sales Pipeline Status
    SprintTodoApp.prototype.deleteSalesPipelineStatus = function(statusId) {
        const statuses = this.getSalesPipelineStatuses();
        const statusIndex = statuses.findIndex(s => s.id === statusId);
        
        if (statusIndex !== -1) {
            const statusName = statuses[statusIndex].name;
            statuses.splice(statusIndex, 1);
            this.saveSalesPipelineStatuses(statuses);
            this.renderSalesPipelineStatuses();
            this.renderSalesPipeline();
            this.showNotification(`Status "${statusName}" deleted successfully!`);
        }
    };

    // Render Sales Pipeline Statuses
    SprintTodoApp.prototype.renderSalesPipelineStatuses = function() {
        const modal = document.getElementById('sales-pipeline-status-modal');
        const statusList = modal.querySelector('.sales-pipeline-status-list');
        const statusForm = modal.querySelector('.sales-pipeline-status-form');
        
        // Clear existing content
        statusList.innerHTML = '';
        
        const statuses = this.getSalesPipelineStatuses();
        
        if (statuses.length === 0) {
            statusList.innerHTML = '<p>No statuses available. Add a new status to get started.</p>';
        } else {
            statuses.forEach(status => {
                const statusItem = document.createElement('div');
                statusItem.className = 'sales-pipeline-status-item';
                statusItem.style.borderLeftColor = status.color;
                statusItem.innerHTML = `
                    <div class="status-info">
                        <div class="status-name">${status.name}</div>
                    </div>
                    <div class="status-actions">
                        <button class="edit-status-btn" onclick="app.editSalesPipelineStatus('${status.id}')">
                            <i class="fas fa-edit"></i> Edit
                        </button>
                        <button class="delete-status-btn" onclick="app.deleteSalesPipelineStatus('${status.id}')">
                            <i class="fas fa-trash"></i> Delete
                        </button>
                    </div>
                `;
                statusList.appendChild(statusItem);
            });
        }
        
        // Show status list and form
        statusList.style.display = 'block';
        statusForm.style.display = 'block';
    };

    // Close Sales Pipeline Status Modal
    SprintTodoApp.prototype.closeSalesPipelineStatusModal = function() {
        const modal = document.getElementById('sales-pipeline-status-modal');
        modal.classList.remove('active');
        
        // Clear any edit forms
        const editForm = modal.querySelector('.sales-pipeline-status-edit-form');
        if (editForm) {
            editForm.remove();
        }
        
        // Reset form
        const statusForm = document.getElementById('sales-pipeline-status-form');
        if (statusForm) {
            statusForm.reset();
        }
    };

    SprintTodoApp.prototype.setupSalesPipelineDragAndDrop = function() {
        const columns = document.querySelectorAll('.sales-pipeline-column');
        const cards = document.querySelectorAll('.sales-opportunity-card');
        
        cards.forEach(card => {
            card.addEventListener('dragstart', (e) => {
                e.dataTransfer.setData('text/plain', card.dataset.opportunityId);
                card.classList.add('dragging');
                
                // Create custom drag image
                const dragImage = card.cloneNode(true);
                dragImage.style.width = '200px';
                dragImage.style.position = 'absolute';
                dragImage.style.top = '-1000px';
                document.body.appendChild(dragImage);
                e.dataTransfer.setDragImage(dragImage, 100, 50);
                setTimeout(() => document.body.removeChild(dragImage), 0);
            });
            
            card.addEventListener('dragend', () => {
                card.classList.remove('dragging');
                // Remove all drop indicators
                document.querySelectorAll('.drop-indicator').forEach(indicator => {
                    indicator.remove();
                });
            });
        });
        
        columns.forEach(column => {
            column.addEventListener('dragover', (e) => {
                e.preventDefault();
                column.classList.add('drag-over');
                
                // Show drop indicator
                this.showSalesPipelineDropIndicator(column, e);
            });
            
            column.addEventListener('dragleave', () => {
                column.classList.remove('drag-over');
                // Remove drop indicator
                document.querySelectorAll('.drop-indicator').forEach(indicator => {
                    indicator.remove();
                });
            });
            
            column.addEventListener('drop', (e) => {
                e.preventDefault();
                column.classList.remove('drag-over');
                
                // Remove drop indicator
                document.querySelectorAll('.drop-indicator').forEach(indicator => {
                    indicator.remove();
                });
                
                const opportunityId = e.dataTransfer.getData('text/plain');
                const newStatus = column.dataset.statusId;
                
                // Update opportunity status
                const opportunity = this.getSalesOpportunities().find(opp => opp.id === opportunityId);
                if (opportunity) {
                    this.updateTask(opportunityId, {
                        status: newStatus,
                        updatedAt: new Date().toISOString()
                    });
                    
                    // Re-render the pipeline
                    this.renderSalesPipeline();
                    this.showNotification('Opportunity status updated successfully!');
                }
            });
        });
    };

    SprintTodoApp.prototype.showSalesPipelineDropIndicator = function(column, event) {
        // Remove existing indicators
        document.querySelectorAll('.drop-indicator').forEach(indicator => {
            indicator.remove();
        });
        
        const columnRect = column.getBoundingClientRect();
        const columnContent = column.querySelector('.sales-column-content');
        
        if (!columnContent) return;
        
        const contentRect = columnContent.getBoundingClientRect();
        const elements = Array.from(columnContent.querySelectorAll('.sales-opportunity-card'));
        
        if (elements.length === 0) {
            // No elements, show indicator at the top
            const indicator = document.createElement('div');
            indicator.className = 'drop-indicator';
            indicator.style.cssText = `
                position: absolute;
                top: ${contentRect.top - columnRect.top}px;
                left: 0;
                right: 0;
                height: 3px;
                background-color: #007bff;
                animation: pulse 1s infinite;
                z-index: 1000;
            `;
            columnContent.appendChild(indicator);
            return;
        }
        
        // Find the closest element to the mouse position
        let closestElement = null;
        let closestDistance = Infinity;
        
        elements.forEach(element => {
            const elementRect = element.getBoundingClientRect();
            const elementCenter = elementRect.top + elementRect.height / 2;
            const distance = Math.abs(event.clientY - elementCenter);
            
            if (distance < closestDistance) {
                closestDistance = distance;
                closestElement = element;
            }
        });
        
        if (closestElement) {
            const indicator = document.createElement('div');
            indicator.className = 'drop-indicator';
            
            const elementRect = closestElement.getBoundingClientRect();
            const insertBefore = event.clientY < elementRect.top + elementRect.height / 2;
            
            indicator.style.cssText = `
                position: absolute;
                top: ${insertBefore ? elementRect.top - columnRect.top : elementRect.bottom - columnRect.top}px;
                left: 0;
                right: 0;
                height: 3px;
                background-color: #007bff;
                animation: pulse 1s infinite;
                z-index: 1000;
            `;
            
            columnContent.insertBefore(indicator, insertBefore ? closestElement : closestElement.nextSibling);
        }
    };

    SprintTodoApp.prototype.showCreateSalesContactDialog = function() {
        const modal = document.getElementById('contact-modal');
        const form = document.getElementById('contact-form');
        
        // Reset form
        form.reset();
        form.dataset.contactId = '';
        
        // Set modal title
        document.getElementById('contact-modal-title').textContent = 'Create Contact';
        
        // Show modal
        modal.classList.add('active');
        
        // Handle form submission
        form.onsubmit = (e) => {
            e.preventDefault();
            
            const contactData = {
                name: document.getElementById('contact-name').value,
                organization: document.getElementById('contact-organization').value,
                email: document.getElementById('contact-email').value,
                phone: document.getElementById('contact-phone').value,
                title: document.getElementById('contact-title').value,
                notes: document.getElementById('contact-notes').value
            };
            
            this.createSalesContact(contactData);
            this.closeContactModal();
        };
    };

    SprintTodoApp.prototype.closeContactModal = function() {
        const modal = document.getElementById('contact-modal');
        modal.classList.remove('active');
    };

    SprintTodoApp.prototype.showCreateSalesOpportunityDialog = function() {
        const modal = document.getElementById('opportunity-modal');
        const form = document.getElementById('opportunity-form');
        
        // Reset form
        form.reset();
        form.dataset.opportunityId = '';
        
        // Set modal title
        document.getElementById('opportunity-modal-title').textContent = 'Create Opportunity';
        
        // Populate contacts dropdown
        this.populateOpportunityContacts();
        
        // Show modal
        modal.classList.add('active');
        
        // Handle form submission
        form.onsubmit = (e) => {
            e.preventDefault();
            
            const selectedContacts = Array.from(document.getElementById('opportunity-contacts').selectedOptions)
                .map(option => option.value);
            
            const opportunityData = {
                title: document.getElementById('opportunity-name').value,
                description: document.getElementById('opportunity-description').value,
                value: parseFloat(document.getElementById('opportunity-value').value) || 0,
                currency: document.getElementById('opportunity-currency').value,
                closeDate: document.getElementById('opportunity-close-date').value,
                probability: parseInt(document.getElementById('opportunity-probability').value) || 50,
                assignedContacts: selectedContacts
            };
            
            this.createSalesOpportunity(opportunityData);
            this.closeOpportunityModal();
        };
    };

    SprintTodoApp.prototype.closeOpportunityModal = function() {
        const modal = document.getElementById('opportunity-modal');
        modal.classList.remove('active');
    };

    SprintTodoApp.prototype.populateOpportunityContacts = function() {
        const contactsSelect = document.getElementById('opportunity-contacts');
        contactsSelect.innerHTML = '';
        
        const contacts = this.getSalesContacts();
        contacts.forEach(contact => {
            const option = document.createElement('option');
            option.value = contact.id;
            option.textContent = contact.name;
            contactsSelect.appendChild(option);
        });
    };

    SprintTodoApp.prototype.editSalesPipelineStatuses = function() {
        const modal = document.getElementById('sales-pipeline-status-modal');
        const form = document.getElementById('sales-pipeline-status-form');
        const statusList = document.getElementById('sales-pipeline-status-list');
        
        // Get current statuses
        const statuses = this.getSalesPipelineStatuses();
        
        // Render status list
        statusList.innerHTML = '';
        statuses.forEach((status, index) => {
            const statusItem = document.createElement('div');
            statusItem.className = 'sales-pipeline-status-item';
            statusItem.innerHTML = `
                <div class="sales-pipeline-status-info">
                    <span class="sales-pipeline-status-name">${status.name}</span>
                    <span class="sales-pipeline-status-color" style="background-color: ${status.color}"></span>
                </div>
                <div class="sales-pipeline-status-actions">
                    <button class="sales-pipeline-status-edit-btn" onclick="app.editSalesPipelineStatus('${status.id}')">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="sales-pipeline-status-delete-btn" onclick="app.deleteSalesPipelineStatus('${status.id}')">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            `;
            statusList.appendChild(statusItem);
        });
        
        // Show modal
        modal.classList.add('active');
        
        // Handle form submission
        form.onsubmit = (e) => {
            e.preventDefault();
            
            const name = document.getElementById('new-sales-pipeline-status-name').value.trim();
            const color = document.getElementById('new-sales-pipeline-status-color').value;
            
            if (name) {
                this.addSalesPipelineStatus({
                    name: name,
                    color: color || '#6c757d'
                });
                form.reset();
            }
        };
    };

    SprintTodoApp.prototype.exportSalesData = function() {
        const contacts = this.getSalesContacts();
        const opportunities = this.getSalesOpportunities();
        
        const data = {
            contacts,
            opportunities,
            exportDate: new Date().toISOString()
        };
        
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `sales-data-${new Date().toISOString().split('T')[0]}.json`;
        a.click();
        URL.revokeObjectURL(url);
        
        this.showNotification('Sales data exported successfully!');
    };

        // Sales Pipeline Status Modal Event Listeners
        const salesPipelineStatusModal = document.getElementById('sales-pipeline-status-modal');
        const salesPipelineStatusForm = document.getElementById('sales-pipeline-status-form');
        
        // Sales Pipeline Status Form Submission
        if (salesPipelineStatusForm) {
            salesPipelineStatusForm.addEventListener('submit', (e) => {
                e.preventDefault();
                const name = document.getElementById('new-sales-pipeline-status-name').value.trim();
                const color = document.getElementById('new-sales-pipeline-status-color').value;
                
                if (name) {
                    this.addSalesPipelineStatus({ name, color });
                    salesPipelineStatusForm.reset();
                    document.getElementById('new-sales-pipeline-status-name').focus();
                }
            });
        }

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    window.app = new SprintTodoApp();
});

// Add CSS animations for drag and drop
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from {
            transform: translateX(100%);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
    
    @keyframes pulse {
        0% {
            opacity: 0.6;
            transform: scaleX(1);
        }
        50% {
            opacity: 1;
            transform: scaleX(1.1);
        }
        100% {
            opacity: 0.6;
            transform: scaleX(1);
        }
    }
    
    .dragging {
        opacity: 0.5;
        transform: rotate(2deg);
        transition: all 0.2s ease;
    }
    
    .column-content.drag-over {
        background-color: rgba(0, 123, 255, 0.1);
        border: 2px dashed #007bff;
        border-radius: 8px;
    }
    
    .drop-indicator {
        transition: all 0.2s ease;
    }
`;
document.head.appendChild(style);
