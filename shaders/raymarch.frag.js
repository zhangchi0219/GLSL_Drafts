export const source = `#version 300 es
precision highp float;

uniform float u_time;
uniform vec2 u_resolution;
uniform vec2 u_mouse;
out vec4 fragColor;

float sdSphere(vec3 p, float r) {
    return length(p) - r;
}

float sdBox(vec3 p, vec3 b) {
    vec3 q = abs(p) - b;
    return length(max(q, 0.0)) + min(max(q.x, max(q.y, q.z)), 0.0);
}

float scene(vec3 p) {
    // Central sphere
    float d = sdSphere(p, 1.0);

    // Orbiting smaller spheres
    for (int i = 0; i < 5; i++) {
        float fi = float(i);
        float angle = fi * 1.2566 + u_time * (0.4 + fi * 0.1);
        float radius = 2.2 + sin(u_time * 0.3 + fi) * 0.3;
        vec3 offset = vec3(
            cos(angle) * radius,
            sin(u_time * 0.7 + fi * 1.5) * 0.8,
            sin(angle) * radius
        );
        d = min(d, sdSphere(p - offset, 0.35));
    }

    // Ground plane
    d = min(d, p.y + 2.0);

    return d;
}

vec3 calcNormal(vec3 p) {
    vec2 e = vec2(0.001, 0.0);
    return normalize(vec3(
        scene(p + e.xyy) - scene(p - e.xyy),
        scene(p + e.yxy) - scene(p - e.yxy),
        scene(p + e.yyx) - scene(p - e.yyx)
    ));
}

float softShadow(vec3 ro, vec3 rd, float mint, float maxt, float k) {
    float res = 1.0;
    float t = mint;
    for (int i = 0; i < 32; i++) {
        float h = scene(ro + rd * t);
        res = min(res, k * h / t);
        t += clamp(h, 0.02, 0.2);
        if (t > maxt) break;
    }
    return clamp(res, 0.0, 1.0);
}

void main() {
    vec2 uv = (gl_FragCoord.xy - 0.5 * u_resolution.xy) / u_resolution.y;

    // Mouse controls camera orbit
    vec2 m = u_mouse / u_resolution;
    float camAngleY = m.x * 6.2831 - 3.14159;  // full horizontal orbit
    float camHeight = 0.5 + m.y * 4.0;          // vertical height

    vec3 ro = vec3(sin(camAngleY) * 5.0, camHeight, cos(camAngleY) * 5.0);
    vec3 target = vec3(0.0, 0.0, 0.0);
    vec3 forward = normalize(target - ro);
    vec3 right = normalize(cross(forward, vec3(0.0, 1.0, 0.0)));
    vec3 up = cross(right, forward);
    vec3 rd = normalize(forward * 1.5 + right * uv.x + up * uv.y);

    // Raymarch
    float t = 0.0;
    for (int i = 0; i < 100; i++) {
        vec3 p = ro + rd * t;
        float d = scene(p);
        if (d < 0.001 || t > 30.0) break;
        t += d;
    }

    // Sky gradient
    vec3 col = mix(vec3(0.02, 0.02, 0.05), vec3(0.05, 0.05, 0.15), uv.y + 0.5);

    if (t < 30.0) {
        vec3 p = ro + rd * t;
        vec3 n = calcNormal(p);

        // Lighting
        vec3 lightDir = normalize(vec3(1.0, 2.5, -1.5));
        float diff = max(dot(n, lightDir), 0.0);
        float shadow = softShadow(p + n * 0.01, lightDir, 0.02, 10.0, 8.0);

        // Ambient
        float amb = 0.12 + 0.08 * n.y;

        // Specular
        vec3 halfVec = normalize(lightDir - rd);
        float spec = pow(max(dot(n, halfVec), 0.0), 32.0);

        // Material color based on height
        vec3 matCol = mix(vec3(0.3, 0.35, 0.4), vec3(0.5, 0.6, 0.8), smoothstep(-2.0, 1.5, p.y));

        col = matCol * (diff * shadow + amb) + vec3(0.6) * spec * shadow;

        // Fog
        float fog = 1.0 - exp(-0.015 * t * t);
        col = mix(col, vec3(0.02, 0.02, 0.05), fog);
    }

    // Tone mapping
    col = col / (col + 1.0);
    col = pow(col, vec3(0.4545));

    fragColor = vec4(col, 1.0);
}
`;
