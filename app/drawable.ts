import * as PIXI from "pixi.js";
import { Point, Style, Color } from "./vectors";
import { Transform } from "./transform";
import { Saveable } from "./save";



interface Drawable extends Saveable {
    draw(t: Transform<Point, Point> | null): Graphic;
    drawOn(g: PIXI.Graphics, t: Transform<Point, Point> | null): PIXI.Graphics;
}

class SmartGraphics extends PIXI.Graphics {
    visualError: number;
    corners3d: Point[];
    constructor(public drawer: Drawable,
        public posMin3d: Point,
        public posMax3d: Point,
        public transform3d: Transform<Point, Point>,
        g: any = null) {
        super(g);
        this.visualError = 0;

        this.corners3d = new Array<Point>();
        for (var x = 0; x < 2; x++) {
            for (var y = 0; y < 2; y++) {
                for (var z = 0; z < 2; z++) {
                    this.corners3d[x * 4 + y * 2 + z] = transform3d.apply(new Point(posMin3d.getX() + x * posMax3d.getX(),
                        posMin3d.getY() + y * posMax3d.getY(),
                        posMin3d.getZ() + z * posMax3d.getZ()));
                }
            }
        }
    }
    updateVisualErrorEstimate(): number {
        var e = 0;
        for (var x = 0; x < 2; x++) {
            for (var y = 0; y < 2; y++) {
                for (var z = 0; z < 2; z++) {
                    e += this.corners3d[x * 4 + y * 2 + z].add(this.transform3d.apply(new Point(this.posMin3d.getX() + x * this.posMax3d.getX(),
                        this.posMin3d.getY() + y * this.posMax3d.getY(),
                        this.posMin3d.getZ() + z * this.posMax3d.getZ()).scaleEq(-1))).euclidNorm2();
                }
            }
        }
        this.visualError = e;
        return e;
    }







}



interface CachedDrawable extends Drawable {
    cacheDirty: boolean;
    //make sure this is saveignored:
    cachedGraphics: Set<Graphic>;//weakset doesn't let me iterate over the objects

    dirtyCache(): void;
}




















//@Saveable.register
class Graphic /* implements Saveable {
									_saveName?: string;*/ {
    old: boolean;
    constructor(public drawer: Drawable, public g: PIXI.Graphics) {
        this.old = false;
    }
    release(): void { //I couldn't install weak refs so manual gc it is (ugh.)
        //releases a cached graphic from being attached to it's creator
        if ((this.drawer as CachedDrawable).cachedGraphics != null) {
            if ((this.drawer as CachedDrawable).cachedGraphics.delete != null) {
                (this.drawer as CachedDrawable).cachedGraphics.delete(this);
            }
        }
    }
}


function visibleLineSegment(a: Point, b: Point, minZ = 0.00001): Point[] {
    //returns a line segment with both components having strictly positive z
    if (a.getZ() < minZ) {
        if (b.getZ() < minZ) {
            return [];
        } else {
            // Az*a+Bz*(1-a) = minZ
            // (Az-Bz)*a = minZ-Bz
            // alpha = minz
            const alpha = minZ - b.getZ() / (a.getZ() - b.getZ());
            return [a.scale(alpha).addEqDiscardOther(b.scale(1 - alpha)), b];
        }
    } else {
        if (b.getZ() < minZ) {
            const alpha = minZ - a.getZ() / (b.getZ() - a.getZ());
            return [a, b.scale(alpha).addEqDiscardOther(a.scale(1 - alpha))];
        } else {
            return [a, b];
        }
    }
}


const LARGE = 1e10;//must be less than single precision float max val (1e~30) (I think pixi's graphics uses floats)

function sendToL(n: number[], L = LARGE): number[] {
    if (n[0] * n[0] > 1e300 || n[1] * n[1] > 1e300) {
        n[0] *= 1e-100;
        n[1] *= 1e-100;
    }
    if (n[0] * n[0] > 1e300 || n[1] * n[1] > 1e300) {
        n[0] *= 1e-100;
        n[1] *= 1e-100;
    }//two rounds means if n[0] = 1e308 or so, we get 108, which can still be squared
    const f = L / Math.sqrt(n[0] * n[0] + n[1] * n[1]);
    n[0] *= f;
    n[1] *= f;
    return n;
}

function getPerspLine(p: Point, f: Point, L = LARGE): number[] {
    if (f.getZ() < 0) {
        return getPerspRay(p, L);
    } else {
        //f is assumed to be in front of the cam (z>0)
        if (p.getZ() < 0) {
            //the correct ray is through (p.getX(),p.getY()) and f's coord
            return sendToL([f.getX() - p.getX(), f.getY() - p.getY()], L);

        } else {
            return getPerspRay(p, L);
        }
    }
}





function getPerpendicularPersp(a: Point, b: Point, L = LARGE): number[] {
    const ac = getPerspLine(a, b, L);
    const bc = getPerspLine(b, a, L);
    return [ac[1] - bc[1], bc[0] - ac[0]];
}

function perspLine(g: PIXI.Graphics, a: Point, b: Point, s: Style = new Style({}), L = LARGE): PIXI.Graphics {
    const perp = getPerpendicularPersp(a, b, L);
    const m2 = (perp[0] * perp[0] + perp[1] * perp[1]);
    if (m2 == 0) {
        //same point
        return g
    }
    const m = Math.sqrt(m2);
    perp[0] /= m;
    perp[1] /= m;
    //line takes a's color/etc
    //but uses both's width
    const sa = a.s.defaults(s);
    const sb = b.s.defaults(s);

    var wa = .5;
    if (sa.vars.width != null) {
        wa = sa.vars.width.v / 2;
    }

    var wb = .5;
    if (sb.vars.width != null) {
        wb = sb.vars.width.v / 2;
    }

    var c = 0xffffff;
    var alph = 1;
    if (sa.vars.color != null) {
        c = sa.vars.color.getRGB();
        alph = sa.vars.color.getA();
    }


    const prpb = new Point(perp[0], perp[1]);
    const prpa = prpb.scale(wa / a.getZ());
    prpb.scaleEq(wb / b.getZ());
    const pts = [a.add(prpa), a.add(prpa.scale(-1)), b.add(prpb.scale(-1)), b.add(prpb)];
    drawNGon(g, ngon(pts, L), c, alph);
    return g;

}

function getPerspRay(p: Point, L = LARGE): number[] {//IMPORTANT: large must keep room for euclidean norm calculations
    const r = [p.getX(), p.getY()];
    if (r[0] * r[0] > 1e300 || r[1] * r[1] > 1e300) {//overflow checks
        r[0] /= 1e100;//at least one of the components is still over L
        r[1] /= 1e100;
    }// after this, r[0] * r[0] + r[1] * r[1] < 1e(~100)
    if (p.getZ() < 0) {
        //sticking the point all the way at "infinity" makes things parrallel which shouldn't be
        //so this routine isn't good for lines
        const n = -L / Math.sqrt(r[0] * r[0] + r[1] * r[1]);
        return [r[0] * n, r[1] * n];
    } else {
        if (r[0] * r[0] + r[1] * r[1] > L * L) {
            const n = L / Math.sqrt(r[0] * r[0] + r[1] * r[1]);
            return [r[0] * n, r[1] * n];
        } else {
            return [p.getX(), p.getY()];
        }
    }
}



function drawNGon(g: PIXI.Graphics, pts: number[][], fillColor = 0x000000, a = 1): void {
    if (pts.length == 0) {
        return;
    }
    g.moveTo(pts[0][0], pts[0][1]);
    g.beginFill(fillColor, a);
    for (var i = 1; i < pts.length; i++) {
        g.lineTo(pts[i][0], pts[i][1]);
    }
    g.endFill();
}

function ngon(pts: Point[], l = LARGE): number[][] {
    const r: number[][] = [];
    if (pts.length == 0) {
        return r;
    }
    //first find a point in the scene
    for (var i = 0; i < pts.length; i++) {
        if (pts[i].getZ() > 0) {
            break;
        }
    }
    if (i == pts.length) {
        return r;
    }
    var p = i;
    do {
        const prev = (p + pts.length - 1) % pts.length;
        const next = (p + 1) % pts.length;
        if (pts[prev].getZ() > 0) {
            r.push(getPerspLine(pts[p], pts[prev], l));
        } else {
            r.push(getPerspRay(pts[p], l));
        }
        if (pts[p].getZ() <= 0) {//for divergence
            if (pts[next].getZ() > 0) {
                r.push(getPerspLine(pts[p], pts[next], l));
            }
        }
        p = next;
    } while (p != i);
    return r;
}


function triangle(a: Point, b: Point, c: Point, l = LARGE): number[][] {
    //draws what the triangle should look like
    //it's still having issues with certain triangles
    if (a.getZ() < 0 && b.getZ() < 0 && c.getZ() < 0) {
        return [];
    } else {

        //check for triangle still not being visible
        //eg it intersects with the z=0 plane somewhere outside of the observer
        //i.e. one (behind) point's perspRay is on the other side from the (in front) points

        //sort args
        if (b.getZ() < 0) {
            const t = a; a = b; b = t;
            if (c.getZ() < 0) {
                const t2 = b; b = c; c = t2;
            }
        }
        if (c.getZ() < 0) {
            if (a.getZ() < 0) {
                const t = b; b = c; c = t;
            } else {
                const t = a; a = c; c = t;
            }
        }
        if (a.getZ() >= 0) {
            //all in front
            const r = [getPerspRay(a, l), getPerspRay(b, l), getPerspRay(c, l)];
            return r;
        } else {
            const r = [getPerspLine(a, c, l), getPerspLine(b, c, l), getPerspRay(c, l)];
            //quad case
            if (b.getZ() >= 0) {
                //2 in front, 1 behind
                r.splice(1, 0, getPerspLine(a, b, l));
            }

            return r;

            //all behind case was taken care of already
            //compute point's z on plane defined by triangle at x=y=0

            //0=ax+by+cz+d
            //a = (By-Ay)(Cz-Az)-(Cy-Ay)(Bz-Az)
            //b = (Bz-Az)(Cx-Ax)-(Cz-Az)(Bx-Ax)
            //c = (Bx-Ax)(Cy-Ay)-(Cx-Ax)(By-Ay)
            //d = -(aAx+bAy+cAz)
            // when x = 0 and y = 0;
            // cz=-d
            // z = -d/c
            // z = (aAx+bAy+cAz)/c
            //but a.x = Ax/(fov*Az)
            //also we only care about sign(z)
            //sign(z) = sign(-d)*sign(c)
            //
            //sign(-d) = sign(aAx+bAy+cAz)
            //a = fov*((b.y*b.z-a.y*a.z)(c.z-a.z)-(c.y*c.z-a.y*a.z)(b.z-a.z))
            //aAx = a.x*a.z*fov*fov*((b.y*b.z-a.y*a.z)(c.z-a.z)-(c.y*c.z-a.y*a.z)(b.z-a.z))
            //bAy = a.y*a.z*fov*fov*((c.x*c.z-a.x*a.z)(b.z-a.z)-(b.x*b.z-a.x*a.z)(c.z-a.z))
            //bAz =     a.z*fov*fov*((b.x*b.z-a.x*a.z)(c.y*c.z-a.y*a.z)-(c.x*c.z-a.x*a.z)(b.y*b.z-a.y*a.z))
            //aAx+bAy+cAz = a.z*fov*fov*(
            //  a.x*((b.y*b.z-a.y*a.z)(c.z-a.z)-(c.y*c.z-a.y*a.z)(b.z-a.z))
            // +a.y*((c.x*c.z-a.x*a.z)(b.z-a.z)-(b.x*b.z-a.x*a.z)(c.z-a.z))
            // +    ((b.x*b.z-a.x*a.z)(c.y*c.z-a.y*a.z)-(c.x*c.z-a.x*a.z)(b.y*b.z-a.y*a.z)))

            //sign(aAx+bAy+cAz) = sign(a.z)*sign(
            //  a.x*(b.y*b.z-a.y*a.z)(c.z-a.z)-a.x*(c.y*c.z-a.y*a.z)(b.z-a.z)
            // +a.y*(c.x*c.z-a.x*a.z)(b.z-a.z)-a.y*(b.x*b.z-a.x*a.z)(c.z-a.z)
            // +    (b.x*b.z-a.x*a.z)(c.y*c.z-a.y*a.z)-(c.x*c.z-a.x*a.z)(b.y*b.z-a.y*a.z) )

            //sign(aAx+bAy+cAz) = sign(a.z)*sign(
            //  (a.x*b.y*b.z-a.x*a.y*a.z)(c.z-a.z)-(a.x*c.y*c.z-a.x*a.y*a.z)(b.z-a.z)
            // +(a.y*c.x*c.z-a.y*a.x*a.z)(b.z-a.z)-(a.y*b.x*b.z-a.y*a.x*a.z)(c.z-a.z)
            // +(b.x*b.z-a.x*a.z)(c.y*c.z-a.y*a.z)-(c.x*c.z-a.x*a.z)(b.y*b.z-a.y*a.z) ) 

            //let a.[xyz...] = prod(a.x,a.y,a.z,...)
            //
            //sign(aAx+bAy+cAz) = sign(a.z)*sign(
            //  (a.x*b.yz-a.xyz)(c.z-a.z)-(a.x*c.yz-a.xyz)(b.z-a.z)
            // +(a.y*c.xz-a.xyz)(b.z-a.z)-(a.y*b.xz-a.xyz)(c.z-a.z)
            // +(b.xz-a.xz)(c.yz-a.yz)-(c.xz-a.xz)(b.yz-a.yz) )

            // = sign(a.z)*sign(
            //  ((a.x*b.yz*c.z-a.xyz*c.z)-(a.xz*b.yz-a.xyzz))-((a.x*c.yz*b.z-a.xyz*b.z)-(a.xz*c.yz-a.xyzz))
            // +((a.y*c.xz*b.z-a.xyz*b.z)-(a.yz*c.xz-a.xyzz))-((a.y*b.xz*c.z-a.xyz*c.z)-(a.yz*b.xz-a.xyzz))
            // +((b.xz*c.yz-a.xz*c.yz)-(b.xz*a.yz-a.xyzz))-((c.xz*b.yz-a.xz*b.yz)-(c.xz*a.yz-a.xyzz)) )

            // = sign(a.z)*sign(
            //  a.x*b.yz*c.z
            // -a.xyz*c.z
            // -a.xz*b.yz
            // +a.xyzz
            // -a.x*c.yz*b.z
            // +a.xyz*b.z
            // +a.xz*c.yz
            // -a.xyzz
            // +a.y*c.xz*b.z
            // -a.xyz*b.z
            // -a.yz*c.xz
            // +a.xyzz
            // -a.y*b.xz*c.z
            // +a.xyz*c.z
            // +a.yz*b.xz
            // -a.xyzz
            // +b.xz*c.yz
            // -a.xz*c.yz
            // -b.xz*a.yz
            // +a.xyzz
            // -c.xz*b.yz
            // +a.xz*b.yz
            // +c.xz*a.yz
            // -a.xyzz   )

            // = sign(a.z)*sign(
            // +a.x*(b.yz*c.z-b.z*c.yz)
            // +a.y*(b.z*c.xz-b.xz*c.z)
            // +b.xz*c.yz
            // -b.yz*c.xz
            //    )

            // sign(-d) = sign(a.z)*sign(b.z*c.z)*sign(
            // +a.x*(b.y-c.y)
            // +a.y*(c.x-b.x)
            // +(b.x*c.y-b.y*c.x)
            //    )

            // sign(c) = sign((Bx-Ax)(Cy-Ay)-(Cx-Ax)(By-Ay))
            //  = sign((b.xz-a.xz)(c.yz-a.yz)-(c.xz-a.xz)(b.yz-a.yz))
            //  = sign(
            // +b.xz*c.yz
            // -a.xz*c.yz
            // -b.xz*a.yz
            // +a.xyzz
            // -c.xz*b.yz
            // +a.xz*b.yz
            // +a.yz*c.xz
            // -a.xyzz)
            // = sign(
            // +b.xz*c.yz
            // -a.xz*c.yz
            // -a.yz*b.xz
            // -b.yz*c.xz
            // +a.xz*b.yz
            // +a.yz*c.xz
            // )
            // = sign(
            // +b.z*c.z*(b.x*c.y-b.y*c.x)
            // +a.z*c.z*(a.y*c.x-a.x*c.y)
            // +a.z*b.z*(a.x*b.y-a.y*b.x)
            // )

            // sz = sign(
            // +b.z*c.z*(b.x*c.y-b.y*c.x)
            // +a.z*c.z*(a.y*c.x-a.x*c.y)
            // +a.z*b.z*(a.x*b.y-a.y*b.x)
            // )* sign(a.z)* sign(b.z)* sign(c.z)* sign(
            // +a.x*(b.y-c.y)
            // +a.y*(c.x-b.x)
            // +(b.x*c.y-b.y*c.x)
            // )

            const ax = a.getX();
            const ay = a.getY();
            var az = a.getZ();
            if (az == 0) {
                az = Math.sign(1 / az) * 1e-100
            }
            const bx = b.getX();
            const by = b.getY();
            var bz = b.getZ();
            if (bz == 0) {
                bz = Math.sign(1 / bz) * 1e-100
            }
            const cx = c.getX();
            const cy = c.getY();
            var cz = c.getZ();
            if (cz == 0) {
                cz = Math.sign(1 / cz) * 1e-100
            }
            /*if (cz < -1e-10) {
                debugger;
            }*/
            const sz = Math.sign(bz * cz * (bx * cy - by * cx)
                + az * cz * (ay * cx - ax * cy)
                + az * bz * (ax * by - ay * bx))
                * Math.sign(az) * Math.sign(bz) * Math.sign(cz) * Math.sign(ax * (by - cy)
                    + ay * (cx - bx)
                    + (bx * cy - by * cx));
            if (sz <= 0) {
                return [];
            } else {
                return r;
            }
        }
    }
}



export {
    Drawable, CachedDrawable, Graphic,
    SmartGraphics,
    visibleLineSegment, getPerspRay, triangle, getPerspLine, drawNGon, ngon, perspLine
}
