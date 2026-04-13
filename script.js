document.addEventListener('DOMContentLoaded', () => {
    const foodForm = document.getElementById('food-form');
    const foodNameInput = document.getElementById('food-name');
    const foodCaloriesDisplay = document.getElementById('food-calories');
    const foodProteinInput = document.getElementById('food-protein');
    const foodCarbsInput = document.getElementById('food-carbs');
    const foodFatInput = document.getElementById('food-fat');
    const mealTypeSelect = document.getElementById('meal-type');
    const foodList = document.getElementById('food-list');
    const filterBtns = document.querySelectorAll('.filter-btn');
    const emptyState = document.getElementById('empty-state');
    const itemsLeft = document.getElementById('items-left');
    const clearAllBtn = document.getElementById('clear-all');
    const dailyGoalInput = document.getElementById('daily-goal');
    const progressCircle = document.getElementById('progress-circle');
    const currentCaloriesEl = document.getElementById('current-calories');
    const goalCaloriesEl = document.getElementById('goal-calories');
    const proteinValueEl = document.getElementById('protein-value');
    const carbsValueEl = document.getElementById('carbs-value');
    const fatValueEl = document.getElementById('fat-value');

    const STORAGE_KEY = 'calorie-tracker-data';
    const GOAL_KEY = 'calorie-tracker-goal';

    let entries = JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
    let dailyGoal = parseInt(localStorage.getItem(GOAL_KEY)) || 2000;
    let currentFilter = 'all';

    dailyGoalInput.value = dailyGoal;
    goalCaloriesEl.textContent = dailyGoal;

    renderEntries();
    updateSummary();

    foodForm.addEventListener('submit', addEntry);
    
    filterBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            filterBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            currentFilter = btn.dataset.filter;
            renderEntries();
        });
    });

    clearAllBtn.addEventListener('click', clearAllEntries);

    dailyGoalInput.addEventListener('change', () => {
        const value = parseInt(dailyGoalInput.value);
        if (value >= 500 && value <= 5000) {
            dailyGoal = value;
            localStorage.setItem(GOAL_KEY, dailyGoal);
            goalCaloriesEl.textContent = dailyGoal;
            updateSummary();
        }
    });

    [foodProteinInput, foodCarbsInput, foodFatInput].forEach(input => {
        input.addEventListener('input', calculateCalories);
        input.addEventListener('blur', () => {
            if (input.value && parseFloat(input.value) < 0) {
                input.value = 0;
                calculateCalories();
            }
        });
    });

    function calculateCalories() {
        const protein = parseFloat(foodProteinInput.value) || 0;
        const carbs = parseFloat(foodCarbsInput.value) || 0;
        const fat = parseFloat(foodFatInput.value) || 0;
        
        const calories = Math.round((protein * 4) + (carbs * 4) + (fat * 9));
        
        foodCaloriesDisplay.textContent = calories;
        
        if (calories > 0) {
            foodCaloriesDisplay.classList.add('has-value');
        } else {
            foodCaloriesDisplay.classList.remove('has-value');
        }
    }

    function saveEntries() {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
        updateSummary();
    }

    function addEntry(e) {
        e.preventDefault();
        
        const name = foodNameInput.value.trim();
        const calories = parseInt(foodCaloriesDisplay.textContent) || 0;
        const protein = Math.max(0, Math.round(parseFloat(foodProteinInput.value) || 0));
        const carbs = Math.max(0, Math.round(parseFloat(foodCarbsInput.value) || 0));
        const fat = Math.max(0, Math.round(parseFloat(foodFatInput.value) || 0));
        const mealType = mealTypeSelect.value;

        if (!name) return;

        const newEntry = {
            id: Date.now().toString(),
            name,
            calories,
            protein,
            carbs,
            fat,
            mealType,
            timestamp: new Date().toISOString()
        };

        entries.push(newEntry);
        saveEntries();
        
        foodNameInput.value = '';
        foodProteinInput.value = '';
        foodCarbsInput.value = '';
        foodFatInput.value = '';
        foodCaloriesDisplay.textContent = '0';
        foodCaloriesDisplay.classList.remove('has-value');
        foodNameInput.focus();
        
        renderEntries();
    }

    function deleteEntry(id) {
        const li = document.getElementById(`entry-${id}`);
        li.classList.add('deleting');
        
        setTimeout(() => {
            entries = entries.filter(entry => entry.id !== id);
            saveEntries();
            renderEntries();
        }, 150);
    }

    function clearAllEntries() {
        if (entries.length === 0) return;

        document.querySelectorAll('#food-list li').forEach(li => li.classList.add('deleting'));

        setTimeout(() => {
            entries = [];
            saveEntries();
            renderEntries();
        }, 150);
    }

    function updateSummary() {
        const totalCalories = entries.reduce((sum, entry) => sum + entry.calories, 0);
        const totalProtein = entries.reduce((sum, entry) => sum + entry.protein, 0);
        const totalCarbs = entries.reduce((sum, entry) => sum + entry.carbs, 0);
        const totalFat = entries.reduce((sum, entry) => sum + entry.fat, 0);

        currentCaloriesEl.textContent = totalCalories;
        proteinValueEl.textContent = totalProtein;
        carbsValueEl.textContent = totalCarbs;
        fatValueEl.textContent = totalFat;

        const progress = Math.min((totalCalories / dailyGoal) * 100, 100);
        const circumference = 2 * Math.PI * 42;
        const offset = circumference - (progress / 100) * circumference;
        progressCircle.style.strokeDashoffset = offset;

        progressCircle.style.stroke = progress > 100 ? '#EF4444' : progress > 80 ? '#F97316' : '#22C55E';

        itemsLeft.textContent = `${entries.length} logged`;
    }

    function renderEntries() {
        foodList.innerHTML = '';
        
        let filteredEntries = entries;
        if (currentFilter !== 'all') {
            filteredEntries = entries.filter(entry => entry.mealType === currentFilter);
        }

        if (filteredEntries.length === 0 && entries.length > 0) {
            emptyState.classList.remove('hidden');
            emptyState.querySelector('span').textContent = `No ${currentFilter}`;
        } else if (entries.length === 0) {
            emptyState.classList.remove('hidden');
            emptyState.querySelector('span').textContent = 'No food logged';
        } else {
            emptyState.classList.add('hidden');
        }

        filteredEntries.forEach(entry => {
            const li = document.createElement('li');
            li.id = `entry-${entry.id}`;

            const badge = entry.mealType.charAt(0).toUpperCase() + entry.mealType.slice(1);

            let macros = '';
            if (entry.protein > 0) macros += `<span class="p">P${entry.protein}</span>`;
            if (entry.carbs > 0) macros += `<span class="c">C${entry.carbs}</span>`;
            if (entry.fat > 0) macros += `<span class="f">F${entry.fat}</span>`;

            li.innerHTML = `
                <div class="info">
                    <div class="name">${escapeHTML(entry.name)}</div>
                    <div class="meta">
                        <span class="cal">${entry.calories} kcal</span>
                        ${macros}
                    </div>
                </div>
                <span class="badge">${badge}</span>
                <button class="del" aria-label="Delete">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <line x1="18" y1="6" x2="6" y2="18"></line>
                        <line x1="6" y1="6" x2="18" y2="18"></line>
                    </svg>
                </button>
            `;

            li.querySelector('.del').addEventListener('click', () => deleteEntry(entry.id));
            foodList.appendChild(li);
        });
    }

    function escapeHTML(str) {
        const div = document.createElement('div');
        div.textContent = str;
        return div.innerHTML;
    }
});
