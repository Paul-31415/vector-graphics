import { Vector } from "../vector/vector";
import { Curve } from "./curve";
import { Saveable } from "../save";
import { ascending_search_right } from "../tools/binary_search";




@Saveable.register
export class NURBS<T extends Vector<any>> extends Vector<NURBS<T>> implements Curve<T>, Saveable {
    _saveName?: string;
    constructor(public control_points: T[], public weights: number[], public knot_vec: number[]) { super(); }
    get order(): number {
        return this.knot_vec.length - this.control_points.length;
    }
    curve_eval(t: number): T {
        const b = this.basis(t);
        let w = this.weights[b.start] * b.weights[0];
        let v = this.control_points[b.start].vec_scale(b.weights[0]);
        for (let i = 1; i < b.weights.length; i++) {
            w += this.weights[b.start + i] * b.weights[i];
            v.vec_addEQD(b.weights[i]);
        }
        return v.vec_scaleEQ(1 / w);
    }
    basis(t: number): { start: number, weights: number[] } {
        const p = this.order - 1;
        const region = ascending_search_right(this.knot_vec, t) - 1;
        // i in [1,p], j in [0,i-1]
        //  high access: k + i  = k + p
        //  low access: k - j = k - (p - 1)
        // so, for access to be from 0 to this.knot_vec.length-1,
        //       k must be in [p-1,this.knot_vec.length-p-1]
        const k = Math.max(p - 1, Math.min(this.knot_vec.length - p - 1, region));
        const bweights = this.basis_ITS(k, p, t);
        return { start: region - (p - 1), weights: bweights };
    }
    basis_ITS(k: number, p: number, u: number): number[] {
        //inverted triangular scheme from here:
        // https://www.researchgate.net/publication/228411721_Time-Efficient_NURBS_Curve_Evaluation_Algorithms
        //
        // Basis_ITS1(k, p, u)
        const N: number[] = Array<number>(p);
        // 1. N[0] = 1
        N[0] = 1;
        // 2. for (i = 1; i <= p; i++)
        for (let i = 1; i <= p; i++) {
            // 2.1. for j = i - 1; j >= 0; j--)
            for (let j = i - 1; j >= 0; j--) {
                // 2.1.1. A = (u - knots[k - j]) /   
                //           (knots[k + i - j] - knots[k - j]) 
                const A = (u - this.knot_vec[k - j]) / (this.knot_vec[k + i - j] - this.knot_vec[k - j]);
                // 2.1.2. tmp = N[j] * A
                const tmp = N[j] * A;
                //2.1.3. N[j + 1] += N[j] - tmp
                N[j + 1] += N[j] - tmp;
                //2.1.4. N[j] = tmp
                N[j] = tmp;
            }
        }
        // 3. return N
        return N;
    }
	/*
    // https://pages.mtu.edu/~shene/COURSES/cs3621/NOTES/spline/B-spline/de-Boor.html
    DeBoor_weights(k: number, p: number, u: number, n: number): number[][][] {
        const res: number[][][] = [[Array<number>(p).fill(1)]];
        for (let i = 1; i < n; i++) {
            res[i] = Array<Array<number>>(i + 1);
            for (let j = 0; j < p - i; j++) {
                res[i][j] = Array<number>(i + 1);
                res[i][j][0] = ;
                for (let t = 0; t < i; t++) {

                    res[i][j][t] += res[i - 1][j][t] * (this.knot_vec[]);
                    res[i][j][t + 1] += res[i - 1][j + 1][t] * (this.knot_vec[]);
                }
            }
        }
        return res;
    }
    insert_knot(t: number) {
        const region = ascending_search_right(this.knot_vec, t) - 1;

    }

	*/
    vec_copy(): NURBS<T> {
        return new NURBS<T>([...this.control_points], [...this.weights], [...this.knot_vec]);
    }
    vec_set(other: NURBS<T>): NURBS<T> {
        this.control_points = other.control_points;
        this.weights = other.weights;
        this.knot_vec = other.knot_vec;
        return this;
    }
    vec_add(other: NURBS<T>): NURBS<T> {
        throw new Error("Method not implemented.");
    }
    vec_scale(s: number): NURBS<T> {
        const res = Array<T>(this.control_points.length);
        const wres = Array<number>(res.length);
        for (let i = 0; i < this.control_points.length; i++) {
            res[i] = this.control_points[i].vec_scale(s);
            wres[i] = this.weights[i] * s;
        }
        return new NURBS<T>(res, wres, [...this.knot_vec]);
    }






}











