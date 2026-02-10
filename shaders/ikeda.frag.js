export const source = `#version 300 es
precision highp float;

uniform float u_time;
uniform vec2 u_resolution;
uniform vec2 u_mouse;
out vec4 fragColor;

// --- Pseudo-random hash ---
float hash(vec2 p) {
    return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
}

float hash1(float p) {
    return fract(sin(p * 127.1) * 43758.5453123);
}

void main() {
    vec2 uv = gl_FragCoord.xy / u_resolution.xy;
    float aspect = u_resolution.x / u_resolution.y;
    float t = u_time;
    float color = 0.0;

    // Mouse normalized [0,1]
    vec2 m = u_mouse / u_resolution;

    // mouse.x → data density multiplier (0.5 ~ 2.0)
    float density = 0.5 + m.x * 1.5;
    // mouse.y → flicker speed multiplier (0.3 ~ 3.0)
    float flickerMul = 0.3 + m.y * 2.7;

    // =========================================================
    // Layer 1: Barcode vertical stripes (narrow band)
    // =========================================================
    {
        float barScale = 60.0 + density * 80.0;
        float barId = floor(uv.x * barScale);
        float timeSlice = floor(t * 10.0 * flickerMul);
        float barVal = step(0.48, hash(vec2(barId, timeSlice)));

        float band1 = step(0.28, uv.y) * step(uv.y, 0.32);
        float band2 = step(0.68, uv.y) * step(uv.y, 0.72);
        color += barVal * (band1 + band2);
    }

    // =========================================================
    // Layer 2: Scrolling data rows at different speeds
    // =========================================================
    for (int i = 0; i < 8; i++) {
        float fi = float(i);
        float rowY = 0.04 + fi * 0.09;
        float rowHeight = 0.008 + hash1(fi * 7.3) * 0.006;
        float rowMask = step(rowY, uv.y) * step(uv.y, rowY + rowHeight);

        if (rowMask > 0.0) {
            float speed = (1.0 + fi * 1.8 + hash1(fi) * 2.0) * density;
            float scroll = t * speed;
            float cellScale = (30.0 + fi * 25.0) * density;
            float cellId = floor((uv.x + scroll) * cellScale);
            float flickerRate = (3.0 + fi * 2.0) * flickerMul;
            float val = step(0.45, hash(vec2(cellId, fi + floor(t * flickerRate))));
            color += val * rowMask;
        }
    }

    // =========================================================
    // Layer 3: Large binary grid (background texture)
    // =========================================================
    {
        float gridScaleX = 15.0 + density * 20.0;
        float gridScaleY = 8.0 + density * 10.0;
        vec2 gridUV = vec2(floor(uv.x * gridScaleX), floor(uv.y * gridScaleY));
        float gridFlicker = floor(t * 5.0 * flickerMul);
        float gridVal = step(0.55, hash(gridUV + gridFlicker));

        float gridMask = step(0.4, uv.y) * step(uv.y, 0.95);
        color += gridVal * gridMask * 0.15;
    }

    // =========================================================
    // Layer 4: Fine horizontal scanlines
    // =========================================================
    {
        float scanFreq = 200.0 + density * 300.0;
        float scanSpeed = t * 80.0 * flickerMul;
        float scanline = step(0.97, fract(uv.y * scanFreq + scanSpeed));
        color += scanline * 0.15;
    }

    // =========================================================
    // Layer 5: Vertical micro-bars (dense data columns)
    // =========================================================
    {
        float microScale = 100.0 + density * 150.0;
        float microId = floor(uv.x * microScale);
        float microTime = floor(t * 15.0 * flickerMul);
        float microVal = step(0.7, hash(vec2(microId, microTime)));

        float colHeight = hash(vec2(microId, microTime + 100.0));
        float heightMask = step(uv.y, colHeight * 0.25 + 0.02);

        color += microVal * heightMask * 0.6;
    }

    // =========================================================
    // Layer 6: Periodic bright flash bar
    // =========================================================
    {
        float flashTrigger = step(0.97, hash(vec2(floor(t * 4.0 * flickerMul), 42.0)));
        float flashY = hash(vec2(floor(t * 4.0 * flickerMul), 99.0));
        float flashBand = step(flashY, uv.y) * step(uv.y, flashY + 0.015);
        color += flashTrigger * flashBand * 1.5;
    }

    // =========================================================
    // Layer 7: Number matrix blocks (large scale)
    // =========================================================
    {
        float blockX = floor(uv.x * 8.0);
        float blockY = floor(uv.y * 4.0);
        float blockTime = floor(t * 3.0 * flickerMul);
        float blockVal = step(0.6, hash(vec2(blockX + blockY * 8.0, blockTime)));
        float blockMask = step(0.35, uv.y) * step(uv.y, 0.65);
        color += blockVal * blockMask * 0.08;
    }

    // =========================================================
    // Global modulation: slight brightness pulse
    // =========================================================
    float pulse = 0.9 + 0.1 * step(0.95, fract(t * 2.0));
    color *= pulse;

    color = clamp(color, 0.0, 1.0);
    fragColor = vec4(vec3(color), 1.0);
}
`;
