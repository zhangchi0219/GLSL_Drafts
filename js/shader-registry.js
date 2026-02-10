import { source as ikedaSource } from '../shaders/ikeda.frag.js';
import { source as plasmaSource } from '../shaders/plasma.frag.js';
import { source as raymarchSource } from '../shaders/raymarch.frag.js';
import { source as voronoiSource } from '../shaders/voronoi.frag.js';
import { source as mandelbulbSource } from '../shaders/mandelbulb.frag.js';

export const shaders = [
    {
        id: 'ikeda',
        name: 'Ryoji Ikeda — Data Stream',
        source: ikedaSource,
        default: true
    },
    {
        id: 'plasma',
        name: 'Classic Plasma',
        source: plasmaSource
    },
    {
        id: 'raymarch',
        name: 'Raymarched Spheres',
        source: raymarchSource
    },
    {
        id: 'voronoi',
        name: 'Voronoi Cells',
        source: voronoiSource
    },
    {
        id: 'mandelbulb',
        name: 'Mandelbulb 3D Fractal',
        source: mandelbulbSource,
        params: [
            // --- Formula selector ---
            {
                id: 'formula', name: 'Formula', uniform: 'u_formula',
                type: 'select', default: 0,
                options: [
                    { value: 0, label: 'Mandelbulb' },
                    { value: 1, label: 'Juliabulb' },
                    { value: 2, label: 'Burning Ship 3D' },
                    { value: 3, label: 'Mandelbox' },
                    { value: 4, label: 'Quaternion Julia' },
                    { value: 5, label: 'Sierpinski' }
                ]
            },
            // --- Fractal params ---
            { id: 'power',     name: 'Power',      uniform: 'u_power',      type: 'float', min: 2,   max: 16,  step: 0.1,  default: 8,   visibleWhen: { u_formula: [0,1,2] } },
            { id: 'iterations', name: 'Iterations', uniform: 'u_iterations', type: 'int',   min: 2,   max: 16,  step: 1,    default: 4  },
            { id: 'bailout',   name: 'Bailout',     uniform: 'u_bailout',    type: 'float', min: 4,   max: 512, step: 1,    default: 256, visibleWhen: { u_formula: [0,1,2,4] } },
            // --- Mandelbox ---
            { id: 'mbScale',   name: 'Box Scale',   uniform: 'u_mb_scale',   type: 'float', min: -3,  max: 3,   step: 0.01, default: -1.5, visibleWhen: { u_formula: [3] } },
            { id: 'mbMinRad',  name: 'Min Radius',  uniform: 'u_mb_min_rad', type: 'float', min: 0.01, max: 1.0, step: 0.01, default: 0.5,  visibleWhen: { u_formula: [3] } },
            // --- Julia c ---
            { id: 'juliaX',    name: 'Julia X',     uniform: 'u_julia_x',    type: 'float', min: -2,  max: 2,   step: 0.01, default: -0.2, visibleWhen: { u_formula: [1,4] } },
            { id: 'juliaY',    name: 'Julia Y',     uniform: 'u_julia_y',    type: 'float', min: -2,  max: 2,   step: 0.01, default: 0.8,  visibleWhen: { u_formula: [1,4] } },
            { id: 'juliaZ',    name: 'Julia Z',     uniform: 'u_julia_z',    type: 'float', min: -2,  max: 2,   step: 0.01, default: 0.0,  visibleWhen: { u_formula: [1,4] } },
            { id: 'juliaW',    name: 'Julia W',     uniform: 'u_julia_w',    type: 'float', min: -2,  max: 2,   step: 0.01, default: 0.0,  visibleWhen: { u_formula: [4] } },
            // --- Camera & rendering (always visible) ---
            { id: 'camDist',    name: 'Camera Dist',    uniform: 'u_cam_dist',    type: 'float', min: 1.5, max: 10,   step: 0.05, default: 2.5  },
            { id: 'fov',        name: 'FOV',            uniform: 'u_fov',         type: 'float', min: 0.8, max: 3.0,  step: 0.05, default: 1.8  },
            { id: 'rotSpeed',   name: 'Rotation Speed', uniform: 'u_rot_speed',   type: 'float', min: 0,   max: 1.0,  step: 0.01, default: 0.15 },
            { id: 'colorShift', name: 'Color Shift',    uniform: 'u_color_shift', type: 'float', min: 0,   max: 6.28, step: 0.01, default: 0    },
            { id: 'aoStrength', name: 'AO Strength',    uniform: 'u_ao_strength', type: 'float', min: 0,   max: 6,    step: 0.1,  default: 3    },
            { id: 'specPower',  name: 'Spec Sharpness', uniform: 'u_spec_power',  type: 'float', min: 4,   max: 128,  step: 1,    default: 48   }
        ]
    }
];
