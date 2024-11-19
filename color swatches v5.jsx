// Color Swatches für Illustrator by Daniel Urban
// Gibt die verwendeten Farben eines ausgewählten Objektes oder Objektgruppe in Illustrator als Quadrate und zugehörigen RGB, CMYK und HEX Wert aus.
// Diese Funktion extrahiert Farben aus einem Pfad
function getColorsFromPath(path) {
    var colors = [];

    // Überprüfen, ob der Pfad ein zusammengesetzter Pfad ist
    if (path.typename === "CompoundPathItem") {
        // Iteriere durch alle Pfade innerhalb des zusammengesetzten Pfades
        for (var i = 0; i < path.pathItems.length; i++) {
            var currentPath = path.pathItems[i];
            // Prüfen, ob der aktuelle Pfad eine Füllfarbe hat und hinzufügen
            if (currentPath.filled) {
                colors.push(currentPath.fillColor);
            }
        }
    } else if (path.typename === "PathItem") {
        // Wenn der Pfad kein zusammengesetzter Pfad ist, nur die Füllfarbe des aktuellen Pfades hinzufügen
        if (path.filled) {
            colors.push(path.fillColor);
        }
    }

    return colors;
}

// Farben aus einem Verlauf extrahieren
function getColorsFromGradient(gradient) {
    var colors = [];
    if (gradient) {
        // Iteriere durch die Stops des Verlaufs und extrahiere deren Farben
        for (var i = 0; i < gradient.gradientStops.length; i++) {
            var stop = gradient.gradientStops[i];
            if (stop.color.typename === "RGBColor" || stop.color.typename === "CMYKColor") {
                colors.push(stop.color);
            }
        }
    }
    return colors;
}

//  Farben aus der Auswahl im Dokument extrahieren
function extractColorsFromSelection() {
    var selectedItems = app.activeDocument.selection;
    var allColors = [];
    var spotColors = [];
    var gradients = [];

    // Gehe alle ausgewählten Objekte durch
    for (var i = 0; i < selectedItems.length; i++) {
        var item = selectedItems[i];
        
        // Wenn das Objekt ein Text ist, färbe alle Textabschnitte
        if (item.typename === "TextFrame") {
            var text = item.textRange;
            if (text.fillColor !== undefined) {
                allColors.push(text.fillColor);
            }
        }
        // Farben aus Pfaden extrahieren
        else if (item.typename === "PathItem" || item.typename === "CompoundPathItem") {
            var colors = getColorsFromPath(item);
            allColors = allColors.concat(colors);
        }
        // Wenn es ein Verlauf ist, die Farben aus dem Verlauf extrahieren
        else if (item.fillColor.typename === "GradientColor") {
            var gradientColors = getColorsFromGradient(item.fillColor.gradient);
            gradients = gradients.concat(gradientColors);
        }
        // Wenn es eine Spotfarbe ist
        else if (item.fillColor.typename === "SpotColor") {
            spotColors.push(item.fillColor);
        }
    }

    // Rückgabe aller gefundenen Farben
    return {
        allColors: allColors,
        spotColors: spotColors,
        gradients: gradients
    };
}

// Hilfsfunktion, um Farbwerte zu RGB zu konvertieren
function convertColorToRGB(color) {
    var rgb = { red: 0, green: 0, blue: 0 };

    if (color.typename === "RGBColor") {
        rgb.red = Math.round(color.red);
        rgb.green = Math.round(color.green);
        rgb.blue = Math.round(color.blue);
    } else if (color.typename === "CMYKColor") {
        rgb.red = Math.round(255 * (1 - color.cyan / 100) * (1 - color.black / 100));
        rgb.green = Math.round(255 * (1 - color.magenta / 100) * (1 - color.black / 100));
        rgb.blue = Math.round(255 * (1 - color.yellow / 100) * (1 - color.black / 100));
    }

    return rgb;
}

// Funktion, um RGB in Hex umzuwandeln
function rgbToHex(r, g, b) {
    return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1).toUpperCase();
}

// Funktion, um CMYK in Hex umzuwandeln
function cmykToHex(cmyk) {
    var r = Math.round(255 * (1 - cmyk.cyan / 100) * (1 - cmyk.black / 100));
    var g = Math.round(255 * (1 - cmyk.magenta / 100) * (1 - cmyk.black / 100));
    var b = Math.round(255 * (1 - cmyk.yellow / 100) * (1 - cmyk.black / 100));
    return rgbToHex(r, g, b);
}

// Funktion, um CMYK in Hex umzuwandeln
function convertColorToCMYK(color) {
    var cmyk = { cyan: 0, magenta: 0, yellow: 0, black: 0 };

    if (color.typename === "CMYKColor") {
        cmyk.cyan = Math.round(color.cyan);
        cmyk.magenta = Math.round(color.magenta);
        cmyk.yellow = Math.round(color.yellow);
        cmyk.black = Math.round(color.black);
    } else if (color.typename === "RGBColor") {
        var r = color.red / 255;
        var g = color.green / 255;
        var b = color.blue / 255;

        var k = 1 - Math.max(r, g, b);
        var c = (1 - r - k) / (1 - k) * 100;
        var m = (1 - g - k) / (1 - k) * 100;
        var y = (1 - b - k) / (1 - k) * 100;

        cmyk.cyan = Math.round(c);
        cmyk.magenta = Math.round(m);
        cmyk.yellow = Math.round(y);
        cmyk.black = Math.round(k * 100);
    }

    return cmyk;
}

// Erstellt ein Rechteck und fügt den Text darunter hinzu
function createColorBox(color, x, y, boxSize, type) {
    var rgb = convertColorToRGB(color);
    var hex = rgbToHex(rgb.red, rgb.green, rgb.blue);
    var cmyk = convertColorToCMYK(color);

    var rect = app.activeDocument.pathItems.rectangle(y, x, boxSize, boxSize);
    rect.fillColor = color;
    rect.stroked = false;

    // Text links unterhalb der Box platzieren
    var text = app.activeDocument.textFrames.add();
    var colorType = type ? type : "";
    text.contents = colorType + "\nRGB: " + rgb.red + ", " + rgb.green + ", " + rgb.blue + "\nCMYK: " + cmyk.cyan + ", " + cmyk.magenta + ", " + cmyk.yellow + ", " + cmyk.black + "\nHex: " + hex;
    text.position = [x, y - boxSize - 15];  // Links unter der Box platzieren
    text.textRange.paragraphAttributes.justification = Justification.LEFT;  // Links ausrichten
}

// Funktion zum Vergleichen von Farben
function colorsAreEqual(color1, color2) {
    if (color1.typename !== color2.typename) return false;

    if (color1.typename === "RGBColor") {
        return color1.red === color2.red && color1.green === color2.green && color1.blue === color2.blue;
    } else if (color1.typename === "CMYKColor") {
        return color1.cyan === color2.cyan && color1.magenta === color2.magenta && color1.yellow === color2.yellow && color1.black === color2.black;
    }

    return false;
}

// Hauptfunktion: Durchläuft die Auswahl und erstellt für jede Farbe eine Box in einer tabellarischen Anordnung
function generateColorBoxes() {
    var colorData = extractColorsFromSelection();
    var allColors = colorData.allColors;
    var spotColors = colorData.spotColors || [];
    var gradients = colorData.gradients;

    var uniqueColors = [];

    // Duplikate entfernen
    for (var i = 0; i < allColors.length; i++) {
        var color = allColors[i];
        var colorExists = false;
        for (var j = 0; j < uniqueColors.length; j++) {
            if (colorsAreEqual(color, uniqueColors[j])) {
                colorExists = true;
                break;
            }
        }
        if (!colorExists) {
            uniqueColors.push(color);
        }
    }

    var x = 100;
    var y = 500;
    var boxSize = 50;
    var columns = 4;
    var currentColumn = 0;

    // Spotcolors an den Anfang
    for (var i = 0; i < spotColors.length; i++) {
        createColorBox(spotColors[i], x + (currentColumn * boxSize * 2), y, boxSize, "SpotColor");
        currentColumn++;
        if (currentColumn >= columns) {
            currentColumn = 0;
            y -= 150;
        }
    }

    // Verläufe am Ende
    for (var i = 0; i < gradients.length; i++) {
        createColorBox(gradients[i], x + (currentColumn * boxSize * 2), y, boxSize, "Verlauf");
        currentColumn++;
        if (currentColumn >= columns) {
            currentColumn = 0;
            y -= 150;
        }
    }

    // Alle anderen Farben ausgeben
    for (var i = 0; i < uniqueColors.length; i++) {
        createColorBox(uniqueColors[i], x + (currentColumn * boxSize * 2), y, boxSize);
        currentColumn++;
        if (currentColumn >= columns) {
            currentColumn = 0;
            y -= 150;
        }
    }
}

// Das Skript ausführen
generateColorBoxes();
