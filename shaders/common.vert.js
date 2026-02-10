export const vertexSource = `#version 300 es
// Fullscreen triangle from gl_VertexID — no vertex buffers needed.
// 3 vertices at (-1,-1), (3,-1), (-1,3) cover the entire clip-space quad.
void main() {
    float x = float((gl_VertexID & 1) << 2) - 1.0;
    float y = float((gl_VertexID & 2) << 1) - 1.0;
    gl_Position = vec4(x, y, 0.0, 1.0);
}
`;
