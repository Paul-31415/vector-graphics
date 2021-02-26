
//returns an index i into arr with arr[i] >= val
// and if >, then i is minimum such index
export function ascending_search_right(arr: number[], val: number, low = 0, high = Infinity): number {
    low = Math.max(0, Math.floor(low));
    high = Math.min(Math.floor(high), arr.length - 1);
    while (low <= high) {
        const mid = Math.floor((high + low) / 2);//avoid bit ops because they cast to int32
        const v = arr[mid];
        if (v < val)
            low = mid + 1;
        else if (v == val)
            return mid;
        else
            high = mid - 1
    }
    return low;
}
/* hand runs:
    0 1 2 3 4 5 6 7
    0 2 3 6 6 7 8 9
6   ^     m       ^ -> 3
6.1 ^     m       ^
            ^ m   ^
            ^ r     -> 5
5.9 ^     m       ^
    ^ m ^
        ^ r         -> 3
9   ^     m       ^
            ^ m   ^
                ^ ^
                  ^ -> 7
9.1 ^     m       ^
            ^ m   ^
                ^ ^
                  ^ r -> 8
-1  ^     m       ^
    ^ m ^
    ^
  ^ ^                 -> 0
*/

export function descending_search_right(arr: number[], val: number, low = 0, high = Infinity): number {
    low = Math.max(0, Math.floor(low));
    high = Math.min(Math.floor(high), arr.length - 1);
    while (low <= high) {
        const mid = Math.floor((high + low) / 2);//avoid bit ops because they cast to int32
        const v = arr[mid];
        if (v > val)
            low = mid + 1;
        else if (v == val)
            return mid;
        else
            high = mid - 1
    }
    return low;
}
