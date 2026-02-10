/**
 * Compile a GLSL shader from source.
 * @param {WebGL2RenderingContext} gl
 * @param {number} type - gl.VERTEX_SHADER or gl.FRAGMENT_SHADER
 * @param {string} source
 * @returns {WebGLShader}
 */
export function compileShader(gl, type, source) {
    const shader = gl.createShader(type);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);

    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        const log = gl.getShaderInfoLog(shader);
        gl.deleteShader(shader);
        const typeName = type === gl.VERTEX_SHADER ? 'VERTEX' : 'FRAGMENT';
        throw new Error(`${typeName} shader compile error:\n${log}`);
    }

    return shader;
}

/**
 * Link vertex + fragment shaders into a program.
 * @param {WebGL2RenderingContext} gl
 * @param {WebGLShader} vertShader
 * @param {WebGLShader} fragShader
 * @returns {WebGLProgram}
 */
export function createProgram(gl, vertShader, fragShader) {
    const program = gl.createProgram();
    gl.attachShader(program, vertShader);
    gl.attachShader(program, fragShader);
    gl.linkProgram(program);

    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
        const log = gl.getProgramInfoLog(program);
        gl.deleteProgram(program);
        throw new Error(`Program link error:\n${log}`);
    }

    return program;
}

/**
 * Get all active uniform locations for a program.
 * @param {WebGL2RenderingContext} gl
 * @param {WebGLProgram} program
 * @returns {Object<string, WebGLUniformLocation>}
 */
export function getUniformLocations(gl, program) {
    const uniforms = {};
    const count = gl.getProgramParameter(program, gl.ACTIVE_UNIFORMS);
    for (let i = 0; i < count; i++) {
        const info = gl.getActiveUniform(program, i);
        uniforms[info.name] = gl.getUniformLocation(program, info.name);
    }
    return uniforms;
}

/**
 * Build a complete program from vertex + fragment source strings.
 * @param {WebGL2RenderingContext} gl
 * @param {string} vertSource
 * @param {string} fragSource
 * @returns {{ program: WebGLProgram, uniforms: Object }}
 */
export function buildProgram(gl, vertSource, fragSource) {
    const vertShader = compileShader(gl, gl.VERTEX_SHADER, vertSource);
    const fragShader = compileShader(gl, gl.FRAGMENT_SHADER, fragSource);
    const program = createProgram(gl, vertShader, fragShader);
    const uniforms = getUniformLocations(gl, program);

    // Shaders can be detached/deleted after linking
    gl.detachShader(program, vertShader);
    gl.detachShader(program, fragShader);
    gl.deleteShader(vertShader);
    gl.deleteShader(fragShader);

    return { program, uniforms };
}
