// =============================================================
//  军师百宝箱 V25.0 - 体验修正版
//  修复：上下文关联丢失 | 全屏遮挡 | 拖拽失效 | 尺寸溢出
// =============================================================

(function() {
    console.log("🚀 军师百宝箱 V25.0 已加载...");

    // === 0. ID 定义 ===
    const FLOAT_BTN_ID = 'jb-btn-v25';
    const MENU_ID      = 'jb-menu-v25';
    const THEATER_ID   = 'jb-theater-v25';
    const SETTINGS_ID  = 'jb-settings-v25';
    const FAV_PANEL_ID = 'jb-fav-panel-v25';
    const FULLSCREEN_ID= 'jb-fullscreen-v25';

    const KEY_LIB = 'junshi_box_lib';
    const KEY_FAV = 'junshi_box_favs_v25';
    const KEY_CONFIG = 'junshi_box_config_v23';

    // 状态变量
    let config = { apiUrl: '', apiKey: '', model: '', useCustomApi: false };
    let currentEntries = [];
    
    // 加载配置
    try { Object.assign(config, JSON.parse(localStorage.getItem(KEY_CONFIG))); } catch(e){}

    // === 1. CSS (核心修复：层级与尺寸) ===
    const style = document.createElement('style');
    style.innerHTML = `
        /* 基础层级 2147483640 */
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

        /* 面板 (尺寸优化) */
        .jb-panel {
            width: 320px; height: 500px; /* 默认改小，不占满屏幕 */
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

        /* 全屏层 (修复：层级最高，并在弹窗之上) */
        #${FULLSCREEN_ID} {
            display: none; position: fixed; top: 0; left: 0; 
            width: 100vw; height: 100vh;
            background: rgba(0,0,0,0.9); 
            z-index: 2147483647 !important; /* 比面板高 */
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
            flex: 1; overflow-y: auto; padding: 20px; /* 修复：内容可滚动 */
            width: 100%; box-sizing: border-box;
        }

        /* 内容区优化 */
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
        .jb-html-content { 
            width: 100%; overflow-x: hidden; /* 防止横向撑爆 */
            word-wrap: break-word; 
        }
        /* 强制约束生成内容的图片最大宽度 */
        .jb-html-content img { max-width: 100% !important; height: auto !important; }

        /* 底部 */
        .jb-footer { padding: 8px; background: #fff; border-top: 1px solid #eee; display: flex; flex-direction: column; gap: 6px; flex-shrink: 0; }
        input, select { width: 100%; padding: 6px; border: 1px solid #ddd; border-radius: 4px; outline: none; font-size: 12px; box-sizing: border-box; }
        .jb-btn { width: 100%; background: #74b9ff; color: white; border: none; border-radius: 4px; padding: 8px; cursor: pointer; font-weight: bold; }
        .jb-btn:hover { background: #0984e3; }
        .jb-btn-green { background: #00b894; }
        .jb-btn-green:hover { background: #00a884; }
    `;
    document.head.appendChild(style);


    // ================= 2. 核心逻辑：上下文抓取 & 交互 =================

    // 激活 HTML 中的脚本 (修复交互)
    function executeScripts(container) {
        container.querySelectorAll('script').forEach(old => {
            const newScript = document.createElement('script');
            Array.from(old.attributes).forEach(attr => newScript.setAttribute(attr.name, attr.value));
            newScript.appendChild(document.createTextNode(old.innerHTML));
            old.parentNode.replaceChild(newScript, old);
        });
    }

    // 渲染内容到容器
    function renderContent(target, html) {
        // 清洗 Markdown
        const clean = html.replace(/```html/gi, '').replace(/```/g, '').trim();
        target.innerHTML = clean;
        try { executeScripts(target); } catch(e) { console.warn(e); }
    }

    // 🔥 核心修复：带上下文的 Prompt 构建
    async function buildContextPrompt(req, styleContent) {
        if (!window.SillyTavern || !SillyTavern.getContext) return `Req: ${req}\nTemplate: ${styleContent}`;

        const ctx = SillyTavern.getContext();
        const charName = ctx.characters[ctx.characterId].name || "Character";
        const persona = ctx.characters[ctx.characterId].persona || "";
        const userPersona = ctx.userPersona || "";
        
        // 获取最后 3 条聊天记录 (确保剧情连贯)
        let chatHistory = "";
        if (ctx.chat && ctx.chat.length > 0) {
            const recent = ctx.chat.slice(-3); // 取最后3条
            recent.forEach(msg => {
                chatHistory += `${msg.is_user ? 'User' : charName}: ${msg.mes}\n`;
            });
        }

        return `
        [Instruction: Generate a specialized HTML scene based on the template.]
        
        [STORY CONTEXT]
        Character: ${charName}
        Persona: ${persona}
        User Context: ${userPersona}
        
        [RECENT CHAT HISTORY]
        ${chatHistory}
        
        [USER REQUEST]
        "${req}"
        
        [REQUIRED FORMAT TEMPLATE]
        ${styleContent}
        
        Generate the HTML code now. Ensure it matches the character's tone and current story situation.
        `;
    }

    // 智能生成 (API/本地)
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
            // 尝试酒馆内置
            if(typeof window.generateQuiet === 'function') return await window.generateQuiet(fullPrompt);
            if(typeof window.generate_quiet === 'function') return await window.generate_quiet(fullPrompt);
            if(window.SillyTavern?.getContext().generateQuiet) return await window.SillyTavern.getContext().generateQuiet(fullPrompt);
            // 最后的核弹：API直连本地
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


    // ================= 3. UI 构建 (修复层级与全屏) =================

    function createUI() {
        [FLOAT_BTN_ID, MENU_ID, THEATER_ID, SETTINGS_ID, FAV_PANEL_ID, FULLSCREEN_ID].forEach(id => {
            const el = document.getElementById(id); if(el) el.remove();
        });

        // 1. 悬浮球
        const btn = document.createElement('div');
        btn.id = FLOAT_BTN_ID; btn.className = 'jb-fixed'; btn.innerHTML = '📦';
        document.body.appendChild(btn);

        // 2. 全屏层 (结构优化)
        const fsLayer = document.createElement('div');
        fsLayer.id = FULLSCREEN_ID;
        fsLayer.innerHTML = `
            <div class="jb-fs-wrapper">
                <div class="jb-fs-close">×</div>
                <div id="jb-fs-content" class="jb-fs-content jb-html-content"></div>
            </div>
        `;
        document.body.appendChild(fsLayer);
        fsLayer.querySelector('.jb-fs-close').onclick = () => fsLayer.style.display = 'none';

        // 3. 辅助函数：创建面板
        const createPanel = (id, title, html, backTarget) => {
            const div = document.createElement('div');
            div.id = id; div.className = 'jb-panel jb-fixed';
            div.style.top = '100px'; div.style.left = '20px';
            const backBtn = backTarget ? `<span class="jb-back" style="cursor:pointer;margin-right:8px;">⬅</span>` : '';
            div.innerHTML = `<div class="jb-header jb-drag-head">${backBtn}<span>${title}</span><span class="jb-close" style="cursor:pointer;">×</span></div>${html}`;
            document.body.appendChild(div);
            
            // 绑定事件
            div.querySelector('.jb-close').onclick = () => div.style.display = 'none';
            if(backTarget) div.querySelector('.jb-back').onclick = () => switchPanel(id, backTarget);
            
            // 绑定拖拽 (修复版：限制Header)
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

        // 5. 小剧场
        const theater = createPanel(THEATER_ID, '🎬 生成器', `
            <div style="padding:10px; border-bottom:1px solid #eee; display:flex; gap:5px;">
                <button id="btn-import" class="jb-btn" style="flex:1;font-size:11px;">📂 导入文件</button>
                <button id="btn-read" class="jb-btn" style="flex:1;font-size:11px;">💾 读取挂载</button>
            </div>
            <div id="jb-chat-area" class="jb-body">
                <div class="jb-bubble" style="background:#fff7d1;">请加载模板，我会根据当前对话生成。</div>
            </div>
            <div class="jb-footer">
                <select id="jb-select" style="margin-bottom:5px;"><option>请先加载模板...</option></select>
                <input id="jb-input" placeholder="剧情要求..." style="margin-bottom:5px;">
                <button id="jb-send" class="jb-btn jb-btn-green">✨ 立即生成</button>
            </div>
        `, MENU_ID);

        // 6. 收藏夹
        const favPanel = createPanel(FAV_PANEL_ID, '⭐ 收藏夹', `
            <div id="jb-fav-list" class="jb-body"></div>
            <div class="jb-footer">
                <button id="jb-clear-favs" class="jb-btn" style="background:#ff7675;">🗑️ 清空收藏</button>
            </div>
        `, MENU_ID);

        // 7. 设置
        const settings = createPanel(SETTINGS_ID, '⚙️ 设置', `
            <div class="jb-body">
                <label><input type="checkbox" id="cfg-custom"> 开启独立API</label><hr>
                API地址: <input id="cfg-url" placeholder="http://..."><br><br>
                API密钥: <input id="cfg-key" type="password"><br><br>
                模型: <input id="cfg-model" placeholder="gpt-3.5-turbo">
            </div>
            <div class="jb-footer"><button id="cfg-save" class="jb-btn">保存</button></div>
        `, MENU_ID);

        // === 逻辑绑定 ===
        
        // 切换面板
        const switchPanel = (from, to) => {
            document.getElementById(from).style.display = 'none';
            const t = document.getElementById(to);
            t.style.display = 'flex';
            // 保持位置同步
            const f = document.getElementById(from);
            t.style.top = f.style.top; t.style.left = f.style.left;
        };

        // 悬浮球
        btn.onclick = () => {
            const m = document.getElementById(MENU_ID);
            // 关掉其他的
            [THEATER_ID, SETTINGS_ID, FAV_PANEL_ID].forEach(id => document.getElementById(id).style.display='none');
            m.style.display = (m.style.display === 'flex' ? 'none' : 'flex');
        };
        enableDrag(btn, btn);

        // 菜单跳转
        document.getElementById('go-theater').onclick = () => switchPanel(MENU_ID, THEATER_ID);
        document.getElementById('go-favs').onclick = () => { renderFavs(); switchPanel(MENU_ID, FAV_PANEL_ID); };
        document.getElementById('go-settings').onclick = () => {
            document.getElementById('cfg-custom').checked = config.useCustomApi;
            document.getElementById('cfg-url').value = config.apiUrl;
            document.getElementById('cfg-key').value = config.apiKey;
            document.getElementById('cfg-model').value = config.model;
            switchPanel(MENU_ID, SETTINGS_ID);
        };

        // 保存设置
        document.getElementById('cfg-save').onclick = () => {
            config.useCustomApi = document.getElementById('cfg-custom').checked;
            config.apiUrl = document.getElementById('cfg-url').value;
            config.apiKey = document.getElementById('cfg-key').value;
            config.model = document.getElementById('cfg-model').value;
            localStorage.setItem(KEY_CONFIG, JSON.stringify(config));
            alert("保存成功");
            switchPanel(SETTINGS_ID, MENU_ID);
        };

        // 小剧场功能
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
            // 暴力兼容
            if(raw.entries) {
                entries = Array.isArray(raw.entries) ? raw.entries : Object.values(raw.entries);
            } else if(Array.isArray(raw)) {
                entries = raw;
            } else {
                entries = Object.values(raw);
            }
            
            currentEntries = entries.map((e,i) => ({
                name: e.comment || e.key || `#${i}`,
                content: e.content || e.prompt || ""
            })).filter(e => e.content);

            const s = document.getElementById('jb-select');
            s.innerHTML = '<option value="r">🎲 随机</option>' + currentEntries.map((e,i)=>`<option value="${i}">${e.name}</option>`).join('');
            alert(`加载了 ${currentEntries.length} 个模板`);
        }

        // 🔥 生成 (带上下文)
        document.getElementById('jb-send').onclick = async () => {
            if(!currentEntries.length) return alert("无模板");
            const btn = document.getElementById('jb-send');
            const chat = document.getElementById('jb-chat-area');
            const val = document.getElementById('jb-select').value;
            const req = document.getElementById('jb-input').value;
            
            const style = (val === 'r') ? currentEntries[Math.floor(Math.random()*currentEntries.length)] : currentEntries[val];
            
            btn.innerText = "⏳..."; btn.disabled = true;
            try {
                // 1. 构建 Prompt (含上下文)
                const fullPrompt = await buildContextPrompt(req, style.content);
                // 2. 生成
                const result = await smartGenerate(fullPrompt);
                // 3. 渲染
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

        // 收藏功能
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

        // 全屏逻辑
        window.jbFull = (btn) => {
            const html = btn.closest('.jb-bubble').querySelector('.jb-html-content').innerHTML;
            const fs = document.getElementById(FULLSCREEN_ID);
            const content = document.getElementById('jb-fs-content');
            content.innerHTML = ''; // 清空旧的
            fs.style.display = 'flex';
            renderContent(content, html); // 重新注入以激活脚本
        };

        // 拖拽逻辑 (修复版：限制把手)
        function enableDrag(el, handle) {
            let isD=false, sX, sY, iL, iT;
            const start = e => {
                // 触摸或鼠标
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
