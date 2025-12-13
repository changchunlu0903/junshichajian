// =============================================================
//  军师小剧场 (Strategist Theater) - V2.0 纯净修复版
//  修复了 import 导致的加载错误，增加了 Slash 指令
// =============================================================

(function() {
    console.log("🚀 军师插件正在加载...");

    // 1. 🔍 定义全局变量 (防止找不到)
    const BUTTON_ID = 'st-strategist-btn';
    const PANEL_ID = 'st-strategist-panel';
    
    // 2. 🛠️ 创建界面函数
    function createInterface() {
        // 如果已经有了，就别重复创建
        if (document.getElementById(BUTTON_ID)) return;

        // --- 创建悬浮球 ---
        const btn = document.createElement('div');
        btn.id = BUTTON_ID;
        btn.innerHTML = '📜'; // 卷轴图标
        btn.title = "点击召唤军师 (或输入 /junshi)";
        document.body.appendChild(btn);

        // --- 创建主面板 ---
        const panel = document.createElement('div');
        panel.id = PANEL_ID;
        panel.innerHTML = `
            <div class="st-title">
                <span>🤖 军师锦囊</span>
                <span id="st-close" style="cursor:pointer;">×</span>
            </div>
            
            <div style="display:flex; gap:5px;">
                <button class="st-btn" id="st-immersive" style="flex:1;">🔲 沉浸模式</button>
                <button class="st-btn" id="st-favs" style="flex:1;">⭐ 收藏夹</button>
            </div>

            <div style="font-size:12px; color:#aaa; margin-top:5px;">🎬 小剧场要求:</div>
            <textarea id="st-theater-input" placeholder="例: 写一段心理描写，稍微病娇一点..."></textarea>
            
            <button class="st-btn primary" id="st-generate">✨ 生成小剧场</button>
            
            <div id="st-result-area" style="display:none; margin-top:10px; border-top:1px solid #444; padding-top:5px;">
                <div style="font-size:12px; color:#00e6ff; margin-bottom:5px;">生成结果:</div>
                <div id="st-result-text" style="font-size:12px; max-height:100px; overflow-y:auto; margin-bottom:5px;"></div>
                <button class="st-btn" id="st-save-fav" style="width:100%;">❤️ 加入收藏</button>
            </div>

            <div id="st-fav-list-area" style="display:none;">
                <div style="font-size:12px; color:#e6a23c; margin-top:5px;">我的收藏 (点击查看):</div>
                <div id="st-collection-list"></div>
            </div>
        `;
        document.body.appendChild(panel);

        // --- 绑定事件 ---
        
        // 1. 悬浮球点击 -> 开关面板
        btn.onclick = function() {
            const p = document.getElementById(PANEL_ID);
            p.classList.toggle('active');
        };

        // 2. 关闭按钮
        document.getElementById('st-close').onclick = function() {
            document.getElementById(PANEL_ID).classList.remove('active');
        };

        // 3. 沉浸模式开关
        document.getElementById('st-immersive').onclick = function() {
            document.body.classList.toggle('st-immersive');
            // 尝试全屏 API
            if (!document.fullscreenElement) {
                document.documentElement.requestFullscreen().catch(()=>{});
            } else {
                document.exitFullscreen().catch(()=>{});
            }
        };

        // 4. 生成小剧场 (调用酒馆核心 API)
        document.getElementById('st-generate').onclick = async function() {
            const promptReq = document.getElementById('st-theater-input').value;
            const btn = document.getElementById('st-generate');
            
            // 获取当前上下文 (安全获取)
            let context = null;
            try {
                // 尝试获取酒馆上下文
                context = SillyTavern.getContext(); 
            } catch(e) {
                alert("❌ 无法获取上下文，请确保进入了对话界面。");
                return;
            }

            if (!context.chat || context.chat.length === 0) {
                alert("请先发几句话再生成哦~");
                return;
            }

            const charName = context.characters[context.characterId].name;
            const lastMes = context.chat[context.chat.length - 1].mes;

            // 锁定按钮
            btn.innerHTML = "⏳ 军师思考中...";
            btn.disabled = true;

            // 构造 Prompt
            const prompt = `
            [Instruction: Write a creative "Little Theater" scene.]
            Character: ${charName}
            Context: The story so far.
            Last Message: "${lastMes}"
            User Request: ${promptReq || "Freestyle scene based on context."}
            
            Write a short, immersive scene (dialogue + narration).
            `;

            try {
                // 调用酒馆生成函数 (generateRaw 是全局函数)
                const result = await SillyTavern.generateRaw(prompt, "st_plugin");
                
                // 显示结果
                document.getElementById('st-result-area').style.display = 'block';
                document.getElementById('st-result-text').innerText = result;
                
                // 暂存结果以便收藏
                window.lastStResult = {
                    content: result,
                    char: charName,
                    req: promptReq,
                    date: new Date().toLocaleString()
                };

            } catch (e) {
                console.error(e);
                alert("生成失败，请检查酒馆后台连接。");
            } finally {
                btn.innerHTML = "✨ 生成小剧场";
                btn.disabled = false;
            }
        };

        // 5. 收藏功能
        document.getElementById('st-save-fav').onclick = function() {
            if (!window.lastStResult) return;
            
            // 读取现有收藏
            let favs = JSON.parse(localStorage.getItem('st_favs') || "[]");
            favs.unshift(window.lastStResult);
            localStorage.setItem('st_favs', JSON.stringify(favs));
            
            const btn = document.getElementById('st-save-fav');
            btn.innerText = "✅ 已收藏";
            setTimeout(() => btn.innerText = "❤️ 加入收藏", 1000);
            
            renderFavs(); // 刷新列表
        };

        // 6. 查看/关闭 收藏夹
        document.getElementById('st-favs').onclick = function() {
            const area = document.getElementById('st-fav-list-area');
            if (area.style.display === 'none') {
                area.style.display = 'block';
                renderFavs();
            } else {
                area.style.display = 'none';
            }
        };
    }

    // 3. 📜 渲染收藏列表函数
    function renderFavs() {
        const list = document.getElementById('st-collection-list');
        const favs = JSON.parse(localStorage.getItem('st_favs') || "[]");
        list.innerHTML = "";
        
        if (favs.length === 0) {
            list.innerHTML = "<div style='color:#666;text-align:center;'>暂无收藏</div>";
            return;
        }

        favs.forEach((item, index) => {
            const div = document.createElement('div');
            div.className = 'st-fav-item';
            div.innerHTML = `<b>${item.char}</b>: ${item.req || '无要求'} <span style="float:right;color:#666;" onclick="removeFav(event, ${index})">🗑️</span>`;
            div.onclick = function() {
                alert(`【${item.char} 的小剧场】\n\n${item.content}`);
            };
            list.appendChild(div);
        });
    }

    // 全局删除函数 (为了能在 onclick 字符串里调用)
    window.removeFav = function(e, index) {
        e.stopPropagation(); // 防止触发查看
        if(!confirm("删除这条收藏？")) return;
        let favs = JSON.parse(localStorage.getItem('st_favs') || "[]");
        favs.splice(index, 1);
        localStorage.setItem('st_favs', JSON.stringify(favs));
        renderFavs();
    };

    // 4. 🎮 注册 Slash 指令 (输入 /junshi 呼出)
    function registerSlashCommand() {
        if (window.SillyTavern && SillyTavern.registerSlashCommand) {
            SillyTavern.registerSlashCommand("junshi", (args, value) => {
                // 强制显示按钮
                const btn = document.getElementById(BUTTON_ID);
                if(btn) btn.style.display = 'flex';
                
                // 打开面板
                const panel = document.getElementById(PANEL_ID);
                if(panel) panel.classList.add('active');
                
                // 系统提示
                return "🤖 军师已就位！(悬浮窗已开启)";
            }, [], "打开军师小剧场悬浮窗", true, true);
            
            console.log("✅ /junshi 指令注册成功");
        } else {
            // 如果酒馆还没加载完，延迟重试
            setTimeout(registerSlashCommand, 1000);
        }
    }

    // 5. 🚀 启动！
    // 延迟 1 秒执行，确保酒馆 DOM 加载完毕
    setTimeout(() => {
        createInterface();
        registerSlashCommand();
        console.log("✅ 军师插件 UI 已注入");
    }, 1000);

})();
