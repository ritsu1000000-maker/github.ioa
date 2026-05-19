<!DOCTYPE html>
<html lang="ja">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>匿名X Pro 最終完全版</title>
    <style>
        :root { --bg-color: #000; --text-main: #e7e9ea; --blue: #1d9bf0; }
        body { font-family: sans-serif; background: var(--bg-color); color: var(--text-main); margin: 0; padding: 20px; max-width: 500px; margin: auto; }
        textarea, input { width: 100%; margin: 8px 0; background: #222; color: #fff; border: 1px solid #444; padding: 10px; box-sizing: border-box; border-radius: 8px; }
        button { background: var(--blue); color: white; border: none; padding: 12px; border-radius: 20px; cursor: pointer; width: 100%; margin-top: 10px; }
        .post-card { border-bottom: 1px solid #333; padding: 20px 0; }
        .vote-option { display: block; background: #333; margin: 5px 0; padding: 10px; border-radius: 10px; cursor: pointer; text-align: left; }
        .media-preview { max-width: 100%; border-radius: 8px; margin-top: 10px; }
    </style>
</head>
<body>

<h3>投稿作成</h3>
<textarea id="post-text" placeholder="いまどうしてる？"></textarea>
<input type="file" id="media-input" accept="image/*,video/mp4,audio/mpeg">
<input type="text" id="vote-question" placeholder="投票の質問（任意）">
<input type="text" id="vote-options" placeholder="選択肢（カンマ区切り、任意）">
<div style="font-size: 0.9em;">
    公開遅延(分): <input type="number" id="delay-min" value="0">
    消滅までの時間(分): <input type="number" id="expire-min" value="60">
</div>
<button onclick="submitPost()">ポストする</button>

<div id="timeline"></div>

<script>
    let selectedMedia = null;

    // ファイル読み込み処理
    document.getElementById('media-input').addEventListener('change', (e) => {
        const file = e.target.files[0];
        if(!file) return;
        const reader = new FileReader();
        reader.onload = (ev) => {
            selectedMedia = { type: file.type, src: ev.target.result };
            alert("メディアをセットしました");
        };
        reader.readAsDataURL(file);
    });

    // 定期的なレンダリング
    setInterval(renderTimeline, 1000);

    function submitPost() {
        const text = document.getElementById('post-text').value;
        const delay = parseInt(document.getElementById('delay-min').value) || 0;
        const expire = parseInt(document.getElementById('expire-min').value) || 60;
        const q = document.getElementById('vote-question').value;
        const opts = document.getElementById('vote-options').value.split(',').filter(x => x.trim() !== "");

        const now = Date.now();
        const postData = {
            id: now,
            text,
            media: selectedMedia,
            showAt: now + (delay * 60 * 1000),
            expireAt: now + (expire * 60 * 1000),
            vote: q ? { q, opts, counts: opts.map(() => 0) } : null
        };

        try {
            let posts = JSON.parse(localStorage.getItem('anon_posts') || '[]');
            posts.push(postData);
            localStorage.setItem('anon_posts', JSON.stringify(posts));
            document.getElementById('post-text').value = "";
            alert("予約完了！");
        } catch(e) { alert("容量オーバーです"); }
    }

    function vote(postId, index) {
        let posts = JSON.parse(localStorage.getItem('anon_posts') || '[]');
        let p = posts.find(x => x.id === postId);
        if(p && p.vote) {
            p.vote.counts[index]++;
            localStorage.setItem('anon_posts', JSON.stringify(posts));
            renderTimeline();
        }
    }

    function renderTimeline() {
        const timeline = document.getElementById('timeline');
        let posts = JSON.parse(localStorage.getItem('anon_posts') || '[]');
        const now = Date.now();
        
        // 期限切れ削除
        const activePosts = posts.filter(p => p.expireAt > now);
        if(activePosts.length !== posts.length) localStorage.setItem('anon_posts', JSON.stringify(activePosts));

        timeline.innerHTML = activePosts
            .filter(p => p.showAt <= now)
            .map(p => `
                <div class="post-card">
                    <p>${p.text}</p>
                    ${p.media ? (p.media.type.startsWith('image') ? `<img src="${p.media.src}" class="media-preview">` : 
                                 p.media.type.startsWith('video') ? `<video src="${p.media.src}" controls class="media-preview"></video>` :
                                 `<audio src="${p.media.src}" controls></audio>`) : ''}
                    ${p.vote ? `
                        <div style="margin-top:10px;"><strong>Q: ${p.vote.q}</strong><br>
                        ${p.vote.opts.map((o, i) => `<button class="vote-option" onclick="vote(${p.id}, ${i})">${o} (${p.vote.counts[i]})</button>`).join('')}
                        </div>` : ''}
                </div>
            `).reverse().join('');
    }
</script>
</body>
</html>
