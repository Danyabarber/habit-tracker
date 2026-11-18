// ==========================================
// 1. СТАРТ (что делаю в самом начале)
// ==========================================

// Достаю привычки из памяти браузера.
// В памяти лежит просто текст, поэтому JSON.parse превращает его обратно в список.
// Если там пусто (null), ставлю пустой список [], чтобы ничего не сломалось.
let habits = JSON.parse(localStorage.getItem('habits_v2')) || [];

// Беру сегодняшнюю дату.
let today = new Date();
// Мне нужна дата в виде "2023-11-17" (год-месяц-день).
// Отрезаю всё после буквы T (там время), чтобы сравнивать только дни.
let todayStr = today.toISOString().split('T')[0];

// Нахожу элементы на странице по их id, чтобы потом менять текст или вешать клики.
let container = document.getElementById('habits-container');
let addModal = document.getElementById('add-modal');
let actionModal = document.getElementById('action-modal');
let nameInput = document.getElementById('habit-name-input');
let iconPicker = document.getElementById('icon-picker');
let iconPreview = document.getElementById('modal-icon-preview');
let themeToggleBtn = document.getElementById('theme-toggle');

// Тут храню две вещи:
// 1. Какую иконку сейчас выбрал (по умолчанию капля).
let selectedIcon = 'water_drop';
// 2. id привычки, если редактирую. Если null — значит создаю новую.
let currentEditId = null;

// Эта функция запускает всё приложение при открытии сайта.
function startApp() {
    // Делаю дату красивой (например, "17 ноября") и вставляю в шапку.
    let options = { day: 'numeric', month: 'long' };
    document.getElementById('current-date').textContent = today.toLocaleDateString('ru-RU', options);
    
    // Включаю все части по очереди.
    setupTheme();
    renderHabits();
    updateProgress();
    updateStatistics();
    renderCalendar();
    setupNavigation();
    setupModals();
    setupProfile();
}

// ==========================================
// 2. ТЕМА (светлая / тёмная)
// ==========================================
function setupTheme() {
    // Смотрю, какую тему выбирал в прошлый раз. Если ничего нет — ставлю светлую.
    let savedTheme = localStorage.getItem('theme') || 'light';
    
    // Вешаю на главный тег <html> ярлычок data-theme.
    // В CSS уже прописано: если ярлычок "dark" — цвета меняются на тёмные.
    document.documentElement.setAttribute('data-theme', savedTheme);
    
    // Меняю картинку на кнопке (луна или солнце).
    if (savedTheme === 'dark') {
        themeToggleBtn.innerHTML = '<span class="material-symbols-rounded">light_mode</span>';
    } else {
        themeToggleBtn.innerHTML = '<span class="material-symbols-rounded">dark_mode</span>';
    }

    // Если нажать на кнопку темы:
    themeToggleBtn.addEventListener('click', function() {
        // Узнаю, какая тема сейчас.
        let currentTheme = document.documentElement.getAttribute('data-theme');
        
        // Если тёмная — ставлю светлую. Если светлая — тёмную.
        let newTheme = (currentTheme === 'dark') ? 'light' : 'dark';
        
        // Применяю и запоминаю выбор, чтобы после обновления страницы не слетело.
        document.documentElement.setAttribute('data-theme', newTheme);
        localStorage.setItem('theme', newTheme);
        
        // Снова меняю картинку на кнопке.
        if (newTheme === 'dark') {
            themeToggleBtn.innerHTML = '<span class="material-symbols-rounded">light_mode</span>';
        } else {
            themeToggleBtn.innerHTML = '<span class="material-symbols-rounded">dark_mode</span>';
        }
    });
}

// ==========================================
// 3. ПЕРЕКЛЮЧЕНИЕ ВКЛАДОК
// ==========================================
function switchScreen(targetId) {
    // Убираю класс active у всех кнопок меню и у всех экранов.
    // Без него экраны невидимые, а кнопки не зелёные.
    let allNavs = document.querySelectorAll('.nav-item');
    for (let i = 0; i < allNavs.length; i++) { allNavs[i].classList.remove('active'); }
    
    let allScreens = document.querySelectorAll('.screen');
    for (let i = 0; i < allScreens.length; i++) { allScreens[i].classList.remove('active'); }
    
    // Добавляю active только нужному экрану — он становится видимым.
    document.getElementById(targetId).classList.add('active');
    
    // И подсвечиваю зелёным ту кнопку в меню, на которую нажали.
    let activeNav = document.querySelector('.nav-item[data-target="' + targetId + '"]');
    if (activeNav) { activeNav.classList.add('active'); }
}

function setupNavigation() {
    // Ищу все кнопки меню и говорю им: при клике делай вот это.
    let navItems = document.querySelectorAll('.nav-item[data-target]');
    for (let i = 0; i < navItems.length; i++) {
        navItems[i].addEventListener('click', function(e) {
            // Запрещаю странице перезагружаться при клике на ссылку.
            // Без этого приложение просто обновлялось бы каждый раз.
            e.preventDefault();
            
            let target = navItems[i].getAttribute('data-target'); // Смотрю, какой экран открыть.
            switchScreen(target); // Открываю его.
            
            // Если открыл статистику, календарь или историю — обновляю там цифры.
            if (target === 'screen-stats') { updateStatistics(); }
            if (target === 'screen-calendar') { renderCalendar(); }
            if (target === 'screen-history') { renderHistory(); }
        });
    }

    // Если нажать на дату в шапке — кидает в календарь.
    let dateBtn = document.getElementById('open-calendar-btn');
    dateBtn.addEventListener('click', function() {
        switchScreen('screen-calendar');
        renderCalendar();
    });

    // Переход в профиль при клике на аватарку.
    // Аватарок на сайте несколько (на разных экранах), поэтому перебираю все.
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
// 4. ОКНА (добавление / удаление / редактирование)
// ==========================================
function setupModals() {
    // Открываю окно "Новая привычка" по клику на зелёную кнопку плюс.
    document.getElementById('open-modal-btn').addEventListener('click', function() {
        currentEditId = null; // Обнуляю id — значит создаю новую.
        document.getElementById('modal-title').textContent = 'Новая привычка';
        nameInput.value = ''; // Очищаю поле ввода.
        resetIconPicker();    // Ставлю первую иконку.
        addModal.classList.remove('hidden'); // Показываю окно.
    });

    // Кнопки закрытия окон (крестики и "Отмена").
    document.getElementById('close-modal-btn').addEventListener('click', function() { addModal.classList.add('hidden'); });
    document.getElementById('close-action-btn').addEventListener('click', function() { actionModal.classList.add('hidden'); });
    document.getElementById('cancel-action-btn').addEventListener('click', function() { actionModal.classList.add('hidden'); });

    // Когда кликаю на какую-то иконку в списке:
    iconPicker.addEventListener('click', function(e) {
        // Ищу кнопку, внутри которой кликнул.
        // closest нужен, потому что мог кликнуть на картинку, а не на кнопку.
        let btn = e.target.closest('.icon-option');
        if (btn) {
            // Убираю выделение со всех кнопок.
            let options = document.querySelectorAll('.icon-option');
            for (let i = 0; i < options.length; i++) { options[i].classList.remove('active'); }
            
            // Выделяю ту, на которую нажал, и запоминаю её название.
            btn.classList.add('active');
            selectedIcon = btn.getAttribute('data-icon');
            
            // Меняю большую иконку сверху.
            iconPreview.innerHTML = '<span class="material-symbols-rounded">' + selectedIcon + '</span>';
        }
    });

    // Кнопка "Сохранить".
    document.getElementById('save-habit-btn').addEventListener('click', function() {
        let name = nameInput.value.trim(); // Беру текст, trim убирает пробелы по краям.
        if (name === '') { alert('Введите название!'); return; } // Если пусто — не сохраняю.

        // Если id не пустой — значит редактирую старую привычку. Ищу её и обновляю.
        if (currentEditId !== null) {
            for (let i = 0; i < habits.length; i++) {
                if (habits[i].id === currentEditId) {
                    habits[i].name = name;
                    habits[i].icon = selectedIcon;
                }
            }
        } else {
            // Если id пустой — создаю новую.
            // Date.now() даёт уникальное число (время), чтобы привычки не путались.
            habits.push({ id: Date.now().toString(), name: name, icon: selectedIcon, completedDates: [] });
        }

        // Сохраняю и перерисовываю всё, чтобы изменения сразу были видны.
        saveData();
        renderHabits();
        updateProgress();
        updateStatistics();
        renderCalendar();
        renderHistory();
        addModal.classList.add('hidden'); // Закрываю окно.
    });

    // Кнопка "Удалить".
    document.getElementById('delete-habit-btn').addEventListener('click', function() {
        if (confirm('Удалить привычку?')) {
            // Создаю новый список, куда беру всех, КРОМЕ той, которую удаляю.
            let newHabits = [];
            for (let i = 0; i < habits.length; i++) {
                if (habits[i].id !== currentEditId) { newHabits.push(habits[i]); }
            }
            habits = newHabits; // Заменяю старый список на новый.

            // Сохраняю и перерисовываю.
            saveData();
            renderHabits();
            updateProgress();
            updateStatistics();
            renderCalendar();
            renderHistory();
            actionModal.classList.add('hidden'); // Закрываю меню.
        }
    });

    // Кнопка "Редактировать".
    document.getElementById('edit-habit-btn').addEventListener('click', function() {
        let habitToEdit = null;
        // Ищу нужную привычку по id.
        for (let i = 0; i < habits.length; i++) {
            if (habits[i].id === currentEditId) { habitToEdit = habits[i]; }
        }
        if (habitToEdit) {
            // Вставляю её старые данные в окно.
            nameInput.value = habitToEdit.name;
            selectedIcon = habitToEdit.icon;
            iconPreview.innerHTML = '<span class="material-symbols-rounded">' + selectedIcon + '</span>';

            // Подсвечиваю ту иконку, которая была выбрана.
            let options = document.querySelectorAll('.icon-option');
            for (let i = 0; i < options.length; i++) {
                options[i].classList.remove('active');
                if (options[i].getAttribute('data-icon') === selectedIcon) { options[i].classList.add('active'); }
            }
            // Меняю заголовок окна и показываю его.
            document.getElementById('modal-title').textContent = 'Редактировать';
            actionModal.classList.add('hidden');
            addModal.classList.remove('hidden');
        }
    });
}

// Сбрасывает иконку на каплю, если открываю окно создания заново.
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
// 5. РИСУЮ ГЛАВНЫЙ ЭКРАН (карточки привычек)
// ==========================================
function renderHabits() {
    container.innerHTML = ''; // Очищаю экран, чтобы не было дублей.

    // Если привычек нет — показываю текст и кнопку.
    if (habits.length === 0) {
        container.innerHTML = `
            <div style="grid-column: 1/-1; text-align: center; margin-top: 40px;">
                <p style="color:#8e8e93; font-size: 16px; margin-bottom: 15px;">У вас пока нет привычек</p>
                <button onclick="document.getElementById('open-modal-btn').click()" style="background: var(--primary); color: white; border: none; padding: 12px 24px; border-radius: 12px; font-size: 16px; font-weight: 600; cursor: pointer; box-shadow: 0 4px 12px rgba(52, 199, 89, 0.3);">
                    + Создать первую
                </button>
            </div>
        `;
        return; // Выхожу, дальше рисовать нечего.
    }

    // Если привычки есть — беру каждую по очереди и рисую для неё карточку.
    for (let i = 0; i < habits.length; i++) {
        let habit = habits[i];
        // Проверяю, есть ли сегодняшняя дата в выполненных. Если да — true.
        let isCompletedToday = habit.completedDates.includes(todayStr);
        let streak = calculateStreak(habit.completedDates); // Считаю серию.

        // Создаю блок для карточки.
        let card = document.createElement('div');
        card.className = 'habit-card';
        // Если выполнено — добавляю класс, который делает галочку зелёной.
        if (isCompletedToday) { card.className = 'habit-card completed'; }

        // Если серия больше нуля — показываю огонёк.
        let streakHTML = streak > 0 ? '<span class="habit-streak-badge">🔥 ' + streak + ' дн.</span>' : '';
        let statusText = isCompletedToday ? 'Выполнено' : 'Нажмите, чтобы выполнить';

        // Собираю карточку из кусочков.
        card.innerHTML =
            '<div class="habit-icon"><span class="material-symbols-rounded">' + habit.icon + '</span></div>' +
            '<div class="habit-info">' +
                '<div class="habit-name">' + habit.name + ' ' + streakHTML + '</div>' +
                '<div class="habit-goal">' + statusText + '</div>' +
            '</div>' +
            '<div class="check-circle"><span class="material-symbols-rounded">check</span></div>' +
            '<button class="more-btn"><span class="material-symbols-rounded">more_vert</span></button>';

        // Если кликнуть на карточку — привычка выполнится.
        card.addEventListener('click', function(e) {
            // Но если клик был по трём точкам — ничего не делаю.
            if (e.target.closest('.more-btn')) { return; }
            toggleHabit(habit.id);
        });

        // Если кликнуть по трём точкам — открываю меню действий.
        card.querySelector('.more-btn').addEventListener('click', function(e) {
            // Останавливаю клик, чтобы он не сработал на самой карточке.
            e.stopPropagation();
            currentEditId = habit.id; // Запоминаю id привычки.
            actionModal.classList.remove('hidden'); // Показываю меню.
        });

        container.appendChild(card); // Добавляю карточку на страницу.
    }
}

// ==========================================
// 6. ВЫПОЛНЕНИЕ И СЕРИЯ
// ==========================================
function toggleHabit(id) {
    // Ищу нужную привычку по id.
    for (let i = 0; i < habits.length; i++) {
        if (habits[i].id === id) {
            let habit = habits[i];
            // Если сегодняшняя дата уже есть — удаляю её (отменяю выполнение).
            if (habit.completedDates.includes(todayStr)) {
                let newDates = [];
                for (let j = 0; j < habit.completedDates.length; j++) {
                    if (habit.completedDates[j] !== todayStr) { newDates.push(habit.completedDates[j]); }
                }
                habit.completedDates = newDates;
            } else {
                // Если нет — добавляю сегодняшнюю дату.
                habit.completedDates.push(todayStr);
            }
        }
    }
    // Сохраняю и перерисовываю, чтобы всё обновилось.
    saveData(); renderHabits(); updateProgress(); renderCalendar(); renderHistory();
}

// Считаю серию (сколько дней подряд).
function calculateStreak(dates) {
    if (dates.length === 0) { return 0; } // Если ничего нет — серия 0.
    let streak = 0;
    let checkDate = new Date(); // Начинаю с сегодняшнего дня.

    // Кручу цикл, пока не найду день, когда привычка не выполнялась.
    while (true) {
        let dateStr = checkDate.toISOString().split('T')[0];

        if (dates.includes(dateStr)) {
            streak++; // Нашёл выполненный день — плюс один.
            checkDate.setDate(checkDate.getDate() - 1); // Отматываю на день назад.
        } else {
            // Если сегодня не выполнено, проверяю вчера (вдруг сегодня просто не нажали).
            if (streak === 0) {
                checkDate.setDate(checkDate.getDate() - 1);
                let yesterday = checkDate.toISOString().split('T')[0];
                if (!dates.includes(yesterday)) { break; } // И вчера нет — серия прервалась.
            } else { break; } // Серия уже считается, но нашли пропуск — выхожу.
        }
    }
    return streak;
}

// ==========================================
// 7. ПРОГРЕСС И СТАТИСТИКА
// ==========================================
function updateProgress() {
    let total = habits.length; // Всего привычек.
    let completedToday = 0;    // Сколько выполнено сегодня.

    // Считаю выполненные сегодня.
    for (let i = 0; i < habits.length; i++) {
        if (habits[i].completedDates.includes(todayStr)) { completedToday++; }
    }

    // Меняю текст на экране (например, "2/5").
    document.getElementById('daily-progress-text').textContent = completedToday + '/' + total;

    // Считаю процент: (выполнено / всего) * 100. Если привычек нет — 0.
    let percent = total > 0 ? (completedToday / total) * 100 : 0;
    // Меняю длину зелёной линии в кружке.
    document.getElementById('progress-ring').setAttribute('stroke-dasharray', percent + ', 100');
}

function updateStatistics() {
    let totalCompleted = 0;
    let totalPossible = habits.length * 30; // Условно считаю, что за 30 дней.

    // Считаю общее количество выполнений.
    for (let i = 0; i < habits.length; i++) { totalCompleted += habits[i].completedDates.length; }

    let percent = totalPossible > 0 ? Math.round((totalCompleted / totalPossible) * 100) : 0;

    // Меняю цифры и кружок на экране статистики.
    document.getElementById('stats-percentage').textContent = percent + '%';
    document.getElementById('stats-ring').setAttribute('stroke-dasharray', percent + ', 100');
    document.getElementById('stats-completed').textContent = totalCompleted;
    document.getElementById('stats-skipped').textContent = totalPossible - totalCompleted;

    // Делаю топ-3 лучших привычек.
    // slice() копирует список, чтобы сортировка не сломала habits.
    let sorted = habits.slice();
    // Сортирую: у кого больше выполнений — тот выше.
    sorted.sort(function(a, b) { return b.completedDates.length - a.completedDates.length; });
    let top3 = sorted.slice(0, 3); // Беру первые три.

    let containerBest = document.getElementById('best-habits-container');
    containerBest.innerHTML = ''; // Очищаю контейнер.

    // Рисую топ-3.
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
    let year = today.getFullYear(); // Текущий год.
    let month = today.getMonth();   // Текущий месяц (0 — январь, 11 — декабрь).

    // Массив с названиями месяцев, чтобы выводить красиво.
    let months = ["Январь", "Февраль", "Март", "Апрель", "Май", "Июнь", "Июль", "Август", "Сентябрь", "Октябрь", "Ноябрь", "Декабрь"];
    document.getElementById('calendar-month-year').textContent = months[month] + ' ' + year;

    // Узнаю, с какого дня недели начинается месяц.
    let firstDay = new Date(year, month, 1);
    let startDayIndex = firstDay.getDay(); // 0 — воскресенье, 1 — понедельник...
    if (startDayIndex === 0) { startDayIndex = 7; } // Делаю понедельник первым.

    // Хитрость: чтобы узнать количество дней в месяце, запрашиваю "0-й день" следующего.
    let daysInMonth = new Date(year, month + 1, 0).getDate();

    let daysContainer = document.getElementById('calendar-days');
    daysContainer.innerHTML = ''; // Очищаю сетку.

    // Рисую пустые клетки до первого числа месяца.
    for (let i = 1; i < startDayIndex; i++) {
        let emptyDiv = document.createElement('div');
        emptyDiv.className = 'cal-day';
        daysContainer.appendChild(emptyDiv);
    }

    // Собираю все даты, когда выполнялись привычки, в один список для проверки.
    let allDates = [];
    for (let i = 0; i < habits.length; i++) {
        for (let j = 0; j < habits[i].completedDates.length; j++) {
            allDates.push(habits[i].completedDates[j]);
        }
    }

    // Рисую сами числа месяца.
    for (let i = 1; i <= daysInMonth; i++) {
        let dayDiv = document.createElement('div');
        dayDiv.className = 'cal-day';
        dayDiv.textContent = i;

        // Собираю дату в формате "2023-11-05".
        // padStart добавляет ноль в начало, если число меньше 10 ("5" станет "05").
        let fMonth = (month + 1).toString().padStart(2, '0');
        let fDay = i.toString().padStart(2, '0');
        let fullDate = year + '-' + fMonth + '-' + fDay;

        // Если такой день есть в выполненных — крашу зелёным.
        if (allDates.includes(fullDate)) { dayDiv.classList.add('has-habit'); }
        // Если это сегодня — делаю обводку.
        if (fullDate === todayStr) { dayDiv.classList.add('today'); }

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

    // Собираю все выполненные дела в один список.
    for (let i = 0; i < habits.length; i++) {
        let habit = habits[i];
        for (let j = 0; j < habit.completedDates.length; j++) {
            let date = habit.completedDates[j];
            // Сохраняю дату, название и иконку, чтобы потом красиво вывести.
            allCompletedTasks.push({ date: date, name: habit.name, icon: habit.icon });
        }
    }

    // Если ничего нет — показываю "пусто".
    if (allCompletedTasks.length === 0) {
        historyContainer.innerHTML = '<div class="empty-history">Здесь пока пусто. Выполните первую привычку!</div>';
        return;
    }

    // Сортирую: сначала самые новые (b - a).
    allCompletedTasks.sort(function(a, b) { return new Date(b.date) - new Date(a.date); });

    // Раскладываю дела по датам.
    // Делаю объект, где ключ — дата, а значение — список дел за этот день.
    let groupedByDate = {};
    for (let i = 0; i < allCompletedTasks.length; i++) {
        let task = allCompletedTasks[i];
        // Если такой даты ещё нет — создаю для неё пустой список.
        if (!groupedByDate[task.date]) { groupedByDate[task.date] = []; }
        groupedByDate[task.date].push(task);
    }

    // Получаю список всех дат.
    let uniqueDates = Object.keys(groupedByDate);

    // Для каждой даты создаю карточку.
    for (let i = 0; i < uniqueDates.length; i++) {
        let dateStr = uniqueDates[i];
        let dateObj = new Date(dateStr);
        let options = { day: 'numeric', month: 'long' };
        let prettyDate = dateObj.toLocaleDateString('ru-RU', options); // Красивая дата.

        let card = document.createElement('div');
        card.className = 'history-card';

        let title = document.createElement('div');
        title.className = 'history-date';
        title.textContent = prettyDate;
        card.appendChild(title);

        let itemsContainer = document.createElement('div');
        itemsContainer.className = 'history-items';

        // Достаю дела за этот день.
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
    // Кнопка "Сбросить всё".
    document.getElementById('reset-data-btn').addEventListener('click', function() {
        if (confirm('Удалить ВСЕ привычки?')) {
            localStorage.removeItem('habits_v2'); // Стираю данные из памяти браузера.
            location.reload(); // Перезагружаю страницу — всё как в начале.
        }
    });
}

function updateProfileStats() {
    let totalHabits = habits.length;
    let totalCompletions = 0;
    // Считаю общее количество выполнений.
    for (let i = 0; i < habits.length; i++) { totalCompletions += habits[i].completedDates.length; }

    // Меняю цифры на экране профиля.
    document.getElementById('profile-total-habits').textContent = totalHabits;
    document.getElementById('profile-total-completions').textContent = totalCompletions;
}

// Сохраняю данные в память браузера.
function saveData() {
    // Память браузера хранит только текст.
    // JSON.stringify превращает мои данные в текст, чтобы их можно было сохранить.
    localStorage.setItem('habits_v2', JSON.stringify(habits));
}

// Запускаю приложение!
startApp();