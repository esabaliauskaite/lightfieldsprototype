
# Light Field Renderer Prototype

Light field renderer prototype is built using HTML, CSS, JS, three.js. Renderer allows to explore specific light fields using selected functionalities

![Picture1](https://user-images.githubusercontent.com/59394960/155564486-726ecc41-f6d1-4af9-8ab8-5585beff97ce.png)

LIVE: https://esabaliauskaite.github.io/lightfieldsprototype/

## Prerequisites:

- [Visual Studio Code IDE](https://visualstudio.microsoft.com/)
- [Live server Visual studio Code extension](https://marketplace.visualstudio.com/items?itemName=ritwickdey.LiveServer)

## Opening the project

- Clone the project. 
- Open the folder in Visual Studio Code. 
- Install the extension from the in-software marketplace, if it has not been done before. 
- Select index.html as the base of the project. 
- Press Go Live at the bottom of the IDE. 
- Website should automatically open in the default browser.

## Functionalities

- **Animation.** When this checkbox is toggled, focus animation starts. It starts from focus value to -15. The animation breaks if the current focus value is more than -15 as it has hard-coded values (-4 and -15) to fit with the debug dataset.
- **Reset.** Resets everything to initial state.
- **Controls.** Controls for camera, focus plane, pinhole view and aditional data. 
  - **Camera position.** Camera position can be changed with the sliders or input fields provided in the graphical user interface and is also updated
  - **Camera orrientation.** Camera orrientation can be changed with the sliders or input fields provided in the graphical user interface.
  - **Focus.** Focus of the light field is changed by moving digital elevation plane along the z axis. However, due to coordinate mismatch between WebGL and blender values which were positive in blender are negative in the prototype.
  - **Current FOV.** Shows current main camera FOV and can be changed using input in 1st variant and is static in the 2nd variant.
  - **Pinhole View.** Shows dataset in pinhole view. In 1st variant, closest to the main camera. In 2nd variant, selected by the user.
  - **Show camera array.** When this checkbox is toggled, in the scene it is possible to see camera helpers representing a camera for every image in the dataset. It is rendered from an array containing camera position and rotation for each image in the dataset.
  - **Show debug view.** When this checkbox is toggled, in the upper left corner of the renerer appears a new viewport appears showing the scene from a different angle. The main camera used in the main view of the renderer is shown using a camera helper in the debug view.
  - **Show point cloud view** - shows 3D point cloud model of the scene when checkbox is triggered.

## Variants

Variants can be found in other branches

| **Functionality**        | **Variant 1**      | **Variant 2**          |
|--------------------------|--------------------|------------------------|
| _Camera position_        | Possible to change | Not possible to change |
| _Camera orientation_     | Front vector       | Quat                   |
| _Focus_                  | Plane              | Plane                  |
| _Pinhole view_           | Closest one        | Selection              |
| _Field of view_          | Possible to change | Not possible to change |
| _Checkbox: Camera Array_ | +                  | +                      |
| _Checkbox: Debug View_   | +                  | +                      |
| _Checkbox: Point Cloud_  | +                  | +                      |
