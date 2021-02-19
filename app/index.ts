import * as PIXI from "pixi.js";
import * as THREE from "three";
import { Point, Quaternion } from "./vector";
import { Bezier, NUBS, Curve } from "./curve";
import { HackeyCamControl } from "./player";



//from getting started in the docs
var fov = 75;
let three_scene = new THREE.Scene();
let three_camera = new THREE.PerspectiveCamera(fov, window.innerWidth / window.innerHeight, 0.1, 1000);
let three_renderer = new THREE.WebGLRenderer({ alpha: false });
three_renderer.setSize(window.innerWidth, window.innerHeight);
three_renderer.setPixelRatio(window.devicePixelRatio ? window.devicePixelRatio : 1);

three_camera.userData.eye_sep = 1;
three_camera.userData.eye_overlap = .2;
three_camera.userData.eye_vector = new Point(1, 0, 0);

//cube from docs
var geometry = new THREE.BoxGeometry(1, 1, 1);
var material = new THREE.MeshStandardMaterial({ color: 0x00ff00 });
var cube = new THREE.Mesh(geometry, material);




three_camera.position.z = 5;


//spline experiment
for (var line = 0; line < 20; line += 1) {
    var c: Curve<Point> = new Bezier<Point>([new Point(Math.random() * 5, Math.random() * 5, Math.random() * 5),
    new Point(Math.random() * 5, Math.random() * 5, Math.random() * 5),
    new Point(Math.random() * 5, Math.random() * 5, Math.random() * 5),
    new Point(Math.random() * 5, Math.random() * 5, Math.random() * 5),
    new Point(Math.random() * 5, Math.random() * 5, Math.random() * 5),
    new Point(Math.random() * 5, Math.random() * 5, Math.random() * 5),
    new Point(Math.random() * 5, Math.random() * 5, Math.random() * 5),
    new Point(Math.random() * 5, Math.random() * 5, Math.random() * 5),
    new Point(Math.random() * 5, Math.random() * 5, Math.random() * 5),
    new Point(Math.random() * 5, Math.random() * 5, Math.random() * 5),
    new Point(Math.random() * 5, Math.random() * 5, Math.random() * 5),
    new Point(Math.random() * 5, Math.random() * 5, Math.random() * 5)
    ])


    var points: THREE.Vector3[] = [];
    let n = 100;
    for (var i = 0; i < n; i += 1) {
        points.push(new THREE.Vector3(...c.get(i / n).xyz));
    }
    var g = new THREE.BufferGeometry().setFromPoints(points);

    var clr = Math.floor(Math.random() * 0xffffff);
    var m = new THREE.LineBasicMaterial({ color: clr });

    // Create the final object to add to the scene
    var splineObject = new THREE.Line(g, m);
    three_scene.add(splineObject);
}
//Splurface experiment
var cps: Bezier<Point>[] = [new Bezier<Point>([new Point(9, -9, 9), new Point(9, -9, -9)])];
for (let i = 1; i <= 9; i++) {
    let c: Point[] = [];
    for (let j = -1; j < i; j += 1) {
        c.push(new Point(9 - (i * 2), -9 + Math.random() * 9, (j + 1) / i * -18 + 9));
    }
    cps[i] = new Bezier<Point>(c);
}
var cc: Bezier<Bezier<Point>> = new Bezier<Bezier<Point>>(cps);


var rverts: Point[][] = [];
var detail = 100
for (let x = 0; x < 1; x += 1 / detail) {
    rverts.push([]);
    let lc = cc.get(x);
    for (let y = 0; y < 1; y += 1 / detail) {
        rverts[rverts.length - 1].push(lc.get(y));
    }
}
let verts: number[] = [];
for (let i = 0; i < rverts.length - 1; i++) {
    for (let j = 0; j < rverts[i].length - 1; j++) {
        verts.push(...rverts[i][j].xyz);
        verts.push(...rverts[i + 1][j].xyz);
        verts.push(...rverts[i][j + 1].xyz);

        verts.push(...rverts[i][j + 1].xyz);
        verts.push(...rverts[i + 1][j].xyz);
        verts.push(...rverts[i + 1][j + 1].xyz);
    }
}

let n = 20;
for (let i = 0; i < cc.points.length; i++) {

    var points: THREE.Vector3[] = [];
    for (let j = 0; j < cc.points[i].points.length; j++) {
        points.push(new THREE.Vector3(...cc.points[i].points[j].xyz));
    }
    var g = new THREE.BufferGeometry().setFromPoints(points);
    var m = new THREE.LineBasicMaterial({ color: 0xff0000 });
    var splineObject = new THREE.Line(g, m);
    three_scene.add(splineObject);


    var cpoints: THREE.Vector3[] = [];

    for (let j = 0; j < 1; j += 1 / n) {
        cpoints.push(new THREE.Vector3(...cc.points[i].get(j).xyz));
    }
    var cg = new THREE.BufferGeometry().setFromPoints(cpoints);
    var cm = new THREE.LineBasicMaterial({ color: 0xff8000 });
    var csplineObject = new THREE.Line(cg, cm);
    three_scene.add(csplineObject);


    var cdpoints: THREE.Vector3[] = [];
    var cd = cc.get(i / (cc.points.length - 1));
    for (let j = 0; j < cd.points.length; j += 1) {
        cdpoints.push(new THREE.Vector3(...cd.points[j].xyz));
    }
    var cdg = new THREE.BufferGeometry().setFromPoints(cdpoints);
    var cdm = new THREE.LineBasicMaterial({ color: 0x00ff00 });
    var cdsplineObject = new THREE.Line(cdg, cdm);
    three_scene.add(cdsplineObject);

}
for (let i = 0; i < 1; i += 1 / n) {
    var cpoints: THREE.Vector3[] = [];
    for (let j = 0; j < 1; j += 1 / n) {
        cpoints.push(new THREE.Vector3(...cc.get(i).get(j).xyz));
    }
    var cg = new THREE.BufferGeometry().setFromPoints(cpoints);
    var cm = new THREE.LineBasicMaterial({ color: 0xff00ff });
    var csplineObject = new THREE.Line(cg, cm);
    three_scene.add(csplineObject);
}


var g = new THREE.BufferGeometry();
g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(verts), 3));
g.computeVertexNormals();
let surface = new THREE.Mesh(g, new THREE.MeshStandardMaterial({ color: 0x008ccc, side: THREE.DoubleSide }));
surface.castShadow = true;
surface.receiveShadow = true;
cube.castShadow = true;
cube.receiveShadow = true;




const l = new THREE.SpotLight(0xffffff, .5);
l.position.x = 2;
l.position.z = 1;
l.position.y = 9;

three_scene.add(new THREE.AmbientLight(0x404040));
l.castShadow = true;
l.intensity = 1;

l.shadowMapWidth = 512;
l.shadowMapHeight = 512;

three_scene.add(cube);
three_scene.add(surface);
var d = 200;

l.shadowCameraLeft = -d;
l.shadowCameraRight = d;
l.shadowCameraTop = d;
l.shadowCameraBottom = -d;
l.shadowCameraFar = 1000;

three_scene.add(l);







let pixi_renderer = PIXI.autoDetectRenderer({ transparent: true });

const app: PIXI.Application = new PIXI.Application(
    {
        width: window.innerWidth,
        height: window.innerHeight,
        backgroundColor: 0x000000,
        transparent: true,
        resolution: window.devicePixelRatio || 1,
        autoResize: true
    }
);

var saveDirectory = "./saves/";

three_renderer.domElement.id = "three";
app.view.id = "pixi";
document.body.appendChild(three_renderer.domElement);
document.body.appendChild(app.view);


//app.stage.addChild(view);

window.onresize = function(_event: UIEvent): void {
    app.renderer.resize(window.innerWidth, window.innerHeight);
    three_renderer.setSize(window.innerWidth, window.innerHeight);
    three_camera.aspect = window.innerWidth / window.innerHeight;
    three_camera.fov = (three_camera.aspect > 1) ? fov / three_camera.aspect : fov;
    three_camera.updateProjectionMatrix();
};



const ctlr = new HackeyCamControl(three_camera);
ctlr.attach(document);
const fpsMeter = new PIXI.Text("FPS:__");

fpsMeter.y = 20;
fpsMeter.x = 20;

app.stage.addChild(fpsMeter);

var oldTime = 0;
var fps = 0;
var fpsa = 0.01;
var spf = 0;
var spfa = .01;
function physLoop(delta: number): void {
    //time += delta;
    ctlr.physics(delta);
    //fps = fps * (1 - fpsa) + (60 / delta) * fpsa;
    //fpsMeter.text = "FPS:" + fps;
}




app.ticker.add(physLoop);


function animate(time: number) {
    requestAnimationFrame(animate);
    spf = spf * (1 - spfa) + spfa * (time - oldTime) / 1000;
    fpsMeter.text = "time:" + (time / 1000).toFixed(6) + "\nfps:" + (1000 / (time - oldTime)).toFixed(2) + "\navgFps:" + (1 / spf).toFixed(2);

    if (three_camera.userData.eye_sep == 0 && three_camera.userData.eye_overlap == 0) {
        three_renderer.render(three_scene, three_camera);
    } else {
        perspRender();
    }
    oldTime = time;
}
animate(0);

function perspRender() {
    let oldp = [three_camera.position.x, three_camera.position.y, three_camera.position.z];

    let h = window.innerHeight;
    let w = window.innerWidth / 2;
    let tw = w * (2 - three_camera.userData.eye_overlap);

    three_camera.position.x += three_camera.userData.eye_vector.x * three_camera.userData.eye_sep / 2;
    three_camera.position.y += three_camera.userData.eye_vector.y * three_camera.userData.eye_sep / 2;
    three_camera.position.z += three_camera.userData.eye_vector.z * three_camera.userData.eye_sep / 2;

    three_camera.setViewOffset(tw, h, 0, 0, w, h);
    three_camera.updateProjectionMatrix();

    three_renderer.setViewport(0, 0, w, h);
    three_renderer.setScissor(0, 0, w, h);
    three_renderer.enableScissorTest(true);

    three_renderer.render(three_scene, three_camera);

    three_camera.position.x -= three_camera.userData.eye_vector.x * three_camera.userData.eye_sep;
    three_camera.position.y -= three_camera.userData.eye_vector.y * three_camera.userData.eye_sep;
    three_camera.position.z -= three_camera.userData.eye_vector.z * three_camera.userData.eye_sep;

    three_camera.setViewOffset(tw, h, tw - w, 0, w, h);
    three_camera.updateProjectionMatrix();

    three_renderer.setViewport(w, 0, w, h);
    three_renderer.setScissor(w, 0, w, h);
    three_renderer.enableScissorTest(true);

    three_renderer.render(three_scene, three_camera);


    three_camera.position.x = oldp[0];
    three_camera.position.y = oldp[1];
    three_camera.position.z = oldp[2];
    three_camera.setViewOffset(w * 2, h, 0, 0, w * 2, h);
    three_renderer.setViewport(0, 0, w * 2, h);
    three_renderer.setScissor(0, 0, w * 2, h);
    three_camera.updateProjectionMatrix();
    three_renderer.enableScissorTest(false);
}

