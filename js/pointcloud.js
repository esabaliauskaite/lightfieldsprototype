import * as THREE from "https://cdn.skypack.dev/three@0.130.1/build/three.module.js";
import { OrbitControls } from "https://cdn.skypack.dev/three@0.130.1/examples/jsm/controls/OrbitControls.js";
import { OBJLoader } from "https://cdn.skypack.dev/three@0.130.1/examples/jsm/loaders/OBJLoader.js";
const scene = new THREE.Scene();

const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setClearColor(new THREE.Color(0.89, 0.89, 0.89));
document.body.appendChild(renderer.domElement);

const camera = new THREE.PerspectiveCamera(
  75,
  window.innerWidth / window.innerHeight,
  0.1,
  1000
);

camera.position.z = 55;

const controls = new OrbitControls(camera, renderer.domElement);

const light = new THREE.AmbientLight(0x404040);
scene.add(light);

window.addEventListener("resize", () => {
  renderer.setSize(window.innerWidth, window.innerHeight);
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
});

//let objFile = "debug_scene.obj";
let objFile = "001.obj";
//let objFile = "City.obj";

function renderPointCloud1() {}

function renderPointCloud2() {
  //objFile = "City.obj";
}

function PointCloud() {
  const loader = new OBJLoader();
  loader.load(
    objFile,
    (obj) => {
      // the request was successfull
      let material = new THREE.PointsMaterial({ color: 0xff0000, size: 0.5 });
      let mesh = new THREE.Points(obj.children[0].geometry, material);
      //mesh.position.y = -15 //this model is not exactly in the middle by default so I moved it myself
      scene.add(mesh);
      console.log(objFile);
    },
    (xhr) => {
      // the request is in progress
      console.log(xhr);
    },
    (err) => {
      // something went wrong
      console.error("loading .obj went wrong, ", err);
    }
  );
  renderer.clear();
}

function animate() {
  document.getElementById("1").addEventListener("click", renderPointCloud1);
  document.getElementById("2").addEventListener("click", renderPointCloud2);

  requestAnimationFrame(animate);
  renderer.render(scene, camera);
}
PointCloud();
animate();
