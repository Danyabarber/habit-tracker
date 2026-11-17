// ==========================================
// 1. ПЕРЕМЕННЫЕ И ХРАНИЛИЩЕ
// ==========================================

// Получаем ссылки на элементы страницы
const addBtn = document.getElementById('add-btn');
const container = document.getElementById('habits-container');

// Ключ, под которым данные лежат в localStorage
const STORAGE_KEY = 'habits_data';

// Загружаем привычки из памяти браузера (или пустой массив, если там ничего нет)
let habits = JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];

// Функция сохранения в память
function saveToLocalStorage() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(habits));
}

// ==========================================
// 2. ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ
// ==========================================

// Функция для получения сегодняшней даты в формате "2026-11-17"
function getTodayDate() {
    return new Date().toISOString().split('T')[0];
}

// Функция для получения дат текущей недели (Пн-Вс)
function getCurrentWeekDates() {
    const today = new Date();
    const dayOfWeek = today.getDay(); // 0 - Вс, 1 - Пн, ...
    
    // Вычисляем, сколько дней отступить до понедельника
    const diffToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
    const monday = new Date(today);
    monday.setDate(today.getDate() + diffToMonday);

    const weekDates = [];
    for (let i = 0; i < 7; i++) {
        const date = new Date(monday);
        date.setDate(monday.getDate() + i);
        weekDates.push(date.toISOString().split('T')[0]);
    }
    return weekDates;
}

// Считаем серию (сколько дней подряд выполнялась привычка)
function calculateStreak(completedDates) {
    if (completedDates.length === 0) return 0;
    
    // Сортируем даты от новых к старым
    const sorted = [...completedDates].sort((a, b) => new Date(b) - new Date(a));
    let streak = 0;
    let currentDate = new Date();
    
    // Проверяем, есть ли сегодняшняя дата
    const todayStr = getTodayDate();
    if (!sorted.includes(todayStr)) {
        // Если сегодня не выполнено, начинаем проверку со вчерашнего дня
        currentDate.setDate(currentDate.getDate() - 1);
    }

    // Идем назад по дням, пока есть совпадения
    while (true) {
        const dateStr = currentDate.toISOString().split('T')[0];
        if (sorted.includes(dateStr)) {
            streak++;
            currentDate.setDate(currentDate.getDate() - 1);
        } else {
            break;
        }
    }
    return streak;
}

// ==========================================
// 3. ОТРИСОВКА ИНТЕРФЕЙСА
// ==========================================

function renderHabits() {
    // Очищаем контейнер
    container.innerHTML = '';

    // Если привычек нет, показываем сообщение
    if (habits.length === 0) {
        container.innerHTML = `
            <div style="text-align: center; color: #666; padding: 40px 20px;">
                <h2>У вас пока нет привычек 😴</h2>
                <p>Нажмите "+ Добавить", чтобы создать первую!</p>
            </div>
        `;
        return;
    }

    const weekDates = getCurrentWeekDates();
    const dayNames = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];

    // Проходимся по каждой привычке
    habits.forEach(habit => {
        const streak = calculateStreak(habit.completedDates);
        const card = document.createElement('div');
        card.className = 'habit-card';

        // Генерируем кнопки для дней недели
        let daysHTML = '';
        weekDates.forEach((date, index) => {
            const isCompleted = habit.completedDates.includes(date);
            const completedClass = isCompleted ? 'completed' : '';
            daysHTML += `
                <button class="day-btn ${completedClass}" 
                        data-habit-id="${habit.id}" 
                        data-date="${date}"
                        aria-label="${dayNames[index]}">
                    ${dayNames[index]}
                </button>
            `;
        });

        // Вставляем HTML карточки (используем textContent для названия, чтобы защититься от XSS)
        card.innerHTML = `
            <div class="habit-header">
                <h2 class="habit-name"></h2>
                <span class="habit-streak">🔥 серия: ${streak} дн.</span>
            </div>
            <div class="days-row">${daysHTML}</div>
            <div class="habit-actions">
                <button class="btn-icon btn-edit" data-habit-id="${habit.id}" aria-label="Редактировать">✏️</button>
                <button class="btn-icon btn-delete" data-habit-id="${habit.id}" aria-label="Удалить">🗑️</button>
            </div>
        `;

        // Безопасно вставляем название (защита от XSS)
        card.querySelector('.habit-name').textContent = habit.name;

        // Добавляем карточку на страницу
        container.appendChild(card);
    });
}

// ==========================================
// 4. ОБРАБОТЧИКИ СОБЫТИЙ
// ==========================================

// 1. Добавление привычки
addBtn.addEventListener('click', () => {
    addBtn.addEventListener('click', () => {
    // Используем встроенный prompt, но с защитой от блокировки
    const name = window.prompt('Введите название привычки:');
    
    // Если нажали "Отмена" или ввели пустоту
    if (name === null) {
        return; 
    }
    
    if (name.trim() === '') {
        alert('Название не может быть пустым!');
        return;
    }

    const newHabit = {
        id: crypto.randomUUID(),
        name: name.trim(),
        completedDates: []
    };

    habits.push(newHabit);
    saveToLocalStorage();
    renderHabits();
});
    const name = prompt('Введите название привычки:');
    if (!name || name.trim() === '') {
        alert('Название не может быть пустым!');
        return;
    }

    const newHabit = {
        id: crypto.randomUUID(), // Генерируем уникальный ID
        name: name.trim(),
        completedDates: [] // Изначально ничего не выполнено
    };

    habits.push(newHabit);
    saveToLocalStorage();
    renderHabits();
});

// 2. Делегирование событий (клики по кнопкам внутри карточек)
container.addEventListener('click', (e) => {
    // Если кликнули по кнопке дня
    if (e.target.classList.contains('day-btn')) {
        const habitId = e.target.dataset.habitId;
        const date = e.target.dataset.date;
        
        const habit = habits.find(h => h.id === habitId);
        if (!habit) return;

        // Если дата уже есть - убираем, если нет - добавляем
        if (habit.completedDates.includes(date)) {
            habit.completedDates = habit.completedDates.filter(d => d !== date);
        } else {
            habit.completedDates.push(date);
        }

        saveToLocalStorage();
        renderHabits();
    }

    // Если кликнули по кнопке "Удалить"
    if (e.target.closest('.btn-delete')) {
        const habitId = e.target.closest('.btn-delete').dataset.habitId;
        if (confirm('Удалить эту привычку?')) {
            habits = habits.filter(h => h.id !== habitId);
            saveToLocalStorage();
            renderHabits();
        }
    }

    // Если кликнули по кнопке "Редактировать"
    if (e.target.closest('.btn-edit')) {
        const habitId = e.target.closest('.btn-edit').dataset.habitId;
        const habit = habits.find(h => h.id === habitId);
        if (!habit) return;

        const newName = prompt('Новое название привычки:', habit.name);
        if (newName && newName.trim() !== '') {
            habit.name = newName.trim();
            saveToLocalStorage();
            renderHabits();
        }
    }
});

// ==========================================
// 5. ЗАПУСК ПРИЛОЖЕНИЯ
// ==========================================

// При загрузке страницы сразу отрисовываем привычки
renderHabits();