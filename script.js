// ==========================================
// 1. ПОДГОТОВКА И ЗАГРУЗКА ДАННЫХ
// ==========================================

// Берем сохраненные привычки из памяти браузера. Если их нет, создаем пустой массив.
let habits = JSON.parse(localStorage.getItem('habits_v2')) || [];

// Получаем сегодняшнюю дату (например, "2023-11-17")
let today = new Date();
let todayStr = today.toISOString().split('T')[0];

// Находим нужные элементы на странице по их ID
let container = document.getElementById('habits-container');
let addModal = document.getElementById('add-modal');
let actionModal = document.getElementById('action-modal');
let nameInput = document.getElementById('habit-name-input');
let iconPicker = document.getElementById('icon-picker');
let iconPreview = document.getElementById('modal-icon-preview');
let themeToggleBtn = document.getElementById('theme-toggle');

// Текущая выбранная иконка и ID привычки (если мы её редактируем)
let selectedIcon = 'water_drop'; 
let currentEditId = null;

// Главная функция, которая запускается при старте
function startApp() {
    // Выводим сегодняшнюю дату в шапку
    let options = { day: 'numeric', month: 'long' };
    document.getElementById('current-date').textContent = today.toLocaleDateString('ru-RU', options);
    
    setupTheme();       // Включаем темную/светлую тему
    renderHabits();     // Рисуем карточки привычек
    updateProgress();   // Считаем прогресс за сегодня
    updateStatistics(); // Считаем общую статистику
    renderCalendar();   // Рисуем календарь
    setupNavigation();  // Включаем меню навигации
    setupModals();      // Включаем кнопки добавления/удаления
    setupProfile();     // Включаем кнопку сброса в профиле
}

// ==========================================
// 2. ПЕРЕКЛЮЧЕНИЕ ТЕМЫ (Светлая/Темная)
// ==========================================
function setupTheme() {
    // Берем тему из памяти (по умолчанию светлая)
    let savedTheme = localStorage.getItem('theme') || 'light';
    document.documentElement.setAttribute('data-theme', savedTheme);
    
    // Меняем иконку на кнопке
    if (savedTheme === 'dark') {
        themeToggleBtn.innerHTML = '<span class="material-symbols-rounded">light_mode</span>';
    } else {
        themeToggleBtn.innerHTML = '<span class="material-symbols-rounded">dark_mode</span>';
    }

    // Слушаем клик по кнопке темы
    themeToggleBtn.addEventListener('click', function() {
        let currentTheme = document.documentElement.getAttribute('data-theme');
        // Меняем тему на противоположную
        let newTheme = (currentTheme === 'dark') ? 'light' : 'dark';
        
        document.documentElement.setAttribute('data-theme', newTheme);
        localStorage.setItem('theme', newTheme); // Сохраняем выбор
        
        // Меняем иконку
        if (newTheme === 'dark') {
            themeToggleBtn.innerHTML = '<span class="material-symbols-rounded">light_mode</span>';
        } else {
            themeToggleBtn.innerHTML = '<span class="material-symbols-rounded">dark_mode</span>';
        }
    });
}

// ==========================================
// 3. НАВИГАЦИЯ ПО ЭКРАНАМ
// ==========================================
function switchScreen(targetId) {
    // Убираем класс 'active' у всех кнопок меню и экранов
    let allNavs = document.querySelectorAll('.nav-item');
    for (let i = 0; i < allNavs.length; i++) { allNavs[i].classList.remove('active'); }
    
    let allScreens = document.querySelectorAll('.screen');
    for (let i = 0; i < allScreens.length; i++) { allScreens[i].classList.remove('active'); }
    
    // Включаем нужный экран
    document.getElementById(targetId).classList.add('active');
    
    // Подсвечиваем кнопку меню
    let activeNav = document.querySelector('.nav-item[data-target="' + targetId + '"]');
    if (activeNav) { activeNav.classList.add('active'); }
}

function setupNavigation() {
    // Находим все кнопки в нижнем меню
    let navItems = document.querySelectorAll('.nav-item[data-target]');
    for (let i = 0; i < navItems.length; i++) {
        navItems[i].addEventListener('click', function(e) {
            e.preventDefault(); // Отменяем стандартный переход по ссылке
            let target = navItems[i].getAttribute('data-target');
            switchScreen(target);
            
            // Обновляем данные при переходе на вкладки
            if (target === 'screen-stats') { updateStatistics(); }
            if (target === 'screen-calendar') { renderCalendar(); }
            if (target === 'screen-history') { renderHistory(); }
        });
    }

    // КЛИК ПО ДАТЕ НА ГЛАВНОМ ЭКРАНЕ (НОВОЕ)
    let dateBtn = document.getElementById('open-calendar-btn');
    dateBtn.addEventListener('click', function() {
        switchScreen('screen-calendar'); // Переходим на вкладку календаря
        renderCalendar();                // Обновляем календарь
    });

    // Переход в профиль по клику на аватарку
    let avatars = ['profile-btn', 'profile-btn-stats', 'profile-btn-cal', 'profile-btn-hist'];
    for (let i = 0; i < avatars.length; i++) {
        let btn = document.getElementById(avatars[i]);
        if (btn) {
            btn.addEventListener('click', function() {
                switchScreen('screen-profile');
                updateProfileStats();
            });
        }
    }
}

// ==========================================
// 4. МОДАЛЬНЫЕ ОКНА (Добавление, Удаление)
// ==========================================
function setupModals() {
    // Клик по кнопке "Плюс"
    document.getElementById('open-modal-btn').addEventListener('click', function() {
        currentEditId = null; // Сбрасываем ID (значит создаем новую)
        document.getElementById('modal-title').textContent = 'Новая привычка';
        nameInput.value = ''; // Очищаем поле ввода
        resetIconPicker();    // Сбрасываем иконку
        addModal.classList.remove('hidden'); // Показываем окно
    });

    // Закрытие окон
    document.getElementById('close-modal-btn').addEventListener('click', function() { addModal.classList.add('hidden'); });
    document.getElementById('close-action-btn').addEventListener('click', function() { actionModal.classList.add('hidden'); });
    document.getElementById('cancel-action-btn').addEventListener('click', function() { actionModal.classList.add('hidden'); });

    // Выбор иконки в модалке
    iconPicker.addEventListener('click', function(e) {
        let btn = e.target.closest('.icon-option');
        if (btn) {
            // Убираем рамку со всех иконок
            let options = document.querySelectorAll('.icon-option');
            for (let i = 0; i < options.length; i++) { options[i].classList.remove('active'); }
            
            // Включаем рамку для нажатой
            btn.classList.add('active');
            selectedIcon = btn.getAttribute('data-icon'); // Берем название иконки
            
            // Меняем большую иконку вверху
            iconPreview.innerHTML = '<span class="material-symbols-rounded">' + selectedIcon + '</span>';
        }
    });

    // Кнопка "Сохранить"
    document.getElementById('save-habit-btn').addEventListener('click', function() {
        let name = nameInput.value.trim(); // Убираем пробелы
        if (name === '') { alert('Введите название!'); return; }

        // Если это редактирование старой привычки
        if (currentEditId !== null) {
            for (let i = 0; i < habits.length; i++) {
                if (habits[i].id === currentEditId) {
                    habits[i].name = name;
                    habits[i].icon = selectedIcon;
                }
            }
        } else {
            // Если создаем новую
            habits.push({ id: Date.now().toString(), name: name, icon: selectedIcon, completedDates: [] });
        }

        // Сохраняем и перерисовываем всё
        saveData(); renderHabits(); updateProgress(); updateStatistics(); renderCalendar(); renderHistory();
        addModal.classList.add('hidden');
    });

    // Кнопка "Удалить"
    document.getElementById('delete-habit-btn').addEventListener('click', function() {
        if (confirm('Удалить привычку?')) {
            let newHabits = [];
            for (let i = 0; i < habits.length; i++) {
                if (habits[i].id !== currentEditId) { newHabits.push(habits[i]); } // Оставляем все, кроме удаляемой
            }
            habits = newHabits;
            saveData(); renderHabits(); updateProgress(); updateStatistics(); renderCalendar(); renderHistory();
            actionModal.classList.add('hidden');
        }
    });

    // Кнопка "Редактировать"
    document.getElementById('edit-habit-btn').addEventListener('click', function() {
        let habitToEdit = null;
        for (let i = 0; i < habits.length; i++) {
            if (habits[i].id === currentEditId) { habitToEdit = habits[i]; }
        }
        if (habitToEdit) {
            nameInput.value = habitToEdit.name;
            selectedIcon = habitToEdit.icon;
            iconPreview.innerHTML = '<span class="material-symbols-rounded">' + selectedIcon + '</span>';
            
            // Подсвечиваем нужную иконку в списке
            let options = document.querySelectorAll('.icon-option');
            for (let i = 0; i < options.length; i++) {
                options[i].classList.remove('active');
                if (options[i].getAttribute('data-icon') === selectedIcon) { options[i].classList.add('active'); }
            }
            document.getElementById('modal-title').textContent = 'Редактировать';
            actionModal.classList.add('hidden'); addModal.classList.remove('hidden');
        }
    });
}

// Сброс иконки на каплю
function resetIconPicker() {
    selectedIcon = 'water_drop';
    iconPreview.innerHTML = '<span class="material-symbols-rounded">water_drop</span>';
    let options = document.querySelectorAll('.icon-option');
    for (let i = 0; i < options.length; i++) {
        options[i].classList.remove('active');
        if (options[i].getAttribute('data-icon') === 'water_drop') { options[i].classList.add('active'); }
    }
}

// ==========================================
// 5. ОТРИСОВКА ГЛАВНОГО ЭКРАНА
// ==========================================
function renderHabits() {
    container.innerHTML = ''; // Очищаем экран

        if (habits.length === 0) {
        container.innerHTML = `
            <div style="grid-column: 1/-1; text-align: center; margin-top: 40px;">
                <p style="color:#8e8e93; font-size: 16px; margin-bottom: 15px;">У вас пока нет привычек</p>
                <button onclick="document.getElementById('open-modal-btn').click()" style="background: var(--primary); color: white; border: none; padding: 12px 24px; border-radius: 12px; font-size: 16px; font-weight: 600; cursor: pointer; box-shadow: 0 4px 12px rgba(52, 199, 89, 0.3);">
                    + Создать первую
                </button>
            </div>
        `;
        return;
    }

    // Перебираем все привычки
    for (let i = 0; i < habits.length; i++) {
        let habit = habits[i];
        let isCompletedToday = habit.completedDates.includes(todayStr); // Выполнена ли сегодня?
        let streak = calculateStreak(habit.completedDates); // Считаем серию
        
        let card = document.createElement('div');
        card.className = 'habit-card';
        if (isCompletedToday) { card.className = 'habit-card completed'; }
        
        let streakHTML = streak > 0 ? '<span class="habit-streak-badge">🔥 ' + streak + ' дн.</span>' : '';
        let statusText = isCompletedToday ? 'Выполнено' : 'Нажмите, чтобы выполнить';

        // Вставляем HTML-код карточки с иконками
        card.innerHTML = 
            '<div class="habit-icon"><span class="material-symbols-rounded">' + habit.icon + '</span></div>' +
            '<div class="habit-info">' +
                '<div class="habit-name">' + habit.name + ' ' + streakHTML + '</div>' +
                '<div class="habit-goal">' + statusText + '</div>' +
            '</div>' +
            '<div class="check-circle"><span class="material-symbols-rounded">check</span></div>' +
            '<button class="more-btn"><span class="material-symbols-rounded">more_vert</span></button>';

        // Клик по карточке (выполнить)
        card.addEventListener('click', function(e) {
            if (e.target.closest('.more-btn')) { return; } // Если нажали три точки, не выполняем
            toggleHabit(habit.id);
        });

        // Клик по трем точкам (меню)
        card.querySelector('.more-btn').addEventListener('click', function(e) {
            e.stopPropagation(); // Останавливаем клик, чтобы карточка не выполнилась
            currentEditId = habit.id;
            actionModal.classList.remove('hidden');
        });

        container.appendChild(card); // Добавляем на страницу
    }
}

// ==========================================
// 6. ЛОГИКА ВЫПОЛНЕНИЯ И СЕРИИ
// ==========================================
function toggleHabit(id) {
    for (let i = 0; i < habits.length; i++) {
        if (habits[i].id === id) {
            let habit = habits[i];
            // Если сегодня уже выполнено - удаляем дату
            if (habit.completedDates.includes(todayStr)) {
                let newDates = [];
                for (let j = 0; j < habit.completedDates.length; j++) {
                    if (habit.completedDates[j] !== todayStr) { newDates.push(habit.completedDates[j]); }
                }
                habit.completedDates = newDates;
            } else {
                // Если нет - добавляем сегодняшнюю дату
                habit.completedDates.push(todayStr);
            }
        }
    }
    saveData(); renderHabits(); updateProgress(); renderCalendar(); renderHistory();
}

// Считаем серию (сколько дней подряд)
function calculateStreak(dates) {
    if (dates.length === 0) { return 0; }
    let streak = 0;
    let checkDate = new Date();
    while (true) {
        let dateStr = checkDate.toISOString().split('T')[0];
        if (dates.includes(dateStr)) {
            streak++; checkDate.setDate(checkDate.getDate() - 1); // Шагаем на день назад
        } else {
            if (streak === 0) {
                checkDate.setDate(checkDate.getDate() - 1);
                let yesterday = checkDate.toISOString().split('T')[0];
                if (!dates.includes(yesterday)) { break; } // Если и вчера не было, серия прервалась
            } else { break; }
        }
    }
    return streak;
}

// ==========================================
// 7. ОБНОВЛЕНИЕ ПРОГРЕССА И СТАТИСТИКИ
// ==========================================
function updateProgress() {
    let total = habits.length;
    let completedToday = 0;
    for (let i = 0; i < habits.length; i++) {
        if (habits[i].completedDates.includes(todayStr)) { completedToday++; }
    }
    document.getElementById('daily-progress-text').textContent = completedToday + '/' + total;
    
    // Высчитываем процент для круга
    let percent = total > 0 ? (completedToday / total) * 100 : 0;
    document.getElementById('progress-ring').setAttribute('stroke-dasharray', percent + ', 100');
}

function updateStatistics() {
    let totalCompleted = 0;
    let totalPossible = habits.length * 30; // Условно 30 дней
    for (let i = 0; i < habits.length; i++) { totalCompleted += habits[i].completedDates.length; }
    let percent = totalPossible > 0 ? Math.round((totalCompleted / totalPossible) * 100) : 0;
    
    document.getElementById('stats-percentage').textContent = percent + '%';
    document.getElementById('stats-ring').setAttribute('stroke-dasharray', percent + ', 100');
    document.getElementById('stats-completed').textContent = totalCompleted;
    document.getElementById('stats-skipped').textContent = totalPossible - totalCompleted;

    // Сортируем привычки по количеству выполнений (для топа)
    let sorted = habits.slice();
    sorted.sort(function(a, b) { return b.completedDates.length - a.completedDates.length; });
    let top3 = sorted.slice(0, 3); // Берем первые 3

    let containerBest = document.getElementById('best-habits-container');
    containerBest.innerHTML = '';

    for (let i = 0; i < top3.length; i++) {
        let h = top3[i];
        let item = document.createElement('div');
        item.className = 'best-habit-item';
        item.innerHTML = 
            '<div class="habit-icon"><span class="material-symbols-rounded">' + h.icon + '</span></div>' +
            '<div class="info"><h4>' + h.name + '</h4><p>Выполнено ' + h.completedDates.length + ' раз</p></div>' +
            '<div class="percent">' + (h.completedDates.length * 3) + '%</div>';
        containerBest.appendChild(item);
    }
}

// ==========================================
// 8. КАЛЕНДАРЬ
// ==========================================
function renderCalendar() {
    let year = today.getFullYear();
    let month = today.getMonth();
    let months = ["Январь", "Февраль", "Март", "Апрель", "Май", "Июнь", "Июль", "Август", "Сентябрь", "Октябрь", "Ноябрь", "Декабрь"];
    document.getElementById('calendar-month-year').textContent = months[month] + ' ' + year;

    let firstDay = new Date(year, month, 1);
    let startDayIndex = firstDay.getDay(); // День недели первого числа
    if (startDayIndex === 0) { startDayIndex = 7; } // Делаем понедельник первым
    
    let daysInMonth = new Date(year, month + 1, 0).getDate(); // Сколько дней в месяце
    let daysContainer = document.getElementById('calendar-days');
    daysContainer.innerHTML = '';

    // Добавляем пустые клетки до первого числа
    for (let i = 1; i < startDayIndex; i++) {
        let emptyDiv = document.createElement('div');
        emptyDiv.className = 'cal-day';
        daysContainer.appendChild(emptyDiv);
    }

    // Собираем все даты, когда были выполнены привычки
    let allDates = [];
    for (let i = 0; i < habits.length; i++) {
        for (let j = 0; j < habits[i].completedDates.length; j++) {
            allDates.push(habits[i].completedDates[j]);
        }
    }

    // Рисуем числа месяца
    for (let i = 1; i <= daysInMonth; i++) {
        let dayDiv = document.createElement('div');
        dayDiv.className = 'cal-day';
        dayDiv.textContent = i;
        
        // Форматируем дату (ГГГГ-ММ-ДД)
        let fMonth = (month + 1).toString().padStart(2, '0');
        let fDay = i.toString().padStart(2, '0');
        let fullDate = year + '-' + fMonth + '-' + fDay;
        
        if (allDates.includes(fullDate)) { dayDiv.classList.add('has-habit'); } // Если были привычки - зеленый
        if (fullDate === todayStr) { dayDiv.classList.add('today'); } // Обводка для сегодня
        
        daysContainer.appendChild(dayDiv);
    }
}

// ==========================================
// 9. ИСТОРИЯ
// ==========================================
function renderHistory() {
    let historyContainer = document.getElementById('history-container');
    historyContainer.innerHTML = ''; 

    let allCompletedTasks = []; 
    
    // Собираем ВСЕ выполненные привычки со всех карточек
    for (let i = 0; i < habits.length; i++) {
        let habit = habits[i];
        for (let j = 0; j < habit.completedDates.length; j++) {
            let date = habit.completedDates[j];
            allCompletedTasks.push({ date: date, name: habit.name, icon: habit.icon });
        }
    }

    // Если ничего нет - выводим текст
    if (allCompletedTasks.length === 0) {
        historyContainer.innerHTML = '<div class="empty-history">Здесь пока пусто. Выполните первую привычку!</div>';
        return;
    }

    // Сортируем от новых к старым
    allCompletedTasks.sort(function(a, b) { return new Date(b.date) - new Date(a.date); });

    // Группируем по датам
    let groupedByDate = {};
    for (let i = 0; i < allCompletedTasks.length; i++) {
        let task = allCompletedTasks[i];
        if (!groupedByDate[task.date]) { groupedByDate[task.date] = []; }
        groupedByDate[task.date].push(task);
    }

    let uniqueDates = Object.keys(groupedByDate);

    // Рисуем карточки по датам
    for (let i = 0; i < uniqueDates.length; i++) {
        let dateStr = uniqueDates[i];
        let dateObj = new Date(dateStr);
        let options = { day: 'numeric', month: 'long' };
        let prettyDate = dateObj.toLocaleDateString('ru-RU', options); // Красивая дата

        let card = document.createElement('div');
        card.className = 'history-card';

        let title = document.createElement('div');
        title.className = 'history-date';
        title.textContent = prettyDate;
        card.appendChild(title);

        let itemsContainer = document.createElement('div');
        itemsContainer.className = 'history-items';

        // Выводим привычки за этот день
        let tasksOfDay = groupedByDate[dateStr];
        for (let j = 0; j < tasksOfDay.length; j++) {
            let task = tasksOfDay[j];
            let item = document.createElement('div');
            item.className = 'history-item';
            item.innerHTML = 
                '<div class="history-icon"><span class="material-symbols-rounded">' + task.icon + '</span></div>' +
                '<span>' + task.name + '</span>';
            itemsContainer.appendChild(item);
        }

        card.appendChild(itemsContainer);
        historyContainer.appendChild(card);
    }
}

// ==========================================
// 10. ПРОФИЛЬ И СОХРАНЕНИЕ
// ==========================================
function setupProfile() {
    // Кнопка сброса
    document.getElementById('reset-data-btn').addEventListener('click', function() {
        if (confirm('Удалить ВСЕ привычки?')) {
            localStorage.removeItem('habits_v2');
            location.reload();
        }
    });
}

function updateProfileStats() {
    let totalHabits = habits.length;
    let totalCompletions = 0;
    for (let i = 0; i < habits.length; i++) { totalCompletions += habits[i].completedDates.length; }
    document.getElementById('profile-total-habits').textContent = totalHabits;
    document.getElementById('profile-total-completions').textContent = totalCompletions;
}

// Сохранение в localStorage
function saveData() { 
    localStorage.setItem('habits_v2', JSON.stringify(habits)); 
}

// Запуск приложения!
startApp();