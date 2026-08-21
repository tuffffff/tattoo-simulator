// 1. Elemente aus dem DOM holen
const navCamera = document.getElementById('nav-camera');
const navAbout = document.getElementById('nav-about');
const navImprint = document.getElementById('nav-imprint');

const hintCamera = document.getElementById('hint-camera');
const hintAbout = document.getElementById('hint-about');
const hintImprint = document.getElementById('hint-imprint');

const videoElement = document.getElementById('webcam');
const overlayCanvas = document.getElementById('tattoo-overlay');

let selectedTattooImage = null;
let cameraInstance = null;

// 2. MediaPipe FaceMesh konfigurieren
const faceMesh = new FaceMesh({
    locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/${file}`
});

faceMesh.setOptions({
    maxNumFaces: 1,           
    refineLandmarks: true,    
    minDetectionConfidence: 0.5,
    minTrackingConfidence: 0.5
});

faceMesh.onResults(onResults);

// 3. Funktion zum Starten der Kamera
async function startCamera() {
    if (cameraInstance) return;

    try {
        cameraInstance = new Camera(videoElement, {
            onFrame: async () => {
                await faceMesh.send({ image: videoElement });
            },
            width: 1280,
            height: 720
        });

        await cameraInstance.start();

        videoElement.onloadeddata = () => {
            overlayCanvas.width = videoElement.videoWidth;
            overlayCanvas.height = videoElement.videoHeight;
        };

        videoElement.classList.add('active');
        overlayCanvas.classList.add('active');
    } catch (error) {
        console.error("Kamera-Fehler:", error);
    }
}

// Hilfsfunktion: Schließt alle offenen Hint-Boxen
function hideAllHints() {
    if (hintCamera) hintCamera.classList.remove('active');
    if (hintAbout) hintAbout.classList.remove('active');
    if (hintImprint) hintImprint.classList.remove('active');
}

// 4. Steuerung: CAMERA
if (navCamera) {
    navCamera.addEventListener('mouseenter', () => {
        if (!hintCamera.classList.contains('active')) {
            hintCamera.textContent = "click to start the tattoo simulator";
            hintCamera.classList.add('active');
        }
    });

    navCamera.addEventListener('mouseleave', () => {
        if (!cameraInstance) {
            hintCamera.classList.remove('active');
        }
    });

    navCamera.addEventListener('click', (e) => {
        e.preventDefault();
        startCamera();
        if (hintCamera) {
            hintCamera.textContent = "you like a tattoo? click one in the gallery to try how it looks.";
            hintCamera.classList.add('active');
        }
    });
}

// 5. Steuerung: ABOUT (Hover in & Hover out)
if (navAbout) {
    navAbout.addEventListener('mouseenter', () => {
        if (hintAbout) hintAbout.classList.add('active');
    });

    navAbout.addEventListener('mouseleave', () => {
        if (hintAbout) hintAbout.classList.remove('active');
    });
}

// 6. Steuerung: IMPRINT (Hover in & Hover out)
if (navImprint) {
    navImprint.addEventListener('mouseenter', () => {
        if (hintImprint) hintImprint.classList.add('active');
    });

    navImprint.addEventListener('mouseleave', () => {
        if (hintImprint) hintImprint.classList.remove('active');
    });
}
// 7. Zeichne-Schleife für Gesichtstracking
function onResults(results) {
    const ctx = overlayCanvas.getContext('2d');
    ctx.clearRect(0, 0, overlayCanvas.width, overlayCanvas.height);

    if (results.multiFaceLandmarks && results.multiFaceLandmarks.length > 0 && selectedTattooImage) {
        const landmarks = results.multiFaceLandmarks[0];
        const cheek = landmarks[50]; // Punkt 50 = Rechter Wangenknochen

        if (cheek) {
            const x = cheek.x * overlayCanvas.width;
            const y = cheek.y * overlayCanvas.height;
            const size = 90;

            ctx.drawImage(
                selectedTattooImage, 
                x - (size / 2), 
                y - (size / 2), 
                size, 
                size
            );
        }
    }
}

// 8. Galerie Sidebar-Bilder laden
const gallery = document.getElementById('tattoo-canvas');

if (gallery) {
    gallery.innerHTML = '';

    for (let i = 8; i <= 91; i++) {
        const img = document.createElement('img');
        const number = String(i).padStart(2, '0');
        
        img.src = `assets/png/Motiv-${number}.png`; 
        img.className = 'sidebar-flash';
        
        img.onclick = (e) => {
            selectedTattooImage = e.target;
            if (hintCamera) {
                hintCamera.textContent = "click another one to try a different tattoo";
                hintCamera.classList.add('active');
            }
        };
        
        gallery.appendChild(img);
    }
}