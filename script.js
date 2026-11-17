// --- Состояние приложения ---
let habits = JSON.parse(localStorage.getItem('habits_v2')) || [];
const todayStr = new Date().toISOString().split('T')[0];

// --- DOM Элементы ---
const container = document.getElementById('habits-container');
const modal = document.getElementById('add-modal');
const openModalBtn = document.getElementById('open-modal-btn');
const closeModalBtn = document.getElementById('close-modal-btn');
const saveHabitBtn = document.getElementById('save-habit-btn');
const nameInput = document.getElementById('habit-name-input');
const iconPicker = document.getElementById('icon-picker');
const iconPreview = document.getElementById('modal-icon-preview');
const progressText = document.getElementById('daily-progress-text');
const progressRing = document.getElementById('progress-ring');

// Текущая выбранная иконка
let selectedIcon = '💧';

// --- Инициализация ---
function init() {
    // Установка текущей даты в шапку
    const options = { day: 'numeric', month: 'long' };
    document.getElementById('current-date').textContent = new Date().toLocaleDateString('ru-RU', options);
    
    renderHabits();
    updateProgress();

    // Слушатели модального окна
    openModalBtn.addEventListener('click', () => {
        modal.classList.remove('hidden');
        nameInput.focus();
    });

    closeModalBtn.addEventListener('click', () => {
        modal.classList.add('hidden');
        nameInput.value = '';
        resetIconPicker();
    });

    // Выбор иконки
    iconPicker.addEventListener('click', (e) => {
        if (e.target.classList.contains('icon-option')) {
            document.querySelectorAll('.icon-option').forEach(btn => btn.classList.remove('active'));
            e.target.classList.add('active');
            selectedIcon = e.target.dataset.icon;
            iconPreview.textContent = selectedIcon;
        }
    });

    // Сохранение новой привычки
    saveHabitBtn.addEventListener('click', () => {
        const name = nameInput.value.trim();
        if (!name) return alert('Введите название');

        const newHabit = {
            id: Date.now().toString(),
            name: name,
            icon: selectedIcon,
            completedDates: [] // Массив дат, когда выполнено
        };

        habits.push(newHabit);
        saveData();
        renderHabits();
        updateProgress();
        
        modal.classList.add('hidden');
        nameInput.value = '';
        resetIconPicker();
    });
}

function resetIconPicker() {
    selectedIcon = '💧';
    iconPreview.textContent = selectedIcon;
    document.querySelectorAll('.icon-option').forEach(btn => btn.classList.remove('active'));
    document.querySelector('.icon-option[data-icon="💧"]').classList.add('active');
}

// --- Сохранение ---
function saveData() {
    localStorage.setItem('habits_v2', JSON.stringify(habits));
}

// --- Рендер ---
function renderHabits() {
    container.innerHTML = '';

    if (habits.length === 0) {
        container.innerHTML = `<p style="text-align:center; color:#8e8e93; margin-top:20px;">Нет привычек. Добавьте первую!</p>`;
        return;
    }

    habits.forEach(habit => {
        const isCompletedToday = habit.completedDates.includes(todayStr);
        
        const card = document.createElement('div');
        card.className = `habit-card ${isCompletedToday ? 'completed' : ''}`;
        
        card.innerHTML = `
            <div class="habit-icon">${habit.icon}</div>
            <div class="habit-info">
                <div class="habit-name"></div>
                <div class="habit-goal">${isCompletedToday ? 'Выполнено' : 'Нажмите, чтобы выполнить'}</div>
            </div>
            <div class="check-circle">✓</div>
        `;
        
        // Защита от XSS
        card.querySelector('.habit-name').textContent = habit.name;

        // Обработчик клика по карточке (отметить/снять)
        card.addEventListener('click', () => toggleHabit(habit.id));
        
        container.appendChild(card);
    });
}

// --- Логика ---
function toggleHabit(id) {
    const habit = habits.find(h => h.id === id);
    if (!habit) return;

    if (habit.completedDates.includes(todayStr)) {
        // Удаляем сегодняшнюю дату
        habit.completedDates = habit.completedDates.filter(d => d !== todayStr);
    } else {
        // Добавляем сегодняшнюю дату
        habit.completedDates.push(todayStr);
    }

    saveData();
    renderHabits();
    updateProgress();
}

// --- Прогресс ---
function updateProgress() {
    const total = habits.length;
    if (total === 0) {
        progressText.textContent = `0/0`;
        progressRing.style.strokeDasharray = `0, 100`;
        return;
    }

    const completedToday = habits.filter(h => h.completedDates.includes(todayStr)).length;
    progressText.textContent = `${completedToday}/${total}`;

    // Расчет процента для SVG круга (длина окружности 100)
    const percentage = (completedToday / total) * 100;
    progressRing.style.strokeDasharray = `${percentage}, 100`;
}

// Запуск
init();