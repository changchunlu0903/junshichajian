// =============================================================
//  军师小剧场 V10.0 - 样式随机 & 世界书排版引擎
//  核心：导入世界书作为样式库，支持指定样式或随机抽取
// =============================================================

(function() {
    console.log("🚀 军师插件 V10.0 (样式引擎) 正在启动...");

    const BOX_ID = 'aiAdvisorBox_v10';
    const BTN_ID = 'st-entry-btn-v10';
    
    // 本地存储 Key
    const STORAGE_KEY = 'st_junshi_styles_v10';
    const FAV_KEY = 'st_junshi_favs_v10';

    // 1. 注入 CSS (蓝黄高颜值 + 强制置顶)
    const style = document.createElement('style');
    style.innerHTML = `
        /* 悬浮球 - 强制最高层级 */
        #${BTN_ID} {
            position: fixed !important; bottom: 120px !important; right: 20px !important;
            width: 50px; height: 50px; background: #fff;
            border: 3px solid #74b9ff; border-radius: 50%;
            color: #74b9ff; display: flex; justify-content: center; align-items: center;
            font-size: 24px; cursor: pointer; z-index: 2147483647 !important;
            box-shadow: 0 5px 15px rgba(116, 185, 255, 0.5);
            transition: transform 0.2s; user-select: none;
        }
        #${BTN_ID}:hover { transform: scale(1.1); background: #74b9ff; color: white; }

        /* 主窗口 */
        #${BOX_ID} {
            position: fixed !important; bottom: 100px; left: 20px; z-index: 2147483647 !important;
            width: 340px; height: 550px; min-width: 280px; min-height: 400px;
            background: #fff; border: 3px solid #74b9ff; border-radius: 15px;
            box-shadow: 0 10px 40px rgba(0,0,0,0.3);
            display: none; flex-direction: column; font-family: "Microsoft YaHei", sans-serif;
            resize: both; overflow: hidden;
        }

        /* 标题栏 */
        .header-bar {
            background: #74b9ff; color: white; padding: 10px 15px;
            font-weight: bold; font-size: 14px; cursor: move;
            display: flex; justify-content: space-between; align-items: center; user-select: none;
        }

        /* 导入区 */
        .import-section {
            background: #fffbf0; padding: 8px; border-bottom: 1px solid #ffeaa7;
            display: flex; align-items: center; justify-content: space-between;
        }
        .file-btn {
            background: #fab1a0; color: white; border: none; border-radius: 5px;
            padding: 4px 10px; font-size: 11px; cursor: pointer; font-weight:bold;
        }

        /* 聊天显示区 */
        #advisorChat {
            flex: 1; overflow-y: auto; padding: 10px; background: #fffbf0;
        }
        .advisor-bubble {
            background: #fff; border: 1px solid #b2ebf2; border-radius: 12px;
            padding: 10px; margin-bottom: 10px; font-size: 13px; color: #555;
            box-shadow: 0 2px 5px rgba(0,0,0,0.03);
        }

        /* 底部控制区 */
        .footer-area {
            padding: 10px; background: #fff; border-top: 1px solid #eee;
            display: flex; flex-direction: column; gap: 8px;
        }
        
        #style-select {
            width: 100%; padding: 8px; border: 2px solid #74b9ff; border-radius: 8px;
            background: #f0f9ff; color: #0984e3; font-size: 12px; font-weight: bold; outline: none;
        }

        .input-group { display: flex; gap: 5px; }
        #reqInput {
            flex: 1; border: 1px solid #ddd; border-radius: 20px; padding: 6px 12px;
            font-size: 12px; outline: none; background: #fafafa;
        }
        #sendBtn {
            background: #74b9ff; color: white; border: none; border-radius: 20px;
            padding: 0 15px; cursor: pointer; font-weight: bold; font-size: 12px;
        }
        
        .fav-btn {
            background: #fff7d1; border: 1px solid #ffeaa7; color: #d35400;
            border-radius: 12px; padding: 5px; font-size: 11px; cursor: pointer; width: 100%;
        }
    `;
    document.head.appendChild(style);

    // 2. 数据管理逻辑
    function getStyles() {
        return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
    }
    
    // 解析世界书 JSON，提取 entries 作为样式
    function importWorldBook(json) {
        let newStyles = [];
        
        // 兼容两种格式：直接是 entries 数组，或者是包含 entries 的对象
        let entries = Array.isArray(json) ? json : (json.entries ? json.entries : []);

        if (entries.length === 0) {
            alert("❌ 这个JSON文件里没有内容 (entries为空)！");
            return;
        }

        entries.forEach(entry => {
            // 我们用 entry.comment (备注) 作为样式名
            // 用 entry.content (内容) 作为样式模板
            if (entry.content && entry.content.trim() !== "") {
                newStyles.push({
                    name: entry.comment || "未命名样式", 
                    content: entry.content
                });
            }
        });

        if (newStyles.length > 0) {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(newStyles));
            renderSelector();
            alert(`✅ 成功导入 ${newStyles.length} 个小剧场样式！\n已永久保存。`);
        } else {
            alert("❌ 未找到有效的样式内容，请检查文件。");
        }
    }

    // 3. 渲染下拉菜单
    function renderSelector() {
        const select = document.getElementById('style-select');
        if (!select) return;

        const styles = getStyles();
        // 默认第一项是“随机”
        let html = `<option value="random">🎲 随机挑选一个样式 (默认)</option>`;

        if (styles.length === 0) {
            html = `<option value="">(空) 请先点击上方导入世界书</option>`;
        } else {
            styles.forEach((s, idx) => {
                html += `<option value="${idx}">🎨 ${s.name}</option>`;
            });
        }
        select.innerHTML = html;
    }

    // 4. 构建界面
    function renderUI() {
        if (document.getElementById(BTN_ID)) return;

        // 悬浮球
        const btn = document.createElement('div');
        btn.id = BTN_ID;
        btn.innerHTML = '🎨';
        btn.title = "小剧场样式引擎";
        document.body.appendChild(btn);

        // 主窗口
        const box = document.createElement('div');
        box.id = BOX_ID;
        box.innerHTML = `
            <div class="header-bar" id="drag-header">
                <span>🎬 军师 (样式随机版)</span>
                <span style="cursor:pointer;" onclick="document.getElementById('${BOX_ID}').style.display='none'">×</span>
            </div>
            
            <div class="import-section">
                <span style="font-size:11px; color:#aaa;">样式库管理</span>
                <input type="file" id="wb-upload" accept=".json" style="display:none;">
                <button class="file-btn" onclick="document.getElementById('wb-upload').click()">📂 导入世界书文件</button>
            </div>

            <div id="advisorChat">
                <div class="advisor-bubble" style="background:#fff7d1; border-color:#ffeaa7; color:#d35400;">
                    <b>👋 欢迎主公！</b><br>
                    请导入包含“小剧场样式”的世界书 JSON。<br>
                    我会<b>随机抽取</b>或<b>指定使用</b>其中的样式来生成内容。
                </div>
            </div>

            <div class="footer-area">
                <div style="font-size:11px; color:#aaa; margin-bottom:2px;">选择样式 (不选则随机):</div>
                <select id="style-select"></select>

                <div class="input-group">
                    <input type="text" id="reqInput" placeholder="输入剧情要求 (例: 吐槽役)...">
                    <button id="sendBtn">生成</button>
                </div>
                <button class="fav-btn" id="btn-view-favs">⭐ 查看生成历史</button>
            </div>
        `;
        document.body.appendChild(box);
        renderSelector();

        // === 事件处理 ===

        // 1. 文件上传
        document.getElementById('wb-upload').addEventListener('change', function(e) {
            const file = e.target.files[0];
            if (!file) return;
            const reader = new FileReader();
            reader.onload = function(ev) {
                try {
                    const json = JSON.parse(ev.target.result);
                    importWorldBook(json);
                } catch(err) {
                    alert("❌ 文件解析失败: " + err);
                }
            };
            reader.readAsText(file);
            this.value = '';
        });

        // 2. 生成逻辑 (核心)
        document.getElementById('sendBtn').onclick = async function() {
            const styles = getStyles();
            if (styles.length === 0) { alert("⚠️ 请先导入样式文件！"); return; }

            const selectVal = document.getElementById('style-select').value;
            const req = document.getElementById('reqInput').value;
            const chat = document.getElementById('advisorChat');
            const btn = document.getElementById('sendBtn');

            if (!window.SillyTavern) { alert("酒馆未连接"); return; }

            // === 🎲 抽取逻辑 ===
            let selectedStyle;
            if (selectVal === "random") {
                // 随机抽取一个
                const randIdx = Math.floor(Math.random() * styles.length);
                selectedStyle = styles[randIdx];
                chat.innerHTML += `<div class="temp-msg" style="font-size:10px;text-align:center;color:#aaa;">🎲 正在随机抽取... 命中样式：【${selectedStyle.name}】</div>`;
            } else {
                // 指定样式
                selectedStyle = styles[parseInt(selectVal)];
                chat.innerHTML += `<div class="temp-msg" style="font-size:10px;text-align:center;color:#aaa;">🎯 使用指定样式：【${selectedStyle.name}】</div>`;
            }

            btn.innerText = "⏳"; btn.disabled = true;

            try {
                const context = SillyTavern.getContext();
                const charName = context.characters[context.characterId].name;
                const lastMes = context.chat.length > 0 ? context.chat[context.chat.length - 1].mes : "无";

                // === 🧠 Prompt 构建 ===
                // 告诉 AI：必须完全按照 selectedStyle.content 给出的格式来写
                const prompt = `
                [Instruction: Generate a "Little Theater" scene.]
                
                [IMPORTANT: OUTPUT FORMAT RULE]
                You MUST follow the specific format/style template below exactly. Do not change the HTML structure or visual style provided.
                
                === STYLE TEMPLATE START ===
                ${selectedStyle.content}
                === STYLE TEMPLATE END ===
                
                [Content Requirements]:
                Character: ${charName}
                Context: "${lastMes}"
                User Request: "${req}"
                
                Generate the content now, filling in the template above with the story.
                `;

                const result = await SillyTavern.generateRaw(prompt, "junshi_style_engine");
                
                // 清理提示信息
                document.querySelectorAll('.temp-msg').forEach(e => e.remove());

                const html = `
                    <div class="advisor-bubble">
                        <div style="font-size:10px; color:#74b9ff; margin-bottom:5px;">
                            🎨 样式: ${selectedStyle.name}
                        </div>
                        <div style="border-top:1px dashed #eee; padding-top:5px;">
                            ${result} 
                        </div>
                        <div style="margin-top:8px;">
                            <button class="fav-btn" onclick="saveFav(this, '${selectedStyle.name}')">❤️ 收藏</button>
                        </div>
                    </div>
                `;
                chat.innerHTML += html;
                chat.scrollTop = chat.scrollHeight;

            } catch(e) {
                chat.innerHTML += `<div style="color:red;font-size:12px;">❌ 失败: ${e}</div>`;
            } finally {
                btn.innerText = "生成"; btn.disabled = false;
            }
        };

        // 3. 拖拽与开关
        btn.onclick = () => {
            const b = document.getElementById(BOX_ID);
            b.style.display = (b.style.display === 'flex') ? 'none' : 'flex';
        };

        const head = document.getElementById('drag-header');
        let isD=false, sX, sY, iL, iT;
        head.addEventListener('mousedown', e => {
             if(e.target === head || e.target.tagName === 'SPAN') {
                 isD=true; sX=e.clientX; sY=e.clientY;
                 const r=document.getElementById(BOX_ID).getBoundingClientRect();
                 iL=r.left; iT=r.top;
             }
        });
        window.addEventListener('mousemove', e => {
            if(!isD) return; e.preventDefault();
            const b = document.getElementById(BOX_ID);
            b.style.left = (iL + e.clientX - sX) + 'px';
            b.style.top = (iT + e.clientY - sY) + 'px';
        });
        window.addEventListener('mouseup', () => isD=false);

        // 4. 收藏夹
        document.getElementById('btn-view-favs').onclick = function() {
            const favs = JSON.parse(localStorage.getItem(FAV_KEY) || "[]");
            let h = `<div class="advisor-bubble" style="background:#e1f5fe;"><b>⭐ 历史记录 (${favs.length})</b></div>`;
            favs.forEach((f, i) => {
                h += `<div class="advisor-bubble" style="border-left:3px solid #fab1a0;">
                    <div style="font-size:10px;color:#999;">${f.style} | ${f.date} <span style="float:right;cursor:pointer;color:red;" onclick="delFav(${i})">🗑️</span></div>
                    <div style="max-height:100px;overflow-y:auto;margin-top:5px;">${f.content}</div>
                </div>`;
            });
            h += `<button class="fav-btn" onclick="document.getElementById('advisorChat').innerHTML=''">清屏</button>`;
            document.getElementById('advisorChat').innerHTML = h;
        };
    }

    // 全局函数
    window.saveFav = function(btn, styleName) {
        // 获取生成的 HTML 内容
        const contentDiv = btn.parentElement.previousElementSibling;
        const content = contentDiv.innerHTML; 
        const item = { style: styleName, content, date: new Date().toLocaleString() };
        
        let favs = JSON.parse(localStorage.getItem(FAV_KEY) || "[]");
        favs.unshift(item);
        localStorage.setItem(FAV_KEY, JSON.stringify(favs));
        btn.innerText = "✅"; btn.disabled = true;
    };
    window.delFav = function(idx) {
        if(!confirm("删除?")) return;
        let favs = JSON.parse(localStorage.getItem(FAV_KEY) || "[]");
        favs.splice(idx, 1);
        localStorage.setItem(FAV_KEY, JSON.stringify(favs));
        document.getElementById('btn-view-favs').click();
    };

    // 保活
    setInterval(() => { if(!document.getElementById(BTN_ID)) renderUI(); }, 1000);
    renderUI();

})();
