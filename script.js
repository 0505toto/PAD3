// HTMLドキュメントの読み込みが完了したら、中の処理を実行する
document.addEventListener('DOMContentLoaded', () => {

    // スクロールアニメーション用のObserverをグローバルに定義
    let scrollObserver;

    /**
     * ==================================
     * ★ 機能1: お気に入り管理システム
     * ==================================
     */
    const favoritesApp = {
        // DOM要素の取得
        addBtn: document.getElementById('add-favorite-btn'),
        closeBtn: document.getElementById('close-modal-btn'),
        modal: document.getElementById('favorite-modal'),
        form: document.getElementById('favorite-form'),
        list: document.getElementById('favorites-list'),
        nameInput: document.getElementById('favorite-name'),
        urlInput: document.getElementById('favorite-url'),
        
        // お気に入りデータを保持する配列
        favorites: [],

        // 初期化処理
        init() {
            this.addEventListeners();
            this.loadFavorites();
        },

        // イベントリスナーをまとめて登録
        addEventListeners() {
            this.addBtn.addEventListener('click', () => this.toggleModal(true));
            this.closeBtn.addEventListener('click', () => this.toggleModal(false));
            this.modal.addEventListener('click', (e) => {
                // モーダルの外側をクリックしたら閉じる
                if (e.target === this.modal) {
                    this.toggleModal(false);
                }
            });
            this.form.addEventListener('submit', (e) => this.addFavorite(e));
        },

        // モーダルの表示/非表示を切り替え
        toggleModal(show) {
            this.modal.style.display = show ? 'flex' : 'none';
            if(show) this.nameInput.focus();
        },

        // ローカルストレージからお気に入りを読み込む
        loadFavorites() {
            this.favorites = JSON.parse(localStorage.getItem('portalFavorites')) || [];
            this.renderFavorites();
        },

        // ローカルストレージにお気に入りを保存する
        saveFavorites() {
            localStorage.setItem('portalFavorites', JSON.stringify(this.favorites));
        },

        // お気に入りを画面に描画する
        renderFavorites() {
            this.list.innerHTML = ''; // 一旦リストを空にする
            this.favorites.forEach(fav => {
                const favElement = this.createFavoriteElement(fav);
                this.list.appendChild(favElement);
                // ★新しく作られた要素をスクロールアニメーションの監視対象に追加
                if (scrollObserver) {
                    scrollObserver.observe(favElement);
                }
            });
        },
        
        // お気に入りを追加する処理
        addFavorite(event) {
            event.preventDefault();
            const name = this.nameInput.value.trim();
            const url = this.urlInput.value.trim();

            if (name && url) {
                const newFavorite = {
                    id: Date.now(), // ユニークなIDとしてタイムスタンプを使用
                    name: name,
                    url: url
                };
                this.favorites.push(newFavorite);
                this.saveFavorites();
                this.renderFavorites(); // 再描画
                this.form.reset();
                this.toggleModal(false);
            }
        },

        // お気に入りを削除する処理
        deleteFavorite(id) {
            if (confirm('このお気に入りを削除しますか？')) {
                this.favorites = this.favorites.filter(fav => fav.id !== id);
                this.saveFavorites();
                this.renderFavorites();
            }
        },

        // お気に入り要素のHTMLを生成
        createFavoriteElement(fav) {
            const a = document.createElement('a');
            a.href = fav.url;
            a.target = '_blank';
            a.rel = 'noopener noreferrer';
            a.className = 'card favorite-card'; // アニメーション用のクラス
            a.dataset.id = fav.id; // データ属性にIDを保持

            // アイコン、名前、削除ボタンを中に入れる
            a.innerHTML = `
                <i class="fa-solid fa-link card-icon-small"></i>
                <h4>${this.escapeHTML(fav.name)}</h4>
                <button class="button-delete" title="削除">
                    <i class="fa-solid fa-trash-can"></i>
                </button>
            `;
            
            // 削除ボタンのイベントリスナー
            const deleteBtn = a.querySelector('.button-delete');
            deleteBtn.addEventListener('click', (e) => {
                e.preventDefault(); // リンクへ飛ばないようにする
                e.stopPropagation(); // 親要素へのイベント伝播を止める
                this.deleteFavorite(fav.id);
            });

            return a;
        },

        // XSS対策でHTMLエスケープ
        escapeHTML(str) {
            const p = document.createElement('p');
            p.textContent = str;
            return p.innerHTML;
        }
    };
    
    // お気に入りアプリを初期化
    favoritesApp.init();


    /**
     * ==================================
     * 機能2: 天気予報ウィジェット (変更なし)
     * ==================================
     */
    const fetchWeather = async () => { /* ...前回のコードと同じ... */ };
    (async function(){
        const weatherWidget = document.getElementById('weather-info');
        if (!weatherWidget) return; 
        const apiUrl = 'https://wttr.in/Osaka?format=j1';
        try {
            const response = await fetch(apiUrl);
            if (!response.ok) throw new Error('天気情報の取得に失敗');
            const data = await response.json();
            const currentCondition = data.current_condition[0];
            const todayWeather = data.weather[0];
            const description = currentCondition.weatherDesc[0].value;
            const tempC = currentCondition.temp_C;
            const maxTemp = todayWeather.maxtempC;
            const minTemp = todayWeather.mintempC;
            let weatherIcon = 'fa-solid fa-cloud-sun';
            if (description.includes('Sunny') || description.includes('Clear')) weatherIcon = 'fa-solid fa-sun';
            else if (description.includes('Rain') || description.includes('Shower')) weatherIcon = 'fa-solid fa-cloud-showers-heavy';
            else if (description.includes('Cloudy')) weatherIcon = 'fa-solid fa-cloud';
            else if (description.includes('Snow')) weatherIcon = 'fa-solid fa-snowflake';
            weatherWidget.innerHTML = `<div class="weather-main"><i class="${weatherIcon}"></i><span class="weather-temp">${tempC}°C</span><span class="weather-desc">${description}</span></div><div class="weather-sub"><span>最高: ${maxTemp}°C</span> / <span>最低: ${minTemp}°C</span></div>`;
        } catch (error) {
            weatherWidget.innerHTML = '<p>天気情報を取得できませんでした。</p>';
        }
    })();


    /**
     * ==================================
     * 機能3: スクロールアニメーション (強化版)
     * ==================================
     */
    const setupScrollAnimations = () => {
        const animatedElements = document.querySelectorAll('.card, .parallax-section, .full-width-image-section');
        if (animatedElements.length === 0) return;
        
        // ★アニメーションパターンを追加
        const animationPatterns = ['fade-in-up', 'fade-in-left', 'fade-in-right', 'zoom-in', 'rotate-in'];

        scrollObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('visible');
                    // お気に入りカードは再描画される可能性があるので監視を解除しない
                    if (!entry.target.classList.contains('favorite-card')) {
                        scrollObserver.unobserve(entry.target);
                    }
                }
            });
        }, { threshold: 0.1 });

        animatedElements.forEach(el => {
             // 既存のカードにランダムなアニメーションクラスを割り当て
            const pattern = animationPatterns[Math.floor(Math.random() * animationPatterns.length)];
            el.classList.add(pattern);
            scrollObserver.observe(el);
        });
    };


    /**
     * ==================================
     * 機能4: パララックス効果 (変更なし)
     * ==================================
     */
    const setupParallax = () => { /* ...前回のコードと同じ... */ };
    (function(){
        const parallaxSection = document.querySelector('.parallax-section');
        if (!parallaxSection) return;
        window.addEventListener('scroll', () => {
            window.requestAnimationFrame(() => {
                const rect = parallaxSection.getBoundingClientRect();
                if (rect.top < window.innerHeight && rect.bottom > 0) {
                    const speed = -0.3;
                    const yPos = rect.top * speed;
                    parallaxSection.style.backgroundPosition = `center ${yPos}px`;
                }
            });
        });
    })();

    /**
     * ==================================
     * ★ 機能5: マウス追従エフェクト
     * ==================================
     */
    const setupMouseMoveEffect = () => {
        const headerContent = document.querySelector('.header-content');
        if(!headerContent) return;

        window.addEventListener('mousemove', (e) => {
            const { clientX, clientY } = e;
            const { innerWidth, innerHeight } = window;

            // 画面の中心を0とした座標に変換
            const x = (clientX - innerWidth / 2) / (innerWidth / 2);
            const y = (clientY - innerHeight / 2) / (innerHeight / 2);
            
            // 回転の最大値を設定
            const maxRotate = 5; // 5度

            // requestAnimationFrameでスムーズに
            window.requestAnimationFrame(() => {
                headerContent.style.transform = `rotateY(${x * maxRotate}deg) rotateX(${-y * maxRotate}deg)`;
                headerContent.style.transition = 'transform 0.1s ease-out';
            });
        });
    };


    // ==================================
    // 各機能の初期化・実行
    // ==================================
    setupScrollAnimations();
    setupMouseMoveEffect();

});