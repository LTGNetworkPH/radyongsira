function $$(id) {
    return document.getElementById(id);
}

function $(selector, context = document) {
    return context.querySelector(selector);
}

function setAccentColor(element, img) {
    const colorThief = new ColorThief();
    const setColor = () => element.setAttribute("style", `--accent: rgb(${colorThief.getColor(img)})`);
    img.complete ? setColor() : img.addEventListener("load", setColor);
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
        const titleWidth = title.offsetWidth;
        const containerWidth = e.offsetWidth;
        e.setAttribute("style", `--title-width:${containerWidth}px`);
        title.classList.toggle("song-very-long", titleWidth > containerWidth);
    });
}

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

    if (verticalVolume && controlVolume) {
        controlVolume.onclick = () => verticalVolume.classList.toggle("is-active");
    }

    const volumeSlider = $(".player-volume", audioPlayer);
    volumeSlider.addEventListener("change", e => {
        const value = e.currentTarget.value;
        audio.volume = value / 100;
        if (verticalVolume && controlVolume) setVolumeIcon(value);
        localStorage.setItem("player_vol", audio.volume);
    });

    const savedVolume = localStorage.getItem("player_vol");
    if (savedVolume) {
        audio.volume = savedVolume;
        volumeSlider.value = 100 * savedVolume;
    }
    if (verticalVolume && controlVolume) setVolumeIcon(volumeSlider.value);

    const playBtn = $(".player-toggle", audioPlayer);

    function setPlayStatus() {
        audio.load();
        player.classList.add("is-playing");
        audio.play();
        playBtn.innerHTML = '<svg class="i i-pause" viewBox="0 0 24 24"><path d="M5 4h4v16H5Zm10 0h4v16h-4Z"></path></svg>';
    }

    function setPauseStatus() {
        player.classList.remove("is-playing");
        audio.pause();
        playBtn.innerHTML = '<svg class="i i-play" viewBox="0 0 24 24"><path d="m7 3 14 9-14 9z"></path></svg>';
    }

    if ("mediaSession" in navigator) {
        navigator.mediaSession.setActionHandler("play", setPlayStatus);
        navigator.mediaSession.setActionHandler("pause", setPauseStatus);
    }

    playBtn.addEventListener("click", () => {
        audio.paused ? setPlayStatus() : setPauseStatus();
    });
}

const boxplay = "https://radio.ltg.network/api/nowplaying_static/radyongsira.json";

function playerInit() {
    fetch(boxplay)
        .then(res => res.json())
        .then(data => {
            const history = data.song_history;
            const historyElem = $$("playerHistory");
            const nowElem = $(".song-now", player);
            const nextElem = $(".song-next", player);
            const poster = $(".player-poster");
            const liveStatus = $(".live-is_live", player);
            const liveStreamer = $(".live-streamer_name", player);
            const liveArt = $(".live-art", player);
            const listenersElem = $(".listeners-total", player);

            if (poster && poster.src) {
                poster.crossOrigin = "Anonymous";
                poster.src = "https://wsrv.nl/?url=" + encodeURIComponent(data.now_playing.song.art);
                setAccentColor(document.body, poster);
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

            setTimeout(playerInit, 2000);

            if (data.live.is_live) {
                $$("radio-status-text").innerHTML = "LIVE: " + data.live.streamer_name;
                $$("live-broadcaster").src = data.live.art;
            } else {
                $$("radio-status-text").innerHTML = "all djs are offline at the moment, on autodj mode";
                if (nextElem) setPlayerMeta(nextElem, data.playing_next.song);
                $$("live-broadcaster").src = "https://i.imgur.com/Dtanzpr.png";
            }

            $$("live-listeners").innerHTML = "Listeners: " + data.listeners.total;
        })
        .catch(console.log);
}
playerInit();

function navBar() {
    const nav = $$("myTopnav");
    nav.className = nav.className === "topnav" ? "topnav responsive" : "topnav";
}