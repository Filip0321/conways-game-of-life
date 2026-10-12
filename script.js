const SPALTEN = 80; // Auflösung der x-Achse, wie breit sie ist
const ZEILEN = 60; // Auflösung der y-Achse, wie hoch sie ist
const MILLI = 100;
const LUECKE = SPALTEN / ZEILEN / 10;
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

let nachbar1 = 2;
let nachbar2 = 3;
let nachbar3 = 3;

let nachbar1Feld = hole("nachbar1")
let nachbar2Feld = hole("nachbar2")
let nachbar3Feld = hole("nachbar3")

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
  canvas.height = Math.round((canvas.width / 4) * 3); // Seitenverhältnis des Spielfelds
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
      if (grid[index(i, j)] === 0) continue;
      canvasTexture.fillRect(
        Math.floor(i * zelle),
        Math.floor(j * zelle),
        Math.floor((i + 1) * zelle) - Math.floor(i * zelle) - luecke,
        Math.floor((j + 1) * zelle) - Math.floor(j * zelle) - luecke,
      );
    }
  }
}

let naechstesGrid = new Uint8Array(SPALTEN * ZEILEN);

function nachbarn(x, y) {
  let anzahl = 0;
  for (let nebenX = -1; nebenX <= 1; nebenX++) {
    for (let nebenY = -1; nebenY <= 1; nebenY++) {
      if (nebenX === 0 && nebenY === 0) continue;
      //  ___________________
      //  |     |     |     |
      //  | x-1 |  x  | x+1 |
      //  | y-1 | y-1 | y-1 |
      //  |_____|_____|_____|
      //  |     |     |     |
      //  | x-1 |  x  | x+1 |
      //  |  y  |  y  |  y  |
      //  |_____|_____|_____|
      //  |     |     |     |
      //  | x-1 |  x  | x+1 |
      //  | y+1 | y+1 | y+1 |
      //  |_____|_____|_____|
      //
      const wessenNachbarX = (x + nebenX + SPALTEN) % SPALTEN;
      // % SPALTEN, damit es im rahmen bleibt - dafür muss man natürlich dann + SPALTEN, sonst kommt immer 0
      // also fall es mit +1 oder -1 über den Rahmen geht
      const wessenNachbarY = (y + nebenY + ZEILEN) % ZEILEN;
      anzahl += grid[index(wessenNachbarX, wessenNachbarY)];
    }
  }
  return anzahl;
}
// Jede Zelle hat 8 nachbar

function schritt() {
  for (let x = 0; x < SPALTEN; x++) {
    for (let y = 0; y < ZEILEN; y++) {
      const n = nachbarn(x, y); // wieviele Nachbarn (zahl der lebenden)
      const zelleLebt = grid[index(x, y)]; // 1 oder 0
      const lebtWeiter = zelleLebt ? n === nachbar1 || n === nachbar2 : n === nachbar3;
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

// malen
let malen = false; // wird gemalt?
let malwert = 1; // was soll mit der Zelle passieren
let letzteZelle = null;

function getroffeneZelle(event) {
  const rect = canvas.getBoundingClientRect(); 
  // gibt zurück wie groß und wo, relativ im viewport sich das element befindet
  const x = Math.floor(((event.clientX - rect.left) / rect.width) * SPALTEN); 
  // rect.left gibt die link position wieder oder der wert von x
  // Event.clientX gibt die x coordinate der Mouse IM VIEWPORT wieder, nicht koordinate in der page 
  // also zuerst x-Koordinate im rect finden 
  // im verhältnis mit breite von rect setzen (prozentual)
  // Mit anzahl der Spalten multiplizieren, denn alles Zellen ausrechnen und index ist in Spalten
  // FLOOR weil Spalte nach rechts aufgezogen wird --> Spalte 8.8 ist immer noch Spalte 9 (für punkte dann -1)
  const y = Math.floor((event.clientY - rect.top) / rect.height * ZEILEN);
  // left und top --> Weil es von links oben anfängt zu malen mit
  //      (0, 0) _____________________ (width, 0)
  //             |
  //             |
  //             |
  // (0, height) |
  return {
    x: Math.min(Math.max(x, 0), SPALTEN - 1),
    y: Math.min(Math.max(y, 0), ZEILEN - 1)
  };
  // ein Punkt zurück mit koordinaten in Spalte und Zeile.
  // also zwischen 0 und Spaltenanzahl - 1
  // wie wir vorhin sahen ist Spalte 1 bis 0.9 (da aber koordinaten bei (0,0) beginnen muss -1)
}

function linieMalen(von, bis) {
  const distanzX = bis.x - von.x;
  const distanzY = bis.y - von.y;
  const schritte = Math.max(Math.abs(distanzX), Math.abs(distanzY), 1);
  // wie weit ist der zweite Wert entfernt (mindestens 1 natürlich)
  for (let i = 0; i <= schritte; i++) {
    const x = Math.floor(von.x + distanzX * i / schritte);
    // in jeder schleife einen Punkt malen der den Startwert + Anteil der Distanz hin zum Ziel
    // also immer weiter weg
    // (1, 0) -> (4, 0) = distanzX ist 3 also (1+0, 0) -> (1+1, 0) -> (1+2, 0) -> (1+3, 0)
    const y = Math.floor(von.y + distanzY * i / schritte);
    grid[index(x, y)] = malwert;
  }
}

canvas.addEventListener("pointerdown", (e) => {
  malen = true;
  canvas.setPointerCapture(e.pointerId);
  const punkt = getroffeneZelle(e);
  malwert = grid[index(punkt.x, punkt.y)] ? 0 : 1;
  // beginnt man mit malen auf einem weißen Feld, macht man alle schwarz
  // beginnt man auf einem schwarzen Feld macht man alle weiß
  linieMalen(punkt, punkt);
  letzteZelle = punkt;
  zeichne();
});

// e ist PointerEvent und hat property "pointerId"
// wenn PointerEvent dann wird mit der Variabel die Koordinaten mitgegeben
canvas.addEventListener("pointermove", (e) => {
  if (!malen) return;
  const punkt = getroffeneZelle(e);
  linieMalen(letzteZelle, punkt);
  letzteZelle = punkt;
  zeichne();
});

function nichtMehrMalen() {
  malen = false;
  letzteZelle = null;
}

canvas.addEventListener("pointerup", nichtMehrMalen());
canvas.addEventListener("pointercancel", nichtMehrMalen());

function leeren() {
  grid.fill(0);
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

function leseGanzzahl(feld, min, max, bisher) {
  const eingabe = feld.value.trim();
  const zahl = Number(eingabe);

  if (eingabe === "" || !Number.isFinite(zahl)) {
    feld.value = bisher;
    return bisher;
  }

  const ergebnis = Math.min(Math.max(Math.round(zahl), min), max);
  feld.value = ergebnis;
  return ergebnis;
}

nachbar1Feld.addEventListener("change", () => {
  nachbar1 = leseGanzzahl(nachbar1Feld, 0, 8, nachbar1);
  leeren();
  zufall(0.25);
  zeichne();
});

nachbar2Feld.addEventListener("change", () => {
  nachbar2 = leseGanzzahl(nachbar2Feld, 0, 8, nachbar2);
  leeren();
  zufall(0.25);
  zeichne();
});

nachbar3Feld.addEventListener("change", () => {
  nachbar3 = leseGanzzahl(nachbar3Feld, 0, 8, nachbar3);
  leeren();
  zufall(0.25);
  zeichne();
});

window.addEventListener("resize", () => {
  passeGroesseAn();
  zeichne();
})

passeGroesseAn();
zufall(0.5);
zeichne();
requestAnimationFrame(schleife);
