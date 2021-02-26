




export function float_dif(a: number, b: number): number {
    const dif = a - b;
    const prec = Math.abs(a) + Math.abs(b);
    if (prec == 0)
        //then a == 0 and b == 0
        return 0;
    return dif / prec;
}

export function float_near(a: number, b: number, epsilon: number): boolean {
    return Math.abs(float_dif(a, b)) <= epsilon;
}






