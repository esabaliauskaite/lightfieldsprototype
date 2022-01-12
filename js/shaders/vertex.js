const vertex = /* glsl */ `
varying vec4 vWorldPos;

    void main() {
      //
      vWorldPos = modelMatrix * vec4(position, 1.0);
      gl_Position = projectionMatrix * viewMatrix * vWorldPos;

    }
`;
export default vertex;
