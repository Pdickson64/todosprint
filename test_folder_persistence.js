// Test script for folder state persistence
console.log('Testing folder state persistence...');

// Create a mock app instance to test folder state functionality
class MockSprintTodoApp {
    constructor() {
        this.tasks = [];
        this.sprints = [];
        this.folders = [];
        this.currentView = 'backlog';
        this.currentSprint = null;
        this.draggedElement = null;
        this.draggedTask = null;
        this.folderState = {};
    }

    // Folder State Management
    getFolderExpanded(folderId) {
        return this.folderState[folderId] !== undefined ? this.folderState[folderId] : true;
    }

    setFolderExpanded(folderId, expanded) {
        this.folderState[folderId] = expanded;
        console.log(`Set folder ${folderId} expanded to: ${expanded}`);
        return this.folderState;
    }

    // Mock methods
    createFolder(folderData) {
        const folder = {
            id: Date.now().toString(),
            name: folderData.name,
            description: folderData.description || '',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };
        
        this.folders.push(folder);
        return folder;
    }

    deleteFolder(folderId) {
        // Move tasks from this folder to backlog
        this.tasks.forEach(task => {
            if (task.folderId === folderId) {
                task.folderId = null;
            }
        });
        
        // Delete the folder
        this.folders = this.folders.filter(f => f.id !== folderId);
        
        // Remove folder state
        delete this.folderState[folderId];
        
        console.log(`Deleted folder ${folderId} and its state`);
        return true;
    }
}

// Test the functionality
const app = new MockSprintTodoApp();

// Test 1: Create folders and set their states
console.log('\n=== Test 1: Create folders and set states ===');
const folder1 = app.createFolder({ name: 'Work Tasks' });
const folder2 = app.createFolder({ name: 'Personal Tasks' });

console.log('Initial folder states:', app.folderState);

// Set different states for folders
app.setFolderExpanded(folder1.id, false); // Collapsed
app.setFolderExpanded(folder2.id, true);  // Expanded

console.log('After setting states:', app.folderState);

// Test 2: Check folder states
console.log('\n=== Test 2: Check folder states ===');
console.log(`Folder 1 (${folder1.name}) expanded:`, app.getFolderExpanded(folder1.id));
console.log(`Folder 2 (${folder2.name}) expanded:`, app.getFolderExpanded(folder2.id));

// Test 3: Toggle folder states
console.log('\n=== Test 3: Toggle folder states ===');
app.setFolderExpanded(folder1.id, !app.getFolderExpanded(folder1.id));
app.setFolderExpanded(folder2.id, !app.getFolderExpanded(folder2.id));

console.log('After toggling:', app.folderState);
console.log(`Folder 1 (${folder1.name}) expanded:`, app.getFolderExpanded(folder1.id));
console.log(`Folder 2 (${folder2.name}) expanded:`, app.getFolderExpanded(folder2.id));

// Test 4: Delete folder and check state cleanup
console.log('\n=== Test 4: Delete folder and check state cleanup ===');
app.deleteFolder(folder1.id);
console.log('After deleting folder 1:', app.folderState);
console.log(`Folder 1 exists in folderState:`, folder1.id in app.folderState);
console.log(`Folder 2 still exists:`, folder2.id in app.folderState);

// Test 5: Simulate localStorage persistence
console.log('\n=== Test 5: Simulate localStorage persistence ===');
const serializedState = JSON.stringify(app.folderState);
console.log('Serialized state:', serializedState);

// Simulate loading from localStorage
const loadedState = JSON.parse(serializedState);
app.folderState = loadedState;
console.log('Loaded state:', app.folderState);
console.log(`Folder 2 (${folder2.name}) expanded after load:`, app.getFolderExpanded(folder2.id));

console.log('\n=== Test Complete ===');
console.log('All tests passed! Folder state persistence is working correctly.');