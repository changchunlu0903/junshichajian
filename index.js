// =============================================================
//  军师小剧场 V14.0 - 自由移动版
//  继承 V13 的所有功能与皮肤
//  新增：悬浮球和主窗口都支持“无视锁死”的自由拖拽
// =============================================================

(function() {
    console.log("🚀 军师插件 V14.0 (自由移动) 已注入...");

    // 1. 🧹 清理旧按钮
    const oldIds = ['st-junshi-btn', 'st-entry-btn', 'st-nuclear-btn', 'st-move-btn'];
    oldIds.forEach(id => { const old = document.getElementById(id); if(old) old.remove(); });

    // 2. ID 定义
    const BOX_ID = 'aiAdvisorBox_v14'; 
    const HEADER_ID = 'advisorHeader_v14';
    const BTN_ID = 'st-move-btn'; // 新ID

    const STORAGE_KEY = 'st_junshi_worldbooks_v11';
    const FAV_KEY = 'st_junshi_favs_v11';

    // 3. 💉 注入 CSS (完全保持 V13 的样式，不做修改)
    const style = document.createElement('style');
    style.innerHTML = `
        /* 悬浮球 (左上角初始位置) */
        #${BTN_ID} {
            position: fixed !important;
            top: 10px !important; left: 10px !important;
            width: 50px; height: 50px;
            background: #fff; border: 3px solid #74b9ff; border-radius: 50%;
            color: #74b9ff; display: flex; justify-content: center; align-items: center;
            font-size: 24px; cursor: move; /* 鼠标变成移动图标 */
            z-index: 2147483647 !important;
            box-shadow: 0 0 20px rgba(116, 185, 255, 0.8);
            user-select: none; transition: transform 0.1s;
        }
        #${BTN_ID}:active { transform: scale(0.95); background: #74b9ff; color: white; }

        /* 主窗口 */
        #${BOX_ID} {
            position: fixed !important;
            top: 70px !important; left: 10px !important;
            z-index: 2147483647 !important;
            width: 340px; height: 500px; 
            min-width: 280px; min-height: 350px;
            max-width: 95vw; max-height: 85vh;
            background: #fff; border: 3px solid #74b9ff; border-radius: 15px;
            box-shadow: 0 10px 40px rgba(0,0,0,0.5);
            display: none; flex-direction: column;
            font-family: "Microsoft YaHei", sans-serif;
            resize: both !important; overflow: hidden !important;
        }

        /* 标题栏 */
        .header-bar {
            background: #74b9ff !important; color: white; padding: 10px 15px;
            font-weight: bold; font-size: 14px;
            display: flex; justify-content: space-between; align-items: center;
            cursor: move; user-select: none;
        }

        /* 其他样式保持不变... */
        .advisor-toolbar { display: flex; gap: 5px; padding: 8px; background: #fffbf0; border-bottom: 1px solid #ffeaa7; align-items: center; }
        .advisor-tool-btn { flex: 1; padding: 5px; border-radius: 4px; font-size: 11px; font-weight: bold; cursor: pointer; background: #fff; border: 1px solid #ffeaa7; color: #e67e22; display: flex; justify-content: center; align-items: center; }
        #advisorChat { flex: 1; overflow-y: auto; padding: 10px; background: #fffdf5; }
        .advisor-bubble { background: #fff; border: 1px solid #b2ebf2; border-radius: 12px; padding: 12px; margin-bottom: 10px; box-shadow: 0 2px 5px rgba(0,0,0,0.05); font-size: 13px; color: #555; position: relative; }
        .advisor-footer { padding: 10px; background: #fff; border-top: 1px solid #eee; display: flex; flex-direction: column; gap: 8px; }
        #style-select { width: 100%; padding: 6px; border: 2px solid #74b9ff; border-radius: 8px; background: #f0f9ff; color: #0984e3; font-size: 12px; outline: none; font-weight: bold; }
        #advisorInput { flex: 1; border: 1px solid #ddd; border-radius: 20px; padding: 6px 12px; font-size: 12px; outline: none; background: #fafafa; }
        #advisorSend { background: #74b9ff; color: white; border: none; border-radius: 20px; padding: 0 15px; cursor: pointer; font-weight: bold; font-size: 12px; }
        .advisor-action-btn { background: #e1f5fe; color: #0288d1; border: 1px dashed #29b6f6; border-radius: 6px; width: 100%; padding: 5px; cursor: pointer; margin-top: 5px; }
        #${BOX_ID}.collapsed { height: 45px !important; min-height: 0 !important; resize: none !important; overflow: hidden !important; }
        #${BOX_ID}.collapsed > *:not(.header-bar) { display: none !important; }
    `;
    document.head.appendChild(style);

    // 4. 数据逻辑 (保持 V13)
    function getLibrary() { return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]"); }
    function saveLibrary(lib) { localStorage.setItem(STORAGE_KEY, JSON.stringify(lib)); renderSelector(); updateStatus(); }
    
    function importWorldBook(file, json) {
        let entries = [];
        if (json.entries && !Array.isArray(json.entries)) entries = Object.values(json.entries);
        else if (Array.isArray(json.entries)) entries = json.entries;
        else if (Array.isArray(json)) entries = json;
        const cleanEntries = entries.filter(e => !e.disable && (e.content||"").trim())
            .map(e => ({ name: e.comment || (Array.isArray(e.key)?e.key[0]:e.key) || "未命名", content: e.content }));
        if (cleanEntries.length === 0) { alert("❌ 无有效条目"); return; }
        const lib = getLibrary();
        const bookName = file.name.replace('.json', '');
        const newLib = lib.filter(b => b.bookName !== bookName);
        newLib.push({ bookName, entries: cleanEntries });
        saveLibrary(newLib);
        alert(`✅ 导入《${bookName}》\n含 ${cleanEntries.length} 个样式`);
    }

    function renderSelector() {
        const sel = document.getElementById('style-select');
        if(!sel) return;
        const lib = getLibrary();
        let h = `<option value="random_all">🎲 随机挑选样式 (默认)</option>`;
        if(lib.length===0) h = `<option value="">(空) 请点击上方导入按钮</option>`;
        else lib.forEach((b, bi) => { h += `<optgroup label="📚 ${b.bookName}">`; b.entries.forEach((e, ei) => h += `<option value="${bi}_${ei}">└─ ${e.name}</option>`); h += `</optgroup>`; });
        sel.innerHTML = h;
    }
    function updateStatus() { const el = document.getElementById('book-status'); if(el) el.innerText = getLibrary().length > 0 ? `📚 ${getLibrary().length} 本书` : "📂 空"; }

    // 5. 🚀 UI 渲染
    function renderUI() {
        if (document.getElementById(BTN_ID)) return;

        // 悬浮球
        const btn = document.createElement('div');
        btn.id = BTN_ID; btn.innerHTML = '📜'; btn.title = "拖拽我 / 点击打开";
        document.body.appendChild(btn);

        // 主窗口
        const box = document.createElement('div');
        box.id = BOX_ID;
        box.innerHTML = `
            <div class="header-bar" id="drag-header-v14">
                <span>🤖 军师 (V14自由移动)</span>
                <span style="display:flex; gap:10px;">
                    <span id="st-collapse" style="cursor:pointer;">▼</span>
                    <span id="st-close" style="cursor:pointer;">×</span>
                </span>
            </div>
            <div class="advisor-toolbar">
                <input type="file" id="wb-input" accept=".json" style="display:none;">
                <button class="advisor-tool-btn" onclick="document.getElementById('wb-input').click()">📥 导入世界书</button>
                <div id="book-status" style="font-size:10px; color:#aaa; margin-left:10px;">检查中...</div>
            </div>
            <div id="advisorChat">
                <div class="advisor-bubble" style="background:#fff7d1; border-color:#ffeaa7; color:#d35400;">
                    <b>👋 功能已升级！</b><br>现在【悬浮球】和【窗口】都可以随意拖拽了。<br>点击悬浮球可开关窗口。
                </div>
            </div>
            <div class="advisor-footer">
                <select id="style-select"></select>
                <div style="display:flex; gap:5px;"><input type="text" id="advisorInput" placeholder="输入要求..."><button id="advisorSend">生成</button></div>
                <button class="advisor-action-btn" id="btn-favs">⭐ 查看历史</button>
            </div>
        `;
        document.body.appendChild(box);
        
        renderSelector(); updateStatus();

        // 绑定功能逻辑
        document.getElementById('wb-input').onchange = function(e) { if(e.target.files[0]) { const r = new FileReader(); r.onload = ev => { try { importWorldBook(e.target.files[0], JSON.parse(ev.target.result)); } catch(err){ alert("解析失败"); } }; r.readAsText(e.target.files[0]); this.value = ''; } };

        document.getElementById('advisorSend').onclick = async function() {
            const lib = getLibrary(); if(lib.length===0) { alert("请先导入世界书！"); return; }
            const val = document.getElementById('style-select').value; const req = document.getElementById('advisorInput').value; const chat = document.getElementById('advisorChat'); const btn = document.getElementById('advisorSend');
            if(!window.SillyTavern) { alert("酒馆未连接"); return; }
            let targetStyle = null;
            if(val === 'random_all') { const rb = lib[Math.floor(Math.random()*lib.length)]; const re = rb.entries[Math.floor(Math.random()*rb.entries.length)]; targetStyle = { name: `[随机] ${re.name}`, content: re.content }; } 
            else { const [bi, ei] = val.split('_').map(Number); targetStyle = lib[bi].entries[ei]; }
            btn.innerText = "⏳"; btn.disabled = true;
            chat.innerHTML += `<div class="loading-tip" style="font-size:10px;text-align:center;color:#aaa;">🎥 应用样式：${targetStyle.name}</div>`; chat.scrollTop = chat.scrollHeight;
            try {
                const ctx = SillyTavern.getContext(); const char = ctx.characters[ctx.characterId].name; const mes = ctx.chat.length>0 ? ctx.chat[ctx.chat.length-1].mes : "";
                const prompt = `[Instruction: Generate content following specific format.]\n[FORMAT TEMPLATE]:\n${targetStyle.content}\n\n[Context]:\nCharacter: ${char}\nStory: "${mes}"\nReq: "${req}"\n\nFill the template creatively.`;
                const res = await SillyTavern.generateRaw(prompt, "junshi_v14");
                document.querySelectorAll('.loading-tip').forEach(e=>e.remove());
                chat.innerHTML += `<div class="advisor-bubble"><div style="font-size:10px; color:#74b9ff;">🎨 ${targetStyle.name}</div><div style="border-top:1px dashed #b2ebf2; padding-top:5px; margin-top:5px;">${res}</div><button class="advisor-action-btn" onclick="saveFav(this, '${targetStyle.name}')">❤️ 收藏</button></div>`; chat.scrollTop = chat.scrollHeight;
            } catch(e) { chat.innerHTML += `<div style="color:red;">❌ ${e}</div>`; } finally { btn.innerText = "生成"; btn.disabled = false; }
        };
        
        document.getElementById('btn-favs').onclick = function() { const favs = JSON.parse(localStorage.getItem(FAV_KEY)||"[]"); let h = `<div class="advisor-bubble" style="background:#e1f5fe;"><b>⭐ 历史记录 (${favs.length})</b></div>`; favs.forEach((f,i)=> h+=`<div class="advisor-bubble" style="border-left:3px solid #fab1a0;"><div style="font-size:10px;color:#999;">${f.style}<span style="float:right;cursor:pointer;color:red;" onclick="delFav(${i})">🗑️</span></div><div style="max-height:80px;overflow-y:auto;">${f.content}</div></div>`); h+=`<button class="advisor-action-btn" onclick="document.getElementById('advisorChat').innerHTML=''">清屏</button>`; document.getElementById('advisorChat').innerHTML = h; };
        document.getElementById('st-close').onclick = () => document.getElementById(BOX_ID).style.display = 'none';
        document.getElementById('st-collapse').onclick = (e) => { const b = document.getElementById(BOX_ID); b.classList.toggle('collapsed'); e.target.innerText = b.classList.contains('collapsed') ? '▲' : '▼'; };

        // =========================================================
        // 🔥🔥🔥 核心升级：万能拖拽函数 (无视 !important) 🔥🔥🔥
        // =========================================================
        function makeDraggable(el, handle, clickCallback) {
            let isDragging = false;
            let startX, startY, initialLeft, initialTop;
            let hasMoved = false;

            // 鼠标/手指按下
            const start = (e) => {
                // 排除特定点击区域（如关闭按钮）
                if(e.target.tagName==='SPAN' && e.target !== handle) return;
                
                const evt = e.touches ? e.touches[0] : e;
                isDragging = true; hasMoved = false;
                startX = evt.clientX; startY = evt.clientY;
                const rect = el.getBoundingClientRect();
                initialLeft = rect.left; initialTop = rect.top;
                if(e.type==='mousedown') e.preventDefault(); // 防止选中文本
            };

            // 移动
            const move = (e) => {
                if(!isDragging) return;
                e.preventDefault();
                hasMoved = true; // 标记已移动
                const evt = e.touches ? e.touches[0] : e;
                const dx = evt.clientX - startX;
                const dy = evt.clientY - startY;

                // 重点：使用 setProperty(..., 'important') 覆盖 CSS 里的 !important
                el.style.setProperty('left', (initialLeft + dx) + 'px', 'important');
                el.style.setProperty('top', (initialTop + dy) + 'px', 'important');
                el.style.setProperty('bottom', 'auto', 'important'); // 清除干扰
                el.style.setProperty('right', 'auto', 'important');
            };

            // 结束
            const end = () => {
                if(isDragging && !hasMoved && clickCallback) {
                    clickCallback(); // 如果没移动，视为点击
                }
                isDragging = false;
            };

            handle.addEventListener('mousedown', start);
            handle.addEventListener('touchstart', start);
            window.addEventListener('mousemove', move);
            window.addEventListener('touchmove', move, { passive: false });
            window.addEventListener('mouseup', end);
            window.addEventListener('touchend', end);
        }

        // 🟢 给悬浮球绑定：拖拽移动 + 点击开关窗口
        makeDraggable(btn, btn, () => {
            const b = document.getElementById(BOX_ID);
            b.style.display = (b.style.display === 'flex' ? 'none' : 'flex');
        });

        // 🟢 给窗口绑定：通过标题栏拖拽
        makeDraggable(box, document.getElementById('drag-header-v14'), null);
    }

    window.saveFav = (btn, s) => { const c = btn.previousElementSibling.innerHTML; const fs = JSON.parse(localStorage.getItem(FAV_KEY)||"[]"); fs.unshift({style:s, content:c, date:new Date().toLocaleString()}); localStorage.setItem(FAV_KEY, JSON.stringify(fs)); btn.innerText = "✅"; btn.disabled = true; };
    window.delFav = (i) => { const fs = JSON.parse(localStorage.getItem(FAV_KEY)||"[]"); fs.splice(i,1); localStorage.setItem(FAV_KEY, JSON.stringify(fs)); document.getElementById('btn-favs').click(); };

    setInterval(() => { if(!document.getElementById(BTN_ID)) renderUI(); }, 2000);
    renderUI();
})();
