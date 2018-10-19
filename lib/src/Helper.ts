import * as math from 'mathjs';

export function randomStr(length: number = 17): string {
    let text: string = "";
    let charset: string = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";
    text += charset.charAt(Math.floor(Math.random() * charset.length));
    charset += "0123456789";

    for (let i = 0; i < length; i++) {
        text += charset.charAt(Math.floor(Math.random() * charset.length));
    }

    return text;
}

export function formatComplex2(re: number, im: number) {
    // output a formatted complex number    
    let xre = math.round(re, 8);
    let xim = math.round(im, 8);
    return (xre >= 0 ? " " : "-") + math.abs(xre).toFixed(8) + (xim >= 0 ? "+" : "-") + math.abs(xim).toFixed(8) + "i";
};

export function formatComplex(complex: any) {
    return formatComplex2(complex.re, complex.im);
};

export function zeroes(n: number): number[][] {
    let matrix: number[][] = [];
    for (let i = 0; i < n; i++) {
        matrix[i] = [];
        for (let j = 0; j < n; j++) {
            matrix[i][j] = 0;
        }
    }
    return matrix;
};

export function identityMatrix(n: number): number[][] {
    let matrix: number[][] = [];
    for (let i = 0; i < n; i++) {
        matrix[i] = [];
        for (let j = 0; j < n; j++) {
            matrix[i][j] = j == i ? 1 : 0;
        }
    }
    return matrix;
};

export function makeControlled(U: number[][]): number[][] {
    let m = U.length;
    let C = identityMatrix(m * 2);
    for (let i = 0; i < m; i++) {
        for (let j = 0; j < m; j++) {
            C[i + m][j + m] = U[i][j];
        }
    }
    return C;
};