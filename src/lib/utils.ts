export function calcWidth(): number {
    return window?.innerWidth || 100
}

export function calcHeight(): number {
    return window?.innerHeight || 100
}

export function randMinMax(min: number, max: number): number {
    return min + (Math.random() * (max - min))
}
