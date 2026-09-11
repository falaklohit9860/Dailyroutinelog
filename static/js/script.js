/* =========================================================
   MY ROUTINE
   Complete frontend
   Compatible with Flask + SQLite API
========================================================= */


/* =========================================================
   CONFIG
========================================================= */

const FIELD_IDS = [
    "wake",
    "breakfast",
    "lunch",
    "snacks",
    "exercise",
    "dinner",
    "sleep",
    "water",
    "work",
    "notes"
];

let selectedDate = getDateKey(new Date());

let calendarDate = new Date();

let diaryStore = {};

let waterGoal =
    parseFloat(
        localStorage.getItem("waterGoal")
    ) || 2.5;


/* =========================================================
   DATE HELPERS
========================================================= */

function getDateKey(date) {

    const year =
        date.getFullYear();

    const month =
        String(
            date.getMonth() + 1
        ).padStart(2, "0");

    const day =
        String(
            date.getDate()
        ).padStart(2, "0");

    return `${year}-${month}-${day}`;
}


function todayKey() {
    return getDateKey(
        new Date()
    );
}


function parseDateKey(key) {

    if (!key) {
        return new Date();
    }

    const parts =
        key.split("-").map(Number);

    return new Date(
        parts[0],
        parts[1] - 1,
        parts[2]
    );
}


function formatDate(key) {

    return parseDateKey(key)
        .toLocaleDateString(
            "en-US",
            {
                weekday: "short",
                month: "short",
                day: "numeric",
                year: "numeric"
            }
        );
}


function shortDate(key) {

    return parseDateKey(key)
        .toLocaleDateString(
            "en-US",
            {
                month: "short",
                day: "numeric"
            }
        );
}


/* =========================================================
   API
========================================================= */

async function api(
    url,
    options = {}
) {

    const response =
        await fetch(
            url,
            {
                ...options,

                headers: {
                    "Content-Type":
                        "application/json",

                    ...(options.headers || {})
                }
            }
        );


    if (!response.ok) {

        let message =
            "Request failed";

        try {

            const error =
                await response.json();

            message =
                error.error ||
                message;

        } catch (_) {}

        throw new Error(
            message
        );
    }


    return response.json();
}


/* =========================================================
   DATA
========================================================= */

function emptyData() {

    return Object.fromEntries(
        FIELD_IDS.map(
            field => [
                field,
                ""
            ]
        )
    );
}


function getCurrentData() {

    const data = {};

    FIELD_IDS.forEach(
        id => {

            const element =
                document.getElementById(id);

            data[id] =
                element
                    ? element.value
                    : "";

        }
    );

    return data;
}


function fillForm(data) {

    const safeData =
        data || {};

    FIELD_IDS.forEach(
        id => {

            const element =
                document.getElementById(id);

            if (!element) {
                return;
            }

            element.value =
                safeData[id] || "";

        }
    );
}


function hasDiaryData(data) {

    return FIELD_IDS.some(
        id =>
            String(
                data?.[id] || ""
            ).trim() !== ""
    );
}


/* =========================================================
   PROGRESS
========================================================= */

function calculateProgress(data) {

    const completed =
        FIELD_IDS.filter(
            id =>
                String(
                    data?.[id] || ""
                ).trim() !== ""
        ).length;


    return Math.round(
        completed /
        FIELD_IDS.length *
        100
    );
}


function updateProgress() {

    const data =
        getCurrentData();

    const percent =
        calculateProgress(
            data
        );


    const number =
        document.getElementById(
            "progressNumber"
        );

    if (number) {
        number.textContent =
            percent;
    }


    const circleText =
        document.getElementById(
            "progressCircleText"
        );

    if (circleText) {
        circleText.textContent =
            `${percent}%`;
    }


    const bar =
        document.getElementById(
            "progressBar"
        );

    if (bar) {
        bar.style.width =
            `${percent}%`;
    }


    const arc =
        document.getElementById(
            "progressArc"
        );

    if (arc) {

        const circumference =
            2 * Math.PI * 42;

        arc.style.strokeDasharray =
            circumference;

        arc.style.strokeDashoffset =
            circumference -
            (
                percent / 100
            ) *
            circumference;
    }


    let message =
        "Start logging your day.";


    if (percent === 100) {

        message =
            "Amazing! Perfect day! 🎉";

    } else if (percent >= 80) {

        message =
            "Almost there. Finish strong! 💪";

    } else if (percent >= 50) {

        message =
            "Great progress. Keep going! 🚀";

    } else if (percent > 0) {

        message =
            "Nice start. Build your routine!";

    }


    const progressMessage =
        document.getElementById(
            "progressMessage"
        );

    if (progressMessage) {

        progressMessage.textContent =
            message;
    }


    setText(
        "wakePreview",
        data.wake || "--:--"
    );

    setText(
        "waterPreview",
        data.water
            ? `${data.water} L`
            : "0 L"
    );

    setText(
        "exercisePreview",
        data.exercise ||
            "Not logged"
    );

    setText(
        "sleepPreview",
        data.sleep || "--:--"
    );


    updateFeatureCards(
        data
    );
}


/* =========================================================
   FEATURE CARDS
========================================================= */

function updateFeatureCards(data) {

    const water =
        parseFloat(
            data.water
        ) || 0;


    const waterPercent =
        Math.min(
            100,
            Math.round(
                (
                    water /
                    waterGoal
                ) * 100
            )
        );


    setText(
        "waterFeatureValue",
        water.toFixed(1)
    );

    setText(
        "waterGoalLabel",
        waterGoal.toFixed(1)
    );

    setText(
        "waterPercent",
        `${waterPercent}%`
    );


    const waterBar =
        document.getElementById(
            "waterFeatureBar"
        );

    if (waterBar) {

        waterBar.style.width =
            `${waterPercent}%`;
    }


    toggleClass(
        "habitWater",
        "done",
        water >= waterGoal
    );


    const exercise =
        String(
            data.exercise || ""
        ).trim();


    const meals =
        ["breakfast", "lunch", "dinner"]
            .every(
                field =>
                    String(
                        data[field] || ""
                    ).trim()
            );


    const sleep =
        String(
            data.sleep || ""
        ).trim();


    const habits = [
        Boolean(exercise),
        meals,
        water >= waterGoal,
        Boolean(sleep)
    ];


    const count =
        habits.filter(
            Boolean
        ).length;


    setText(
        "habitCount",
        `${count}/4`
    );


    toggleClass(
        "habitExercise",
        "done",
        Boolean(exercise)
    );

    toggleClass(
        "habitMeals",
        "done",
        meals
    );

    toggleClass(
        "habitSleep",
        "done",
        Boolean(sleep)
    );
}


/* =========================================================
   LOAD ALL DIARIES
========================================================= */

async function loadAll() {

    const rows =
        await api(
            "/api/diaries"
        );


    diaryStore = {};


    if (Array.isArray(rows)) {

        rows.forEach(
            row => {

                if (row && row.date) {

                    diaryStore[
                        row.date
                    ] = row;

                }

            }
        );

    }


    renderCalendar();

    renderHistory();

    renderStats();

    updateStreak();
}


/* =========================================================
   LOAD SELECTED DATE
========================================================= */

async function loadSelectedDate() {

    try {

        const data =
            await api(
                `/api/diaries/${selectedDate}`
            );


        fillForm(data);


        if (
            data &&
            data.date
        ) {

            diaryStore[
                selectedDate
            ] = data;

        }

    } catch (error) {

        console.error(
            error
        );

        const local =
            diaryStore[
                selectedDate
            ];

        fillForm(
            local ||
            emptyData()
        );

    }


    updateDateUI();

    updateProgress();

    loadMood();


    calendarDate =
        parseDateKey(
            selectedDate
        );

    renderCalendar();
}


/* =========================================================
   DATE UI
========================================================= */

function updateDateUI() {

    const date =
        parseDateKey(
            selectedDate
        );


    const isToday =
        selectedDate ===
        todayKey();


    setText(
        "selectedDateLabel",
        isToday
            ? "Today"
            : shortDate(
                selectedDate
            )
    );


    setText(
        "diaryOverline",
        isToday
            ? "TODAY"
            : date
                .toLocaleDateString(
                    "en-US",
                    {
                        weekday:
                            "long"
                    }
                )
                .toUpperCase()
    );


    setText(
        "heroDate",
        date
            .toLocaleDateString(
                "en-US",
                {
                    weekday:
                        "long",

                    month:
                        "long",

                    day:
                        "numeric"
                }
            )
            .toUpperCase()
    );


    setText(
        "greeting",
        `${getGreeting()} 👋`
    );


    setText(
        "saveDateText",
        isToday
            ? "Today's diary"
            : `${formatDate(selectedDate)}`
    );
}


function getGreeting() {

    const hour =
        new Date().getHours();


    if (hour < 12) {

        return "Good morning";

    }


    if (hour < 18) {

        return "Good afternoon";

    }


    return "Good evening";
}


/* =========================================================
   SAVE
========================================================= */

async function saveCurrent() {

    const button =
        document.getElementById(
            "saveButton"
        );


    const data =
        getCurrentData();


    const payload = {
        date:
            selectedDate,

        ...data
    };


    try {

        if (button) {

            button.disabled =
                true;

            button.textContent =
                "Saving...";
        }


        const saved =
            await api(
                "/api/diaries",
                {
                    method:
                        "POST",

                    body:
                        JSON.stringify(
                            payload
                        )
                }
            );


        diaryStore[
            selectedDate
        ] = saved;


        renderCalendar();

        renderHistory();

        renderStats();

        updateStreak();

        updateProgress();


        showToast(
            `✓ Saved ${formatDate(selectedDate)}`
        );


    } catch (error) {

        console.error(
            error
        );

        showToast(
            error.message ||
            "Could not save diary"
        );


    } finally {

        if (button) {

            button.disabled =
                false;

            button.textContent =
                "Save diary ✓";
        }
    }
}


/* =========================================================
   CLEAR
========================================================= */

async function clearCurrent() {

    const data =
        getCurrentData();


    if (
        hasDiaryData(data)
    ) {

        const confirmed =
            confirm(
                "Clear this day's diary?"
            );

        if (!confirmed) {
            return;
        }
    }


    try {

        await api(
            `/api/diaries/${selectedDate}`,
            {
                method:
                    "DELETE"
            }
        );


        delete diaryStore[
            selectedDate
        ];


        fillForm(
            emptyData()
        );


        updateProgress();

        renderCalendar();

        renderHistory();

        renderStats();

        updateStreak();

        loadMood();


        showToast(
            "Diary cleared"
        );


    } catch (error) {

        /*
          If the server says the diary
          doesn't exist, we still clear
          the form locally.
        */

        if (
            String(
                error.message
            ).toLowerCase()
                .includes(
                    "not found"
                )
        ) {

            delete diaryStore[
                selectedDate
            ];

            fillForm(
                emptyData()
            );

            updateProgress();

            renderCalendar();

            renderHistory();

            renderStats();

            updateStreak();

            showToast(
                "Diary cleared"
            );

            return;
        }


        showToast(
            error.message
        );
    }
}


/* =========================================================
   CALENDAR
========================================================= */

function renderCalendar() {

    const grid =
        document.getElementById(
            "calendarGrid"
        );


    if (!grid) {
        return;
    }


    const year =
        calendarDate.getFullYear();

    const month =
        calendarDate.getMonth();


    setText(
        "calendarMonth",
        calendarDate
            .toLocaleDateString(
                "en-US",
                {
                    month:
                        "long",

                    year:
                        "numeric"
                }
            )
    );


    grid.innerHTML = "";


    const firstDay =
        new Date(
            year,
            month,
            1
        ).getDay();


    const totalDays =
        new Date(
            year,
            month + 1,
            0
        ).getDate();


    const previousDays =
        new Date(
            year,
            month,
            0
        ).getDate();


    /*
       Previous month
    */

    for (
        let i =
            firstDay - 1;

        i >= 0;

        i--
    ) {

        const button =
            document.createElement(
                "button"
            );

        button.className =
            "calendar-day other";

        button.textContent =
            previousDays -
            i;

        button.type =
            "button";

        grid.appendChild(
            button
        );
    }


    /*
       Current month
    */

    for (
        let day = 1;

        day <= totalDays;

        day++
    ) {

        const date =
            new Date(
                year,
                month,
                day
            );


        const key =
            getDateKey(
                date
            );


        const button =
            document.createElement(
                "button"
            );


        button.type =
            "button";

        button.className =
            "calendar-day";


        button.textContent =
            day;


        if (
            key ===
            todayKey()
        ) {

            button.classList.add(
                "today"
            );
        }


        if (
            key ===
            selectedDate
        ) {

            button.classList.add(
                "selected"
            );
        }


        if (
            diaryStore[key]
        ) {

            button.classList.add(
                "has-entry"
            );
        }


        button.addEventListener(
            "click",
            async function() {

                selectedDate =
                    key;

                await loadSelectedDate();

                showPage(
                    "diary"
                );

            }
        );


        grid.appendChild(
            button
        );
    }


    /*
       Fill calendar grid
       to 42 cells
    */

    while (
        grid.children.length <
        42
    ) {

        const button =
            document.createElement(
                "button"
            );

        button.type =
            "button";

        button.className =
            "calendar-day other";

        button.textContent =
            grid.children.length -
            firstDay -
            totalDays +
            1;

        grid.appendChild(
            button
        );
    }
}


/* =========================================================
   STREAK
========================================================= */

function calculateStreak() {

    const entries =
        new Set(
            Object.keys(
                diaryStore
            )
        );


    let cursor =
        new Date();


    /*
       If today is not logged,
       start checking from yesterday.
    */

    if (
        !entries.has(
            getDateKey(cursor)
        )
    ) {

        cursor.setDate(
            cursor.getDate() - 1
        );
    }


    let streak = 0;


    while (
        entries.has(
            getDateKey(cursor)
        )
    ) {

        streak++;


        cursor.setDate(
            cursor.getDate() - 1
        );
    }


    return streak;
}


function updateStreak() {

    const streak =
        calculateStreak();


    setText(
        "streakNumber",
        streak
    );


    setText(
        "historyStreak",
        `${streak} days`
    );
}


/* =========================================================
   HISTORY
========================================================= */

function renderHistory() {

    const list =
        document.getElementById(
            "historyList"
        );

    const empty =
        document.getElementById(
            "emptyHistory"
        );


    if (!list || !empty) {
        return;
    }


    const entries =
        Object.entries(
            diaryStore
        )
        .sort(
            (a, b) =>
                b[0].localeCompare(
                    a[0]
                )
        );


    setText(
        "daysLogged",
        entries.length
    );


    if (!entries.length) {

        list.innerHTML = "";

        empty.style.display =
            "block";


        setText(
            "averageProgress",
            "0%"
        );

        setText(
            "bestDay",
            "--"
        );

        return;
    }


    empty.style.display =
        "none";


    const values =
        entries.map(
            ([key, data]) =>
                calculateProgress(
                    data
                )
        );


    const average =
        Math.round(
            values.reduce(
                (sum, value) =>
                    sum + value,
                0
            ) /
            values.length
        );


    const best =
        Math.max(
            ...values
        );


    const bestIndex =
        values.indexOf(
            best
        );


    const bestKey =
        entries[
            bestIndex
        ][0];


    setText(
        "averageProgress",
        `${average}%`
    );


    setText(
        "bestDay",
        shortDate(
            bestKey
        )
    );


    renderHistoryItems(
        entries
    );
}


function renderHistoryItems(
    entries
) {

    const list =
        document.getElementById(
            "historyList"
        );


    if (!list) {
        return;
    }


    const searchInput =
        document.getElementById(
            "historySearch"
        );


    const search =
        (
            searchInput?.value ||
            ""
        )
        .toLowerCase()
        .trim();


    list.innerHTML = "";


    entries.forEach(
        ([key, data]) => {

            const content =
                Object.values(
                    data
                )
                .join(" ")
                .toLowerCase();


            if (
                search &&
                !key.includes(
                    search
                ) &&
                !content.includes(
                    search
                )
            ) {

                return;
            }


            const progress =
                calculateProgress(
                    data
                );


            const item =
                document.createElement(
                    "div"
                );


            item.className =
                "history-item";


            item.innerHTML = `

                <div>

                    <div class="history-date">
                        ${formatDate(key)}
                    </div>

                    <div class="history-meta">
                        ${
                            progress === 100
                                ? "Complete day 🎉"
                                : `${progress}% routine completed`
                        }
                    </div>

                </div>


                <div>

                    <div class="history-progress-label">

                        <span>
                            Progress
                        </span>

                        <strong>
                            ${progress}%
                        </strong>

                    </div>

                    <div class="history-bar">

                        <span
                            style="width:${progress}%">
                        </span>

                    </div>

                </div>


                <div class="history-actions">

                    <button
                        class="small-action view-entry">
                        View / Edit
                    </button>

                    <button
                        class="small-action delete-entry">
                        Delete
                    </button>

                </div>
            `;


            const viewButton =
                item.querySelector(
                    ".view-entry"
                );


            viewButton.addEventListener(
                "click",
                async function() {

                    selectedDate =
                        key;

                    await loadSelectedDate();

                    showPage(
                        "diary"
                    );

                }
            );


            const deleteButton =
                item.querySelector(
                    ".delete-entry"
                );


            deleteButton.addEventListener(
                "click",
                async function() {

                    const confirmed =
                        confirm(
                            `Delete diary for ${formatDate(key)}?`
                        );


                    if (!confirmed) {
                        return;
                    }


                    try {

                        await api(
                            `/api/diaries/${key}`,
                            {
                                method:
                                    "DELETE"
                            }
                        );


                        delete diaryStore[
                            key
                        ];


                        renderHistory();

                        renderStats();

                        renderCalendar();

                        updateStreak();


                        if (
                            selectedDate ===
                            key
                        ) {

                            fillForm(
                                emptyData()
                            );

                            updateProgress();
                        }


                        showToast(
                            "Diary deleted"
                        );


                    } catch (error) {

                        showToast(
                            error.message
                        );
                    }
                }
            );


            list.appendChild(
                item
            );

        }
    );
}


/* =========================================================
   STATS
========================================================= */

function renderStats() {

    const entries =
        Object.entries(
            diaryStore
        );


    const values =
        entries.map(
            ([key, data]) =>
                calculateProgress(
                    data
                )
        );


    const best =
        values.length
            ? Math.max(
                ...values
            )
            : 0;


    const totalWater =
        entries.reduce(
            (sum, [key, data]) =>
                sum +
                (
                    parseFloat(
                        data.water
                    ) || 0
                ),
            0
        );


    const exerciseDays =
        entries.filter(
            ([key, data]) =>
                String(
                    data.exercise ||
                    ""
                ).trim()
        ).length;


    setText(
        "statDays",
        entries.length
    );

    setText(
        "statBest",
        `${best}%`
    );

    setText(
        "statWater",
        `${totalWater.toFixed(1)} L`
    );

    setText(
        "statExercise",
        exerciseDays
    );


    renderChart();

    renderInsights();
}


/* =========================================================
   CHART
========================================================= */

function renderChart() {

    const chart =
        document.getElementById(
            "miniChart"
        );


    if (!chart) {
        return;
    }


    chart.innerHTML = "";


    const now =
        new Date();


    for (
        let i = 6;

        i >= 0;

        i--
    ) {

        const date =
            new Date(now);


        date.setDate(
            now.getDate() - i
        );


        const key =
            getDateKey(
                date
            );


        const progress =
            diaryStore[key]
                ? calculateProgress(
                    diaryStore[key]
                )
                : 0;


        const column =
            document.createElement(
                "div"
            );


        column.className =
            "chart-column";


        const bar =
            document.createElement(
                "div"
            );


        bar.className =
            "chart-bar";


        bar.style.height =
            `${Math.max(progress, 3)}%`;


        bar.title =
            `${formatDate(key)} — ${progress}%`;


        const label =
            document.createElement(
                "small"
            );


        label.textContent =
            date.toLocaleDateString(
                "en-US",
                {
                    weekday:
                        "short"
                }
            ).slice(0, 2);


        column.appendChild(
            bar
        );

        column.appendChild(
            label
        );


        chart.appendChild(
            column
        );
    }
}


/* =========================================================
   INSIGHTS
========================================================= */

function renderInsights() {

    const box =
        document.getElementById(
            "statsInsights"
        );


    if (!box) {
        return;
    }


    const entries =
        Object.values(
            diaryStore
        );


    if (!entries.length) {

        box.innerHTML = `
            <span class="habit">
                Start logging to see insights.
            </span>
        `;

        return;
    }


    const exercise =
        entries.filter(
            data =>
                String(
                    data.exercise ||
                    ""
                ).trim()
        ).length;


    const water =
        entries.filter(
            data =>
                (
                    parseFloat(
                        data.water
                    ) || 0
                ) >= waterGoal
        ).length;


    const sleep =
        entries.filter(
            data =>
                String(
                    data.sleep ||
                    ""
                ).trim()
        ).length;


    box.innerHTML = `

        <span class="habit done">
            🏃 Exercise:
            ${exercise} days
        </span>

        <span class="habit done">
            💧 Hydration goal:
            ${water} days
        </span>

        <span class="habit done">
            😴 Sleep logged:
            ${sleep} days
        </span>

    `;
}


/* =========================================================
   MOOD
========================================================= */

function moodStorageKey() {

    return `routineMood_${selectedDate}`;
}


function loadMood() {

    const mood =
        localStorage.getItem(
            moodStorageKey()
        ) || "🙂";


    setText(
        "selectedMood",
        mood
    );


    document
        .querySelectorAll(
            ".mood"
        )
        .forEach(
            button => {

                button.classList.toggle(
                    "selected",
                    button.dataset.mood ===
                    mood
                );

            }
        );
}


function setupMood() {

    document
        .querySelectorAll(
            ".mood"
        )
        .forEach(
            button => {

                button.addEventListener(
                    "click",
                    function() {

                        const mood =
                            button.dataset.mood;


                        localStorage.setItem(
                            moodStorageKey(),
                            mood
                        );


                        loadMood();


                        showToast(
                            `Mood saved ${mood}`
                        );

                    }
                );

            }
        );
}


/* =========================================================
   NAVIGATION
========================================================= */

function showPage(page) {

    document
        .querySelectorAll(
            ".page-section"
        )
        .forEach(
            section => {

                section.classList.remove(
                    "active-section"
                );

            }
        );


    const target =
        document.getElementById(
            `${page}Page`
        );


    if (target) {

        target.classList.add(
            "active-section"
        );
    }


    document
        .querySelectorAll(
            ".nav-link"
        )
        .forEach(
            link => {

                link.classList.remove(
                    "active"
                );

            }
        );


    const active =
        document.querySelector(
            `.nav-link[data-page="${page}"]`
        );


    if (active) {

        active.classList.add(
            "active"
        );
    }


    if (
        page ===
        "history"
    ) {

        renderHistory();
    }


    if (
        page ===
        "stats"
    ) {

        renderStats();
    }


    if (
        page ===
        "settings"
    ) {

        loadSettings();
    }


    window.scrollTo({
        top: 0,
        behavior: "smooth"
    });
}


/* =========================================================
   THEME
========================================================= */

function applyTheme() {

    const theme =
        localStorage.getItem(
            "routineTheme"
        ) || "light";


    document.body.classList.toggle(
        "dark",
        theme === "dark"
    );


    const button =
        document.getElementById(
            "themeButton"
        );


    if (button) {

        button.textContent =
            theme === "dark"
                ? "☀️"
                : "🌙";
    }
}


function toggleTheme() {

    const isDark =
        document.body.classList.contains(
            "dark"
        );


    localStorage.setItem(
        "routineTheme",
        isDark
            ? "light"
            : "dark"
    );


    applyTheme();
}


/* =========================================================
   SETTINGS
========================================================= */

function loadSettings() {

    const input =
        document.getElementById(
            "waterGoalInput"
        );


    if (input) {

        input.value =
            waterGoal;
    }
}


function saveWaterGoal() {

    const input =
        document.getElementById(
            "waterGoalInput"
        );


    const value =
        parseFloat(
            input?.value
        );


    if (
        !value ||
        value <= 0
    ) {

        showToast(
            "Enter a valid water goal"
        );

        return;
    }


    waterGoal =
        value;


    localStorage.setItem(
        "waterGoal",
        waterGoal
    );


    updateProgress();

    renderStats();


    showToast(
        `Water goal set to ${waterGoal} L`
    );
}


/* =========================================================
   EXPORT
========================================================= */

function exportData() {

    const data = {

        exportedAt:
            new Date()
                .toISOString(),

        waterGoal,

        diaries:
            diaryStore
    };


    const blob =
        new Blob(
            [
                JSON.stringify(
                    data,
                    null,
                    2
                )
            ],
            {
                type:
                    "application/json"
            }
        );


    const url =
        URL.createObjectURL(
            blob
        );


    const link =
        document.createElement(
            "a"
        );


    link.href =
        url;


    link.download =
        `my-routine-backup-${todayKey()}.json`;


    document.body.appendChild(
        link
    );


    link.click();


    link.remove();


    URL.revokeObjectURL(
        url
    );


    showToast(
        "Diary backup downloaded ✓"
    );
}


/* =========================================================
   TOAST
========================================================= */

let toastTimer = null;


function showToast(message) {

    const toast =
        document.getElementById(
            "toast"
        );


    if (!toast) {
        return;
    }


    toast.textContent =
        message;


    toast.classList.add(
        "show"
    );


    clearTimeout(
        toastTimer
    );


    toastTimer =
        setTimeout(
            function() {

                toast.classList.remove(
                    "show"
                );

            },
            2300
        );
}


/* =========================================================
   HELPERS
========================================================= */

function setText(
    id,
    value
) {

    const element =
        document.getElementById(
            id
        );


    if (element) {

        element.textContent =
            value;
    }
}


function toggleClass(
    id,
    className,
    state
) {

    const element =
        document.getElementById(
            id
        );


    if (element) {

        element.classList.toggle(
            className,
            Boolean(state)
        );
    }
}


/* =========================================================
   INPUT EVENTS
========================================================= */

function setupInputEvents() {

    FIELD_IDS.forEach(
        id => {

            const element =
                document.getElementById(
                    id
                );


            if (!element) {
                return;
            }


            element.addEventListener(
                "input",
                updateProgress
            );


            element.addEventListener(
                "change",
                updateProgress
            );

        }
    );
}


/* =========================================================
   EVENT SETUP
========================================================= */

function setupEvents() {


    /* Save */

    document
        .getElementById(
            "saveButton"
        )
        ?.addEventListener(
            "click",
            saveCurrent
        );


    /* Clear */

    document
        .getElementById(
            "clearButton"
        )
        ?.addEventListener(
            "click",
            clearCurrent
        );


    /* Previous month */

    document
        .getElementById(
            "prevMonth"
        )
        ?.addEventListener(
            "click",
            function() {

                calendarDate.setMonth(
                    calendarDate.getMonth() -
                    1
                );

                renderCalendar();

            }
        );


    /* Next month */

    document
        .getElementById(
            "nextMonth"
        )
        ?.addEventListener(
            "click",
            function() {

                calendarDate.setMonth(
                    calendarDate.getMonth() +
                    1
                );

                renderCalendar();

            }
        );


    /* Calendar button */

    document
        .getElementById(
            "openCalendarButton"
        )
        ?.addEventListener(
            "click",
            function() {

                document
                    .getElementById(
                        "calendarCard"
                    )
                    ?.scrollIntoView({
                        behavior:
                            "smooth",
                        block:
                            "center"
                    });

            }
        );


    /* Today */

    document
        .getElementById(
            "todayButton"
        )
        ?.addEventListener(
            "click",
            async function() {

                selectedDate =
                    todayKey();

                calendarDate =
                    new Date();

                await loadSelectedDate();

                showPage(
                    "diary"
                );

            }
        );


    /* Start today */

    document
        .getElementById(
            "startToday"
        )
        ?.addEventListener(
            "click",
            async function() {

                selectedDate =
                    todayKey();

                calendarDate =
                    new Date();

                await loadSelectedDate();

                showPage(
                    "diary"
                );

            }
        );


    /* Navigation */

    document
        .querySelectorAll(
            ".nav-link[data-page]"
        )
        .forEach(
            link => {

                link.addEventListener(
                    "click",
                    function(event) {

                        event.preventDefault();

                        showPage(
                            link.dataset.page
                        );

                    }
                );

            }
        );


    /* Theme */

    document
        .getElementById(
            "themeButton"
        )
        ?.addEventListener(
            "click",
            toggleTheme
        );


    document
        .getElementById(
            "settingsTheme"
        )
        ?.addEventListener(
            "click",
            toggleTheme
        );


    /* Water goal */

    document
        .getElementById(
            "waterGoalInput"
        )
        ?.addEventListener(
            "change",
            saveWaterGoal
        );


    /* Search */

    document
        .getElementById(
            "historySearch"
        )
        ?.addEventListener(
            "input",
            function() {

                const entries =
                    Object.entries(
                        diaryStore
                    )
                    .sort(
                        (a, b) =>
                            b[0].localeCompare(
                                a[0]
                            )
                    );


                renderHistoryItems(
                    entries
                );

            }
        );


    /* Export */

    document
        .getElementById(
            "exportButton"
        )
        ?.addEventListener(
            "click",
            exportData
        );


    /* Reset */

    document
        .getElementById(
            "resetPreferences"
        )
        ?.addEventListener(
            "click",
            function() {

                const confirmed =
                    confirm(
                        "Reset theme and water goal?"
                    );


                if (!confirmed) {
                    return;
                }


                localStorage.removeItem(
                    "routineTheme"
                );

                localStorage.removeItem(
                    "waterGoal"
                );


                waterGoal =
                    2.5;


                applyTheme();

                loadSettings();

                updateProgress();

                renderStats();


                showToast(
                    "Preferences reset"
                );

            }
        );
}


/* =========================================================
   START APPLICATION
========================================================= */

async function startApp() {

    applyTheme();

    setupMood();

    setupInputEvents();

    setupEvents();


    /*
       Always show the UI first.
       API failure should NEVER create
       a blank screen.
    */

    updateDateUI();

    fillForm(
        emptyData()
    );

    updateProgress();

    loadMood();

    renderCalendar();


    try {

        await loadAll();

        await loadSelectedDate();

    } catch (error) {

        console.error(
            "Application startup error:",
            error
        );


        /*
           Keep UI usable even if
           Flask API is unavailable.
        */

        fillForm(
            emptyData()
        );

        updateProgress();

        renderCalendar();

        renderHistory();

        renderStats();

        updateStreak();


        showToast(
            "Server unavailable — UI loaded"
        );
    }
}


/* =========================================================
   DOM READY
========================================================= */

document.addEventListener(
    "DOMContentLoaded",
    startApp
);