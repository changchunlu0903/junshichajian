// =============================================================
//  军师小剧场 V6.0 - 百宝箱复刻版 (蓝+奶黄配色)
// =============================================================

(function() {
    console.log("🚀 军师插件 V6.0 (百宝箱复刻UI) 已注入...");

    // 使用百宝箱的 ID 命名，确保样式完全对应
    const BOX_ID = 'aiAdvisorBox'; 
    const HEADER_ID = 'advisorHeader';

    // 1. 注入 CSS (完全照搬你的 CSS，只改颜色)
    // 🎨 配色方案：
    // 主色 (Blue): #74b9ff (天空蓝) / #0984e3 (深蓝文字)
    // 副色 (Milk Yellow): #fffdf0 (奶黄背景) / #ffeaa7 (奶黄边框) / #fff7d1 (按钮)
    
    const style = document.createElement('style');
    style.innerHTML = `
        /* === 悬浮球 (保持蓝色荧光风格) === */
        #st-entry-btn {
            position: fixed;
            bottom: 120px; right: 20px;
            width: 45px; height: 45px;
            background: #fff;
            border: 3px solid #74b9ff;
            border-radius: 50%;
            color: #74b9ff;
            display: flex; justify-content: center; align-items: center;
            font-size: 22px; cursor: pointer;
            z-index: 12000;
            box-shadow: 0 5px 15px rgba(116, 185, 255, 0.4);
            transition: 0.3s;
            user-select: none;
        }
        #st-entry-btn:hover { transform: scale(1.1) rotate(15deg); background: #74b9ff; color: white; }

        /* ================= 🔧 军师窗口：百宝箱复刻版 ================= */

        /* 1. 外壳：自由缩放 + 蓝白配色 */
        #${BOX_ID} {
            position: fixed;
            bottom: 100px; left: 20px;
            z-index: 12001;

            /* 📏 尺寸设置 */
            width: 320px; height: 420px; 
            min-width: 260px; min-height: 300px;
            max-width: 95vw; max-height: 85vh;

            /* 🔥 开启自由缩放 */
            resize: both !important;
            overflow: hidden !important; 

            /* 🎨 配色：蓝色边框 */
            background: #fff;
            border: 3px solid #74b9ff; 
            border-radius: 15px;
            box-shadow: 0 10px 30px rgba(0,0,0,0.2);
            
            display: none; /* 默认隐藏 */
            flex-direction: column;
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
            
            /* 🔥 拖动功能的关键 */
            cursor: move;
            user-select: none;
            touch-action: none; 
        }

        /* 3. 工具栏：奶黄色背景 */
        .advisor-toolbar {
            display: flex; gap: 5px; padding: 5px 10px;
            background: #fffdf0; /* 奶白 */
            border-bottom: 1px solid #ffeaa7; /* 奶黄线 */
        }
        .advisor-tool-btn {
            flex: 1; padding: 4px; border-radius: 4px;
            font-size: 11px; font-weight: bold; cursor: pointer; 
            background: #fff; 
            border: 1px solid #ffeaa7; /* 奶黄边框 */
            color: #e67e22; /* 暖橙色文字 */
            transition: 0.2s;
        }
        .advisor-tool-btn:hover {
            background: #fff7d1;
            color: #d35400;
        }

        /* 4. 聊天区：浅奶黄氛围 */
        #advisorChat {
            flex: 1; 
            overflow-y: auto; 
            padding: 10px;
            background: #fffbf0; /* 极淡的奶黄底色 */
            overscroll-behavior: contain;
        }

        /* 5. 气泡：白底 + 浅蓝边框 */
        .advisor-bubble {
            background: #fff; 
            border: 1px solid #b2ebf2; /* 浅蓝边 */
            border-radius: 12px; 
            padding: 12px; 
            margin-bottom: 10px; 
            box-shadow: 0 2px 5px rgba(0,0,0,0.03);
            font-size: 13px; 
            line-height: 1.5;
            color: #555;
            position: relative;
        }

        /* 6. 交互按钮：浅蓝底 + 蓝色虚线边框 */
        .advisor-action-btn {
            display: block; width: 100%;
            margin-top: 8px; padding: 6px;
            background: #e1f5fe; /* 浅蓝背景 */
            color: #0288d1; /* 深蓝字 */
            border: 1px dashed #29b6f6; 
            border-radius: 6px;
            cursor: pointer; 
            font-size: 12px; font-weight: bold;
            text-align: center; 
            transition: 0.2s;
        }
        .advisor-action-btn:hover { 
            background: #b3e5fc; 
        }

        /* 7. 底部输入框区域 */
        .advisor-footer {
            padding: 8px; background: #fff; border-top: 1px solid #eee; display: flex; gap: 5px;
        }
        #advisorInput {
            flex: 1; border: 1px solid #ddd; border-radius: 20px; padding: 5px 12px;
            font-size: 12px !important; outline: none; background: #fafafa;
        }
        #advisorSend {
            background: #74b9ff; color: white; border: none; border-radius: 20px;
            padding: 0 15px; cursor: pointer; font-weight: bold;
        }

        /* --- 折叠模式 (只剩标题栏) --- */
        #${BOX_ID}.collapsed {
            height: 45px !important;       /* 强制高度只剩标题栏 */
            min-height: 0 !important;      /* 解除最小高度限制 */
            resize: none !important;       /* 折叠时不准拉伸 */
            overflow: hidden !important;   /* 藏起多余内容 */
        }
        /* 折叠时，隐藏除标题栏以外的所有子元素 */
        #${BOX_ID}.collapsed > *:not(#${HEADER_ID}) {
            display: none !important;
        }
        
        /* 沉浸模式样式 */
        body.junshi-immersive #top-bar { display: none !important; }
        body.junshi-immersive #content { height: 100vh !important; max-height: 100vh !important; }
    `;
    document.head.appendChild(style);

    // 2. 渲染 UI (完全照搬结构)
    function renderUI() {
        if (document.getElementById(BOX_ID)) return;

        // 悬浮入口球
        const btn = document.createElement('div');
        btn.id = 'st-entry-btn';
        btn.innerHTML = '📜';
        btn.title = "点击召唤军师";
        document.body.appendChild(btn);

        // 军师窗口
        const box = document.createElement('div');
        box.id = BOX_ID;
        box.innerHTML = `
            <div id="${HEADER_ID}">
                <span>🤖 军师锦囊</span>
                <span style="flex:1; cursor:move; display:flex; align-items:center; justify-content:flex-end; gap:10px; user-select:none;">
                    <span id="st-collapse-btn" style="cursor:pointer; padding:2px 8px; background:rgba(255,255,255,0.2); border-radius:10px; font-size:12px;" title="折叠/展开">▼</span>
                    <span id="st-close-btn" style="cursor:pointer; font-size:18px;" title="隐藏">×</span>
                </span>
            </div>

            <div class="advisor-toolbar">
                <button class="advisor-tool-btn" id="btn-immersive">🔲 沉浸模式</button>
                <button class="advisor-tool-btn" id="btn-favs">⭐ 收藏夹</button>
            </div>

            <div id="advisorChat">
                <div class="advisor-bubble" style="background:#fff7d1; border-color:#ffeaa7; color:#d35400;">
                    👋 主公好！我是您的军师。<br>在下方输入要求，我为您生成小剧场。
                </div>
            </div>

            <div class="advisor-footer">
                <input type="text" id="advisorInput" placeholder="输入小剧场要求 (例: 甜一点)...">
                <button id="advisorSend">发送</button>
            </div>
        `;
        document.body.appendChild(box);

        // === 绑定事件 ===

        // 1. 悬浮球开关
        btn.onclick = () => {
            box.style.display = (box.style.display === 'flex') ? 'none' : 'flex';
        };

        // 2. 关闭与折叠
        document.getElementById('st-close-btn').onclick = (e) => {
            e.stopPropagation(); // 防止触发拖拽
            box.style.display = 'none';
        };
        
        document.getElementById('st-collapse-btn').onclick = (e) => {
            e.stopPropagation();
            box.classList.toggle('collapsed');
            e.target.innerText = box.classList.contains('collapsed') ? '▲' : '▼';
        };

        // 3. 拖拽逻辑 (完美复刻百宝箱)
        const header = document.getElementById(HEADER_ID);
        let isDragging = false, startX, startY, initialLeft, initialTop;

        header.addEventListener('mousedown', (e) => {
            if(e.target.id !== HEADER_ID && e.target.tagName !== 'SPAN') return; // 避免误触按钮
            isDragging = true;
            startX = e.clientX; startY = e.clientY;
            const rect = box.getBoundingClientRect();
            initialLeft = rect.left; initialTop = rect.top;
            box.style.bottom = 'auto'; box.style.right = 'auto'; // 解除定位锁定
        });

        window.addEventListener('mousemove', (e) => {
            if (!isDragging) return;
            e.preventDefault();
            const dx = e.clientX - startX;
            const dy = e.clientY - startY;
            box.style.left = `${initialLeft + dx}px`;
            box.style.top = `${initialTop + dy}px`;
        });

        window.addEventListener('mouseup', () => isDragging = false);

        // 4. 功能按钮
        document.getElementById('btn-immersive').onclick = () => {
            document.body.classList.toggle('junshi-immersive');
            if(!document.fullscreenElement) document.documentElement.requestFullscreen().catch(()=>{});
            else document.exitFullscreen().catch(()=>{});
        };

        document.getElementById('btn-favs').onclick = () => {
            alert("📦 收藏夹功能正在装修中...\n(生成结果可以手动复制保存哦)");
        };

        // 5. 生成逻辑
        const handleSend = async () => {
            const input = document.getElementById('advisorInput');
            const val = input.value.trim();
            const chat = document.getElementById('advisorChat');
            
            if(!val) return;

            // 用户气泡
            chat.innerHTML += `<div style="text-align:right; margin:5px 0;"><span style="background:#e1f5fe; color:#0288d1; padding:8px 12px; border-radius:15px; font-size:12px; display:inline-block;">${val}</span></div>`;
            input.value = '';
            chat.scrollTop = chat.scrollHeight;

            // 系统生成中
            const loadingId = 'loading-' + Date.now();
            chat.insertAdjacentHTML('beforeend', `<div id="${loadingId}" style="font-size:10px; color:#999; text-align:center; margin:5px;">⏳ 军师思考中...</div>`);

            try {
                if (!window.SillyTavern) throw new Error("酒馆核心未加载");
                const context = SillyTavern.getContext();
                const charName = context.characters[context.characterId].name;
                const lastMes = context.chat.length > 0 ? context.chat[context.chat.length - 1].mes : "无";

                const prompt = `[Write a scene for ${charName}. User Request: ${val}. Last Context: ${lastMes}]`;
                const result = await SillyTavern.generateRaw(prompt, "junshi_v6");

                document.getElementById(loadingId).remove();
                
                // 军师气泡 (带复制按钮)
                const resultHTML = `
                    <div class="advisor-bubble">
                        <div style="font-weight:bold; color:#74b9ff; margin-bottom:5px;">🎬 小剧场生成:</div>
                        ${result.replace(/\n/g, '<br>')}
                        <button class="advisor-action-btn" onclick="navigator.clipboard.writeText(this.previousSibling.textContent); alert('已复制')">📋 复制内容</button>
                    </div>
                `;
                chat.insertAdjacentHTML('beforeend', resultHTML);
                chat.scrollTop = chat.scrollHeight;

            } catch (e) {
                document.getElementById(loadingId).remove();
                chat.insertAdjacentHTML('beforeend', `<div class="advisor-bubble" style="color:red;">❌ 生成失败: ${e.message}</div>`);
            }
        };

        document.getElementById('advisorSend').onclick = handleSend;
        document.getElementById('advisorInput').onkeydown = (e) => { if(e.key === 'Enter') handleSend(); };
    }

    // 保活检查
    setInterval(renderUI, 2000);
    renderUI();

})();
