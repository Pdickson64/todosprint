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
        document.getElementById('create-folder-btn').addEventListener('click', () => {
            this.showCreateFolderDialog();
        });
        
        // Set up event delegation for dynamic elements
        this.setupEventDelegation();
        
        // Initialize the UI
        this.render();
        
        // Set up drag and drop
        this.setupDragAndDrop();
        
        // Set up backlog drag and drop
        this.setupBacklogDragAndDrop();
        
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
        const task = {
            id: Date.now().toString(),
            title: taskData.title,
            description: taskData.description || '',
            points: taskData.points || 1,
            priority: taskData.priority || 'medium',
            dueDate: taskData.dueDate || null,
            sprintId: taskData.sprintId || null,
            folderId: taskData.folderId || null,
            status: 'backlog',
            subtasks: [],
            recurring: taskData.recurring || false,
            recurringType: taskData.recurringType || null,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            activityLog: []
        };
        
        this.tasks.push(task);
        this.saveData();
        return task;
    }

    SprintTodoApp.prototype.createSubtask = function(parentTaskId, subtaskData) {
        const parentTask = this.getTask(parentTaskId);
        if (!parentTask) return null;
        
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
            status: 'backlog',
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
        return true;
    }

    SprintTodoApp.prototype.toggleSubtaskComplete = function(parentTaskId, subtaskId) {
        const subtask = this.getSubtask(parentTaskId, subtaskId);
        if (subtask) {
            this.updateSubtask(parentTaskId, subtaskId, { completed: !subtask.completed });
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
        const mainTasks = this.getTasksBySprint(sprintId);
        const allTasks = [];
        
        // Add main tasks and their subtasks as individual items
        mainTasks.forEach(task => {
            // Add the main task
            allTasks.push(task);
            
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
                    }
                });
            }
        });
        
        return allTasks;
    }

    // Add method to get parent tasks for a folder (subtasks will be handled by createTaskElement)
    SprintTodoApp.prototype.getTasksAndSubtasksByFolder = function(folderId) {
        // Get all tasks for the folder
        const folderTasks = this.getTasksByFolder(folderId);
        
        // Filter out subtasks (tasks that have a parentTaskId) and completed tasks
        const parentTasks = folderTasks.filter(task => !task.parentTaskId && task.status !== 'done');
        
        return parentTasks;
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
        const taskIndex = this.tasks.findIndex(t => t.id === taskId);
        if (taskIndex !== -1) {
            this.tasks[taskIndex] = {
                ...this.tasks[taskIndex],
                ...updates,
                updatedAt: new Date().toISOString()
            };
            
            // Add to activity log
            if (updates.comment) {
                this.tasks[taskIndex].activityLog.push({
                    timestamp: new Date().toISOString(),
                    comment: updates.comment
                });
            }
            
            this.saveData();
            return this.tasks[taskIndex];
        }
        return null;
    }

    SprintTodoApp.prototype.deleteTask = function(taskId) {
        this.tasks = this.tasks.filter(t => t.id !== taskId);
        this.saveData();
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
    }

    SprintTodoApp.prototype.getFolder = function(folderId) {
        return this.folders.find(f => f.id === folderId);
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
    SprintTodoApp.prototype.getDefaultBoardStatuses = function() {
        return [
            { id: 'todo', name: 'To Do', order: 1 },
            { id: 'inprogress', name: 'In Progress', order: 2 },
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
        if (navButtons) {
            navButtons.forEach(btn => {
                btn.addEventListener('click', (e) => {
                    const view = e.currentTarget.dataset.view;
                    this.switchView(view);
                });
            });
        }
        
        // Task Modal
        const addTaskBtn = document.getElementById('add-task-btn');
        if (addTaskBtn) {
            addTaskBtn.addEventListener('click', () => {
                this.openTaskModal();
            });
        }
        
        const addToBacklogBtn = document.getElementById('add-to-backlog-btn');
        if (addToBacklogBtn) {
            addToBacklogBtn.addEventListener('click', () => {
                this.openTaskModal({ folderId: null });
            });
        }
        
        const taskForm = document.getElementById('task-form');
        if (taskForm) {
            taskForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.saveTask();
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
        if (closeButtons) {
            closeButtons.forEach(btn => {
                btn.addEventListener('click', () => {
                    this.closeModals();
                });
            });
        }
        
        // Click outside modal to close
        const modals = document.querySelectorAll('.modal');
        if (modals) {
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
        const container = document.getElementById('backlog-container');
        if (!container) return;
        
        container.innerHTML = '';
        
        // Get unfiled tasks first
        const unfiledTasks = this.tasks.filter(task => !task.folderId);
        
        // Render folders
        this.folders.forEach(folder => {
            const folderElement = SprintTodoApp.prototype.createFolderElement.call(this, folder);

            // APPLY PERSISTED STATE BEFORE APPEND
            if (this.folderStates[folder.id]) {
                folderElement.classList.add('collapsed'); // true means collapsed
            }

            container.appendChild(folderElement);
        });

        // Apply persisted collapsed state for 'unfiled'
        if (unfiledTasks && unfiledTasks.length > 0) {
            const unfiledContainer = document.createElement('div');
            unfiledContainer.className = 'folder';
            unfiledContainer.dataset.folderId = 'unfiled';
            unfiledContainer.innerHTML = `
                <div class="folder-header" onclick="app.toggleFolder('unfiled')">
                    <div class="folder-title">
                        <i class="fas fa-chevron-down folder-toggle"></i>
                        Unfiled Tasks
                    </div>
                </div>
                <div class="folder-content">
                    <div class="folder-tasks">
                        ${unfiledTasks.map(task => this.createTaskElement(task)).join('')}
                    </div>
                    <div class="inline-task-input">
                        <input type="text" placeholder="Add task..." onkeypress="if(event.key==='Enter') app.createQuickTask(this, null)">
                        <button class="add-btn" onclick="app.createQuickTask(this, null)">Add</button>
                    </div>
                </div>
            `;
            
            // Apply persisted state to unfiled
            if (this.folderStates['unfiled']) {
                unfiledContainer.classList.add('collapsed');
                const icon = unfiledContainer.querySelector('.folder-toggle');
                if (icon) icon.className = 'fas fa-chevron-right folder-toggle';
            }
            container.appendChild(unfiledContainer);
        }
        
        
        // Show empty state if no incomplete tasks
        const incompleteTasks = this.tasks.filter(t => !t.parentTaskId && t.status !== 'done');
        if (incompleteTasks.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-tasks"></i>
                    <h3>No incomplete tasks</h3>
                    <p>All tasks are completed or have been moved to sprints!</p>
                </div>
            `;
        }
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
        const container = document.getElementById('board-container');
        container.innerHTML = '';
        
        const sprintId = this.currentSprint ? this.currentSprint.id :
            document.getElementById('sprint-selector').value;
        
        console.log('Sprint ID:', sprintId);
        
        if (!sprintId) {
            container.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-columns"></i>
                    <h3>Select a Sprint</h3>
                    <p>Choose a sprint to view its board</p>
                </div>
            `;
            return;
        }
        
        const sprint = this.getSprint(sprintId);
        const tasks = this.getFlatTasksForSprintBoard(sprintId);
        const statuses = this.getBoardStatuses();
        
        console.log('Tasks found:', tasks.length);
        console.log('Tasks with subtasks:', tasks.filter(t => t.subtasks && t.subtasks.length > 0).length);
        
        statuses.forEach(status => {
            const statusTasks = tasks.filter(task => task.status === status.id);
            const totalPoints = statusTasks.reduce((sum, task) => sum + task.points, 0);
            
            console.log(`Status ${status.name}:`, statusTasks.length, 'tasks');
            
            const column = document.createElement('div');
            column.className = 'board-column';
            
            // Build task elements
            const taskElements = statusTasks.map(task => {
                console.log('Creating task element for task:', task.id);
                return this.createTaskElement(task);
            }).join('');
            
            console.log('Task elements:', taskElements);
            
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
            container.appendChild(column);
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
        taskData = taskData || {};
        const modal = document.getElementById('task-modal');
        const form = document.getElementById('task-form');
        
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
        sprintSelect.innerHTML = '<option value="">No Sprint</option>';
        this.sprints.forEach(sprint => {
            const option = document.createElement('option');
            option.value = sprint.id;
            option.textContent = sprint.name;
            sprintSelect.appendChild(option);
        });
        
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

    // Data Persistence
    SprintTodoApp.prototype.saveTask = function() {
        const taskData = {
            title: document.getElementById('task-title').value,
            description: document.getElementById('task-description').value,
            points: parseInt(document.getElementById('task-points').value),
            priority: document.getElementById('task-priority').value,
            dueDate: document.getElementById('task-due-date').value,
            sprintId: document.getElementById('task-sprint').value || null,
            recurring: document.getElementById('task-recurring').checked,
            recurringType: document.getElementById('recurring-type').value || null
        };
        
        // Get folderId from the folder selection dropdown if it exists
        const folderSelect = document.getElementById('task-folder');
        if (folderSelect) {
            taskData.folderId = folderSelect.value || null;
        }
        
        // Get the task ID from the form data attribute
        const form = document.getElementById('task-form');
        const taskId = form.dataset.taskId;
        
        if (taskId) {
            // Update existing task
            this.updateTask(taskId, taskData);
            this.showNotification('Task updated successfully!');
        } else {
            // Create new task
            this.createTask(taskData);
            this.showNotification('Task created successfully!');
        }
        
        // Close modal and refresh UI
        this.closeModals();
        this.render();
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
            }
        });
        
        document.addEventListener('dragend', (e) => {
            if (e.target.classList.contains('task-item')) {
                e.target.classList.remove('dragging');
            }
        });
        
        document.addEventListener('dragover', (e) => {
            e.preventDefault();
            const columnContent = e.target.closest('.column-content');
            if (columnContent && this.draggedElement) {
                columnContent.classList.add('drag-over');
            }
        });
        
        document.addEventListener('dragleave', (e) => {
            const columnContent = e.target.closest('.column-content');
            if (columnContent) {
                columnContent.classList.remove('drag-over');
            }
        });
        
        document.addEventListener('drop', (e) => {
            e.preventDefault();
            const columnContent = e.target.closest('.column-content');
            if (columnContent && this.draggedElement && this.draggedTask) {
                columnContent.classList.remove('drag-over');
                
                // Update task status
                const newStatus = columnContent.dataset.status;
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
        });
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

    SprintTodoApp.prototype.closeInlineTaskForm = function() {
        const form = document.getElementById('inline-task-form');
        form.style.display = 'none';
        form.dataset.folderId = '';
    }

    SprintTodoApp.prototype.saveInlineTask = function() {
        const folderId = document.getElementById('inline-task-form').dataset.folderId || null;
        const taskData = {
            title: document.getElementById('inline-task-title').value,
            points: parseInt(document.getElementById('inline-task-points').value) || 1,
            priority: document.getElementById('inline-task-priority').value,
            dueDate: document.getElementById('inline-task-due-date').value,
            folderId: folderId
        };
        
        // Create the task
        this.createTask(taskData);
        
        // Close the form
        this.closeInlineTaskForm();
        
        // Refresh the UI
        this.render();
        
        // Show success message
        this.showNotification('Task created successfully!');
    }

    SprintTodoApp.prototype.createQuickTask = function(inputElement, folderId) {
        const taskTitle = inputElement.value.trim();
        
        if (!taskTitle) {
            return; // Don't create empty tasks
        }
        
        // Create the task with default values
        const taskData = {
            title: taskTitle,
            points: 1, // Default points
            priority: 'medium', // Default priority
            folderId: folderId
        };
        
        // Create the task
        this.createTask(taskData);
        
        // Clear the input field
        inputElement.value = '';
        
        // Refresh the UI
        this.render();
        
        // Show success message
        this.showNotification('Task created successfully!');
    }

    SprintTodoApp.prototype.setupBacklogDragAndDrop = function() {
        // Set up drag and drop for the backlog
        document.addEventListener('dragstart', (e) => {
            if (e.target.classList.contains('task-item')) {
                this.draggedTaskElement = e.target;
                this.draggedTask = this.getTask(e.target.dataset.taskId);
                e.target.classList.add('dragging');
                e.dataTransfer.effectAllowed = 'move';
                e.dataTransfer.setData('text/html', e.target.innerHTML);
            }
        });

        document.addEventListener('dragend', (e) => {
            if (e.target.classList.contains('task-item')) {
                e.target.classList.remove('dragging');
                this.clearDragOverStyles();
            }
        });

        document.addEventListener('dragover', (e) => {
            e.preventDefault();
            const taskElement = e.target.closest('.task-item');
            const folderContent = e.target.closest('.folder-content');
            
            if (taskElement && this.draggedTaskElement !== taskElement) {
                this.handleDragOverTask(taskElement, e);
            } else if (folderContent) {
                this.handleDragOverFolder(folderContent, e);
            }
        });

        document.addEventListener('drop', (e) => {
            e.preventDefault();
            const taskElement = e.target.closest('.task-item');
            const folderContent = e.target.closest('.folder-content');
            
            if (taskElement && this.draggedTaskElement !== taskElement) {
                this.handleDropOnTask(taskElement, e);
            } else if (folderContent) {
                this.handleDropOnFolder(folderContent, e);
            }
        });

        document.addEventListener('dragleave', (e) => {
            const folderContent = e.target.closest('.folder-content');
            if (folderContent && !folderContent.contains(e.relatedTarget)) {
                folderContent.classList.remove('drag-over');
            }
        });
    }

    SprintTodoApp.prototype.handleDragOverTask = function(taskElement, e) {
        const rect = taskElement.getBoundingClientRect();
        const midpoint = rect.top + rect.height / 2;
        
        if (e.clientY < midpoint) {
            taskElement.style.borderTop = '2px solid var(--primary-color)';
            taskElement.style.borderBottom = 'none';
        } else {
            taskElement.style.borderTop = 'none';
            taskElement.style.borderBottom = '2px solid var(--primary-color)';
        }
    }

    SprintTodoApp.prototype.handleDragOverFolder = function(folderContent, e) {
        folderContent.classList.add('drag-over');
    }

    SprintTodoApp.prototype.handleDropOnTask = function(taskElement, e) {
        e.preventDefault();
        
        const rect = taskElement.getBoundingClientRect();
        const midpoint = rect.top + rect.height / 2;
        
        // Determine if we're dropping before or after the target task
        const dropBefore = e.clientY < midpoint;
        
        // Get the target task
        const targetTask = this.getTask(taskElement.dataset.taskId);
        
        if (targetTask && this.draggedTask) {
            // Reorder tasks within the same folder
            if (targetTask.folderId === this.draggedTask.folderId) {
                this.reorderTasks(this.draggedTask, targetTask, dropBefore);
            }
            // Move task to different folder
            else {
                this.moveTaskToFolder(this.draggedTask, targetTask.folderId);
                // Then reorder within the new folder
                this.reorderTasks(this.draggedTask, targetTask, dropBefore);
            }
        }
        
        this.clearDragOverStyles();
        this.render();
    }

    SprintTodoApp.prototype.handleDropOnFolder = function(folderContent, e) {
        e.preventDefault();
        
        // Get the folder ID from the folder content
        const folderElement = folderContent.closest('.folder');
        const folderId = folderElement.dataset.folderId;
        
        if (this.draggedTask && folderId) {
            // Move task to the folder
            this.moveTaskToFolder(this.draggedTask, folderId);
            
            // Add to the end of the folder
            this.draggedTask.order = this.getTasksByFolder(folderId).length;
        }
        
        this.clearDragOverStyles();
        this.render();
    }

    SprintTodoApp.prototype.reorderTasks = function(draggedTask, targetTask, dropBefore) {
        const draggedIndex = this.tasks.findIndex(t => t.id === draggedTask.id);
        const targetIndex = this.tasks.findIndex(t => t.id === targetTask.id);
        
        if (draggedIndex === -1 || targetIndex === -1) return;
        
        // Remove the dragged task from its current position
        const [removedTask] = this.tasks.splice(draggedIndex, 1);
        
        // Insert it at the new position
        const newIndex = dropBefore ? targetIndex : targetIndex + (draggedIndex < targetIndex ? 0 : 1);
        this.tasks.splice(newIndex, 0, removedTask);
        
        // Update the order property for all tasks in the same folder
        const folderTasks = this.tasks.filter(t => t.folderId === draggedTask.folderId);
        folderTasks.forEach((task, index) => {
            task.order = index;
        });
        
        this.saveData();
    }

    SprintTodoApp.prototype.moveTaskToFolder = function(task, newFolderId) {
        const taskIndex = this.tasks.findIndex(t => t.id === task.id);
        if (taskIndex !== -1) {
            this.tasks[taskIndex].folderId = newFolderId;
            
            // Update order to be at the end of the new folder
            const folderTasks = this.getTasksByFolder(newFolderId);
            this.tasks[taskIndex].order = folderTasks.length;
            
            this.saveData();
        }
    }

    SprintTodoApp.prototype.clearDragOverStyles = function() {
        // Remove all drag over styles
        document.querySelectorAll('.task-item').forEach(task => {
            task.style.borderTop = 'none';
            task.style.borderBottom = 'none';
        });
        
        document.querySelectorAll('.folder-content').forEach(content => {
            content.classList.remove('drag-over');
        });
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
        if (!taskId) return;
        
        const task = this.getTask(taskId);
        if (!task) return;
        
        // Update task with new sprint assignment
        const updates = {
            sprintId: sprintId || null,
            status: sprintId ? 'todo' : 'backlog'
        };
        
        this.updateTask(taskId, updates);
        
        // Show notification
        if (sprintId) {
            const sprint = this.getSprint(sprintId);
            this.showNotification(`Task assigned to ${sprint.name}`);
        } else {
            this.showNotification('Task removed from sprint');
        }
        
        // Re-render to update the UI
        this.render();
    }

    SprintTodoApp.prototype.updateTaskPriority = function(taskId, priority) {
        if (!taskId || !priority) return;
        
        const task = this.getTask(taskId);
        if (!task) return;
        
        // Update task priority
        this.updateTask(taskId, { priority });
        
        // Show notification
        this.showNotification(`Task priority updated to ${priority}`);
        
        // Re-render to update the UI
        this.render();
    }

    SprintTodoApp.prototype.updateTaskPoints = function(taskId, points) {
        if (!taskId || !points) return;
        
        const task = this.getTask(taskId);
        if (!task) return;
        
        // Update task points
        this.updateTask(taskId, { points: parseInt(points) });
        
        // Show notification
        this.showNotification(`Task points updated to ${points}`);
        
        // Re-render to update the UI
        this.render();
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
        
        // Update the UI
        const subtasksContainer = document.getElementById(`subtasks-${taskId}`);
        console.log('Subtasks container:', subtasksContainer);
        if (subtasksContainer) {
            subtasksContainer.classList.toggle('collapsed');
            console.log('Toggled collapsed class');
        }
        
        const toggleButton = document.querySelector(`[data-task-id="${taskId}"] .btn-toggle-subtasks i`);
        console.log('Toggle button:', toggleButton);
        if (toggleButton) {
            toggleButton.className = `fas fa-chevron-${task.expanded !== false ? 'down' : 'right'}`;
            console.log('Updated toggle button icon');
        }
    }

    // Placeholder methods for future implementation
    SprintTodoApp.prototype.editTask = function(taskId) {
        const task = this.getTask(taskId);
        if (task) {
            this.openTaskModal(task);
        }
    }

    SprintTodoApp.prototype.deleteTask = function(taskId) {
        if (confirm('Are you sure you want to delete this task?')) {
            this.tasks = this.tasks.filter(t => t.id !== taskId);
            this.saveData();
            this.render();
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
            this.deleteSprint(sprintId);
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

    SprintTodoApp.prototype.viewSprintBoard = function(sprintId) {
        this.currentSprint = this.getSprint(sprintId);
        document.getElementById('sprint-selector').value = sprintId;
        this.switchView('board');
    }

    SprintTodoApp.prototype.showCreateFolderDialog = function() {
        const name = prompt('Enter folder name:');
        if (name) {
            this.createFolder({ name });
            this.render();
            this.showNotification('Folder created successfully!');
        }
    };
    
    // Convert all remaining methods to prototype syntax
    SprintTodoApp.prototype.init = function() {
        // Load data from localStorage
        this.loadData();
        
        // Set up event listeners
        this.setupEventListeners();
        
        // Add event listener for create folder button
        document.getElementById('create-folder-btn').addEventListener('click', function() {
            this.showCreateFolderDialog();
        }.bind(this));
        
        // Set up event delegation for dynamic elements
        this.setupEventDelegation();
        
        // Initialize the UI
        this.render();
        
        // Set up drag and drop
        this.setupDragAndDrop();
        
        // Set up backlog drag and drop
        this.setupBacklogDragAndDrop();
        
        // Set up context menu
        this.setupContextMenu();
    };
    
    // Add all other methods in the same prototype pattern...

    SprintTodoApp.prototype.showAddSubtaskDialog = function(parentTaskId) {
        const title = prompt('Enter subtask title:');
        if (title) {
            this.createSubtask(parentTaskId, { title });
            this.render();
            this.showNotification('Subtask created successfully!');
        }
    };

// Initialize the app when DOM is loaded
(function() {
    window.app = new SprintTodoApp();
})();

// Add CSS animation for notifications
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
`;
document.head.appendChild(style);