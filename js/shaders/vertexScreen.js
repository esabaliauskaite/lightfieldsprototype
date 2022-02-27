const vertexScreen = /* glsl */ `
varying vec4 vWorldPos;
varying vec4 clipPos;
varying vec2 vUv;

    void main() {
      //
      vUv = uv;
      vWorldPos = modelMatrix * vec4(position, 1.0);
      clipPos = projectionMatrix * viewMatrix * vWorldPos;
      gl_Position = clipPos;
    }
`;
export default vertexScreen;
