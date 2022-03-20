import { setCameraX, setCameraY } from "./setControls.js";
export function keyboardControls(e, camera) {
  if (e.key == "ArrowUp" || e.key == "w") {
    let val = parseFloat(camera.position.y);
    val += 1;
    camera.position.y = val;
    console.log(camera.position.y);
    setCameraY(camera);
  }
  if (e.key == "ArrowDown" || e.key == "s") {
    camera.position.y -= 1;
    console.log(camera.position);
    setCameraY(camera);
  }
  if (e.key == "ArrowLeft" || e.key == "d") {
    camera.position.x += 1;
    console.log(camera.position);
    setCameraX(camera);
  }
  if (e.key == "ArrowRight" || e.key == "a") {
    camera.position.x -= 1;
    console.log(camera.position);
    setCameraX(camera);
  }
}
