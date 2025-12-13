// =============================================================
//  军师小剧场 V11.0 - 世界书原生读取版
//  核心：完全适配酒馆 World Info 格式，支持书籍/条目层级显示
// =============================================================

(function() {
    console.log("🚀 军师插件 V11.0 (世界书原生版) 已注入...");

    const BOX_ID = 'aiAdvisorBox_v11';
    const BTN_ID = 'st-entry-btn-v11';
    
    // 数据存储 Key
    const STORAGE_KEY = 'st_junshi_worldbooks_v11';
    const FAV_KEY = 'st_junshi_favs_v11';

    // 1. 注入 CSS (保持蓝黄配色，优化下拉菜单显示)
    const style = document.createElement('style');
    style.innerHTML = `
        /* 悬浮球 - 强制置顶 */
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
            width: 350px; height: 580px; min-width: 300px; min-height: 400px;
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

        /* 书架管理区 */
        .book-shelf {
            background: #fffbf0; padding: 10px; border-bottom: 1px solid #ffeaa7;
        }
        .import-btn {
            background: #00b894; color: white; border: none; border-radius: 5px;
            padding: 5px 10px; font-size: 12px; cursor: pointer; width: 100%;
            display: flex; align-items: center; justify-content: center; gap: 5px;
        }
        .current-book-info {
            font-size: 11px; color: #d63031; margin-top: 5px; text-align: center;
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
        
        /* 下拉菜单分组样式 */
        #style-select {
            width: 100%; padding: 8px; border: 2px solid #74b9ff; border-radius: 8px;
            background: #f0f9ff; color: #0984e3; font-size: 12px; font-weight: bold; outline: none;
        }
        optgroup { font-style: normal; color: #555; background: #fff; }

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

    // 2. 数据管理：读取世界书
    // 存储结构：Array [{ bookName: "文件名", entries: [{name, content}, ...] }]
    function getLibrary() {
        return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
    }

    function saveLibrary(lib) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(lib));
        renderSelector();
        updateBookStatus();
    }

    // 解析酒馆格式
    function parseAndImport(file, json) {
        let entries = [];
        
        // 情况A: 标准酒馆格式 { "entries": { "0": {...}, "1": {...} } }
        if (json.entries && !Array.isArray(json.entries)) {
            entries = Object.values(json.entries);
        } 
        // 情况B: 数组格式 { "entries": [...] }
        else if (Array.isArray(json.entries)) {
            entries = json.entries;
        }
        // 情况C: 纯数组 [...]
        else if (Array.isArray(json)) {
            entries = json;
        }

        // 提取有效数据
        const cleanEntries = [];
        entries.forEach(e => {
            // comment 是条目名，content 是内容
            // 有时候酒馆用 key 做名字，我们优先用 comment，没有就用 key[0]
            const name = e.comment || (Array.isArray(e.key) ? e.key[0] : e.key) || "未命名条目";
            const content = e.content || "";
            
            // 只导入非禁用的、有内容的
            if (!e.disable && content.trim()) {
                cleanEntries.push({ name, content });
            }
        });

        if (cleanEntries.length === 0) {
            alert("❌ 这本书里没有有效的条目！(请检查是否禁用了条目)");
            return;
        }

        // 存入库
        const lib = getLibrary();
        // 如果已存在同名书，先删除旧的
        const bookName = file.name.replace('.json', '');
        const newLib = lib.filter(b => b.bookName !== bookName);
        
        newLib.push({
            bookName: bookName,
            entries: cleanEntries
        });
        
        saveLibrary(newLib);
        alert(`✅ 成功导入世界书：《${bookName}》\n📚 包含 ${cleanEntries.length} 个模板样式！`);
    }

    // 3. 渲染下拉菜单 (核心层级逻辑)
    function renderSelector() {
        const select = document.getElementById('style-select');
        if (!select) return;

        const lib = getLibrary();
        
        // 默认选项
        let html = `<option value="random_all">🎲 全库随机抽取 (默认)</option>`;

        if (lib.length === 0) {
            html = `<option value="">(空) 请先导入世界书 JSON</option>`;
        } else {
            // 遍历每一本书
            lib.forEach((book, bookIdx) => {
                // 使用 optgroup 分组，显示书名
                html += `<optgroup label="📚 ${book.bookName}">`;
                // 遍历书里的条目
                book.entries.forEach((entry, entryIdx) => {
                    // value 格式： "bookIndex_entryIndex"
                    html += `<option value="${bookIdx}_${entryIdx}">└─ ${entry.name}</option>`;
                });
                html += `</optgroup>`;
            });
        }
        select.innerHTML = html;
    }

    function updateBookStatus() {
        const lib = getLibrary();
        const el = document.getElementById('book-info-text');
        if(el) el.innerText = `当前已导入 ${lib.length} 本世界书，共 ${lib.reduce((a,b)=>a+b.entries.length, 0)} 个样式`;
    }

    // 4. 界面渲染
    function renderUI() {
        if (document.getElementById(BTN_ID)) return;

        const btn = document.createElement('div');
        btn.id = BTN_ID; btn.innerHTML = '📚'; btn.title = "小剧场世界书";
        document.body.appendChild(btn);

        const box = document.createElement('div');
        box.id = BOX_ID;
        box.innerHTML = `
            <div class="header-bar" id="drag-header-v11">
                <span>🎬 军师 (世界书引擎)</span>
                <span style="cursor:pointer;" onclick="document.getElementById('${BOX_ID}').style.display='none'">×</span>
            </div>
            
            <div class="book-shelf">
                <input type="file" id="wb-file-input" accept=".json" style="display:none;">
                <button class="import-btn" onclick="document.getElementById('wb-file-input').click()">
                    <span>📥</span> 导入世界书文件 (.json)
                </button>
                <div id="book-info-text" class="current-book-info">暂无数据</div>
            </div>

            <div id="advisorChat">
                <div class="advisor-bubble" style="background:#fff7d1; border-color:#ffeaa7; color:#d35400;">
                    <b>👋 欢迎使用！</b><br>
                    请导入您珍藏的小剧场世界书 JSON。<br>
                    我会读取其中的<b>【条目名】</b>作为分类，<b>【内容】</b>作为排版格式。
                </div>
            </div>

            <div class="footer-area">
                <div style="font-size:11px; color:#aaa; margin-bottom:2px;">选择模板样式:</div>
                <select id="style-select"></select>

                <div class="input-group">
                    <input type="text" id="reqInput" placeholder="剧情要求 (不填则自由发挥)...">
                    <button id="sendBtn">生成</button>
                </div>
                <button class="fav-btn" id="btn-view-favs">⭐ 查看生成历史</button>
            </div>
        `;
        document.body.appendChild(box);
        
        renderSelector();
        updateBookStatus();

        // === 事件绑定 ===
        
        // 1. 导入
        document.getElementById('wb-file-input').addEventListener('change', function(e) {
            const file = e.target.files[0];
            if (!file) return;
            const reader = new FileReader();
            reader.onload = function(ev) {
                try {
                    const json = JSON.parse(ev.target.result);
                    parseAndImport(file, json);
                } catch(err) { alert("JSON解析错误: " + err); }
            };
            reader.readAsText(file);
            this.value = '';
        });

        // 2. 生成 (核心逻辑)
        document.getElementById('sendBtn').onclick = async function() {
            const lib = getLibrary();
            if (lib.length === 0) { alert("请先导入世界书！"); return; }

            const val = document.getElementById('style-select').value;
            const req = document.getElementById('reqInput').value;
            const chat = document.getElementById('advisorChat');
            const btn = document.getElementById('sendBtn');

            if (!window.SillyTavern) { alert("酒馆未连接"); return; }

            let targetStyle = null;

            // === 🎲 抽取逻辑 ===
            if (val === "random_all") {
                // 1. 先随机选一本书
                const randBook = lib[Math.floor(Math.random() * lib.length)];
                // 2. 再随机选一个条目
                const randEntry = randBook.entries[Math.floor(Math.random() * randBook.entries.length)];
                targetStyle = { name: `[随机] ${randEntry.name}`, content: randEntry.content };
            } else {
                // 指定选择 "bookIndex_entryIndex"
                const [bIdx, eIdx] = val.split('_').map(Number);
                targetStyle = lib[bIdx].entries[eIdx];
            }

            btn.innerText = "⏳"; btn.disabled = true;
            chat.innerHTML += `<div class="loading-tip" style="font-size:10px;text-align:center;color:#aaa;">🎥 正在应用样式：${targetStyle.name}...</div>`;
            chat.scrollTop = chat.scrollHeight;

            try {
                const context = SillyTavern.getContext();
                const charName = context.characters[context.characterId].name;
                const lastMes = context.chat.length > 0 ? context.chat[context.chat.length - 1].mes : "无";

                const prompt = `
                [Instruction: Generate a specialized scene.]
                
                [STRICT FORMAT REQUIREMENT]
                You MUST strictly follow the format/style template below. Do not output raw markdown if the template uses HTML tags.
                
                === TEMPLATE START ===
                ${targetStyle.content}
                === TEMPLATE END ===
                
                [Context Info]:
                Character: ${charName}
                Story Context: "${lastMes}"
                User Request: "${req}"
                
                Fill the template with creative content now.
                `;

                const result = await SillyTavern.generateRaw(prompt, "junshi_wb_engine");
                
                document.querySelectorAll('.loading-tip').forEach(e=>e.remove());

                const html = `
                    <div class="advisor-bubble">
                        <div style="font-size:10px; color:#74b9ff; margin-bottom:5px;">🎨 ${targetStyle.name}</div>
                        <div style="border-top:1px dashed #b2ebf2; padding-top:5px;">
                            ${result}
                        </div>
                        <div style="margin-top:8px;">
                            <button class="fav-btn" onclick="saveFav(this, '${targetStyle.name}')">❤️ 收藏</button>
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

        // 3. 拖拽/开关/收藏 (标准配置)
        btn.onclick = () => { const b=document.getElementById(BOX_ID); b.style.display=(b.style.display==='flex'?'none':'flex'); };
        
        const h = document.getElementById('drag-header-v11');
        let isD=false, sX, sY, iL, iT;
        h.addEventListener('mousedown', e=>{ if(e.target===h||e.target.tagName==='SPAN'){isD=true;sX=e.clientX;sY=e.clientY;const r=document.getElementById(BOX_ID).getBoundingClientRect();iL=r.left;iT=r.top;} });
        window.addEventListener('mousemove', e=>{ if(!isD)return; e.preventDefault(); const b=document.getElementById(BOX_ID); b.style.left=(iL+e.clientX-sX)+'px'; b.style.top=(iT+e.clientY-sY)+'px'; });
        window.addEventListener('mouseup', ()=>isD=false);

        document.getElementById('btn-view-favs').onclick = function() {
            const favs = JSON.parse(localStorage.getItem(FAV_KEY) || "[]");
            let h = `<div class="advisor-bubble" style="background:#e1f5fe;"><b>⭐ 历史记录 (${favs.length})</b></div>`;
            favs.forEach((f, i) => {
                h += `<div class="advisor-bubble" style="border-left:3px solid #ff7675;">
                    <div style="font-size:10px;color:#999;">${f.style} | ${f.date} <span style="float:right;cursor:pointer;color:red;" onclick="delFav(${i})">🗑️</span></div>
                    <div style="max-height:100px;overflow-y:auto;margin-top:5px;">${f.content}</div>
                </div>`;
            });
            h += `<button class="fav-btn" onclick="document.getElementById('advisorChat').innerHTML=''">清屏</button>`;
            document.getElementById('advisorChat').innerHTML = h;
        };
    }

    window.saveFav = function(btn, style) {
        const content = btn.parentElement.previousElementSibling.innerHTML;
        const item = { style, content, date: new Date().toLocaleString() };
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

    setInterval(() => { if(!document.getElementById(BTN_ID)) renderUI(); }, 1000);
    renderUI();

})();
