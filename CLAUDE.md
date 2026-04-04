# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

A browser-based GLSL shader gallery. Users view fullscreen WebGL2 fragment shaders on an HTML canvas and switch between them via a dropdown menu. Some shaders expose tunable parameters via a slider/select panel.

## Running

```bash
npm start                # serves via `npx serve .` — open http://localhost:3000
docker compose up -d     # or via Docker — open http://localhost:8787
docker compose down      # stop
```

No build step, bundler, or transpiler. The app uses native ES modules (`<script type="module">`).

## Architecture

- **`index.html`** — Single page: a `<canvas>`, shader selection menu, parameter panel, and error overlay.
- **`js/app.js`** — Entry point. Initializes WebGL2, manages the render loop, builds the UI (shader list + parameter panel), and handles keyboard/mouse input. Renders a single fullscreen triangle per frame.
- **`js/gl-utils.js`** — WebGL helpers: compile shaders, link programs, extract uniform locations. Exports `buildProgram(gl, vertSource, fragSource)`.
- **`js/shader-registry.js`** — Central registry that imports all fragment shaders and exports the `shaders` array. Each entry has `{ id, name, source, default?, params? }`.
- **`shaders/common.vert.js`** — Shared vertex shader (fullscreen triangle from `gl_VertexID`, no vertex buffers).
- **`shaders/*.frag.js`** — Fragment shaders as exported GLSL strings in JS modules.
- **`css/style.css`** — All styling (overlays, menus, sliders, error display).

## Adding a New Shader

1. Create `shaders/<name>.frag.js` exporting `source` — a `#version 300 es` fragment shader string with `out vec4 fragColor`.
2. Import it in `js/shader-registry.js` and add an entry to the `shaders` array.
3. Available built-in uniforms: `u_time`, `u_resolution`, `u_mouse`, `u_frame`.

## Shader Parameters

Shaders can declare a `params` array in their registry entry (see `mandelbulb` for a full example). Supported param types: `float`, `int`, `select`. Params support `visibleWhen` for conditional visibility based on other param values. Each param maps to a uniform set via `gl.uniform1f`/`gl.uniform1i`.

## Key Conventions

- All GLSL targets WebGL2 / GLSL ES 3.00 (`#version 300 es`).
- Fragment shaders write to `out vec4 fragColor` (not `gl_FragColor`).
- No vertex buffers — the fullscreen triangle is generated from `gl_VertexID`.
- Arrow keys cycle through shaders.
