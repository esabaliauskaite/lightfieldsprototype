const fragmentScreen = /* glsl */ `
varying vec2 vUv;
uniform sampler2D tDiffuse;

void main() {

    vec4 rgba = texture2D( tDiffuse, vUv ).rgba;
    if(rgba.a>0.000001){
        gl_FragColor = vec4(rgba.rgb/rgba.a, 1.0);
    }else{
        gl_FragColor = vec4(0.0);
    }
}
`;
export default fragmentScreen;
