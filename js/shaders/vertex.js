const vertex = /* glsl */ `
varying vec4 vWorldPos;
varying vec3 viewZ;

    void main() {
      //
      vWorldPos = modelMatrix * vec4(position, 1.0);
      gl_Position = projectionMatrix * viewMatrix * vWorldPos;
      viewZ = -(modelViewMatrix * vec4(position.xyz, 1.)).xyz;

    }
`;
export default vertex;
