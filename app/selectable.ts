import { Drawable } from "./drawable";
import { PtTransform } from "./transform";
import * as PIXI from "pixi.js";

interface Selectable {
    drawSelected(t: PtTransform, ): PIXI.Graphics;
}



