window.addEventListener('load', function() {
    const canvas1 = document.getElementById('canvas1');
    const canvas2 = document.getElementById('canvas2');
    const ctx1 = canvas1.getContext('2d');
    const ctx2 = canvas2.getContext('2d');

    const successMessage = document.getElementById('successMessage');
    const controls = document.getElementById('controls');
    const debugInfo = document.getElementById('debugInfo');

    const helpButton = document.getElementById('helpButton');
    const helpOverlay = document.getElementById('helpOverlay');
    const themeToggle = document.getElementById('themeToggle');

    const randomizeButton = document.getElementById('randomizeButton');
    const resetButton = document.getElementById('resetButton');

    // Slider-Elemente
    const spreadControl = document.getElementById('spread');
    const spreadLabel = document.querySelector('[for="spread"]');

    const sidesControl = document.getElementById('sides');
    const sidesLabel = document.querySelector('[for="sides"]');

    const levelsControl = document.getElementById('levels');
    const levelsLabel = document.querySelector('[for="levels"]');

    const scaleControl = document.getElementById('scale');
    const scaleLabel = document.querySelector('[for="scale"]');

    const lineWidthControl = document.getElementById('lineWidth');
    const lineWidthLabel = document.querySelector('[for="lineWidth"]');

    const lineLengthControl = document.getElementById('lineLength');
    const lineLengthLabel = document.querySelector('[for="lineLength"]');

    const branchingControl = document.getElementById('branching');
    const branchingLabel = document.querySelector('[for="branching"]');

    const hueControl = document.getElementById('hue');
    const hueLabel = document.querySelector('[for="hue"]');

    const nLevelBranchesControl = document.getElementById('nLevelBranches');
    const nLevelBranchesLabel = document.querySelector('[for="nLevelBranches"]');

    // Slider-Liste für WASD
    const sliderElements = [
        spreadControl,
        sidesControl,
        levelsControl,
        scaleControl,
        lineWidthControl,
        lineLengthControl,
        branchingControl,
        hueControl,
        nLevelBranchesControl
    ];
    let currentSliderIndex = 0;

    // Zustände
    let debugVisible = false;
    let slidersCollapsed = false;

    // Gemeinsame Fraktal-Größe für BEIDE Canvasse
    let fractalSize = 0;

    // Effekt-Einstellungen – linke Seite (spielerseitig)
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

    // Target-Fraktal – rechte Seite (Ziel)
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

    // ==============================
    // Canvas-Größe & Position
    // ==============================
    function resizeCanvases() {
        const isPortrait = window.innerHeight > window.innerWidth;
        let canvasWidth, canvasHeight;

        if (isPortrait) {
            // Hochformat: zwei Canvasse übereinander
            canvasWidth  = window.innerWidth;
            canvasHeight = Math.floor(window.innerHeight / 2);

            canvas1.style.left = '0px';
            canvas1.style.top  = '0px';

            canvas2.style.left = '0px';
            canvas2.style.top  = canvasHeight + 'px';
        } else {
            // Querformat: zwei Canvasse nebeneinander
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
        updateDebugInfo();
    }

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

    // ==============================
    // Slider / UI-Logik
    // ==============================
    function sliderChange() {
        updateSliders();
        drawFractal();
        checkMatch();
    }

    spreadControl.addEventListener('change', e => {
        spread = parseFloat(e.target.value);
        sliderChange();
    });

    sidesControl.addEventListener('change', e => {
        sides = parseInt(e.target.value);
        sliderChange();
    });

    levelsControl.addEventListener('change', e => {
        maxLevel = parseInt(e.target.value);
        sliderChange();
    });

    scaleControl.addEventListener('change', e => {
        scale = parseFloat(e.target.value);
        sliderChange();
    });

    lineWidthControl.addEventListener('change', e => {
        lineWidth = parseInt(e.target.value);
        sliderChange();
    });

    lineLengthControl.addEventListener('change', e => {
        lineLength = parseFloat(e.target.value);
        sliderChange();
    });

    branchingControl.addEventListener('change', e => {
        branches = parseInt(e.target.value);
        sliderChange();
    });

    hueControl.addEventListener('change', e => {
        const hue = parseInt(e.target.value);
        color = 'hsl(' + hue + ', 100%, 50%)';
        sliderChange();
    });

    nLevelBranchesControl.addEventListener('change', e => {
        nLevelBranches = parseInt(e.target.value);
        sliderChange();
    });

    // Fokus-Tracking für WASD
    sliderElements.forEach((slider, index) => {
        slider.addEventListener('focus', () => {
            currentSliderIndex = index;
        });
    });

    function focusSlider(index) {
        if (!sliderElements.length) return;
        currentSliderIndex = (index + sliderElements.length) % sliderElements.length;
        const slider = sliderElements[currentSliderIndex];
        if (slider) slider.focus();
    }

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

        const hue = parseInt(color.slice(4, color.indexOf(',')));
        hueControl.value = hue;
        hueLabel.innerText = 'Farbton: ' + hue;

        nLevelBranchesControl.value = nLevelBranches;
        nLevelBranchesLabel.innerText = 'Verzweigung: ' + nLevelBranches;
    }

    // ==============================
    // Tastatur-Shortcuts
    // ==============================
    window.addEventListener('keydown', function(e) {
        const key = e.key.toLowerCase();

        // R: Randomisieren (nur wenn Button aktiv)
        if (key === 'r') {
            if (!randomizeButton.disabled) {
                e.preventDefault();
                randomizeButton.click();
            }
            return;
        }

        // Q: Reset
        if (key === 'q') {
            e.preventDefault();
            resetButton.click();
            return;
        }

        // H: Debug-Infos anzeigen/ausblenden
        if (key === 'h') {
            e.preventDefault();
            debugVisible = !debugVisible;
            if (debugInfo) {
                debugInfo.style.display = debugVisible ? 'block' : 'none';
            }
            return;
        }

        // E: Slider ein-/ausklappen
        if (key === 'e') {
            e.preventDefault();
            slidersCollapsed = !slidersCollapsed;
            document.body.classList.toggle('sliders-collapsed', slidersCollapsed);
            return;
        }

        // WASD für Slider
        if (!['w', 'a', 's', 'd'].includes(key)) return;
        e.preventDefault();
        if (!sliderElements.length) return;

        if (key === 'w') {
            // nach oben, wrap
            focusSlider(currentSliderIndex - 1);
        } else if (key === 's') {
            // nach unten, wrap
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
            value = Math.round(value / step) * step;
            slider.value = value;
            slider.dispatchEvent(new Event('change', { bubbles: true }));
        }
    });

    // ==============================
    // Help-Overlay & Theme
    // ==============================
    if (helpButton && helpOverlay) {
        helpButton.addEventListener('click', () => {
            const visible = helpOverlay.style.display === 'block';
            helpOverlay.style.display = visible ? 'none' : 'block';
        });
    }

    if (themeToggle) {
        themeToggle.addEventListener('click', () => {
            const isLight = document.body.classList.toggle('light-mode');
            themeToggle.textContent = isLight ? '☀' : '☾';
        });
    }

    function showInitialHelp() {
        if (!helpOverlay) return;
        helpOverlay.style.display = 'block';
        setTimeout(() => {
            if (helpOverlay.style.display === 'block') {
                helpOverlay.style.display = 'none';
            }
        }, 6000);
    }

    // ==============================
    // Fraktal-Zeichnen
    // ==============================
    function drawBranch(level, ctx, cfg) {
        if (level > cfg.maxLevel) return;

        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(cfg.size * cfg.lineLength, 0);
        ctx.stroke();

        for (let i = 0; i < cfg.branches; i++) {
            ctx.save();
            ctx.translate(cfg.size - (cfg.size / cfg.branches) * i, 0);
            ctx.scale(cfg.scale, cfg.scale);

            if (cfg.nLevelBranches === 1) {
                ctx.save();
                ctx.rotate(cfg.spread);
                drawBranch(level + 1, ctx, cfg);
                ctx.restore();
            } else if (cfg.nLevelBranches === 2) {
                ctx.save();
                ctx.rotate(cfg.spread);
                drawBranch(level + 1, ctx, cfg);
                ctx.restore();

                ctx.save();
                ctx.rotate(-cfg.spread);
                drawBranch(level + 1, ctx, cfg);
                ctx.restore();
            }
            // nLevelBranches === 0 -> keine weiteren Äste

            ctx.restore();
        }
    }

    function drawFractal() {
        ctx1.clearRect(0, 0, canvas1.width, canvas1.height);

        // grüner Blink-Overlay bei Erfolg
        if (blinkAlpha > 0) {
            ctx1.save();
            ctx1.globalAlpha = blinkAlpha;
            ctx1.fillStyle = '#90ff90';
            ctx1.fillRect(0, 0, canvas1.width, canvas1.height);
            ctx1.restore();
        }

        const cfg = {
            size:           fractalSize,
            scale:          scale,
            lineLength:     lineLength,
            nLevelBranches: nLevelBranches,
            branches:       branches,
            spread:         spread,
            maxLevel:       maxLevel
        };

        ctx1.save();
        ctx1.lineWidth = lineWidth;
        ctx1.strokeStyle = color;
        ctx1.translate(canvas1.width / 2, canvas1.height / 2);
        for (let i = 0; i < sides; i++) {
            ctx1.rotate((Math.PI * 2) / sides);
            drawBranch(0, ctx1, cfg);
        }
        ctx1.restore();

        randomizeButton.style.backgroundColor = color;
    }

    function drawTarget() {
        const cfg = {
            size:           fractalSize,
            scale:          targetScale,
            lineLength:     targetLineLength,
            nLevelBranches: targetNLevelBranches,
            branches:       targetBranches,
            spread:         targetSpread,
            maxLevel:       targetMaxLevel
        };

        ctx2.clearRect(0, 0, canvas2.width, canvas2.height);
        ctx2.save();
        ctx2.lineWidth = targetLineWidth;
        ctx2.strokeStyle = targetColor;
        ctx2.translate(canvas2.width / 2, canvas2.height / 2);
        for (let i = 0; i < targetSides; i++) {
            ctx2.rotate((Math.PI * 2) / targetSides);
            drawBranch(0, ctx2, cfg);
        }
        ctx2.restore();

        updateDebugInfo();
    }

    // ==============================
    // Debug-Infos
    // ==============================
    function updateDebugInfo() {
        const debugContent = document.getElementById('debugContent');
        if (!debugContent) return;

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

    // ==============================
    // Match-Check & Blink-Effekt
    // ==============================
    function checkMatch() {
        if (!gameMode) return;

        let spreadMatch;
        if (nLevelBranches === 2 && targetNLevelBranches === 2) {
            spreadMatch = Math.abs(spread) === Math.abs(targetSpread);
        } else {
            spreadMatch = spread === targetSpread;
        }

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
            if (successMessage) {
                successMessage.style.display = 'block';
            }
            randomizeButton.disabled = false;
            setTimeout(() => {
                if (successMessage) successMessage.style.display = 'none';
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

    function setSlidersCollapsed(state) {
        slidersCollapsed = state;
        document.body.classList.toggle('sliders-collapsed', slidersCollapsed);
        collapseButton.textContent = slidersCollapsed ? '▾' : '▴';
    }
    collapseButton.addEventListener('click', () => {
        setSlidersCollapsed(!slidersCollapsed);
    });

    
    // ==============================
    // Randomisieren & Reset
    // ==============================
    function randomizeFractal() {
        targetSpread = Number((Math.random() * 6.4 - 3.2).toFixed(1)); // -3.2 .. 3.2
        targetSides = Math.floor(Math.random() * 14) + 2;              // 2..15
        targetMaxLevel = Math.floor(Math.random() * 4) + 1;            // 1..4
        targetScale = Number((Math.random() * 0.8 + 0.1).toFixed(1));  // 0.1..0.9
        targetLineWidth = (Math.floor(Math.random() * 6) + 1) * 5;     // 5..30
        targetLineLength = Number((0.3 + Math.floor(Math.random() * 8) * 0.1).toFixed(1)); // 0.3..1.0
        targetBranches = Math.floor(Math.random() * 3) + 1;            // 1..3
        const targetHue = Math.floor(Math.random() * 12) * 30;         // 0..330 step 30
        targetNLevelBranches = Math.floor(Math.random() * 2) + 1;      // 1 oder 2
        targetColor = 'hsl(' + targetHue + ', 100%, 50%)';

        gameMode = true;
        randomizeButton.disabled = true;
        drawTarget();

        // direkt auf ersten Slider springen
        focusSlider(0);
    }

    randomizeButton.addEventListener('click', randomizeFractal);

    function resetFractal() {
        sides = 5;
        maxLevel = 3;
        scale = 0.5;
        spread = 0.7;
        branches = 1;
        color = 'hsl(290, 100%, 50%)';
        lineWidth = 15;
        lineLength = 1;
        nLevelBranches = 2;

        gameMode = false;
        randomizeButton.disabled = false;
        if (successMessage) successMessage.style.display = 'none';
        ctx2.clearRect(0, 0, canvas2.width, canvas2.height);

        updateSliders();
        drawFractal();
        updateDebugInfo();
    }

    resetButton.addEventListener('click', function() {
        resetFractal();
        randomizeButton.focus();
    });

    // ==============================
    // Initialisierung
    // ==============================
    updateSliders();

    setTimeout(() => {
        resizeCanvases();
        drawFractal();
        updateDebugInfo();
        randomizeButton.focus();
        showInitialHelp();
    }, 100);

    window.addEventListener('resize', function() {
        resizeCanvases();
        drawFractal();
        if (gameMode) drawTarget();
    });

    drawFractal();
});

