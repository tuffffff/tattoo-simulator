// 1. Elemente aus dem DOM holen
const cameraNav = document.getElementById('nav-camera'); // Dein neues Menü-Element
const videoElement = document.getElementById('webcam');
const camHint = document.getElementById('cam-hint');
const overlayCanvas = document.getElementById('tattoo-overlay');
const ctx = overlayCanvas.getContext('2d');

let selectedTattooImage = null;
let cameraInstance = null; // Speichert die Kamera-Instanz, damit sie nur 1x startet

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

// 3. Funktion zum Starten der Kamera (wiederverwendbar)
async function startCamera() {
    // Falls die Kamera schon läuft, nicht nochmal neu starten
    if (cameraInstance) return;

    try {
        overlayCanvas.width = window.innerWidth;
        overlayCanvas.height = window.innerHeight;

        cameraInstance = new Camera(videoElement, {
            onFrame: async () => {
                await faceMesh.send({ image: videoElement });
            },
            width: window.innerWidth,
            height: window.innerHeight
        });

        await cameraInstance.start();

        videoElement.classList.add('active');
        overlayCanvas.classList.add('active');
    } catch (error) {
        console.error("Kamera-Fehler:", error);
    }
}

// 4. Hover- & Klick-Events für den "camera"-Menüpunkt
if (cameraNav) {
    // A) Beim DRÜBERFAHREN (Hover): NUR das Pop-up anzeigen
    cameraNav.addEventListener('mouseenter', () => {
        if (camHint) {
            camHint.textContent = "click to start the tattoo simulator";
            camHint.classList.add('active');
            camHint.style.display = 'block';
        }
    });

    // B) Beim VERLASSEN: Pop-up wieder verstecken (falls Kamera noch nicht aktiv)
    cameraNav.addEventListener('mouseleave', () => {
        if (camHint && !cameraInstance) {
            camHint.style.display = 'none';
        }
    });

    // C) Erst beim KLICKEN: Kamera starten!
    cameraNav.addEventListener('click', (e) => {
        e.preventDefault();
        
        startCamera(); // Kamera geht jetzt erst hier an!

        if (camHint) {
            camHint.textContent = "you like a tattoo? click one to try how it looks.";
            camHint.style.display = 'block';
        }
    });
}
// 5. Klick-Event für die Tattoo-Auswahl
document.querySelectorAll('.big-tattoos').forEach(tattooImg => {
    tattooImg.addEventListener('click', (e) => {
        selectedTattooImage = e.target; 
        if (camHint) {
            camHint.textContent = "click another one to try a different tattoo";
            camHint.style.display = 'block';
        }
    });
});


// 6. Zeichne-Schleife: Rendering auf der rechten Wange
function onResults(results) {
    const ctx = overlayCanvas.getContext('2d');
    ctx.clearRect(0, 0, overlayCanvas.width, overlayCanvas.height);

    if (results.multiFaceLandmarks && results.multiFaceLandmarks.length > 0 && selectedTattooImage) {
        const landmarks = results.multiFaceLandmarks[0];

        // Punkt 50 = Rechter Wangenknochen
        const cheek = landmarks[50];

        if (cheek) {
            const x = cheek.x * overlayCanvas.width;
            const y = cheek.y * overlayCanvas.height;
            
            // --- HIER DIE GRÖSSE ÄNDERN ---
            const size = 90; // Vorher 150, jetzt kleiner
            // -------------------------------

            // Zeichnen (Die Positionierung bleibt gleich)
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

//sidebar rechts//

const gallery = document.getElementById('tattoo-canvas');

if (gallery) {
    gallery.innerHTML = ''; // Leeren

    for (let i = 8; i <= 91; i++) {
        const img = document.createElement('img');
        const number = String(i).padStart(2, '0');
        
        img.src = `assets/png/Motiv-${number}.png`; 
        img.className = 'sidebar-flash';
        
        // Klick auf Flash wählt das Tattoo aus
        img.onclick = (e) => {
            selectedTattooImage = e.target;
            if (camHint) {
                camHint.textContent = "click another one to try a different tattoo";
                camHint.style.display = 'block';
            }
        };
        
        gallery.appendChild(img);
    }
}