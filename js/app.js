import { buildProgram } from './gl-utils.js';
import { shaders } from './shader-registry.js';
import { vertexSource } from '../shaders/common.vert.js';

// --- DOM ---
const canvas = document.getElementById('glcanvas');
const errorOverlay = document.getElementById('error-overlay');
const noWebGL = document.getElementById('no-webgl');
const activeShaderName = document.getElementById('active-shader-name');
const shaderListEl = document.getElementById('shader-list');
const menuHeader = document.querySelector('.shader-menu-header');
const toggleArrow = document.querySelector('.toggle-arrow');
const paramPanel = document.getElementById('param-panel');

// --- WebGL2 init ---
const gl = canvas.getContext('webgl2');
if (!gl) {
    noWebGL.style.display = 'block';
    throw new Error('WebGL2 not supported');
}

const vao = gl.createVertexArray();
gl.bindVertexArray(vao);

// --- State ---
let currentProgram = null;
let uniforms = {};
let startTime = performance.now();
let mouseX = 0;
let mouseY = 0;
let frameCount = 0;
let activeShaderIndex = 0;
let paramValues = {};
let paramDefs = [];
let paramRows = [];       // DOM row elements (parallel to paramDefs)

// --- Shader loading ---
function showError(msg) {
    errorOverlay.textContent = msg;
    errorOverlay.style.display = 'block';
}

function clearError() {
    errorOverlay.style.display = 'none';
    errorOverlay.textContent = '';
}

function loadShader(index) {
    const descriptor = shaders[index];
    try {
        const result = buildProgram(gl, vertexSource, descriptor.source);

        if (currentProgram) gl.deleteProgram(currentProgram);

        currentProgram = result.program;
        uniforms = result.uniforms;
        activeShaderIndex = index;

        startTime = performance.now();
        frameCount = 0;

        activeShaderName.textContent = descriptor.name;
        updateActiveItem();
        clearError();

        buildParamPanel(descriptor.params || []);
    } catch (e) {
        showError(e.message);
        console.error(e);
    }
}

// --- Param panel ---
function buildParamPanel(params) {
    paramDefs = params;
    paramValues = {};
    paramRows = [];
    paramPanel.innerHTML = '';

    if (params.length === 0) {
        paramPanel.style.display = 'none';
        return;
    }

    paramPanel.style.display = '';

    // Header
    const header = document.createElement('div');
    header.className = 'param-header';
    header.innerHTML = '<span>Parameters</span><span class="param-toggle">&#9662;</span>';
    paramPanel.appendChild(header);

    const body = document.createElement('div');
    body.className = 'param-body open';
    paramPanel.appendChild(body);

    let panelOpen = true;
    header.addEventListener('click', () => {
        panelOpen = !panelOpen;
        body.classList.toggle('open', panelOpen);
        header.querySelector('.param-toggle').classList.toggle('open', !panelOpen);
    });

    params.forEach((p, idx) => {
        paramValues[p.uniform] = p.default;

        if (p.type === 'select') {
            const row = buildSelectRow(p, idx);
            body.appendChild(row);
            paramRows.push(row);
        } else {
            const row = buildSliderRow(p, idx);
            body.appendChild(row);
            paramRows.push(row);
        }
    });

    // Reset all button
    const resetBtn = document.createElement('button');
    resetBtn.className = 'param-reset';
    resetBtn.textContent = 'Reset All';
    resetBtn.addEventListener('click', () => {
        params.forEach((p, i) => {
            paramValues[p.uniform] = p.default;
            const row = paramRows[i];
            if (p.type === 'select') {
                row.querySelector('.param-select').value = p.default;
            } else {
                row.querySelector('.param-slider').value = p.default;
                row.querySelector('.param-value').textContent = formatVal(p.default, p);
            }
        });
        updateVisibility();
    });
    body.appendChild(resetBtn);

    updateVisibility();
}

function buildSelectRow(p) {
    const row = document.createElement('div');
    row.className = 'param-row param-row-select';

    const label = document.createElement('label');
    label.className = 'param-label';
    label.textContent = p.name;

    const select = document.createElement('select');
    select.className = 'param-select';
    p.options.forEach(opt => {
        const o = document.createElement('option');
        o.value = opt.value;
        o.textContent = opt.label;
        select.appendChild(o);
    });
    select.value = p.default;

    select.addEventListener('change', () => {
        paramValues[p.uniform] = Number(select.value);
        updateVisibility();
    });

    row.appendChild(label);
    row.appendChild(select);
    return row;
}

function buildSliderRow(p) {
    const row = document.createElement('div');
    row.className = 'param-row';

    const label = document.createElement('label');
    label.className = 'param-label';
    label.textContent = p.name;

    const slider = document.createElement('input');
    slider.type = 'range';
    slider.className = 'param-slider';
    slider.min = p.min;
    slider.max = p.max;
    slider.step = p.step;
    slider.value = p.default;

    const valDisplay = document.createElement('span');
    valDisplay.className = 'param-value';
    valDisplay.textContent = formatVal(p.default, p);

    slider.addEventListener('input', () => {
        const v = Number(slider.value);
        paramValues[p.uniform] = v;
        valDisplay.textContent = formatVal(v, p);
    });

    slider.addEventListener('dblclick', () => {
        slider.value = p.default;
        paramValues[p.uniform] = p.default;
        valDisplay.textContent = formatVal(p.default, p);
    });

    row.appendChild(label);
    row.appendChild(slider);
    row.appendChild(valDisplay);
    return row;
}

function updateVisibility() {
    paramDefs.forEach((p, i) => {
        if (!p.visibleWhen) return;
        const row = paramRows[i];
        let visible = true;
        for (const [uniform, allowed] of Object.entries(p.visibleWhen)) {
            if (!allowed.includes(paramValues[uniform])) {
                visible = false;
                break;
            }
        }
        row.style.display = visible ? '' : 'none';
    });
}

function formatVal(v, param) {
    if (param.type === 'int') return String(Math.round(v));
    if (param.step >= 1) return v.toFixed(0);
    if (param.step >= 0.1) return v.toFixed(1);
    return v.toFixed(2);
}

function applyParams() {
    for (const def of paramDefs) {
        const loc = uniforms[def.uniform];
        if (loc == null) continue;
        const v = paramValues[def.uniform];
        if (def.type === 'int' || def.type === 'select') {
            gl.uniform1i(loc, Math.round(v));
        } else {
            gl.uniform1f(loc, v);
        }
    }
}

// --- Resize ---
function resize() {
    const dpr = window.devicePixelRatio || 1;
    canvas.width = Math.floor(window.innerWidth * dpr);
    canvas.height = Math.floor(window.innerHeight * dpr);
    gl.viewport(0, 0, canvas.width, canvas.height);
}

window.addEventListener('resize', resize);
resize();

// --- Mouse ---
canvas.addEventListener('mousemove', (e) => {
    const dpr = window.devicePixelRatio || 1;
    mouseX = e.clientX * dpr;
    mouseY = canvas.height - e.clientY * dpr;
});

// --- Render loop ---
function render() {
    const elapsed = (performance.now() - startTime) / 1000.0;

    gl.useProgram(currentProgram);

    if (uniforms.u_time != null)
        gl.uniform1f(uniforms.u_time, elapsed);
    if (uniforms.u_resolution != null)
        gl.uniform2f(uniforms.u_resolution, canvas.width, canvas.height);
    if (uniforms.u_mouse != null)
        gl.uniform2f(uniforms.u_mouse, mouseX, mouseY);
    if (uniforms.u_frame != null)
        gl.uniform1i(uniforms.u_frame, frameCount);

    applyParams();

    gl.drawArrays(gl.TRIANGLES, 0, 3);
    frameCount++;
    requestAnimationFrame(render);
}

// --- UI: menu toggle ---
let menuOpen = false;

menuHeader.addEventListener('click', () => {
    menuOpen = !menuOpen;
    shaderListEl.classList.toggle('open', menuOpen);
    toggleArrow.classList.toggle('open', menuOpen);
});

// --- UI: build shader list ---
function buildUI() {
    shaderListEl.innerHTML = '';
    shaders.forEach((shader, i) => {
        const li = document.createElement('li');
        li.textContent = shader.name;
        li.dataset.index = i;
        li.addEventListener('click', () => {
            loadShader(i);
            menuOpen = false;
            shaderListEl.classList.remove('open');
            toggleArrow.classList.remove('open');
        });
        shaderListEl.appendChild(li);
    });
}

function updateActiveItem() {
    const items = shaderListEl.querySelectorAll('li');
    items.forEach((li, i) => {
        li.classList.toggle('active', i === activeShaderIndex);
    });
}

// --- Keyboard shortcuts ---
document.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
        e.preventDefault();
        loadShader((activeShaderIndex + 1) % shaders.length);
    } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
        e.preventDefault();
        loadShader((activeShaderIndex - 1 + shaders.length) % shaders.length);
    }
});

// --- Start ---
buildUI();

const defaultIndex = shaders.findIndex(s => s.default);
loadShader(defaultIndex >= 0 ? defaultIndex : 0);

requestAnimationFrame(render);
