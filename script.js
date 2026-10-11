const SPALTEN = 80;
const ZEILEN = 60;
const MILLI = 100;
const ZELLE = 8;

function hole(id) {
  const element = document.getElementById(id) 
  if (!element) throw new Error("wasnhier los");
  return element;
}

const canvas = hole("grid");
const canvasTexture = canvas.createContext("2d") 

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


