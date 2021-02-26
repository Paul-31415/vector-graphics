import { Vector } from "../vector/vector";
import { Saveable } from "../save";

export class NDVector extends Vector<NDVector> implements Saveable {
    _saveName?: string;
    constructor(public coefs: number[]) { super(); }
    get length(): number {
        return this.coefs.length;
    }
    coef(i: number): number {
        return i >= this.coefs.length ? 0 : this.coefs[i];
    }
    vec_add(other: NDVector): NDVector {
        const res: number[] = Array<number>(Math.max(this.length, other.length));
        for (let i = 0; i < res.length; i++)
            res[i] = this.coef(i) + other.coef(i);
        return new NDVector(res);
    }
    vec_scale(s: number): NDVector {
        const res: number[] = Array<number>(this.length)
        for (let i = 0; i < res.length; i++)
            res[i] = this.coefs[i] * s;
        return new NDVector(res);
    }
    vec_copy(): NDVector {
        return new NDVector([...this.coefs]);
    }
    vec_set(other: NDVector): NDVector {
        this.coefs = other.coefs;
        return this;
    }





    poly_mult(other: NDVector): NDVector {
        if (this.length === 0) {
            return this.vec_copy();
        }
        if (other.length === 0) {
            return other.vec_copy();
        }
        const res: number[] = Array<number>(this.length + other.length - 1).fill(0);
        for (let i = 0; i < this.length; i++) {
            for (let j = 0; j < other.length; j++) {
                res[i + j] += this.coefs[i] * other.coefs[j];
            }
        }
        return new NDVector(res);
    }
    poly_eval(x: number): number {
        const m = x;
        x = 1;
        let ans = 0;
        for (let i = 0; i < this.length; i++) {
            ans += x * this.coefs[i];
            x *= m;
        }
        return ans;
    }
    shift(n: number): NDVector {
        const res = Array<number>(Math.max(0, this.length + n)).fill(0);
        for (let i = Math.max(0, n); i < this.length + n; i++) {
            res[i] = this.coefs[i - n];
        }
        return new NDVector(res);
    }

}
export class NDVecVec<T extends Vector<any>> extends Vector<NDVecVec<T>> implements Saveable {
    _saveName?: string;
    vec_add(other: NDVecVec<T>): NDVecVec<T> {
        throw new Error("Method not implemented.");
    } vec_scale(s: number): NDVecVec<T> {
        throw new Error("Method not implemented.");
    }
    vec_copy(): NDVecVec<T> {
        throw new Error("Method not implemented.");
    }
    vec_set(other: NDVecVec<T>): NDVecVec<T> {
        throw new Error("Method not implemented.");
    }



}
