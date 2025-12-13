// =============================================================
//  军师小剧场 V4.0 - 绝对显形版
// =============================================================

(function() {
    console.log("🚀 军师插件 V4.0 正在强行注入...");

    const BUTTON_ID = 'st-junshi-btn-v4';
    const PANEL_ID = 'st-junshi-panel-v4';

    // 1. 注入 CSS (直接写在JS里，防止CSS文件加载失败)
    const style = document.createElement('style');
    style.innerHTML = `
        /* 强制置顶的悬浮球 */
        #${BUTTON_ID} {
            position: fixed !important;
            top: 10px !important;       /* 改到左上角 */
            left: 10px !important;
            width: 50px;
            height: 50px;
            background: rgba(0, 0, 0, 0.9);
            border: 3px solid #00e6ff;  /* 亮蓝色边框 */
            border-radius: 50%;
            color: #00e6ff;
            display: flex;
            justify-content: center;
            align-items: center;
            font-size: 24px;
            font-weight: bold;
            cursor: pointer;
            z-index: 2147483647 !important; /* 浏览器允许的最大层级 */
            box-shadow: 0 0 20px #00e6ff;
            user-select: none;
            transition: transform 0.2s;
        }
        #${BUTTON_ID}:hover { transform: scale(1.1); background: #00e6ff; color: black; }

        /* 面板样式 */
        #${PANEL_ID} {
            position: fixed !important;
            top: 70px !important;
            left: 10px !important;
            width: 300px;
            background: rgba(20, 20, 25, 0.98);
            border: 2px solid #00e6ff;
            border-radius: 12px;
            padding: 15px;
            display: none;
            flex-direction: column;
            gap: 10px;
            z-index: 2147483647 !important;
            box-shadow: 0 0 30px rgba(0,0,0,0.8);
            color: #eee;
            max-height: 80vh;
            overflow-y: auto;
        }
        
        .st-btn {
            background: #333; color: #fff; border: 1px solid #555;
            padding: 8px; border-radius: 5px; cursor: pointer; width: 100%; margin-top: 5px;
        }
        .st-btn:hover { border-color: #00e6ff; color: #00e6ff; }
        textarea.st-input {
            width: 100%; height: 80px; background: #111; color: #fff; 
            border: 1px solid #444; border-radius: 5px; padding: 5px;
        }
    `;
    document.head.appendChild(style);

    // 2. 渲染 UI 函数
    function renderUI() {
        if (document.getElementById(BUTTON_ID)) return; // 已经有了就不加了

        // 创建按钮
        const btn = document.createElement('div');
        btn.id = BUTTON_ID;
        btn.innerHTML = '📜';
        btn.title = "军师小剧场";
        document.body.appendChild(btn);

        // 创建面板
        const panel = document.createElement('div');
        panel.id = PANEL_ID;
        panel.innerHTML = `
            <div style="display:flex; justify-content:space-between; color:#00e6ff; font-weight:bold; border-bottom:1px solid #444; padding-bottom:5px;">
                <span>🤖 军师锦囊</span>
                <span style="cursor:pointer;" onclick="document.getElementById('${PANEL_ID}').style.display='none'">❌</span>
            </div>
            
            <div style="font-size:12px; color:#aaa; margin-top:5px;">输入要求 (留空则随机):</div>
            <textarea id="st-prompt-input" class="st-input" placeholder="例如: 写一段心理描写..."></textarea>
            
            <button class="st-btn" id="st-gen-action" style="background:#005f73; border-color:#00e6ff;">✨ 生成小剧场</button>
            <button class="st-btn" id="st-toggle-screen">🔲 全屏沉浸</button>
            
            <div id="st-output" style="display:none; margin-top:10px; border-top:1px dashed #555; padding-top:10px; font-size:12px; line-height:1.5;"></div>
        `;
        document.body.appendChild(panel);

        // 绑定点击事件
        btn.addEventListener('click', () => {
            const p = document.getElementById(PANEL_ID);
            p.style.display = (p.style.display === 'none' || p.style.display === '') ? 'flex' : 'none';
        });

        document.getElementById('st-toggle-screen').addEventListener('click', () => {
            if (!document.fullscreenElement) document.documentElement.requestFullscreen().catch(()=>{});
            else document.exitFullscreen().catch(()=>{});
        });

        // 绑定生成逻辑
        document.getElementById('st-gen-action').addEventListener('click', async () => {
            const btn = document.getElementById('st-gen-action');
            const output = document.getElementById('st-output');
            const req = document.getElementById('st-prompt-input').value;

            // 检查酒馆核心
            if (typeof SillyTavern === 'undefined') {
                alert("❌ 酒馆核心未加载，请刷新页面再试。");
                return;
            }

            btn.innerText = "⏳ 军师思考中...";
            try {
                const context = SillyTavern.getContext();
                const charName = context.characters[context.characterId].name;
                const prompt = `[Write a scene for ${charName}. User Request: ${req}]`;
                
                const result = await SillyTavern.generateRaw(prompt, "junshi_v4");
                
                output.style.display = 'block';
                output.innerText = result;
            } catch(e) {
                output.style.display = 'block';
                output.innerText = "❌ 生成失败: " + e;
            } finally {
                btn.innerText = "✨ 生成小剧场";
            }
        });
    }

    // 3. 注册 Slash 命令 (备用方案)
    const registerCommand = () => {
        if (window.SillyTavern && SillyTavern.registerSlashCommand) {
            SillyTavern.registerSlashCommand("junshi", () => {
                const p = document.getElementById(PANEL_ID);
                if(p) p.style.display = 'flex';
                return "🤖 面板已打开";
            }, [], "打开军师面板", true, true);
        } else {
            setTimeout(registerCommand, 1000);
        }
    };

    // 4. 🔥 强力保活机制 (每2秒检查一次，没了就重画)
    setInterval(renderUI, 2000);
    
    // 立即执行
    renderUI();
    registerCommand();

})();
