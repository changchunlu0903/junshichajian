// =============================================================
//  军师百宝箱 (TreasureBox) - V22.0 设置面板版
//  新增：UI设置面板 (无需改代码，直接填API Key)
//  修复：403 权限错误
// =============================================================

(function() {
    console.log("🚀 军师百宝箱 V22.0 (设置版) 已加载...");

    // === 0. ID & 变量定义 ===
    const FLOAT_BTN_ID = 'jb-plugin-btn-v22';
    const MENU_BOX_ID  = 'jb-plugin-menu-v22';
    const THEATER_ID   = 'jb-plugin-theater-v22';
    const SETTINGS_ID  = 'jb-plugin-settings-v22'; // 新增设置面板ID
    
    // 存储键名
    const KEY_LIB = 'junshi_box_lib';
    const KEY_FAV = 'junshi_box_fav';
    const KEY_CONFIG = 'junshi_box_config'; // 新增配置存储

    // 默认配置
    let config = {
        apiUrl: window.location.origin, // 默认当前地址
        apiKey: '',                     // 默认为空
        useLegacyMode: false            // 是否强制使用旧版接口
    };

    // 加载配置
    function loadConfig() {
        const saved = localStorage.getItem(KEY_CONFIG);
        if (saved) {
            try { config = { ...config, ...JSON.parse(saved) }; } catch(e){}
        }
    }
    loadConfig();

    // 内存变量
    let currentEntries = [];

    // 获取 CSRF Token
    function getCsrfToken() {
        if (window.csrfToken) return window.csrfToken;
        const match = document.cookie.match(new RegExp('(^| )X-CSRF-Token=([^;]+)'));
        return match ? match[2] : '';
    }

    // 🔥🔥🔥 核心：核弹级智能生成 (带 API Key) 🔥🔥🔥
    async function smartGenerate(prompt) {
        console.log("🚀 开始生成...");
        
        // 1. 优先尝试前端函数 (如果没勾选强制API模式)
        if (!config.useLegacyMode) {
            if (typeof window.generateQuiet === 'function') return await window.generateQuiet(prompt);
            if (typeof window.generate_quiet === 'function') return await window.generate_quiet(prompt);
            if (window.SillyTavern && window.SillyTavern.getContext) {
                const ctx = window.SillyTavern.getContext();
                if (typeof ctx.generateQuiet === 'function') return await ctx.generateQuiet(prompt);
            }
        }

        // 2. ☢️ API 直连模式 (解决 403 的关键)
        console.log("🔄 尝试 API 直连...");
        try {
            // 构造 URL
            let url = config.apiUrl || window.location.origin;
            if (url.endsWith('/')) url = url.slice(0, -1); // 去掉末尾斜杠
            const apiEndpoint = `${url}/api/generate`;

            // 获取参数
            let params = {};
            if (window.SillyTavern && window.SillyTavern.getContext) {
                params = window.SillyTavern.getContext().generation_settings_params || {};
            }

            // 构造 Headers
            const headers = {
                'Content-Type': 'application/json',
                'X-CSRF-Token': getCsrfToken()
            };
            // 🔑 如果用户填了 API Key，加上它！
            if (config.apiKey) {
                headers['Authorization'] = `Bearer ${config.apiKey}`; // 标准格式
                headers['api-key'] = config.apiKey; // 兼容格式
            }

            const payload = {
                prompt: prompt,
                use_story: false, use_memory: false, use_authors_note: false, use_world_info: false,
                quiet: true,
                ...params
            };

            const response = await fetch(apiEndpoint, {
                method: 'POST',
                headers: headers,
                body: JSON.stringify(payload)
            });

            if (response.status === 403) {
                throw new Error("403 权限拒绝！\n请在【设置】里填写 API Key (访问密码)。");
            }
            if (!response.ok) throw new Error(`API响应错误: ${response.status}`);
            
            const data = await response.json();
            if (data.results && data.results.length > 0) return data.results[0].text;
            else throw new Error("API返回空数据");

        } catch (e) {
            console.error(e);
            throw e; // 向上传递错误
        }
    }


    // === 1. 注入 CSS ===
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
            width: 340px; height: 580px; min-width: 280px; min-height: 400px;
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
            flex-shrink: 0;
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

        /* ⚙️ 设置面板特有样式 */
        .jb-settings-form { padding: 20px; background: #fffdf5; flex: 1; overflow-y: auto; }
        .jb-form-group { margin-bottom: 15px; }
        .jb-form-label { display: block; font-size: 12px; color: #666; margin-bottom: 5px; font-weight: bold; }
        .jb-form-input { 
            width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 6px; 
            font-size: 12px; outline: none; background: #fff;
        }
        .jb-form-hint { font-size: 10px; color: #999; margin-top: 3px; }
        .jb-btn-save {
            width: 100%; background: #00b894; color: white; border: none; padding: 10px;
            border-radius: 8px; cursor: pointer; font-weight: bold; margin-top: 10px;
        }

        /* 小剧场工具栏 */
        .jb-toolbar {
            padding: 10px; background: #fffbf0; border-bottom: 1px solid #ffeaa7;
            display: flex; flex-direction: column; gap: 8px; flex-shrink: 0;
        }
        .jb-btn-group { display: flex; gap: 5px; }
        .jb-btn-action {
            flex: 1; border: 1px solid #ffeaa7; border-radius: 5px; 
            padding: 8px; font-size: 12px; cursor: pointer; font-weight: bold;
            background: #fff; color: #555; display:flex; justify-content:center; align-items:center; gap:4px;
        }
        .jb-btn-action:hover { background: #fff7d1; color: #e67e22; }
        
        #jb-chat-area { flex: 1; overflow-y: auto; padding: 10px; background: #fffdf5; }
        .jb-bubble {
            background: #fff; border: 1px solid #b2ebf2; border-radius: 12px;
            padding: 12px; margin-bottom: 10px; box-shadow: 0 2px 5px rgba(0,0,0,0.03);
            font-size: 13px; color: #555; position: relative;
        }
        
        /* 底部 */
        .jb-footer {
            padding: 12px; background: #fff; border-top: 1px solid #eee;
            display: flex; flex-direction: column; gap: 10px; flex-shrink: 0;
        }
        #jb-select { width: 100%; padding: 8px; border: 2px solid #74b9ff; border-radius: 8px; background: #f0f9ff; color: #0984e3; font-size: 12px; font-weight: bold; outline: none; }
        #jb-input { width: 100%; border: 1px solid #ddd; border-radius: 8px; padding: 8px; font-size: 13px; outline: none; background: #fafafa; }
        #jb-send { width: 100%; background: #00b894; color: white; border: none; border-radius: 8px; padding: 10px; cursor: pointer; font-weight: bold; font-size: 14px; letter-spacing: 1px; transition: background 0.2s; }
        #jb-send:hover { background: #019e7e; }
        
        .jb-panel.collapsed { height: 45px !important; resize: none !important; }
        .jb-panel.collapsed > *:not(.jb-header) { display: none !important; }
    `;
    document.head.appendChild(style);


    // ================= 2. 逻辑部分 (保持 V18 的本地解析) =================
    
    function getLibrary() { return JSON.parse(localStorage.getItem(KEY_LIB) || "[]"); }
    function saveLibrary(data) { localStorage.setItem(KEY_LIB, JSON.stringify(data)); }

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

        if (cleanEntries.length === 0) { alert("⚠️ 未找到有效内容"); return; }
        currentEntries = cleanEntries;
        updateUI(sourceName);
    }

    function handleFileImport(file) {
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const json = JSON.parse(e.target.result);
                parseAndLoad(json, file.name.replace(/\.json$/i, ''));
            } catch (err) { alert("❌ JSON 解析失败: " + err); }
        };
        reader.readAsText(file);
    }

    function handleReadActive() {
        if (!window.SillyTavern || !SillyTavern.getContext) { alert("❌ 酒馆核心未就绪"); return; }
        const ctx = SillyTavern.getContext();
        let entries = [];
        if (ctx.worldInfo && ctx.worldInfo.entries) entries = ctx.worldInfo.entries;
        else if (ctx.characterId && ctx.characters[ctx.characterId].worldInfo) entries = ctx.characters[ctx.characterId].worldInfo;
        
        if (entries.length > 0) {
            const active = entries.filter(e => !e.disable);
            parseAndLoad(active, "当前挂载(Active)");
        } else {
            alert("⚠️ 未检测到生效的世界书。");
        }
    }

    function updateUI(title) {
        const sel = document.getElementById('jb-select');
        const st = document.getElementById('jb-status');
        st.innerText = `✅ 已载入: ${title} (${currentEntries.length}个)`;
        st.style.color = 'green';
        let html = `<option value="random">🎲 随机抽取 (默认)</option>`;
        if (currentEntries.length > 0) {
            html += `<optgroup label="📑 ${title}">`;
            currentEntries.forEach((e, idx) => { html += `<option value="${idx}">└─ ${e.name}</option>`; });
            html += `</optgroup>`;
        }
        sel.innerHTML = html;
    }


    // ================= 3. UI 构建 =================

    function createUI() {
        if (document.getElementById(FLOAT_BTN_ID)) return;

        const btn = document.createElement('div');
        btn.id = FLOAT_BTN_ID; btn.className = 'jb-fixed-top'; btn.innerHTML = '📦'; btn.title = "打开百宝箱";
        document.body.appendChild(btn);

        // === 主菜单 ===
        const menu = document.createElement('div');
        menu.id = MENU_BOX_ID; menu.className = 'jb-panel jb-fixed-top';
        menu.style.top = '100px'; menu.style.left = '20px';
        menu.innerHTML = `
            <div class="jb-header jb-draggable-header">
                <span>📦 军师百宝箱</span>
                <span style="cursor:pointer;font-size:20px;" onclick="document.getElementById('${MENU_BOX_ID}').style.display='none'">×</span>
            </div>
            <div class="jb-grid">
                <div class="jb-menu-card" id="btn-goto-theater">
                    <div class="jb-icon">🎬</div><div class="jb-label">小剧场模式</div>
                </div>
                <div class="jb-menu-card" id="btn-goto-settings">
                    <div class="jb-icon">⚙️</div><div class="jb-label">设置</div>
                </div>
            </div>
        `;
        document.body.appendChild(menu);

        // === 设置面板 (新增) ===
        const settings = document.createElement('div');
        settings.id = SETTINGS_ID; settings.className = 'jb-panel jb-fixed-top';
        settings.style.top = '100px'; settings.style.left = '20px';
        settings.innerHTML = `
            <div class="jb-header jb-draggable-header" id="settings-header">
                <span style="display:flex;align-items:center;gap:10px;"><span id="btn-back-from-settings" style="cursor:pointer;">⬅</span><span>⚙️ 全局设置</span></span>
                <span style="cursor:pointer;font-size:20px;" onclick="document.getElementById('${SETTINGS_ID}').style.display='none'">×</span>
            </div>
            <div class="jb-settings-form">
                <div class="jb-form-group">
                    <label class="jb-form-label">API 基础地址 (留空则自动识别)</label>
                    <input type="text" id="cfg-url" class="jb-form-input" placeholder="例如 http://127.0.0.1:8000">
                    <div class="jb-form-hint">通常不需要填，除非你是跨设备连接。</div>
                </div>
                <div class="jb-form-group">
                    <label class="jb-form-label">API Key (密钥)</label>
                    <input type="password" id="cfg-key" class="jb-form-input" placeholder="酒馆后台设置的 API 密码">
                    <div class="jb-form-hint">🔥 如果遇到 403 错误，请务必填写此项！</div>
                </div>
                <div class="jb-form-group">
                    <label style="font-size:12px;cursor:pointer;">
                        <input type="checkbox" id="cfg-force"> 强制使用 API 直连模式 (跳过前端函数)
                    </label>
                </div>
                <button class="jb-btn-save" id="btn-save-config">💾 保存配置</button>
            </div>
        `;
        document.body.appendChild(settings);

        // === 小剧场面板 ===
        const theater = document.createElement('div');
        theater.id = THEATER_ID; theater.className = 'jb-panel jb-fixed-top';
        theater.style.top = '100px'; theater.style.left = '20px';
        theater.innerHTML = `
            <div class="jb-header jb-draggable-header" id="theater-header">
                <span style="display:flex;align-items:center;gap:10px;"><span id="btn-back-menu" style="cursor:pointer;">⬅</span><span>🎬 小剧场</span></span>
                <span style="display:flex;gap:10px;"><span id="jb-collapse" style="cursor:pointer;">▼</span><span style="cursor:pointer;" onclick="document.getElementById('${THEATER_ID}').style.display='none'">×</span></span>
            </div>
            <div class="jb-toolbar">
                <div class="jb-btn-group">
                    <input type="file" id="jb-file-input" accept=".json" style="display:none;">
                    <button class="jb-btn-action" onclick="document.getElementById('jb-file-input').click()">📂 导入文件</button>
                    <button class="jb-btn-action" id="jb-read-active">💾 读取当前</button>
                </div>
                <div id="jb-status" style="font-size:10px;color:#aaa;text-align:center;">请加载模板</div>
            </div>
            <div id="jb-chat-area"><div class="jb-bubble" style="background:#fff7d1;"><b>👋 提示：</b><br>如果生成报错，请去【设置】里填入 API Key。<br>支持文件导入或读取酒馆挂载。</div></div>
            <div class="jb-footer">
                <select id="jb-select"></select>
                <input type="text" id="jb-input" placeholder="输入剧情要求 (可选)...">
                <button id="jb-send">✨ 立即生成 ✨</button>
                <div style="text-align:center;"><a href="#" id="jb-view-fav" style="font-size:12px;color:#999;text-decoration:none;">⭐ 查看历史</a></div>
            </div>
        `;
        document.body.appendChild(theater);

        // === 事件绑定 ===
        
        // 1. 导航
        btn.onclick = () => {
            const m = document.getElementById(MENU_BOX_ID);
            // 关掉其他面板
            document.getElementById(THEATER_ID).style.display = 'none';
            document.getElementById(SETTINGS_ID).style.display = 'none';
            m.style.display = (m.style.display === 'flex' ? 'none' : 'flex');
        };
        
        // 切换面板函数
        const switchPanel = (fromId, toId) => {
            const from = document.getElementById(fromId);
            const to = document.getElementById(toId);
            from.style.display = 'none';
            to.style.display = 'flex';
            to.style.top = from.style.top; to.style.left = from.style.left;
        };

        document.getElementById('btn-goto-theater').onclick = () => switchPanel(MENU_BOX_ID, THEATER_ID);
        document.getElementById('btn-goto-settings').onclick = () => {
            // 加载当前设置到 UI
            document.getElementById('cfg-url').value = config.apiUrl;
            document.getElementById('cfg-key').value = config.apiKey;
            document.getElementById('cfg-force').checked = config.useLegacyMode;
            switchPanel(MENU_BOX_ID, SETTINGS_ID);
        };
        document.getElementById('btn-back-menu').onclick = () => switchPanel(THEATER_ID, MENU_BOX_ID);
        document.getElementById('btn-back-from-settings').onclick = () => switchPanel(SETTINGS_ID, MENU_BOX_ID);

        // 2. 设置保存
        document.getElementById('btn-save-config').onclick = () => {
            config.apiUrl = document.getElementById('cfg-url').value.trim();
            config.apiKey = document.getElementById('cfg-key').value.trim();
            config.useLegacyMode = document.getElementById('cfg-force').checked;
            localStorage.setItem(KEY_CONFIG, JSON.stringify(config));
            alert("✅ 设置已保存！");
            switchPanel(SETTINGS_ID, MENU_BOX_ID);
        };

        // 3. 功能绑定
        document.getElementById('jb-file-input').onchange = (e) => { if(e.target.files[0]) { handleFileImport(e.target.files[0]); e.target.value = ''; } };
        document.getElementById('jb-read-active').onclick = handleReadActive;
        document.getElementById('jb-collapse').onclick = (e) => {
            const t = document.getElementById(THEATER_ID);
            t.classList.toggle('collapsed');
            e.target.innerText = t.classList.contains('collapsed') ? '▲' : '▼';
        };

        // 4. 生成 (调用 smartGenerate)
        document.getElementById('jb-send').onclick = async () => {
            if (currentEntries.length === 0) { alert("⚠️ 请先加载模板！"); return; }
            const val = document.getElementById('jb-select').value;
            const req = document.getElementById('jb-input').value;
            const chat = document.getElementById('jb-chat-area');
            const btn = document.getElementById('jb-send');

            if (!window.SillyTavern) { alert("❌ 未检测到酒馆对象"); return; }

            let targetStyle = null;
            if (val === 'random') targetStyle = currentEntries[Math.floor(Math.random() * currentEntries.length)];
            else targetStyle = currentEntries[parseInt(val)];

            btn.innerText = "⏳ 生成中..."; btn.disabled = true; btn.style.background = "#ccc";
            chat.innerHTML += `<div class="jb-bubble" style="color:#aaa;font-size:12px;">🎥 应用样式：${targetStyle.name}...</div>`;
            chat.scrollTop = chat.scrollHeight;

            try {
                const context = SillyTavern.getContext();
                const charName = context.characters[context.characterId].name;
                const lastMes = context.chat.length > 0 ? context.chat[context.chat.length-1].mes : "";
                const prompt = `[Instruction: Generate content strictly following the template format below.]\n[TEMPLATE STYLE]:\n${targetStyle.content}\n[CONTEXT]:\nCharacter: ${charName}\nStory: "${lastMes}"\nUser Request: "${req}"\nFill the template creatively now.`;

                // 🔥 核心调用
                const result = await smartGenerate(prompt);
                
                chat.innerHTML += `<div class="jb-bubble"><div style="font-size:10px; color:#74b9ff; margin-bottom:5px;">🎨 ${targetStyle.name}</div><div style="border-top:1px dashed #b2ebf2; padding-top:5px;">${result}</div><button onclick="window.jbSaveFav(this, '${targetStyle.name}')" style="margin-top:5px; width:100%; border:1px solid #eee; background:#fff; cursor:pointer;">❤️ 收藏</button></div>`;
                chat.scrollTop = chat.scrollHeight;

            } catch(e) { 
                chat.innerHTML += `<div style="color:red;">❌ 生成失败: ${e.message}</div>`; 
                if(e.message.includes('403')) alert("⚠️ 遇到 403 错误！\n请去插件的【设置】面板填写你的 API Key。");
            } 
            finally { btn.innerText = "✨ 立即生成 ✨"; btn.disabled = false; btn.style.background = "#00b894"; }
        };
        
        document.getElementById('jb-view-fav').onclick = () => {
            const favs = JSON.parse(localStorage.getItem(STORAGE_KEY_FAV)||"[]");
            let h = `<div class="jb-bubble" style="background:#e1f5fe;"><b>⭐ 历史记录 (${favs.length})</b></div>`;
            favs.forEach((f,i)=> h+=`<div class="jb-bubble" style="border-left:3px solid #fab1a0;"><div style="font-size:10px;color:#999;">${f.style}<span style="float:right;cursor:pointer;color:red;" onclick="window.jbDelFav(${i})">🗑️</span></div><div style="max-height:80px;overflow-y:auto;">${f.content}</div></div>`);
            h+=`<button onclick="document.getElementById('jb-chat-area').innerHTML=''" style="width:100%;cursor:pointer;">清屏</button>`;
            document.getElementById('jb-chat-area').innerHTML = h;
        };

        // 拖拽绑定
        makeDraggable(btn, btn); makeDraggable(menu, menu.querySelector('.jb-header')); makeDraggable(settings, settings.querySelector('.jb-header')); makeDraggable(theater, document.getElementById('theater-header'));
    }

    // ================= 4. 工具函数 =================
    window.jbSaveFav = function(btn, s) { const c = btn.previousElementSibling.innerHTML; const fs = JSON.parse(localStorage.getItem(STORAGE_KEY_FAV)||"[]"); fs.unshift({style:s, content:c, date:new Date().toLocaleString()}); localStorage.setItem(STORAGE_KEY_FAV, JSON.stringify(fs)); btn.innerText = "✅"; btn.disabled = true; };
    window.jbDelFav = function(i) { const fs = JSON.parse(localStorage.getItem(STORAGE_KEY_FAV)||"[]"); fs.splice(i,1); localStorage.setItem(STORAGE_KEY_FAV, JSON.stringify(fs)); document.getElementById('jb-view-fav').click(); };
    function makeDraggable(el, handle) {
        let isD=false, sX, sY, iL, iT;
        const start = (e) => { if(e.target.tagName==='SPAN' && e.target!==handle && !e.target.className.includes('header')) return; const evt = e.touches?e.touches[0]:e; isD=true; sX=evt.clientX; sY=evt.clientY; const r=el.getBoundingClientRect(); iL=r.left; iT=r.top; el.style.transition='none'; if(e.cancelable && !e.touches) e.preventDefault(); };
        const move = (e) => { if(!isD) return; if(e.cancelable) e.preventDefault(); const evt = e.touches?e.touches[0]:e; const dx=evt.clientX-sX; const dy=evt.clientY-sY; el.style.setProperty('left',(iL+dx)+'px','important'); el.style.setProperty('top',(iT+dy)+'px','important'); el.style.setProperty('bottom','auto','important'); el.style.setProperty('right','auto','important'); };
        const end = () => { if(isD) el.style.transition=''; isD=false; };
        handle.addEventListener('mousedown',start); handle.addEventListener('touchstart',start,{passive:false}); window.addEventListener('mousemove',move); window.addEventListener('touchmove',move,{passive:false}); window.addEventListener('mouseup',end); window.addEventListener('touchend',end);
    }

    setTimeout(createUI, 2000);
})();
