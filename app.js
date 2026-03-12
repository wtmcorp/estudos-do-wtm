// ===== DATA STORE =====
const STORAGE_KEY = 'datapath_progress';
const STREAK_KEY = 'datapath_streak';
const START_DATE = new Date('2026-03-12');

const TIPS = [
    "Consistência vence intensidade. Estude todos os dias, mesmo que 30 minutos.",
    "Não tente decorar fórmulas — pratique até virar automático.",
    "Monte seu portfólio no GitHub desde o início. Recrutadores olham isso.",
    "Faça anotações à mão. Estudos mostram que isso fixa mais o conteúdo.",
    "Assista tutoriais a 1.5x de velocidade. Pause e replique cada passo.",
    "Grave vídeos curtos explicando o que aprendeu. Ensinar é a melhor forma de aprender.",
    "Conecte-se com analistas de dados no LinkedIn. Networking abre portas.",
    "Não pule a teoria do SQL. Entender JOINs bem vai te salvar em entrevistas.",
    "No Power BI, capriche no design do dashboard. Visual profissional impressiona.",
    "Comece cada sessão revisando o que estudou ontem (5 min de revisão ativa).",
    "Documente tudo: processos, fórmulas, insights. Isso vira material de portfólio.",
    "Simule entrevistas técnicas. Pergunte pra si mesmo: 'como eu faria essa análise?'",
    "Use datasets reais de logística e operação. Fantasia não impressiona recrutador.",
    "No Excel, domine atalhos de teclado. Velocidade conta em testes práticos.",
    "Publique seus projetos no LinkedIn com storytelling. Conte o problema e a solução."
];

// ===== LOAD / SAVE =====
function loadProgress() {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : {};
}

function saveProgress(progress) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
}

function loadStreak() {
    const data = localStorage.getItem(STREAK_KEY);
    return data ? JSON.parse(data) : { count: 0, lastDate: null };
}

function saveStreak(streak) {
    localStorage.setItem(STREAK_KEY, JSON.stringify(streak));
}

// ===== NAVIGATION =====
function initNavigation() {
    const navItems = document.querySelectorAll('.nav-item');
    const sections = document.querySelectorAll('.content-section');

    navItems.forEach(item => {
        item.addEventListener('click', () => {
            const target = item.dataset.section;

            navItems.forEach(n => n.classList.remove('active'));
            item.classList.add('active');

            sections.forEach(s => s.classList.remove('active'));
            const targetSection = document.getElementById(`section-${target}`);
            if (targetSection) {
                targetSection.classList.add('active');
            }

            // Close sidebar on mobile
            const sidebar = document.getElementById('sidebar');
            if (window.innerWidth <= 768) {
                sidebar.classList.remove('open');
            }
        });
    });

    // Timeline items clickable
    document.querySelectorAll('.timeline-item').forEach(item => {
        item.addEventListener('click', () => {
            const week = item.dataset.week;
            const navItem = document.querySelector(`[data-section="week${week}"]`);
            if (navItem) navItem.click();
        });
    });

    // Mobile sidebar toggle
    document.body.addEventListener('click', (e) => {
        if (window.innerWidth <= 768) {
            const sidebar = document.getElementById('sidebar');
            if (e.target === document.body && e.clientX < 50 && e.clientY < 60) {
                sidebar.classList.toggle('open');
            }
        }
    });
}

// ===== CHECKBOX LOGIC =====
function initCheckboxes() {
    const progress = loadProgress();
    const checkboxes = document.querySelectorAll('input[type="checkbox"][data-task]');

    checkboxes.forEach(cb => {
        const task = cb.dataset.task;
        if (progress[task]) {
            cb.checked = true;
        }

        cb.addEventListener('change', () => {
            const currentProgress = loadProgress();
            currentProgress[task] = cb.checked;
            if (!cb.checked) delete currentProgress[task];
            saveProgress(currentProgress);
            updateAllStats();
            updateStreak();

            // Animation feedback
            if (cb.checked) {
                const label = cb.closest('.check-item');
                label.style.borderColor = 'rgba(16, 185, 129, 0.4)';
                setTimeout(() => {
                    label.style.borderColor = '';
                }, 600);
            }
        });
    });
}

// ===== STATS UPDATE =====
function getTaskCounts(prefix) {
    const progress = loadProgress();
    const all = document.querySelectorAll(`input[data-task^="${prefix}"]`);
    const done = Array.from(all).filter(cb => progress[cb.dataset.task]).length;
    return { done, total: all.length };
}

function updateAllStats() {
    const progress = loadProgress();
    const allTasks = document.querySelectorAll('input[data-task]');
    const totalDone = Object.keys(progress).filter(k => progress[k]).length;
    const totalAll = allTasks.length;
    const percentage = totalAll > 0 ? Math.round((totalDone / totalAll) * 100) : 0;

    // Progress ring
    const ring = document.getElementById('progressRing');
    if (ring) {
        const circumference = 2 * Math.PI * 52;
        const offset = circumference - (percentage / 100) * circumference;
        ring.style.strokeDashoffset = offset;
    }

    const progressText = document.getElementById('progressText');
    if (progressText) progressText.textContent = `${percentage}%`;

    // Dashboard stats
    const completedEl = document.getElementById('completedTasks');
    if (completedEl) completedEl.textContent = totalDone;

    const totalEl = document.getElementById('totalTasks');
    if (totalEl) totalEl.textContent = totalAll;

    // Days remaining
    const now = new Date();
    const endDate = new Date(START_DATE);
    endDate.setDate(endDate.getDate() + 60);
    const daysLeft = Math.max(0, Math.ceil((endDate - now) / (1000 * 60 * 60 * 24)));
    const daysEl = document.getElementById('daysRemaining');
    if (daysEl) daysEl.textContent = daysLeft;

    // Current week
    const daysPassed = Math.ceil((now - START_DATE) / (1000 * 60 * 60 * 24));
    const currentWeek = Math.min(8, Math.max(1, Math.ceil(daysPassed / 7)));
    const weekEl = document.getElementById('currentWeek');
    if (weekEl) weekEl.textContent = currentWeek;

    // Week badges
    const weeks = ['w12', 'w34', 'w56', 'w78'];
    const weekKeys = ['week12', 'week34', 'week56', 'week78'];

    weeks.forEach((prefix, i) => {
        const counts = getTaskCounts(prefix);
        const badge = document.getElementById(`badge-${weekKeys[i]}`);
        if (badge) {
            badge.textContent = `${counts.done}/${counts.total}`;
            if (counts.done === counts.total && counts.total > 0) {
                badge.style.background = 'rgba(16, 185, 129, 0.2)';
                badge.style.color = '#10b981';
            }
        }

        // Timeline fills
        const fill = document.getElementById(`fill-${weekKeys[i]}`);
        if (fill) {
            const pct = counts.total > 0 ? (counts.done / counts.total) * 100 : 0;
            fill.style.width = `${pct}%`;
        }
    });
}

// ===== STREAK =====
function updateStreak() {
    const streak = loadStreak();
    const today = new Date().toISOString().split('T')[0];

    if (streak.lastDate !== today) {
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayStr = yesterday.toISOString().split('T')[0];

        if (streak.lastDate === yesterdayStr) {
            streak.count += 1;
        } else if (streak.lastDate !== today) {
            streak.count = 1;
        }
        streak.lastDate = today;
        saveStreak(streak);
    }

    const streakEl = document.getElementById('streakCount');
    if (streakEl) {
        streakEl.textContent = `${streak.count} dia${streak.count !== 1 ? 's' : ''} seguido${streak.count !== 1 ? 's' : ''}`;
    }
}

// ===== DAILY TIP =====
function setDailyTip() {
    const dayOfYear = Math.floor((new Date() - new Date(new Date().getFullYear(), 0, 0)) / (1000 * 60 * 60 * 24));
    const tipIndex = dayOfYear % TIPS.length;
    const tipEl = document.getElementById('dailyTip');
    if (tipEl) tipEl.textContent = TIPS[tipIndex];
}

// ===== INIT =====
document.addEventListener('DOMContentLoaded', () => {
    initNavigation();
    initCheckboxes();
    updateAllStats();
    updateStreak();
    setDailyTip();

    // Animate stats on load
    setTimeout(() => {
        document.querySelectorAll('.stat-card').forEach((card, i) => {
            card.style.opacity = '0';
            card.style.transform = 'translateY(20px)';
            card.style.transition = `all 0.5s ease ${i * 0.1}s`;
            requestAnimationFrame(() => {
                card.style.opacity = '1';
                card.style.transform = 'translateY(0)';
            });
        });
    }, 100);
});
