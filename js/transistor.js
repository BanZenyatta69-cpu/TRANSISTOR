/**
 * transistor.js — Interactive Transistor Simulator
 * Models a BJT NPN transistor with quantum-informed explanations
 */

document.addEventListener('DOMContentLoaded', () => {

  /* ── STATE ── */
  const state = {
    baseOn:   false,
    voltage:  0,      // Base voltage 0–5V
    beta:     220,    // Current gain (hFE)
  };

  /* ── DOM REFS ── */
  const baseToggle    = document.getElementById('base-toggle');
  const voltageSlider = document.getElementById('voltage-slider');
  const voltageLabel  = document.getElementById('voltage-value');
  const statusBadge   = document.getElementById('sim-status');
  const outputValue   = document.getElementById('output-value');
  const outputUnit    = document.getElementById('output-unit');
  const meterFill     = document.getElementById('meter-fill');
  const simDesc       = document.getElementById('sim-desc');
  const svgStream1    = document.getElementById('stream-1');
  const svgStream2    = document.getElementById('stream-2');
  const svgEmitter    = document.getElementById('svg-emitter');
  const svgCollector  = document.getElementById('svg-collector');

  if (!baseToggle) return; // guard

  /* ── DESCRIPTIONS ── */
  const descriptions = [
    { // OFF
      text: 'La base no recibe señal. La unión P-N está polarizada inversamente. La barrera de potencial cuántica impide el cruce de portadores — los electrones no tienen suficiente energía para saltar la banda prohibida.',
      color: 'var(--text-muted)'
    },
    { // LOW signal
      text: 'Señal débil en la base. Algunos electrones empiezan a cruzar cuánticamente mediante efecto túnel a través de la barrera. La corriente de colector es aún mínima — β × I_B ≈ pequeña.',
      color: 'rgba(255, 200, 50, 0.7)'
    },
    { // ACTIVE
      text: '¡Conducción activa! La unión E-B está directamente polarizada. Los electrones inyectados difunden a través de la base angosta y son barridos hacia el colector. I_C = β × I_B — ¡amplificación cuántica en acción!',
      color: 'var(--green)'
    },
    { // SATURATION
      text: 'Saturación máxima. El transistor está completamente encendido: ambas uniones P-N conducen. La distribución de Fermi-Dirac favorece el llenado de la banda de conducción. Corriente máxima de colector.',
      color: 'var(--cyan)'
    }
  ];

  /* ── COMPUTE & RENDER ── */
  function compute() {
    const vbe = state.baseOn ? state.voltage : 0;

    // Simplified Shockley diode model
    // I_B = I_s * (e^(vbe / 0.026) - 1), clamped for display
    let iB = 0;
    if (vbe > 0.6) {
      iB = 0.1 * Math.exp((vbe - 0.6) / 0.15); // µA
      iB = Math.min(iB, 500); // clamp at 500 µA
    }

    const iC = state.beta * iB; // µA
    const iCmA = iC / 1000;    // mA
    const pct  = Math.min(iCmA / 110, 1); // normalize to 110 mA max

    // Determine region
    let region = 0;
    if (vbe >= 0.6 && pct < 0.2) region = 1;
    if (vbe >= 0.6 && pct >= 0.2 && pct < 0.85) region = 2;
    if (pct >= 0.85) region = 3;

    /* Update UI */
    // Status badge
    const labels = ['CORTE (OFF)', 'ACTIVO BAJO', 'ACTIVO', 'SATURACIÓN'];
    statusBadge.textContent = labels[region];
    statusBadge.className = 'sim-status-badge ' + (region === 0 ? 'off' : 'on');

    // Output value
    if (iCmA < 0.01) {
      outputValue.textContent = '0.00';
    } else if (iCmA < 1) {
      outputValue.textContent = iCmA.toFixed(3);
    } else {
      outputValue.textContent = iCmA.toFixed(1);
    }
    outputValue.className = 'output-value ' + (region > 0 ? 'on' : '');
    outputUnit.textContent = 'mA — I_Colector';

    // Meter
    meterFill.style.width = (pct * 100) + '%';

    // Description
    const desc = descriptions[region];
    simDesc.textContent = desc.text;
    simDesc.style.color = desc.color;

    // SVG electron streams
    const on = region > 0;
    if (svgStream1) svgStream1.classList.toggle('off', !on);
    if (svgStream2) svgStream2.classList.toggle('off', !on);
    if (svgEmitter)  svgEmitter.setAttribute('opacity', on ? '1' : '0.3');
    if (svgCollector) svgCollector.setAttribute('opacity', on ? '1' : '0.3');

    // Stream speed based on current
    const duration = on ? Math.max(0.3, 1.5 - pct * 1.2) + 's' : '1.2s';
    if (svgStream1) svgStream1.style.animationDuration = duration;
    if (svgStream2) svgStream2.style.animationDuration = duration;
  }

  /* ── EVENT LISTENERS ── */
  baseToggle.addEventListener('change', () => {
    state.baseOn = baseToggle.checked;
    if (!state.baseOn) state.voltage = 0;
    else if (state.voltage === 0) state.voltage = 3.3;

    if (voltageSlider) {
      voltageSlider.value = state.voltage;
      updateSliderFill();
    }
    compute();
  });

  if (voltageSlider) {
    voltageSlider.addEventListener('input', () => {
      state.voltage = parseFloat(voltageSlider.value);
      if (voltageLabel) voltageLabel.textContent = state.voltage.toFixed(1) + ' V';
      updateSliderFill();
      compute();
    });
  }

  function updateSliderFill() {
    if (!voltageSlider) return;
    const pct = (voltageSlider.value / voltageSlider.max) * 100;
    voltageSlider.style.setProperty('--fill', pct + '%');
    if (voltageLabel) voltageLabel.textContent = parseFloat(voltageSlider.value).toFixed(1) + ' V';
  }

  /* ── INIT ── */
  updateSliderFill();
  compute();

  /* ── OSCILLOSCOPE MINI ── */
  const oscCanvas = document.getElementById('osc-canvas');
  if (oscCanvas) {
    const oCtx = oscCanvas.getContext('2d');
    let oT = 0;

    function drawOsc() {
      const oW = oscCanvas.width  = oscCanvas.offsetWidth;
      const oH = oscCanvas.height = 80;
      oCtx.clearRect(0, 0, oW, oH);

      oCtx.fillStyle = 'rgba(0,0,0,0.5)';
      oCtx.fillRect(0, 0, oW, oH);

      // Grid
      oCtx.strokeStyle = 'rgba(255,255,255,0.05)';
      oCtx.lineWidth = 1;
      for (let x = 0; x < oW; x += oW / 8) {
        oCtx.beginPath(); oCtx.moveTo(x, 0); oCtx.lineTo(x, oH); oCtx.stroke();
      }
      for (let y = 0; y < oH; y += oH / 4) {
        oCtx.beginPath(); oCtx.moveTo(0, y); oCtx.lineTo(oW, y); oCtx.stroke();
      }

      const vbe = state.baseOn ? state.voltage : 0;
      const pct = Math.min(Math.max((vbe - 0.6) / 4.4, 0), 1);

      // Input signal (base)
      oCtx.strokeStyle = 'rgba(255,95,31,0.7)';
      oCtx.lineWidth = 1.5;
      oCtx.beginPath();
      for (let x = 0; x < oW; x++) {
        const t = x / oW * 4 * Math.PI + oT;
        const signal = state.baseOn ? 0.5 + 0.35 * Math.sin(t) : 0.15 + 0.08 * Math.sin(t * 3);
        const y = oH * (1 - signal);
        x === 0 ? oCtx.moveTo(x, y) : oCtx.lineTo(x, y);
      }
      oCtx.stroke();

      // Output signal (collector — amplified)
      oCtx.strokeStyle = 'rgba(0,240,255,0.8)';
      oCtx.lineWidth = 1.5;
      oCtx.beginPath();
      for (let x = 0; x < oW; x++) {
        const t = x / oW * 4 * Math.PI + oT;
        const signal = state.baseOn
          ? Math.min(0.1 + pct * 0.78 + pct * 0.1 * Math.sin(t + 0.2), 0.92)
          : 0.08 + 0.02 * Math.sin(t * 4);
        const y = oH * (1 - signal);
        x === 0 ? oCtx.moveTo(x, y) : oCtx.lineTo(x, y);
      }
      oCtx.stroke();

      oT += 0.04;
      requestAnimationFrame(drawOsc);
    }
    drawOsc();
  }
});
