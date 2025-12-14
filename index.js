// =============================================================
//  军师百宝箱 (TreasureBox) - V19.0 开发者版
//  修复：发送按钮丢失问题 | 新增：自定义API接口区域
// =============================================================

(function() {
    console.log("🚀 军师百宝箱 V19.0 已加载...");

    // === 0. ID & 变量定义 ===
    const FLOAT_BTN_ID = 'jb-plugin-btn-v19';
    const MENU_BOX_ID  = 'jb-plugin-menu-v19';
    const THEATER_ID   = 'jb-plugin-theater-v19';
    
    // 内存变量
    let currentEntries = [];
    const STORAGE_KEY_FAV = 'jb_plugin_favs_v19';

    // 👇👇👇👇👇👇👇👇👇👇👇👇👇👇👇👇👇👇👇👇👇👇👇👇
    // 🔧 自定义 API 设置区 (你想手动加API就在这里改)
    // 👆👆👆👆👆👆👆👆👆👆👆👆👆👆👆👆👆👆👆👆👆👆👆👆
    
    // 如果你想手动连接某个酒馆地址，可以在这里填完整 URL
    // 例如: "http://127.0.0.1:8000/api/worldinfo/get"
    // 留空 "" 则默认使用相对路径 (自动适配当前网页)
    const CUSTOM_API_URL = ""; 

    // 获取 CSRF Token (安全令牌)，防止被拦截
    function getCsrfToken() {
        if (window.csrfToken) return window.csrfToken;
        const match = document.cookie.match(new RegExp('(^| )X-CSRF-Token=([^;]+)'));
        return match ? match[2] : '';
    }
    // ---------------------------------------------------


    // === 1. 注入 CSS (优化布局，防止按钮消失) ===
    const style = document.createElement('style');
    style.innerHTML = `
        .jb-fixed-top { position: fixed !important; z-index: 2147483647 !important; }
        .jb-draggable-header { cursor: move; user-select: none; }

        /* 悬浮球 */
        #${FLOAT_BTN_ID} {
            top: 20px !important; left: 20px !important;
            width: 55px; height: 55px;
            background: #fff; border: 3px solid #74b9ff; border-radius: 50%;
            color: #74b9ff; display: flex; justify-content: center; align-items: center;
            font-size: 26px; cursor: move;
            box-shadow: 0 5px 15px rgba(116, 185, 255, 0.6);
            transition: transform 0.1s;
        }
        #${FLOAT_BTN_ID}:active { transform: scale(0.95); }

        /* 面板外壳 */
        .jb-panel {
            width: 340px; height: 580px; /* 稍微加高一点 */
            min-width: 280px; min-height: 400px;
            background: #fff; border: 3px solid #74b9ff; border-radius: 15px;
            box-shadow: 0 10px 40px rgba(0,0,0,0.4);
            display: none; flex-direction: column;
            font-family: "Microsoft YaHei", sans-serif;
            resize: both !important; overflow: hidden !important;
        }

        /* 标题栏 */
        .jb-header {
            background: #74b9ff; color: white; padding: 12px 15px;
            font-weight: bold; font-size: 15px;
            display: flex; justify-content: space-between; align-items: center;
            flex-shrink: 0; /* 防止被挤压 */
        }

        /* 主菜单 */
        .jb-grid {
            padding: 20px; display: grid; grid-template-columns: 1fr 1fr; gap: 15px;
            overflow-y: auto; background: #fffbf0; flex: 1;
        }
        .jb-menu-card {
            background: #fff; border: 2px solid #ffeaa7; border-radius: 12px;
            height: 100px; display: flex; flex-direction: column;
            justify-content: center; align-items: center; gap: 8px;
            cursor: pointer; transition: all 0.2s; color: #e67e22;
            box-shadow: 0 2px 5px rgba(0,0,0,0.05);
        }
        .jb-menu-card:hover { transform: translateY(-3px); border-color: #74b9ff; color: #74b9ff; }

        /* 工具栏 */
        .jb-toolbar {
            padding: 10px; background: #fffbf0; border-bottom: 1px solid #ffeaa7;
            display: flex; flex-direction: column; gap: 8px; flex-shrink: 0;
        }
        .jb-btn-group { display: flex; gap: 5px; }
        .jb-btn-action {
            flex: 1; border: 1px solid #ffeaa7; border-radius: 5px; 
            padding: 8px; font-size: 12px; cursor: pointer; font-weight: bold;
            background: #fff; color: #555;
        }
        .jb-btn-action:hover { background: #fff7d1; color: #e67e22; }
        
        /* 内容区 */
        #jb-chat-area { 
            flex: 1; overflow-y: auto; padding: 10px; background: #fffdf5; 
            min-height: 100px; /* 保证最小高度 */
        }
        .jb-bubble {
            background: #fff; border: 1px solid #b2ebf2; border-radius: 12px;
            padding: 12px; margin-bottom: 10px; box-shadow: 0 2px 5px rgba(0,0,0,0.03);
            font-size: 13px; color: #555; position: relative;
        }
        
        /* 底部 (关键修改：防止按钮消失) */
        .jb-footer {
            padding: 12px; background: #fff; border-top: 1px solid #eee;
            display: flex; flex-direction: column; gap: 10px;
            flex-shrink: 0; /* 禁止被压缩 */
        }
        #jb-select {
            width: 100%; padding: 8px; border: 2px solid #74b9ff; border-radius: 8px;
            background: #f0f9ff; color: #0984e3; font-size: 12px; font-weight: bold; outline: none;
        }
        
        /* 输入框样式 */
        #jb-input { 
            width: 100%; border: 1px solid #ddd; border-radius: 8px; padding: 8px; 
            font-size: 13px; outline: none; background: #fafafa; margin-bottom: 5px;
        }
        
        /* 🔥 生成按钮：大绿按钮 */
        #jb-send { 
            width: 100%; background: #00b894; color: white; border: none; 
            border-radius: 8px; padding: 10px; cursor: pointer; 
            font-weight: bold; font-size: 14px; letter-spacing: 2px;
            transition: background 0.2s;
        }
        #jb-send:hover { background: #019e7e; }
        
        /* 折叠模式 */
        .jb-panel.collapsed { height: 45px !important; resize: none !important; }
        .jb-panel.collapsed > *:not(.jb-header) { display: none !important; }
    `;
    document.head.appendChild(style);


    // ================= 2. 核心逻辑：本地解析 + 手动API预留 =================
    
    // 通用解析器
    function parseAndLoad(entriesSource, sourceName) {
        let rawEntries = [];
        if (entriesSource.entries) {
            if (Array.isArray(entriesSource.entries)) rawEntries = entriesSource.entries;
            else rawEntries = Object.values(entriesSource.entries);
        } else if (Array.isArray(entriesSource)) {
            rawEntries = entriesSource;
        } else {
            rawEntries = Object.values(entriesSource);
        }

        const cleanEntries = [];
        rawEntries.forEach((e, idx) => {
            if (!e || typeof e !== 'object') return;
            const content = e.content || e.prompt || "";
            if (!content.trim()) return;

            let name = e.comment;
            if (!name && e.key) name = Array.isArray(e.key) ? e.key[0] : e.key;
            if (!name) name = `样式 #${idx + 1}`;

            cleanEntries.push({ name, content });
        });

        if (cleanEntries.length === 0) {
            alert("⚠️ 未找到有效内容！"); return;
        }

        currentEntries = cleanEntries;
        updateUI(sourceName);
    }

    // 📂 方式 A: 文件导入
    function handleFileImport(file) {
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const json = JSON.parse(e.target.result);
                parseAndLoad(json, file.name.replace(/\.json$/i, ''));
            } catch (err) { alert("❌ 解析失败: " + err); }
        };
        reader.readAsText(file);
    }

    // 💾 方式 B: 读取当前挂载
    function handleReadActive() {
        if (!window.SillyTavern || !SillyTavern.getContext) { alert("❌ 酒馆未就绪"); return; }
        const ctx = SillyTavern.getContext();
        if (ctx.worldInfo && ctx.worldInfo.entries) {
            const active = ctx.worldInfo.entries.filter(e => !e.disable);
            parseAndLoad(active, "当前挂载(Active)");
        } else {
            alert("⚠️ 无生效的世界书。");
        }
    }

    // 🌐 方式 C: 手动 API 读取 (预留接口)
    async function handleManualAPI() {
        // 如果你想做 API 读取功能，可以在这里写
        // 这里只是演示，目前是空的
        alert("🔧 API 功能需要在代码头部配置 CUSTOM_API_URL");
        /* const url = CUSTOM_API_URL || '/api/worldinfo/get_names';
        const res = await fetch(url, { ... });
        ... 
        */
    }

    function updateUI(title) {
        const sel = document.getElementById('jb-select');
        const st = document.getElementById('jb-status');
        st.innerText = `✅ 已载入: ${title} (${currentEntries.length}个)`;
        st.style.color = 'green';
        let html = `<option value="random">🎲 随机抽取 (默认)</option>`;
        if (currentEntries.length > 0) {
            html += `<optgroup label="📑 ${title}">`;
            currentEntries.forEach((e, idx) => {
                html += `<option value="${idx}">└─ ${e.name}</option>`;
            });
            html += `</optgroup>`;
        }
        sel.innerHTML = html;
    }


    // ================= 3. UI 构建 =================

    function createUI() {
        if (document.getElementById(FLOAT_BTN_ID)) return;

        const btn = document.createElement('div');
        btn.id = FLOAT_BTN_ID;
        btn.className = 'jb-fixed-top';
        btn.innerHTML = '📦';
        btn.title = "打开百宝箱";
        document.body.appendChild(btn);

        const menu = document.createElement('div');
        menu.id = MENU_BOX_ID;
        menu.className = 'jb-panel jb-fixed-top';
        menu.style.top = '100px'; menu.style.left = '20px';
        menu.innerHTML = `
            <div class="jb-header jb-draggable-header">
                <span>📦 军师百宝箱</span>
                <span style="cursor:pointer;font-size:20px;" onclick="document.getElementById('${MENU_BOX_ID}').style.display='none'">×</span>
            </div>
            <div class="jb-grid">
                <div class="jb-menu-card" id="btn-goto-theater">
                    <div class="jb-icon">🎬</div>
                    <div class="jb-label">小剧场模式</div>
                </div>
                <div class="jb-menu-card" onclick="alert('开发中...')">
                    <div class="jb-icon">🛠️</div>
                    <div class="jb-label">更多功能</div>
                </div>
            </div>
        `;
        document.body.appendChild(menu);

        const theater = document.createElement('div');
        theater.id = THEATER_ID;
        theater.className = 'jb-panel jb-fixed-top';
        theater.style.top = '100px'; theater.style.left = '20px';
        
        // ▼▼▼▼▼ 核心 UI 结构 ▼▼▼▼▼
        theater.innerHTML = `
            <div class="jb-header jb-draggable-header" id="theater-header">
                <span style="display:flex; align-items:center; gap:10px;">
                    <span id="btn-back-menu" style="cursor:pointer; font-size:18px;">⬅</span>
                    <span>🎬 小剧场生成器</span>
                </span>
                <span style="display:flex; gap:10px;">
                    <span id="jb-collapse" style="cursor:pointer;">▼</span>
                    <span style="cursor:pointer;font-size:20px;" onclick="document.getElementById('${THEATER_ID}').style.display='none'">×</span>
                </span>
            </div>
            
            <div class="jb-toolbar">
                <div class="jb-btn-group">
                    <input type="file" id="jb-file-input" accept=".json" style="display:none;">
                    <button class="jb-btn-action" onclick="document.getElementById('jb-file-input').click()">📂 导入文件</button>
                    <button class="jb-btn-action" id="jb-read-active">💾 读取当前</button>
                </div>
                <div id="jb-status" style="font-size:10px; color:#aaa; text-align:center;">请加载模板</div>
            </div>

            <div id="jb-chat-area">
                <div class="jb-bubble" style="background:#fff7d1; border-color:#ffeaa7;">
                    <b>👋 欢迎主公！</b><br>
                    请点击上方按钮加载模板，然后在下方生成。<br>
                    发送按钮已加大加粗，位于底部绿色区域。
                </div>
            </div>

            <div class="jb-footer">
                <select id="jb-select"></select>
                <input type="text" id="jb-input" placeholder="输入剧情要求 (可选)...">
                
                <button id="jb-send">✨ 立即生成 ✨</button>
                
                <div style="text-align:center;">
                    <a href="#" id="jb-view-fav" style="font-size:12px; color:#999; text-decoration:none;">⭐ 查看历史记录</a>
                </div>
            </div>
        `;
        document.body.appendChild(theater);

        // === 绑定事件 ===
        btn.onclick = () => {
            const m = document.getElementById(MENU_BOX_ID);
            const t = document.getElementById(THEATER_ID);
            if (t.style.display === 'flex') { t.style.display = 'none'; m.style.display = 'flex'; } 
            else { m.style.display = (m.style.display === 'flex' ? 'none' : 'flex'); }
        };
        document.getElementById('btn-goto-theater').onclick = () => {
            document.getElementById(MENU_BOX_ID).style.display = 'none';
            const t = document.getElementById(THEATER_ID);
            t.style.display = 'flex';
            const m = document.getElementById(MENU_BOX_ID);
            t.style.top = m.style.top; t.style.left = m.style.left;
        };
        document.getElementById('btn-back-menu').onclick = () => {
            document.getElementById(THEATER_ID).style.display = 'none';
            const m = document.getElementById(MENU_BOX_ID);
            m.style.display = 'flex';
            const t = document.getElementById(THEATER_ID);
            m.style.top = t.style.top; m.style.left = t.style.left;
        };

        // 功能绑定
        document.getElementById('jb-file-input').onchange = (e) => { if(e.target.files[0]) { handleFileImport(e.target.files[0]); e.target.value = ''; } };
        document.getElementById('jb-read-active').onclick = handleReadActive;
        
        document.getElementById('jb-collapse').onclick = (e) => {
            const t = document.getElementById(THEATER_ID);
            t.classList.toggle('collapsed');
            e.target.innerText = t.classList.contains('collapsed') ? '▲' : '▼';
        };

        // 生成
        document.getElementById('jb-send').onclick = async () => {
            if (currentEntries.length === 0) { alert("⚠️ 请先导入或读取模板！"); return; }
            
            const val = document.getElementById('jb-select').value;
            const req = document.getElementById('jb-input').value;
            const chat = document.getElementById('jb-chat-area');
            const btn = document.getElementById('jb-send');

            if (!window.SillyTavern) { alert("❌ 未检测到酒馆对象"); return; }

            let targetStyle = null;
            if (val === 'random') {
                const randIdx = Math.floor(Math.random() * currentEntries.length);
                targetStyle = currentEntries[randIdx];
            } else {
                targetStyle = currentEntries[parseInt(val)];
            }

            btn.innerText = "⏳ 正在生成..."; btn.disabled = true; btn.style.background = "#ccc";
            chat.innerHTML += `<div class="jb-bubble" style="color:#aaa;font-size:12px;">🎥 应用样式：${targetStyle.name}...</div>`;
            chat.scrollTop = chat.scrollHeight;

            try {
                const context = SillyTavern.getContext();
                const charName = context.characters[context.characterId].name;
                const lastMes = context.chat.length > 0 ? context.chat[context.chat.length-1].mes : "";

                const prompt = `[Instruction: Generate content strictly following the template format below.]\n[TEMPLATE STYLE]:\n${targetStyle.content}\n[CONTEXT]:\nCharacter: ${charName}\nStory: "${lastMes}"\nUser Request: "${req}"\nFill the template creatively now.`;

                const result = await SillyTavern.generateRaw(prompt, "junshi_v19");
                
                chat.innerHTML += `<div class="jb-bubble"><div style="font-size:10px; color:#74b9ff; margin-bottom:5px;">🎨 ${targetStyle.name}</div><div style="border-top:1px dashed #b2ebf2; padding-top:5px;">${result}</div><button onclick="window.jbSaveFav(this, '${targetStyle.name}')" style="margin-top:5px; width:100%; border:1px solid #eee; background:#fff; cursor:pointer;">❤️ 收藏</button></div>`;
                chat.scrollTop = chat.scrollHeight;

            } catch(e) { chat.innerHTML += `<div style="color:red;">❌ 生成失败: ${e}</div>`; } 
            finally { btn.innerText = "✨ 立即生成 ✨"; btn.disabled = false; btn.style.background = "#00b894"; }
        };
        
        document.getElementById('jb-view-fav').onclick = () => {
            const favs = JSON.parse(localStorage.getItem(STORAGE_KEY_FAV)||"[]");
            let h = `<div class="jb-bubble" style="background:#e1f5fe;"><b>⭐ 历史记录 (${favs.length})</b></div>`;
            favs.forEach((f,i)=> h+=`<div class="jb-bubble" style="border-left:3px solid #fab1a0;"><div style="font-size:10px;color:#999;">${f.style}<span style="float:right;cursor:pointer;color:red;" onclick="window.jbDelFav(${i})">🗑️</span></div><div style="max-height:80px;overflow-y:auto;">${f.content}</div></div>`);
            h+=`<button onclick="document.getElementById('jb-chat-area').innerHTML=''" style="width:100%;cursor:pointer;">清屏</button>`;
            document.getElementById('jb-chat-area').innerHTML = h;
        };

        makeDraggable(btn, btn); 
        makeDraggable(menu, menu.querySelector('.jb-header')); 
        makeDraggable(theater, document.getElementById('theater-header'));
    }

    // ================= 4. 工具函数 =================
    
    window.jbSaveFav = function(btn, s) {
        const c = btn.previousElementSibling.innerHTML;
        const fs = JSON.parse(localStorage.getItem(STORAGE_KEY_FAV)||"[]");
        fs.unshift({style:s, content:c, date:new Date().toLocaleString()});
        localStorage.setItem(STORAGE_KEY_FAV, JSON.stringify(fs));
        btn.innerText = "✅"; btn.disabled = true;
    };
    window.jbDelFav = function(i) {
        const fs = JSON.parse(localStorage.getItem(STORAGE_KEY_FAV)||"[]");
        fs.splice(i,1); localStorage.setItem(STORAGE_KEY_FAV, JSON.stringify(fs));
        document.getElementById('jb-view-fav').click();
    };

    function makeDraggable(el, handle) {
        let isD=false, sX, sY, iL, iT;
        const start = (e) => {
            if(e.target.tagName==='SPAN' && e.target!==handle && !e.target.className.includes('header')) return;
            const evt = e.touches?e.touches[0]:e; isD=true; sX=evt.clientX; sY=evt.clientY;
            const r=el.getBoundingClientRect(); iL=r.left; iT=r.top;
            el.style.transition='none'; if(e.cancelable && !e.touches) e.preventDefault();
        };
        const move = (e) => {
            if(!isD) return; if(e.cancelable) e.preventDefault();
            const evt = e.touches?e.touches[0]:e;
            const dx=evt.clientX-sX; const dy=evt.clientY-sY;
            el.style.setProperty('left',(iL+dx)+'px','important');
            el.style.setProperty('top',(iT+dy)+'px','important');
            el.style.setProperty('bottom','auto','important');
            el.style.setProperty('right','auto','important');
        };
        const end = () => { if(isD) el.style.transition=''; isD=false; };
        handle.addEventListener('mousedown',start); handle.addEventListener('touchstart',start,{passive:false});
        window.addEventListener('mousemove',move); window.addEventListener('touchmove',move,{passive:false});
        window.addEventListener('mouseup',end); window.addEventListener('touchend',end);
    }

    setTimeout(createUI, 2000);
})();
