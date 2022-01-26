const fragment = /* glsl */ `
uniform vec3 baseColor;
uniform sampler2D myTexture;
uniform mat4 cameraMatrix;
uniform mat4 projMatrix;
    
varying vec4 vWorldPos;
varying vec3 viewZ;
    
void main() {
    vec4 texc = projMatrix * cameraMatrix * vWorldPos;
    vec2 uv = texc.xy / texc.w / 2.0 + 0.5;

    if (uv.x < 1.0 && uv.x > 0.0 && uv.y < 1.0 && uv.y > 0.0) {
        gl_FragColor = vec4(texture(myTexture, uv).rgb, 1.0);
    } else {
        gl_FragColor = vec4(0.0);
    }
}
`;
export default fragment;
