document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements
    const todoForm = document.getElementById('todo-form');
    const todoInput = document.getElementById('todo-input');
    const todoList = document.getElementById('todo-list');
    const filterBtns = document.querySelectorAll('.filter-btn');
    const emptyState = document.getElementById('empty-state');
    const itemsLeft = document.getElementById('items-left');
    const clearCompletedBtn = document.getElementById('clear-completed');

    // State
    let tasks = JSON.parse(localStorage.getItem('vanilla-todo-tasks')) || [];
    let currentFilter = 'all';

    // Init
    renderTasks();
    updateCounts();

    // Event Listeners
    todoForm.addEventListener('submit', addTask);
    
    filterBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            filterBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            currentFilter = btn.dataset.filter;
            renderTasks();
        });
    });

    clearCompletedBtn.addEventListener('click', clearCompleted);

    // Functions
    function saveTasks() {
        localStorage.setItem('vanilla-todo-tasks', JSON.stringify(tasks));
        updateCounts();
    }

    function addTask(e) {
        e.preventDefault();
        
        const text = todoInput.value.trim();
        if (!text) return;

        const newTask = {
            id: Date.now().toString(),
            text: text,
            completed: false
        };

        tasks.unshift(newTask);
        saveTasks();
        
        todoInput.value = '';
        renderTasks();
    }

    function toggleTask(id) {
        tasks = tasks.map(task => 
            task.id === id ? { ...task, completed: !task.completed } : task
        );
        saveTasks();
        renderTasks();
    }

    function deleteTask(id) {
        const li = document.getElementById(`task-${id}`);
        li.classList.add('deleting');
        
        // Wait for animation to finish
        setTimeout(() => {
            tasks = tasks.filter(task => task.id !== id);
            saveTasks();
            renderTasks();
        }, 300);
    }

    function clearCompleted() {
        const completedCount = tasks.filter(t => t.completed).length;
        if (completedCount === 0) return;

        // Apply deletion animation to completed elements
        const listItems = document.querySelectorAll('.todo-item.completed');
        listItems.forEach(li => li.classList.add('deleting'));

        setTimeout(() => {
            tasks = tasks.filter(task => !task.completed);
            saveTasks();
            renderTasks();
        }, 300);
    }

    function updateCounts() {
        const activeCount = tasks.filter(task => !task.completed).length;
        const totalCount = tasks.length;
        
        itemsLeft.textContent = `${activeCount} item${activeCount !== 1 ? 's' : ''} left`;
        
        if (totalCount === 0) {
            emptyState.classList.remove('hidden');
        } else {
            emptyState.classList.add('hidden');
        }
        
        // Show/hide clear button based on whether there are completed tasks
        const hasCompleted = tasks.some(task => task.completed);
        clearCompletedBtn.style.opacity = hasCompleted ? '1' : '0.5';
        clearCompletedBtn.style.pointerEvents = hasCompleted ? 'auto' : 'none';
    }

    function renderTasks() {
        todoList.innerHTML = '';
        
        let filteredTasks = tasks;
        if (currentFilter === 'active') {
            filteredTasks = tasks.filter(task => !task.completed);
        } else if (currentFilter === 'completed') {
            filteredTasks = tasks.filter(task => task.completed);
        }

        if (filteredTasks.length === 0 && tasks.length > 0) {
            emptyState.classList.remove('hidden');
            emptyState.querySelector('p').textContent = `No ${currentFilter} tasks found!`;
        } else if (tasks.length === 0) {
            emptyState.classList.remove('hidden');
            emptyState.querySelector('p').textContent = "You're all caught up!";
        } else {
            emptyState.classList.add('hidden');
        }

        filteredTasks.forEach(task => {
            const li = document.createElement('li');
            li.className = `todo-item ${task.completed ? 'completed' : ''}`;
            li.id = `task-${task.id}`;

            li.innerHTML = `
                <div class="checkbox-wrapper">
                    <input type="checkbox" class="todo-checkbox" id="check-${task.id}" ${task.completed ? 'checked' : ''}>
                    <label for="check-${task.id}" class="custom-checkbox"></label>
                </div>
                <span class="todo-text">${escapeHTML(task.text)}</span>
                <button class="delete-btn" aria-label="Delete task">
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <polyline points="3 6 5 6 21 6"></polyline>
                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                        <line x1="10" y1="11" x2="10" y2="17"></line>
                        <line x1="14" y1="11" x2="14" y2="17"></line>
                    </svg>
                </button>
            `;

            // Event listener for checkbox
            const checkbox = li.querySelector('.todo-checkbox');
            checkbox.addEventListener('change', () => toggleTask(task.id));

            // Event listener for delete button
            const deleteBtn = li.querySelector('.delete-btn');
            deleteBtn.addEventListener('click', () => deleteTask(task.id));

            todoList.appendChild(li);
        });
    }

    // Utility function to prevent XSS
    function escapeHTML(str) {
        const div = document.createElement('div');
        div.textContent = str;
        return div.innerHTML;
    }
});
