// =============================================================
//  军师百宝箱 (TreasureBox) - V17.0 插件最终版
//  包含：全局世界书读取 + 万能格式解析 + 自由拖拽 + 蓝黄UI
// =============================================================

(function() {
    console.log("🚀 军师百宝箱 V17.0 (插件版) 已加载...");

    // === 0. ID & 变量定义 ===
    const FLOAT_BTN_ID = 'jb-plugin-btn-v17';
    const MENU_BOX_ID  = 'jb-plugin-menu-v17';
    const THEATER_ID   = 'jb-plugin-theater-v17';
    
    // 内存变量
    let currentEntries = [];
    const STORAGE_KEY_FAV = 'jb_plugin_favs_v17';

    // === 1. 注入 CSS (蓝黄配色 + 暴力层级) ===
    const style = document.createElement('style');
    style.innerHTML = `
        /* --- 核心：强制置顶 --- */
        .jb-fixed-top { position: fixed !important; z-index: 2147483647 !important; }
        .jb-draggable-header { cursor: move; user-select: none; }

        /* --- 悬浮球 --- */
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

        /* --- 面板外壳 --- */
        .jb-panel {
            width: 340px; height: 520px;
            min-width: 280px; min-height: 350px;
            background: #fff; border: 3px solid #74b9ff; border-radius: 15px;
            box-shadow: 0 10px 40px rgba(0,0,0,0.4);
            display: none; flex-direction: column;
            font-family: "Microsoft YaHei", sans-serif;
            resize: both !important; overflow: hidden !important;
        }

        /* --- 标题栏 --- */
        .jb-header {
            background: #74b9ff; color: white; padding: 12px 15px;
            font-weight: bold; font-size: 15px;
            display: flex; justify-content: space-between; align-items: center;
        }

        /* --- 主菜单 --- */
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
        .jb-icon { font-size: 28px; }
        .jb-label { font-size: 13px; font-weight: bold; }

        /* --- 小剧场工具栏 --- */
        .jb-toolbar {
            padding: 8px; background: #fffbf0; border-bottom: 1px solid #ffeaa7;
            display: flex; flex-direction: column; gap: 8px;
        }
        .jb-btn-small {
            background: #fff; border: 1px solid #ffeaa7; color: #e67e22;
            padding: 4px 10px; border-radius: 4px; font-size: 12px; cursor: pointer; font-weight: bold;
        }
        .jb-btn-small:hover { background: #fff7d1; }

        /* --- 内容区 --- */
        #jb-chat-area { flex: 1; overflow-y: auto; padding: 10px; background: #fffdf5; }
        
        .jb-bubble {
            background: #fff; border: 1px solid #b2ebf2; border-radius: 12px;
            padding: 12px; margin-bottom: 10px; box-shadow: 0 2px 5px rgba(0,0,0,0.03);
            font-size: 13px; color: #555; position: relative;
        }
        
        /* --- 底部 --- */
        .jb-footer {
            padding: 10px; background: #fff; border-top: 1px solid #eee;
            display: flex; flex-direction: column; gap: 8px;
        }
        #jb-select {
            width: 100%; padding: 8px; border: 2px solid #74b9ff; border-radius: 8px;
            background: #f0f9ff; color: #0984e3; font-size: 12px; font-weight: bold; outline: none;
        }
        .jb-input-row { display: flex; gap: 5px; }
        #jb-input { flex: 1; border: 1px solid #ddd; border-radius: 20px; padding: 6px 12px; outline: none; background: #fafafa; }
        #jb-send { background: #74b9ff; color: white; border: none; border-radius: 20px; padding: 0 15px; cursor: pointer; font-weight: bold; }
        
        /* 折叠模式 */
        .jb-panel.collapsed { height: 45px !important; resize: none !important; }
        .jb-panel.collapsed > *:not(.jb-header) { display: none !important; }
    `;
    document.head.appendChild(style);


    // ================= 2. 核心逻辑：API 直连 & 解析 =================
    
    // 🔥 A. 获取所有世界书列表 (全局)
        // ================= 2. 核心逻辑：双通道读取 (API + 内存降级) =================
    
    // 🔍 辅助：获取酒馆的安全令牌 (解决连接被拒问题)
    function getCsrfToken() {
        // 尝试从全局变量获取
        if (window.csrfToken) return window.csrfToken;
        // 尝试从 Cookie 获取
        const match = document.cookie.match(new RegExp('(^| )X-CSRF-Token=([^;]+)'));
        return match ? match[2] : '';
    }

    // 🔥 A. 获取所有世界书列表 (增强版)
    async function fetchBookList() {
        const btn = document.getElementById('jb-refresh-books');
        const sel = document.getElementById('jb-book-select');
        const status = document.getElementById('jb-status');
        if(btn) btn.innerText = "⏳";
        
        sel.innerHTML = `<option value="">📡 正在连接酒馆...</option>`;

        try {
            // 尝试通道 1：通过 API 获取全部文件 (带上 Token)
            const response = await fetch('/api/worldinfo/get_names', { 
                method: 'POST', 
                headers: { 
                    'Content-Type': 'application/json',
                    'X-CSRF-Token': getCsrfToken() // 🔑 关键修复：带上通行证
                },
                body: JSON.stringify({}) 
            });

            if (!response.ok) throw new Error(`API错误 ${response.status}`);
            
            const data = await response.json();
            // 兼容各种乱七八糟的返回格式
            let list = data.file_names || data.list || (Array.isArray(data) ? data : []);

            list = list.filter(n => n.toLowerCase().endsWith('.json')).sort();

            if (list.length > 0) {
                let html = `<option value="">📚 请选择世界书 (共${list.length}本)</option>`;
                list.forEach(name => {
                    const displayName = name.replace(/\.json$/i, '');
                    html += `<option value="${name}" data-source="api">${displayName}</option>`;
                });
                sel.innerHTML = html;
                status.innerText = `✅ 已连接后台 (API模式)`;
            } else {
                throw new Error("后台列表为空");
            }

        } catch (e) {
            console.warn("API读取失败，切换到内存模式:", e);
            
            // ⚠️ 通道 2 (保底)：如果API失败，直接读取当前聊天已激活的世界书
            if (window.SillyTavern && SillyTavern.getContext) {
                const ctx = SillyTavern.getContext();
                // 强制抓取当前生效的 entries
                const activeEntries = ctx.worldInfo && ctx.worldInfo.entries ? ctx.worldInfo.entries : [];
                
                if (activeEntries.length > 0) {
                    sel.innerHTML = `<option value="active_memory" data-source="memory">💾 当前已挂载的世界书</option>`;
                    status.innerText = `⚠️ API受阻，仅读取当前挂载`;
                    // 把当前的直接存入，方便后续读取
                    window._jb_temp_active = activeEntries; 
                } else {
                    sel.innerHTML = `<option value="">❌ 无法读取 (请先在酒馆挂载世界书)</option>`;
                    status.innerText = "❌ 连接失败";
                }
            } else {
                alert("无法连接酒馆，请确保页面已加载完毕！");
            }
        } finally {
            if(btn) btn.innerText = "🔄";
        }
    }

    // 🔥 B. 加载指定书内容 (兼容 API 和 内存模式)
    async function loadSelectedBook() {
        const sel = document.getElementById('jb-book-select');
        const bookName = sel.value;
        const sourceType = sel.options[sel.selectedIndex].getAttribute('data-source'); // 判断来源
        
        if (!bookName) return;

        const stStatus = document.getElementById('jb-status');
        stStatus.innerText = "⏳ 解析中...";

        let rawEntries = [];

        try {
            if (sourceType === 'api') {
                // === 来源 A: API 读取 ===
                const response = await fetch('/api/worldinfo/get', {
                    method: 'POST',
                    headers: { 
                        'Content-Type': 'application/json',
                        'X-CSRF-Token': getCsrfToken() 
                    },
                    body: JSON.stringify({ name: bookName })
                });
                const json = await response.json();
                const data = json.data || json;
                
                // 暴力解构 entries
                if (data.entries) {
                    rawEntries = Array.isArray(data.entries) ? data.entries : Object.values(data.entries);
                } else {
                    rawEntries = Array.isArray(data) ? data : Object.values(data);
                }

            } else if (sourceType === 'memory') {
                // === 来源 B: 内存保底读取 ===
                rawEntries = window._jb_temp_active || [];
                // 如果内存是空的，再尝试抓一次
                if (rawEntries.length === 0 && window.SillyTavern) {
                     const ctx = SillyTavern.getContext();
                     if(ctx.worldInfo) rawEntries = ctx.worldInfo.entries;
                }
            }

            // === 统一清洗数据 ===
            const cleanEntries = [];
            
            // 转换为数组处理 (以防万一)
            const entriesArray = Array.isArray(rawEntries) ? rawEntries : Object.values(rawEntries);

            entriesArray.forEach((e, idx) => {
                if (!e || typeof e !== 'object') return;
                // 只要未禁用 (API模式下可能没有disable字段，默认当做启用)
                if (e.disable === true) return; 

                const content = e.content || e.prompt || "";
                if (!content.trim()) return;

                let name = e.comment;
                if (!name && e.key) {
                    name = Array.isArray(e.key) ? e.key[0] : e.key;
                }
                if (!name) name = `样式 #${idx + 1}`;

                cleanEntries.push({ name, content });
            });

            if (cleanEntries.length === 0) {
                stStatus.innerText = "⚠️ 该书没有有效内容";
                return;
            }

            // 存入全局变量供生成使用
            currentEntries = cleanEntries;
            
            // 更新 UI
            const displayName = sourceType === 'memory' ? '当前挂载' : bookName.replace(/\.json$/i, '');
            updateStyleDropdown(displayName);

        } catch (e) {
            console.error(e);
            stStatus.innerText = "❌ 读取错误";
            alert("读取失败: " + e.message);
        }
    }


    // 🔥 C. 更新样式列表
    function updateStyleDropdown(bookTitle) {
        const sel = document.getElementById('jb-select');
        const st = document.getElementById('jb-status');
        
        st.innerText = `✅ 已载入: ${currentEntries.length} 个模板`;
        
        let html = `<option value="random">🎲 随机抽取 (默认)</option>`;
        if (currentEntries.length > 0) {
            html += `<optgroup label="📑 ${bookTitle}">`;
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

        // --- 悬浮球 ---
        const btn = document.createElement('div');
        btn.id = FLOAT_BTN_ID;
        btn.className = 'jb-fixed-top';
        btn.innerHTML = '📦';
        btn.title = "打开百宝箱";
        document.body.appendChild(btn);

        // --- 主菜单 ---
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

        // --- 小剧场面板 ---
        const theater = document.createElement('div');
        theater.id = THEATER_ID;
        theater.className = 'jb-panel jb-fixed-top';
        theater.style.top = '100px'; theater.style.left = '20px';
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
                <div style="display:flex; gap:5px; width:100%;">
                    <select id="jb-book-select" style="flex:1; padding:4px; border:1px solid #ffeaa7; border-radius:5px; font-size:11px; outline:none;">
                        <option value="">⏳ 连接中...</option>
                    </select>
                    <button class="jb-btn-small" id="jb-refresh-books" title="刷新列表">🔄</button>
                </div>
                <div id="jb-status" style="font-size:10px; color:#aaa; text-align:center;">请选择世界书</div>
            </div>

            <div id="jb-chat-area">
                <div class="jb-bubble" style="background:#fff7d1; border-color:#ffeaa7;">
                    <b>👋 欢迎主公！</b><br>
                    1. 上方选择酒馆里的任意世界书。<br>
                    2. 下方选择模板，或随机。<br>
                    3. 窗口可自由拖拽。
                </div>
            </div>

            <div class="jb-footer">
                <select id="jb-select"></select>
                <div class="jb-input-row">
                    <input type="text" id="jb-input" placeholder="输入剧情要求 (可选)...">
                    <button id="jb-send">生成</button>
                </div>
                <button class="jb-btn-small" id="jb-view-fav" style="width:100%; margin-top:5px;">⭐ 查看历史记录</button>
            </div>
        `;
        document.body.appendChild(theater);

        // === 绑定事件 ===

        // 导航
        btn.onclick = () => {
            const m = document.getElementById(MENU_BOX_ID);
            const t = document.getElementById(THEATER_ID);
            if (t.style.display === 'flex') {
                t.style.display = 'none'; m.style.display = 'flex';
            } else {
                m.style.display = (m.style.display === 'flex' ? 'none' : 'flex');
            }
        };
        document.getElementById('btn-goto-theater').onclick = () => {
            document.getElementById(MENU_BOX_ID).style.display = 'none';
            const t = document.getElementById(THEATER_ID);
            t.style.display = 'flex';
            // 同步位置
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

        // 书库操作
        document.getElementById('jb-refresh-books').onclick = fetchBookList;
        document.getElementById('jb-book-select').onchange = loadSelectedBook;
        
        // 折叠
        document.getElementById('jb-collapse').onclick = (e) => {
            const t = document.getElementById(THEATER_ID);
            t.classList.toggle('collapsed');
            e.target.innerText = t.classList.contains('collapsed') ? '▲' : '▼';
        };

        // 生成
        document.getElementById('jb-send').onclick = async () => {
            if (currentEntries.length === 0) { alert("⚠️ 请先在上方选择一本世界书！"); return; }
            
            const val = document.getElementById('jb-select').value;
            const req = document.getElementById('jb-input').value;
            const chat = document.getElementById('jb-chat-area');
            const btn = document.getElementById('jb-send');

            if (!window.SillyTavern) { alert("❌ 未检测到酒馆对象"); return; }

            // 随机/指定
            let targetStyle = null;
            if (val === 'random') {
                const randIdx = Math.floor(Math.random() * currentEntries.length);
                targetStyle = currentEntries[randIdx];
            } else {
                targetStyle = currentEntries[parseInt(val)];
            }

            btn.innerText = "⏳"; btn.disabled = true;
            chat.innerHTML += `<div class="jb-bubble" style="color:#aaa;font-size:12px;">🎥 应用样式：${targetStyle.name}...</div>`;
            chat.scrollTop = chat.scrollHeight;

            try {
                const context = SillyTavern.getContext();
                const charName = context.characters[context.characterId].name;
                const lastMes = context.chat.length > 0 ? context.chat[context.chat.length-1].mes : "";

                const prompt = `
                [Instruction: Generate content strictly following the template format below.]
                
                [TEMPLATE STYLE]:
                ${targetStyle.content}
                
                [CONTEXT]:
                Character: ${charName}
                Story: "${lastMes}"
                User Request: "${req}"
                
                Fill the template creatively now.
                `;

                const result = await SillyTavern.generateRaw(prompt, "junshi_v17");
                
                chat.innerHTML += `
                    <div class="jb-bubble">
                        <div style="font-size:10px; color:#74b9ff; margin-bottom:5px;">🎨 ${targetStyle.name}</div>
                        <div style="border-top:1px dashed #b2ebf2; padding-top:5px;">${result}</div>
                        <button class="jb-btn-small" onclick="window.jbSaveFav(this, '${targetStyle.name}')" style="margin-top:5px; width:100%;">❤️ 收藏</button>
                    </div>`;
                chat.scrollTop = chat.scrollHeight;

            } catch(e) {
                chat.innerHTML += `<div style="color:red;">❌ 生成失败: ${e}</div>`;
            } finally {
                btn.innerText = "生成"; btn.disabled = false;
            }
        };
        
        // 收藏
        document.getElementById('jb-view-fav').onclick = () => {
            const favs = JSON.parse(localStorage.getItem(STORAGE_KEY_FAV)||"[]");
            let h = `<div class="jb-bubble" style="background:#e1f5fe;"><b>⭐ 历史记录 (${favs.length})</b></div>`;
            favs.forEach((f,i)=> h+=`<div class="jb-bubble" style="border-left:3px solid #fab1a0;"><div style="font-size:10px;color:#999;">${f.style}<span style="float:right;cursor:pointer;color:red;" onclick="window.jbDelFav(${i})">🗑️</span></div><div style="max-height:80px;overflow-y:auto;">${f.content}</div></div>`);
            h+=`<button class="jb-btn-small" onclick="document.getElementById('jb-chat-area').innerHTML=''" style="width:100%;">清屏</button>`;
            document.getElementById('jb-chat-area').innerHTML = h;
        };

        // 🟢 绑定拖拽
        makeDraggable(btn, btn); 
        makeDraggable(menu, menu.querySelector('.jb-header')); 
        makeDraggable(theater, document.getElementById('theater-header'));

        // 初始化加载
        setTimeout(fetchBookList, 1000);
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

    // 🔥 暴力拖拽逻辑 (使用 setProperty 覆盖 !important)
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
            // 覆盖 CSS 的 !important
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

    // 启动
    setTimeout(createUI, 2000);

})();
