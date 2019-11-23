import * as PIXI from "pixi.js";
import { Pen, SmartPen, Brusher, BrushedCurve, Dots, PerspPen, DebugPen } from "./brush";
import { PtTransform, Transform } from "./transform";
import { Bezier, WeightedVector, BSpline, WeightedAverageCurve, Spline } from "./bezier";
import { Point, Style, Color, Scalar } from "./vectors";
import { Canvas } from "./canvas";
import { Graphics } from "pixi.js";
import { BezTool, BSplineTool } from "./tools";
import { randomBytes } from "crypto";
import { Acceptor } from "./toolInterfaces";
import { save, load, download, asyncLoad, asyncSave, TreeProgressBar, AsyncTreeProcess, BiMap, Saveable } from "./save";
import { State } from "./state";
import { Graphic } from "./drawable";
import { PerspCam } from "./camera";
import { Angle } from "./angle";
import * as GPU from "gpu.js";
const gpu = new GPU.GPU();


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

var saveDirectory = "./saves/";


var state: State = new State();


function color(r = 0, g = 0, b = 0): Style {
    return new Style({ "color": new Color(r, g, b, 1), "width": new Scalar(2) });
}






/*/hackey stuff now
var DistFunc = function(pos: number[]): number {
    return Math.sqrt(pos[0] ** 2 + pos[1] ** 2 + pos[2] ** 2) - 1;
}


var rayMarchingKernalMake = gpu.createKernel(function(a: number[][]) {
    if (this.thread.z >= 3) {
        const x = (a[1][0] + a[2][0] * this.thread.x + a[3][0] * this.thread.y);
        const y = (a[1][1] + a[2][1] * this.thread.x + a[3][1] * this.thread.y);
        const z = (a[1][2] + a[2][2] * this.thread.x + a[3][2] * this.thread.y);
        const mag = Math.sqrt(x * x + y * y + z * z);
        switch (this.thread.z) {
            case 3:
                return x / mag;
            case 4:
                return y / mag;
            case 5:
                return z / mag;
        }
    } else {
        switch (this.thread.z) {
            case 0:
                return a[0][0];
            case 1:
                return a[0][1];
            case 2:
                return a[0][2];
        }
    }
}).setOutput([512, 512, 6]);

var rayMarchingKernal = gpu.createKernel(function(a: number[][][], steps: number) {
    for (var r = 0; r < steps; r++) {
        const dist = DistFunc(a[this.thread.x][this.thread.y]);
        for (var i = 0; i < 3; i++) {
            a[this.thread.x][this.thread.y][i] += a[this.thread.x][this.thread.y][i + 3] * dist;
        }
    }
    return a[this.thread.x][this.thread.y][this.thread.z];
}).setOutput([512, 512, 6]).setFunctions([DistFunc]);

var rayMarchingKernalRender = gpu.createKernel(function(a: number[][][]) {
    const dist = DistFunc(a[this.thread.x][this.thread.y]);
    this.color(255 / dist, 255 / dist, 255 / dist, 1);
}).setOutput([512, 512]).setGraphical(true);




*///hackey stuff end


document.body.appendChild(app.view);
class Id<A> implements Transform<A, A> {
    apply(a: A): A {
        return a;
    }
    transform_linear = true;
    transform_invertible = true;
    inverse(): Transform<A, A> {
        return this;
    }
    unapply(b: A): A {
        return b;
    }
    _saveName?: string;
}
var id = new Id<Point>();

@Saveable.register
class inversePerspTrns implements Transform<Point, Point>{
    transform_linear = false;// affine
    transform_invertible = true;
    inverse(): Transform<Point, Point> {
        throw new Error("no");
    }
    unapply(a: Point): Point {
        return this.t.apply(a).addEqDiscardOther(new Point(0, 0, -this.z)).scaleEq(1 / this.s);
    }
    _saveName?: string;
    constructor(public t: Transform<Point, Point>, public z = 1, public s = 1 / 512, public defW = 16 / 512) { }
    apply(a: Point): Point {
        const aa = a.copy();
        aa.addEqDiscardOther(new Point(-window.innerWidth / 2, -window.innerHeight / 2));
        aa.y *= -1;
        const r = this.t.unapply(aa.scale(this.s).addEqDiscardOther(new Point(0, 0, this.z)));
        if (r.s.vars.width == null) {
            r.s.vars.width = new Scalar(this.defW);
        }
        return r;
    }

}



var view = new PIXI.Container();


//view.scale.set(state.viewPortScale, -state.viewPortScale);

app.stage.addChild(view);
const g = new PIXI.Graphics();
g.moveTo(0, 0);
g.beginFill(0);
g.lineTo(0, 1000);
g.lineTo(1000, 1000);
g.lineTo(1000, 0);
g.endFill();
g.alpha = 0;
const txt = renderer.generateTexture(g);

const br = new BSplineTool(new Brusher(state.canvas, new DebugPen(color(1, 1, 0)), 128), 3, txt, new inversePerspTrns(state.viewCam.val));







app.stage.addChild(br);
app.stage.addChild(view);

window.onresize = function(_event: UIEvent): void {
    app.renderer.resize(window.innerWidth, window.innerHeight);
    view.x = window.innerWidth / 2;
    view.y = window.innerHeight / 2;


};



state.attach(document);


function renderView() {

    /* const o = state.viewCam.val.position;
     const forward = state.viewCam.val.rotation.apply(new Point(0, 0, 1));
     const up = state.viewCam.val.rotation.apply(new Point(0, 1, 0)).scaleEq(1 / 256);
     const sideways = state.viewCam.val.rotation.apply(new Point(1, 0, 0)).scaleEq(1 / 256);
     forward.addEq(up.scale(256));
     forward.addEq(sideways.scale(256));
 
 
     const rays = rayMarchingKernal(rayMarchingKernalMake([[o.getX(), o.getY(), o.getZ()], [forward.getX(), forward.getY(), forward.getZ()], [up.getX(), up.getY(), up.getZ()], [sideways.getX(), sideways.getY(), sideways.getZ()]]), 10);
 
     rayMarchingKernalRender(rays);
 
 
     const marchCvs = rayMarchingKernalRender.canvas;
     app.stage.addChild(marchCvs);
     */
    //const i = app.stage.getChildIndex(view);
    //app.stage.removeChildAt(i);
    //view = state.renderView(window);

    //3d support:
    view.removeChildren();
    const s = state.renderView(window);
    view.addChild(s);
    //s.filters = [new PIXI.filters.BlurFilter()];
    //state.rerenderView(view);
    view.x = window.innerWidth / 2;
    view.y = window.innerHeight / 2;


    //app.stage.addChildAt(view, i);
    barGraphics.scale.set(window.innerWidth, window.innerHeight);
}




const fpsMeter = new PIXI.Text("FPS:__");

fpsMeter.y = 20;
fpsMeter.x = 20;


app.stage.addChild(fpsMeter);



var time = 0;
var fps = 0;
var fpsa = 0.1;


var loading = false;

var bar: TreeProgressBar = null;
const barGraphics = new PIXI.Graphics();
app.stage.addChild(barGraphics);

function setState(s: State) {
    state.detach();
    state = s;
    state.attach(document);

    br.inputTransform = state.viewCam.val;
    (br.target as Brusher).dest = state.canvas;
}



import * as fs from 'fs';
try {

    var data = fs.readFileSync(saveDirectory + 'input.json', "utf8");
    const cb = function(d: any) {
        setState((d as AsyncTreeProcess<any>).result as State);
    }
    asyncLoad(data, cb);
} catch (e) {
    console.log("file not loaded");
    console.log(e);
}



function physLoop(delta: number): void {
    if (loading) {
        barGraphics.clear();
        const p = bar.getProgress();
        barGraphics.lineStyle(1 / 32, 0x010000 * Math.floor((1 - p) * 0xff) + 0x000100 * Math.floor(p * 0xff), 1, 0.5);
        barGraphics.moveTo(0, 0);
        barGraphics.lineTo(p, 0);
        barGraphics.lineStyle(1 / 64, 0x880000, 1, 0.5);
        for (var i = 0; i < bar.denominators.length; i++) {
            barGraphics.moveTo(0, (i + 1) / 32);
            barGraphics.lineTo(bar.numerators[i] / bar.denominators[i], (i + 1) / 32);
        }

    } else {
        renderView();
        time += delta;
        fps = fps * (1 - fpsa) + (60 / delta) * fpsa;
        fpsMeter.text = "FPS:" + fps;
        state.physLoop(delta / 60);
    }
}
app.ticker.add(physLoop);




document.addEventListener("keydown", (ke: KeyboardEvent) => {

    console.log(ke);
    if (ke.code == "Escape") {
        state.freecam = !state.freecam;
    }
});




//save
document.addEventListener("keydown", (ke: KeyboardEvent) => {
    if (ke.code == "KeyS" && ke.metaKey) { //command-s
        const cb = function(o: AsyncTreeProcess<string>) {
            download(saveDirectory + state._saveName, o.result);
            loading = false;
            bar = null;
            barGraphics.clear();
        }
        loading = true;
        const pros = asyncSave(state, new BiMap<string, any>(), cb);
        //pop up a loading screen/dialogue with a progress bar and cancel button etc.
        //todo
        bar = pros.progress;
        console.log(pros);

    }
});
