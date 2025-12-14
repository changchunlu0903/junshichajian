// =============================================================
//  军师百宝箱 V26.0 - 完美设置版
//  修复：找回“刷新模型列表”按钮 | 保持 V25 所有体验修复
// =============================================================

(function() {
    console.log("🚀 军师百宝箱 V26.0 已加载...");

    // === 0. ID 定义 ===
    const FLOAT_BTN_ID = 'jb-btn-v26';
    const MENU_ID      = 'jb-menu-v26';
    const THEATER_ID   = 'jb-theater-v26';
    const SETTINGS_ID  = 'jb-settings-v26';
    const FAV_PANEL_ID = 'jb-fav-panel-v26';
    const FULLSCREEN_ID= 'jb-fullscreen-v26';

    const KEY_LIB = 'junshi_box_lib';
    const KEY_FAV = 'junshi_box_favs_v26';
    const KEY_CONFIG = 'junshi_box_config_v26';

    // 状态变量
    let config = { apiUrl: '', apiKey: '', model: '', useCustomApi: false };
    let currentEntries = [];
    
    // 加载配置
    try { Object.assign(config, JSON.parse(localStorage.getItem(KEY_CONFIG))); } catch(e){}

    // === 1. CSS (保持 V25 的修复样式) ===
    const style = document.createElement('style');
    style.innerHTML = `
        /* 基础层级 */
        .jb-fixed { position: fixed !important; z-index: 2147483640 !important; }
        .jb-drag-head { cursor: move; user-select: none; flex-shrink: 0; }

        /* 悬浮球 */
        #${FLOAT_BTN_ID} {
            top: 50px; left: 20px; width: 45px; height: 45px;
            background: #fff; border: 3px solid #74b9ff; border-radius: 50%;
            color: #74b9ff; display: flex; justify-content: center; align-items: center;
            font-size: 22px; cursor: move; box-shadow: 0 4px 10px rgba(0,0,0,0.2);
            transition: transform 0.1s;
        }
        #${FLOAT_BTN_ID}:active { transform: scale(0.95); }

        /* 面板 (V25尺寸) */
        .jb-panel {
            width: 320px; height: 520px; /* 稍微加高一点点给设置页 */
            min-width: 280px; min-height: 350px;
            background: #fff; border: 2px solid #74b9ff; border-radius: 10px;
            box-shadow: 0 10px 30px rgba(0,0,0,0.3);
            display: none; flex-direction: column;
            font-family: "Microsoft YaHei", sans-serif;
            resize: both; overflow: hidden;
        }

        /* 标题栏 */
        .jb-header {
            background: #74b9ff; color: white; padding: 8px 12px;
            font-weight: bold; font-size: 14px;
            display: flex; justify-content: space-between; align-items: center;
        }

        /* 全屏层 (V25修复版) */
        #${FULLSCREEN_ID} {
            display: none; position: fixed; top: 0; left: 0; 
            width: 100vw; height: 100vh;
            background: rgba(0,0,0,0.9); 
            z-index: 2147483647 !important;
            justify-content: center; align-items: center;
            padding: 20px; box-sizing: border-box;
        }
        .jb-fs-wrapper {
            background: #fff; width: 95%; height: 95%; 
            border-radius: 8px; position: relative;
            display: flex; flex-direction: column;
        }
        .jb-fs-close {
            position: absolute; top: 5px; right: 10px; 
            font-size: 28px; cursor: pointer; color: #555; z-index: 10;
            background: rgba(255,255,255,0.8); border-radius: 50%; padding: 0 8px;
        }
        .jb-fs-content {
            flex: 1; overflow-y: auto; padding: 20px;
            width: 100%; box-sizing: border-box;
        }

        /* 内容区 */
        .jb-body { flex: 1; overflow-y: auto; padding: 10px; background: #fdfdfd; }
        .jb-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
        .jb-card {
            background: #fff; border: 1px solid #ffeaa7; border-radius: 8px;
            height: 80px; display: flex; flex-direction: column;
            justify-content: center; align-items: center; gap: 5px;
            cursor: pointer; transition: 0.2s; color: #e67e22;
            box-shadow: 0 2px 5px rgba(0,0,0,0.03);
        }
        .jb-card:hover { border-color: #74b9ff; color: #74b9ff; background: #f0f9ff; }

        /* 气泡与内容 */
        .jb-bubble { 
            background: #fff; border: 1px solid #eee; border-left: 3px solid #74b9ff;
            border-radius: 6px; padding: 8px; margin-bottom: 10px; 
            font-size: 12px; color: #333; position: relative;
        }
        .jb-html-content { width: 100%; overflow-x: hidden; word-wrap: break-word; }
        .jb-html-content img { max-width: 100% !important; height: auto !important; }

        /* 底部 */
        .jb-footer { padding: 8px; background: #fff; border-top: 1px solid #eee; display: flex; flex-direction: column; gap: 6px; flex-shrink: 0; }
        input, select { width: 100%; padding: 6px; border: 1px solid #ddd; border-radius: 4px; outline: none; font-size: 12px; box-sizing: border-box; }
        .jb-btn { width: 100%; background: #74b9ff; color: white; border: none; border-radius: 4px; padding: 8px; cursor: pointer; font-weight: bold; }
        .jb-btn:hover { background: #0984e3; }
        .jb-btn-green { background: #00b894; }
        .jb-btn-green:hover { background: #00a884; }
        
        /* 刷新按钮样式 */
        .jb-refresh-btn { width: 40px; padding: 0; font-size: 16px; margin-left: 5px; background: #eee; color: #555; }
        .jb-refresh-btn:hover { background: #ddd; }
    `;
    document.head.appendChild(style);


    // ================= 2. 核心逻辑 (含 V25 上下文修复 & API刷新) =================

    function executeScripts(container) {
        container.querySelectorAll('script').forEach(old => {
            const newScript = document.createElement('script');
            Array.from(old.attributes).forEach(attr => newScript.setAttribute(attr.name, attr.value));
            newScript.appendChild(document.createTextNode(old.innerHTML));
            old.parentNode.replaceChild(newScript, old);
        });
    }

    function renderContent(target, html) {
        const clean = html.replace(/```html/gi, '').replace(/```/g, '').trim();
        target.innerHTML = clean;
        try { executeScripts(target); } catch(e) { console.warn(e); }
    }

    // 提示词构建 (V25修复版)
    async function buildContextPrompt(req, styleContent) {
        if (!window.SillyTavern || !SillyTavern.getContext) return `Req: ${req}\nTemplate: ${styleContent}`;
        const ctx = SillyTavern.getContext();
        const charName = ctx.characters[ctx.characterId].name || "Character";
        const persona = ctx.characters[ctx.characterId].persona || "";
        const userPersona = ctx.userPersona || "";
        let chatHistory = "";
        if (ctx.chat && ctx.chat.length > 0) {
            ctx.chat.slice(-3).forEach(msg => { chatHistory += `${msg.is_user ? 'User' : charName}: ${msg.mes}\n`; });
        }
        return `[Instruction: Generate HTML scene]\n[CONTEXT]\nChar: ${charName}\nPersona: ${persona}\nUser: ${userPersona}\n[HISTORY]\n${chatHistory}\n[REQ]\n"${req}"\n[TEMPLATE]\n${styleContent}\nGenerate HTML now.`;
    }

    // 刷新模型列表逻辑 (V26 找回)
    async function fetchAiModels() {
        const urlInput = document.getElementById('cfg-url').value.trim();
        const keyInput = document.getElementById('cfg-key').value.trim();
        const modelSelect = document.getElementById('cfg-model');

        if (!urlInput) { alert("请先填写 API 地址！"); return; }
        modelSelect.innerHTML = '<option>⏳ 连接中...</option>';

        try {
            let endpoint = urlInput.replace(/\/$/, '');
            if (!endpoint.includes('/v1')) endpoint += '/v1';
            
            const res = await fetch(`${endpoint}/models`, {
                method: 'GET',
                headers: { 'Authorization': `Bearer ${keyInput}`, 'Content-Type': 'application/json' }
            });

            if (!res.ok) throw new Error(`连接失败: ${res.status}`);
            const data = await res.json();
            const models = data.data || data;
            
            if (!Array.isArray(models)) throw new Error("格式异常");

            modelSelect.innerHTML = '<option value="">-- 请选择 --</option>';
            models.forEach(m => {
                modelSelect.innerHTML += `<option value="${m.id}">${m.id}</option>`;
            });
            alert(`🎉 成功！刷出 ${models.length} 个模型`);

        } catch (e) {
            console.error(e);
            modelSelect.innerHTML = '<option value="">连接失败</option>';
            alert("刷新失败: " + e.message);
        }
    }

    // 智能生成
    async function smartGenerate(fullPrompt) {
        if (config.useCustomApi && config.apiUrl) {
            let url = config.apiUrl.replace(/\/$/, '');
            if(!url.includes('/v1')) url += '/v1';
            const res = await fetch(`${url}/chat/completions`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${config.apiKey}`, 'Content-Type': 'application/json' },
                body: JSON.stringify({ model: config.model, messages: [{role:"user", content:fullPrompt}], temperature:0.7 })
            });
            const data = await res.json();
            return data.choices[0].message.content;
        } else {
            if(typeof window.generateQuiet === 'function') return await window.generateQuiet(fullPrompt);
            if(window.SillyTavern?.getContext().generateQuiet) return await window.SillyTavern.getContext().generateQuiet(fullPrompt);
            const params = window.SillyTavern?.getContext().generation_settings_params || {};
            const res = await fetch('/api/generate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'X-CSRF-Token': getCookie('X-CSRF-Token') },
                body: JSON.stringify({ prompt: fullPrompt, quiet: true, ...params })
            });
            const data = await res.json();
            return data.results[0].text;
        }
    }
    function getCookie(n){const m=document.cookie.match(new RegExp('(^| )'+n+'=([^;]+)'));return m?m[2]:'';}


    // ================= 3. UI 构建 (带刷新按钮的设置页) =================

    function createUI() {
        [FLOAT_BTN_ID, MENU_ID, THEATER_ID, SETTINGS_ID, FAV_PANEL_ID, FULLSCREEN_ID].forEach(id => {
            const el = document.getElementById(id); if(el) el.remove();
        });

        // 1. 悬浮球
        const btn = document.createElement('div');
        btn.id = FLOAT_BTN_ID; btn.className = 'jb-fixed'; btn.innerHTML = '📦';
        document.body.appendChild(btn);

        // 2. 全屏层
        const fsLayer = document.createElement('div');
        fsLayer.id = FULLSCREEN_ID;
        fsLayer.innerHTML = `<div class="jb-fs-wrapper"><div class="jb-fs-close">×</div><div id="jb-fs-content" class="jb-fs-content jb-html-content"></div></div>`;
        document.body.appendChild(fsLayer);
        fsLayer.querySelector('.jb-fs-close').onclick = () => fsLayer.style.display = 'none';

        // 3. 辅助面板函数
        const createPanel = (id, title, html, backTarget) => {
            const div = document.createElement('div');
            div.id = id; div.className = 'jb-panel jb-fixed';
            div.style.top = '100px'; div.style.left = '20px';
            const backBtn = backTarget ? `<span class="jb-back" style="cursor:pointer;margin-right:8px;">⬅</span>` : '';
            div.innerHTML = `<div class="jb-header jb-drag-head">${backBtn}<span>${title}</span><span class="jb-close" style="cursor:pointer;">×</span></div>${html}`;
            document.body.appendChild(div);
            div.querySelector('.jb-close').onclick = () => div.style.display = 'none';
            if(backTarget) div.querySelector('.jb-back').onclick = () => switchPanel(id, backTarget);
            enableDrag(div, div.querySelector('.jb-header'));
            return div;
        };

        // 4. 主菜单
        const menu = createPanel(MENU_ID, '📦 军师百宝箱', `
            <div class="jb-body jb-grid">
                <div class="jb-card" id="go-theater"><div style="font-size:24px">🎬</div><div>小剧场</div></div>
                <div class="jb-card" id="go-favs"><div style="font-size:24px">⭐</div><div>收藏夹</div></div>
                <div class="jb-card" id="go-settings"><div style="font-size:24px">⚙️</div><div>设置</div></div>
            </div>
        `);

        // 5. 设置 (修复：加回刷新按钮)
        const settings = createPanel(SETTINGS_ID, '⚙️ 设置', `
            <div class="jb-body">
                <label><input type="checkbox" id="cfg-custom"> <b>启用独立API</b></label><hr>
                
                <div style="margin-bottom:10px;">
                    <div style="font-size:12px;color:#666;">API 地址:</div>
                    <input id="cfg-url" placeholder="https://api.deepseek.com">
                </div>
                
                <div style="margin-bottom:10px;">
                    <div style="font-size:12px;color:#666;">API 密钥:</div>
                    <input id="cfg-key" type="password">
                </div>
                
                <div style="margin-bottom:10px;">
                    <div style="font-size:12px;color:#666;">模型选择:</div>
                    <div style="display:flex;">
                        <select id="cfg-model"><option value="">请刷新...</option></select>
                        <button id="cfg-refresh" class="jb-btn jb-refresh-btn">🔄</button>
                    </div>
                </div>
            </div>
            <div class="jb-footer"><button id="cfg-save" class="jb-btn">💾 保存设置</button></div>
        `, MENU_ID);

        // 6. 小剧场
        const theater = createPanel(THEATER_ID, '🎬 生成器', `
            <div style="padding:10px; border-bottom:1px solid #eee; display:flex; gap:5px;">
                <button id="btn-import" class="jb-btn" style="flex:1;font-size:11px;">📂 导入文件</button>
                <button id="btn-read" class="jb-btn" style="flex:1;font-size:11px;">💾 读取挂载</button>
            </div>
            <div id="jb-chat-area" class="jb-body">
                <div class="jb-bubble" style="background:#fff7d1;">请加载模板，我会根据当前剧情生成。</div>
            </div>
            <div class="jb-footer">
                <select id="jb-select" style="margin-bottom:5px;"><option>请先加载模板...</option></select>
                <input id="jb-input" placeholder="剧情要求..." style="margin-bottom:5px;">
                <button id="jb-send" class="jb-btn jb-btn-green">✨ 立即生成</button>
            </div>
        `, MENU_ID);

        // 7. 收藏夹
        const favPanel = createPanel(FAV_PANEL_ID, '⭐ 收藏夹', `
            <div id="jb-fav-list" class="jb-body"></div>
            <div class="jb-footer"><button id="jb-clear-favs" class="jb-btn" style="background:#ff7675;">🗑️ 清空收藏</button></div>
        `, MENU_ID);

        // === 逻辑绑定 ===
        
        const switchPanel = (from, to) => {
            document.getElementById(from).style.display = 'none';
            const t = document.getElementById(to);
            t.style.display = 'flex';
            const f = document.getElementById(from);
            t.style.top = f.style.top; t.style.left = f.style.left;
        };

        btn.onclick = () => {
            const m = document.getElementById(MENU_ID);
            [THEATER_ID, SETTINGS_ID, FAV_PANEL_ID].forEach(id => document.getElementById(id).style.display='none');
            m.style.display = (m.style.display === 'flex' ? 'none' : 'flex');
        };
        enableDrag(btn, btn);

        // 菜单
        document.getElementById('go-theater').onclick = () => switchPanel(MENU_ID, THEATER_ID);
        document.getElementById('go-favs').onclick = () => { renderFavs(); switchPanel(MENU_ID, FAV_PANEL_ID); };
        document.getElementById('go-settings').onclick = () => {
            document.getElementById('cfg-custom').checked = config.useCustomApi;
            document.getElementById('cfg-url').value = config.apiUrl || '';
            document.getElementById('cfg-key').value = config.apiKey || '';
            // 尝试恢复下拉框显示
            if(config.model) document.getElementById('cfg-model').innerHTML = `<option>${config.model}</option>`;
            switchPanel(MENU_ID, SETTINGS_ID);
        };

        // 设置页逻辑 (✅ 刷新按钮回归)
        document.getElementById('cfg-refresh').onclick = fetchAiModels;
        
        document.getElementById('cfg-save').onclick = () => {
            config.useCustomApi = document.getElementById('cfg-custom').checked;
            config.apiUrl = document.getElementById('cfg-url').value;
            config.apiKey = document.getElementById('cfg-key').value;
            config.model = document.getElementById('cfg-model').value;
            localStorage.setItem(KEY_CONFIG, JSON.stringify(config));
            alert("保存成功");
            switchPanel(SETTINGS_ID, MENU_ID);
        };

        // 小剧场导入
        document.getElementById('btn-import').onclick = () => {
            const input = document.createElement('input'); input.type='file'; input.accept='.json';
            input.onchange = e => {
                const r = new FileReader();
                r.onload = ev => { parseAndLoad(JSON.parse(ev.target.result)); };
                r.readAsText(e.target.files[0]);
            };
            input.click();
        };
        document.getElementById('btn-read').onclick = () => {
            if(!window.SillyTavern) return alert("酒馆未就绪");
            const ctx = SillyTavern.getContext();
            let entries = [];
            if(ctx.worldInfo?.entries) entries = ctx.worldInfo.entries;
            if(entries.length) parseAndLoad(entries.filter(e=>!e.disable));
            else alert("未找到挂载的世界书");
        };

        function parseAndLoad(raw) {
            let entries = [];
            if(raw.entries) { entries = Array.isArray(raw.entries) ? raw.entries : Object.values(raw.entries); } 
            else if(Array.isArray(raw)) { entries = raw; } 
            else { entries = Object.values(raw); }
            
            currentEntries = entries.map((e,i) => ({ name: e.comment||e.key||`#${i}`, content: e.content||e.prompt||"" })).filter(e=>e.content);
            const s = document.getElementById('jb-select');
            s.innerHTML = '<option value="r">🎲 随机</option>' + currentEntries.map((e,i)=>`<option value="${i}">${e.name}</option>`).join('');
            alert(`加载了 ${currentEntries.length} 个模板`);
        }

        // 生成
        document.getElementById('jb-send').onclick = async () => {
            if(!currentEntries.length) return alert("无模板");
            const btn = document.getElementById('jb-send');
            const chat = document.getElementById('jb-chat-area');
            const val = document.getElementById('jb-select').value;
            const req = document.getElementById('jb-input').value;
            const style = (val === 'r') ? currentEntries[Math.floor(Math.random()*currentEntries.length)] : currentEntries[val];
            
            btn.innerText = "⏳..."; btn.disabled = true;
            try {
                const fullPrompt = await buildContextPrompt(req, style.content);
                const result = await smartGenerate(fullPrompt);
                
                const bubble = document.createElement('div');
                bubble.className = 'jb-bubble';
                bubble.innerHTML = `
                    <div style="display:flex;justify-content:flex-end;margin-bottom:5px;border-bottom:1px dashed #eee;">
                        <button onclick="window.jbFull(this)" style="cursor:pointer;border:none;background:none;font-size:16px;">⛶</button>
                        <button onclick="window.jbFav(this,'${style.name}')" style="cursor:pointer;border:none;background:none;font-size:16px;">❤️</button>
                    </div>
                    <div class="jb-html-content"></div>
                `;
                renderContent(bubble.querySelector('.jb-html-content'), result);
                chat.appendChild(bubble);
                chat.scrollTop = chat.scrollHeight;
            } catch(e) { alert(e.message); }
            finally { btn.innerText = "✨ 立即生成"; btn.disabled = false; }
        };

        // 收藏夹
        window.jbFav = (btn, name) => {
            const html = btn.closest('.jb-bubble').querySelector('.jb-html-content').innerHTML;
            const fs = JSON.parse(localStorage.getItem(KEY_FAV)||"[]");
            fs.unshift({name, content:html, date:new Date().toLocaleString()});
            localStorage.setItem(KEY_FAV, JSON.stringify(fs));
            alert("已收藏");
        };
        function renderFavs() {
            const list = document.getElementById('jb-fav-list');
            const fs = JSON.parse(localStorage.getItem(KEY_FAV)||"[]");
            list.innerHTML = '';
            fs.forEach((f,i) => {
                const div = document.createElement('div');
                div.className = 'jb-bubble';
                div.innerHTML = `
                    <div style="display:flex;justify-content:space-between;color:#999;font-size:10px;margin-bottom:5px;">
                        <span>${f.name}</span>
                        <div>
                            <button onclick="window.jbFull(this)">⛶</button>
                            <button onclick="window.jbDelFav(${i})" style="color:red;">×</button>
                        </div>
                    </div>
                    <div class="jb-html-content" style="max-height:80px;overflow:hidden;"></div>
                `;
                renderContent(div.querySelector('.jb-html-content'), f.content);
                list.appendChild(div);
            });
        }
        window.jbDelFav = (i) => {
            const fs = JSON.parse(localStorage.getItem(KEY_FAV)||"[]");
            fs.splice(i,1); localStorage.setItem(KEY_FAV, JSON.stringify(fs));
            renderFavs();
        };
        document.getElementById('jb-clear-favs').onclick = () => {
            if(confirm("清空?")) { localStorage.removeItem(KEY_FAV); renderFavs(); }
        };

        // 全屏
        window.jbFull = (btn) => {
            const html = btn.closest('.jb-bubble') ? btn.closest('.jb-bubble').querySelector('.jb-html-content').innerHTML : btn.closest('.jb-fav-item').querySelector('.jb-html-content').innerHTML; // 简单兼容
            const fs = document.getElementById(FULLSCREEN_ID);
            const content = document.getElementById('jb-fs-content');
            content.innerHTML = '';
            fs.style.display = 'flex';
            renderContent(content, html);
        };

        // 拖拽
        function enableDrag(el, handle) {
            let isD=false, sX, sY, iL, iT;
            const start = e => {
                const evt = e.touches ? e.touches[0] : e;
                if(e.target !== handle && !handle.contains(e.target)) return;
                isD=true; sX=evt.clientX; sY=evt.clientY; iL=el.offsetLeft; iT=el.offsetTop;
                if(e.cancelable && !e.touches) e.preventDefault();
            };
            const move = e => {
                if(!isD) return;
                const evt = e.touches ? e.touches[0] : e;
                if(e.cancelable) e.preventDefault();
                el.style.left = (iL + evt.clientX - sX) + 'px';
                el.style.top = (iT + evt.clientY - sY) + 'px';
            };
            const end = () => isD=false;
            handle.addEventListener('mousedown', start);
            window.addEventListener('mousemove', move);
            window.addEventListener('mouseup', end);
            handle.addEventListener('touchstart', start, {passive:false});
            window.addEventListener('touchmove', move, {passive:false});
            window.addEventListener('touchend', end);
        }
    }

    setTimeout(createUI, 1000);
})();
