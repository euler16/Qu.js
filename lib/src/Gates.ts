/* { creg: { name: creg, bit: cbit } } */
export interface cReg {
    name: string;
    bit: number; // probably
};
export interface Options {
    creg?: cReg;
    condition?:any;
};
export interface Gate {
    id: string;
    name: string;
    connector: number;
    options?: Options;
};