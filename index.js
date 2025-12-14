// =============================================================
//  军师百宝箱 V16.0 - 原生直连版 (无需导入文件)
//  核心：直接读取酒馆内存中的 Active World Info
// =============================================================

(function() {
    console.log("🚀 军师百宝箱 V16.0 (直连版) 已加载...");

    const FLOAT_BTN_ID = 'jb-float-btn-v16';
    const MENU_BOX_ID  = 'jb-main-menu-v16';
    const THEATER_ID   = 'jb-theater-box-v16';
    
    // 内存变量 (不再存LocalStorage，每次直接读酒馆的最新状态)
    let currentEntries = [];

    // === 1. 注入 CSS (蓝黄配色 + 你的美化要求) ===
    const style = document.createElement('style');
    style.innerHTML = `
        /* 强制置顶 & 拖拽 */
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
            width: 340px; height: 520px;
            min-width: 280px; min-height: 350px;
            background: #fff; border: 3px solid #74b9ff; border-radius: 15px;
            box-shadow: 0 10px 40px rgba(0,0,0,0.3);
            display: none; flex-direction: column;
            font-family: "Microsoft YaHei", sans-serif;
            resize: both; overflow: hidden;
        }

        /* 标题栏 */
        .jb-header {
            background: #74b9ff; color: white; padding: 12px 15px;
            font-weight: bold; font-size: 15px;
            display: flex; justify-content: space-between; align-items: center;
        }

        /* 百宝箱菜单 */
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

        /* 小剧场工具栏 */
        .jb-toolbar {
            padding: 8px; background: #fffbf0; border-bottom: 1px solid #ffeaa7;
            display: flex; gap: 5px; align-items: center; justify-content: space-between;
        }
        .jb-btn-refresh {
            background: #00b894; color: white; border: none; 
            padding: 5px 12px; border-radius: 5px; font-size: 12px; cursor: pointer;
            display: flex; align-items: center; gap: 5px; font-weight: bold;
        }
        .jb-btn-refresh:hover { background: #019e7e; }

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
    `;
    document.head.appendChild(style);


    // ================= 2. 核心逻辑：直连酒馆 =================
    
    // 🔥 读取酒馆当前激活的世界书条目
    function loadActiveWorldInfo() {
        if (!window.SillyTavern) {
            alert("❌ 酒馆核心未加载，请刷新页面！");
            return;
        }

        const context = SillyTavern.getContext();
        
        // 获取所有条目 (兼容不同版本的酒馆 API)
        let entries = [];
        
        // 尝试从 prompt 构造数据中获取 (这是最准的，包含角色书和全局书)
        if (context.worldInfo && context.worldInfo.entries) {
            entries = context.worldInfo.entries;
        } 
        
        // 过滤：只要没禁用的、有内容的
        currentEntries = entries.filter(e => !e.disable && (e.content || "").trim());

        if (currentEntries.length === 0) {
            alert("⚠️ 未检测到已激活的世界书！\n\n请检查：\n1. 是否在酒馆里挂载了世界书？\n2. 是否勾选了启用？\n3. 角色卡是否关联了角色书？");
        } else {
            alert(`✅ 读取成功！\n📚 共获取 ${currentEntries.length} 个激活条目。\n(请点击下拉菜单查看)`);
        }

        updateDropdown();
    }

    function updateDropdown() {
        const sel = document.getElementById('jb-select');
        const st = document.getElementById('jb-status');
        if (!sel) return;

        st.innerText = currentEntries.length > 0 ? `✅ 已加载 ${currentEntries.length} 个模板` : "❌ 无数据";
        
        let html = `<option value="random">🎲 随机抽取 (默认)</option>`;
        
        // 分组显示 (虽然直连读取通常是扁平数组，但我们可以按条目名稍微归类)
        if (currentEntries.length > 0) {
            html += `<optgroup label="📚 当前激活的条目">`;
            currentEntries.forEach((e, idx) => {
                // 优先显示 comment (备注)，没有则显示 key
                let label = e.comment;
                if (!label && e.key) {
                    label = Array.isArray(e.key) ? e.key[0] : e.key;
                }
                if (!label) label = `条目 #${idx}`;
                
                html += `<option value="${idx}">└─ ${label}</option>`;
            });
            html += `</optgroup>`;
        } else {
            html += `<option value="">(请先点击上方绿色刷新按钮)</option>`;
        }
        
        sel.innerHTML = html;
    }


    // ================= 3. UI 构建 =================

    function createUI() {
        // 清理旧元素 (热重载用)
        const oldBtn = document.getElementById(FLOAT_BTN_ID);
        if (oldBtn) oldBtn.remove();
        const oldMenu = document.getElementById(MENU_BOX_ID);
        if (oldMenu) oldMenu.remove();
        const oldTheater = document.getElementById(THEATER_ID);
        if (oldTheater) oldTheater.remove();

        // --- A. 悬浮球 ---
        const btn = document.createElement('div');
        btn.id = FLOAT_BTN_ID;
        btn.className = 'jb-fixed-top';
        btn.innerHTML = '📦';
        btn.title = "打开百宝箱";
        document.body.appendChild(btn);

        // --- B. 主菜单 ---
        const menu = document.createElement('div');
        menu.id = MENU_BOX_ID;
        menu.className = 'jb-panel jb-fixed-top';
        menu.style.top = '100px'; menu.style.left = '20px';
        menu.innerHTML = `
            <div class="jb-header jb-draggable-header">
                <span>📦 军师百宝箱</span>
                <span style="cursor:pointer" onclick="document.getElementById('${MENU_BOX_ID}').style.display='none'">×</span>
            </div>
            <div class="jb-grid">
                <div class="jb-menu-card" id="btn-open-theater">
                    <div style="font-size:30px">🎬</div>
                    <div style="font-weight:bold">小剧场模式</div>
                </div>
                <div class="jb-menu-card" onclick="alert('即将推出...')">
                    <div style="font-size:30px">🔨</div>
                    <div style="font-weight:bold">更多功能</div>
                </div>
            </div>
        `;
        document.body.appendChild(menu);

        // --- C. 小剧场面板 ---
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
                <span style="cursor:pointer" onclick="document.getElementById('${THEATER_ID}').style.display='none'">×</span>
            </div>
            
            <div class="jb-toolbar">
                <button class="jb-btn-refresh" id="jb-refresh-btn">
                    <span>🔄</span> 读取当前世界书
                </button>
                <div id="jb-status" style="font-size:10px; color:#aaa;">等待读取...</div>
            </div>

            <div id="jb-chat-area">
                <div class="jb-bubble" style="background:#fff7d1; border-color:#ffeaa7; color:#d35400;">
                    <b>👋 欢迎主公！</b><br>
                    无需导入文件。<br>
                    1. 确保酒馆里已挂载好《极光小剧场》等世界书。<br>
                    2. 点击上方 <b>[🔄 读取当前世界书]</b>。<br>
                    3. 在下方选择样式，开始生成。
                </div>
            </div>

            <div class="jb-footer">
                <select id="jb-select"></select>
                <div class="jb-input-row">
                    <input type="text" id="jb-input" placeholder="剧情要求 (可选)...">
                    <button id="jb-send">生成</button>
                </div>
            </div>
        `;
        document.body.appendChild(theater);

        // === 事件绑定 ===

        // 1. 开关主菜单
        btn.onclick = () => {
            const m = document.getElementById(MENU_BOX_ID);
            const t = document.getElementById(THEATER_ID);
            if (t.style.display === 'flex') {
                t.style.display = 'none'; m.style.display = 'flex';
            } else {
                m.style.display = (m.style.display === 'flex' ? 'none' : 'flex');
            }
        };

        // 2. 菜单跳转
        document.getElementById('btn-open-theater').onclick = () => {
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

        // 3. 🔥 核心：刷新按钮绑定
        document.getElementById('jb-refresh-btn').onclick = loadActiveWorldInfo;

        // 4. 生成按钮
        document.getElementById('jb-send').onclick = async () => {
            if (currentEntries.length === 0) { alert("⚠️ 请先点击【读取当前世界书】！"); return; }
            
            const val = document.getElementById('jb-select').value;
            const req = document.getElementById('jb-input').value;
            const chat = document.getElementById('jb-chat-area');
            const btn = document.getElementById('jb-send');

            if (!window.SillyTavern) { alert("❌ 未检测到酒馆对象"); return; }

            // 抽取样式
            let targetStyle = null;
            if (val === 'random') {
                const randIdx = Math.floor(Math.random() * currentEntries.length);
                targetStyle = currentEntries[randIdx];
            } else {
                targetStyle = currentEntries[parseInt(val)];
            }
            
            // 提取名字用于显示
            let styleName = targetStyle.comment || targetStyle.key || "随机样式";
            if(Array.isArray(styleName)) styleName = styleName[0];

            btn.innerText = "⏳"; btn.disabled = true;
            chat.innerHTML += `<div class="jb-bubble" style="color:#aaa;font-size:12px;">🎥 正在应用：${styleName}...</div>`;
            chat.scrollTop = chat.scrollHeight;

            try {
                const context = SillyTavern.getContext();
                const charName = context.characters[context.characterId].name;
                const lastMes = context.chat.length > 0 ? context.chat[context.chat.length-1].mes : "";

                const prompt = `
                [Instruction: Generate content following the format below exactly.]
                
                [TEMPLATE STYLE]:
                ${targetStyle.content}
                
                [CONTEXT]:
                Character: ${charName}
                Story: "${lastMes}"
                User Request: "${req}"
                
                Fill the template creatively now.
                `;

                const result = await SillyTavern.generateRaw(prompt, "junshi_direct");
                
                chat.innerHTML += `
                    <div class="jb-bubble">
                        <div style="font-size:10px; color:#74b9ff; margin-bottom:5px;">🎨 ${styleName}</div>
                        <div style="border-top:1px dashed #b2ebf2; padding-top:5px;">${result}</div>
                    </div>
                `;
                chat.scrollTop = chat.scrollHeight;

            } catch(e) {
                chat.innerHTML += `<div style="color:red;">❌ 生成失败: ${e}</div>`;
            } finally {
                btn.innerText = "生成"; btn.disabled = false;
            }
        };

        // 🟢 绑定万能拖拽
        makeDraggable(btn, btn); 
        makeDraggable(menu, menu.querySelector('.jb-header')); 
        makeDraggable(theater, document.getElementById('theater-header'));
    }

    // ================= 4. 万能拖拽函数 =================
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

    // 启动
    setTimeout(createUI, 2000);

})();
