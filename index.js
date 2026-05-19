// ページ読み込み時にリストを表示
    setInterval(renderTimeline, 1000);

    // 投票ボタンが押された時の処理
    function vote(postId, optionIndex) {
        let posts = JSON.parse(localStorage.getItem('anon_posts') || '[]');
        // 該当する投稿を探す
        let post = posts.find(p => p.id === postId);

        if (post && post.vote) {
            // カウントを増やす（未定義の場合は0からスタート）
            post.vote.counts[optionIndex] = (post.vote.counts[optionIndex] || 0) + 1;
            
            // 保存し直す
            localStorage.setItem('anon_posts', JSON.stringify(posts));
            
            // 画面を再描画
            renderTimeline();
        }
    }

    function submitPost() {
        const text = document.getElementById('post-text').value;
        const delay = parseInt(document.getElementById('delay-min').value) || 0;
        const expire = parseInt(document.getElementById('expire-min').value) || 60;
        const q = document.getElementById('vote-question').value;
        const opts = document.getElementById('vote-options').value.split(',').filter(x => x.trim() !== "");

        if (!text && !selectedMedia) {
            alert("テキストかメディアを入力してください");
            return;
        }

        const now = Date.now();
        const postData = {
            id: now,
            text: text,
            media: selectedMedia,
            showAt: now + (delay * 60 * 1000),
            expireAt: now + (expire * 60 * 1000),
            vote: q ? { q, opts, counts: opts.map(() => 0) } : null
        };

        try {
            let posts = JSON.parse(localStorage.getItem('anon_posts') || '[]');
            posts.push(postData);
            localStorage.setItem('anon_posts', JSON.stringify(posts));
            
            // フォームリセット
            document.getElementById('post-text').value = "";
            selectedMedia = null;
            
            alert("投稿完了！");
        } catch(e) {
            alert("エラー: 容量がいっぱいです。");
        }
    }

    function renderTimeline() {
        const timeline = document.getElementById('timeline');
        let posts = JSON.parse(localStorage.getItem('anon_posts') || '[]');
        const now = Date.now();

        // 有効期限チェック
        const activePosts = posts.filter(p => p.expireAt > now);
        
        timeline.innerHTML = activePosts
            .filter(p => p.showAt <= now)
            .map(p => `
                <div class="post-card">
                    <p>${p.text}</p>
                    ${p.media ? renderMedia(p.media) : ''}
                    ${p.vote ? `
                        <div style="margin-top:10px;">
                            <strong>Q: ${p.vote.q}</strong><br>
                            ${p.vote.opts.map((o, i) => `
                                <button class="vote-option" onclick="vote(${p.id}, ${i})">
                                    ${o} (${p.vote.counts[i] || 0})
                                </button>
                            `).join('')}
                        </div>
                    ` : ''}
                </div>
            `).reverse().join('');
    }

    function renderMedia(media) {
        if (media.type.startsWith('image')) return `<img src="${media.src}" class="media-preview">`;
        if (media.type.startsWith('video')) return `<video src="${media.src}" controls class="media-preview"></video>`;
        if (media.type.startsWith('audio')) return `<audio src="${media.src}" controls></audio>`;
        return '';
    }
