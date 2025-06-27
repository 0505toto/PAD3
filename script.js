// HTMLドキュメントの読み込みが完了したら、中の処理を実行する
document.addEventListener('DOMContentLoaded', () => {

    // スクロールアニメーション用のObserverを、複数の関数から使えるように定義
    let scrollObserver;

    /**
     * ==================================
     * ★ 機能1: お気に入り管理システム
     * ==================================
     */
    const favoritesApp = {
        // 関連するHTML要素をまとめて取得
        addBtn: document.getElementById('add-favorite-btn'),
        closeBtn: document.getElementById('close-modal-btn'),
        modal: document.getElementById('favorite-modal'),
        form: document.getElementById('favorite-form'),
        list: document.getElementById('favorites-list'),
        nameInput: document.getElementById('favorite-name'),
        urlInput: document.getElementById('favorite-url'),
        
        favorites: [], // お気に入りデータを保持する配列

        // アプリケーションの初期化
        init() {
            this.addEventListeners();
            this.loadFavorites();
        },

        // イベントリスナーをまとめて登録
        addEventListeners() {
            this.addBtn.addEventListener('click', () => this.toggleModal(true));
            this.closeBtn.addEventListener('click', () => this.toggleModal(false));
            this.modal.addEventListener('click', (e) => {
                if (e.target === this.modal) this.toggleModal(false);
            });
            this.form.addEventListener('submit', (e) => this.addFavorite(e));
        },

        // ポップアップ画面（モーダル）の表示/非表示
        toggleModal(show) {
            this.modal.style.display = show ? 'flex' : 'none';
            if (show) this.nameInput.focus(); // 表示時に自動で入力欄にカーソルを合わせる
        },

        // ブラウザのLocalStorageからお気に入りを読み込む
        loadFavorites() {
            // 'portalFavoritesV2' という名前でデータを保存・読込
            this.favorites = JSON.parse(localStorage.getItem('portalFavoritesV2')) || [];
            this.renderFavorites();
        },

        // LocalStorageにお気に入りを保存する
        saveFavorites() {
            localStorage.setItem('portalFavoritesV2', JSON.stringify(this.favorites));
        },

        // お気に入りデータを元に、画面のリストを再描画する
        renderFavorites() {
            this.list.innerHTML = ''; // リストを一旦空にする
            this.favorites.forEach(fav => {
                const favElement = this.createFavoriteElement(fav);
                this.list.appendChild(favElement);
                // 新しく作られたカードをスクロールアニメーションの監視対象に追加
                if (scrollObserver) {
                    scrollObserver.observe(favElement);
                }
            });
        },
        
        // フォーム送信時にお気に入りを追加する処理
        addFavorite(event) {
            event.preventDefault(); // フォームのデフォルト送信をキャンセル
            const name = this.nameInput.value.trim();
            const url = this.urlInput.value.trim();

            if (name && url) {
                const newFavorite = {
                    id: Date.now(), // 削除処理のためにユニークなIDを付与
                    name: name,
                    url: url
                };
                this.favorites.push(newFavorite);
                this.saveFavorites();
                this.renderFavorites();
                this.form.reset();
                this.toggleModal(false);
            }
        },

        // IDを指定してお気に入りを削除する処理
        deleteFavorite(id) {
            // 削除前に確認ダイアログを表示
            if (confirm('このお気に入りを削除しますか？')) {
                this.favorites = this.favorites.filter(fav => fav.id !== id);
                this.saveFavorites();
                this.renderFavorites();
            }
        },

        // お気に入りカードのHTML要素を生成する
        createFavoriteElement(fav) {
            const a = document.createElement('a');
            a.href = fav.url;
            a.target = '_blank';
            a.rel = 'noopener noreferrer';
            a.className = 'card favorite-card'; // CSSとアニメーション用のクラス
            a.dataset.id = fav.id;

            a.innerHTML = `
                <i class="fa-solid fa-link card-icon-small"></i>
                <h4>${this.escapeHTML(fav.name)}</h4>
                <button class="button-delete" title="削除">
                    <i class="fa-solid fa-trash-can"></i>
                </button>
            `;
            
            // 削除ボタンがクリックされた時の処理
            const deleteBtn = a.querySelector('.button-delete');
            deleteBtn.addEventListener('click', (e) => {
                e.preventDefault();  // リンク先への移動をキャンセル
                e.stopPropagation(); // 親要素（カード自体）のクリックイベントをキャンセル
                this.deleteFavorite(fav.id);
            });

            return a;
        },

        // 簡単なXSS対策（入力されたHTMLタグを無効化）
        escapeHTML(str) {
            const p = document.createElement('p');
            p.textContent = str;
            return p.innerHTML;
        }
    };
    

    /**
     * ==================================
     * 機能2: 天気予報ウィジェット
     * ==================================
     */
    const fetchWeather = async () => {
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
    };


    /**
     * ==================================
     * 機能3: スクロールアニメーション
     * ==================================
     */
    const setupScrollAnimations = () => {
        const animatedElements = document.querySelectorAll('.card');
        if (animatedElements.length === 0) return;
        
        const animationPatterns = ['fade-in-up', 'zoom-in', 'fade-in-left', 'fade-in-right'];

        scrollObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('visible');
                    // お気に入りカードは動的に増減するため、監視を止めない
                    if (!entry.target.classList.contains('favorite-card')) {
                        scrollObserver.unobserve(entry.target);
                    }
                }
            });
        }, { threshold: 0.1 });

        animatedElements.forEach(el => {
            if (!el.classList.contains('favorite-card')) {
                const pattern = animationPatterns[Math.floor(Math.random() * animationPatterns.length)];
                el.classList.add(pattern);
                scrollObserver.observe(el);
            }
        });
    };

    /**
     * ==================================
     * 機能4: パーティクルエフェクト (PAD2の背景)
     * ==================================
     */
    const setupParticles = () => {
        // `particlesJS` という関数がライブラリによって提供される想定
        if (typeof particlesJS !== 'undefined') {
            particlesJS('particles-js', {
                "particles": { "number": { "value": 60, "density": { "enable": true, "value_area": 800 } }, "color": { "value": "#ffffff" }, "shape": { "type": "circle" }, "opacity": { "value": 0.5, "random": true }, "size": { "value": 3, "random": true }, "line_linked": { "enable": true, "distance": 150, "color": "#ffffff", "opacity": 0.4, "width": 1 }, "move": { "enable": true, "speed": 2, "direction": "none", "random": false, "straight": false, "out_mode": "out" } },
                "interactivity": { "detect_on": "canvas", "events": { "onhover": { "enable": true, "mode": "repulse" }, "onclick": { "enable": true, "mode": "push" } } },
                "retina_detect": true
            });
        } else {
            console.error('particles.js is not loaded. Please include it in your HTML.');
        }
    };
    
    // ==================================
    // 各機能の初期化・実行
    // ==================================
    fetchWeather();
    setupScrollAnimations();
    favoritesApp.init(); // お気に入りアプリの実行
    setupParticles(); // パーティクルエフェクトの実行

});
