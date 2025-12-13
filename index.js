import { extension_settings, getContext, saveSettings } from "../../../extensions.js";
import { generateRaw } from "../../../script.js"; // 调用酒馆底层生成API

const MODULE_NAME = "strategist_theater";

// 初始化设置
if (!extension_settings[MODULE_NAME]) {
    extension_settings[MODULE_NAME] = {
        favorites: [] // 存储收藏结构: { id, charName, floor, prompt, content, date }
    };
}

(function() {
    // === 1. 构建 UI ===
    const btn = document.createElement('div');
    btn.id = 'st-strategist-btn';
    btn.innerHTML = '📜'; // 卷轴图标代表军师/剧本
    btn.title = "军师小剧场";
    document.body.appendChild(btn);

    const panel = document.createElement('div');
    panel.id = 'st-strategist-panel';
    panel.innerHTML = `
        <div style="display:flex; justify-content:space-between; margin-bottom:10px; font-weight:bold; color:#ffb7c5;">
            <span>🤖 军师工坊</span>
            <span id="st-close-panel" style="cursor:pointer;">×</span>
        </div>
        
        <div class="st-panel-row">
            <button class="st-btn" id="st-toggle-immersive">🔲 全屏沉浸</button>
            <button class="st-btn" id="st-view-collection">⭐ 查看收藏</button>
        </div>

        <div class="st-section-title">🎬 小剧场生成器</div>
        <textarea id="st-theater-input" placeholder="输入要求：例如'更病娇一点'，或者'写一段心理活动'"></textarea>
        <button class="st-btn primary" id="st-gen-theater">✨ 基于当前对话生成</button>

        <div id="st-collection-view" style="display:none;">
            <div class="st-section-title">我的收藏 (点击查看)</div>
            <div id="st-collection-list"></div>
            <button class="st-btn" id="st-back-main" style="margin-top:5px;">🔙 返回</button>
        </div>
    `;
    document.body.appendChild(panel);

    // 蓝色荧光弹窗
    const modal = document.createElement('div');
    modal.className = 'st-modal-overlay';
    modal.innerHTML = `
        <div class="st-modal-content">
            <div class="st-modal-close">×</div>
            <div style="border-bottom:1px solid #333; padding-bottom:10px; margin-bottom:10px; display:flex; justify-content:space-between;">
                <span id="st-modal-title" style="color:#00e6ff; font-weight:bold;">小剧场</span>
                <button id="st-modal-fav-btn" class="st-btn" style="width:auto; padding:2px 10px; font-size:12px;">❤️ 收藏</button>
            </div>
            <div id="st-modal-body" style="white-space: pre-wrap;"></div>
        </div>
    `;
    document.body.appendChild(modal);

    // === 2. 核心逻辑 ===
    let currentGenContent = ""; // 暂存刚生成的内容
    let currentGenContext = {}; // 暂存刚生成的上下文信息

    // 开关面板
    btn.addEventListener('click', () => panel.classList.toggle('active'));
    document.getElementById('st-close-panel').addEventListener('click', () => panel.classList.remove('active'));

    // 全屏沉浸模式
    document.getElementById('st-toggle-immersive').addEventListener('click', () => {
        document.body.classList.toggle('immersive-active');
        if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen().catch(e=>{});
        } else {
            document.exitFullscreen();
        }
    });

    // 生成小剧场
    document.getElementById('st-gen-theater').addEventListener('click', async () => {
        const context = getContext();
        const chat = context.chat;
        const charId = context.characterId;
        const charName = context.characters[charId].name;
        
        if (!chat || chat.length === 0) {
            alert("还没有对话记录呢，无法生成！");
            return;
        }

        const lastMes = chat[chat.length - 1];
        const userReq = document.getElementById('st-theater-input').value.trim();
        const btn = document.getElementById('st-gen-theater');

        // 构建 Prompt
        const prompt = `
        [System Note: Write a special creative scene ("Little Theater") based on the current context.]
        
        Role: ${charName}
        Current Situation: The story so far.
        Last Message: "${lastMes.mes}"
        
        User Instruction: ${userReq || "Generate a creative extended scene based on the last message."}
        
        Please write a short theatrical scene or internal monologue based on the above. 
        Focus on emotions and atmosphere.
        `;

        btn.innerHTML = "⏳ 正在构思...";
        btn.disabled = true;

        try {
            // 调用酒馆 API 生成
            const result = await generateRaw(prompt, "st-theater-gen");
            
            if (result) {
                currentGenContent = result;
                currentGenContext = {
                    charName: charName,
                    floor: chat.length, // 记录是第几楼
                    prompt: userReq || "自由发挥"
                };
                showModal(result, "✨ 小剧场生成结果", true); // true 表示显示收藏按钮
            }
        } catch (e) {
            alert("生成失败: " + e);
        } finally {
            btn.innerHTML = "✨ 基于当前对话生成";
            btn.disabled = false;
        }
    });

    // 收藏功能
    document.getElementById('st-modal-fav-btn').addEventListener('click', () => {
        if (!currentGenContent) return;
        
        const newItem = {
            id: Date.now(),
            content: currentGenContent,
            ...currentGenContext,
            date: new Date().toLocaleString()
        };

        extension_settings[MODULE_NAME].favorites.unshift(newItem); // 加到最前
        saveSettings();
        
        const favBtn = document.getElementById('st-modal-fav-btn');
        favBtn.innerHTML = "✅ 已收藏";
        favBtn.disabled = true;
        setTimeout(() => {
            favBtn.innerHTML = "❤️ 收藏";
            favBtn.disabled = false;
        }, 2000);
    });

    // 查看收藏列表
    document.getElementById('st-view-collection').addEventListener('click', () => {
        const list = document.getElementById('st-collection-list');
        list.innerHTML = "";
        const favs = extension_settings[MODULE_NAME].favorites;

        if (favs.length === 0) {
            list.innerHTML = "<div style='color:#777;text-align:center;padding:10px;'>暂无收藏</div>";
        } else {
            favs.forEach((item, index) => {
                const el = document.createElement('div');
                el.className = 'st-collection-item';
                el.innerHTML = `
                    <div class="st-item-meta">Card: ${item.charName} | Floor: ${item.floor}</div>
                    <div style="font-weight:bold;color:#ffb7c5;">REQ: ${item.prompt}</div>
                    <div style="color:#aaa; font-size:10px; margin-top:2px;">${item.date}</div>
                `;
                el.onclick = () => {
                    // 查看收藏时，隐藏收藏按钮，或者变成删除按钮（这里简化处理）
                    document.getElementById('st-modal-fav-btn').style.display = 'none';
                    showModal(item.content, `❤️ 收藏回顾：${item.charName} #${item.floor}`);
                };
                
                // 添加删除按钮
                const del = document.createElement('span');
                del.innerHTML = "🗑️";
                del.style.float = "right";
                del.onclick = (e) => {
                    e.stopPropagation();
                    if(confirm("确定删除这条收藏吗？")) {
                        extension_settings[MODULE_NAME].favorites.splice(index, 1);
                        saveSettings();
                        el.remove();
                    }
                };
                el.prepend(del);
                
                list.appendChild(el);
            });
        }

        document.getElementById('st-collection-view').style.display = 'block';
        Array.from(panel.children).forEach(c => {
            if (c.id !== 'st-collection-view' && !c.querySelector('#st-close-panel')) c.style.display = 'none';
        });
        // 保持标题栏显示
        panel.children[0].style.display = 'flex';
    });

    // 返回主菜单
    document.getElementById('st-back-main').addEventListener('click', () => {
        document.getElementById('st-collection-view').style.display = 'none';
        Array.from(panel.children).forEach(c => {
            if (c.id !== 'st-collection-view') c.style.display = '';
        });
        panel.children[0].style.display = 'flex';
        document.getElementById('st-collection-view').style.display = 'none';
    });

    // 弹窗逻辑
    function showModal(content, title, showFav = false) {
        document.getElementById('st-modal-title').innerText = title;
        document.getElementById('st-modal-body').innerText = content;
        document.querySelector('.st-modal-overlay').classList.add('active');
        
        const favBtn = document.getElementById('st-modal-fav-btn');
        favBtn.style.display = showFav ? 'block' : 'none';
        favBtn.innerHTML = "❤️ 收藏"; 
        favBtn.disabled = false;
    }

    document.querySelector('.st-modal-close').addEventListener('click', () => {
        document.querySelector('.st-modal-overlay').classList.remove('active');
    });

    console.log(`${MODULE_NAME} loaded!`);
})();
