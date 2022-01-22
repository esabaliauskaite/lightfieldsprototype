import * as THREE from "https://cdn.skypack.dev/three@0.130.1/build/three.module.js";
import { OrbitControls } from "https://cdn.skypack.dev/three@0.130.1/examples/jsm/controls/OrbitControls.js";
import { OBJLoader } from "https://cdn.skypack.dev/three@0.130.1/examples/jsm/loaders/OBJLoader.js";

import vertexScreen from "./shaders/vertexScreen.js";
import fragmentScreen from "./shaders/fragmentScreen.js";
import vertex from "./shaders/vertex.js";
import fragment from "./shaders/fragment.js";
import { cameraHelperArray } from "./modules/cameraHelperArray.js";

// # Debug Scene ##
const imgURL = "./data/debug_scene/";
const poseURL = "./data/debug_scene/blender_poses.json";
const demURL = "./data/zero_plane.obj";
const singleImageFov = 60; // degrees

const bgColor = new THREE.Color(0x0f0f0f);
const debugbgColor = new THREE.Color(0, 0, 0);

const views = {
  main: {
    left: 0,
    bottom: 0,
    width: 1.0,
    height: 1.0,
    background: bgColor,
    eye: [0, 0, 4],
    up: [0, 1, 0],
    fov: 60,
  },
  debug: {
    left: 0,
    bottom: 0.8,
    width: 0.15,
    height: 0.2,
    background: debugbgColor,
    eye: [0, -1, 9],
    up: [0, 1, 0],
    fov: 60,
  },
};

const mainView = views.main;
const debugView = views.debug;

let scene, renderer, dem;
let singleImages = new Array();
let singleImageMaterials = new Array();
let cameraArrayHelper = new Array();

let sceneGeometries = [];
let rtTarget;
let rtScene;

let mainCamera, debugCamera;
let axesHelper, cameraHelper;

let windowWidth, windowHeight;

function createProjectiveMaterial(projCamera, tex = null) {
  var material = new THREE.ShaderMaterial({
    uniforms: {
      baseColor: {
        value: new THREE.Color(0xcccccc),
      },
      cameraMatrix: {
        type: "m4",
        value: projCamera.matrixWorldInverse,
      },
      projMatrix: {
        type: "m4",
        value: projCamera.projectionMatrix,
      },
      myTexture: {
        value: tex,
      },
    },
    vertexShader: vertex,
    fragmentShader: fragment,
    side: THREE.DoubleSide,
    transparent: true,
    blending: THREE.AdditiveBlending,
    depthTest: false,
    blendDst: THREE.OneFactor,
    blendSrc: THREE.OneFactor,
  });

  return material;
}

function createScreenMaterial(texture) {
  const materialScreen = new THREE.ShaderMaterial({
    uniforms: {
      tDiffuse: { value: texture },
    },
    vertexShader: vertexScreen,
    fragmentShader: fragmentScreen,
    depthWrite: false,
    transparent: true,
    blending: THREE.NormalBlending,
  });

  return materialScreen;
}

async function fetchPosesJSON(url) {
  const response = await fetch(url);
  const poses = await response.json();
  return poses;
}

fetchPosesJSON(poseURL).then((poses) => {
  if (!("images" in poses)) {
    console.log(
      `An error happened when loading JSON poses. Property images is not present.`
    );
  }
  const positions = new Array();
  const debugTable = [["image", "x", "y", "z", "rotX", "rotY", "rotZ"]];
  for (const pose of poses.images) {
    const useLegacy = !(
      pose.hasOwnProperty("location") && pose.hasOwnProperty("rotation")
    );
    let pos = new THREE.Vector3();
    let quat = new THREE.Quaternion();
    let scale = new THREE.Vector3();

    if (useLegacy) {
      // matrix
      const M = pose.M3x4;
      let matrix = new THREE.Matrix4();
      matrix.set(
        M[0][0],
        M[0][1],
        M[0][2],
        M[0][3],
        M[1][0],
        M[1][1],
        M[1][2],
        M[1][3],
        M[2][0],
        M[2][1],
        M[2][2],
        M[2][3],
        0,
        0,
        0,
        1
      );
      matrix.decompose(pos, quat, scale);
      //console.log( `matrix for image ${pose.imagefile} has p: ${pos.x},${pos.y},${pos.z}, rot: ${quat}, scale: ${scale.x},${scale.y},${scale.z}.`)
      // console.table(pos)
      pos.x = -pos.x; // flip x coordinate
    } else {
      pos.fromArray(pose.location); // location stores as x,y,z coordinates
      // rotation stored as quaternion (x,y,z,w)
      quat.x = pose.rotation[0];
      quat.y = pose.rotation[1];
      quat.z = pose.rotation[2];
      quat.w = pose.rotation[3];
    }

    // debug
    {
      const euler = new THREE.Euler().setFromQuaternion(quat, "ZYX"); // XYZ in Blender, inverse here!
      debugTable.push([
        pose.imagefile,
        Math.round(pos.x * 100) / 100,
        Math.round(pos.y * 100) / 100,
        Math.round(pos.z * 100) / 100,
        Math.round(THREE.MathUtils.radToDeg(euler.x)),
        Math.round(THREE.MathUtils.radToDeg(euler.y)),
        Math.round(THREE.MathUtils.radToDeg(euler.z)),
      ]);
    }
    positions.push(pos);

    const camera = new THREE.PerspectiveCamera(singleImageFov, 1.0, 0.5, 10000);
    camera.position.copy(pos);
    camera.applyQuaternion(quat);

    let url = imgURL + pose.imagefile;
    url = url.replace(".tiff", ".png");
    const tex = textureLoader.load(url);
    const singleImageMaterial = createProjectiveMaterial(camera, tex);
    singleImageMaterials.push(singleImageMaterial);
    if (dem) {
      dem.material = singleImageMaterial;
    }
    const helper = new cameraHelperArray(camera);
    scene.add(helper);
    helper.visible = false;
    cameraArrayHelper.push(helper);
    singleImages.push(camera);
    scene.add(camera);
  }
});

const textureLoader = new THREE.TextureLoader();

const loader = new OBJLoader();
loader.load(
  demURL,
  function (object) {
    dem = object.children[0];
    dem.scale.fromArray([1, 1, -1]);
    const wireframeMaterial = new THREE.MeshBasicMaterial({
      color: 0x000000,
      wireframe: true,
      transparent: true,
    });
    //dem.add(wireframe);
    scene.add(dem); // */
    dem.position.z = -4;
    document.getElementById("Focusamount").value = dem.position.z;
    document.getElementById("FocusInput").value = dem.position.z;
    sceneGeometries.push(dem);
    rtScene.add(dem);
  },
  function () {},
  function () {
    console.log(`An error happened when loading ${demURL}`);
  }
);

function showCameraArray() {
  if (document.getElementById("CameraArray").checked) {
    for (let i = 0; i < cameraArrayHelper.length; i++) {
      cameraArrayHelper[i].visible = true;
    }
  } else {
    for (let i = 0; i < cameraArrayHelper.length; i++) {
      cameraArrayHelper[i].visible = false;
    }
  }
}

init();
render();

function init() {
  scene = new THREE.Scene();
  rtScene = new THREE.Scene();

  renderer = new THREE.WebGLRenderer({
    antialias: true,
    alpha: true,
  });
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.setSize(window.innerWidth, window.innerHeight);

  axesHelper = new THREE.AxesHelper(25);
  scene.add(axesHelper);

  const light = new THREE.DirectionalLight(0xffffff);
  light.position.set(0, 0, 1);
  scene.add(light);

  mainCamera = new THREE.PerspectiveCamera(
    mainView.fov,
    window.innerWidth / window.innerHeight,
    1,
    10000
  );
  mainCamera.position.fromArray(mainView.eye);
  mainCamera.up.fromArray(mainView.up);
  mainView.camera = mainCamera;

  document.getElementById("CameraXInput").value = mainCamera.position.x;
  document.getElementById("CameraYInput").value = mainCamera.position.y;
  document.getElementById("CameraZInput").value = mainCamera.position.z;

  document.getElementById("CameraXamount").value = mainCamera.position.x;
  document.getElementById("CameraYamount").value = mainCamera.position.y;
  document.getElementById("CameraZamount").value = mainCamera.position.z;

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

  rtTarget = new THREE.WebGLRenderTarget(
    window.innerWidth,
    window.innerHeight,
    {
      minFilter: THREE.LinearFilter,
      magFilter: THREE.NearestFilter,
      format: THREE.RGBAFormat,
      type: THREE.FloatType,
    }
  );

  const plane = new THREE.PlaneGeometry(2, 2);
  const screenMaterial = createScreenMaterial(rtTarget.texture);
  const quad = new THREE.Mesh(plane, screenMaterial);
  scene.add(quad);
  document.body.appendChild(renderer.domElement);
}

function Resize() {
  if (windowWidth != window.innerWidth || windowHeight != window.innerHeight) {
    windowWidth = window.innerWidth;
    windowHeight = window.innerHeight;
    renderer.setSize(windowWidth, windowHeight);
  }
}

function setFocus() {
  dem.position.z = document.getElementById("FocusInput").value;
  console.log(dem.position.z);
}

function setCameraX() {
  mainCamera.position.x = document.getElementById("CameraXInput").value;
}
function setCameraY() {
  mainCamera.position.y = document.getElementById("CameraYInput").value;
}
function setCameraZ() {
  mainCamera.position.z = document.getElementById("CameraZInput").value;
}

function renderLightField1() {
  document.getElementById("PC2").classList.remove("clicked");
  document.getElementById("PC1").classList.add("clicked");
}

function renderLightField2() {
  document.getElementById("PC2").classList.add("clicked");
  document.getElementById("PC1").classList.remove("clicked");
}

function render() {
  requestAnimationFrame(render);
  Resize();
  document.getElementById("FocusInput").addEventListener("input", setFocus);
  document.getElementById("Focusamount").addEventListener("change", setFocus);
  document.getElementById("CameraXInput").addEventListener("input", setCameraX);
  document.getElementById("CameraYInput").addEventListener("input", setCameraY);
  document.getElementById("CameraZInput").addEventListener("input", setCameraZ);
  document.getElementById("PC1").addEventListener("click", renderLightField1);
  document.getElementById("PC2").addEventListener("click", renderLightField2);
  document
    .getElementById("CameraArray")
    .addEventListener("change", showCameraArray);

  renderer.autoClear = false;
  renderer.setRenderTarget(rtTarget);
  renderer.setClearColor(new THREE.Color(0), 0);
  renderer.clear();

  const cam = views.main.camera;
  for (let i = 0; i < singleImageMaterials.length; i++) {
    dem.material = singleImageMaterials[i];
    renderer.render(rtScene, cam);
  }

  renderer.setRenderTarget(null);

  const left = Math.floor(windowWidth * mainView.left);
  const bottom = Math.floor(windowHeight * mainView.bottom);
  const width = Math.floor(windowWidth * mainView.width);
  const height = Math.floor(windowHeight * mainView.height);

  axesHelper.visible = false;
  cameraHelper.visible = false;

  renderer.setViewport(left, bottom, width, height);
  renderer.setScissor(left, bottom, width, height);
  renderer.setScissorTest(true);
  renderer.setClearColor(bgColor, 1);
  renderer.clear();

  mainCamera.aspect = width / height;
  document.getElementById("FOVAmount").value = mainCamera.fov;
  mainCamera.updateProjectionMatrix();
  renderer.render(scene, mainCamera);

  if (document.querySelector("#DebugView").checked) {
    axesHelper.visible = true;
    cameraHelper.visible = true;
    renderer.autoClear = false;

    const debugleft = Math.floor(windowWidth * debugView.left);
    const debugbottom = Math.floor(windowHeight * debugView.bottom);
    const debugwidth = Math.floor(windowWidth * debugView.width);
    const debugheight = Math.floor(windowHeight * debugView.height);

    renderer.setViewport(debugleft, debugbottom, debugwidth, debugheight);
    renderer.setScissor(debugleft, debugbottom, debugwidth, debugheight);
    renderer.setScissorTest(true);
    renderer.setClearColor(debugbgColor, 1);
    renderer.clear();

    debugCamera.aspect = debugView.width / debugView.height;
    debugCamera.updateProjectionMatrix();
    renderer.render(scene, debugCamera);
  }
}
