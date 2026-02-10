export const source = `#version 300 es
precision highp float;

uniform float u_time;
uniform vec2  u_resolution;
uniform vec2  u_mouse;
uniform int   u_frame;

// Formula selection
uniform int   u_formula;

// Shared fractal params
uniform float u_power;
uniform int   u_iterations;
uniform float u_bailout;

// Mandelbox params
uniform float u_mb_scale;
uniform float u_mb_min_rad;

// Julia params
uniform float u_julia_x;
uniform float u_julia_y;
uniform float u_julia_z;
uniform float u_julia_w;

// Rendering params
uniform float u_cam_dist;
uniform float u_rot_speed;
uniform float u_color_shift;
uniform float u_ao_strength;
uniform float u_spec_power;
uniform float u_fov;

out vec4 fragColor;

// =============================================
//  0 — Mandelbulb
// =============================================
vec2 deMandelbulb(vec3 p) {
    vec3 w = p;
    float m = dot(w, w);
    float dz = 1.0;
    float trap = 1e10;

    for (int i = 0; i < 16; i++) {
        if (i >= u_iterations) break;
        dz = u_power * pow(m, (u_power - 1.0) / 2.0) * dz + 1.0;
        float r = length(w);
        float b = u_power * acos(clamp(w.y / r, -1.0, 1.0));
        float a = u_power * atan(w.x, w.z);
        w = p + pow(r, u_power) * vec3(sin(b)*sin(a), cos(b), sin(b)*cos(a));
        trap = min(trap, m);
        m = dot(w, w);
        if (m > u_bailout) break;
    }
    return vec2(0.25 * log(m) * sqrt(m) / dz, trap);
}

// =============================================
//  1 — Juliabulb  (fixed c instead of position)
// =============================================
vec2 deJuliabulb(vec3 p) {
    vec3 w = p;
    vec3 c = vec3(u_julia_x, u_julia_y, u_julia_z);
    float m = dot(w, w);
    float dz = 1.0;
    float trap = 1e10;

    for (int i = 0; i < 16; i++) {
        if (i >= u_iterations) break;
        dz = u_power * pow(m, (u_power - 1.0) / 2.0) * dz + 1.0;
        float r = length(w);
        float b = u_power * acos(clamp(w.y / r, -1.0, 1.0));
        float a = u_power * atan(w.x, w.z);
        w = c + pow(r, u_power) * vec3(sin(b)*sin(a), cos(b), sin(b)*cos(a));
        trap = min(trap, m);
        m = dot(w, w);
        if (m > u_bailout) break;
    }
    return vec2(0.25 * log(m) * sqrt(m) / dz, trap);
}

// =============================================
//  2 — Burning Ship 3D  (abs before transform)
// =============================================
vec2 deBurningShip(vec3 p) {
    vec3 w = p;
    float m = dot(w, w);
    float dz = 1.0;
    float trap = 1e10;

    for (int i = 0; i < 16; i++) {
        if (i >= u_iterations) break;
        dz = u_power * pow(m, (u_power - 1.0) / 2.0) * dz + 1.0;
        w = abs(w);
        float r = length(w);
        float b = u_power * acos(clamp(w.y / r, -1.0, 1.0));
        float a = u_power * atan(w.x, w.z);
        w = p + pow(r, u_power) * vec3(sin(b)*sin(a), cos(b), sin(b)*cos(a));
        trap = min(trap, m);
        m = dot(w, w);
        if (m > u_bailout) break;
    }
    return vec2(0.25 * log(m) * sqrt(m) / dz, trap);
}

// =============================================
//  3 — Mandelbox  (box fold + sphere fold)
// =============================================
vec2 deMandelbox(vec3 p) {
    vec3 w = p;
    float dr = 1.0;
    float trap = 1e10;
    float minRad2 = u_mb_min_rad * u_mb_min_rad;

    for (int i = 0; i < 16; i++) {
        if (i >= u_iterations) break;

        // Box fold
        w = clamp(w, -1.0, 1.0) * 2.0 - w;

        // Sphere fold
        float r2 = dot(w, w);
        trap = min(trap, r2);
        if (r2 < minRad2) {
            float t = 1.0 / minRad2;
            w *= t;
            dr *= t;
        } else if (r2 < 1.0) {
            float t = 1.0 / r2;
            w *= t;
            dr *= t;
        }

        w = u_mb_scale * w + p;
        dr = dr * abs(u_mb_scale) + 1.0;
    }
    return vec2(length(w) / abs(dr), trap);
}

// =============================================
//  4 — Quaternion Julia
// =============================================
vec4 qmul(vec4 a, vec4 b) {
    return vec4(
        a.x*b.x - a.y*b.y - a.z*b.z - a.w*b.w,
        a.x*b.y + a.y*b.x + a.z*b.w - a.w*b.z,
        a.x*b.z - a.y*b.w + a.z*b.x + a.w*b.y,
        a.x*b.w + a.y*b.z - a.z*b.y + a.w*b.x
    );
}

vec2 deQuaternionJulia(vec3 p) {
    vec4 q = vec4(p, 0.0);
    vec4 c = vec4(u_julia_x, u_julia_y, u_julia_z, u_julia_w);
    vec4 dq = vec4(1.0, 0.0, 0.0, 0.0);
    float trap = 1e10;

    for (int i = 0; i < 16; i++) {
        if (i >= u_iterations) break;
        dq = 2.0 * qmul(q, dq);
        q = qmul(q, q) + c;
        float m = dot(q, q);
        trap = min(trap, m);
        if (m > u_bailout) break;
    }
    float r = length(q);
    return vec2(0.5 * r * log(r) / length(dq), trap);
}

// =============================================
//  5 — Sierpinski Tetrahedron
// =============================================
vec2 deSierpinski(vec3 p) {
    vec3 w = p;
    float trap = 1e10;
    float scale = 2.0;
    vec3 offset = vec3(1.0, 1.0, 1.0);

    for (int i = 0; i < 16; i++) {
        if (i >= u_iterations) break;
        if (w.x + w.y < 0.0) w.xy = -w.yx;
        if (w.x + w.z < 0.0) w.xz = -w.zx;
        if (w.y + w.z < 0.0) w.yz = -w.zy;
        trap = min(trap, dot(w, w));
        w = w * scale - offset * (scale - 1.0);
    }
    return vec2(length(w) * pow(scale, -float(u_iterations)), trap);
}

// =============================================
//  Scene dispatcher
// =============================================
vec2 scene(vec3 p) {
    if (u_formula == 1) return deJuliabulb(p);
    if (u_formula == 2) return deBurningShip(p);
    if (u_formula == 3) return deMandelbox(p);
    if (u_formula == 4) return deQuaternionJulia(p);
    if (u_formula == 5) return deSierpinski(p);
    return deMandelbulb(p);
}

// =============================================
//  Rendering helpers
// =============================================
vec3 calcNormal(vec3 p) {
    vec2 e = vec2(0.0005, 0.0);
    return normalize(vec3(
        scene(p + e.xyy).x - scene(p - e.xyy).x,
        scene(p + e.yxy).x - scene(p - e.yxy).x,
        scene(p + e.yyx).x - scene(p - e.yyx).x
    ));
}

float calcAO(vec3 p, vec3 n) {
    float occ = 0.0;
    float sca = 1.0;
    for (int i = 0; i < 5; i++) {
        float h = 0.01 + 0.12 * float(i);
        float d = scene(p + h * n).x;
        occ += (h - d) * sca;
        sca *= 0.7;
    }
    return clamp(1.0 - u_ao_strength * occ, 0.0, 1.0);
}

void main() {
    vec2 uv = (gl_FragCoord.xy - 0.5 * u_resolution.xy) / u_resolution.y;

    vec2 ms = u_mouse / u_resolution;
    float angleH = ms.x * 6.2831 - 3.14159 + u_time * u_rot_speed;
    float angleV = -0.3 + ms.y * 1.2;

    vec3 ro = u_cam_dist * vec3(
        cos(angleV) * sin(angleH),
        sin(angleV),
        cos(angleV) * cos(angleH)
    );
    vec3 target = vec3(0.0);
    vec3 forward = normalize(target - ro);
    vec3 right = normalize(cross(forward, vec3(0.0, 1.0, 0.0)));
    vec3 up = cross(right, forward);
    vec3 rd = normalize(forward * u_fov + right * uv.x + up * uv.y);

    float t = 0.0;
    float trap = 0.0;
    bool hit = false;
    for (int i = 0; i < 200; i++) {
        vec3 p = ro + rd * t;
        vec2 res = scene(p);
        float d = res.x;
        if (d < 0.0005) {
            trap = res.y;
            hit = true;
            break;
        }
        if (t > 10.0) break;
        t += d;
    }

    vec3 col = mix(vec3(0.01, 0.01, 0.02), vec3(0.04, 0.02, 0.06), uv.y + 0.5);

    if (hit) {
        vec3 p = ro + rd * t;
        vec3 n = calcNormal(p);

        vec3 baseColor = 0.5 + 0.5 * cos(
            vec3(0.0, 0.6, 1.0) + 2.5 * sqrt(trap) + u_color_shift + vec3(0.0, 0.3, 0.6)
        );

        vec3 lightDir1 = normalize(vec3(1.0, 2.0, 1.5));
        vec3 lightDir2 = normalize(vec3(-1.0, 0.5, -1.0));
        float diff1 = max(dot(n, lightDir1), 0.0);
        float diff2 = max(dot(n, lightDir2), 0.0);

        vec3 halfVec = normalize(lightDir1 - rd);
        float spec = pow(max(dot(n, halfVec), 0.0), u_spec_power);

        float ao = calcAO(p, n);
        float fre = pow(1.0 + dot(rd, n), 3.0);

        col = baseColor * (
            0.7 * diff1 +
            0.15 * diff2 * vec3(0.4, 0.5, 0.8) +
            0.1
        );
        col += 0.5 * spec * vec3(1.0, 0.95, 0.9);
        col += 0.15 * fre * vec3(0.4, 0.5, 0.8);
        col *= ao;

        float fog = 1.0 - exp(-0.3 * t * t);
        col = mix(col, vec3(0.01, 0.01, 0.02), fog);
    }

    col = col / (col + 1.0);
    col = pow(col, vec3(0.4545));

    fragColor = vec4(col, 1.0);
}
`;
