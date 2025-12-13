// =============================================================
//  军师小剧场 V12.0 - 终极融合版
//  UI：完全复刻百宝箱 CSS (蓝黄配色 + 自由缩放 + 折叠)
//  内核：世界书原生读取 + 随机/指定样式引擎
// =============================================================

(function() {
    console.log("🚀 军师插件 V12.0 (完全体) 已注入...");

    // ID 定义 (对应你的 CSS)
    const BOX_ID = 'aiAdvisorBox'; 
    const HEADER_ID = 'advisorHeader';
    const BTN_ID = 'st-entry-btn-v12';

    // 存储 Key
    const STORAGE_KEY = 'st_junshi_worldbooks_v11';
    const FAV_KEY = 'st_junshi_favs_v11';

    // 1. 注入 CSS (基于你提供的代码，改为蓝黄配色)
    const style = document.createElement('style');
    style.innerHTML = `
        /* === 悬浮球 (强制置顶) === */
        #${BTN_ID} {
            position: fixed !important; 
            bottom: 120px !important; right: 20px !important;
            width: 50px; height: 50px;
            background: #fff;
            border: 3px solid #74b9ff; /* 蓝框 */
            border-radius: 50%;
            color: #74b9ff;
            display: flex; justify-content: center; align-items: center;
            font-size: 24px; cursor: pointer;
            z-index: 2147483647 !important; /* 最高层级 */
            box-shadow: 0 5px 15px rgba(116, 185, 255, 0.5);
            transition: transform 0.2s; user-select: none;
        }
        #${BTN_ID}:hover { transform: scale(1.1); background: #74b9ff; color: white; }

        /* ================= 🔧 军师窗口：复刻你的 CSS ================= */

        /* 1. 外壳：自由缩放 + 蓝黄配色 */
        #${BOX_ID} {
            position: fixed !important;
            bottom: 100px; left: 20px;
            z-index: 2147483647 !important;

            /* 📏 尺寸设置 */
            width: 340px; height: 500px; 
            min-width: 280px; min-height: 350px;
            max-width: 95vw; max-height: 85vh;

            /* 🔥 开启自由缩放 */
            resize: both !important;
            overflow: hidden !important; 

            /* 🎨 配色：蓝色边框 */
            background: #fff;
            border: 3px solid #74b9ff; 
            border-radius: 15px;
            box-shadow: 0 10px 40px rgba(0,0,0,0.3);
            
            display: none; flex-direction: column;
            font-family: "Microsoft YaHei", sans-serif;
        }

        /* 2. 标题栏：蓝色背景 + 拖动光标 */
        #${HEADER_ID} {
            background: #74b9ff !important; 
            color: white;
            padding: 10px 15px;
            font-weight: bold;
            font-size: 14px;
            display: flex; justify-content: space-between; align-items: center;
            cursor: move; user-select: none; touch-action: none; 
        }

        /* 3. 工具栏：奶黄背景 */
        .advisor-toolbar {
            display: flex; gap: 5px; padding: 8px;
            background: #fffbf0; /* 奶黄 */
            border-bottom: 1px solid #ffeaa7;
            align-items: center;
        }
        .advisor-tool-btn {
            flex: 1; padding: 5px; border-radius: 4px;
            font-size: 11px; font-weight: bold; cursor: pointer; 
            background: #fff; border: 1px solid #ffeaa7; color: #e67e22;
            display: flex; justify-content: center; align-items: center; gap: 4px;
        }
        .advisor-tool-btn:hover { background: #fff7d1; }

        /* 4. 聊天区：浅奶黄氛围 */
        #advisorChat {
            flex: 1; overflow-y: auto; padding: 10px;
            background: #fffdf5; 
            overscroll-behavior: contain;
        }

        /* 5. 气泡：白底 + 蓝边框 */
        .advisor-bubble {
            background: #fff; 
            border: 1px solid #b2ebf2; 
            border-radius: 12px; 
            padding: 12px; 
            margin-bottom: 10px; 
            box-shadow: 0 2px 5px rgba(0,0,0,0.05);
            font-size: 13px; line-height: 1.5; color: #555;
            position: relative;
        }

        /* 6. 交互按钮 */
        .advisor-action-btn {
            display: block; width: 100%; margin-top: 8px; padding: 6px;
            background: #e1f5fe; color: #0288d1;
            border: 1px dashed #29b6f6; border-radius: 6px;
            cursor: pointer; font-size: 12px; font-weight: bold;
            text-align: center; transition: 0.2s;
        }
        .advisor-action-btn:hover { background: #b3e5fc; }

        /* 7. 底部区域 */
        .advisor-footer {
            padding: 10px; background: #fff; border-top: 1px solid #eee;
            display: flex; flex-direction: column; gap: 8px;
        }

        /* 下拉框 & 输入框 */
        #style-select {
            width: 100%; padding: 6px; border: 2px solid #74b9ff; border-radius: 8px;
            background: #f0f9ff; color: #0984e3; font-size: 12px; outline: none; font-weight: bold;
        }
        #advisorInput {
            flex: 1; border: 1px solid #ddd; border-radius: 20px; padding: 6px 12px;
            font-size: 12px; outline: none; background: #fafafa;
        }
        #advisorSend {
            background: #74b9ff; color: white; border: none; border-radius: 20px;
            padding: 0 15px; cursor: pointer; font-weight: bold; font-size: 12px;
        }

        /* --- 🔧 补丁：军师折叠模式 (只剩标题栏) --- */
        #${BOX_ID}.collapsed {
            height: 45px !important;       
            min-height: 0 !important;      
            resize: none !important;       
            overflow: hidden !important;   
        }
        #${BOX_ID}.collapsed > *:not(#${HEADER_ID}) {
            display: none !important;
        }
    `;
    document.head.appendChild(style);

    // 2. 数据逻辑 (V11 内核)
    function getLibrary() { return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]"); }
    function saveLibrary(lib) { 
        localStorage.setItem(STORAGE_KEY, JSON.stringify(lib)); 
        renderSelector(); 
        updateStatus();
    }

    // 导入解析
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

    // 渲染下拉框
    function renderSelector() {
        const sel = document.getElementById('style-select');
        if(!sel) return;
        const lib = getLibrary();
        let h = `<option value="random_all">🎲 随机挑选样式 (默认)</option>`;
        if(lib.length===0) h = `<option value="">(空) 请点击上方导入按钮</option>`;
        else lib.forEach((b, bi) => {
            h += `<optgroup label="📚 ${b.bookName}">`;
            b.entries.forEach((e, ei) => h += `<option value="${bi}_${ei}">└─ ${e.name}</option>`);
            h += `</optgroup>`;
        });
        sel.innerHTML = h;
    }

    function updateStatus() {
        const lib = getLibrary();
        const el = document.getElementById('book-status');
        if(el) el.innerText = lib.length > 0 ? `📚 已载入 ${lib.length} 本书` : "📂 暂无世界书";
    }

    // 3. 界面渲染
    function renderUI() {
        if (document.getElementById(BTN_ID)) return;

        // 悬浮球
        const btn = document.createElement('div');
        btn.id = BTN_ID; btn.innerHTML = '📜'; btn.title = "打开军师";
        document.body.appendChild(btn);

        // 主窗口
        const box = document.createElement('div');
        box.id = BOX_ID;
        box.innerHTML = `
            <div id="${HEADER_ID}">
                <span>🤖 军师小剧场 (样式引擎)</span>
                <span style="display:flex; gap:10px;">
                    <span id="st-collapse" style="cursor:pointer;" title="折叠">▼</span>
                    <span id="st-close" style="cursor:pointer;" title="关闭">×</span>
                </span>
            </div>

            <div class="advisor-toolbar">
                <input type="file" id="wb-input" accept=".json" style="display:none;">
                <button class="advisor-tool-btn" onclick="document.getElementById('wb-input').click()">
                    📥 导入世界书
                </button>
                <div id="book-status" style="font-size:10px; color:#aaa; margin-left:10px;">检查中...</div>
            </div>

            <div id="advisorChat">
                <div class="advisor-bubble" style="background:#fff7d1; border-color:#ffeaa7; color:#d35400;">
                    <b>👋 界面已恢复！</b><br>
                    1. 点击上方导入您的世界书 JSON。<br>
                    2. 在下方选择样式或随机。<br>
                    3. 窗口可以自由拖拽、缩放。
                </div>
            </div>

            <div class="advisor-footer">
                <select id="style-select"></select>
                <div style="display:flex; gap:5px;">
                    <input type="text" id="advisorInput" placeholder="输入要求...">
                    <button id="advisorSend">生成</button>
                </div>
                <button class="advisor-action-btn" id="btn-favs">⭐ 查看历史记录</button>
            </div>
        `;
        document.body.appendChild(box);
        
        renderSelector();
        updateStatus();

        // === 事件绑定 ===

        // 导入
        document.getElementById('wb-input').onchange = function(e) {
            if(e.target.files[0]) {
                const r = new FileReader();
                r.onload = ev => { try { importWorldBook(e.target.files[0], JSON.parse(ev.target.result)); } catch(err){ alert("解析失败"); } };
                r.readAsText(e.target.files[0]);
                this.value = '';
            }
        };

        // 生成
        document.getElementById('advisorSend').onclick = async function() {
            const lib = getLibrary();
            if(lib.length===0) { alert("请先导入世界书！"); return; }
            
            const val = document.getElementById('style-select').value;
            const req = document.getElementById('advisorInput').value;
            const chat = document.getElementById('advisorChat');
            const btn = document.getElementById('advisorSend');

            if(!window.SillyTavern) { alert("酒馆未连接"); return; }

            // 抽取样式
            let targetStyle = null;
            if(val === 'random_all') {
                const rb = lib[Math.floor(Math.random()*lib.length)];
                const re = rb.entries[Math.floor(Math.random()*rb.entries.length)];
                targetStyle = { name: `[随机] ${re.name}`, content: re.content };
            } else {
                const [bi, ei] = val.split('_').map(Number);
                targetStyle = lib[bi].entries[ei];
            }

            btn.innerText = "⏳"; btn.disabled = true;
            chat.innerHTML += `<div class="loading-tip" style="font-size:10px;text-align:center;color:#aaa;">🎥 应用样式：${targetStyle.name}</div>`;
            chat.scrollTop = chat.scrollHeight;

            try {
                const ctx = SillyTavern.getContext();
                const char = ctx.characters[ctx.characterId].name;
                const mes = ctx.chat.length>0 ? ctx.chat[ctx.chat.length-1].mes : "";

                const prompt = `[Instruction: Generate content following specific format.]\n[FORMAT TEMPLATE]:\n${targetStyle.content}\n\n[Context]:\nCharacter: ${char}\nStory: "${mes}"\nReq: "${req}"\n\nFill the template creatively.`;

                const res = await SillyTavern.generateRaw(prompt, "junshi_v12");
                document.querySelectorAll('.loading-tip').forEach(e=>e.remove());

                const html = `
                    <div class="advisor-bubble">
                        <div style="font-size:10px; color:#74b9ff;">🎨 ${targetStyle.name}</div>
                        <div style="border-top:1px dashed #b2ebf2; padding-top:5px; margin-top:5px;">${res}</div>
                        <button class="advisor-action-btn" onclick="saveFav(this, '${targetStyle.name}')">❤️ 收藏</button>
                    </div>
                `;
                chat.innerHTML += html;
                chat.scrollTop = chat.scrollHeight;
            } catch(e) { chat.innerHTML += `<div style="color:red;">❌ ${e}</div>`; }
            finally { btn.innerText = "生成"; btn.disabled = false; }
        };

        // 窗口操作 (拖拽、开关、折叠)
        btn.onclick = () => { const b=document.getElementById(BOX_ID); b.style.display = b.style.display==='flex'?'none':'flex'; };
        
        document.getElementById('st-close').onclick = () => document.getElementById(BOX_ID).style.display = 'none';
        
        document.getElementById('st-collapse').onclick = (e) => {
            const b = document.getElementById(BOX_ID);
            b.classList.toggle('collapsed');
            e.target.innerText = b.classList.contains('collapsed') ? '▲' : '▼';
        };

        // 拖拽逻辑 (你的 CSS 需要这个)
        const head = document.getElementById(HEADER_ID);
        let isD=false, sX, sY, iL, iT;
        head.addEventListener('mousedown', e => {
            if(e.target!==head && e.target.tagName!=='SPAN' && e.target.id!=='advisorHeader') return;
            isD=true; sX=e.clientX; sY=e.clientY;
            const r = document.getElementById(BOX_ID).getBoundingClientRect();
            iL=r.left; iT=r.top;
        });
        window.addEventListener('mousemove', e => {
            if(!isD) return; e.preventDefault();
            const b = document.getElementById(BOX_ID);
            b.style.left = (iL+e.clientX-sX)+'px';
            b.style.top = (iT+e.clientY-sY)+'px';
        });
        window.addEventListener('mouseup', ()=>isD=false);

        // 收藏夹
        document.getElementById('btn-favs').onclick = function() {
            const favs = JSON.parse(localStorage.getItem(FAV_KEY)||"[]");
            let h = `<div class="advisor-bubble" style="background:#e1f5fe;"><b>⭐ 历史记录 (${favs.length})</b></div>`;
            favs.forEach((f,i)=> h+=`<div class="advisor-bubble" style="border-left:3px solid #fab1a0;"><div style="font-size:10px;color:#999;">${f.style}<span style="float:right;cursor:pointer;color:red;" onclick="delFav(${i})">🗑️</span></div><div style="max-height:80px;overflow-y:auto;">${f.content}</div></div>`);
            h+=`<button class="advisor-action-btn" onclick="document.getElementById('advisorChat').innerHTML=''">清屏</button>`;
            document.getElementById('advisorChat').innerHTML = h;
        };
    }

    // 全局工具
    window.saveFav = (btn, s) => {
        const c = btn.previousElementSibling.innerHTML;
        const fs = JSON.parse(localStorage.getItem(FAV_KEY)||"[]");
        fs.unshift({style:s, content:c, date:new Date().toLocaleString()});
        localStorage.setItem(FAV_KEY, JSON.stringify(fs));
        btn.innerText = "✅"; btn.disabled = true;
    };
    window.delFav = (i) => {
        const fs = JSON.parse(localStorage.getItem(FAV_KEY)||"[]");
        fs.splice(i,1); localStorage.setItem(FAV_KEY, JSON.stringify(fs));
        document.getElementById('btn-favs').click();
    };

    // 保活
    setInterval(() => { if(!document.getElementById(BTN_ID)) renderUI(); }, 1000);
    renderUI();
})();
