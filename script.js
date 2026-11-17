// --- Состояние приложения ---
let habits = JSON.parse(localStorage.getItem('habits_v2')) || [];
const todayStr = new Date().toISOString().split('T')[0];

// --- DOM Элементы ---
const container = document.getElementById('habits-container');
const addModal = document.getElementById('add-modal');
const actionModal = document.getElementById('action-modal');

const openModalBtn = document.getElementById('open-modal-btn');
const closeModalBtn = document.getElementById('close-modal-btn');
const saveHabitBtn = document.getElementById('save-habit-btn');
const nameInput = document.getElementById('habit-name-input');
const iconPicker = document.getElementById('icon-picker');
const iconPreview = document.getElementById('modal-icon-preview');

let selectedIcon = '💧';
let currentEditId = null; // Для редактирования

// --- Инициализация ---
function init() {
    const options = { day: 'numeric', month: 'long' };
    document.getElementById('current-date').textContent = new Date().toLocaleDateString('ru-RU', options);
    
    renderHabits();
    updateProgress();
    updateStatistics(); // Считаем статистику
    setupNavigation();  // Включаем нижнее меню
    setupModals();      // Настраиваем кнопки в модалках
}

// --- Навигация по экранам ---
function setupNavigation() {
    document.querySelectorAll('.nav-item[data-target]').forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            
            // Убираем active у всех
            document.querySelectorAll('.nav-item').forEach(nav => nav.classList.remove('active'));
            document.querySelectorAll('.screen').forEach(scr => scr.classList.remove('active'));
            
            // Добавляем active текущему
            item.classList.add('active');
            const targetId = item.dataset.target;
            document.getElementById(targetId).classList.add('active');

            if (targetId === 'screen-stats') {
                updateStatistics(); // Обновляем при переходе
            }
        });
    });
}

// --- Модальные окна ---
function setupModals() {
    // Открытие добавления
    openModalBtn.addEventListener('click', () => {
        currentEditId = null;
        document.querySelector('.modal-header h3').textContent = 'Новая привычка';
        addModal.classList.remove('hidden');
        nameInput.focus();
    });

    // Закрытие
    const closeAddModal = () => {
        addModal.classList.add('hidden');
        nameInput.value = '';
        resetIconPicker();
    };
    closeModalBtn.addEventListener('click', closeAddModal);
    document.getElementById('close-action-btn').addEventListener('click', () => actionModal.classList.add('hidden'));
    document.getElementById('cancel-action-btn').addEventListener('click', () => actionModal.classList.add('hidden'));

    // Выбор иконки
    iconPicker.addEventListener('click', (e) => {
        if (e.target.classList.contains('icon-option')) {
            document.querySelectorAll('.icon-option').forEach(btn => btn.classList.remove('active'));
            e.target.classList.add('active');
            selectedIcon = e.target.dataset.icon;
            iconPreview.textContent = selectedIcon;
        }
    });

    // Сохранение (Добавление ИЛИ Редактирование)
    saveHabitBtn.addEventListener('click', () => {
        const name = nameInput.value.trim();
        if (!name) return alert('Введите название');

        if (currentEditId) {
            // Редактирование
            const habit = habits.find(h => h.id === currentEditId);
            if (habit) {
                habit.name = name;
                habit.icon = selectedIcon;
            }
        } else {
            // Добавление
            const newHabit = {
                id: Date.now().toString(),
                name: name,
                icon: selectedIcon,
                completedDates: []
            };
            habits.push(newHabit);
        }

        saveData();
        renderHabits();
        updateProgress();
        updateStatistics();
        closeAddModal();
    });

    // Действия с привычкой (Удалить/Редактировать)
    document.getElementById('delete-habit-btn').addEventListener('click', () => {
        if (confirm('Удалить привычку?')) {
            habits = habits.filter(h => h.id !== currentEditId);
            saveData();
            renderHabits();
            updateProgress();
            updateStatistics();
            actionModal.classList.add('hidden');
        }
    });

    document.getElementById('edit-habit-btn').addEventListener('click', () => {
        const habit = habits.find(h => h.id === currentEditId);
        if (!habit) return;
        
        // Заполняем форму
        nameInput.value = habit.name;
        selectedIcon = habit.icon;
        iconPreview.textContent = habit.icon;
        
        // Включаем нужную иконку
        document.querySelectorAll('.icon-option').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.icon === habit.icon);
        });

        document.querySelector('.modal-header h3').textContent = 'Редактировать';
        actionModal.classList.add('hidden');
        addModal.classList.remove('hidden');
    });
}

function resetIconPicker() {
    selectedIcon = '💧';
    iconPreview.textContent = selectedIcon;
    document.querySelectorAll('.icon-option').forEach(btn => btn.classList.remove('active'));
    document.querySelector('.icon-option[data-icon="💧"]').classList.add('active');
}

// --- Рендер Главной ---
function renderHabits() {
    container.innerHTML = '';

    if (habits.length === 0) {
        container.innerHTML = `<p style="text-align:center; color:#8e8e93; margin-top:20px;">Нет привычек. Нажмите «+», чтобы добавить!</p>`;
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
        
        card.querySelector('.habit-name').textContent = habit.name;

        // Левый клик — отметить/снять
        card.addEventListener('click', () => toggleHabit(habit.id));
        
        // Правый клик (или долгое нажатие) — меню действий
        card.addEventListener('contextmenu', (e) => {
            e.preventDefault();
            currentEditId = habit.id;
            actionModal.classList.remove('hidden');
        });

        container.appendChild(card);
    });
}

// --- Статистика ---
function updateStatistics() {
    const totalHabits = habits.length;
    let totalCompleted = 0;
    let totalPossible = 0;

    // Считаем общее количество выполненных дней
    habits.forEach(h => {
        totalCompleted += h.completedDates.length;
        // Для простоты: считаем, что привычка создана 30 дней назад
        totalPossible += 30; 
    });

    const percentage = totalPossible === 0 ? 0 : Math.round((totalCompleted / totalPossible) * 100);
    
    // Обновляем кружок
    document.getElementById('stats-percentage').textContent = `${percentage}%`;
    const ring = document.getElementById('stats-ring');
    ring.style.strokeDasharray = `${percentage}, 100`;

    // Обновляем легенду
    document.getElementById('stats-completed').textContent = totalCompleted;
    document.getElementById('stats-skipped').textContent = Math.max(0, totalPossible - totalCompleted);

    // Лучшие привычки (сортируем по количеству выполнений)
    const sortedHabits = [...habits].sort((a, b) => b.completedDates.length - a.completedDates.length).slice(0, 3);
    
    const bestContainer = document.getElementById('best-habits-container');
    bestContainer.innerHTML = '';

    if (sortedHabits.length === 0) {
        bestContainer.innerHTML = `<p style="text-align:center; color:#8e8e93;">Пока нет данных</p>`;
        return;
    }

    sortedHabits.forEach(h => {
        const habitPercent = totalPossible === 0 ? 0 : Math.round((h.completedDates.length / 30) * 100);
        const item = document.createElement('div');
        item.className = 'best-habit-item';
        item.innerHTML = `
            <div class="icon">${h.icon}</div>
            <div class="info">
                <h4></h4>
                <p>Выполнено ${h.completedDates.length} раз</p>
            </div>
            <div class="percent">${habitPercent}%</div>
        `;
        item.querySelector('h4').textContent = h.name;
        bestContainer.appendChild(item);
    });
}

// --- Логика ---
function toggleHabit(id) {
    const habit = habits.find(h => h.id === id);
    if (!habit) return;

    if (habit.completedDates.includes(todayStr)) {
        habit.completedDates = habit.completedDates.filter(d => d !== todayStr);
    } else {
        habit.completedDates.push(todayStr);
    }

    saveData();
    renderHabits();
    updateProgress();
}

function updateProgress() {
    const total = habits.length;
    if (total === 0) {
        document.getElementById('daily-progress-text').textContent = `0/0`;
        document.getElementById('progress-ring').style.strokeDasharray = `0, 100`;
        return;
    }

    const completedToday = habits.filter(h => h.completedDates.includes(todayStr)).length;
    document.getElementById('daily-progress-text').textContent = `${completedToday}/${total}`;

    const percentage = (completedToday / total) * 100;
    document.getElementById('progress-ring').style.strokeDasharray = `${percentage}, 100`;
}

function saveData() {
    localStorage.setItem('habits_v2', JSON.stringify(habits));
}

// Запуск
init();