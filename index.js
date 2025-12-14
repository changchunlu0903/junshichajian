// =============================================================
//  军师百宝箱 (TreasureBox) - V23.0 独立 AI 核心版
//  特性：自定义 API 接入 + 模型列表刷新 + 指定模型生成
// =============================================================

(function() {
    console.log("🚀 军师百宝箱 V23.0 (AI核心版) 已加载...");

    // === 0. ID & 变量定义 ===
    const FLOAT_BTN_ID = 'jb-plugin-btn-v23';
    const MENU_BOX_ID  = 'jb-plugin-menu-v23';
    const THEATER_ID   = 'jb-plugin-theater-v23';
    const SETTINGS_ID  = 'jb-plugin-settings-v23';
    
    const KEY_LIB = 'junshi_box_lib';
    const KEY_FAV = 'junshi_box_fav';
    const KEY_CONFIG = 'junshi_box_config_v23';

    // 默认配置
    let config = {
        // 你的自定义 API 地址 (例如 https://api.deepseek.com/v1)
        apiUrl: '', 
        apiKey: '',
        model: '', // 当前选中的模型ID
        useCustomApi: false // 开关
    };

    // 内存变量
    let currentEntries = [];
    let availableModels = []; // 存取回来的模型列表

    // 加载配置
    function loadConfig() {
        const saved = localStorage.getItem(KEY_CONFIG);
        if (saved) { try { config = { ...config, ...JSON.parse(saved) }; } catch(e){} }
    }
    loadConfig();

    // === 1. 注入 CSS (保持蓝黄配色) ===
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
            width: 360px; height: 600px;
            min-width: 300px; min-height: 450px;
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
            display: flex; justify-content: space-between; align-items: center; flex-shrink: 0;
        }

        /* 设置面板样式 */
        .jb-settings-form { padding: 15px; background: #fffdf5; flex: 1; overflow-y: auto; }
        .jb-form-group { margin-bottom: 12px; border:1px dashed #ffeaa7; padding:10px; border-radius:8px; background:#fff; }
        .jb-form-label { display: block; font-size: 12px; color: #e67e22; margin-bottom: 5px; font-weight: bold; }
        .jb-form-input { 
            width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 6px; 
            font-size: 12px; outline: none; background: #fafafa; margin-bottom: 5px;
        }
        .jb-btn-row { display: flex; gap: 5px; }
        .jb-btn-action {
            flex: 1; background: #74b9ff; color: white; border: none; padding: 6px;
            border-radius: 5px; cursor: pointer; font-size: 11px;
        }
        .jb-btn-save {
            width: 100%; background: #00b894; color: white; border: none; padding: 10px;
            border-radius: 8px; cursor: pointer; font-weight: bold; margin-top: 10px;
        }

        /* 普通页面样式 */
        .jb-grid { padding: 20px; display: grid; grid-template-columns: 1fr 1fr; gap: 15px; overflow-y: auto; background: #fffbf0; flex: 1; }
        .jb-menu-card { background: #fff; border: 2px solid #ffeaa7; border-radius: 12px; height: 100px; display: flex; flex-direction: column; justify-content: center; align-items: center; gap: 8px; cursor: pointer; transition: all 0.2s; color: #e67e22; box-shadow: 0 2px 5px rgba(0,0,0,0.05); }
        .jb-menu-card:hover { transform: translateY(-3px); border-color: #74b9ff; color: #74b9ff; }
        .jb-toolbar { padding: 10px; background: #fffbf0; border-bottom: 1px solid #ffeaa7; display: flex; flex-direction: column; gap: 8px; flex-shrink: 0; }
        #jb-chat-area { flex: 1; overflow-y: auto; padding: 10px; background: #fffdf5; }
        .jb-bubble { background: #fff; border: 1px solid #b2ebf2; border-radius: 12px; padding: 12px; margin-bottom: 10px; box-shadow: 0 2px 5px rgba(0,0,0,0.03); font-size: 13px; color: #555; position: relative; }
        .jb-footer { padding: 12px; background: #fff; border-top: 1px solid #eee; display: flex; flex-direction: column; gap: 10px; flex-shrink: 0; }
        #jb-select { width: 100%; padding: 8px; border: 2px solid #74b9ff; border-radius: 8px; background: #f0f9ff; color: #0984e3; font-size: 12px; font-weight: bold; outline: none; }
        #jb-input { width: 100%; border: 1px solid #ddd; border-radius: 8px; padding: 8px; font-size: 13px; outline: none; background: #fafafa; }
        #jb-send { width: 100%; background: #00b894; color: white; border: none; border-radius: 8px; padding: 10px; cursor: pointer; font-weight: bold; font-size: 14px; letter-spacing: 1px; transition: background 0.2s; }
        
        .jb-panel.collapsed { height: 45px !important; resize: none !important; }
        .jb-panel.collapsed > *:not(.jb-header) { display: none !important; }
    `;
    document.head.appendChild(style);


    // ================= 2. 核心 AI 逻辑 (独立 API) =================

    // 🔥 1. 刷新模型列表 (GET /v1/models)
    async function fetchAiModels() {
        const urlInput = document.getElementById('cfg-url').value.trim();
        const keyInput = document.getElementById('cfg-key').value.trim();
        const modelSelect = document.getElementById('cfg-model-select');
        const status = document.getElementById('cfg-status');

        if (!urlInput) { alert("请先填写 API 地址！"); return; }

        status.innerText = "⏳ 正在连接 API...";
        status.style.color = "orange";

        try {
            // 构造请求 (标准 OpenAI 格式)
            // 自动补全 /v1/models 如果用户没写
            let endpoint = urlInput;
            if (endpoint.endsWith('/')) endpoint = endpoint.slice(0, -1);
            if (!endpoint.endsWith('/models') && !endpoint.includes('/v1')) endpoint += '/v1';
            
            const targetUrl = `${endpoint}/models`;

            const res = await fetch(targetUrl, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${keyInput}`,
                    'Content-Type': 'application/json'
                }
            });

            if (!res.ok) throw new Error(`连接失败: ${res.status}`);
            
            const data = await res.json();
            // 兼容 { data: [] } 格式
            const models = data.data || data;

            if (!Array.isArray(models)) throw new Error("返回格式异常");

            // 渲染下拉框
            modelSelect.innerHTML = '<option value="">-- 请选择模型 --</option>';
            models.forEach(m => {
                modelSelect.innerHTML += `<option value="${m.id}">${m.id}</option>`;
            });

            availableModels = models;
            status.innerText = `✅ 成功！获取到 ${models.length} 个模型`;
            status.style.color = "green";
            alert(`🎉 成功连接！\n一共刷出了 ${models.length} 个 AI 模型。\n请在下拉框里选一个！`);

        } catch (e) {
            console.error(e);
            status.innerText = "❌ 连接失败";
            status.style.color = "red";
            alert("API 连接失败：\n" + e.message + "\n\n请检查地址是否正确 (例如 https://api.deepseek.com)");
        }
    }

    // 🔥 2. 独立生成函数 (POST /v1/chat/completions)
    async function generateByCustomApi(prompt) {
        if (!config.apiUrl || !config.model) {
            throw new Error("请先在【设置】里配置 API 地址并选择模型！");
        }

        let endpoint = config.apiUrl;
        if (endpoint.endsWith('/')) endpoint = endpoint.slice(0, -1);
        if (!endpoint.includes('/v1')) endpoint += '/v1';
        const targetUrl = `${endpoint}/chat/completions`;

        const messages = [
            { role: "system", content: "You are a helpful creative assistant. Follow the user's format strictly." },
            { role: "user", content: prompt }
        ];

        const res = await fetch(targetUrl, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${config.apiKey}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                model: config.model,
                messages: messages,
                temperature: 0.7,
                max_tokens: 2000,
                stream: false // 咱们插件先不支持流式，简单点
            })
        });

        if (!res.ok) throw new Error(`API 请求错误: ${res.status}`);
        const data = await res.json();
        
        // 提取内容
        if (data.choices && data.choices.length > 0) {
            return data.choices[0].message.content;
        } else {
            throw new Error("AI 返回了空内容");
        }
    }

    // 🔥 3. 智能路由 (判断是用酒馆的，还是用你自己的)
    async function smartGenerate(prompt) {
        // 如果开关打开了，优先用自定义 API
        if (config.useCustomApi) {
            console.log("🛠️ 使用自定义 API 生成...");
            return await generateByCustomApi(prompt);
        }

        // 否则用酒馆原生的
        console.log("🏠 使用酒馆内置生成...");
        if (typeof window.generateQuiet === 'function') return await window.generateQuiet(prompt);
        if (window.SillyTavern && window.SillyTavern.getContext) {
            const ctx = window.SillyTavern.getContext();
            if (typeof ctx.generateQuiet === 'function') return await ctx.generateQuiet(prompt);
        }
        throw new Error("酒馆原生生成函数未找到，建议去【设置】开启自定义API模式！");
    }


    // ================= 3. UI 构建 =================

    function createUI() {
        if (document.getElementById(FLOAT_BTN_ID)) return;

        const btn = document.createElement('div');
        btn.id = FLOAT_BTN_ID; btn.className = 'jb-fixed-top'; btn.innerHTML = '📦';
        document.body.appendChild(btn);

        // --- 主菜单 ---
        const menu = document.createElement('div');
        menu.id = MENU_BOX_ID; menu.className = 'jb-panel jb-fixed-top';
        menu.style.top = '100px'; menu.style.left = '20px';
        menu.innerHTML = `
            <div class="jb-header jb-draggable-header"><span>📦 军师百宝箱</span><span style="cursor:pointer;" onclick="document.getElementById('${MENU_BOX_ID}').style.display='none'">×</span></div>
            <div class="jb-grid">
                <div class="jb-menu-card" id="btn-goto-theater"><div class="jb-icon">🎬</div><div class="jb-label">小剧场模式</div></div>
                <div class="jb-menu-card" id="btn-goto-settings"><div class="jb-icon">⚙️</div><div class="jb-label">API 设置</div></div>
            </div>
        `;
        document.body.appendChild(menu);

        // --- 设置面板 (你的核心需求) ---
        const settings = document.createElement('div');
        settings.id = SETTINGS_ID; settings.className = 'jb-panel jb-fixed-top';
        settings.style.top = '100px'; settings.style.left = '20px';
        settings.innerHTML = `
            <div class="jb-header jb-draggable-header">
                <span style="display:flex;align-items:center;gap:10px;"><span id="btn-back-settings" style="cursor:pointer;">⬅</span><span>⚙️ API 连接配置</span></span>
            </div>
            <div class="jb-settings-form">
                
                <div class="jb-form-group">
                    <label style="cursor:pointer; color:#00b894; font-weight:bold;">
                        <input type="checkbox" id="cfg-use-custom"> 🟢 启用独立 API 模式
                    </label>
                    <div style="font-size:10px;color:#888;margin-top:5px;">勾选后，插件将完全绕过酒馆，直接连接你的 AI。</div>
                </div>

                <div class="jb-form-group">
                    <label class="jb-form-label">API 地址 (Endpoint)</label>
                    <input type="text" id="cfg-url" class="jb-form-input" placeholder="例如 https://api.deepseek.com">
                </div>

                <div class="jb-form-group">
                    <label class="jb-form-label">API 密钥 (Key)</label>
                    <input type="password" id="cfg-key" class="jb-form-input" placeholder="sk-xxxxxxxx">
                </div>

                <div class="jb-form-group">
                    <label class="jb-form-label">选择模型 (Model)</label>
                    <div class="jb-btn-row" style="margin-bottom:5px;">
                        <select id="cfg-model-select" class="jb-form-input" style="margin:0;">
                            <option value="">(请先刷新)</option>
                        </select>
                        <button id="btn-refresh-models" class="jb-btn-action">🔄 刷新列表</button>
                    </div>
                    <div id="cfg-status" style="font-size:10px;text-align:right;">未连接</div>
                </div>

                <button class="jb-btn-save" id="btn-save-config">💾 保存并生效</button>
            </div>
        `;
        document.body.appendChild(settings);

        // --- 小剧场面板 ---
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
            <div id="jb-chat-area"><div class="jb-bubble" style="background:#fff7d1;"><b>👋 AI 核心已就绪</b><br>去【设置】里填好你的 API，<br>我就能自己动了，不用看酒馆脸色。</div></div>
            <div class="jb-footer">
                <select id="jb-select"></select>
                <input type="text" id="jb-input" placeholder="输入剧情要求...">
                <button id="jb-send">✨ 立即生成 ✨</button>
            </div>
        `;
        document.body.appendChild(theater);

        // === 绑定事件 ===
        const switchPanel = (from, to) => { document.getElementById(from).style.display='none'; const t=document.getElementById(to); t.style.display='flex'; t.style.top=document.getElementById(from).style.top; t.style.left=document.getElementById(from).style.left; };

        // 导航
        btn.onclick = () => { const m=document.getElementById(MENU_BOX_ID); const t=document.getElementById(THEATER_ID); const s=document.getElementById(SETTINGS_ID); if(t.style.display==='flex'||s.style.display==='flex') {t.style.display='none';s.style.display='none';m.style.display='flex';} else { m.style.display=(m.style.display==='flex'?'none':'flex'); } };
        document.getElementById('btn-goto-theater').onclick = () => switchPanel(MENU_BOX_ID, THEATER_ID);
        document.getElementById('btn-goto-settings').onclick = () => {
            // 加载设置到 UI
            document.getElementById('cfg-url').value = config.apiUrl || '';
            document.getElementById('cfg-key').value = config.apiKey || '';
            document.getElementById('cfg-use-custom').checked = config.useCustomApi;
            if(config.model) document.getElementById('cfg-model-select').innerHTML = `<option value="${config.model}">${config.model}</option>`;
            switchPanel(MENU_BOX_ID, SETTINGS_ID);
        };
        document.getElementById('btn-back-menu').onclick = () => switchPanel(THEATER_ID, MENU_BOX_ID);
        document.getElementById('btn-back-settings').onclick = () => switchPanel(SETTINGS_ID, MENU_BOX_ID);

        // ⚙️ 设置页逻辑
        document.getElementById('btn-refresh-models').onclick = fetchAiModels;
        document.getElementById('btn-save-config').onclick = () => {
            config.apiUrl = document.getElementById('cfg-url').value.trim();
            config.apiKey = document.getElementById('cfg-key').value.trim();
            config.model = document.getElementById('cfg-model-select').value;
            config.useCustomApi = document.getElementById('cfg-use-custom').checked;
            localStorage.setItem(KEY_CONFIG, JSON.stringify(config));
            alert("✅ 设置已保存！\n" + (config.useCustomApi ? "当前模式：独立 API 生成" : "当前模式：酒馆内置生成"));
        };

        // 🎭 小剧场逻辑 (不变)
        document.getElementById('jb-file-input').onchange = (e) => { if(e.target.files[0]) handleFileImport(e.target.files[0]); };
        document.getElementById('jb-read-active').onclick = handleReadActive;
        document.getElementById('jb-collapse').onclick = (e) => { const t=document.getElementById(THEATER_ID); t.classList.toggle('collapsed'); e.target.innerText=t.classList.contains('collapsed')?'▲':'▼'; };

        // 🔥 生成
        document.getElementById('jb-send').onclick = async () => {
            if (currentEntries.length === 0) { alert("⚠️ 请先导入模板！"); return; }
            const val = document.getElementById('jb-select').value;
            const req = document.getElementById('jb-input').value;
            const chat = document.getElementById('jb-chat-area');
            const btn = document.getElementById('jb-send');

            let targetStyle = null;
            if (val === 'random') targetStyle = currentEntries[Math.floor(Math.random() * currentEntries.length)];
            else targetStyle = currentEntries[parseInt(val)];

            btn.innerText = "⏳ 思考中..."; btn.disabled = true; btn.style.background = "#ccc";
            chat.innerHTML += `<div class="jb-bubble" style="color:#aaa;">🎥 正在请求 AI (${config.useCustomApi ? config.model : '酒馆'})...</div>`;
            chat.scrollTop = chat.scrollHeight;

            try {
                // 构造 Prompt
                let charName = "Character";
                let lastMes = "";
                if (window.SillyTavern && window.SillyTavern.getContext) {
                    const ctx = SillyTavern.getContext();
                    if(ctx.characterId) charName = ctx.characters[ctx.characterId].name;
                    if(ctx.chat.length > 0) lastMes = ctx.chat[ctx.chat.length-1].mes;
                }

                const prompt = `[Instruction: Generate content strictly following the template format below.]\n[TEMPLATE STYLE]:\n${targetStyle.content}\n[CONTEXT]:\nCharacter: ${charName}\nStory: "${lastMes}"\nUser Request: "${req}"\nFill the template creatively now.`;

                // 调用智能路由
                const result = await smartGenerate(prompt);
                
                chat.innerHTML += `<div class="jb-bubble"><div style="font-size:10px; color:#74b9ff;">🎨 ${targetStyle.name}</div><div style="border-top:1px dashed #b2ebf2; padding-top:5px;">${result}</div></div>`;
                chat.scrollTop = chat.scrollHeight;

            } catch(e) {
                chat.innerHTML += `<div style="color:red;">❌ 失败: ${e.message}</div>`;
            } finally {
                btn.innerText = "✨ 立即生成 ✨"; btn.disabled = false; btn.style.background = "#00b894";
            }
        };

        makeDraggable(btn, btn); makeDraggable(menu, menu.querySelector('.jb-header')); makeDraggable(settings, settings.querySelector('.jb-header')); makeDraggable(theater, document.getElementById('theater-header'));
    }

    // 辅助函数
    function parseAndLoad(entriesSource, sourceName) { let rawEntries=[]; if(entriesSource.entries){if(Array.isArray(entriesSource.entries)) rawEntries=entriesSource.entries; else rawEntries=Object.values(entriesSource.entries);} else if(Array.isArray(entriesSource)){rawEntries=entriesSource;} else {rawEntries=Object.values(entriesSource);} const cleanEntries=[]; rawEntries.forEach((e,i)=>{if(!e||typeof e!=='object')return; const c=e.content||e.prompt||""; if(!c.trim())return; let n=e.comment; if(!n&&e.key)n=Array.isArray(e.key)?e.key[0]:e.key; if(!n)n=`样式#${i+1}`; cleanEntries.push({name:n,content:c});}); if(cleanEntries.length===0){alert("无效内容");return;} currentEntries=cleanEntries; updateUI(sourceName); }
    function handleFileImport(file) { const r=new FileReader(); r.onload=e=>{try{parseAndLoad(JSON.parse(e.target.result), file.name.replace(/\.json$/i,''));}catch(err){alert("解析失败");}}; r.readAsText(file); }
    function handleReadActive() { if(!window.SillyTavern){alert("酒馆未就绪");return;} const ctx=SillyTavern.getContext(); let e=[]; if(ctx.worldInfo&&ctx.worldInfo.entries) e=ctx.worldInfo.entries; else if(ctx.characterId&&ctx.characters[ctx.characterId].worldInfo) e=ctx.characters[ctx.characterId].worldInfo; if(e.length>0) parseAndLoad(e.filter(x=>!x.disable), "当前挂载"); else alert("无挂载"); }
    function updateUI(t) { const s=document.getElementById('jb-select'); const st=document.getElementById('jb-status'); st.innerText=`✅ ${t} (${currentEntries.length})`; st.style.color='green'; let h=`<option value="random">🎲 随机</option>`; if(currentEntries.length>0){ h+=`<optgroup label="${t}">`; currentEntries.forEach((e,i)=>{h+=`<option value="${i}">└─ ${e.name}</option>`}); h+=`</optgroup>`; } s.innerHTML=h; }
    function makeDraggable(el,h){ let isD=false,sX,sY,iL,iT; const st=e=>{if(e.target.tagName==='SPAN'&&e.target!==h&&!e.target.className.includes('header'))return; const ev=e.touches?e.touches[0]:e; isD=true; sX=ev.clientX; sY=ev.clientY; const r=el.getBoundingClientRect(); iL=r.left; iT=r.top; el.style.transition='none'; if(e.cancelable&&!e.touches)e.preventDefault();}; const mv=e=>{if(!isD)return; if(e.cancelable)e.preventDefault(); const ev=e.touches?e.touches[0]:e; const dx=ev.clientX-sX; const dy=ev.clientY-sY; el.style.setProperty('left',(iL+dx)+'px','important'); el.style.setProperty('top',(iT+dy)+'px','important'); el.style.setProperty('bottom','auto','important'); el.style.setProperty('right','auto','important');}; const ed=()=>{if(isD)el.style.transition=''; isD=false;}; h.addEventListener('mousedown',st); h.addEventListener('touchstart',st,{passive:false}); window.addEventListener('mousemove',mv); window.addEventListener('touchmove',mv,{passive:false}); window.addEventListener('mouseup',ed); window.addEventListener('touchend',ed); }

    setTimeout(createUI, 2000);
})();
