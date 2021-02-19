import { Quaternion, Point } from "./vector";
import THREE = require("three");

export type Location = {
    position: () => Point;
    rotation: () => Quaternion;
    scale: () => Point;
    shear: () => Point;
    affine: () => THREE.Matrix4;
}

export class ReferenceFrame {



}
