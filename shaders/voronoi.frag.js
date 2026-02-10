export const source = `#version 300 es
precision highp float;

uniform float u_time;
uniform vec2 u_resolution;
uniform vec2 u_mouse;
out vec4 fragColor;

vec2 hash2(vec2 p) {
    p = vec2(dot(p, vec2(127.1, 311.7)), dot(p, vec2(269.5, 183.3)));
    return fract(sin(p) * 43758.5453);
}

void main() {
    vec2 uv = gl_FragCoord.xy / u_resolution.xy;
    uv.x *= u_resolution.x / u_resolution.y;

    // Mouse controls: x → cell scale (3~12), y → animation speed (0.2~2.0)
    vec2 m = u_mouse / u_resolution;
    float scale = 3.0 + m.x * 9.0;
    float speed = 0.2 + m.y * 1.8;

    vec2 id = floor(uv * scale);
    vec2 gv = fract(uv * scale);

    float minDist = 1.0;
    float secondDist = 1.0;
    vec2 closestId = vec2(0.0);

    for (int y = -1; y <= 1; y++) {
        for (int x = -1; x <= 1; x++) {
            vec2 offset = vec2(float(x), float(y));
            vec2 cellId = id + offset;
            vec2 n = hash2(cellId);
            vec2 point = offset + sin(n * 6.2831 + u_time * speed) * 0.4 + 0.5;
            float d = length(gv - point);
            if (d < minDist) {
                secondDist = minDist;
                minDist = d;
                closestId = cellId;
            } else if (d < secondDist) {
                secondDist = d;
            }
        }
    }

    // Edge detection
    float edge = secondDist - minDist;

    // Cell color from hash
    vec2 h = hash2(closestId);
    float hue = h.x + u_time * 0.05;
    vec3 col;
    col.r = sin(hue * 6.2831) * 0.3 + 0.5;
    col.g = sin(hue * 6.2831 + 2.094) * 0.3 + 0.5;
    col.b = sin(hue * 6.2831 + 4.189) * 0.3 + 0.5;

    // Darken by distance from cell center
    col *= 1.0 - minDist * 0.6;

    // Edge highlight
    col = mix(vec3(1.0), col, smoothstep(0.0, 0.05, edge));

    fragColor = vec4(col, 1.0);
}
`;
