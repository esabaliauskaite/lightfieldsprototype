const fragmentScreen = /* glsl */ `
varying vec2 vUv;
uniform sampler2D tDiffuse;
varying vec4 clipPos;


void main() {

    vec2 uv = clipPos.xy / clipPos.w / 2.0 + 0.5;

    vec4 rgba = texture2D( tDiffuse, uv ).rgba;
    if(rgba.a>0.000001){
        gl_FragColor = vec4(rgba.rgb/rgba.a, 1.0);
    }else{
        discard;
        gl_FragColor = vec4(0.0);
    }
}
`;
export default fragmentScreen;
