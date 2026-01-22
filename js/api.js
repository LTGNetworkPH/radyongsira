// moved from project root into js/ for organization
(function(){
/* original api.js content preserved below */
function $$(id) {
    return document.getElementById(id);
}

function $(selector, context = document) {
    return context.querySelector(selector);
}

function setAccentColor(element, img) {
    const colorThief = new ColorThief();
    const setColor = () => element.setAttribute("style", `--accent: rgb(${colorThief.getColor(img)})`);
    if (img.complete) {
        setColor();
    } else {
        // use the `once` option so the listener is removed automatically
        img.addEventListener("load", setColor, { once: true });
    }
}

function setPlayerMeta(container, meta) {
    const cover = $(".song-cover", container);
    const title = $(".song-title", container);
    const artist = $(".song-artist", container);
    const album = $(".song-album", container);
    const isLive = $(".live-is_live", container);
    const streamerName = $(".live-streamer_name", container);

    if (cover) cover.src = meta.art;
    if (title) title.innerText = meta.title;
    if (artist) artist.innerText = meta.artist;
    if (album) album.innerText = meta.album;
    if (streamerName) streamerName.innerText = meta.streamer_name;
    if (isLive) isLive.innerText = meta.streamer_name;
}

function setScrollText() {
    document.querySelectorAll(".player-meta").forEach(e => {
        const title = $(".song-title", e);
        if (!title) return;
        const titleWidth = title.scrollWidth || title.offsetWidth;
        const containerWidth = e.clientWidth || e.offsetWidth;
        e.style.setProperty('--title-width', `${containerWidth}px`);
        title.classList.toggle("song-very-long", titleWidth > containerWidth);
    });
}

// Recalculate marquee sizing on resize with a small debounce to avoid thrashing
let _playerResizeTimeout = null;
const handleResize = () => {
    if (_playerResizeTimeout) clearTimeout(_playerResizeTimeout);
    _playerResizeTimeout = setTimeout(() => {
        setScrollText();
        _playerResizeTimeout = null;
    }, 150);
};
window.addEventListener('resize', handleResize);

function setVolumeIcon(volume) {
    if (volume < 10) {
        controlVolume.innerHTML = '<i class="fa-solid fa-volume-off"></i>';
    } else if (volume < 60) {
        controlVolume.innerHTML = '<i class="fa-solid fa-volume-low"></i>';
    } else {
        controlVolume.innerHTML = '<i class="fa-solid fa-volume-high"></i>';
    }
}

const player = $(".player");
const audioPlayer = $(".player-audio");
const verticalVolume = $(".player-volume-toggle");
const controlVolume = $(".player-volume-toggle-btn");

if (audioPlayer && audioPlayer.dataset.src) {
    const audio = new Audio(audioPlayer.dataset.src);
    // Optimize for internet radio: metadata preload, CORS, byte-range seeking
    audio.crossOrigin = 'anonymous';
    audio.preload = 'metadata';

    if (verticalVolume && controlVolume) {
        controlVolume.onclick = () => verticalVolume.classList.toggle("is-active");
    }

    const volumeSlider = $(".player-volume", audioPlayer);
    if (volumeSlider) {
        volumeSlider.addEventListener("change", e => {
            const value = e.currentTarget.value;
            audio.volume = value / 100;
            if (verticalVolume && controlVolume) setVolumeIcon(value);
            localStorage.setItem("player_vol", audio.volume);
        });
    }

    const savedVolumeRaw = localStorage.getItem("player_vol");
    const savedVolume = savedVolumeRaw !== null ? parseFloat(savedVolumeRaw) : null;
    if (!Number.isNaN(savedVolume) && savedVolume !== null) {
        audio.volume = savedVolume;
        if (volumeSlider) volumeSlider.value = 100 * savedVolume;
    }
    if (verticalVolume && controlVolume && volumeSlider) setVolumeIcon(volumeSlider.value);

    const playBtn = $(".player-toggle", audioPlayer);

    function setPlayStatus() {
        audio.load();
        player.classList.add("is-playing");
        audio.play();
        if (playBtn) playBtn.innerHTML = '<svg class="i i-pause" viewBox="0 0 24 24"><path d="M5 4h4v16H5Zm10 0h4v16h-4Z"></path></svg>';
    }

    function setPauseStatus() {
        player.classList.remove("is-playing");
        audio.pause();
        if (playBtn) playBtn.innerHTML = '<svg class="i i-play" viewBox="0 0 24 24"><path d="m7 3 14 9-14 9z"></path></svg>';
    }

    if ("mediaSession" in navigator) {
        navigator.mediaSession.setActionHandler("play", setPlayStatus);
        navigator.mediaSession.setActionHandler("pause", setPauseStatus);
    }

    if (playBtn) {
        playBtn.addEventListener("click", () => {
            audio.paused ? setPlayStatus() : setPauseStatus();
        });
    }
}

const boxplay = "https://radio.ltg.network/api/nowplaying_static/radyongsira.json";
let playerInitRetries = 0;
const maxRetries = 3;
const baseRetryDelay = 500; // 500ms for real-time feel

function playerInit() {
    fetch(boxplay, { signal: AbortSignal.timeout(5000) })
        .then(res => {
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            return res.json();
        })
        .then(data => {
            playerInitRetries = 0; // reset on success
            const history = data.song_history;
            const historyElem = $$("playerHistory");
            const nowElem = $(".song-now", player);
            const nextElem = $(".song-next", player);
            const poster = $(".player-poster");
            const liveStatus = $(".live-is_live", player);
            const liveStreamer = $(".live-streamer_name", player);
            const liveArt = $(".live-art", player);
            const listenersElem = $(".listeners-total", player);

            if (poster) {
                const newPosterUrl = "https://wsrv.nl/?url=" + encodeURIComponent(data.now_playing.song.art);
                // avoid reassigning the same src repeatedly (prevents cancel/abort churn)
                if (poster.dataset._lastSrc !== newPosterUrl) {
                    poster.dataset._lastSrc = newPosterUrl;
                    // preload via a temporary Image to avoid assigning a src that may get aborted
                    const tmp = new Image();
                    tmp.crossOrigin = 'Anonymous';
                    tmp.addEventListener('load', () => {
                        try {
                            poster.src = newPosterUrl;
                            setAccentColor(document.body, poster);
                        } catch (e) {
                            console.log('poster set failed', e);
                        }
                    }, { once: true });
                    tmp.addEventListener('error', () => {
                        // keep existing poster on error
                        console.log('poster preload failed for', newPosterUrl);
                    }, { once: true });
                    tmp.src = newPosterUrl;
                }
            }
            if (nowElem) setPlayerMeta(nowElem, data.now_playing.song);
            if (historyElem) historyElem.innerHTML = createHistory(history, historyElem.dataset.results || 5);
            setScrollText();

            if ("mediaSession" in navigator) {
                navigator.mediaSession.metadata = new MediaMetadata({
                    title: data.now_playing.song.title,
                    artist: data.now_playing.song.artist,
                    album: data.now_playing.song.album,
                    artwork: [
                        { src: data.now_playing.song.art, sizes: "96x96", type: "image/png" },
                        { src: data.now_playing.song.art, sizes: "128x128", type: "image/png" },
                        { src: data.now_playing.song.art, sizes: "192x192", type: "image/png" },
                        { src: data.now_playing.song.art, sizes: "256x256", type: "image/png" }
                    ]
                });
            }
            function proxiedUrl(url) {
                try {
                    return "https://wsrv.nl/?url=" + encodeURIComponent(url);
                } catch (e) {
                    return url;
                }
            }

            const statusTextElem = $$("radio-status-text");
            const liveBroadcasterElem = $$("live-broadcaster");

            if (data.live.is_live) {
                if (statusTextElem) statusTextElem.innerHTML = "LIVE: " + data.live.streamer_name;
                if (liveBroadcasterElem) {
                    const target = proxiedUrl(data.live.art);
                    if (liveBroadcasterElem.dataset._lastSrc !== target) {
                        liveBroadcasterElem.dataset._lastSrc = target;
                        const tmp = new Image();
                        tmp.crossOrigin = 'Anonymous';
                        tmp.addEventListener('load', () => { liveBroadcasterElem.src = target; }, { once: true });
                        tmp.addEventListener('error', () => { console.log('live-broadcaster preload failed', target); }, { once: true });
                        tmp.src = target;
                    }
                }
            } else {
                if (statusTextElem) statusTextElem.innerHTML = "all djs are offline at the moment, on autodj mode";
                if (nextElem) setPlayerMeta(nextElem, data.playing_next.song);
                if (liveBroadcasterElem) {
                    const fallback = proxiedUrl('https://i.imgur.com/Dtanzpr.png');
                    if (liveBroadcasterElem.dataset._lastSrc !== fallback) {
                        liveBroadcasterElem.dataset._lastSrc = fallback;
                        const tmp = new Image();
                        tmp.crossOrigin = 'Anonymous';
                        tmp.addEventListener('load', () => { liveBroadcasterElem.src = fallback; }, { once: true });
                        tmp.addEventListener('error', () => { console.log('live-broadcaster preload failed', fallback); }, { once: true });
                        tmp.src = fallback;
                    }
                }
            }

            $$("live-listeners").innerHTML = "Listeners: " + data.listeners.total;
        })
        .catch(err => {
            console.error('playerInit error:', err.message);
            playerInitRetries = (playerInitRetries + 1) % (maxRetries + 1);
        })
        .finally(() => {
            // Real-time updates: 500ms base, exponential backoff on errors up to 2s
            const delay = playerInitRetries > 0 
                ? Math.min(baseRetryDelay * Math.pow(2, playerInitRetries - 1), 2000)
                : 500;
            setTimeout(playerInit, delay);
        });
}
playerInit();

function navBar() {
    const nav = $$("myTopnav");
    nav.className = nav.className === "topnav" ? "topnav responsive" : "topnav";
}

// Cleanup function for page unload/navigation
function cleanupApiModule(){
    // Clear any pending resize timeouts
    if (_playerResizeTimeout) clearTimeout(_playerResizeTimeout);
    // Remove resize listener
    window.removeEventListener('resize', handleResize);
    // Stop polling by catching the setTimeout in playerInit (it will keep recursing, but we prevent memory buildup)
}

// Add cleanup handlers for page navigation/unload
window.addEventListener('beforeunload', cleanupApiModule, { once: true });
if (document.readyState === 'loading') {
    document.addEventListener('unload', cleanupApiModule, { once: true });
}

})();
