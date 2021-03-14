import { Vector } from "../vector/vector";
import { NDVector } from "../vector/ndvec";
import { Curve } from "./curve";
import { Saveable } from "../save";
import { ascending_search_right } from "../tools/binary_search";
import { float_near } from "../tools/float_difference";



@Saveable.register
export class B_Spline<T extends Vector<any>> extends Vector<B_Spline<T>> implements Curve<T>, Saveable {
    _saveName?: string;
    static EPSILON = 1 / 256 / 256 / 256; // 256 / 256 / 256; // used for knot equality tests
    constructor(public control_points: T[], public knot_vec: number[]) { super(); }
    get order(): number {
        return this.knot_vec.length - this.control_points.length;
    }
    curve_eval(t: number): T {
        if (this.order <= 0) {
            return this.control_points[0].vec_zero();
        }
        const b = this.basis(t);
        const v = this.control_points[b.start].vec_scale(b.weights[0]) as T;
        for (let i = 1; i < b.weights.length; i++)
            v.vec_fmaEq(this.control_points[b.start + i], b.weights[i]);
        return v;
    }
    basis(t: number): { start: number, weights: number[] } {
        const o = this.order;
        let region = ascending_search_right(this.knot_vec, t);
        //this loop prevents unpredictable returning of kronecker deltas in the curve
        while (region < this.knot_vec.length && float_near(this.knot_vec[region], t, B_Spline.EPSILON)) {
            region++;
        }//curve regions are [low,high)

        //o is how many control points are needed to calculate

        const k = Math.max(o, Math.min(this.knot_vec.length - o, region));
        const bweights = this.basis_ITS(k - 1, o - 1, t);
        //return { start: region - p, weights: bweights };


        return { start: k - o, weights: bweights };
    }
    basis_ITS(k: number, p: number, u: number): number[] {
        //inverted triangular scheme from here:
        // https://www.researchgate.net/publication/228411721_Time-Efficient_NURBS_Curve_Evaluation_Algorithms
        //
        // Basis_ITS1(k, p, u)
        const N: number[] = Array<number>(p + 1).fill(0);
        // 1. N[0] = 1
        N[p] = 1;
        // 2. for (i = 1; i <= p; i++)
        for (let i = 1; i <= p; i++) {
            // 2.1. for j = i - 1; j >= 0; j--)
            for (let j = i - 1; j >= 0; j--) {
                // 2.1.1. A = (u - knots[k - j]) /   
                //           (knots[k + i - j] - knots[k - j])
                const an = (u - this.knot_vec[k - j]);
                const ad = (this.knot_vec[k + i - j] - this.knot_vec[k - j]);
                const A = (ad != 0) ? an / ad : 0;
                // 2.1.2. tmp = N[j] * A
                const tmp = N[p - j] * A;
                //2.1.3. N[j + 1] += N[j] - tmp
                N[p - (j + 1)] += N[p - j] - tmp;
                //2.1.4. N[j] = tmp
                N[p - j] = tmp;
            }
        }
        // 3. return N
        return N;
    }
    // https://pages.mtu.edu/~shene/COURSES/cs3621/NOTES/spline/B-spline/de-Boor.html
    /*DeBoor_coef_triangle(k: number, p: number, t: number, h: number): NDVector[][] {
        const res: NDVector[][] = [Array<NDVector>(p + 1).fill(new NDVector([1]))];
        // P_i,0 is res[0][i-k]
        for (let r = 1; r <= h; r++) {
            for (let i = k - p + r; i <= k/*-s* /; i++) {
                const an = (t - this.knot_vec[i]);
                const ad = (this.knot_vec[i + p - r + 1] - this.knot_vec[i]);
                const air = (ad != 0) ? an / ad : (an >= 0 ? 1 : 0);
                //P_ir = thing
                res[r][i] = res[r - 1][i - 1].vec_lerp(res[r - 1][i].shift(1), air);
            }
        }
        return res;
    }*/
    // https://pages.mtu.edu/~shene/COURSES/cs3621/NOTES/spline/B-spline/multiple-time.html
    insert_knot(t: number, times: number = 1): number {
        const region = ascending_search_right(this.knot_vec, t);
        const o = this.order;
        const k = Math.max(o, Math.min(this.knot_vec.length - o, region));
        //can use basis_ITS for this
        // but that's less efficient
        // so I make a seperate func
        //const tri = this.DeBoor_coef_triangle(k - 1, o - 1, t, Math.min(o - 1, times));
        const tri = this.support_net(t, times);
        const res: T[] = Array<T>(times + o - 2);
        for (let i = 1; i < tri.length - 1; i++) {
            res[i - 1] = tri[i][0];
            res[res.length - i] = tri[i][tri[i].length - 1];
        }
        if (tri[tri.length - 1].length === 1) {
            const p = tri[tri.length - 1][0];
            res[tri.length - 2] = p;
            res[res.length - tri.length + 1] = p;
            const z = p.vec_zero();//dont put kronecker deltas where there shouldn't be
            for (let i = tri.length - 1; i < res.length - tri.length + 1; i++) {
                res[i] = z;
            }
        } else {
            for (let i = 0; i < tri[tri.length - 1].length; i++) {
                res[i + tri.length - 2] = tri[tri.length - 1][i];
            }
        }
        const kres = Array<number>(times).fill(t);

        this.control_points.splice(k - o + 1, o - 2, ...res);
        this.knot_vec.splice(region, 0, ...kres);
        return region;
    }
    CDB_triangle(k: number, p: number, t: number, h = Infinity): T[][] {
        const res: T[][] = [];
        res[0] = Array<T>(p + 1);
        for (let i = 0; i < res[0].length; i++) {
            res[0][i] = this.control_points[k + i];
        }
        for (let r = 1; r <= p && r <= h; r++) {
            res[r] = Array<T>(p + 1 - r);
            for (let i = 0; i < res[r].length; i++) {
                const bi = k + i + r;
                const s = p - r + 1;
                const an = (t - this.knot_vec[bi]);
                const ad = (this.knot_vec[bi + s] - this.knot_vec[bi]);
                const a = (ad != 0) ? an / ad : 0;
                res[r][i] = res[r - 1][i].vec_lerp(res[r - 1][i + 1], a);
            }
        }
        return res;
    }
    support_net(t: number, h = Infinity): T[][] {
        const o = this.order;
        const region = ascending_search_right(this.knot_vec, t);
        const k = Math.max(o, Math.min(this.knot_vec.length - o, region));
        return this.CDB_triangle(k - o, o - 1, t, h);
    }
    effected_region(k: number): { start: number, end: number } {
        const p = this.order - 1;
        return { start: this.knot_vec[Math.max(0, k - p)], end: this.knot_vec[Math.min(this.knot_vec.length, k + p + 1)] };
    }

    bisect(t: number): { low: B_Spline<T>, high: B_Spline<T> } {
        const p = this.order - 1;
        const c = this.vec_copy();
        const r = c.insert_knot(t, p);
        const l = c.control_points.length;
        const low = new B_Spline<T>(c.control_points.slice(0, Math.max(p, r)), c.knot_vec.slice(0, Math.max(p, r + p + 1)));
        const high = new B_Spline<T>(c.control_points.slice(Math.min(r - 1, l - p - 1)), c.knot_vec.slice(Math.min(r + p, l)));
        return { low: low, high: high };
    }

    // https://www.cs.utexas.edu/~huangqx/cagd2005_degree.pdf
    //  ^ could be useful
    rle_knot_vec(): { u: number[], z: number[] } {
        const u: number[] = [this.knot_vec[0]];
        const z: number[] = [1];

        for (let i = 1; i < this.knot_vec.length; i++) {
            if (float_near(u[u.length - 1], this.knot_vec[i], B_Spline.EPSILON)) {
                z[z.length - 1]++;
            } else {
                u.push(this.knot_vec[i]);
                z.push(1);
            }
        }
        return { u: u, z: z };
    }

    degree_elevate_and_insert_knots(m: number, t: number[], times: number[]): B_Spline<T> {
        const konsts = Array<{ l: number, h: number, c: T }>(this.order - 1);
        let curv: B_Spline<T> = this;
        for (let i = 0; i < konsts.length; i++) {
            const r = curv.curve_derivative();
            konsts[i] = r.trimmed_knots;
            curv = r.curve;
        }
        //degree elevate the constant curve
        const kre = curv.rle_knot_vec();
        const rp = new Array<T>(curv.control_points.length + m * (kre.u.length - 1));
        const rk = new Array<number>(curv.knot_vec.length + m * (kre.u.length));
        let ri = 0, si = 0;
        for (let i = 0; i < kre.u.length - 1; i++) {
            for (let j = 0; j < kre.z[i]; j++) {
                rp[ri] = curv.control_points[si];
                rk[ri] = curv.knot_vec[si];
                ri++;
                si++;
            }
            for (let j = 0; j < m; j++) {
                rp[ri] = rp[ri - 1];
                rk[ri] = rk[ri - 1];
                ri++;
            }
        }
        for (let j = 0; j < kre.z[kre.z.length - 1] - 1; j++) {
            rp[ri] = curv.control_points[si];
            rk[ri] = curv.knot_vec[si];
            ri++;
            si++;
        }
        rk[ri] = curv.knot_vec[si];
        ri++;
        for (let j = 0; j < m; j++) {
            rk[ri] = rk[ri - 1];
            ri++;
        }

        curv.knot_vec = rk;
        curv.control_points = rp;


        //insert the knots
        for (let i = 0; i < t.length; i++) {
            curv.insert_knot(t[i], times[i]);
        }
        //re-integrate the curve
        for (let i = konsts.length - 1; i >= 0; i--) {
            curv = curv.curve_integral(konsts[i]);
        }

        return curv;

        /*//const p0: T[] = 
        const krle = this.rle_knot_vec();
        const u: number[] = [];
        const z: number[] = [];
        for (let i = 0, j = 0; i < krle.z.length || j < t.length;) {
            if (i < krle.z.length && j < t.length && float_near(krle.u[i], t[j], B_Spline.EPSILON)) {
                u.push((t[j] + krle.u[i]) / 2);
                z.push(times[j] + krle.z[i] + m);
                j++;
                i++;
            } else {
                if (i >= krle.z.length || (j < t.length && t[j] < krle.u[i])) {
                    u.push(t[j]);
                    z.push(times[j]);
                    j++;
                } else {
                    u.push(krle.u[i]);
                    z.push(krle.z[i] + m);
                    i++;
                }
            }
        }

        //eqn(19)
        // P(i,j) = (P(i+1,j-1)-P(i,j-1))/(t(i+k)-t(i+l))
        //eqn(37)
        // Q(j,β˜(h)) = Q(j,β˜(h)+(k-m-1-z_i-j)`) 
        //eqn(20)

        //  β˜_l[i] = β_i = ∑(l=1...i of z_l)

        //step 1:
        //  use eqn(19) to get P(0,0...k-1) and (P(β(p),k-z_p...k-1) for p = 1...S-1)
        //step 2: set T by eqn(32) and set n = n+Sm+∑y_i
        //step 3: use thm 3 to get Q(0,0...k-1) and (Q(β(l[i]),k-z_i...k-1) for i = 1...S-1)
        // and other Q
        // then use eqns 20 and 37 to get Q(i,0)



        throw new Error("Method not implemented.");

		*/
    }
    degree_elevate(m: number): B_Spline<T> {

        return this.degree_elevate_and_insert_knots(m, [], []);
    }

    remove_knot(i: number) {

        throw new Error("Method not implemented.");
    }

    multiplicity(i: number): number {
        const k = this.knot_vec[i];
        let n = 1;
        for (let o = i - 1; o >= 0 && float_near(this.knot_vec[o], k, B_Spline.EPSILON); o--) {
            n++;
        }
        for (let o = i + 1; o < this.knot_vec.length &&
            float_near(this.knot_vec[o], k, B_Spline.EPSILON); o++) {
            n++;
        }
        return n;
    }


    // https://pages.mtu.edu/~shene/COURSES/cs3621/NOTES/spline/B-spline/bspline-derv.html
    curve_derivative(): { curve: B_Spline<T>, trimmed_knots: { l: number, h: number, c: T } } {
        const q: T[] = new Array<T>(this.control_points.length - 1);
        const kn: number[] = new Array<number>(this.knot_vec.length - 2);
        for (let i = 0; i < kn.length; i++) {
            kn[i] = this.knot_vec[i + 1];
        }
        const p = this.order - 1;
        for (let i = 0; i < q.length; i++) {
            const pt = this.control_points[i + 1].vec_sub(this.control_points[i]);
            if (float_near(this.knot_vec[i + 1 + p], this.knot_vec[i + 1], B_Spline.EPSILON)) {
                q[i] = pt;
            } else {
                const d = this.knot_vec[i + 1 + p] - this.knot_vec[i + 1];
                q[i] = pt.vec_scaleEq(p / d);
            }
        }
        return { curve: new B_Spline<T>(q, kn), trimmed_knots: { l: this.knot_vec[0], h: this.knot_vec[this.knot_vec.length - 1], c: this.control_points[0] } };
    }
    // usefuls:
    // https://cds.cern.ch/record/417816/files/CMe-P00068514.pdf
    // https://www.researchgate.net/publication/250956546_Integrating_Products_of_B-Splines
    curve_integral(trimmed_knots: { l?: number, h?: number, c?: T } = {}): B_Spline<T> {
        const tk = {
            l: (trimmed_knots.l ? trimmed_knots.l : this.knot_vec[0]),
            h: (trimmed_knots.h ? trimmed_knots.h : this.knot_vec[this.knot_vec.length - 1]),
            c: (trimmed_knots.c ? trimmed_knots.c : this.control_points[0].vec_zero())
        };

        const q: T[] = new Array<T>(this.control_points.length + 1);
        const kn: number[] = new Array<number>(this.knot_vec.length + 2);
        kn[0] = tk.l;
        kn[kn.length - 1] = tk.h;
        for (let i = 0; i < this.knot_vec.length; i++) {
            kn[i + 1] = this.knot_vec[i];
        }
        const p = this.order;
        let c = tk.c;
        q[0] = c;
        for (let i = 1; i < q.length; i++) {
            if (float_near(kn[i - 1 + p + 1], kn[i], B_Spline.EPSILON)) {
                c = this.control_points[i - 1].vec_add(c);
            } else {
                const d = kn[i - 1 + p + 1] - kn[i];
                c = this.control_points[i - 1].vec_scale(d / p).vec_addEq(c);
            }
            q[i] = c;
        }
        return new B_Spline<T>(q, kn);
    }



    vec_copy(): B_Spline<T> {
        return new B_Spline<T>([...this.control_points], [...this.knot_vec]);
    }
    vec_set(other: B_Spline<T>): B_Spline<T> {
        this.control_points = other.control_points;
        this.knot_vec = other.knot_vec;
        return this;
    }
    vec_add(other: B_Spline<T>): B_Spline<T> {

        throw new Error("Method not implemented.");
    }
    vec_scale(s: number): B_Spline<T> {
        const res = Array<T>(this.control_points.length);
        for (let i = 0; i < this.control_points.length; i++)
            res[i] = this.control_points[i].vec_scale(s);
        return new B_Spline<T>(res, [...this.knot_vec]);
    }


}
@Saveable.register
export class D_Spline<T extends Vector<any>> extends Vector<D_Spline<T>> implements Curve<T>, Saveable {
    _saveName?: string;
    constructor(public coefs: T[]) { super(); }
    get order(): number {
        return this.coefs.length - 1;
    }
    get length(): number {
        return this.coefs.length;
    }
    curve_eval(t: number): T {
        const r = this.coefs[0].vec_copy();
        let tp = t;
        for (let i = 1; i < this.length; i++) {
            r.vec_fmaEq(this.coefs[i], tp);
            tp *= t / (i + 1);
        }
        return r;
    }
    curve_derivative(t: number = 1): D_Spline<T> {
        if (t < this.length) {
            return new D_Spline(this.coefs.slice(t));
        }
        return new D_Spline([this.coefs[0].vec_zero()]);
    }
    curve_integral(t: number = 1) {
        const zero = this.coefs[0].vec_zero();
        const r: T[] = Array<T>(t).fill(zero);
        r.push(...this.coefs);
        return new D_Spline(r);
    }

    coef(i: number): T {
        return i >= this.coefs.length ? this.coefs[0].vec_zero() : this.coefs[i];
    }
    vec_add(other: D_Spline<T>): D_Spline<T> {
        const res = Array<T>(Math.max(this.length, other.length));
        for (let i = 0; i < res.length; i++)
            res[i] = i < this.length ? (i < other.length ? this.coefs[i].vec_add(other.coefs[i]) : this.coefs[i].vec_copy()) : other.coefs[i].vec_copy();
        return new D_Spline<T>(res);
    }
    vec_scale(s: number): D_Spline<T> {
        const res = Array<T>(this.length)
        for (let i = 0; i < res.length; i++)
            res[i] = this.coefs[i].vec_scale(s);
        return new D_Spline<T>(res);
    }
    vec_copy(): D_Spline<T> {
        return new D_Spline<T>([...this.coefs]);
    }
    vec_set(other: D_Spline<T>): D_Spline<T> {
        this.coefs = other.coefs;
        return this;
    }

}










