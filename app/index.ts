import * as PIXI from "pixi.js";
import { Pen, SmartPen, Brusher } from "./brush";
import { PtTransform } from "./transform";
import { Bezier, WeightedVector } from "./bezier";
import { Point, Style, Color, Scalar } from "./vectors";
import { Canvas } from "./canvas";
import { Graphics } from "pixi.js";
import { BezTool } from "./tools";

let renderer = PIXI.autoDetectRenderer();

const app: PIXI.Application = new PIXI.Application(
    {
        width: window.innerWidth,
        height: window.innerHeight,
        backgroundColor: 0x000000,
        resolution: window.devicePixelRatio || 1,
        autoResize: true
    }
);

function color(r = 0, g = 0, b = 0): Style {
    return new Style({ "color": new Color(r, g, b, 1), "width": new Scalar(40) });
}


window.onresize = function(_event: UIEvent): void {
    app.renderer.resize(window.innerWidth, window.innerHeight);
};


document.body.appendChild(app.view);


var id = new PtTransform();

var cvs = new Canvas([]);

var g = new PIXI.Graphics();
app.stage.addChild(g);
var tg = new PIXI.Graphics();

tg.lineStyle(10, 0xffffff);
tg.moveTo(-100, -100);
tg.lineTo(100, -100);
tg.lineTo(100, 100);
tg.lineTo(-100, 100);
tg.lineTo(-100, -100);

const defaultStyle = new Style({
    color: new Color(1, 1, 0),
    width: new Scalar(1)
})

var tool = new BezTool(new Brusher(cvs, new SmartPen(defaultStyle), 5), renderer.generateTexture(tg));

app.stage.addChild(tool);

function gameLoop(delta: number): void {
    g.clear();
    cvs.drawOn(id, g);
}

app.ticker.add(gameLoop);
