// ===== DATA STORE =====
const STORAGE_KEY = 'datapath_pro_progress';
const STREAK_KEY = 'datapath_pro_streak';

function loadProgress() {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : {};
}

function saveProgress(progress) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
}

// ===== NAVIGATION =====
let luckysheetInitialized = false;

function initNavigation() {
    const navItems = document.querySelectorAll('.nav-item');
    const sections = document.querySelectorAll('.content-section');

    function activateTab(target) {
        navItems.forEach(n => n.classList.remove('active'));
        const activeNav = document.querySelector(`.nav-item[data-target="${target}"]`);
        if (activeNav) activeNav.classList.add('active');

        sections.forEach(s => {
            s.classList.remove('active');
            s.style.animation = 'none';
        });
        const targetSection = document.getElementById(target);
        if (targetSection) {
            targetSection.classList.add('active');
            // trigger reflow
            void targetSection.offsetWidth;
            targetSection.style.animation = 'fadeUp 0.4s ease forwards';
        }

        if (target === 'sim-excel' && !luckysheetInitialized) {
            setTimeout(initLuckySheet, 100);
        }
    }

    const savedTab = localStorage.getItem('datapath_pro_tab') || 'dashboard';
    activateTab(savedTab);

    navItems.forEach(item => {
        item.addEventListener('click', () => {
            const target = item.dataset.target;
            activateTab(target);
            localStorage.setItem('datapath_pro_tab', target);
        });
    });
}

function initLuckySheet() {
    if (typeof luckysheet !== 'undefined' && !luckysheetInitialized) {
        luckysheet.create({
            container: 'luckysheet-container',
            lang: 'en',
            showinfobar: false,
            showsheetbar: true,
            data: [{
                "name": "Prática Excel",
                    "celldata": [
                        {r:1, c:0, v:{v:"--- PRODUTOS (Matriz) ---", m:"--- PRODUTOS (Matriz) ---", bl:1}},
                        {r:2, c:0, v:{v:"CÓDIGO", m:"CÓDIGO", bl:1, bg:"#f1f5f9"}},
                        {r:2, c:1, v:{v:"NOME", m:"NOME", bl:1, bg:"#f1f5f9"}},
                        {r:2, c:2, v:{v:"PREÇO", m:"PREÇO", bl:1, bg:"#f1f5f9"}},
                        {r:3, c:0, v:{v:"1001", m:"1001"}}, {r:3, c:1, v:{v:"Cadeira Plus", m:"Cadeira Plus"}}, {r:3, c:2, v:{v:"850.00", m:"850.00"}},
                        {r:4, c:0, v:{v:"1002", m:"1002"}}, {r:4, c:1, v:{v:"Mesa Office", m:"Mesa Office"}}, {r:4, c:2, v:{v:"1200.00", m:"1200.00"}},
                        {r:5, c:0, v:{v:"1003", m:"1003"}}, {r:5, c:1, v:{v:"Luminária", m:"Luminária"}}, {r:5, c:2, v:{v:"150.00", m:"150.00"}},
                        
                        {r:7, c:0, v:{v:"--- EXERCÍCIO PRÁTICO ---", m:"--- EXERCÍCIO PRÁTICO ---", bl:1}},
                        {r:8, c:0, v:{v:"CÓD. BUSCADO:", m:"CÓD. BUSCADO:", bl:1}},
                        {r:8, c:1, v:{v:1002, m:"1002", bg:"#fef08a"}},
                        {r:9, c:0, v:{v:"QUAL O PREÇO?", m:"QUAL O PREÇO?", bl:1}},
                        {r:9, c:1, v:{v:"", m:"", bg:"#e0e7ff"}},

                        {r:11, c:0, v:{v:"💡 Missão Diária:", m:"💡 Missão Diária:", bl:1, fc:"#ca8a04"}},
                        {r:12, c:0, v:{v:"1. Clique na célula azul B10 (ao lado de 'QUAL O PREÇO?').", m:"1. Clique na célula azul B10 (ao lado de 'QUAL O PREÇO?').", fc:"#64748b"}},
                        {r:13, c:0, v:{v:"2. Escreva a fórmula para extrair o preço baseando-se no Código 1002.", m:"2. Escreva a fórmula para extrair o preço baseando-se no Código 1002.", fc:"#64748b"}},
                        {r:14, c:0, v:{v:"3. Lembrete: O motor do emulador está em inglês, use =VLOOKUP em vez de PROCV.", m:"3. Lembrete: O motor do emulador está em inglês, use =VLOOKUP em vez de PROCV.", fc:"#64748b"}},
                        {r:15, c:0, v:{v:"Exemplo Real: =VLOOKUP(B9, A3:C6, 3, 0)", m:"Exemplo Real: =VLOOKUP(B9, A3:C6, 3, 0)", fc:"#64748b"}}
                    ],
                "config": {
                    "columnlen": {
                        "0": 380,
                        "1": 150,
                        "2": 150
                    }
                },
                "index": 0
            }]
        });
        luckysheetInitialized = true;
    }
}

// ===== CHECKBOX & PROGRESS LOGIC =====
function initCheckboxes() {
    const progress = loadProgress();
    const checkboxes = document.querySelectorAll('input[type="checkbox"][data-task]');

    checkboxes.forEach(cb => {
        const taskItem = cb.closest('.task-item');
        const task = cb.dataset.task;

        if (progress[task]) {
            cb.checked = true;
            taskItem.classList.add('completed');
        }

        taskItem.addEventListener('click', (e) => {
            cb.checked = !cb.checked;
            
            const currentProgress = loadProgress();
            currentProgress[task] = cb.checked;
            if (!cb.checked) delete currentProgress[task];
            saveProgress(currentProgress);
            
            if (cb.checked) {
                taskItem.classList.add('completed');
            } else {
                taskItem.classList.remove('completed');
            }
            updateStats();
        });
    });
}

function updateStats() {
    const progress = loadProgress();
    const allTasks = document.querySelectorAll('input[data-task]');
    const totalDone = Object.keys(progress).filter(k => progress[k]).length;
    const totalAll = allTasks.length;
    
    // Overall %
    const percentage = totalAll > 0 ? Math.round((totalDone / totalAll) * 100) : 0;
    const statProg = document.getElementById('stat-progress');
    if(statProg) statProg.textContent = `${percentage}%`;

    // Badges
    const categories = ['ex', 'pb', 'sq'];
    categories.forEach(cat => {
        const catTasks = document.querySelectorAll(`input[data-task^="${cat}"]`);
        const catDone = Array.from(catTasks).filter(cb => progress[cb.dataset.task]).length;
        const badge = document.getElementById(`badge-${cat === 'ex' ? 'excel' : cat === 'pb' ? 'powerbi' : 'sql'}`);
        if(badge) badge.textContent = `${catDone}/${catTasks.length}`;
    });

    // Sub-progress bars
    document.querySelectorAll('.progress-fill').forEach(fill => fill.style.width = `${percentage}%`);
}

// ===== STREAK =====
function updateStreak() {
    let streak = localStorage.getItem(STREAK_KEY);
    streak = streak ? JSON.parse(streak) : { count: 0, lastDate: null };
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
        localStorage.setItem(STREAK_KEY, JSON.stringify(streak));
    }
    
    const sEl = document.getElementById('stat-streak');
    if(sEl) sEl.textContent = streak.count;
}

// ===== FLOATING WIDGETS =====
function initWidgets() {
    const dockBtns = document.querySelectorAll('.dock-btn');
    const closeBtns = document.querySelectorAll('.close-widget');

    dockBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const widgetId = btn.id.replace('dock-', 'widget-');
            const widget = document.getElementById(widgetId);
            const isOpen = widget.classList.contains('open');

            // Close all
            document.querySelectorAll('.tool-widget').forEach(w => w.classList.remove('open'));
            dockBtns.forEach(b => b.classList.remove('active'));

            if (!isOpen) {
                widget.classList.add('open');
                btn.classList.add('active');
            }
        });
    });

    closeBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const widgetId = btn.dataset.close;
            document.getElementById(widgetId).classList.remove('open');
            document.querySelectorAll('.dock-btn').forEach(b => b.classList.remove('active'));
        });
    });

    // Notes auto-save
    const notes = document.getElementById('quickNotes');
    if (notes) {
        notes.value = localStorage.getItem('datapath_pro_notes') || '';
        let timeout;
        notes.addEventListener('input', () => {
            clearTimeout(timeout);
            timeout = setTimeout(() => {
                localStorage.setItem('datapath_pro_notes', notes.value);
            }, 500);
        });
    }

    // Pomodoro logic
    let pomoTime = 25 * 60;
    let timer = null;
    let isRunning = false;
    let isBreak = false;
    
    const pDisplay = document.getElementById('pomodoroTime');
    const pStart = document.getElementById('pomoStart');
    const pBreak = document.getElementById('pomoBreak');
    const pReset = document.getElementById('pomoReset');

    function updatePomo() {
        const m = Math.floor(pomoTime / 60).toString().padStart(2, '0');
        const s = (pomoTime % 60).toString().padStart(2, '0');
        if(pDisplay) pDisplay.textContent = `${m}:${s}`;
        document.title = isRunning ? `(${m}:${s}) Foco` : 'Plataforma Premium — Analista de Dados';
    }

    if(pStart) pStart.addEventListener('click', () => {
        if(isRunning) return;
        isRunning = true;
        isBreak = false;
        if(pomoTime === 5*60) pomoTime = 25*60;
        updatePomo();
        timer = setInterval(() => {
            pomoTime--;
            updatePomo();
            if(pomoTime <= 0) {
                alert("Tempo Esgotado! Descanse.");
                clearInterval(timer); isRunning = false;
            }
        }, 1000);
    });

    if(pBreak) pBreak.addEventListener('click', () => {
        clearInterval(timer);
        isRunning = true; isBreak = true;
        pomoTime = 5*60; updatePomo();
        timer = setInterval(() => {
            pomoTime--; updatePomo();
            if(pomoTime <= 0) {
                alert("Pausa Concluída! Hora de focar.");
                clearInterval(timer); isRunning = false;
            }
        }, 1000);
    });

    if(pReset) pReset.addEventListener('click', () => {
        clearInterval(timer);
        isRunning = false; isBreak = false;
        pomoTime = 25*60; updatePomo();
    });

    // Neural Audio V2 simpler fallback (Web Audio API)
    let ctx, brownNode, gammaOsc, gammaGain, masterGain;
    let brownPlaying = false;
    let gammaPlaying = false;
    
    function initAudio() {
        if(!ctx) {
            const AudioContext = window.AudioContext || window.webkitAudioContext;
            ctx = new AudioContext();
            masterGain = ctx.createGain();
            masterGain.connect(ctx.destination);
        }
    }

    // Simplified Brown Noise
    const btnBrown = document.getElementById('toggleBrownNoise');
    const volBrown = document.getElementById('brownVolume');
    if(btnBrown) {
        btnBrown.addEventListener('click', () => {
            initAudio();
            if(!brownPlaying) {
                const bufferSize = 4096;
                brownNode = ctx.createScriptProcessor(bufferSize, 1, 1);
                let lastOut = 0;
                brownNode.onaudioprocess = function(e) {
                    let output = e.outputBuffer.getChannelData(0);
                    for (let i = 0; i < bufferSize; i++) {
                        let white = Math.random() * 2 - 1;
                        output[i] = (lastOut + (0.02 * white)) / 1.02;
                        lastOut = output[i];
                        output[i] *= 3.5;
                    }
                }
                const bGain = ctx.createGain();
                bGain.gain.value = volBrown.value / 100;
                brownNode.connect(bGain);
                bGain.connect(masterGain);
                
                volBrown.oninput = () => bGain.gain.value = volBrown.value / 100;
                
                brownPlaying = true;
                btnBrown.style.background = 'rgba(139, 92, 246, 0.2)';
                btnBrown.style.color = '#fff';
            } else {
                brownNode.disconnect();
                brownPlaying = false;
                btnBrown.style.background = '';
                btnBrown.style.color = 'var(--purple)';
            }
        });
    }

    const btnGamma = document.getElementById('toggleGammaWave');
    if(btnGamma) {
        btnGamma.addEventListener('click', () => {
            initAudio();
            if(!gammaPlaying) {
                gammaOsc = ctx.createOscillator();
                gammaOsc.type = 'sine';
                gammaOsc.frequency.value = 200; // Carrier
                
                const mod = ctx.createOscillator();
                mod.type = 'square';
                mod.frequency.value = 40; // Gamma 40Hz
                
                gammaGain = ctx.createGain();
                gammaGain.gain.value = 0.5; // Default vol
                
                mod.connect(gammaGain.gain);
                gammaOsc.connect(gammaGain);
                gammaGain.connect(masterGain);
                
                mod.start();
                gammaOsc.start();
                
                gammaPlaying = true;
                btnGamma.style.background = 'rgba(59, 130, 246, 0.2)';
                btnGamma.style.color = '#fff';
            } else {
                gammaOsc.stop();
                gammaOsc.disconnect();
                gammaPlaying = false;
                btnGamma.style.background = '';
                btnGamma.style.color = 'var(--text-accent)';
            }
        });
    }
}

// ===== LINKEDIN PITCH COPY =====
function initLinkedInPitch() {
    const pitches = {
        varejo: "🚀 Mais um projeto de Data Analytics finalizado com sucesso!\n\nHoje estruturei um Pipeline End-to-End para o varejo brasileiro (Dataset Olist), criando um modelo Star Schema otimizado e painéis interativos no Power BI.\n\nPrincipais entregáveis:\n✔️ Modelagem ETL eficiente com Power Query\n✔️ Medidas DAX complexas focadas em rentabilidade\n✔️ Data Storytelling geo-espacial focado na tomada de decisão\n\nPronto para o próximo desafio na área de Inteligência de Negócios! 📊💡\n#DataAnalytics #PowerBI #BusinessIntelligence #SQL",
        
        logistica: "🚀 Resolvendo gargalos reais com Dados!\n\nConcluí mapeamento de atrasos logísticos utilizando SQL Avançado. Problemas de SLA afetam o cliente e as margens, e neste projeto, construí queries robustas para varrer milhares de entregas e identificar padrões de falhas.\n\nTécnicas aplicadas:\n✔️ CTEs e JOINs complexos para cruzamento de Fato/Dimensão\n✔️ Funções de DATEDIFF e CASE WHEN para categorizar penalidades\n✔️ Insights visuais acionáveis para roteirização e otimização da frota.\n\nEm busca de transformar dados em resultados práticos e redução de custos! 📦✅\n#SQL #Logistics #DataAnalysis #Tech",
        
        churn: "🚀 Focado na dor número um de modelos de assinatura: Churn e Retenção!\n\nNo meu mais novo portfólio prático, desenhei um estudo Ad-hoc visando antever quebras contratuais (Cancelamentos) a partir do comportamento de navegação e pagamentos.\n\nDestaques técnicos:\n✔️ Matrizes de correlação e segmentação exploratória\n✔️ Tradução de métricas em Actionable Insights (Storytelling direcionado aos gerentes)\n\nA verdadeira utilidade do analista não é só puxar a tela bonita, mas salvar receita. 💰📈\n#DataAnalysis #Strategy #Retention #Analytics"
    };

    document.querySelectorAll('.copy-linkedin-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const text = pitches[btn.dataset.proj];
            navigator.clipboard.writeText(text).then(() => {
                const old = btn.textContent;
                btn.textContent = "✅ Texto Copiado!";
                btn.style.color = "var(--success)";
                setTimeout(() => {
                    btn.textContent = old;
                    btn.style.color = "";
                }, 2000);
            });
        });
    });
}

// ===== SQL JS TERMINAL =====
let sqlDb = null;
function initSQLSimulator() {
    const config = {
        locateFile: filename => `https://cdnjs.cloudflare.com/ajax/libs/sql.js/1.8.0/${filename}`
    };

    if (typeof SQL === 'undefined') {
        document.getElementById('sqlTerminalOutput').innerHTML = '<div style="color:var(--danger)">Erro: SQL.js não carregou da internet.</div>';
    } else {
        SQL.initSqlJs(config).then(function (initSQL) {
            sqlDb = new initSQL.Database();
            loadDefaultSchema();
        });
    }

    const btnRun = document.getElementById('btnRunSql');
    const btnReset = document.getElementById('btnResetSqlDbs');
    const sqlInput = document.getElementById('sqlTerminalInput');

    if(btnRun) btnRun.addEventListener('click', () => {
        executeSql(sqlInput.value);
    });

    if(btnReset) btnReset.addEventListener('click', () => {
        loadDefaultSchema();
        document.getElementById('sqlTerminalOutput').innerHTML = '<div style="color:var(--success)">Banco resetado com as tabelas originais!</div>';
    });
}

function loadDefaultSchema() {
    if (!sqlDb) return;
    const schema = `
        CREATE TABLE clientes (id_cliente INT, nome TEXT, estado TEXT);
        INSERT INTO clientes VALUES (1, 'Ana Souza', 'SP'), (2, 'Carlos Lima', 'RJ'), (3, 'Maria Silva', 'MG'), (4, 'João Pedro', 'SP');

        CREATE TABLE produtos (id_produto INT, produto TEXT, categoria TEXT, preco REAL);
        INSERT INTO produtos VALUES (10, 'Notebook', 'Tech', 3500.00), (11, 'Mouse', 'Tech', 150.00), (12, 'Cadeira', 'Moveis', 850.00);

        CREATE TABLE vendas (id_venda INT, id_cliente INT, id_produto INT, quantidade INT, data_venda TEXT);
        INSERT INTO vendas VALUES (100, 1, 10, 1, '2026-03-01'), (101, 1, 11, 2, '2026-03-02'), (102, 2, 12, 1, '2026-03-02'), (103, 3, 10, 1, '2026-03-03');
    `;
    try {
        sqlDb.exec("DROP TABLE IF EXISTS vendas; DROP TABLE IF EXISTS produtos; DROP TABLE IF EXISTS clientes;");
        sqlDb.exec(schema);
    } catch(e) {
        console.error("Erro reset database: ", e);
    }
}

function executeSql(query) {
    if (!sqlDb) {
        alert("O banco local ainda está carregando...");
        return;
    }
    const outputDiv = document.getElementById('sqlTerminalOutput');
    
    // Support multiple statements
    let resultHTML = "";
    try {
        const results = sqlDb.exec(query);
        
        if (results.length === 0) {
            outputDiv.innerHTML = '<div style="color:var(--text-muted)">Query executada com sucesso. Nenhuma linha retornada.</div>';
            return;
        }

        results.forEach(res => {
            const columns = res.columns;
            const values = res.values;
            
            let table = '<table><thead><tr>';
            columns.forEach(col => table += `<th>${col}</th>`);
            table += '</tr></thead><tbody>';
            
            values.forEach(row => {
                table += '<tr>';
                row.forEach(val => table += `<td>${val !== null ? val : '<em>null</em>'}</td>`);
                table += '</tr>';
            });
            table += '</tbody></table>';
            
            resultHTML += table + '<br>';
        });
        
        outputDiv.innerHTML = resultHTML;
    } catch (e) {
        outputDiv.innerHTML = `<div style="color:var(--danger); padding:10px; background:rgba(239,68,68,0.1); border-radius:4px;"><b>Erro SQL:</b><br>${e.message}</div>`;
    }
}

// ===== INIT =====
document.addEventListener('DOMContentLoaded', () => {
    initNavigation();
    initCheckboxes();
    updateStats();
    updateStreak();
    initWidgets();
    initLinkedInPitch();
    initSQLSimulator();
});
