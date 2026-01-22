// Initialize particles.js
particlesJS('particles-js', {
    particles: {
        number: { value: 80, density: { enable: true, value_area: 800 } },
        color: { value: '#ffffff' },
        shape: { type: 'circle' },
        opacity: {
            value: 0.5,
            random: true,
            animation: { enable: true, speed: 1, minimumValue: 0.1, sync: false }
        },
        size: {
            value: 3,
            random: true,
            animation: { enable: true, speed: 2, minimumValue: 0.1, sync: false }
        },
        line_linked: {
            enable: true,
            distance: 150,
            color: '#ffffff',
            opacity: 0.4,
            width: 1
        },
        move: {
            enable: true,
            speed: 1,
            direction: 'none',
            random: true,
            straight: false,
            outMode: 'out',
            bounce: false,
        }
    },
    interactivity: {
        detectOn: 'canvas',
        events: {
            onHover: { enable: true, mode: 'grab' },
            onClick: { enable: true, mode: 'push' },
            resize: true
        },
        modes: {
            grab: { distance: 140, lineLinked: { opacity: 1 } },
            push: { particles_nb: 4 }
        }
    },
    retina_detect: true
});

// Audio player functionality
const audio = document.getElementById('anthem');
const subtitleElement = document.getElementById('subtitle');
const progressBar = document.getElementById('progressBar');
const progress = document.getElementById('progress');
const playPauseBtn = document.getElementById('playPauseBtn');
const currentTimeDisplay = document.getElementById('currentTime');
const durationDisplay = document.getElementById('duration');
const visualizerBars = document.querySelectorAll('.visualizer-bar');

// Format time in MM:SS
function formatTime(seconds) {
    const minutes = Math.floor(seconds / 60);
    seconds = Math.floor(seconds % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

// Update progress bar
function updateProgress() {
    const percent = (audio.currentTime / audio.duration) * 100;
    progress.style.width = percent + '%';
    currentTimeDisplay.textContent = formatTime(audio.currentTime);
}

// Handle click on progress bar
progressBar.addEventListener('click', function(e) {
    const rect = this.getBoundingClientRect();
    const percent = (e.clientX - rect.left) / rect.width;
    audio.currentTime = percent * audio.duration;
});

// Play/Pause button
playPauseBtn.addEventListener('click', function() {
    if (audio.paused) {
        audio.play();
        this.innerHTML = '<svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg>';
    } else {
        audio.pause();
        this.innerHTML = '<svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>';
    }
});

// Subtitles data
const subtitles = [
    { start: 0, end: 10, text: "" },
    { start: 10, end: 16.130, text: "सयौं थुँगा फूलका हामी, एउटै माला नेपाली" },
    { start: 16.585, end: 21.466, text: "सार्वभौम भई फैलिएका, मेची–माहाकाली।" },
    { start: 21.669, end: 27.229, text: "सयौं थुँगा फूलका हामी, एउटै माला नेपाली" },
    { start: 27.961, end: 33.013, text: "सार्वभौम भई फैलिएका, मेची–माहाकाली।" },
    { start: 33.257, end: 38.091, text: "प्रकृतिका कोटी–कोटी सम्पदाको आंचल" },
    { start: 38.803, end: 43.733, text: "वीरहरूका रगतले, स्वतन्त्र र अटल।" },
    { start: 44.180, end: 48.967, text: "ज्ञानभूमि, शान्तिभूमि तराई, पहाड, हिमाल" },
    { start: 49.644, end: 54.825, text: "अखण्ड यो प्यारो हाम्रो मातृभूमि नेपाल।" },
    { start: 54.825, end: 59.825, text: "बहुल जाति, भाषा, धर्म, संस्कृति छन् विशाल" },
    { start: 60.151, end: 64.825, text: "अग्रगामी राष्ट्र हाम्रो, जय जय नेपाल।" },
];


// Update subtitles with fade effect
function updateSubtitles() {
    const currentTime = audio.currentTime;
    const currentSubtitle = subtitles.find(sub => 
        currentTime >= sub.start && currentTime <= sub.end
    );

    if (currentSubtitle) {
        if (subtitleElement.textContent !== currentSubtitle.text) {
            subtitleElement.style.opacity = '0';
            setTimeout(() => {
                subtitleElement.textContent = currentSubtitle.text;
                subtitleElement.style.opacity = '1';
            }, 300);
        }
    } else {
        subtitleElement.style.opacity = '0';
    }
}

// Audio visualization
function updateVisualization() {
    if (!audio.paused) {
        visualizerBars.forEach(bar => {
            const height = Math.random() * 30 + 10;
            bar.style.height = `${height}px`;
        });
    }
    requestAnimationFrame(updateVisualization);
}

// Event listeners
audio.addEventListener('loadedmetadata', function() {
    durationDisplay.textContent = formatTime(audio.duration);
    audio.play();
    updateVisualization();
});

audio.addEventListener('timeupdate', function() {
    updateProgress();
    updateSubtitles();
});

// Keyboard shortcuts
document.addEventListener('keydown', (event) => {
    switch (event.key.toLowerCase()) {
        case 'p':
            playPauseBtn.click();
            break;
        case 'q':
            window.location.href = "../index.html";
            break;
    }
});

// Start visualization
updateVisualization();