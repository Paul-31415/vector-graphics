import * as PIXI from "pixi.js";
import { Pen, SmartPen, Brusher, BrushedCurve, Dots } from "./brush";
import { PtTransform } from "./transform";
import { Bezier, WeightedVector, BSpline, WeightedAverageCurve, Spline } from "./bezier";
import { Point, Style, Color, Scalar } from "./vectors";
import { Canvas } from "./canvas";
import { Graphics } from "pixi.js";
import { BezTool, BSplineTool } from "./tools";
import { randomBytes } from "crypto";
import { Acceptor } from "./toolInterfaces";
import { save, load } from "./save";


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
const style2 = new Style({
    color: new Color(0, 1, 0),
    width: new Scalar(.5)
})

const style2_5 = new Style({
    color: new Color(0, .5, 0),
    width: new Scalar(.5)
})



const polyS = [style2, style2_5];
for (var i = 0; i < 30; i += 1) {
    polyS[i] = new Style({
        color: new Color(.7 - Math.sin(i) / 4, .7 + Math.sin(i) / 4, .7 + Math.cos(i / 1.1) / 4),
        width: new Scalar(.5)
    })


}
Color.Gamma = 0.3;
const style3 = new Style({
    color: new Color(0, 1, 1),
    width: new Scalar(1)
})
const style3_5 = new Style({
    color: new Color(0, 1, 1),
    width: new Scalar(.5)
})
const style4 = new Style({
    color: new Color(1, 0, 0),
    width: new Scalar(1)
})
const style5 = new Style({
    color: new Color(1, 0, 1),
    width: new Scalar(1)
})

const refstyle = new Style({
    color: new Color(1, 1, 1),
    width: new Scalar(1)
})

var p = new Array<Point>();
for (var i = 0; i < 8; i++) {
    p[i] = new Point(200 + 160 * Math.sin(i / 2), 20 + 20 * i);
}


const testSpline = new BrushedCurve(new BSpline<Point>(p, 2, null), new Pen(defaultStyle), 128);

const testSpline2 = new BrushedCurve(new BSpline<Point>([
    new Point(100, 100),
    new Point(200, 100, 0, 1, new Style({ width: new Scalar(4) })),
    new WeightedVector<Point>(new Point(200, 200), .5),
    new Point(100, 200),
], 2, [0, 0, 0, 2, 4, 4, 4]), new Pen(defaultStyle), 128);

const testSpline4 = new BrushedCurve(new BSpline<Point>([
    new Point(300, 300), new Point(300, 300),
    new Point(400, 400),
    new Point(300, 400), new Point(300, 400),
], 2, null), new Pen(defaultStyle), 5);

class AnimBSpline implements Acceptor<BrushedCurve>{
    s: BSpline<BSpline<Point>>;
    constructor(d: number) {
        this.s = new BSpline<BSpline<Point>>([], d, []);
    }

    accept(o: BrushedCurve): boolean {
        this.s.append(o.c as BSpline<Point>, null, true);
        return true;
    } update(o: BrushedCurve): boolean {

        return true;
    }
    complete(o: BrushedCurve): boolean {

        return true;
    }

    get(t: number): BSpline<Point> {
        if (this.s.controlPoints.length > 0) {
            return this.s.get(t);
        } else {
            return testSpline2.c as BSpline<Point>;
        }
    }


}




var anim = new AnimBSpline(2);
const o = 2;

/*
var b = new Brusher(anim, new Pen(defaultStyle), 128);
for (var n = 0; n < 20; n++) {
    const bs = new BSpline<Point>([], o, []);
    for (var i = 0; i < 20; i++) {
        bs.append(new Point(10 + i * 40, 10, 0, 1, new Style({ width: new Scalar((n == i) ? 10 : .5) })), null);
    }
    b.accept(bs);
    b.complete(bs);
}//*/





var tool = new BSplineTool(new Brusher(anim, new Pen(defaultStyle), 128), o, renderer.generateTexture(tg));

tool.spacing = 0;

app.stage.addChild(tool);



const testSpline3 = new BrushedCurve((testSpline2.c as BSpline<Point>).add(testSpline2.c as BSpline<Point>), new Pen(style4), 5);
//*
const s1 = (testSpline2.c as BSpline<Point>).copy();
s1.makeShareKnot((testSpline.c as BSpline<Point>).copy());
const testSpline5 = new BrushedCurve(s1, new Pen(style3), 5);
// */

const refSpline = new BrushedCurve(new WeightedAverageCurve(testSpline.c, testSpline2.c), new Pen(refstyle), 5)

const testSpline6 = new BrushedCurve((testSpline2.c as BSpline<Point>).add((testSpline.c as BSpline<Point>).scale(0)), new Pen(style5), 5);



const spl = new Spline<Point>([
    new Point(10, 10),
    new Point(210, 10),
    new Point(210, 210),
    new Point(10, 210),
    new Point(10, 410),
    new Point(210, 410),
    new Point(310, 410),
    new Point(410, 410),
    new Point(410, 310),
    new Point(310, 310),
    new Point(310, 210),
    new Point(410, 210),
    new Point(410, 110),
    new Point(310, 110),
    new Point(310, 10),
    new Point(410, 10),
]);
const s = save;
const l = load;



const ptr = new PIXI.Text();


const splp = new BrushedCurve(spl, new Dots(style3), 256);
const splp2 = new BrushedCurve(spl, new Pen(style3_5), 256);

cvs.add(splp);
cvs.add(splp2);

cvs.add(testSpline);
cvs.add(testSpline2);
//cvs.add(testSpline4);

cvs.add(testSpline5);
//cvs.add(testSpline6);

cvs.add(testSpline3);

cvs.add(refSpline);

//s(cvs);
debugger;

var tb = new Bezier<BSpline<Point>>([(testSpline.c as BSpline<Point>), (testSpline2.c as BSpline<Point>)]);

var ds = [/*testSpline, testSpline2, */testSpline3, testSpline5];

var pen = new Pen(style2);



var ptrt = 0.5;
var pointer: PIXI.Graphics = new PIXI.Graphics();
pointer.lineStyle(1, 0xffffff);
ptr.style.fill = 0xffffff;
pointer.drawCircle(0, 0, 4);
ptr.x += 10;
pointer.addChild(ptr);

app.stage.addChild(pointer);

var ki = 0;


var splA = spl.copy();

var time = 0;
testSpline3.c = (testSpline.c as BSpline<Point>).scale(0).add(testSpline2.c as BSpline<Point>);//tb.get(1);
function gameLoop(delta: number): void {
    g.clear();
    for (var dsi = 0; dsi < ds.length; dsi++) {
        for (var i = 1; i < (ds[dsi].c as BSpline<Point>).controlPoints.length; i++) {
            pen.s = polyS[i % polyS.length];
            pen.line(g, id, (ds[dsi].c as BSpline<Point>).controlPoints[i - 1].get(), (ds[dsi].c as BSpline<Point>).controlPoints[i].get());
        }
        //ds[dsi].res += 1;
    }
    cvs.drawOn(g, id);
    //refSpline.res += 1;
    time += delta / 480;
    //splp.res += 1;

    for (ki = 0; ki < splA.knots.length; ki++) {
        for (var i = splA.knots[ki].cpsl + 1; i < splA.knots[ki].cpsh; i++) {
            pen.s = polyS[i % polyS.length];
            pen.line(g, id, splA.controlPoints[i - 1].get(), splA.controlPoints[i].get());
            g.drawCircle(splA.controlPoints[i].get().x, splA.controlPoints[i].get().y, i - splA.knots[ki].cpsl);
        }
    }


    s;
    l;
    debugger;


    const ptrr = splA.get(ptrt);
    pointer.x = ptrr.x;
    pointer.y = ptrr.y;
    ptr.text = ptrt + "";
    testSpline3.c = anim.get(time % 1);//tb.get((refSpline.c as WeightedAverageCurve<Point>).a);
}

app.ticker.add(gameLoop);


document.addEventListener("keydown", (ke: KeyboardEvent) => {
    if (ke.code == "KeyW") {
        //tool.degree += 1;
        debugger;
        (refSpline.c as WeightedAverageCurve<Point>).a += 0.01;
        ptrt += 0.01;
    }
});
document.addEventListener("keydown", (ke: KeyboardEvent) => {
    if (ke.code == "KeyS") {
        //tool.degree = Math.max(1, tool.degree - 1);
        debugger;
        (refSpline.c as WeightedAverageCurve<Point>).a -= 0.01;
        ptrt -= 0.01;
    }
});

document.addEventListener("keydown", (ke: KeyboardEvent) => {
    if (ke.code == "KeyP") {
        ki = (ki + 1) % (splA.knots.length - 1);
    }
});

var splc = 1;

document.addEventListener("keydown", (ke: KeyboardEvent) => {
    if (ke.code == "KeyU") {
        debugger;
        splc += 1;
        splA = spl.copy().insertKnot(ptrt, splc);
        splp.c = splA;
    }
});

document.addEventListener("keydown", (ke: KeyboardEvent) => {
    if (ke.code == "KeyJ") {
        splc -= 1;
        splA = spl.copy().insertKnot(ptrt, splc);
        splp.c = splA;
    }
});
document.addEventListener("keydown", (ke: KeyboardEvent) => {
    if (ke.code == "KeyI") {
        splA = spl.copy().insertKnot(ptrt, splc);
        splp.c = splA;
    }
});
document.addEventListener("keydown", (ke: KeyboardEvent) => {
    if (ke.code == "KeyK") {
        splA = splA.insertKnot(ptrt, splc);
        splp.c = splA;
    }
});

document.addEventListener("keydown", (ke: KeyboardEvent) => {
    if (ke.code == "KeyO") {
        splA = splA.modifyKnot(splA.getKnotIndex(ptrt), splA.getKnotAtT(ptrt).continuity - 1);
        splp.c = splA;
    }
});







document.addEventListener("keydown", (ke: KeyboardEvent) => {
    if (ke.code == "KeyC") {
        const b = (testSpline2.c as BSpline<Point>);
        b.insertKnot(0);//Unnormed(b.knot.n[0] - 1);//(testSpline2.c as BSpline<Point>).insertKnot(Math.random());
    }
});

document.addEventListener("keydown", (ke: KeyboardEvent) => {
    if (ke.code == "KeyV") {
        const b = (testSpline2.c as BSpline<Point>);
        b.insertKnot(1);//Unnormed(b.knot.n[0] - 1);//(testSpline2.c as BSpline<Point>).insertKnot(Math.random());
    }
});


document.addEventListener("keydown", (ke: KeyboardEvent) => {
    if (ke.code == "KeyQ") {
        debugger;
        testSpline3.c = (testSpline.c as BSpline<Point>).scale(0).add(testSpline2.c as BSpline<Point>);//tb.get(1);
    }
});

document.addEventListener("keydown", (ke: KeyboardEvent) => {
    if (ke.code == "KeyA") {
        debugger;
        testSpline3.c = (testSpline2.c as BSpline<Point>).add((testSpline2.c as BSpline<Point>).scale(0));//tb.get(1);
    }
});

document.addEventListener("keydown", (ke: KeyboardEvent) => {
    if (ke.code == "KeyR") {
        debugger;
        const s1 = (testSpline.c as BSpline<Point>).copy();
        s1.makeShareKnot((testSpline2.c as BSpline<Point>).copy());
        testSpline5.c = s1;
    }
});

document.addEventListener("keydown", (ke: KeyboardEvent) => {
    if (ke.code == "KeyF") {
        debugger;
        const s1 = (testSpline.c as BSpline<Point>).copy();
        (testSpline2.c as BSpline<Point>).copy().makeShareKnot(s1);
        testSpline5.c = s1;
    }
});


