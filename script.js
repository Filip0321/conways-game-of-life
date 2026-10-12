const SPALTEN = 80; // Auflösung der x-Achse, wie breit sie ist
const ZEILEN = 60; // Auflösung der y-Achse, wie hoch sie ist
const MILLI = 100;
const LUECKE = SPALTEN / ZEILEN / 10 / 2;
const INTERVALL = 100;

function hole(id) {
  const element = document.getElementById(id);
  if (!element) throw new Error("wasnhier los");
  return element;
}

const canvas = hole("grid");
const canvasTexture = canvas.getContext("2d");

const simulationBtn = hole("simulationBtn");
const leerBtn = hole("leerBtn");
const zufallBtn = hole("zufallBtn");

let simuliert = true;
let letzteZeit = 0;

let zelle;

// array mit den Zeilen und Spalten und dann durchgehen und malen
// entweder hat jeder eintrag ein paar (x, y)
// oder ich weiß wie lang die zeilen sind
// wenn x waagerecht ist und eine Zeile 60 lang ist, dann ist
//
// (0, 4) -> (0, 5)
// das gleiche wie
// 4 + 60
//
// oder generell eine bewegung auf y (in der höhe) ist + oder - gesamte breite
//
// Dann kann ich alle Zeilen und Spalten in eine eindimensionale Array packen

let grid = new Uint8Array(SPALTEN * ZEILEN);

function passeGroesseAn() {
  const dpr = Math.max(window.devicePixelRatio || 1, 2);
  canvas.width = Math.round(canvas.clientWidth * dpr);
  canvas.height = Math.round(canvas.width / 4 * 3);  // Seitenverhältnis des Spielfelds
  zelle = canvas.width / SPALTEN; 
 // console.log(canvas.width, canvas.height, SPALTEN, ZEILEN)                 
}

function index(x, y) {
  // nehme wie ein Array mit zahlen und übersetze
  // in die Position in dem Array aus Zahlen
  // |                  |
  // |                  |
  // |                  |
  // |*********         |
  // |******************|
  // ____________________
  //    SPALTE breit
  //
  // --> soviele SPALTEN wie y müssen belegt werden
  //     (weil erstes y = 0 sein kann) und dann die restliche breite addieren
  return y * SPALTEN + x;
}

function zeichne() {
  canvasTexture.fillStyle = "#111111";
  canvasTexture.fillRect(0, 0, canvas.width, canvas.height);
  canvasTexture.fillStyle = "#DDDDDD";
  const luecke = Math.max(1, Math.round(zelle * LUECKE));
  for (let i = 0; i < SPALTEN; i++) {
    for (let j = 0; j < ZEILEN; j++) {
      if(grid[index(i,j)]===0) continue;
      canvasTexture.fillRect(
        Math.floor(i*zelle), 
        Math.floor(j*zelle), 
        Math.floor((i+1)*zelle) - Math.floor(i*zelle) - 2 * luecke, 
        Math.floor((j+1)*zelle) - Math.floor(j*zelle) - 2 * luecke);
    }
  }
}

let naechstesGrid = new Uint8Array(SPALTEN * ZEILEN);

function nachbarn(x, y) {
  let anzahl = 0;
  for (let nebenX = -1; nebenX <= 1; nebenX++) {
    for (let nebenY = -1; nebenY <= 1; nebenY++) {
      if (nebenX === 0 && nebenY === 0) continue;
      const woNachbarX = (x + nebenX + SPALTEN) % SPALTEN;
      const woNachbarY = (y + nebenY + ZEILEN) % ZEILEN; 
      anzahl += grid[index(woNachbarX, woNachbarY)];
    }
  }
  return anzahl;
}

function schritt() {
  for (let x = 0; x < SPALTEN; x++) {
    for (let y = 0; y < ZEILEN; y++) {
      const n = nachbarn(x, y);
      const zelleLebt = grid[index(x, y)]; 
      const lebtWeiter = zelleLebt ? (n === 2 || n === 3) : n === 3; 
      naechstesGrid[index(x, y)] = lebtWeiter ? 1 : 0;
    }
  }
  [grid, naechstesGrid] = [naechstesGrid, grid]; 
}

function zufall(wahrscheinlichkeit) {
  for (let i = 0; i < grid.length; i++) {
    grid[i] = Math.random() < wahrscheinlichkeit ? 1 : 0;
  }
}

function leeren() {
  grid.fill(0)
}

function startStop(truefalse) {
  simuliert = truefalse;
  simulationBtn.textContent = simuliert ? "Stoppen" : "Simulieren";
}

simulationBtn.addEventListener("click", () => {
  startStop(!simuliert);
  zeichne();
});

leerBtn.addEventListener("click", () => {
  startStop(false);
  leeren();
  zeichne();
});

zufallBtn.addEventListener("click", () => {
  zufall(0.25);
  zeichne();
});

function schleife(zeit) {
  if (simuliert && zeit - letzteZeit >= INTERVALL) {
    schritt();
    zeichne();
    letzteZeit = zeit;
  }
  requestAnimationFrame(schleife);
}

passeGroesseAn();
zufall(0.5);
zeichne();
requestAnimationFrame(schleife);
