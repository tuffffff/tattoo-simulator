// 1. Variablen anlegen
let selectedTattooImage = null;
let cameraInstance = null;
let hasChosenTattoo = false;

// 2. Elemente aus dem DOM holen
const navCamera = document.getElementById('nav-camera');
const navAbout = document.getElementById('nav-about');
const navImprint = document.getElementById('nav-imprint');

const hintCamera = document.getElementById('hint-camera');
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

// 4. Funktion zum Starten der Kamera (mit Spiegelung)
async function startCamera() {
    if (cameraInstance) return;

    try {
        cameraInstance = new Camera(videoElement, {
            onFrame: async () => {
                // Sende das gespiegelte Videobild an FaceMesh
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

// 5. Steuerung: CAMERA (Per Klick öffnen / Umschalten)
if (navCamera) {
    navCamera.addEventListener('click', (e) => {
        e.preventDefault();
        
        // Wenn die Hintbox der Kamera offen ist: Schließen
        if (hintCamera && hintCamera.classList.contains('active')) {
            hintCamera.classList.remove('active');
            return;
        }

        hideAllHints();
        startCamera();
        
        if (hintCamera && !hasChosenTattoo) {
            hintCamera.textContent = "you like a tattoo? click one in the gallery to try how it looks.";
            hintCamera.classList.add('active');
        }
    });
}

// 6. Steuerung: ABOUT (Toggle per Klick)
if (navAbout) {
    navAbout.addEventListener('click', (e) => {
        e.preventDefault();
        const isOpen = hintAbout.classList.contains('active');
        hideAllHints();
        
        if (!isOpen) {
            hintAbout.classList.add('active');
        }
    });
}

// 7. Steuerung: IMPRINT (Toggle per Klick)
if (navImprint) {
    navImprint.addEventListener('click', (e) => {
        e.preventDefault();
        const isOpen = hintImprint.classList.contains('active');
        hideAllHints();
        
        if (!isOpen) {
            hintImprint.classList.add('active');
        }
    });
}

// Klick auf eine offene Hintbox schließt sie wieder
[hintCamera, hintAbout, hintImprint].forEach(box => {
    if (box) {
        box.addEventListener('click', () => {
            box.classList.remove('active');
        });
    }
});

// 8. Zeichne-Schleife für Gesichtstracking (Motiv wird ent-spiegelt)
function onResults(results) {
    const ctx = overlayCanvas.getContext('2d');
    ctx.clearRect(0, 0, overlayCanvas.width, overlayCanvas.height);

    if (results.multiFaceLandmarks && results.multiFaceLandmarks.length > 0 && selectedTattooImage) {
        const landmarks = results.multiFaceLandmarks[0];
        
        // Da das Bild gespiegelt ist, nutzen wir für den optisch linken Wangenknochen Punkt 280
        const cheek = landmarks[280];

        if (cheek) {
            const x = cheek.x * overlayCanvas.width;
            const y = cheek.y * overlayCanvas.height;
            const size = 90;

            // Canvas-Kontext kurz isolieren
            ctx.save();
            
            // 1. Koordinatensystem zum Mittelpunkt des Tattoos verschieben
            ctx.translate(x, y);
            
            // 2. Das Tattoo lokal spiegeln (macht die globale Canvas-Spiegelung für das Motiv rückgängig)
            ctx.scale(-1, 1);
            
            // 3. Bild zentriert an Position (0,0) zeichnen
            ctx.drawImage(
                selectedTattooImage, 
                -(size / 2), 
                -(size / 2), 
                size, 
                size
            );
            
            // Canvas-Kontext wieder zurücksetzen
            ctx.restore();
        }
    }
}

// 9. Galerie Sidebar-Bilder laden
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
            
        
            // Einmaliger Hinweis beim ersten Tattoo-Klick
            if (!hasChosenTattoo) {
                if (hintCamera) {
                    hintCamera.textContent = "click another one to try a different tattoo";
                    hintCamera.classList.add('active');
                    
                    // Schließt die Info automatisch nach 3 Sekunden
                    setTimeout(() => {
                        hintCamera.classList.remove('active');
                    }, 3000);
                }
                hasChosenTattoo = true;
            } else {
                if (hintCamera) {
                    hintCamera.classList.remove('active');
                }
            }
        };
        
        gallery.appendChild(img);
    }
}