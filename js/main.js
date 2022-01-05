import * as THREE from "https://cdn.skypack.dev/three@0.130.1/build/three.module.js";
import { OrbitControls } from "https://cdn.skypack.dev/three@0.130.1/examples/jsm/controls/OrbitControls.js";

let scene, renderer;
let mainCamera, debugCamera;

let windowWidth, windowHeight;

let axesHelper, cameraHelper;

const views = {
  main: {
    left: 0,
    bottom: 0,
    width: 1.0,
    height: 1.0,
    background: new THREE.Color(0.89, 0.89, 0.89),
    eye: [0, 0, 5],
    up: [0, 1, 0],
    fov: 60,
  },
  debug: {
    left: 0,
    bottom: 0.8,
    width: 0.15,
    height: 0.2,
    background: new THREE.Color(0, 0, 0),
    eye: [-5, 2, 5],
    up: [0, 1, 0],
    fov: 60,
  },
};

init();
animate();

function init() {
  renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.setSize(window.innerWidth, window.innerHeight);
  document.body.appendChild(renderer.domElement);

  scene = new THREE.Scene();

  axesHelper = new THREE.AxesHelper(25);
  scene.add(axesHelper);

  const light = new THREE.DirectionalLight(0xffffff);
  light.position.set(0, 0, 1);
  scene.add(light);

  //get and render the poses and images
  fetch("data/debug_scene/poses.json")
    .then((response) => response.json())
    .then((data) => {
      for (let i = 0; i < data.images.length; i++) {
        const geo1 = new THREE.PlaneGeometry(2, 2);
        const img1 = new THREE.MeshBasicMaterial({
          map: new THREE.TextureLoader().load(
            "data/debug_scene/" + data.images[i].imagefile
          ),
        });
        img1.side = THREE.DoubleSide;
        const plane1 = new THREE.Mesh(geo1, img1);
        plane1.applyMatrix4(parseMatrix(data.images[i].M3x4));

        scene.add(plane1);
        plane1.updateMatrix();
      }
    })
    .catch((error) => console.log(error));

  //all of the functions

  //M3x4 to usable
  function parseMatrix(json) {
    let data = [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1];
    for (let i = 0; i < json.length; i++) {
      for (let j = 0; j < json.length; j++) {
        if (typeof json[i][j] === "string") {
          data[j * 4 + i] = parseFloat(json[i][j]);
        }
        if (typeof json[i][j] === "number") {
          data[j * 4 + i] = json[i][j];
        }
      }
    }
    return new THREE.Matrix4().fromArray(data);
  }
  const mainView = views.main;
  const debugView = views.debug;

  mainCamera = new THREE.PerspectiveCamera(
    mainView.fov,
    window.innerWidth / window.innerHeight,
    1,
    10000
  );
  mainCamera.position.fromArray(mainView.eye);
  mainCamera.up.fromArray(mainView.up);
  mainView.camera = mainCamera;

  //Orbit controls for user
  const mainControls = new OrbitControls(mainCamera, renderer.domElement);
  mainControls.mouseButtons = {
    LEFT: THREE.MOUSE.ROTATE,
    MIDDLE: THREE.MOUSE.DOLLY,
    RIGHT: THREE.MOUSE.PAN,
  };

  cameraHelper = new THREE.CameraHelper(mainCamera);
  scene.add(cameraHelper);

  debugCamera = new THREE.PerspectiveCamera(
    debugView.fov,
    window.innerWidth / window.innerHeight,
    1,
    10000
  );
  debugCamera.position.fromArray(debugView.eye);
  debugCamera.up.fromArray(debugView.up);
  debugView.camera = debugCamera;

  //Orbit controls for user
  const debugControls = new OrbitControls(debugCamera, renderer.domElement);
  debugControls.mouseButtons = {
    LEFT: THREE.MOUSE.ROTATE,
    MIDDLE: THREE.MOUSE.DOLLY,
    RIGHT: THREE.MOUSE.PAN,
  };
}

function updateSize() {
  if (windowWidth != window.innerWidth || windowHeight != window.innerHeight) {
    windowWidth = window.innerWidth;
    windowHeight = window.innerHeight;

    renderer.setSize(windowWidth, windowHeight);
  }
}

function animate() {
  render();

  requestAnimationFrame(animate);
}

function render() {
  updateSize();

  const mainView = views.main;

  const left = Math.floor(windowWidth * mainView.left);
  const bottom = Math.floor(windowHeight * mainView.bottom);
  const width = Math.floor(windowWidth * mainView.width);
  const height = Math.floor(windowHeight * mainView.height);

  axesHelper.visible = false;
  cameraHelper.visible = false;

  renderer.setViewport(left, bottom, width, height);
  renderer.setScissor(left, bottom, width, height);
  renderer.setScissorTest(true);
  renderer.setClearColor(mainView.background);

  mainCamera.aspect = width / height;
  mainCamera.updateProjectionMatrix();
  renderer.render(scene, mainCamera);

  const debugView = views.debug;

  axesHelper.visible = true;
  cameraHelper.visible = true;

  const debugleft = Math.floor(windowWidth * debugView.left);
  const debugbottom = Math.floor(windowHeight * debugView.bottom);
  const debugwidth = Math.floor(windowWidth * debugView.width);
  const debugheight = Math.floor(windowHeight * debugView.height);

  renderer.setViewport(debugleft, debugbottom, debugwidth, debugheight);
  renderer.setScissor(debugleft, debugbottom, debugwidth, debugheight);
  renderer.setScissorTest(true);
  renderer.setClearColor(debugView.background);

  debugCamera.aspect = width / height;
  debugCamera.updateProjectionMatrix();
  renderer.render(scene, debugCamera);
}
