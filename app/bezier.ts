
import { Vector, Point } from "./vectors";
import { Brush } from "./brush";
import { Drawable } from "./drawable";
import { PtTransform } from "./transform";
import { Saveable, save } from "./save";







interface Curve<T> extends Saveable {
    get(t: number): T;
    derivative(): Curve<T>;
}

@Saveable.register
class WeightedAverageCurve<T extends Vector<any>> implements Curve<T> {
    _saveName?: string;
    constructor(public c1: Curve<T>, public c2: Curve<T>, public a = .5) { }
    get(t: number): T {
        return this.c1.get(t).scale(this.a).addEqDiscardOther(this.c2.get(t).scale(1 - this.a));
    }
    derivative(): Curve<T> {
        return new WeightedAverageCurve<T>(this.c1.derivative(), this.c2.derivative(), this.a);
    }
}


function mod(n = 0, m = 1): number {
    return ((n % m) + m) % m;
}
function modDomain(n = 0, l = 0, h = 1): number {
    return mod(n - l, h - l) + l;
}
function divmodDomain(n = 0, l = 0, h = 1): number[] {
    return [Math.floor((n - l) / (h - l)), mod(n - l, h - l) + l];
}



/*class DRef<T>{
    r: { v: T };
    constructor(v: T, d = true) { if (d) { this.r = { v: v }; } }
    get(): T {
        return this.r.v;
    }
    sCopy(): DRef<T> { const ret = new DRef<T>(this.get(), false); ret.r = this.r; return ret; }
    dCopy(): DRef<T> { return new DRef<T>(this.get()); }
	}*/

@Saveable.register
class SplineKnot<T extends Vector<any>> implements Saveable {
    _saveName?: string;
    isSplineKnot = true;
    constructor(public v: number, public continuity = 0, public cpsl = 0, public cpsh = 0) { }
    degree(): number { return this.cpsh - this.cpsl - 1; }//this.cps.length - 1; }
    get(s: Spline<T>, n: number): WeightedVector<T> {
        return s.controlPoints[mod(this.cpsl + n, s.controlPoints.length)];
    }
    getA(s: Spline<T>): WeightedVector<T>[] {
        return s.controlPoints.slice(this.cpsl, Math.min(this.cpsh, s.controlPoints.length)).concat(s.controlPoints.slice(0, Math.max(0, this.cpsh - s.controlPoints.length)));
    }
    copy(): SplineKnot<T> {
        return new SplineKnot<T>(this.v, this.continuity, this.cpsl, this.cpsh);
    }
}
@Saveable.register
class Spline<T extends Vector<any>> implements Curve<T>, Vector<Spline<T>>{
    _saveName?: string;
    copy(): Vector<Spline<T>> {
        const r = new Spline<T>([]);
        //const rk: SplineKnot<WeightedVector<T>>[] = [];
        /*const m = new Map<WeightedVector<T>, WeightedVector<T> >();
        for (var i in this.knots) {
            for (var ii in this.knots[i].cps) {
                if (!m.has(this.knots[i].get(this,ii))) {
                    m.set(this.knots[i].get(this,ii), this.knots[i].get(this,ii).copy() });
                }
            }
			}*/

        for (var i in this.knots) {
            /*var nk = this.knots[i].copy();new SplineKnot<WeightedVector<T>>(this.knots[i].v, this.knots[i].continuity, []);
            for (var j = 0; j < this.knots[i].cps.length; j++) {
                nk.cps[j] = this.knots[i].cps[j];
                nk.cps[j].r = m.get(this.knots[i].cps[j].r);
            }*/
            r.knots[i] = this.knots[i].copy();
        }
        //r.knots = rk;
        for (var i in this.controlPoints) {
            r.controlPoints[i] = this.controlPoints[i].copy();
        }
        return r;
    }
    add(other: Vector<Spline<T>>): Vector<Spline<T>> {
        throw new Error("Method not implemented.");
    }
    scale(s: number): Vector<Spline<T>> {
        throw new Error("Method not implemented.");
    }
    zero(): Vector<Spline<T>> {
        throw new Error("Method not implemented.");
    }
    addEq(other: Vector<Spline<T>>): Vector<Spline<T>> {
        throw new Error("Method not implemented.");
    }
    addEqDiscardOther(other: Vector<Spline<T>>): Vector<Spline<T>> {
        throw new Error("Method not implemented.");
    }
    scaleEq(s: number): Vector<Spline<T>> {
        throw new Error("Method not implemented.");
    }
    zeroEq(): Vector<Spline<T>> {
        throw new Error("Method not implemented.");
    }
    derivative(): Curve<T> {
        //derivative of this is like a b-spline's
        //dB(i,k,x)/dx =
        //k*(  B(i,k-1,x)   / (t_(i+k)   - t_(i+1))
        //   - B(i+1,k-1,x) / (t_(i+k+1) - t_(i+1)) )
        const res = this.copy();

        for (var ki in this.knots) {
            //do something


        }
        throw new Error("Method not implemented.");
        return res;
    }
    knots: SplineKnot<T>[] = [];
    controlPoints: WeightedVector<T>[] = [];
    constructor(cps: Array<T | WeightedVector<T>>) {
        //const cpcp: DRef<WeightedVector<T>>[] = []
        for (var i in cps) {
            if (isWeighted<T>(cps[i])) {
                this.controlPoints[i] = <WeightedVector<T>>cps[i];
            } else {
                this.controlPoints[i] = new WeightedVector<T>(<T>cps[i], 1);
            }
            //cpcp[i] = this.controlPoints[i].sCopy();
        }
        this.knots = [new SplineKnot<T>(0, 0, 0, this.controlPoints.length), new SplineKnot<T>(1, 0, this.controlPoints.length, this.controlPoints.length)];
    }

    //-----------GET------------

    get(t: number): T {
        const domainKnotI = this.getKnotIndex(t);
        const domainKnot = this.getKnot(domainKnotI);
        //construct deBoor net thing
        const resNet: WeightedVector<T>[] = [];
        const cps = domainKnot.getA(this);
        for (let i in cps) {
            resNet[i] = cps[i].copy();
        }
        for (var k = 1; k <= domainKnot.degree(); k++) {
            for (var i = 0; i <= domainKnot.degree() - k; i++) {
                //resNet[i] = something with it and resNet[i+1];
                const alpha = this.getKnotAlpha(t, domainKnotI, i, k);
                resNet[i].scaleEq(alpha).addEqDiscardOther(resNet[i + 1].scale(1 - alpha));
            }
        }
        return resNet[0].get();
    }


    getDeBoorNet(t: number, num = Infinity): WeightedVector<T>[][] {
        const domainKnotI = this.getKnotIndex(t);
        const domainKnot = this.getKnot(domainKnotI);
        //construct deBoor net thing

        const resNet: WeightedVector<T>[][] = [domainKnot.getA(this)];

        for (var k = 1; k <= Math.min(domainKnot.degree(), num); k++) {
            resNet[k] = [];
            for (var i = 0; i <= domainKnot.degree() - k; i++) {
                //resNet[i] = something with it and resNet[i+1];
                const alpha = this.getKnotAlpha(t, domainKnotI, i, k);
                resNet[k][i] = resNet[k - 1][i].scale(alpha).addEqDiscardOther(resNet[k - 1][i + 1].scale(1 - alpha));
            }
        }
        return resNet;
    }


    getKnotAlpha(t: number, ki: number, i: number, k: number): number {
        if (k <= 0) {
            return 1;
        }
        const keff = this.getKnot(ki).degree() - k + 2;
        const suboffset = i - keff + 1;
        //const iRange = this.getKnotIRange(ki, i + k);
        const ti = this.getEffectiveT(this.getIOffset(ki, suboffset));

        const ti_plus_k = this.getEffectiveT(this.getIOffset(ki, keff + suboffset));

        var denom1 = (ti_plus_k - ti);
        var v1 = (t - ti) / denom1;
        if (denom1 == 0) {
            v1 = 0;
        }
        return 1 - v1;
    }

    getIOffset(i: number, k: number) {
        var ind = mod(i, this.knots.length);
        const sind = ind;
        var dind = 0;
        if (k >= 0) {
            for (ind = (ind + 1) % this.knots.length; k > 0; ind = (ind + 1) % this.knots.length) {
                k -= Math.max(0, this.getKnotMultiplicity(this.knots[ind], this.knots[sind]));
                dind++;
            }
            return i + dind;
        }
        dind++;
        for (; k < 0; ind = (ind + this.knots.length - 1) % this.knots.length) {
            k += Math.max(0, this.getKnotMultiplicity(this.knots[ind], this.knots[sind]));
            dind--;
        }
        return i + dind;
    }

    getKnotMultiplicity(k: SplineKnot<T>, kcontext: SplineKnot<T>): number {
        //other knot's multiplicity = this knot's degree - other knot's continuity
        return kcontext.degree() - k.continuity;
    }
    getKnotIRange(i: number, k: number): number[] {
        const iVars = divmodDomain(i, 0, this.knots.length);
        var ind = iVars[1];
        const sind = ind;
        var dind = 0;
        const kc = k;
        for (ind = (ind + 1) % this.knots.length; k > 0; ind = (ind + 1) % this.knots.length) {
            k -= Math.max(0, this.getKnotMultiplicity(this.knots[ind], this.knots[sind]));
            dind++;
        }
        k = kc;
        var ldind = 1;
        //move startInd down
        for (ind = i; k > 0; ind = (ind + this.knots.length - 1) % this.knots.length) {
            k -= Math.max(0, this.getKnotMultiplicity(this.knots[ind], this.knots[sind]));
            ldind--;
        }


        return [i + ldind, i + dind];
    }
    getKnotTRange(i: number, k: number): number[] {
        const r = this.getKnotIRange(i, k);
        r[0] = this.getEffectiveT(r[0]);
        r[1] = this.getEffectiveT(r[1]);
        return r;
    }

    getEffectiveT(i: number): number {
        const low = this.knots[0].v;
        const high = this.knots[this.knots.length - 1].v;

        const iVars = divmodDomain(i, 0, this.knots.length);
        return this.knots[iVars[1]].v + (high - low) * iVars[0];
    }
    getReducedT(t: number): number {
        const low = this.knots[0].v;
        const high = this.knots[this.knots.length - 1].v;
        return modDomain(t, low, high);
    }

    getKnotIndex(t: number): number {
        t = modDomain(t, this.knots[0].v, this.knots[this.knots.length - 1].v);
        var l = 0;
        var h = this.knots.length - 1;
        while (l < h) {
            const m = (l + h) >> 1;
            if (t >= this.knots[m].v) {
                l = m + 1;
            } else {
                h = m;
            }
        }
        return l - 1;
    }
    getKnot(n: number): SplineKnot<T> {
        return this.knots[mod(n, this.knots.length)];
    }
    getKnotAtT(t: number): SplineKnot<T> {
        const i = this.getKnotIndex(t);
        return this.knots[i];
    }

    //-----------dealing with controlPoints and knots----------
    splice(i: number, d = 0, stuff: WeightedVector<T>[] = [], sepknot = -1): WeightedVector<T>[] {
        const res = this.controlPoints.splice(i, d, ...stuff);
        const delta = stuff.length - d;
        for (var ki = 0; ki < this.knots.length; ki++) {
            if (sepknot == -1) {
                if (this.knots[ki].cpsl >= i) {
                    this.knots[ki].cpsl += delta;
                }
                if (this.knots[ki].cpsh >= i) {
                    this.knots[ki].cpsh += delta;
                }
                if (this.knots[ki].cpsl > this.knots[ki].cpsh) {
                    this.knots.splice(ki, 1);
                    ki--;
                }
            } else {
                if (ki > sepknot) {
                    this.knots[ki].cpsl += delta;
                    this.knots[ki].cpsh += delta;
                }
            }
        }
        return res;
    }

    insertKnot(t: number, c: number/*,epsilon=0.00000000001*/): Spline<T> {
        //todo: fix insertion of knot into b-spline area (area bounded by knots more than c0 continuous)

        //get domain
        const index = this.getKnotIndex(t);
        const knot = this.getKnot(index);
        const multiplicity = Math.max(0, knot.degree() - c);
        const net = this.getDeBoorNet(t, multiplicity);

        //flattening net
        const rescps: WeightedVector<T>[] = [];
        var ri = 0;
        //up the first side
        for (var i = 0; i <= multiplicity; i++) {
            rescps[ri] = net[i][0];
            ri++;
        }
        //over the top
        for (var i = 1; i < net[multiplicity].length; i++) {
            rescps[ri] = net[multiplicity][i];
            ri++;
        }
        if (c < 0) {//disconnect if not continuous
            rescps[ri] = net[multiplicity][i].copy();
            ri++;
        }

        //down the second side
        for (var i = multiplicity - 1; i >= 0; i--) {
            rescps[ri] = net[i][net[i].length - 1];
            ri++;
        }
        const kr = new SplineKnot<T>(t, c, knot.cpsl, knot.cpsh);
        this.knots.splice(index + 1, 0, kr);
        this.splice(knot.cpsl, knot.degree() + 1, rescps, index);


        return this;
    }



    modifyKnot(n: number, c = Infinity, highSide = false): Spline<T> {
        //todo: implement this


        //changes knot continuity to c while attempting to preserve shape
        // if the multiplicity of the knot reaches 0, it is removed
        const index = n;
        const knot = this.getKnot(index);
        const t = knot.v;
        if (knot.continuity == c) {
            return this;
        }
        if (knot.continuity > c) {
            const dCont = knot.continuity - c;
            const multiplicity = Math.max(0, knot.degree() - dCont);
            const net = this.getDeBoorNet(t, multiplicity);
            //flattening net
            const rescps: WeightedVector<T>[] = [];
            var ri = 0;
            //up the first side
            for (var i = 0; i <= multiplicity; i++) {
                rescps[ri] = net[i][0];
                ri++;
            }
            //over the top
            for (var i = 1; i < net[multiplicity].length; i++) {
                rescps[ri] = net[multiplicity][i];
                ri++;
            }
            if (c < 0) {//disconnect if not continuous
                rescps[ri] = net[multiplicity][i].copy();
                ri++;
            }

            //down the second side
            for (var i = multiplicity - 1; i >= 0; i--) {
                rescps[ri] = net[i][net[i].length - 1];
                ri++;
            }
            this.splice(knot.cpsl, knot.degree() + 1, rescps, index - 1);

            this.knots[n].continuity = c;
        } else {
            throw new Error("Method not implemented.");
        }
        return this;
    }



}





@Saveable.register
class KnotVector implements Saveable {
    _saveName?: string;
    isKnotVector = true;
    constructor(public n: number[]) { }
    get(t: number, degree: number): number {
        var l = degree;
        var h = this.n.length - 1 - degree;
        if (t < this.n[l]) {
            l = 1;
            h = l;
        } else {
            if (t > this.n[h]) {
                l = h;
            }
        }
        while (l < h) {
            const m = (l + h) >> 1;
            if (t >= this.n[m]) {
                l = m + 1;
            } else {
                h = m - 1;
            }
        }
        for (l -= 1; this.n[l] <= t; l++) { }
        return Math.max(l - 1, 0);
    }

    getTS(t: number, degree: number): number[] {
        const low = this.n[degree];
        const high = this.n[this.n.length - 1 - degree];
        t = t * (high - low) + low;
        var s: number;
        if (t <= low) {
            s = degree;
        } else {
            if (t >= high) {
                s = Math.max(0, this.n.length - 2 - degree);
            } else {
                s = this.get(t, degree);
            }
        }
        return [t, s];
    }
    insertTS(ts: number[]) {
        this.n.splice(ts[1] + 1, 0, ts[0]);
    }
    copy(): KnotVector {
        var ns: number[] = [];
        for (var i in this.n) {
            ns[i] = this.n[i];
        }
        return new KnotVector(ns);
    }
    copySub1(): KnotVector {
        var ns: number[] = [];
        for (var i = 0; i < this.n.length - 1; i++) {
            ns[i] = this.n[i];
        }
        return new KnotVector(ns);
    }
    reverse(): void {
        this.n.reverse();
        var tmp = this.n[0];
        for (var i = 0; i < this.n.length; i++) {
            this.n[i] = tmp - this.n[i];
        }
    }
    span(d = 0): number {
        return this.n[this.n.length - 1 - d] - this.n[d];
    }
    getNormed(n: number, d = 0): number {
        return (this.n[n] - this.n[d]) / this.span(d);
    }
    unNorm(t: number): number {
        return t * this.span() + this.n[0];
    }
    insertNormed(t: number) {
        t = this.unNorm(t);
        var low = 0,
            high = this.n.length;

        while (low < high) {
            var mid = (low + high) >>> 1;
            if (this.n[mid] < t) low = mid + 1;
            else high = mid;
        }
        this.n.splice(low, 0, t);
    }

    nextSubsection(i: number): number {
        while (this.n[i] == this.n[i + 1]) {
            i++;
        }
        return i;
    }
    multiplicity(i: number): number {
        const v = this.n[i];
        const oi = i;
        var r = 0;
        while (this.n[i] == v) {
            i--;
            r++;
        }
        i = oi + 1;
        while (this.n[i] == v) {
            i++;
            r++;
        }
        return r;
    }
}


@Saveable.register
class BSpline<T extends Vector<any>> implements Curve<T>, Vector<BSpline<T>>{
    _saveName?: string;
    //BSpline addition isn't working properly (doesn't deal with degree diffs)
    knot: KnotVector;
    controlPoints: WeightedVector<T>[] = [];
    constructor(cps: Array<T | WeightedVector<T>>, public degree: number, k: KnotVector | number[] | null) {
        for (var i in cps) {
            if (isWeighted<T>(cps[i])) {
                this.controlPoints[i] = <WeightedVector<T>>cps[i];
            } else {
                this.controlPoints[i] = new WeightedVector<T>(<T>cps[i], 1);
            }
        }
        if (k == null) {
            //https://pages.mtu.edu/~shene/COURSES/cs3621/NOTES/spline/B-spline/bspline-curve.html
            //m=n+p+1
            var a = new Array<number>();
            for (var i2 = 0; i2 < this.controlPoints.length + degree + 1; i2++) {
                a[i2] = i2;
            }
            this.knot = new KnotVector(a);
        } else {
            if ((k as KnotVector).isKnotVector == true) {
                this.knot = (k as KnotVector);
            } else {
                this.knot = new KnotVector(k as number[]);
            }
        }

    }

    get(t: number): T {
        if (this.controlPoints.length <= this.degree) {
            //return fixed average
            var res = this.controlPoints[0].copy();
            for (var i = 1; i < this.controlPoints.length; i++) {
                res.addEq(this.controlPoints[i]);
            }
            return res.get();
        }


        const ts = this.knot.getTS(t, this.degree);
        t = ts[0];
        var s = ts[1];



        if (this.degree == 0) {
            return this.controlPoints[Math.max(0, Math.min(s, this.controlPoints.length - 1))].get();
        }
        let order = this.degree + 1;

        let v = new Array<WeightedVector<T>>();
        for (var i = s; i > s - order; i--) {
            v[i] = this.controlPoints[i].copy();
        }

        // https://github.com/thibauts/b-spline/blob/master/index.js#L59-L71		
        // l (level) goes from 1 to the curve degree + 1
        for (var l = 1; l <= this.degree + 1; l++) {
            // build level l of the pyramid
            for (var i = s; i > s - this.degree - 1 + l; i--) {
                const alpha = (t - this.knot.n[i]) / (this.knot.n[i + this.degree + 1 - l] - this.knot.n[i]);
                v[i].scaleEq(alpha).addEqDiscardOther(v[i - 1].scale(1 - alpha));
            }
        }
        return v[s].get();

    }

    derivative(): Curve<T> {
        var cps = new Array<WeightedVector<T>>();
        for (var i = 0; i < this.controlPoints.length - 1; i++) {
            cps[i] = (this.controlPoints[i].scale(-1).addEq(this.controlPoints[i])).scale(this.degree / (this.knot.n[i + this.degree + 1] - this.knot.n[i + 1]));
        }
        return new BSpline(cps, this.degree - 1, this.knot.copySub1());
    }


    append(cp: T | WeightedVector<T>, k: number | null, keepRef = false): BSpline<T> {
        if (k == null) {
            if (this.knot.n.length > 0) {
                k = this.knot.n[this.knot.n.length - 1] + 1;
            } else {
                for (k = 0; k < this.degree; k++) {
                    this.knot.n.push(k);
                }
            }
        }
        if (isWeighted<T>(cp)) {
            this.controlPoints[this.controlPoints.length] = <WeightedVector<T>>cp;
        } else {
            if (keepRef) {
                this.controlPoints[this.controlPoints.length] = makeWeightedKeepReference<T>(<T>cp, 1);
            } else {
                this.controlPoints[this.controlPoints.length] = new WeightedVector<T>(<T>cp, 1);
            }
        }
        this.knot.n.push(k);
        return this;
    }



    subdivide(t: number): BSpline<T>[] {
        var deBoorNet: T[][] = [];
        throw new Error("Not implemented");
    }

    insertKnotNormed(t: number): BSpline<T> {
        // http://preserve.mactech.com/articles/develop/issue_25/schneider.html
        const p = this.degree;
        const low = this.knot.getNormed(p);
        const high = this.knot.getNormed(this.knot.n.length - 1 - p);
        const P = this.controlPoints;
        //note that the positions of the very end knots don't effect the curve

        if (t < low) {
            //
            throw new Error("cannot insert knot outside curve");
            const unt = t * (this.knot.n[this.knot.n.length - 1] - this.knot.n[0]);
            const ind = this.knot.get(unt, 0);
            //the point in P we are inserting at is index 0
            P.splice(0, 0, P[0].copy());
            //points that change are degree points starting at index 0

            //this won't preserve domain unless we move knots around :(




            this.knot.n.splice(ind, 0, unt);
            return this;
        } else {
            if (t > high) {
                throw new Error("cannot insert knot outside curve");
                P.push(P[P.length - 1]);

                this.knot.insertNormed(t);
                return this;
            } else {
                return this.insertKnot((t - low) / (high - low));
            }
        }
    }

    insertKnotAtIndex(n: number): BSpline<T> {
        const p = this.degree;
        const u = this.knot.n;
        const P = this.controlPoints;

        const t = u[n];
        var k = n

        const Q: WeightedVector<T>[] = [];

        for (var i = Math.max(k - p + 1, 0); i <= Math.min(k, P.length - 1); i++) {
            const d = (u[i + p] - u[i]);
            if (d != 0) {
                const a = (t - u[i]) / d;
                Q[i] = P[i - 1].scale(1 - a).addEqDiscardOther(P[i].scale(a));
            } else {
                Q[i] = P[i - 1].copy();
            }
        }
        P.splice(k, 0, P[k].copy());
        for (var i = k - p + 1; i <= k; i++) {
            P[i] = Q[i];
        }
        this.knot.n.splice(n + 1, 0, t);
        return this;
    }


    insertKnot(t: number): BSpline<T> {
        // https://pages.mtu.edu/~shene/COURSES/cs3621/NOTES/spline/B-spline/single-insertion.html
        //renaming vars
        const p = this.degree;
        const u = this.knot.n;
        const P = this.controlPoints;

        const ts = this.knot.getTS(t, p);
        if (t < 0) {


        }

        t = ts[0];
        var k = ts[1];


        const Q: WeightedVector<T>[] = [];

        for (var i = Math.max(k - p + 1, 0); i <= Math.min(k, P.length - 1); i++) {
            const d = (u[i + p] - u[i]);
            if (d != 0) {
                const a = (t - u[i]) / d;
                Q[i] = P[i - 1].scale(1 - a).addEqDiscardOther(P[i].scale(a));
            } else {
                Q[i] = P[i - 1].copy();
            }
        }
        P.splice(k, 0, P[k].copy());
        for (var i = k - p + 1; i <= k; i++) {
            P[i] = Q[i];
        }
        this.knot.insertTS(ts);
        return this;
    }


    removeKnotAtIndex(n: number): BSpline<T> {
        const p = this.degree;
        const u = this.knot.n;
        const P = this.controlPoints;


        const t = this.knot.n.splice(n, 1)[0];
        var k = n;

        const deled = P.splice(k, 1);

        const Q: WeightedVector<T>[] = [];
        for (var i = k - p + 1; i <= k; i++) {
            Q[i] = P[i];
        }

        for (var i = Math.max(k - p + 1, 0); i <= Math.min(k, P.length - 1); i++) {
            const d = (u[i + p] - u[i]);
            if (d != 0) {
                const a = (t - u[i]) / d;
                P[i - 1] = Q[i].add(P[i].scale(-a)).scaleEq(1 / (1 - a));
            } else {
                P[i - 1] = Q[i].copy();
            }
        }

        return this;
    }

    incDegree(): BSpline<T> {
        //much todo

        // http://citeseerx.ist.psu.edu/viewdoc/download?doi=10.1.1.582.4834&rep=rep1&type=pdf
        this.makeEndsClamped();

        this.degree++;
        //var knotsAdded = 0;
        //var knotsAddedPrev = 0;
        var ofs = 0;
        for (var i = this.degree; i < this.knot.n.length; i++) {//= this.knot.nextSubsection(i)){
            //knotsAddedPrev = knotsAdded;
            //knotsAdded=0;
            for (var b = 1/*this.knot.multiplicity(i)*/; b < this.degree - 1; b++) {
                this.insertKnotAtIndex(i);
                i++;
                //knotsAdded++;
            }
            //subsection has been bezierified
            //subsection runs from cps[?] to cps[i?]



            const n = this.degree - 1;
            if (n == 0) {
                this.controlPoints.splice(ofs, 0, this.controlPoints[ofs].copy());
            } else {
                const k = n + 1;
                this.controlPoints.splice(k + ofs, 0, this.controlPoints[n + ofs].copy());
                //this.controlPoints[n].scaleEq((n+1)/k); (n+1)/k = 1
                for (var ib = n; ib >= 1; ib--) {
                    this.controlPoints[ib + ofs].scaleEq((n - ib + 1) / (ib + 1)).addEq(this.controlPoints[ib - 1 + ofs].scaleEq(ib / k));
                }
            }

            ofs += this.degree + 1;
            //subsection has been degree elevated

            //now we remove knots
            for (var b = 1; b < this.degree - 1; b++) {
                this.removeKnotAtIndex(i - this.degree);
                i--;
            }
        }



        return this;
    }

    reverse(): BSpline<T> {
        this.controlPoints.reverse();
        this.knot.reverse();
        return this;
    }

    copy(): Vector<BSpline<T>> {
        var m: WeightedVector<T>[] = [];
        for (var i in this.controlPoints) {
            m[i] = this.controlPoints[i].copy();
        }
        return new BSpline<T>(m, this.degree, this.knot.copy());
    }
    add(o: Vector<BSpline<T>>): Vector<BSpline<T>> {
        if (o.degree > this.degree) {
            return this.incDegree().addEq(o);
        } else {
            if (o.degree < this.degree) {
                return o.incDegree().addEq(this);
            }
            else {
                return this.copy().addEq(o);
            }
        }
    }

    makeEndsClamped(): BSpline<T> {
        //insert knots at 0 and 1 k+1 times
        const k = this.degree;
        for (var i = 0; i <= k; i++) {
            this.insertKnot(0);
            this.insertKnot(1);
        }
        //now delete knots and corresp. points before 0 and after 1

        const low = this.knot.n[k];
        const high = this.knot.n[this.knot.n.length - 1 - k];
        while (this.knot.n[this.knot.n.length - 1] > high) {
            this.knot.n.pop();
            this.controlPoints.pop();
        }
        var l = 0
        while (this.knot.n[l] < low) {
            l += 1;
        }
        this.knot.n.splice(0, l);
        this.controlPoints.splice(0, l);

        return this;
    }

    makeShareKnot(o: BSpline<T>, epsilon = 0.00000001) {
        var oi = 0;
        while (oi < Math.max(o.knot.n.length, this.knot.n.length)) {
            var d = 0;
            if (oi >= o.knot.n.length) {
                d = -1;
            } else {
                if (oi >= this.knot.n.length) {
                    d = 1;
                } else {
                    d = this.knot.getNormed(oi) - o.knot.getNormed(oi);
                }
            }
            if (Math.abs(d) < epsilon) {
            } else {
                if (d < 0) {
                    //then this knot is before the other knot
                    o.insertKnot(this.knot.getNormed(oi));
                } else {
                    this.insertKnot(o.knot.getNormed(oi));
                }
            }
            oi++;
        }

    }



    addEq(o: Vector<BSpline<T>>): Vector<BSpline<T>> {
        if (o.degree > this.degree) {
            return this.incDegree().addEq(o);
        } else {
            if (o.degree < this.degree) {
                return this.addEqDiscardOther(o.copy().incDegree());
            }
            else {
                return this.addEqDiscardOther(o.copy());
            }
        }
    }
    addEqDiscardOther(o: Vector<BSpline<T>>): Vector<BSpline<T>> {
        if (o.degree > this.degree) {
            return this.incDegree().addEqDiscardOther(o);
        } else {
            if (o.degree < this.degree) {
                return this.addEqDiscardOther(o.incDegree());
            }
            else {
                this.makeEndsClamped();
                this.makeShareKnot(o.makeEndsClamped());
                for (var i = 0; i < this.controlPoints.length; i++) {
                    this.controlPoints[i].addEqDiscardOther(o.controlPoints[i]);
                }
                return this;
            }
        }
    }

    scale(s: number): Vector<BSpline<T>> {
        return this.copy().scaleEq(s);
    }
    scaleEq(s: number): Vector<BSpline<T>> {
        for (var i = 0; i < this.controlPoints.length; i++) {
            this.controlPoints[i].scaleEq(s);
        }
        return this;
    }
    zero(): Vector<BSpline<T>> {
        return new BSpline([this.controlPoints[0].zero()], 0, null);
    }

    zeroEq(): Vector<BSpline<T>> {
        this.controlPoints = [this.controlPoints[0].zeroEq()];
        this.degree = 0;
        this.knot = new KnotVector([0]);
        return this;
    }

}








@Saveable.register
class PiecewiseCurve<T extends Vector<any>> implements Curve<T>{
    _saveName?: string;
    /*copy(): Vector<PiecewiseCurve<T>> {
        var cs = new Array<Curve<T>>();
        for (var i in this.parts) {
            cs[i] = this.parts[i].copy();
        }
        return new PiecewiseCurve(...cs);
    }
    add(other: Vector<PiecewiseCurve<T>>): Vector<PiecewiseCurve<T>> {
        var cs = new Array<Curve<T>>();
        for (var i in this.parts) {
            cs[i] = this.parts[i].add(other.parts[i]);
        }
        return new PiecewiseCurve(...cs);
    }
    scale(s: number): Vector<PiecewiseCurve<T>> {
        var cs = new Array<Curve<T>>();
        for (var i in this.parts) {
            cs[i] = this.parts[i].copy();
        }
        return new PiecewiseCurve(...cs);
    }
    zero(): Vector<PiecewiseCurve<T>> {
        var cs = new Array<Curve<T>>();
        for (var i in this.parts) {
            cs[i] = this.parts[i].copy();
        }
        return new PiecewiseCurve(...cs);
    }
    */


    public parts: Array<Curve<T>>;
    constructor(...parts: Array<Curve<T>>) { this.parts = parts; }
    get(t: number): T {
        if (t < 0) {
            return this.parts[0].get(t * this.parts.length);
        }
        if (t >= 1) {
            return this.parts[this.parts.length - 1].get(1 + (t - 1) * this.parts.length);
        }
        const tid = (Math.floor(t * this.parts.length));
        return this.parts[tid].get((t * this.parts.length) - tid);
    }
    derivative(): Curve<T> {
        var ds = new Array<Curve<T>>();
        for (var i in this.parts) {
            ds[i] = this.parts[i].derivative();
        }
        return new PiecewiseCurve(...ds);
    }
}

function makeWeightedKeepReference<T extends Vector<any>>(v: T, w = 1): WeightedVector<T> {
    v.scaleEq(w);
    return new WeightedVector<T>(v, w, true);
}

// for use in Bezier

@Saveable.register
class WeightedVector<T extends Vector<any>> implements Vector<WeightedVector<T>>, Saveable {
    _saveName?: string;
    public v: T;
    constructor(V: T, public w = 1, d = false) { if (!d) { this.v = V.scale(w); } else { this.v = V; } }
    copy(): Vector<WeightedVector<T>> {
        return new WeightedVector<T>(this.v.copy(), this.w, true);
    }
    add(o: Vector<WeightedVector<T>>): Vector<WeightedVector<T>> {
        return new WeightedVector<T>(this.v.add(o.v), this.w + o.w, true)

    }
    scale(s: number): Vector<WeightedVector<T>> {
        //if (s >= 0) {
        return new WeightedVector<T>(this.v.scale(s), this.w * s, true);
        /*} else {
            return new WeightedVector<T>(this.v.scale(s), this.w * -s, true);
        }*/
    }
    zero(): Vector<WeightedVector<T>> {
        return new WeightedVector<T>(this.v.zero(), 0, true);
    }
    addEq(o: Vector<WeightedVector<T>>): Vector<WeightedVector<T>> {
        this.v.addEq(o.v);
        this.w += o.w;
        return this;
    }
    addEqDiscardOther(o: Vector<WeightedVector<T>>): Vector<WeightedVector<T>> {
        this.v.addEqDiscardOther(o.v);
        this.w += o.w;
        return this;
    }
    scaleEq(s: number): Vector<WeightedVector<T>> {
        //if (s >= 0) {
        this.v.scaleEq(s);
        this.w *= s;
        return this;
        /*} else {
            this.v.scaleEq(s);
            this.w *= -s;
            return this;
        }*/
    }
    zeroEq(): Vector<WeightedVector<T>> {
        this.w = 0;
        this.v.zeroEq();
        return this;
    }

    get(): T {
        return this.v.scale(1 / this.w);
    }
    isAWeightedVector(): boolean {
        return true;
    }
}

function isWeighted<T>(a: (T | WeightedVector<T>)): a is WeightedVector<T> {
    if ((a as WeightedVector<T>).isAWeightedVector) {
        return (a as WeightedVector<T>).isAWeightedVector();
    }
    return false;
}

function continuize<T>(level = 1, ...bezs: Array<Bezier<T>>) {
    for (var i in bezs) {
        //todo
    }
}

/*class BSpline<T extends Vector<any>> implements Vector<Bezier<T>>, Curve<T> {
    controlPoints: WeightedVector<T>[] = [];
    knots: number[] = [];
    constructor(cps: Array<T | WeightedVector<T>>) {
        for (var i in cps) {
            if (isWeighted<T>(cps[i])) {
                this.controlPoints[i] = <WeightedVector<T>>cps[i];
            } else {
                this.controlPoints[i] = new WeightedVector<T>(<T>cps[i], 1);
            }
        }
    }
 
}*/



@Saveable.register
class Bezier<T extends Vector<any>> implements Vector<Bezier<T>>, Curve<T> {
    _saveName?: string;
    isBezier = true;
    controlPoints: WeightedVector<T>[] = [];
    constructor(cps: Array<T | WeightedVector<T>>) {
        for (var i in cps) {
            if (isWeighted<T>(cps[i])) {
                this.controlPoints[i] = <WeightedVector<T>>cps[i];
            } else {
                this.controlPoints[i] = new WeightedVector<T>(<T>cps[i], 1);
            }
        }
    }
    deCastlejau(t: number): WeightedVector<T>[][] {
        var ans: WeightedVector<T>[][] = [this.controlPoints];
        while (ans[ans.length - 1].length > 1) {
            ans.push([]);
            for (var i = 0; i < ans[ans.length - 2].length - 1; i++) {
                ans[ans.length - 1].push(ans[ans.length - 2][i + 1].scale(t).addEqDiscardOther(ans[ans.length - 2][i].scale(1 - t)));
            }
        }
        return ans;
    }
    shorten(t: number): Bezier<T> {
        for (var j = 0; j < this.controlPoints.length; j++) {
            for (var i = this.controlPoints.length - 1; i > j; i--) {
                this.controlPoints[i].scaleEq(t).addEqDiscardOther(this.controlPoints[i - 1].scale(1 - t));
            }
        }
        return this;
    }
    reverse(): Bezier<T> {
        this.controlPoints.reverse();
        return this;
    }

    derivative(): Curve<T> {
        var cps: WeightedVector<T>[] = [];
        if (this.order() == 0) {
            return new Bezier<T>([this.controlPoints[0].zero()]);
        }
        for (var i = 0; i < this.order(); i++) {
            cps[i] = this.controlPoints[i + 1].add(this.controlPoints[i].scale(-1)).scaleEq(this.controlPoints.length);
        }
        return new Bezier<T>(cps);
    }

    order(): number {
        //console.log(this);
        return this.controlPoints.length - 1;
    }

    copy(): Vector<Bezier<T>> {
        var c2 = new Array<WeightedVector<T>>();
        for (var i = 0; i < this.controlPoints.length; i++) {
            c2.concat((this.controlPoints[i]).copy());
        }
        return new Bezier<T>(c2);
    }
    add(o: Vector<Bezier<T>>): Vector<Bezier<T>> {
        if (o.order() > this.order()) {
            return this.incOrder().addEq(o);
        } else {
            if (o.order() < this.order()) {
                return o.incOrder().addEq(this);
            }
            else {

                var c2 = new Array<T | WeightedVector<T>>();
                for (var i = 0; i < this.controlPoints.length; i++) {
                    c2[i] = this.controlPoints[i].add(o.controlPoints[i]);

                }
                return new Bezier<T>(c2);
            }
        }
    }
    addEq(o: Vector<Bezier<T>>): Vector<Bezier<T>> {
        if (o.order() > this.order()) {
            return this.incOrderEq().addEq(o);
        } else {
            if (o.order() < this.order()) {
                return this.addEqDiscardOther(o.incOrder());
            }
            else {

                for (var i = 0; i < this.controlPoints.length; i++) {
                    this.controlPoints[i].addEq(o.controlPoints[i]);

                }
                return this;
            }
        }
    }
    addEqDiscardOther(o: Vector<Bezier<T>>): Vector<Bezier<T>> {
        if (o.order() > this.order()) {
            return this.incOrderEq().addEqDiscardOther(o);
        } else {
            if (o.order() < this.order()) {
                return this.addEqDiscardOther(o.incOrderEq());
            }
            else {
                for (var i = 0; i < this.controlPoints.length; i++) {
                    this.controlPoints[i].addEqDiscardOther(o.controlPoints[i]);
                }
                return this;
            }
        }
    }
    concat(...p: Array<T | WeightedVector<T>>): Bezier<T> {
        return new Bezier<T>((this.controlPoints as Array<T | WeightedVector<T>>).concat(p));
    }
    append(...cps: Array<T | WeightedVector<T>>): Bezier<T> {
        for (var i in cps) {
            if (isWeighted<T>(cps[i])) {
                this.controlPoints[this.controlPoints.length] = <WeightedVector<T>>cps[i];
            } else {
                this.controlPoints[this.controlPoints.length] = new WeightedVector<T>(<T>cps[i], 1);
            }
        }
        return this;
    }
    zero(): Vector<Bezier<T>> {
        return new Bezier<T>([this.controlPoints[0].zero()]);

    }
    zeroEq(): Vector<Bezier<T>> {
        this.controlPoints = [this.controlPoints[0].zeroEq()];
        return this;
    }
    scale(n: number): Vector<Bezier<T>> {
        var c2 = new Array<WeightedVector<T>>();
        for (var i = 0; i < this.controlPoints.length; i++) {
            c2[i] = this.controlPoints[i].scale(n);
        }
        return new Bezier<T>(c2);
    }

    scaleEq(n: number): Vector<Bezier<T>> {
        for (var i = 0; i < this.controlPoints.length; i++) {
            this.controlPoints[i].scaleEq(n);
        }
        return this;
    }

    get(t: number): T {
        if (this.order() == 0) {
            return this.controlPoints[0].copy().get();
        }

        var res = this.controlPoints[0].scale(
            Math.pow((1 - t), this.order())
        );
        var bin = this.order();
        for (var i = 1; i < this.controlPoints.length; i++) {
            res.addEqDiscardOther(this.controlPoints[i].scale(
                bin *
                Math.pow((1 - t), this.order() - i) *
                Math.pow(t, i)
            ));
            bin *= (this.order() - i) / (i + 1);
        }
        return res.get();
    }
    incOrder(): Bezier<T> {
        const n = this.order();
        if (n == 0) {
            return new Bezier<T>([this.controlPoints[0].copy(), this.controlPoints[0].copy()]);
        }
        const k = n + 1;
        var v = new Array<WeightedVector<T>>();
        v[0] = this.controlPoints[0].copy();
        v[k] = this.controlPoints[n].copy();
        for (var i = 1; i <= n; i++) {
            v[i] = this.controlPoints[i].scale((n - i + 1) / k).addEqDiscardOther(this.controlPoints[i - 1].scale(i / k));
        }
        return new Bezier<T>(v);
    }
    incOrderEq(): Bezier<T> {
        const n = this.order();
        if (n == 0) {
            this.controlPoints[1] = this.controlPoints[0].copy();
            return this;
        }
        const k = n + 1;
        this.controlPoints[k] = this.controlPoints[n].copy();
        //this.controlPoints[n].scaleEq((n+1)/k); (n+1)/k = 1
        for (var i = n; i >= 1; i--) {
            this.controlPoints[i].scaleEq((n - i + 1) / (i + 1)).addEq(this.controlPoints[i - 1].scaleEq(i / k));
        }
        return this;
    }

}
/*
 
class RationalBezier<T extends Vector<any>> extends Bezier<T> {
    constructor(cps: T[], public controlWeights: number[]) {
        super(cps);
    }
    order(): number {
        return this.controlPoints.length - 1;
    }
 
    copy(): Vector<RationalBezier<T>> {
        var c2 = new Array<T>();
        var w2 = new Array<number>();
        for (var i = 0; i < this.controlPoints.length; i++) {
            c2.concat(this.controlPoints[i].copy())
        }
        for (var j in this.controlWeights) {
            w2[j] = this.controlWeights[j];
        }
        return new RationalBezier<T>(c2, w2);
    }
    add(o: Vector<RationalBezier<T>>): Vector<RationalBezier<T>> {
        if (o.order() > this.order()) {
            return this.incOrder().add(o);
        } else {
            if (o.order() < this.order()) {
                return o.incOrder().add(this);
            }
            else {
 
                var c2 = new Array<T>();
                var w2 = new Array<number>();
                for (var i = 0; i < this.controlPoints.length; i++) {
                    c2.concat(this.controlPoints[i].add(o.controlPoints[i]));
                    w2[i] = this.controlWeights[i] + o.controlWeights[i];
                }
                return new RationalBezier<T>(c2, w2);
            }
        }
    }
    zero(): Vector<RationalBezier<T>> {
        return new RationalBezier<T>([this.controlPoints[0].zero()], [1]);
 
    }
    scale(n: number): Vector<RationalBezier<T>> {
        var c2 = new Array<T>();
        var w2 = new Array<number>();
        for (var i = 0; i < this.controlPoints.length; i++) {
            c2.concat(this.controlPoints[i].scale(n));
            w2[i] = this.controlWeights[i] * n;
        }
        return new RationalBezier<T>(c2, w2);
    }
 
    get(t: number): T {
        if (this.order() == 0) {
            return this.controlPoints[0].copy();
        }
        var res = this.controlPoints[0].zero();
        var resw = 0;
        var bin = 1;
        for (var i = 0; i < this.controlPoints.length; i++) {
            const f = bin *
                Math.pow((1 - t), this.order() - i) *
                Math.pow(t, i);
            resw += this.controlWeights[i] * f;
            res = res.add(this.controlPoints[i].scale(
                f
            ));
            bin *= (this.order() - i) / (i + 1);
        }
        return res.scale(1 / resw);
    }
    incOrder(): RationalBezier<T> {
        const n = this.order();
        const k = n + 1;
        var v = new Array<T>();
        var vn = new Array<number>();
        v[0] = this.controlPoints[0].copy();
        v[k] = this.controlPoints[n].copy();
        for (var i = 1; i <= n; i++) {
            v[i] = this.controlPoints[i].scale(n - i + 1).add(this.controlPoints[i - 1].scale(i)).scale(1 / k);
            vn[i] = (this.controlWeights[i] * (n - i + 1) + (this.controlWeights[i - 1] * (i))) * (1 / k);
        }
        return new RationalBezier<T>(v, vn);
    }
 
}
 
 
*/



export {
    Curve, Bezier, WeightedVector, BSpline, Spline,
    PiecewiseCurve, WeightedAverageCurve
}
