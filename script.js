window.addEventListener('load', function() {
    const canvas1 = document.getElementById('canvas1');
    const canvas2 = document.getElementById('canvas2');
    const ctx1 = canvas1.getContext('2d');
    const ctx2 = canvas2.getContext('2d');
    const successMessage = document.getElementById('successMessage');
    const controls = document.getElementById('controls');
    const debugInfo = document.getElementById('debugInfo');

    // Slider-Liste für WASD
    const sliderElements = [];
    let currentSliderIndex = 0;

    // Debug-Infos ein/aus
    let debugVisible = false;

    // Slider eingeklappt?
    let slidersCollapsed = false;

    // Gemeinsame Fraktal-Größe für BEIDE Canvasse
    let fractalSize = 0;

    // Canvasse IMMER exakt gleich groß + exakt positioniert
    function resizeCanvases() {
        const isPortrait = window.innerHeight > window.innerWidth;
        let canvasWidth, canvasHeight;

        if (isPortrait) {
            // Hochformat: zwei Canvas übereinander, je halbe Höhe, volle Breite
            canvasWidth  = window.innerWidth;
            canvasHeight = Math.floor(window.innerHeight / 2);

            // Positionen
            canvas1.style.left = '0px';
            canvas1.style.top  = '0px';

            canvas2.style.left = '0px';
            canvas2.style.top  = canvasHeight + 'px';
        } else {
            // Querformat: zwei Canvas nebeneinander, je halbe Breite, volle Höhe
            canvasWidth  = Math.floor(window.innerWidth / 2);
            canvasHeight = window.innerHeight;

            canvas1.style.left = '0px';
            canvas1.style.top  = '0px';

            canvas2.style.left = canvasWidth + 'px';
            canvas2.style.top  = '0px';
        }

        [canvas1, canvas2].forEach(canvas => {
            canvas.width  = canvasWidth;
            canvas.height = canvasHeight;
            canvas.style.width  = canvasWidth + 'px';
            canvas.style.height = canvasHeight + 'px';
        });

        // gemeinsame Basisgröße für beide Fraktale
        fractalSize = Math.min(canvasWidth, canvasHeight) * 0.3;

        applyCtxSettings();
        updateDebugInfo(); // Canvas-Dimensionen aktualisieren
    }

    // canvas settings
    function applyCtxSettings() {
        [ctx1, ctx2].forEach(ctx => {
            ctx.fillStyle = 'green';
            ctx.lineCap = 'round';
            ctx.shadowColor = 'rgba(0,0,0,0.7)';
            ctx.shadowOffsetX = 10;
            ctx.shadowOffsetY = 5;
            ctx.shadowBlur = 10;
        });
    }
    applyCtxSettings();

    // effect settings - linke Seite (änderbar)
    let blinkAlpha = 0;
    
    let sides = 5;
    let maxLevel = 3;
    let scale = 0.5;
    let spread = 0.7;
    let branches = 1;
    let color = 'hsl(290, 100%, 50%)';
    let lineWidth = 15;
    let lineLength = 1;
    let nLevelBranches = 2;

    // Target Fraktal - rechte Seite (fest)
    let targetSides = 5;
    let targetMaxLevel = 3;
    let targetScale = 0.5;
    let targetSpread = 0.7;
    let targetBranches = 1;
    let targetColor = 'hsl(290, 100%, 50%)';
    let targetLineWidth = 15;
    let targetLineLength = 1;
    let targetNLevelBranches = 2;
    let gameMode = false;

    // controls
    const randomizeButton = document.getElementById('randomizeButton');
    const resetButton = document.getElementById('resetButton');

    function sliderChange(){
        updateSliders();
        drawFractal();
        checkMatch();
    }

    // Slider-Controls holen
    const spreadControl = document.getElementById('spread');
    const spreadLabel = document.querySelector('[for="spread"]');
    spreadControl.addEventListener('change', function(e){
        spread = parseFloat(e.target.value);
        sliderChange();
    });

    const sidesControl = document.getElementById('sides');
    const sidesLabel = document.querySelector('[for="sides"]');
    sidesControl.addEventListener('change', function(e){
        sides = parseInt(e.target.value);
        sliderChange();
    });

    const levelsControl = document.getElementById('levels');
    const levelsLabel = document.querySelector('[for="levels"]');
    levelsControl.addEventListener('change', function(e){
        maxLevel = parseInt(e.target.value);
        sliderChange();
    });

    const scaleControl = document.getElementById('scale');
    const scaleLabel = document.querySelector('[for="scale"]');
    scaleControl.addEventListener('change', function(e){
        scale = parseFloat(e.target.value);
        sliderChange();
    });

    const lineWidthControl = document.getElementById('lineWidth');
    const lineWidthLabel = document.querySelector('[for="lineWidth"]');
    lineWidthControl.addEventListener('change', function(e){
        lineWidth = parseInt(e.target.value);
        sliderChange();
    });

    const lineLengthControl = document.getElementById('lineLength');
    const lineLengthLabel = document.querySelector('[for="lineLength"]');
    lineLengthControl.addEventListener('change', function(e){
        lineLength = parseFloat(e.target.value);
        sliderChange();
    });

    const branchingControl = document.getElementById('branching');
    const branchingLabel = document.querySelector('[for="branching"]');
    branchingControl.addEventListener('change', function(e){
        branches = parseInt(e.target.value);
        sliderChange();
    });

    const hueControl = document.getElementById('hue');
    const hueLabel = document.querySelector('[for="hue"]');
    hueControl.addEventListener('change', function(e){
        const hue = parseInt(e.target.value);
        color = 'hsl(' + hue + ', 100%, 50%)';
        sliderChange();
    });

    const nLevelBranchesControl = document.getElementById('nLevelBranches');
    const nLevelBranchesLabel = document.querySelector('[for="nLevelBranches"]');
    nLevelBranchesControl.addEventListener('change', function(e){
        nLevelBranches = parseInt(e.target.value);
        sliderChange();
    });

    // Slider in definierter Reihenfolge für WASD
    sliderElements.push(
        spreadControl,
        sidesControl,
        levelsControl,
        scaleControl,
        lineWidthControl,
        lineLengthControl,
        branchingControl,
        hueControl,
        nLevelBranchesControl
    );

    // Beim Fokussieren eines Sliders Index aktualisieren
    sliderElements.forEach((slider, index) => {
        slider.addEventListener('focus', () => {
            currentSliderIndex = index;
        });
    });

    function focusSlider(index) {
        if (sliderElements.length === 0) return;
        currentSliderIndex = (index + sliderElements.length) % sliderElements.length;
        const slider = sliderElements[currentSliderIndex];
        if (slider) {
            slider.focus();
        }
    }

    // WASD + R/Q + H + E Steuerung
    window.addEventListener('keydown', function(e) {
        const key = e.key.toLowerCase();

        // Shortcuts R und Q
        if (key === 'r') {
            if (!randomizeButton.disabled) {
                e.preventDefault();
                randomizeButton.click();
            }
            return;
        }

        if (key === 'q') {
            e.preventDefault();
            resetButton.click();
            return;
        }

        // Toggle Debug mit H
        if (key === 'h') {
            e.preventDefault();
            debugVisible = !debugVisible;
            if (debugInfo) {
                debugInfo.style.display = debugVisible ? 'block' : 'none';
            }
            return;
        }

        // Slider ein/ausklappen mit E
        if (key === 'e') {
            e.preventDefault();
            slidersCollapsed = !slidersCollapsed;
            document.body.classList.toggle('sliders-collapsed', slidersCollapsed);
            return;
        }

        // Nur WASD ab hier
        if (!['w', 'a', 's', 'd'].includes(key)) return;

        e.preventDefault();

        if (sliderElements.length === 0) return;

        if (key === 'w') {
            // nach oben, mit Wrap-around
            focusSlider(currentSliderIndex - 1);
        } else if (key === 's') {
            // nach unten, mit Wrap-around
            focusSlider(currentSliderIndex + 1);
        } else if (key === 'a' || key === 'd') {
            const slider = sliderElements[currentSliderIndex];
            const step = parseFloat(slider.step) || 1;
            const min = parseFloat(slider.min);
            const max = parseFloat(slider.max);
            let value = parseFloat(slider.value);

            if (key === 'a') {
                value = Math.max(min, value - step);
            } else {
                value = Math.min(max, value + step);
            }

            // auf Step runden
            value = Math.round(value / step) * step;
            slider.value = value;

            // change-Event auslösen, damit die Logik greift
            slider.dispatchEvent(new Event('change', { bubbles: true }));
        }
    });

    function drawBranch(level, ctx, currentSize, currentScale, currentLineLength, currentNLevelBranches, currentBranches, currentSpread, currentMaxLevel) {
        if (level > currentMaxLevel) return;
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(currentSize * currentLineLength, 0);
        ctx.stroke();
        for (let i = 0; i < currentBranches; i++) {
            ctx.save();
                ctx.translate(currentSize - (currentSize / currentBranches) * i, 0);
                ctx.scale(currentScale, currentScale);

                if (currentNLevelBranches == 0) {
                    // keine Rekursion
                }
                else if (currentNLevelBranches == 1) {
                    ctx.save();
                    ctx.rotate(currentSpread);
                    drawBranch(level + 1, ctx, currentSize, currentScale, currentLineLength, currentNLevelBranches, currentBranches, currentSpread, currentMaxLevel);
                    ctx.restore();
                }
                else if (currentNLevelBranches == 2) {
                    ctx.save();
                    ctx.rotate(currentSpread);
                    drawBranch(level + 1, ctx, currentSize, currentScale, currentLineLength, currentNLevelBranches, currentBranches, currentSpread, currentMaxLevel);
                    ctx.restore();

                    ctx.save();
                    ctx.rotate(-currentSpread);
                    drawBranch(level + 1, ctx, currentSize, currentScale, currentLineLength, currentNLevelBranches, currentBranches, currentSpread, currentMaxLevel);
                    ctx.restore();
                }

            ctx.restore();
        }
    }

    function drawFractal() {
        ctx1.clearRect(0, 0, canvas1.width, canvas1.height);
        // Overlay zuerst zeichnen (hinter Fraktal)
        if (blinkAlpha > 0) {
            ctx1.save();
            ctx1.globalAlpha = blinkAlpha;
            ctx1.fillStyle = '#90ff90';
            ctx1.fillRect(0, 0, canvas1.width, canvas1.height);
            ctx1.restore();
        }
        ctx1.save();
        ctx1.lineWidth = lineWidth;
        ctx1.strokeStyle = color;
        ctx1.translate(canvas1.width / 2, canvas1.height / 2);
        for (let i = 0; i < sides; i++) {
            ctx1.rotate((Math.PI * 2) / sides);
            drawBranch(0, ctx1, fractalSize, scale, lineLength, nLevelBranches, branches, spread, maxLevel);
        }
        ctx1.restore();
        randomizeButton.style.backgroundColor = color;
    }

    function drawTarget() {
        // gleiche Größe wie linkes Fraktal!
        ctx2.clearRect(0, 0, canvas2.width, canvas2.height);
        ctx2.save();
        ctx2.lineWidth = targetLineWidth;
        ctx2.strokeStyle = targetColor;
        ctx2.translate(canvas2.width / 2, canvas2.height / 2);
        for (let i = 0; i < targetSides; i++) {
            ctx2.rotate((Math.PI * 2) / targetSides);
            drawBranch(0, ctx2, fractalSize, targetScale, targetLineLength, targetNLevelBranches, targetBranches, targetSpread, targetMaxLevel);
        }
        ctx2.restore();
        updateDebugInfo();
    }

    function updateDebugInfo() {
        const debugContent = document.getElementById('debugContent');
        if (debugContent) {
            debugContent.innerHTML = `
                Canvas1: ${canvas1.width} × ${canvas1.height}<br>
                Canvas2: ${canvas2.width} × ${canvas2.height}<br><br>
                Seiten: ${targetSides}<br>
                Tiefe: ${targetMaxLevel}<br>
                Skalierung: ${targetScale.toFixed(1)}<br>
                Streuung: ${targetSpread.toFixed(1)}<br>
                Äste: ${targetBranches}<br>
                Linienbreite: ${targetLineWidth}<br>
                Länge: ${targetLineLength.toFixed(1)}<br>
                Verzweigung: ${targetNLevelBranches}
            `;
        }
    }

    function checkMatch() {
        if (!gameMode) return;

        let spreadMatch;
        if (nLevelBranches === 2 && targetNLevelBranches === 2) {
            spreadMatch = Math.abs(spread) === Math.abs(targetSpread);
        } else {
            spreadMatch = spread === targetSpread;
        }

        // extract hue from color string
        const currentHue = parseInt(color.slice(4, color.indexOf(',')));
        const targetHue = parseInt(targetColor.slice(4, targetColor.indexOf(',')));

        const match =
            sides === targetSides &&
            maxLevel === targetMaxLevel &&
            scale === targetScale &&
            spreadMatch &&
            branches === targetBranches &&
            lineWidth === targetLineWidth &&
            lineLength === targetLineLength &&
            nLevelBranches === targetNLevelBranches &&
            currentHue === targetHue;

        if (match) {
            blinkCanvasSuccess();
            successMessage.style.display = 'block';
            randomizeButton.disabled = false;
            setTimeout(() => {
                successMessage.style.display = 'none';
            }, 2000);
        }
    }

    function blinkCanvasSuccess() {
        blinkAlpha = 0.7;
        const duration = 500;
        const start = performance.now();

        function animate(now) {
            const elapsed = now - start;
            blinkAlpha = Math.max(0, 0.7 * (1 - elapsed / duration));
            drawFractal();
            if (elapsed < duration) {
                requestAnimationFrame(animate);
            } else {
                blinkAlpha = 0;
                drawFractal();
            }
        }
        requestAnimationFrame(animate);
    }

    function randomizeFractal() {
        // spread: -3.2 .. 3.2 step 0.1
        targetSpread = Number((Math.random() * 6.4 - 3.2).toFixed(1));
        // sides: 2 .. 15
        targetSides = Math.floor(Math.random() * 14) + 2;
        // levels: 1 .. 4
        targetMaxLevel = Math.floor(Math.random() * 4) + 1;
        // scale: 0.1 .. 0.9 step 0.1
        targetScale = Number((Math.random() * 0.8 + 0.1).toFixed(1));
        // lineWidth: 5,10,...,30
        targetLineWidth = (Math.floor(Math.random() * 6) + 1) * 5;
        // lineLength: 0.3 .. 1.0 step 0.1
        targetLineLength = Number((0.3 + Math.floor(Math.random() * 8) * 0.1).toFixed(1));
        // branches: 1 .. 3
        targetBranches = Math.floor(Math.random() * 3) + 1;
        // hue: 0, 30, 60, ..., 330 (step 30)
        const targetHue = Math.floor(Math.random() * 12) * 30;
        // nLevelBranches: 1 oder 2
        targetNLevelBranches = Math.floor(Math.random() * 2) + 1;
        targetColor = 'hsl(' + targetHue + ', 100%, 50%)';

        gameMode = true;
        randomizeButton.disabled = true;
        drawTarget();

        // direkt auf ersten Slider springen
        focusSlider(0);
    }

    randomizeButton.addEventListener('click', function(){
        randomizeFractal();
    });

    function resetFractal() {
        sides = 5;
        maxLevel = 3;
        scale = 0.5;
        spread = 0.7;
        branches = 1;
        color = 'hsl(290, 100%, 50%)';
        lineWidth = 15;
        nLevelBranches = 2;
        lineLength = 1;
        gameMode = false;
        randomizeButton.disabled = false;
        successMessage.style.display = 'none';
        ctx2.clearRect(0, 0, canvas2.width, canvas2.height);
        updateSliders();
        drawFractal();
        updateDebugInfo();
    }

    resetButton.addEventListener('click', function(){
        resetFractal();
        // nach Reset: wieder Randomize-Button fokussieren
        randomizeButton.focus();
    });

    function updateSliders() {
        spreadControl.value = spread;
        spreadLabel.innerText = 'Streuung: ' + Number(spread.toFixed(1));
        sidesControl.value = sides;
        sidesLabel.innerText = 'Seiten: ' + sides;
        levelsControl.value = maxLevel;
        levelsLabel.innerText = 'Tiefe: ' + maxLevel;
        scaleControl.value = scale;
        scaleLabel.innerText = 'Skalierung: ' + Number(scale.toFixed(2));
        lineWidthControl.value = lineWidth;
        lineWidthLabel.innerText = 'Linienbreite: ' + lineWidth;
        lineLengthControl.value = lineLength;
        lineLengthLabel.innerText = 'Länge: ' + Number(lineLength.toFixed(1));
        branchingControl.value = branches;
        branchingLabel.innerText = 'Äste: ' + branches;
        hueControl.value = parseInt(color.slice(4, color.indexOf(',')));
        hueLabel.innerText = 'Farbton: ' + hueControl.value;
        nLevelBranchesControl.value = nLevelBranches;
        nLevelBranchesLabel.innerText = 'Verzweigung: ' + nLevelBranches;
    }
    updateSliders();

    // Initialisierung
    setTimeout(() => {
        resizeCanvases();
        drawFractal();
        updateDebugInfo();
        // Fokus am Start auf Randomisieren-Schaltfläche
        randomizeButton.focus();
    }, 100);

    window.addEventListener('resize', function(){
        resizeCanvases();
        drawFractal();
        if (gameMode) drawTarget();
    });

    drawFractal();
});
