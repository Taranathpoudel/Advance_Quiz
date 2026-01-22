// Audio element and subtitle display
const audio = document.getElementById('anthem');
const anthomnp = new Audio("Audios\Nepalianthom.MP3")
const subtitleElement = document.getElementById('subtitle');

// Nepali Subtitles
// Nepali Subtitles
const subtitles = [
  { start: 0, end: 6.66, text: "" },
  { start: 13.191, end: 19.321, text: "सयौं थुँगा फूलका हामी, एउटै माला नेपाली" },
  { start: 19.776, end: 24.657, text: "सार्वभौम भई फैलिएका, मेची–माहाकाली।" },
  { start: 24.860, end: 30.420, text: "सयौं थुँगा फूलका हामी, एउटै माला नेपाली" },
  { start: 31.152, end: 36.204, text: "सार्वभौम भई फैलिएका, मेची–माहाकाली।" },
  { start: 36.448, end: 41.282, text: "प्रकृतिका कोटी–कोटी सम्पदाको आंचल" },
  { start: 41.994, end: 46.924, text: "वीरहरूका रगतले, स्वतन्त्र र अटल।" },
  { start: 47.371, end: 52.158, text: "ज्ञानभूमि, शान्तिभूमि तराई, पहाड, हिमाल" },
  { start: 52.835, end: 58.016, text: "अखण्ड यो प्यारो हाम्रो मातृभूमि नेपाल।" },
  { start: 58.016, end: 63.016, text: "बहुल जाति, भाषा, धर्म, संस्कृति छन् विशाल" },
  { start: 63.342, end: 68.016, text: "अग्रगामी राष्ट्र हाम्रो, जय जय नेपाल।" },
];


// Function to update subtitles
function updateSubtitles() {
    const currentTime = audio.currentTime;

    // Find the active subtitle
    const currentSubtitle = subtitles.find(sub => currentTime >= sub.start && currentTime <= sub.end);

    // Display the subtitle or clear it
    if (currentSubtitle) {
        subtitleElement.textContent = currentSubtitle.text;
        subtitleElement.style.opacity = '1'; // Show subtitle
    } else {
        subtitleElement.style.opacity = '0'; // Hide subtitle
    }
}

// Update subtitles on audio time update
audio.addEventListener('timeupdate', updateSubtitles);

// Keyboard shortcuts for actions
document.addEventListener("DOMContentLoaded", () => {
    document.addEventListener("keydown", (event) => {
        switch (event.key) {

            case 'p': // Key 'p' for buzzer sound
                anthomnp.play();
                break;
            case 'q': // Key 'q' for Index page
            // Access the main page which is one directly below ../
                window.location.href = "../index.html";
                break;
        }
    });
});
