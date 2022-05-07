
# Light Field Renderer Prototype

Light field renderer prototype is built using HTML, CSS, JS, three.js. Renderer allows to explore specific light fields using selected functionalities. This prototype was used in a user study regarding interaction techniques for airborne light fields.

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
- **Reset.** Resets everything to initial state.
- **Functionalities.** Explains possible controls using keyboard bindings and functionalities of the prototype.
- **Controls.** Controls for camera, focus plane, pinhole view and aditional data. 
  - **Camera position.** Camera position can be changed with the sliders or input fields provided in the graphical user interface and is also updated
  - **Camera orrientation.** Camera orrientation is static and cannot be changed.
  - **Focus.** Focus of the light field is changed by moving digital elevation plane along the z axis. However, due to coordinate mismatch between WebGL and blender values which were positive in blender are negative in the prototype.
  - **Current FOV.** Shows current main camera FOV and can be changed using input in 1st variant and is static in the 2nd variant.
  - **Pinhole View.** Shows dataset in pinhole view. In 1st variant, closest to the main camera. In 2nd variant, selected by the user using a slider.

## Variants

| **Functionality**        | **Variant 1**      | **Variant 2**          |
|--------------------------|--------------------|------------------------|
| _Camera position_        | Possible to change | Possible to change     |
| _Camera orientation_     | Not possible to change| Not possible to change|
| _Focus_                  | Plane              | Plane                  |
| _FOV_                  | Possible to change              | Possible to change|
| _Pinhole view_           | Closest one        | Selection using slider |
