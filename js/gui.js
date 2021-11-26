import * as dat from "dat.gui";

export function addGUI(plane, camera, bokehPass) {
  const effectController = {
    focus: 500.0,
    aperture: 5,
  };
  const matChanger = function () {
    bokehPass.uniforms["focus"].value = effectController.focus;
    bokehPass.uniforms["aperture"].value = effectController.aperture * 0.00001;
  };

  const gui = new dat.GUI({ width: 300 });
  const message = {
    left: "Left mouse button to rotate",
    middle: "Middle mouse button to dolly",
    right: "Right mouse button to pan",
  };
  const InstructionsFolder = gui.addFolder("Instructions");
  InstructionsFolder.add(message, "left");
  InstructionsFolder.add(message, "middle");
  InstructionsFolder.add(message, "right");
  InstructionsFolder.open();

  const FocusFolder = gui.addFolder("Focus");
  FocusFolder.add(effectController, "focus", 10.0, 300.0, 10).onChange(
    matChanger
  );
  FocusFolder.open();

  const ApetureFolder = gui.addFolder("Apeture");
  ApetureFolder.add(effectController, "aperture", 0, 10, 0.1).onChange(
    matChanger
  );
  ApetureFolder.open();

  const SizeFolder = gui.addFolder("Size");
  SizeFolder.add(plane.scale, "x", 1, 5)
    .name("Scale X")
    .onChange(camera.updateProjectionMatrix());
  SizeFolder.add(plane.scale, "y", 1, 5)
    .name("Scale Y")
    .onChange(camera.updateProjectionMatrix());
  SizeFolder.open();

  const cameraFolder = gui.addFolder("Camera");
  cameraFolder.add(camera.position, "x", 0, 10);
  cameraFolder.add(camera.position, "y", 0, 10);
  cameraFolder.add(camera.position, "z", 0, 10);
  cameraFolder.open();
  matChanger();
}
