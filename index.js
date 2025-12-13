(function() {
    console.log("🚀 军师插件 V3.0 已启动");

    // 1. 注入 HTML 结构
    const HTML_TEMPLATE = `
    <div id="st-junshi-btn" title="点击召唤军师">📜</div>
    <div id="st-junshi-panel">
        <div class="panel-title">
            <span>🤖 军师锦囊</span>
            <span style="cursor:pointer;" onclick="document.getElementById('st-junshi-panel').style.display='none'">×</span>
        </div>
        
        <div style="display:flex; gap:5px;">
            <button class="junshi-btn" style="flex:1;" id="btn-immersive">🔲 沉浸模式</button>
            <button class="junshi-btn" style="flex:1;" id="btn-favs">⭐ 收藏夹</button>
        </div>

        <div style="font-size:12px; color:#aaa; margin-top:5px;">🎬 小剧场要求:</div>
        <textarea id="junshi-input" class="junshi-textarea" placeholder="例: 写一段心理描写..."></textarea>
        <button class="junshi-btn" style="background:#005f73; border-color:#00e6ff;" id="btn-gen">✨ 生成小剧场</button>
        
        <div id="junshi-result" style="display:none; margin-top:10px; border-top:1px solid #333; padding-top:5px;">
            <div style="font-size:12px; color:#00e6ff;">生成结果:</div>
            <div id="junshi-res-text" style="font-size:12px; max-height:150px; overflow-y:auto; margin-bottom:5px;"></div>
            <button class="junshi-btn" id="btn-save" style="width:100%;">❤️ 收藏</button>
        </div>

        <div id="junshi-fav-list" style="display:none; max-height:200px; overflow-y:auto; margin-top:10px; border-top:1px solid #333;"></div>
    </div>
    `;

    // 2. 初始化 UI
    // 先检查是否存在，防止重复添加
    if (!document.getElementById('st-junshi-btn')) {
        const container = document.createElement('div');
        container.innerHTML = HTML_TEMPLATE;
        document.body.appendChild(container);
    }

    // 3. 绑定事件逻辑
    // (1) 悬浮球开关
    document.getElementById('st-junshi-btn').onclick = function() {
        const p = document.getElementById('st-junshi-panel');
        p.style.display = (p.style.display === 'flex') ? 'none' : 'flex';
    };

    // (2) 沉浸模式
    document.getElementById('btn-immersive').onclick = function() {
        document.body.classList.toggle('junshi-immersive');
        // 尝试全屏
        if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen().catch(()=>{});
        } else {
            document.exitFullscreen().catch(()=>{});
        }
    };

    // (3) 生成小剧场 (核心逻辑)
    document.getElementById('btn-gen').onclick = async function() {
        const btn = this;
        const req = document.getElementById('junshi-input').value;
        
        // 获取上下文 (安全写法)
        if (!window.SillyTavern) { alert("❌ 酒馆核心未加载"); return; }
        
        const context = SillyTavern.getContext();
        if (!context.chat || context.chat.length === 0) { alert("请先聊几句再生成~"); return; }
        
        const lastMes = context.chat[context.chat.length - 1].mes;
        const charName = context.characters[context.characterId].name;

        btn.innerText = "⏳ 军师思考中...";
        btn.disabled = true;

        const prompt = `
        [Instruction: Write a short creative scene based on the chat.]
        Character: ${charName}
        User Request: ${req || "Freestyle scene"}
        Last Message: "${lastMes}"
        Write a immersive scene with dialogue and narration.
        `;

        try {
            // 调用酒馆生成 API
            const result = await SillyTavern.generateRaw(prompt, "junshi_plugin");
            
            document.getElementById('junshi-result').style.display = 'block';
            document.getElementById('junshi-res-text').innerText = result;
            
            // 暂存结果
            window.lastJunshiResult = { content: result, char: charName, date: new Date().toLocaleString() };

        } catch (e) {
            alert("生成失败: " + e);
        } finally {
            btn.innerText = "✨ 生成小剧场";
            btn.disabled = false;
        }
    };

    // (4) 收藏功能
    document.getElementById('btn-save').onclick = function() {
        if (!window.lastJunshiResult) return;
        let favs = JSON.parse(localStorage.getItem('junshi_favs') || "[]");
        favs.unshift(window.lastJunshiResult);
        localStorage.setItem('junshi_favs', JSON.stringify(favs));
        alert("✅ 已收藏！");
        renderFavs();
    };

    // (5) 查看/渲染收藏
    document.getElementById('btn-favs').onclick = function() {
        const list = document.getElementById('junshi-fav-list');
        list.style.display = (list.style.display === 'block') ? 'none' : 'block';
        renderFavs();
    };

    function renderFavs() {
        const list = document.getElementById('junshi-fav-list');
        const favs = JSON.parse(localStorage.getItem('junshi_favs') || "[]");
        list.innerHTML = "";
        
        if(favs.length === 0) { list.innerHTML = "<div style='color:#666;text-align:center;'>暂无收藏</div>"; return; }

        favs.forEach((item, idx) => {
            const div = document.createElement('div');
            div.className = 'fav-item';
            div.innerHTML = `<b>${item.char}</b> <span style="color:#666;font-size:10px;">${item.date}</span>`;
            div.onclick = function() {
                alert(`【${item.char}的小剧场】\n\n${item.content}`);
            };
            
            // 右键删除
            div.oncontextmenu = function(e) {
                e.preventDefault();
                if(confirm("删除这条收藏？")) {
                    favs.splice(idx, 1);
                    localStorage.setItem('junshi_favs', JSON.stringify(favs));
                    renderFavs();
                }
            };
            list.appendChild(div);
        });
    }

})();
