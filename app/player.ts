import { Quaternion, Point } from "./vector";
import THREE = require("three");

//import { Point, Quaternion } from "./vector";

/*
player camera:

2 modes: mono, stereo
can adjust camera attributes
useful attributes
  the display rectangle on the front clipping plane,
  the position of the ray-center

for 1st person
 adjust eye sep, overlap, front clipping plane, forwards offset
*/

//new Quaternion()



export class HackeyCamControl {
    document: Document;
    rotation: Quaternion;

    velPt = new Point();

    constructor(public cam: THREE.PerspectiveCamera, public vel = 4, public accel = 100, public drag = 50, public mouseSpeed = 0.01) {
        this.rotation = new Quaternion();
        this.boundkd = this.keyDownCallback.bind(this);
        this.boundku = this.keyUpCallback.bind(this);
        this.boundmm = this.mouseMoveCallback.bind(this);

        this.mouseRelative = true;
    }
    mouseRelative: boolean;

    controls: any = {
        "KeyW": { s: false, r: 1, v: new Point(0, 0, -1) },
        "KeyS": { s: false, r: 1, v: new Point(0, 0, 1) },
        "KeyA": { s: false, r: 1, v: new Point(-1, 0, 0) },
        "KeyD": { s: false, r: 1, v: new Point(1, 0, 0) },
        "Space": { s: false, r: 0, v: new Point(0, 1, 0) },
        "ShiftLeft": { s: false, r: 0, v: new Point(0, -1, 0) },
        "Digit1": { s: false, cnf: 1.01 },
        "Digit2": { s: false, cnf: 1 / 1.01 },
        "KeyE": { s: false, eye_sep: .01 },
        "KeyQ": { s: false, eye_sep: -.01 },
        "KeyR": { s: false, eye_overlap: .01 },
        "KeyF": { s: false, eye_overlap: -.01 },
        "KeyT": { s: false, eye_reset: true }
    };

    keyListener(ke: KeyboardEvent): void {
        /*if (ke.key == "[") {
            this.eyeSep -= 0.1;
        }
        if (ke.key == "]") {
            this.eyeSep += 0.1;
        }
        if (ke.key == "{") {
            this.eyeImageSep -= 0.1;
        }
        if (ke.key == "}") {
            this.eyeImageSep += 0.1;
        }
        if (ke.key == "\\") {
            this.eyeSep = 0;
        }
        */



    }
    physics(delta: number) {
        delta /= 60;
        const accelPt = new Point();

        for (var k in this.controls) {
            const c = this.controls[k];
            if (c.s) {
                if (c.r != null) {
                    switch (c.r) {
                        case 0://global coords
                            accelPt.addEq(c.v);
                            break;
                        case 1://local coords horizontally
                            const v = this.rotation.swingTwistDecomp(0, 1, 0)[1].apply(c.v);
                            accelPt.addDEq(v);
                            break;
                        case 2://full local coords
                            accelPt.addDEq(this.rotation.apply(c.v));
                            break;
                    }
                }
                if (c.cnf != null) {
                    this.cam.near *= c.cnf as number;
                    this.cam.updateProjectionMatrix();
                }
                if (c.eye_sep != null) {
                    this.cam.userData.eye_sep += c.eye_sep as number;
                }
                if (c.eye_overlap != null) {
                    this.cam.userData.eye_overlap += c.eye_overlap as number;
                }
                if (c.eye_reset != null) {
                    this.cam.userData.eye_overlap = 0;
                    this.cam.userData.eye_sep = 0;
                }
            }
        }

        const v = this.velPt;
        //drag
        const m = v.norm();

        if (m < this.drag * delta) {
            v.scaleEq(0);
        } else {
            v.scaleEq(1 - this.drag * delta / m);
        }
        //accel
        v.addDEq(accelPt.scaleEq(delta * this.accel));
        const vHorizMag2 = (v.x * v.x + v.z * v.z) / (v.w * v.w);
        if (vHorizMag2 > this.vel * this.vel) {
            const vHorizN = Math.sqrt(vHorizMag2) / this.vel;
            v.x /= vHorizN;
            v.z /= vHorizN;
        }
        if (Math.abs(v.y / v.w) > this.vel) {
            v.y = this.vel * v.w * Math.sign(v.y / v.w);
        }

        //apply vel
        const position = new Point(this.cam.position.x, this.cam.position.y, this.cam.position.z)


        position.addDEq(v.scale(delta));
        const s = 1.25;
        const stairSlope = function(n: number): number {
            n /= Math.PI;
            n += .5;
            const ipart = Math.floor(n / s);
            n = Math.min(ipart + 1, n - ipart * (s - 1));
            return (n - .5) * Math.PI;
        }
        const pegToStairSlope = function(n: number): number {
            n /= Math.PI;
            n += .5;
            const ipart = Math.floor(n / s);
            if (ipart + 1 < n - ipart * (s - 1)) {
                if ((n - (1 + ipart * s)) < ((s + ipart * s) - n)) {
                    n = 1 + ipart * s;
                } else {
                    n = s + ipart * s;
                }
            }
            return (n - .5) * Math.PI;
        }


        const peg = function(n: number): number {
            return Math.max(Math.min(Math.PI / 2, n), -Math.PI / 2);
        }
        this.angleY = peg(this.angleY);

        const ry = new Quaternion(-stairSlope(this.angleY), 0, 0);
        const rx = new Quaternion(0, -this.angleX, 0);
        this.rotation = rx.multiply(ry);


        this.cam.position.x = position.x;
        this.cam.position.y = position.y;
        this.cam.position.z = position.z;

        this.cam.rotation.setFromQuaternion(new THREE.Quaternion(...this.rotation.xyzw));

        this.cam.userData.eye_vector = this.rotation.apply(new Point(1, 0, 0));

    }

    keyDownCallback(ke: KeyboardEvent): void {
        if (this.controls[ke.code] != null && !ke.metaKey) {
            this.controls[ke.code].s = true;
        }
    }
    keyUpCallback(ke: KeyboardEvent): void {
        if (this.controls[ke.code] != null) {
            this.controls[ke.code].s = false;
        }
    }
    mouseMoveCallback(me: MouseEvent): void {
        if (this.mouseRelative) {
            this.angleX += this.mouseSpeed * me.movementX;
            this.angleY += this.mouseSpeed * me.movementY;
        } else {
            this.angleX = this.mouseSpeed * me.movementX;
            this.angleY = this.mouseSpeed * me.movementY;
        }
    }

    boundkd: (ke: KeyboardEvent) => void;
    boundku: (ke: KeyboardEvent) => void;

    boundmm: (me: MouseEvent) => void;
    angleX = 0;
    angleY = 0;

    cattach(d: Document) {
        const canvas = d.getElementById("pixi");
        canvas.requestPointerLock();
        d.addEventListener("keydown", this.boundkd);
        d.addEventListener("keyup", this.boundku);
        d.addEventListener("mousemove", this.boundmm);

    }
    cdetach(d: Document) {
        d.exitPointerLock();
        d.removeEventListener("keydown", this.boundkd);
        d.removeEventListener("keyup", this.boundku);
        d.removeEventListener("mousemove", this.boundmm);
    }


    boundKeyListener: (ke: KeyboardEvent) => void;


    attach(document: Document) {
        this.document = document;
        this.boundKeyListener = this.keyListener.bind(this);
        this.cattach(document);
        document.addEventListener("keydown", this.boundKeyListener);

    }
    detach(): Document {
        this.document.removeEventListener("keydown", this.boundKeyListener);
        this.cdetach(this.document);
        const tmp = this.document;
        this.document = null;
        return tmp;
    }
}





