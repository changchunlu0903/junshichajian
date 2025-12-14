// =============================================================
//  军师百宝箱 V15.0 - 插件版
//  架构：悬浮球 -> 主菜单(百宝箱) -> 功能子页面(小剧场等)
// =============================================================

(function() {
    console.log("🚀 军师百宝箱 V15.0 已加载...");

    // === ID 定义 ===
    const FLOAT_BTN_ID = 'jb-float-btn';      // 悬浮球
    const MENU_BOX_ID  = 'jb-main-menu';      // 主菜单
    const THEATER_ID   = 'jb-theater-box';    // 小剧场面板
    
    // === 存储 Key ===
    const KEY_LIB = 'junshi_box_lib';
    const KEY_FAV = 'junshi_box_fav';

    // === 1. 注入 CSS (蓝黄配色 + 百宝箱布局) ===
    const style = document.createElement('style');
    style.innerHTML = `
        /* --- 通用：强制置顶与拖拽 --- */
        .jb-fixed-top {
            position: fixed !important; z-index: 2147483647 !important;
        }
        .jb-draggable-header {
            cursor: move; user-select: none;
        }

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

        /* --- 通用面板外壳 (复刻你的CSS) --- */
        .jb-panel {
            width: 340px; height: 520px;
            min-width: 280px; min-height: 350px;
            background: #fff; border: 3px solid #74b9ff; border-radius: 15px;
            box-shadow: 0 10px 40px rgba(0,0,0,0.3);
            display: none; flex-direction: column;
            font-family: "Microsoft YaHei", sans-serif;
            resize: both; overflow: hidden;
        }

        /* --- 标题栏 --- */
        .jb-header {
            background: #74b9ff; color: white; padding: 12px 15px;
            font-weight: bold; font-size: 15px;
            display: flex; justify-content: space-between; align-items: center;
        }

        /* --- 主菜单 (百宝箱) 特有样式 --- */
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

        /* --- 小剧场 特有样式 --- */
        .jb-toolbar {
            padding: 8px; background: #fffbf0; border-bottom: 1px solid #ffeaa7;
            display: flex; gap: 5px; align-items: center; justify-content: space-between;
        }
        .jb-btn-small {
            background: #fff; border: 1px solid #ffeaa7; color: #e67e22;
            padding: 4px 10px; border-radius: 4px; font-size: 11px; cursor: pointer;
        }
        .jb-btn-small:hover { background: #fff7d1; }

        #jb-chat-area { flex: 1; overflow-y: auto; padding: 10px; background: #fffdf5; }
        
        .jb-bubble {
            background: #fff; border: 1px solid #b2ebf2; border-radius: 12px;
            padding: 12px; margin-bottom: 10px; box-shadow: 0 2px 5px rgba(0,0,0,0.03);
            font-size: 13px; color: #555; position: relative;
        }
        
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
        
        /* 隐藏态 */
        .hidden { display: none !important; }
    `;
    document.head.appendChild(style);


    // ================= 2. 核心逻辑：JSON 解析 & 数据 =================
    
    function getLibrary() { return JSON.parse(localStorage.getItem(KEY_LIB) || "[]"); }
    function saveLibrary(data) { localStorage.setItem(KEY_LIB, JSON.stringify(data)); updateTheaterUI(); }

    // 暴力解析 (适配极光小剧场)
    function importWorldBook(file, json) {
        let rawEntries = [];
        if (json.entries) {
            rawEntries = Array.isArray(json.entries) ? json.entries : Object.values(json.entries);
        } else if (Array.isArray(json)) {
            rawEntries = json;
        } else {
            rawEntries = Object.values(json);
        }

        const clean = [];
        rawEntries.forEach(e => {
            if (!e || typeof e !== 'object') return;
            const content = e.content || e.prompt || "";
            if (!content) return;
            
            let name = e.comment;
            if (!name && e.key) name = Array.isArray(e.key) ? e.key[0] : e.key;
            if (!name) name = "未命名样式";

            clean.push({ name, content });
        });

        if (clean.length === 0) { alert("❌ 无法解析内容，请确认文件格式！"); return; }

        const lib = getLibrary();
        const bName = file.name.replace(/\.json$/i, '');
        const newLib = lib.filter(b => b.bookName !== bName);
        newLib.push({ bookName: bName, entries: clean });
        
        saveLibrary(newLib);
        alert(`✅ 导入成功！\n📚 书名：${bName}\n📄 包含 ${clean.length} 个模板`);
    }


    // ================= 3. UI 构建函数 =================

    function createUI() {
        if (document.getElementById(FLOAT_BTN_ID)) return;

        // --- A. 悬浮球 ---
        const btn = document.createElement('div');
        btn.id = FLOAT_BTN_ID;
        btn.className = 'jb-fixed-top';
        btn.innerHTML = '📦'; // 百宝箱图标
        btn.title = "打开百宝箱";
        document.body.appendChild(btn);

        // --- B. 主菜单 (百宝箱) ---
        const menu = document.createElement('div');
        menu.id = MENU_BOX_ID;
        menu.className = 'jb-panel jb-fixed-top';
        menu.style.top = '90px'; menu.style.left = '20px';
        menu.innerHTML = `
            <div class="jb-header jb-draggable-header">
                <span>📦 军师百宝箱</span>
                <span style="cursor:pointer" onclick="document.getElementById('${MENU_BOX_ID}').style.display='none'">×</span>
            </div>
            <div class="jb-grid">
                <div class="jb-menu-card" id="btn-open-theater">
                    <div class="jb-icon">🎬</div>
                    <div class="jb-label">小剧场模式</div>
                </div>
                <div class="jb-menu-card" onclick="alert('开发中...')">
                    <div class="jb-icon">🛠️</div>
                    <div class="jb-label">敬请期待</div>
                </div>
            </div>
        `;
        document.body.appendChild(menu);

        // --- C. 小剧场面板 ---
        const theater = document.createElement('div');
        theater.id = THEATER_ID;
        theater.className = 'jb-panel jb-fixed-top';
        theater.style.top = '90px'; theater.style.left = '20px';
        theater.innerHTML = `
            <div class="jb-header jb-draggable-header" id="theater-header">
                <span style="display:flex; align-items:center; gap:10px;">
                    <span id="btn-back-menu" style="cursor:pointer; font-size:18px;">⬅</span>
                    <span>🎬 小剧场生成器</span>
                </span>
                <span style="cursor:pointer" onclick="document.getElementById('${THEATER_ID}').style.display='none'">×</span>
            </div>
            
            <div class="jb-toolbar">
                <input type="file" id="jb-file" accept=".json" style="display:none;">
                <button class="jb-btn-small" onclick="document.getElementById('jb-file').click()">📥 导入样式书</button>
                <div id="jb-status" style="font-size:10px; color:#aaa;">检查中...</div>
            </div>

            <div id="jb-chat-area">
                <div class="jb-bubble" style="background:#fff7d1; border-color:#ffeaa7;">
                    <b>👋 剧场模式已就绪</b><br>
                    请选择样式，输入要求，生成内容。<br>
                    (支持导入极光小剧场等JSON文件)
                </div>
            </div>

            <div class="jb-footer">
                <select id="jb-select"></select>
                <div class="jb-input-row">
                    <input type="text" id="jb-input" placeholder="输入剧情要求...">
                    <button id="jb-send">生成</button>
                </div>
            </div>
        `;
        document.body.appendChild(theater);

        // 初始化数据
        updateTheaterUI();

        // === 事件绑定 ===

        // 1. 悬浮球点击 -> 开关主菜单 (如果剧场开着，先关剧场)
        btn.onclick = () => {
            const menuBox = document.getElementById(MENU_BOX_ID);
            const theaterBox = document.getElementById(THEATER_ID);
            
            if (theaterBox.style.display === 'flex') {
                theaterBox.style.display = 'none';
                menuBox.style.display = 'flex';
            } else {
                menuBox.style.display = (menuBox.style.display === 'flex' ? 'none' : 'flex');
            }
        };

        // 2. 主菜单 -> 进小剧场
        document.getElementById('btn-open-theater').onclick = () => {
            document.getElementById(MENU_BOX_ID).style.display = 'none';
            const t = document.getElementById(THEATER_ID);
            t.style.display = 'flex';
            // 同步位置 (让体验更连贯)
            const m = document.getElementById(MENU_BOX_ID);
            t.style.top = m.style.top;
            t.style.left = m.style.left;
        };

        // 3. 小剧场 -> 返回主菜单
        document.getElementById('btn-back-menu').onclick = () => {
            document.getElementById(THEATER_ID).style.display = 'none';
            const m = document.getElementById(MENU_BOX_ID);
            m.style.display = 'flex';
            // 同步位置
            const t = document.getElementById(THEATER_ID);
            m.style.top = t.style.top;
            m.style.left = t.style.left;
        };

        // 4. 导入逻辑
        document.getElementById('jb-file').onchange = (e) => {
            if(e.target.files[0]) {
                const r = new FileReader();
                r.onload = ev => { try{ importWorldBook(e.target.files[0], JSON.parse(ev.target.result)); }catch(err){alert("解析失败");} };
                r.readAsText(e.target.files[0]);
                e.target.value = '';
            }
        };

        // 5. 生成逻辑
        document.getElementById('jb-send').onclick = async () => {
            const lib = getLibrary();
            if(lib.length === 0) { alert("⚠️ 请先导入样式书！"); return; }
            
            const val = document.getElementById('jb-select').value;
            const req = document.getElementById('jb-input').value;
            const chat = document.getElementById('jb-chat-area');
            const btn = document.getElementById('jb-send');

            if(!window.SillyTavern) { alert("❌ 酒馆未连接"); return; }

            // 抽取逻辑
            let style = null;
            if(val === 'random') {
                const b = lib[Math.floor(Math.random()*lib.length)];
                const e = b.entries[Math.floor(Math.random()*b.entries.length)];
                style = { name: `[随机] ${e.name}`, content: e.content };
            } else {
                const [bi, ei] = val.split('_').map(Number);
                style = lib[bi].entries[ei];
            }

            btn.innerText = "⏳"; btn.disabled = true;
            chat.innerHTML += `<div class="jb-bubble" style="color:#aaa; font-size:12px;">🎥 应用样式：${style.name}</div>`;
            chat.scrollTop = chat.scrollHeight;

            try {
                const ctx = SillyTavern.getContext();
                const char = ctx.characters[ctx.characterId].name;
                const mes = ctx.chat.length > 0 ? ctx.chat[ctx.chat.length-1].mes : "";
                
                const prompt = `[Instruction: Generate content following format.]\n[TEMPLATE]:\n${style.content}\n\n[Context]:\nChar: ${char}\nStory: "${mes}"\nReq: "${req}"\n\nFill template creatively.`;
                
                const res = await SillyTavern.generateRaw(prompt, "junshi_box");
                
                chat.innerHTML += `
                    <div class="jb-bubble">
                        <div style="font-size:10px; color:#74b9ff;">🎨 ${style.name}</div>
                        <div style="border-top:1px dashed #b2ebf2; padding-top:5px;">${res}</div>
                    </div>`;
                chat.scrollTop = chat.scrollHeight;
            } catch(e) { 
                chat.innerHTML += `<div style="color:red;">❌ ${e}</div>`; 
            } finally { 
                btn.innerText = "生成"; btn.disabled = false; 
            }
        };

        // 🟢 绑定万能拖拽 (应用到三个元素)
        makeDraggable(btn, btn); // 悬浮球
        makeDraggable(menu, menu.querySelector('.jb-header')); // 主菜单
        makeDraggable(theater, document.getElementById('theater-header')); // 小剧场
    }

    // 辅助：更新UI列表
    function updateTheaterUI() {
        const sel = document.getElementById('jb-select');
        const st = document.getElementById('jb-status');
        if(!sel) return;

        const lib = getLibrary();
        st.innerText = lib.length > 0 ? `📚 已存 ${lib.length} 本书` : "📂 空";
        
        let h = `<option value="random">🎲 随机挑选样式</option>`;
        lib.forEach((b, bi) => {
            h += `<optgroup label="📚 ${b.bookName}">`;
            b.entries.forEach((e, ei) => h += `<option value="${bi}_${ei}">└─ ${e.name}</option>`);
            h += `</optgroup>`;
        });
        sel.innerHTML = h;
    }

    // ================= 4. 万能拖拽函数 (无视锁死) =================
    function makeDraggable(element, handle) {
        let isD = false, sX, sY, iL, iT;
        
        const start = (e) => {
            if(e.target.tagName === 'SPAN' && e.target !== handle && !e.target.className.includes('header')) return;
            const evt = e.touches ? e.touches[0] : e;
            isD = true;
            sX = evt.clientX; sY = evt.clientY;
            const r = element.getBoundingClientRect();
            iL = r.left; iT = r.top;
            element.style.transition = 'none';
            if(e.cancelable && !e.touches) e.preventDefault();
        };

        const move = (e) => {
            if(!isD) return;
            if(e.cancelable) e.preventDefault();
            const evt = e.touches ? e.touches[0] : e;
            const dx = evt.clientX - sX;
            const dy = evt.clientY - sY;
            
            element.style.setProperty('left', (iL+dx)+'px', 'important');
            element.style.setProperty('top', (iT+dy)+'px', 'important');
            element.style.setProperty('bottom', 'auto', 'important');
            element.style.setProperty('right', 'auto', 'important');
        };

        const end = () => { if(isD) element.style.transition = ''; isD = false; };

        handle.addEventListener('mousedown', start);
        handle.addEventListener('touchstart', start, {passive: false});
        window.addEventListener('mousemove', move);
        window.addEventListener('touchmove', move, {passive: false});
        window.addEventListener('mouseup', end);
        window.addEventListener('touchend', end);
    }

    // 启动
    setTimeout(createUI, 2000);

})();
