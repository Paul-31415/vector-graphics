import * as PIXI from "pixi.js";
import * as THREE from "three";

let three_scene = new THREE.Scene();
let three_camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
let three_renderer = new THREE.WebGLRenderer();
three_renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(three_renderer.domElement);





let pixi_renderer = PIXI.autoDetectRenderer();

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


//document.body.appendChild(app.view);



//app.stage.addChild(view);

window.onresize = function(_event: UIEvent): void {
    //app.renderer.resize(window.innerWidth, window.innerHeight);



};

//app.stage.addChild(fpsMeter);

//app.ticker.add(physLoop);
