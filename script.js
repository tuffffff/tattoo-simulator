// 1. Variablen anlegen
let selectedTattooImage = null;
let cameraInstance = null;
let hasChosenTattoo = false;

// 2. Elemente aus dem DOM holen
const startCamBtn = document.getElementById('start-cam-btn');
const navAbout = document.getElementById('nav-about');
const navImprint = document.getElementById('nav-imprint');

const hintCamera = document.getElementById('hint-camera');
const hintCameraText = document.getElementById('hint-camera-text');
const hintAbout = document.getElementById('hint-about');
const hintImprint = document.getElementById('hint-imprint');

const videoElement = document.getElementById('webcam');
const overlayCanvas = document.getElementById('tattoo-overlay');

// 3. MediaPipe FaceMesh konfigurieren
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

// 4. Funktion zum Starten der Kamera
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
        
        // Start-Button mittig ausblenden
        if (startCamBtn) startCamBtn.classList.add('hidden');
        
    } catch (error) {
        console.error("Kamera-Fehler:", error);
    }
}

// Hilfsfunktion: Schließt alle offenen Pop-ups
function hideAllHints() {
    [hintCamera, hintAbout, hintImprint].forEach(box => {
        if (box) box.classList.remove('active');
    });
}

// 5. Kamera über den Center-Button starten
if (startCamBtn) {
    startCamBtn.addEventListener('click', () => {
        startCamera();
        hideAllHints();
        if (hintCamera && !hasChosenTattoo) {
            hintCameraText.textContent = "see a tattoo you like? click it in the gallery to try it on!";
            hintCamera.classList.add('active');
        }
    });
}

// 6. Steuerung: ABOUT / ? (Toggle per Klick)
if (navAbout) {
    navAbout.addEventListener('click', (e) => {
        e.preventDefault();
        const isOpen = hintAbout.classList.contains('active');
        hideAllHints();
        if (!isOpen) hintAbout.classList.add('active');
    });
}

// 7. Steuerung: IMPRINT (Toggle per Klick)
if (navImprint) {
    navImprint.addEventListener('click', (e) => {
        e.preventDefault();
        const isOpen = hintImprint.classList.contains('active');
        hideAllHints();
        if (!isOpen) hintImprint.classList.add('active');
    });
}

// 8. "X"-Buttons in allen Pop-ups aktivieren
document.querySelectorAll('.close-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const parentBox = btn.closest('.hint-box');
        if (parentBox) parentBox.classList.remove('active');
    });
});

// 9. Zeichne-Schleife für Face Tracking
function onResults(results) {
    const ctx = overlayCanvas.getContext('2d');
    ctx.clearRect(0, 0, overlayCanvas.width, overlayCanvas.height);

    if (results.multiFaceLandmarks && results.multiFaceLandmarks.length > 0 && selectedTattooImage) {
        const landmarks = results.multiFaceLandmarks[0];
        const cheek = landmarks[280];

        if (cheek) {
            const x = cheek.x * overlayCanvas.width;
            const y = cheek.y * overlayCanvas.height;
            const size = 90;

            ctx.save();
            ctx.translate(x, y);
            ctx.scale(-1, 1);
            ctx.drawImage(selectedTattooImage, -(size / 2), -(size / 2), size, size);
            ctx.restore();
        }
    }
}

// 10. Galerie Sidebar-Bilder laden
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
            
            // Falls Kamera noch nicht läuft, bei Klick auf ein Motiv automatisch starten
            if (!cameraInstance) {
                startCamera();
            }
            
            if (!hasChosenTattoo) {
                if (hintCamera) {
                    hintCameraText.textContent = "click another one to try a different tattoo";
                    hintCamera.classList.add('active');
                    
                    setTimeout(() => {
                        hintCamera.classList.remove('active');
                    }, 3000);
                }
                hasChosenTattoo = true;
            } else {
                if (hintCamera) hintCamera.classList.remove('active');
            }
        };
        
        gallery.appendChild(img);
    }
}