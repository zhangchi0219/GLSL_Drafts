export const source = `#version 300 es
precision highp float;

uniform float u_time;
uniform vec2 u_resolution;
uniform vec2 u_mouse;
out vec4 fragColor;

void main() {
    vec2 uv = gl_FragCoord.xy / u_resolution.xy;
    float aspect = u_resolution.x / u_resolution.y;
    uv.x *= aspect;
    float t = u_time * 0.5;

    // Mouse as normalized coord with aspect correction
    vec2 m = u_mouse / u_resolution;
    m.x *= aspect;

    // mouse.x → frequency scale (5 ~ 20)
    float freq = 5.0 + m.x / aspect * 15.0;
    // mouse.y → color phase shift speed
    float phaseShift = m.y * 4.0;

    float v1 = sin(uv.x * freq + t);
    float v2 = sin(uv.y * freq + t * 1.3);
    float v3 = sin((uv.x + uv.y) * freq * 0.8 + t * 0.7);
    // Distortion center follows the mouse
    float v4 = sin(length(uv - m) * freq * 1.5 - t * 1.5);
    float v5 = sin(uv.x * freq * 0.5 - uv.y * freq * 0.7 + t * 0.9);

    float v = (v1 + v2 + v3 + v4 + v5) * 0.2;

    vec3 col = vec3(
        sin(v * 3.14159 + phaseShift + 0.0) * 0.5 + 0.5,
        sin(v * 3.14159 + phaseShift + 2.094) * 0.5 + 0.5,
        sin(v * 3.14159 + phaseShift + 4.189) * 0.5 + 0.5
    );

    fragColor = vec4(col, 1.0);
}
`;
