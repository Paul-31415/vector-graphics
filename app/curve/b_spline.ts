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
        const b = this.basis(t);
        const v = this.control_points[b.start].vec_scale(b.weights[0]) as T;
        for (let i = 1; i < b.weights.length; i++)
            v.vec_fmaEq(this.control_points[b.start + i], b.weights[i]);
        return v;
    }
    basis(t: number): { start: number, weights: number[] } {
        const o = this.order;
        const region = ascending_search_right(this.knot_vec, t);
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
                const A = (ad != 0) ? an / ad : (an >= 0 ? 1 : 0);
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
    insert_knot(t: number, times: number = 1) {
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
            for (let i = tri.length - 2; i <= res.length - tri.length + 1; i++) {
                res[i] = p;
            }
        } else {
            for (let i = 0; i < tri[tri.length - 1].length; i++) {
                res[i + tri.length - 2] = tri[tri.length - 1][i];
            }
        }
        const kres = Array<number>(times).fill(t);

        this.control_points.splice(k - o + 1, o - 2, ...res);
        this.knot_vec.splice(region, 0, ...kres);
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
                const a = (ad != 0) ? an / ad : (an >= 0 ? 1 : 0);
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











