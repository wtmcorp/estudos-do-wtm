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
let luckysheetInitialized = false;

function initNavigation() {
    const navItems = document.querySelectorAll('.nav-item');
    const sections = document.querySelectorAll('.content-section');

    function activateTab(target) {
        navItems.forEach(n => n.classList.remove('active'));
        const activeNav = document.querySelector(`.nav-item[data-section="${target}"]`);
        if (activeNav) activeNav.classList.add('active');

        sections.forEach(s => s.classList.remove('active'));
        const targetSection = document.getElementById(`section-${target}`);
        if (targetSection) {
            targetSection.classList.add('active');
        }

        // Inicializa o Luckysheet se a aba of selecionada pela primeira vez
        if (target === 'excel-practice' && !luckysheetInitialized) {
            if (typeof luckysheet !== 'undefined') {
                setTimeout(() => {
                    luckysheet.create({
                        container: 'luckysheet-container',
                        lang: 'en',
                        showinfobar: false,
                        data: [{
                            "name": "Planilha Prática",
                            "color": "",
                            "status": "1",
                            "order": "0",
                            "data": [],
                            "config": {},
                            "index": 0
                        }]
                    });
                    luckysheetInitialized = true;
                }, 100); // pequeno timeout para garantir que o DOM renderizou
            }
        }
    }

    // Carregar aba salva ou ir para dashboard
    const savedTab = localStorage.getItem('datapath_last_tab') || 'dashboard';
    activateTab(savedTab);

    navItems.forEach(item => {
        item.addEventListener('click', () => {
            const target = item.dataset.section;
            activateTab(target);
            localStorage.setItem('datapath_last_tab', target);

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
    initFloatingTools();
    initNeuralAudio();
    initFlashcards();
    initSqlSimulator();

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

    initQuiz();
    fixVideoEmbeds();
});

// ===== QUIZ / SIMULADOS =====
const QUIZ_QUESTIONS = {
    excel: [
        { q: "Qual função do Excel busca um valor na primeira coluna de uma tabela e retorna um valor correspondente?", o: ["PROCV", "PROCH", "ÍNDICE", "CORRESP"], a: 0, e: "PROCV (ou VLOOKUP) busca verticalmente. PROCH busca horizontalmente. ÍNDICE+CORRESP é mais flexível mas PROCV é o mais cobrado em entrevistas." },
        { q: "No Excel, qual atalho seleciona TODOS os dados de uma planilha?", o: ["Ctrl+A", "Ctrl+T", "Ctrl+Shift+End", "Alt+F1"], a: 0, e: "Ctrl+A seleciona tudo. Ctrl+T transforma em tabela formatada. Ctrl+Shift+End vai até a última célula usada." },
        { q: "Qual função retorna a posição de um item dentro de um intervalo?", o: ["PROCV", "CORRESP", "ÍNDICE", "CONT.SE"], a: 1, e: "CORRESP (ou MATCH) retorna a posição numérica. É frequentemente combinada com ÍNDICE para substituir o PROCV." },
        { q: "Para remover espaços extras de uma célula, qual função usar?", o: ["LIMPAR", "ARRUMAR", "SUBSTITUIR", "TIRAR"], a: 1, e: "ARRUMAR (ou TRIM) remove espaços extras no início, fim e entre palavras, deixando apenas um espaço entre elas." },
        { q: "No Excel, o que é uma Tabela Dinâmica?", o: ["Um gráfico animado", "Uma ferramenta de resumo e análise interativa de dados", "Uma tabela com formatação condicional", "Uma macro que reorganiza dados"], a: 1, e: "Tabela Dinâmica (Pivot Table) é a ferramenta mais poderosa do Excel para análise de dados. Permite resumir, agrupar e filtrar grandes volumes de dados." },
        { q: "Qual função do Excel conta células que atendem a um critério?", o: ["CONT.VALORES", "CONT.SE", "SOMASE", "MÉDIA",], a: 1, e: "CONT.SE (COUNTIF) conta quantas células atendem a um critério. SOMASE soma valores que atendem ao critério." },
        { q: "O que o XLOOKUP tem de vantagem sobre o PROCV?", o: ["É mais rápido", "Permite busca em qualquer direção e trata erros automaticamente", "Funciona apenas no Excel 365", "Não tem vantagem"], a: 1, e: "XLOOKUP busca em qualquer direção (não só para a direita como PROCV) e tem um argumento nativo para tratar valor não encontrado." },
        { q: "Qual recurso do Excel permite criar listas suspensas de valores válidos?", o: ["Formatação Condicional", "Filtro Avançado", "Validação de Dados", "Segmentação"], a: 2, e: "Validação de Dados (Data Validation) permite criar regras e listas suspensas para controlar o que pode ser digitado em uma célula." },
        { q: "Para identificar outliers visualmente em uma coluna numérica, qual recurso é mais indicado?", o: ["Tabela Dinâmica", "Formatação Condicional com Escalas de Cor", "Filtro Avançado", "Texto para Colunas"], a: 1, e: "Formatação Condicional com escalas de cor destaca visualmente valores extremos, facilitando a identificação de outliers." },
        { q: "No Excel, como separar 'São Paulo-SP' em duas colunas (Cidade e Estado)?", o: ["Ctrl+Z", "Texto para Colunas com delimitador '-'", "PROCV", "Segmentação de Dados"], a: 1, e: "Texto para Colunas (Data > Text to Columns) divide o conteúdo de uma célula em múltiplas colunas usando um delimitador especificado." }
    ],
    powerbi: [
        { q: "No Power BI, qual é a linguagem usada para criar medidas e colunas calculadas?", o: ["SQL", "Python", "DAX", "M"], a: 2, e: "DAX (Data Analysis Expressions) é a linguagem de fórmulas do Power BI para medidas e colunas calculadas. M é usada no Power Query." },
        { q: "Qual a diferença entre uma Medida e uma Coluna Calculada no Power BI?", o: ["Não há diferença", "Medida é calculada em tempo real; Coluna Calculada é armazenada na tabela", "Coluna Calculada é mais rápida", "Medida só aceita SUM"], a: 1, e: "Medidas são calculadas dinamicamente conforme os filtros mudam. Colunas Calculadas são computadas uma vez e armazenadas na tabela, ocupando memória." },
        { q: "No modelo estrela (Star Schema), o que é uma tabela fato?", o: ["Tabela com informações descritivas (ex: nomes)", "Tabela central com métricas numéricas e chaves", "Tabela de calendário", "Tabela de backup"], a: 1, e: "Tabela fato contém as métricas/transações (ex: vendas, pedidos) e as chaves que se conectam às tabelas dimensão ao redor." },
        { q: "Qual função DAX calcula o total acumulado do ano (Year-to-Date)?", o: ["SUMX", "CALCULATE", "TOTALYTD", "DATEADD"], a: 2, e: "TOTALYTD calcula automaticamente o acumulado do ano. Exemplo: Vendas YTD = TOTALYTD([Total Vendas]; dCalendario[Date])" },
        { q: "O que o Power Query faz no Power BI?", o: ["Cria gráficos", "Importa, limpa e transforma dados antes de carregar", "Publica dashboards online", "Cria medidas DAX"], a: 1, e: "Power Query (Editor de consultas) é o ETL do Power BI: importa dados de várias fontes, limpa, transforma e carrega para o modelo." },
        { q: "Por que usar DIVIDE() em vez de barra (/) no DAX?", o: ["É mais rápido", "Aceita mais de 2 argumentos", "Trata divisão por zero automaticamente", "Não existe diferença"], a: 2, e: "DIVIDE(A, B, ValorAlternativo) retorna o valor alternativo quando B é zero, evitando erros de divisão por zero." },
        { q: "Qual visual do Power BI é ideal para mostrar um único número grande (ex: Total de Vendas)?", o: ["Gráfico de Barras", "Cartão (Card)", "Tabela", "Mapa"], a: 1, e: "O visual Cartão (Card) exibe um único KPI de forma destacada. É padrão em dashboards profissionais para métricas-chave." },
        { q: "Qual a função do Slicer (Segmentador) no Power BI?", o: ["Criar gráficos", "Filtrar visuais interativamente", "Importar dados", "Criar tabelas"], a: 1, e: "Slicers são filtros visuais que permitem ao usuário interagir com o dashboard, filtrando todos os visuais conectados." },
        { q: "No Power BI, como criar uma tabela calendário via DAX?", o: ["CALENDAR(inicio, fim)", "DATERANGE()", "CREATETABLE()", "NEWTABLE()"], a: 0, e: "dCalendario = CALENDAR(DATE(2024,1,1), DATE(2025,12,31)) cria uma tabela com todas as datas do intervalo." },
        { q: "Qual a melhor prática para nomear tabelas no modelo de dados?", o: ["Usar tudo maiúsculo", "Prefixo 'f' para fato e 'd' para dimensão", "Usar números sequenciais", "Não importa o nome"], a: 1, e: "Convenção profissional: fVendas (fato), dProduto, dCliente (dimensões). Isso organiza o modelo e impressiona recrutadores." }
    ],
    sql: [
        { q: "Qual comando SQL é usado para consultar dados de uma tabela?", o: ["GET", "FETCH", "SELECT", "RETRIEVE"], a: 2, e: "SELECT é o comando fundamental do SQL para consultar dados. Exemplo: SELECT * FROM tabela" },
        { q: "Qual cláusula filtra registros ANTES do agrupamento?", o: ["HAVING", "WHERE", "FILTER", "GROUP BY"], a: 1, e: "WHERE filtra linhas antes do GROUP BY. HAVING filtra grupos DEPOIS do agrupamento. Essa diferença é muito cobrada em entrevistas." },
        { q: "Qual tipo de JOIN retorna APENAS registros que existem nas duas tabelas?", o: ["LEFT JOIN", "RIGHT JOIN", "INNER JOIN", "FULL OUTER JOIN"], a: 2, e: "INNER JOIN retorna apenas registros com correspondência em ambas as tabelas. LEFT JOIN mantém todos da esquerda mesmo sem match." },
        { q: "Para contar o número de linhas de uma tabela, qual função usar?", o: ["SUM(*)", "COUNT(*)", "TOTAL(*)", "NUM(*)"], a: 1, e: "COUNT(*) conta todas as linhas da tabela (incluindo NULLs). COUNT(coluna) conta apenas valores não-NULL." },
        { q: "O que o GROUP BY faz no SQL?", o: ["Ordena os resultados", "Agrupa linhas com valores iguais para aplicar funções de agregação", "Filtra dados duplicados", "Junta duas tabelas"], a: 1, e: "GROUP BY agrupa registros com valores iguais e permite aplicar funções como SUM, COUNT, AVG sobre cada grupo." },
        { q: "Qual a diferença entre DISTINCT e GROUP BY?", o: ["São idênticos", "DISTINCT remove duplicatas; GROUP BY permite agregar", "GROUP BY é mais rápido", "DISTINCT funciona com JOIN"], a: 1, e: "DISTINCT apenas remove duplicatas. GROUP BY agrupa e permite usar funções de agregação (SUM, COUNT, AVG) sobre cada grupo." },
        { q: "Qual comando ordena resultados do maior para o menor?", o: ["ORDER BY ASC", "ORDER BY DESC", "SORT BY DESC", "RANK DESC"], a: 1, e: "ORDER BY coluna DESC ordena de forma decrescente. ASC (padrão) ordena de forma crescente." },
        { q: "O que faz o CASE WHEN no SQL?", o: ["Cria uma nova tabela", "Funciona como IF/ELSE criando categorias condicionais", "Filtra dados nulos", "Agrupa dados"], a: 1, e: "CASE WHEN é o 'SE' do SQL. Permite criar categorias: CASE WHEN valor > 100 THEN 'Alto' ELSE 'Baixo' END" },
        { q: "Para trazer os 5 primeiros registros, qual cláusula usar?", o: ["TOP 5 (SQL Server) ou LIMIT 5 (MySQL/PostgreSQL)", "FIRST 5", "HEAD 5", "RANGE 5"], a: 0, e: "LIMIT 5 (MySQL/PostgreSQL/SQLite) ou TOP 5 (SQL Server) limitam o número de linhas retornadas." },
        { q: "LEFT JOIN: o que acontece quando não há correspondência na tabela da direita?", o: ["A linha é excluída", "A linha aparece com NULL nos campos da tabela direita", "Dá erro", "Retorna 0"], a: 1, e: "LEFT JOIN mantém TODAS as linhas da tabela esquerda. Onde não há match, os campos da tabela direita ficam NULL." }
    ]
};

let quizState = {
    category: 'excel',
    questions: [],
    currentIndex: 0,
    correct: 0,
    wrong: 0,
    answers: [],
    timer: null,
    timeLeft: 60,
    totalTime: 0
};

function initQuiz() {
    // Quiz category buttons
    document.querySelectorAll('.quiz-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.quiz-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            quizState.category = btn.dataset.quiz;
        });
    });

    const startBtn = document.getElementById('quizStartBtn');
    if (startBtn) startBtn.addEventListener('click', startQuiz);

    const nextBtn = document.getElementById('quizNextBtn');
    if (nextBtn) nextBtn.addEventListener('click', nextQuestion);

    const retryBtn = document.getElementById('quizRetryBtn');
    if (retryBtn) retryBtn.addEventListener('click', () => {
        document.getElementById('quizResultScreen').style.display = 'none';
        document.getElementById('quizStartScreen').style.display = 'flex';
    });
}

function shuffleArray(arr) {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
}

function startQuiz() {
    let questions = [];
    if (quizState.category === 'all') {
        questions = shuffleArray([
            ...QUIZ_QUESTIONS.excel.map(q => ({ ...q, cat: 'EXCEL' })),
            ...QUIZ_QUESTIONS.powerbi.map(q => ({ ...q, cat: 'POWER BI' })),
            ...QUIZ_QUESTIONS.sql.map(q => ({ ...q, cat: 'SQL' }))
        ]).slice(0, 15);
    } else {
        const catName = quizState.category === 'powerbi' ? 'POWER BI' : quizState.category.toUpperCase();
        questions = shuffleArray(QUIZ_QUESTIONS[quizState.category].map(q => ({ ...q, cat: catName }))).slice(0, 10);
    }

    quizState.questions = questions;
    quizState.currentIndex = 0;
    quizState.correct = 0;
    quizState.wrong = 0;
    quizState.answers = [];
    quizState.totalTime = 0;

    document.getElementById('quizTotal').textContent = questions.length;
    document.getElementById('quizCorrect').textContent = '0';
    document.getElementById('quizWrong').textContent = '0';
    document.getElementById('quizScore').textContent = '0%';

    document.getElementById('quizStartScreen').style.display = 'none';
    document.getElementById('quizResultScreen').style.display = 'none';
    document.getElementById('quizQuestionScreen').style.display = 'block';

    showQuestion();
}

function showQuestion() {
    const q = quizState.questions[quizState.currentIndex];
    document.getElementById('quizCurrent').textContent = quizState.currentIndex + 1;
    document.getElementById('quizCategoryTag').textContent = q.cat;
    document.getElementById('quizQuestionText').textContent = q.q;
    document.getElementById('quizFeedback').style.display = 'none';

    const optionsEl = document.getElementById('quizOptions');
    const letters = ['A', 'B', 'C', 'D'];
    optionsEl.innerHTML = q.o.map((opt, i) =>
        `<div class="quiz-option" data-index="${i}">
            <span class="option-letter">${letters[i]}</span>
            <span>${opt}</span>
        </div>`
    ).join('');

    optionsEl.querySelectorAll('.quiz-option').forEach(opt => {
        opt.addEventListener('click', () => selectAnswer(parseInt(opt.dataset.index)));
    });

    // Start timer
    quizState.timeLeft = 60;
    const timerFill = document.getElementById('quizTimerFill');
    const timerText = document.getElementById('quizTimerText');
    timerFill.style.width = '100%';
    timerText.textContent = '60s';

    clearInterval(quizState.timer);
    quizState.timer = setInterval(() => {
        quizState.timeLeft--;
        timerText.textContent = `${quizState.timeLeft}s`;
        timerFill.style.width = `${(quizState.timeLeft / 60) * 100}%`;

        if (quizState.timeLeft <= 10) {
            timerFill.style.background = 'linear-gradient(135deg, #ef4444, #f97316)';
        } else {
            timerFill.style.background = '';
        }

        if (quizState.timeLeft <= 0) {
            clearInterval(quizState.timer);
            selectAnswer(-1); // timeout
        }
    }, 1000);
}

function selectAnswer(index) {
    clearInterval(quizState.timer);
    const q = quizState.questions[quizState.currentIndex];
    const isCorrect = index === q.a;
    const timeSpent = 60 - quizState.timeLeft;
    quizState.totalTime += timeSpent;

    // Disable all options
    document.querySelectorAll('.quiz-option').forEach(opt => {
        opt.classList.add('disabled');
        opt.style.pointerEvents = 'none';
        const idx = parseInt(opt.dataset.index);
        if (idx === q.a) opt.classList.add('correct');
        if (idx === index && !isCorrect) opt.classList.add('wrong');
    });

    if (isCorrect) {
        quizState.correct++;
        quizState.answers.push({ q: q.q, correct: true });
    } else {
        quizState.wrong++;
        quizState.answers.push({ q: q.q, correct: false, yourAnswer: index >= 0 ? q.o[index] : 'Tempo esgotado', rightAnswer: q.o[q.a] });
    }

    // Update stats
    document.getElementById('quizCorrect').textContent = quizState.correct;
    document.getElementById('quizWrong').textContent = quizState.wrong;
    const total = quizState.currentIndex + 1;
    document.getElementById('quizScore').textContent = `${Math.round((quizState.correct / total) * 100)}%`;

    // Show feedback
    const feedback = document.getElementById('quizFeedback');
    feedback.style.display = 'flex';
    document.getElementById('quizFeedbackIcon').textContent = isCorrect ? '✅' : '❌';
    document.getElementById('quizFeedbackText').textContent = isCorrect ? 'Correto! Mandou bem!' : (index === -1 ? 'Tempo esgotado!' : 'Errado!');
    document.getElementById('quizFeedbackText').style.color = isCorrect ? 'var(--accent-green)' : 'var(--accent-red)';
    document.getElementById('quizExplanation').textContent = q.e;

    if (quizState.currentIndex >= quizState.questions.length - 1) {
        document.getElementById('quizNextBtn').textContent = 'Ver Resultado →';
    }
}

function nextQuestion() {
    quizState.currentIndex++;
    if (quizState.currentIndex >= quizState.questions.length) {
        showResults();
    } else {
        document.getElementById('quizNextBtn').textContent = 'Próxima →';
        showQuestion();
    }
}

function showResults() {
    document.getElementById('quizQuestionScreen').style.display = 'none';
    document.getElementById('quizResultScreen').style.display = 'flex';

    const total = quizState.questions.length;
    const pct = Math.round((quizState.correct / total) * 100);
    const avgTime = Math.round(quizState.totalTime / total);

    document.getElementById('quizFinalScore').textContent = `${pct}%`;
    document.getElementById('quizFinalCorrect').textContent = `${quizState.correct}/${total}`;
    document.getElementById('quizFinalTime').textContent = `${avgTime}s`;

    let icon, title, subtitle;
    if (pct >= 90) { icon = '🏆'; title = 'Excelente!'; subtitle = 'Você está pronto para entrevistas técnicas!'; }
    else if (pct >= 70) { icon = '🎉'; title = 'Muito bom!'; subtitle = 'Você está no caminho certo. Revise os pontos fracos.'; }
    else if (pct >= 50) { icon = '💪'; title = 'Bom progresso!'; subtitle = 'Continue estudando. Foco nas questões que errou.'; }
    else { icon = '📚'; title = 'Hora de revisar!'; subtitle = 'Revise o conteúdo e refaça o simulado. Cada erro é uma oportunidade de aprender.'; }

    document.getElementById('quizResultIcon').textContent = icon;
    document.getElementById('quizResultTitle').textContent = title;
    document.getElementById('quizResultSubtitle').textContent = subtitle;

    // Review
    document.getElementById('quizResultReview').innerHTML = quizState.answers.map((a, i) =>
        `<div class="review-item ${a.correct ? 'correct' : 'wrong'}">
            <span>${a.correct ? '✅' : '❌'}</span>
            <span>${i + 1}. ${a.q.substring(0, 60)}${a.q.length > 60 ? '...' : ''}</span>
        </div>`
    ).join('');
}

// ===== FLOATING TOOLS LOGIC =====
function initFloatingTools() {
    const btnPomodoro = document.getElementById('btnPomodoro');
    const btnNotes = document.getElementById('btnNotes');
    const btnNeuralAudio = document.getElementById('btnNeuralAudio');

    const widgetPomodoro = document.getElementById('widgetPomodoro');
    const widgetNotes = document.getElementById('widgetNotes');
    const widgetNeuralAudio = document.getElementById('widgetNeuralAudio');

    const closeBtns = document.querySelectorAll('.close-widget');

    function toggleWidget(widgetConfig) {
        document.querySelectorAll('.tool-widget').forEach(w => {
            if (w !== widgetConfig) w.classList.remove('active');
        });
        widgetConfig.classList.toggle('active');
    }

    if (btnPomodoro) btnPomodoro.addEventListener('click', () => toggleWidget(widgetPomodoro));
    if (btnNotes) btnNotes.addEventListener('click', () => toggleWidget(widgetNotes));
    if (btnNeuralAudio) btnNeuralAudio.addEventListener('click', () => toggleWidget(widgetNeuralAudio));

    closeBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            document.getElementById(btn.dataset.widget).classList.remove('active');
        });
    });

    // Notes Logic
    const quickNotes = document.getElementById('quickNotes');
    const notesSavedLabel = document.getElementById('notesSavedLabel');
    const clearNotesBtn = document.getElementById('clearNotesBtn');
    let typingTimer;

    if (quickNotes) {
        quickNotes.value = localStorage.getItem('datapath_quicknotes') || '';

        quickNotes.addEventListener('input', () => {
            notesSavedLabel.style.display = 'none';
            clearTimeout(typingTimer);
            typingTimer = setTimeout(() => {
                localStorage.setItem('datapath_quicknotes', quickNotes.value);
                notesSavedLabel.style.display = 'inline-block';
                setTimeout(() => notesSavedLabel.style.display = 'none', 2000);
            }, 800);
        });

        if (clearNotesBtn) {
            clearNotesBtn.addEventListener('click', () => {
                quickNotes.value = '';
                localStorage.removeItem('datapath_quicknotes');
            });
        }
    }

    // Pomodoro Logic
    let pomoInterval;
    let pomoTime = 25 * 60; // 25 minutes
    let isPomoRunning = false;
    let isBreak = false;

    const pomoDisplay = document.getElementById('pomodoroTime');
    const pomoStart = document.getElementById('pomoStart');
    const pomoBreak = document.getElementById('pomoBreak');
    const pomoReset = document.getElementById('pomoReset');

    function updatePomoDisplay() {
        if (!pomoDisplay) return;
        const m = Math.floor(pomoTime / 60).toString().padStart(2, '0');
        const s = (pomoTime % 60).toString().padStart(2, '0');
        pomoDisplay.textContent = `${m}:${s}`;

        if (isPomoRunning) {
            document.title = `(${m}:${s}) ${isBreak ? 'Pausa' : 'Foco'} - Plano 2 Meses`;
        } else {
            document.title = 'Plano de Estudos 2 Meses — Analista de Dados';
        }
    }

    function startTimer() {
        if (isPomoRunning) return;
        isPomoRunning = true;
        pomoInterval = setInterval(() => {
            if (pomoTime > 0) {
                pomoTime--;
                updatePomoDisplay();
            } else {
                clearInterval(pomoInterval);
                isPomoRunning = false;

                // Emite um pequeno som via Web Audio API
                try {
                    const ctx = new (window.AudioContext || window.webkitAudioContext)();
                    const osc = ctx.createOscillator();
                    osc.connect(ctx.destination);
                    osc.frequency.value = 800; // Hz
                    osc.start();
                    setTimeout(() => osc.stop(), 500);
                } catch (e) { }

                alert(isBreak ? "Pausa encerrada! Volte ao estudo com foco total." : "Ciclo concluído! Faça uma pequena pausa e caminhe.");
                updatePomoDisplay();
            }
        }, 1000);
    }

    if (pomoStart) {
        pomoStart.addEventListener('click', () => {
            if (isPomoRunning && !isBreak) return; // already running focus
            clearInterval(pomoInterval);
            isPomoRunning = false;
            isBreak = false;
            if (pomoTime === 5 * 60) pomoTime = 25 * 60; // back to focus
            updatePomoDisplay();
            startTimer();
        });
    }

    if (pomoBreak) {
        pomoBreak.addEventListener('click', () => {
            if (isPomoRunning && isBreak) return;
            clearInterval(pomoInterval);
            isPomoRunning = false;
            isBreak = true;
            pomoTime = 5 * 60;
            updatePomoDisplay();
            startTimer();
        });
    }

    if (pomoReset) {
        pomoReset.addEventListener('click', () => {
            clearInterval(pomoInterval);
            isPomoRunning = false;
            isBreak = false;
            pomoTime = 25 * 60;
            updatePomoDisplay();
        });
    }
}

// ===== NEURAL AUDIO V2 (WEBAUDIO API) =====
function initNeuralAudio() {
    let ctx;

    // Brown Noise Generator Node
    let brownNoiseNode, brownGain;
    let isBrownPlaying = false;

    // Gamma Isochronic Node
    let gammaOsc, gammaGain, gammaLfo, gammaLfoGain;
    let isGammaPlaying = false;

    function initAudioCtx() {
        if (!ctx) {
            ctx = new (window.AudioContext || window.webkitAudioContext)();
        }
    }

    function createBrownNoise() {
        // Brown noise generation via AudioWorklet/ScriptProcessor
        const bufferSize = 4096;
        let lastOut = 0;
        const node = ctx.createScriptProcessor(bufferSize, 1, 1);
        node.onaudioprocess = function (e) {
            const output = e.outputBuffer.getChannelData(0);
            for (let i = 0; i < bufferSize; i++) {
                const white = Math.random() * 2 - 1;
                output[i] = (lastOut + (0.02 * white)) / 1.02; // Simple lowpass filter integration
                lastOut = output[i];
                output[i] *= 3.5; // Compensate gain
            }
        };
        const gain = ctx.createGain();
        gain.gain.value = document.getElementById('brownVolume').value / 100;
        node.connect(gain);
        return { node, gain };
    }

    function createGammaIsocronic() {
        // Creates a carrier frequency (e.g. 200Hz) modulated by a 40Hz envelope (Gamma)
        const carrier = ctx.createOscillator();
        carrier.type = 'sine';
        carrier.frequency.value = 200;

        const modulator = ctx.createOscillator();
        modulator.type = 'square';
        modulator.frequency.value = 40; // 40 Hz Gamma

        const modulatorGain = ctx.createGain();
        modulatorGain.gain.value = 1;

        const masterGain = ctx.createGain();
        masterGain.gain.value = document.getElementById('gammaVolume').value / 100;

        // Modulate the master gain
        modulator.connect(modulatorGain);
        modulatorGain.connect(masterGain.gain);

        carrier.connect(masterGain);
        return { carrier, modulator, gain: masterGain };
    }

    const btnBrown = document.getElementById('toggleBrownNoise');
    const brownVol = document.getElementById('brownVolume');

    if (btnBrown) {
        btnBrown.addEventListener('click', () => {
            initAudioCtx();
            if (ctx.state === 'suspended') ctx.resume();

            if (isBrownPlaying) {
                brownNoiseNode.node.disconnect();
                isBrownPlaying = false;
                btnBrown.textContent = '▶ Ruído Marrom';
                btnBrown.style.background = '';
            } else {
                brownNoiseNode = createBrownNoise();
                brownNoiseNode.gain.connect(ctx.destination);
                isBrownPlaying = true;
                btnBrown.textContent = '⏸ Parar Ruído';
                btnBrown.style.background = 'rgba(139, 69, 19, 0.4)';
            }
        });

        brownVol.addEventListener('input', (e) => {
            if (brownNoiseNode) brownNoiseNode.gain.gain.value = e.target.value / 100;
        });
    }

    const btnGamma = document.getElementById('toggleGammaWave');
    const gammaVol = document.getElementById('gammaVolume');

    if (btnGamma) {
        btnGamma.addEventListener('click', () => {
            initAudioCtx();
            if (ctx.state === 'suspended') ctx.resume();

            if (isGammaPlaying) {
                gammaOsc.carrier.stop();
                gammaOsc.modulator.stop();
                gammaOsc.carrier.disconnect();
                gammaOsc.modulator.disconnect();
                isGammaPlaying = false;
                btnGamma.textContent = '▶ Ondas Gamma (40Hz)';
                btnGamma.style.background = '';
            } else {
                gammaOsc = createGammaIsocronic();
                gammaOsc.gain.connect(ctx.destination);
                gammaOsc.carrier.start();
                gammaOsc.modulator.start();
                isGammaPlaying = true;
                btnGamma.textContent = '⏸ Parar Gamma';
                btnGamma.style.background = 'rgba(139, 92, 246, 0.4)';
            }
        });

        gammaVol.addEventListener('input', (e) => {
            if (gammaOsc) gammaOsc.gain.gain.value = e.target.value / 100;
        });
    }
}

// ===== SQL TERMINAL ======
function initSqlSimulator() {
    const runBtn = document.getElementById('btnRunSql');
    const resetBtn = document.getElementById('btnResetSqlDbs');
    const inputArea = document.getElementById('sqlTerminalInput');
    const outDiv = document.getElementById('sqlTerminalOutput');
    let db;

    if (!document.getElementById('section-sql-practice')) return;

    function renderTableFromResults(results) {
        if (!results || results.length === 0) {
            return `<div style="color:var(--accent-green); text-align:center; padding: 20px;">✓ Query executada com sucesso. (0 linhas afetadas / vazia)</div>`;
        }

        let html = '<table class="sql-table"><thead><tr>';
        results[0].columns.forEach(col => {
            html += `<th>${col}</th>`;
        });
        html += '</tr></thead><tbody>';

        results[0].values.forEach(row => {
            html += '<tr>';
            row.forEach(val => {
                html += `<td>${val !== null ? val : '<em>NULL</em>'}</td>`;
            });
            html += '</tr>';
        });

        html += '</tbody></table>';
        return html;
    }

    const savedQuery = localStorage.getItem('datapath_last_sql');
    if (savedQuery) {
        inputArea.value = savedQuery;
    }

    inputArea.addEventListener('input', () => {
        localStorage.setItem('datapath_last_sql', inputArea.value);
    });

    function initializeDb() {
        if (typeof window.initSqlJs !== 'function') return;

        initSqlJs({ locateFile: filename => `https://cdnjs.cloudflare.com/ajax/libs/sql.js/1.8.0/${filename}` }).then(function (SQL) {
            db = new SQL.Database();

            // Create some mock tables
            const initQuery = `
                CREATE TABLE clientes (id_cliente INT, nome TEXT, estado TEXT);
                INSERT INTO clientes VALUES (1, 'Walter', 'SP'), (2, 'Sofia', 'RJ'), (3, 'Ana', 'MG'), (4, 'Carlos', 'SP');

                CREATE TABLE produtos (id_produto INT, produto TEXT, categoria TEXT, preco REAL);
                INSERT INTO produtos VALUES (101, 'Notebook', 'Tecnologia', 3500.00), 
                                            (102, 'Mouse', 'Periféricos', 150.00),
                                            (103, 'Cadeira', 'Móveis', 800.00);

                CREATE TABLE vendas (id_venda INT, id_cliente INT, id_produto INT, quantidade INT, data_venda TEXT);
                INSERT INTO vendas VALUES (1001, 1, 101, 1, '2026-03-01'), 
                                          (1002, 1, 102, 2, '2026-03-01'),
                                          (1003, 2, 103, 1, '2026-03-05'),
                                          (1004, 3, 101, 1, '2026-03-10'),
                                          (1005, 4, 102, 3, '2026-03-15');
            `;
            db.run(initQuery);
            outDiv.innerHTML = `<div style="color:var(--text-muted); text-align:center; padding: 20px;">Banco inicializado e pronto! Clique em "Executar Query".</div>`;
        }).catch(err => {
            console.error(err);
            outDiv.innerHTML = `<div style="color:var(--accent-red); padding: 20px;">Erro ao carregar SQLite no navegador.</div>`;
        });
    }

    // Try to init DB
    initializeDb();

    if (runBtn) {
        runBtn.addEventListener('click', () => {
            if (!db) {
                outDiv.innerHTML = `<div style="color:var(--accent-red); padding: 20px;">Aguarde, banco carregando...</div>`;
                return;
            }
            const query = inputArea.value;
            try {
                const res = db.exec(query);
                outDiv.innerHTML = renderTableFromResults(res);
            } catch (err) {
                outDiv.innerHTML = `<div style="color:var(--accent-red); padding: 20px;"><b>Erro de Sintaxe:</b><br/>${err.message}</div>`;
            }
        });
    }

    if (resetBtn) {
        resetBtn.addEventListener('click', () => {
            db.close();
            initializeDb();
        });
    }
}

// ===== FLASHCARDS ======
const FLASHCARDS_DATA = [
    { cat: 'excel', q: 'Para que serve a função ÍNDICE (INDEX)?', a: 'Retorna um valor dentro de um intervalo dada a interseção exata de linha e coluna. Geralmente usada em conjunto com CORRESP para substituir o PROCV.' },
    { cat: 'excel', q: 'Como criar uma Tabela Dinâmica rapidamente?', a: 'Selecione seus dados (como tabela) e aperte Alt + N + V. No Excel moderno, vá para Inserir > Tabela Dinâmica.' },
    { cat: 'excel', q: 'Qual atalho transforma dados em uma Tabela de verdade?', a: 'Ctrl + T (ou Ctrl + Alt + T dependendo da versão). É fundamental para garantir que referências aumentem dinamicamente e formatação.' },
    { cat: 'excel', q: 'O que o XLOOKUP (PROCX) faz melhor que o PROCV?', a: 'Ele procura em qualquer direção (para a esquerda ou direita), por padrão traz correspondência exata e já possui tratamento de erro nativo via "if_not_found".' },

    { cat: 'powerbi', q: 'O que é um Star Schema (Esquema Estrela)?', a: 'Modelo dimensional em que uma "Tabela Fato" (dados quantitativos, transações) fica no centro conectada a "Tabelas Dimensão" (entidades descritivas, datas).' },
    { cat: 'powerbi', q: 'O que é DAX?', a: 'Data Analysis Expressions. É a linguagem de fórmula usada em Power BI para criar Medidas e Colunas Calculadas.' },
    { cat: 'powerbi', q: 'Diferença entre CALCULATE e FILTER?', a: 'CALCULATE é a função mais poderosa que altera o Contexto de Filtro de uma expressão. FILTER itera linha a linha sobre uma tabela e retorna dados limitados pela condição.' },
    { cat: 'powerbi', q: 'Para que criar uma Tabela Calendário?', a: 'Para poder usar as funções de "Time Intelligence" (Inteligência de Tempo) como TOTALYTD (acumulado do ano) ou SAMEPERIODLASTYEAR.' },

    { cat: 'sql', q: 'Qual a principal diferença entre WHERE e HAVING?', a: 'WHERE filtra as linhas da tabela original antes do agrupamento (GROUP BY). HAVING filtra o resultado após as agregações do GROUP BY (ex: HAVING SUM(valor) > 100).' },
    { cat: 'sql', q: 'Diferença entre LEFT JOIN e INNER JOIN?', a: 'INNER JOIN só traz o que tem match (correspondência) nas 2 tabelas. LEFT JOIN traz TODOS da tabela da esquerda, mesmo se não existir do lado direito (trazendo NULL lá).' },
    { cat: 'sql', q: 'Qual a ordem correta estrutural de uma Query (ordem escrita)?', a: 'SELECT > FROM > JOINs > WHERE > GROUP BY > HAVING > ORDER BY > LIMIT' },
    { cat: 'sql', q: 'Como extrair nomes únicos, que não se repetem, do banco?', a: 'Usando o comando DISTINCT logo após o SELECT. Ex: SELECT DISTINCT nome FROM clientes;' }
];

function initFlashcards() {
    const grid = document.getElementById('flashcardsGrid');
    const filters = document.querySelectorAll('.fc-filter');
    if (!grid) return;

    function renderCards(filterCat) {
        grid.innerHTML = '';
        const cards = filterCat === 'all'
            ? FLASHCARDS_DATA
            : FLASHCARDS_DATA.filter(c => c.cat === filterCat);

        cards.forEach(card => {
            const el = document.createElement('div');
            el.className = 'flashcard';

            let labelBadge = '';
            if (card.cat === 'excel') labelBadge = '📗 EXCEL';
            if (card.cat === 'powerbi') labelBadge = '📊 POWER BI';
            if (card.cat === 'sql') labelBadge = '🗄️ SQL';

            el.innerHTML = `
                <div class="fc-inner">
                    <div class="fc-front">
                        <span class="fc-badge">${labelBadge}</span>
                        <h3>${card.q}</h3>
                    </div>
                    <div class="fc-back">
                        ${card.a}
                    </div>
                </div>
            `;
            el.addEventListener('click', () => {
                el.classList.toggle('flipped');
            });
            grid.appendChild(el);
        });
    }

    renderCards('all');

    filters.forEach(f => {
        f.addEventListener('click', () => {
            filters.forEach(btn => btn.classList.remove('active'));
            f.classList.add('active');
            renderCards(f.dataset.filter);
        });
    });
}

// ===== FIX VIDEO EMBEDS =====
function fixVideoEmbeds() {
    document.querySelectorAll('.video-item').forEach(item => {
        const iframe = item.querySelector('iframe');
        const wrapper = item.querySelector('.video-wrapper');
        if (iframe && wrapper) {
            const src = iframe.getAttribute('src');
            if (src && src.includes('youtube.com/embed/')) {
                const videoId = src.split('/').pop().split('?')[0];
                const watchUrl = `https://www.youtube.com/watch?v=${videoId}`;

                // Remove iframe
                iframe.remove();

                // Create thumbnail
                const img = document.createElement('img');
                img.src = `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
                img.style.position = 'absolute';
                img.style.top = '0';
                img.style.left = '0';
                img.style.width = '100%';
                img.style.height = '100%';
                img.style.objectFit = 'cover';

                // Create play button overlay
                const playBtn = document.createElement('div');
                playBtn.innerHTML = '▶';
                playBtn.style.position = 'absolute';
                playBtn.style.top = '50%';
                playBtn.style.left = '50%';
                playBtn.style.transform = 'translate(-50%, -50%)';
                playBtn.style.backgroundColor = 'rgba(239, 68, 68, 0.9)';
                playBtn.style.color = 'white';
                playBtn.style.width = '60px';
                playBtn.style.height = '40px';
                playBtn.style.borderRadius = '10px';
                playBtn.style.display = 'flex';
                playBtn.style.alignItems = 'center';
                playBtn.style.justifyContent = 'center';
                playBtn.style.fontSize = '20px';
                playBtn.style.boxShadow = '0 4px 14px rgba(0,0,0,0.4)';
                playBtn.style.transition = 'background-color 0.2s';

                wrapper.appendChild(img);
                wrapper.appendChild(playBtn);

                // Make item clickable
                item.style.cursor = 'pointer';
                item.addEventListener('click', () => {
                    window.open(watchUrl, '_blank');
                });

                // Hover effect
                item.addEventListener('mouseenter', () => playBtn.style.backgroundColor = '#f87171');
                item.addEventListener('mouseleave', () => playBtn.style.backgroundColor = 'rgba(239, 68, 68, 0.9)');
            }
        }
    });
}
