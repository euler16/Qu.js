import * as math from 'mathjs';
import * as Qasm from '../qasm_files/QASMImport.js';
//import * as Gates from './gates';


function randomStr(length:number=17):string {
    let text: string = "";
    let charset:string = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";
    text += charset.charAt(Math.floor(Math.random() * charset.length));
    charset += "0123456789";

    for (let i = 0; i < length; i++) {
        text += charset.charAt(Math.floor(Math.random() * charset.length));
    }

    return text;
}

function formatComplex2(re:number, im:number) {
    // output a formatted complex number    
    let xre = math.round(re, 8);
    let xim = math.round(im, 8);
    return (xre >= 0 ? " " : "-") + math.abs(xre).toFixed(8) + (xim >= 0 ? "+" : "-") + math.abs(xim).toFixed(8) + "i";
};

function formatComplex(complex) {
    return formatComplex2(complex.re, complex.im);
};

function zeroes(n:number):number[][] {
    let matrix:number[][] = [];
    for (let i = 0; i < n; i++) {
        matrix[i] = [];
        for (let j = 0; j < n; j++) {
            matrix[i][j] = 0;
        }
    }
    return matrix;
};

function identityMatrix (n:number):number[][] {
    let matrix:number[][] = [];
    for (let i = 0; i < n; i++) {
        matrix[i] = [];
        for (let j = 0; j < n; j++) {
            matrix[i][j] = j == i ? 1 : 0;
        }
    }
    return matrix;
};

function makeControlled (U:number[][]):number[][] {
    let m = U.length;
    let C = identityMatrix(m * 2);
    for (let i = 0; i < m; i++) {
        for (let j = 0; j < m; j++) {
            C[i + m][j + m] = U[i][j];
        }
    }
    return C;
};

class QuantumCircuit {
    
    static basicGates:object = {
        id: {
            description: "Single qubit identity gate",
            matrix: [
                [1, 0],
                [0, 1]
            ],
            params: [],
            drawingInfo: {
                connectors: ["box"],
                label: "..."
            },
            exportInfo: {
                quil: {
                    name: "I"
                }
            }
        },

        x: {
            description: "Pauli X (PI rotation over X-axis) aka \"NOT\" gate",
            matrix: [
                [0, 1],
                [1, 0]
            ],
            params: [],
            drawingInfo: {
                connectors: ["not"],
                label: "X"
            },
            exportInfo: {
                quil: {
                    name: "X"
                }
            }
        },

        y: {
            description: "Pauli Y (PI rotation over Y-axis)",
            matrix: [
                [0, "multiply(-1, i)"],
                ["i", 0]
            ],
            params: [],
            drawingInfo: {
                connectors: ["box"],
                label: "Y"
            },
            exportInfo: {
                quil: {
                    name: "Y"
                }
            }
        },

        z: {
            description: "Pauli Z (PI rotation over Z-axis)",
            matrix: [
                [1, 0],
                [0, -1]
            ],
            params: [],
            drawingInfo: {
                connectors: ["box"],
                label: "Z"
            },
            exportInfo: {
                quil: {
                    name: "Z"
                }
            }
        },

        h: {
            description: "Hadamard gate",
            matrix: [
                ["1 / sqrt(2)", "1 / sqrt(2)"],
                ["1 / sqrt(2)", "0 - (1 / sqrt(2))"]
            ],
            params: [],
            drawingInfo: {
                connectors: ["box"],
                label: "H"
            },
            exportInfo: {
                quil: {
                    name: "H"
                }
            }
        },

        srn: {
            description: "Square root of NOT",
            matrix: [
                ["1 / sqrt(2)", "-1 / sqrt(2)"],
                ["-1 / sqrt(2)", "1 / sqrt(2)"]
            ],
            params: [],
            drawingInfo: {
                connectors: ["box"],
                label: ""
            },
            exportInfo: {

            }
        },

        r2: {
            description: "PI/2 rotation over Z-axis aka \"Phase PI/2\"",
            matrix: [
                [1, 0],
                [0, "pow(e, multiply(i, PI / 2))"]
            ],
            params: [],
            drawingInfo: {
                connectors: ["box"],
                label: "R2"
            },

            exportInfo: {
                quil: {
                    replacement: {
                        name: "s"
                    }
                }
            }
        },

        r4: {
            description: "PI/4 rotation over Z-axis aka \"Phase PI/4\"",
            matrix: [
                [1, 0],
                [0, "pow(e, multiply(i, PI / 4))"]
            ],
            params: [],
            drawingInfo: {
                connectors: ["box"],
                label: "R4"
            },
            exportInfo: {
                quil: {
                    replacement: {
                        name: "t"
                    }
                }
            }
        },

        r8: {
            description: "PI/8 rotation over Z-axis aka \"Phase PI/8\"",
            matrix: [
                [1, 0],
                [0, "pow(e, multiply(i, PI / 8))"]
            ],
            params: [],
            drawingInfo: {
                connectors: ["box"],
                label: "R8;"
            },
            exportInfo: {
                quil: {
                    replacement: {
                        name: "rz",
                        params: {
                            phi: "pi/8"
                        }
                    }
                }
            }
        },

        rx: {
            description: "Rotation around the X-axis by given angle",
            matrix: [
                ["cos(theta / 2)", "multiply(-i, sin(theta / 2))"],
                ["multiply(-i, sin(theta / 2))", "cos(theta / 2)"]
            ],
            params: ["theta"],
            drawingInfo: {
                connectors: ["box"],
                label: "RX"
            },
            exportInfo: {
                quil: {
                    name: "RX",
                    params: ["theta"]
                }
            }
        },

        ry: {
            description: "Rotation around the Y-axis by given angle",
            matrix: [
                ["cos(theta / 2)", "multiply(-1, sin(theta / 2))"],
                ["sin(theta / 2)", "cos(theta / 2)"]
            ],
            params: ["theta"],
            drawingInfo: {
                connectors: ["box"],
                label: "RY"
            },
            exportInfo: {
                quil: {
                    name: "RY",
                    params: ["theta"]
                }
            }
        },

        rz: {
            description: "Rotation around the Z-axis by given angle",
            matrix: [
                [1, 0],
                [0, "pow(e, multiply(i, phi))"]
            ],
            params: ["phi"],
            drawingInfo: {
                connectors: ["box"],
                label: "RZ"
            },
            exportInfo: {
                quil: {
                    name: "RZ",
                    params: ["phi"]
                }
            }
        },

        u1: {
            description: "1-parameter 0-pulse single qubit gate",
            matrix: [
                [1, 0],
                [0, "pow(e, multiply(i, lambda))"]
            ],
            params: ["lambda"],
            drawingInfo: {
                connectors: ["box"],
                label: "U1"
            },
            exportInfo: {
                quil: {
                    name: "PHASE",
                    params: ["lambda"]
                }
            }
        },

        u2: {
            description: "2-parameter 1-pulse single qubit gate",
            matrix: [
                ["1 / sqrt(2)", "pow(-e, multiply(i, lambda)) / sqrt(2)"],
                ["pow(e, multiply(i, phi)) / sqrt(2)", "pow(e, multiply(i, lambda) + multiply(i, phi)) / sqrt(2)"]
            ],
            params: ["phi", "lambda"],
            drawingInfo: {
                connectors: ["box"],
                label: "U2"
            },
            exportInfo: {
                quil: {
                    name: "u2",
                    params: ["phi", "lambda"],
                    defgate: "DEFGATE u2(%phi, %lambda):\n    1 / sqrt(2), -exp(i * %lambda) * 1 / sqrt(2)\n    exp(i * %phi) * 1 / sqrt(2), exp(i * %lambda + i * %phi) * 1 / sqrt(2)"
                },
                pyquil: {
                    name: "u2",
                    params: ["phi", "lambda"],
                    array: "[[1/quil_sqrt(2),-quil_exp(1j*p_lambda)*1/quil_sqrt(2)],[quil_exp(1j*p_phi)*1/quil_sqrt(2),quil_exp(1j*p_lambda+1j*p_phi)*1/quil_sqrt(2)]]"
                }
            }
        },

        u3: {
            description: "3-parameter 2-pulse single qubit gate",
            matrix: [
                ["cos(theta / 2)", "pow(-e, multiply(i, lambda)) * sin(theta / 2)"],
                ["pow(e, multiply(i, phi)) * sin(theta / 2)", "pow(e, multiply(i, lambda) + multiply(i, phi)) * cos(theta / 2)"]
            ],
            params: ["theta", "phi", "lambda"],
            drawingInfo: {
                connectors: ["box"],
                label: "U3"
            },
            exportInfo: {
                quil: {
                    name: "u3",
                    params: ["theta", "phi", "lambda"],
                    defgate: "DEFGATE u3(%theta, %phi, %lambda):\n    cos(%theta / 2), -exp(i * %lambda) * sin(%theta / 2)\n    exp(i * %phi) * sin(%theta / 2), exp(i * %lambda + i * %phi) * cos(%theta / 2)"
                },
                pyquil: {
                    name: "u3",
                    params: ["theta", "phi", "lambda"],
                    array: "[[quil_cos(p_theta/2),-quil_exp(1j*p_lambda)*quil_sin(p_theta/2)],[quil_exp(1j*p_phi)*quil_sin(p_theta/2),quil_exp(1j*p_lambda+1j*p_phi)*quil_cos(p_theta/2)]]"
                }
            }
        },

        s: {
            description: "PI/2 rotation over Z-axis (synonym for `r2`)",
            matrix: [
                [1, 0],
                [0, "pow(e, multiply(i, PI / 2))"]
            ],
            params: [],
            drawingInfo: {
                connectors: ["box"],
                label: "S"
            },
            exportInfo: {
                quil: {
                    name: "S"
                }
            }
        },

        t: {
            description: "PI/4 rotation over Z-axis (synonym for `r4`)",
            matrix: [
                [1, 0],
                [0, "pow(e, multiply(i, PI / 4))"]
            ],
            params: [],
            drawingInfo: {
                connectors: ["box"],
                label: "T"
            },
            exportInfo: {
                quil: {
                    name: "T"
                }
            }
        },

        sdg: {
            description: "(-PI/2) rotation over Z-axis",
            matrix: [
                [1, 0],
                [0, "pow(e, multiply(i, (-1 * PI) / 2))"]
            ],
            params: [],
            drawingInfo: {
                connectors: ["box"],
                label: "-S"
            },
            exportInfo: {
                quil: {
                    replacement: {
                        name: "rz",
                        params: {
                            phi: "-pi/2"
                        }
                    }
                }
            }
        },

        tdg: {
            description: "(-PI/4) rotation over Z-axis",
            matrix: [
                [1, 0],
                [0, "pow(e, multiply(i, (-1 * PI) / 4))"]
            ],
            params: [],
            drawingInfo: {
                connectors: ["box"],
                label: "-T"
            },
            exportInfo: {
                quil: {
                    replacement: {
                        name: "rz",
                        params: {
                            phi: "-pi/4"
                        }
                    }
                }
            }
        },

        swap: {
            description: "Swaps the state of two qubits.",
            matrix: [
                [1, 0, 0, 0],
                [0, 0, 1, 0],
                [0, 1, 0, 0],
                [0, 0, 0, 1]
            ],
            params: [],
            drawingInfo: {
                connectors: ["x", "x"],
                label: ""
            },
            exportInfo: {
                quil: {
                    name: "SWAP"
                }
            }
        },

        srswap: {
            description: "Square root of swap",
            matrix: [
                [1, 0, 0, 0],
                [0, "multiply(0.5, add(1, i))", "multiply(0.5, subtract(1, i))", 0],
                [0, "multiply(0.5, subtract(1, i))", "multiply(0.5, add(1, i))", 0],
                [0, 0, 0, 1]
            ],
            params: [],
            drawingInfo: {
                connectors: ["box", "box"],
                label: ""
            },
            exportInfo: {

            }
        },

        cx: {
            description: "Controlled Pauli X (PI rotation over X-axis) aka \"CNOT\" gate",
            matrix: [
                [1, 0, 0, 0],
                [0, 1, 0, 0],
                [0, 0, 0, 1],
                [0, 0, 1, 0]
            ],
            params: [],
            drawingInfo: {
                connectors: ["dot", "not"],
                label: "X"
            },
            exportInfo: {
                quil: {
                    name: "CNOT"
                }
            }
        },

        cy: {
            description: "Controlled Pauli Y (PI rotation over Y-axis)",
            matrix: [
                [1, 0, 0, 0],
                [0, 1, 0, 0],
                [0, 0, 0, "multiply(-1, i)"],
                [0, 0, "i", 0]
            ],
            params: [],
            drawingInfo: {
                connectors: ["dot", "box"],
                label: "Y"
            },
            exportInfo: {

            }
        },

        cz: {
            description: "Controlled Pauli Z (PI rotation over Z-axis)",
            matrix: [
                [1, 0, 0, 0],
                [0, 1, 0, 0],
                [0, 0, 1, 0],
                [0, 0, 0, -1]
            ],
            params: [],
            drawingInfo: {
                connectors: ["dot", "box"],
                label: "Z"
            },
            exportInfo: {
                quil: {
                    name: "CZ"
                }
            }
        },

        ch: {
            description: "Controlled Hadamard gate",
            matrix: [
                [1, 0, 0, 0],
                [0, 1, 0, 0],
                [0, 0, "1 / sqrt(2)", "1 / sqrt(2)"],
                [0, 0, "1 / sqrt(2)", "0 - (1 / sqrt(2))"]
            ],
            params: [],
            drawingInfo: {
                connectors: ["dot", "box"],
                label: "H"
            },
            exportInfo: {

            }
        },

        csrn: {
            description: "Controlled square root of NOT",
            matrix: [
                [1, 0, 0, 0],
                [0, 1, 0, 0],
                [0, 0, "1 / sqrt(2)", "-1 / sqrt(2)"],
                [0, 0, "-1 / sqrt(2)", "1 / sqrt(2)"]
            ],
            params: [],
            drawingInfo: {
                connectors: ["dot", "box"],
                label: ""
            },
            exportInfo: {

            }
        },

        cr2: {
            description: "Controlled PI/2 rotation over Z-axis",
            matrix: [
                [1, 0, 0, 0],
                [0, 1, 0, 0],
                [0, 0, 1, 0],
                [0, 0, 0, "pow(e, multiply(i, PI / 2))"]
            ],
            params: [],
            drawingInfo: {
                connectors: ["dot", "box"],
                label: "R2"
            },
            exportInfo: {
                quil: {
                    replacement: {
                        name: "crz",
                        params: {
                            phi: "pi/2"
                        }
                    }
                }
            }
        },

        cr4: {
            description: "Controlled PI/4 rotation over Z-axis",
            matrix: [
                [1, 0, 0, 0],
                [0, 1, 0, 0],
                [0, 0, 1, 0],
                [0, 0, 0, "pow(e, multiply(i, PI / 4))"]
            ],
            params: [],
            drawingInfo: {
                connectors: ["dot", "box"],
                label: "R4"
            },
            exportInfo: {
                quil: {
                    replacement: {
                        name: "crz",
                        params: {
                            phi: "pi/4"
                        }
                    }
                }
            }
        },

        cr8: {
            description: "Controlled PI/8 rotation over Z-axis",
            matrix: [
                [1, 0, 0, 0],
                [0, 1, 0, 0],
                [0, 0, 1, 0],
                [0, 0, 0, "pow(e, multiply(i, PI / 8))"]
            ],
            params: [],
            drawingInfo: {
                connectors: ["dot", "box"],
                label: "R8"
            },
            exportInfo: {
                quil: {
                    replacement: {
                        name: "crz",
                        params: {
                            phi: "pi/8"
                        }
                    }
                }
            }
        },

        crx: {
            description: "Controlled rotation around the X-axis by given angle",
            matrix: [
                [1, 0, 0, 0],
                [0, 1, 0, 0],
                [0, 0, "cos(theta / 2)", "multiply(-i, sin(theta / 2))"],
                [0, 0, "multiply(-i, sin(theta / 2))", "cos(theta / 2)"]
            ],
            params: ["theta"],
            drawingInfo: {
                connectors: ["dot", "not"],
                label: "RX"
            },
            exportInfo: {

            }
        },

        cry: {
            description: "Controlled rotation around the Y-axis by given angle",
            matrix: [
                [1, 0, 0, 0],
                [0, 1, 0, 0],
                [0, 0, "cos(theta / 2)", "multiply(-1, sin(theta / 2))"],
                [0, 0, "sin(theta / 2)", "cos(theta / 2)"]
            ],
            params: ["theta"],
            drawingInfo: {
                connectors: ["dot", "box"],
                label: "RY"
            },
            exportInfo: {

            }
        },

        crz: {
            description: "Controlled rotation around the Z-axis by given angle",
            matrix: [
                [1, 0, 0, 0],
                [0, 1, 0, 0],
                [0, 0, 1, 0],
                [0, 0, 0, "pow(e, multiply(i, phi))"]
            ],
            params: ["phi"],
            drawingInfo: {
                connectors: ["dot", "box"],
                label: "RZ"
            },
            exportInfo: {
                quil: {
                    name: "CPHASE",
                    params: ["phi"]
                }
            }
        },

        cu1: {
            description: "Controlled 1-parameter 0-pulse single qubit gate",
            matrix: [
                [1, 0, 0, 0],
                [0, 1, 0, 0],
                [0, 0, 1, 0],
                [0, 0, 0, "pow(e, multiply(i, lambda))"]
            ],
            params: ["lambda"],
            drawingInfo: {
                connectors: ["dot", "box"],
                label: "CU1"
            },
            exportInfo: {
                quil: {
                    name: "CPHASE",
                    params: ["lambda"]
                }
            }
        },

        cu2: {
            description: "Controlled 2-parameter 1-pulse single qubit gate",
            matrix: [
                [1, 0, 0, 0],
                [0, 1, 0, 0],
                [0, 0, "1 / sqrt(2)", "pow(-e, multiply(i, lambda)) / sqrt(2)"],
                [0, 0, "pow(e, multiply(i, phi)) / sqrt(2)", "pow(e, multiply(i, lambda) + multiply(i, phi)) / sqrt(2)"]
            ],
            params: ["phi", "lambda"],
            drawingInfo: {
                connectors: ["dot", "box"],
                label: "CU2"
            },
            exportInfo: {
                quil: {
                    name: "cu2",
                    params: ["phi", "lambda"],
                    defgate: "DEFGATE cu2(%phi, %lambda):\n    1, 0, 0, 0\n    0, 1, 0, 0\n    0, 0, 1 / sqrt(2), -exp(i * %lambda) * 1 / sqrt(2)\n    0, 0, exp(i * %phi) * 1 / sqrt(2), exp(i * %lambda + i * %phi) * 1 / sqrt(2)"
                },
                pyquil: {
                    name: "cu2",
                    params: ["phi", "lambda"],
                    array: "[[1,0,0,0],[0,1,0,0],[0, 0, 1/quil_sqrt(2), -quil_exp(1j*p_lambda)*1/quil_sqrt(2)],[0, 0, quil_exp(1j*p_phi)*1/quil_sqrt(2), quil_exp(1j*p_lambda+1j*p_phi)*1/quil_sqrt(2)]]"
                }
            }
        },

        cu3: {
            description: "Controlled 3-parameter 2-pulse single qubit gate",
            matrix: [
                [1, 0, 0, 0],
                [0, 1, 0, 0],
                [0, 0, "cos(theta / 2)", "pow(-e, multiply(i, lambda)) * sin(theta / 2)"],
                [0, 0, "pow(e, multiply(i, phi)) * sin(theta / 2)", "pow(e, multiply(i, lambda) + multiply(phi, lambda)) * cos(theta / 2)"]
            ],
            params: ["theta", "phi", "lambda"],
            drawingInfo: {
                connectors: ["dot", "box"],
                label: "CU3"
            },
            exportInfo: {
                quil: {
                    name: "cu3",
                    params: ["theta", "phi", "lambda"],
                    defgate: "DEFGATE cu3(%theta, %phi, %lambda):\n    1, 0, 0, 0\n    0, 1, 0, 0\n    0, 0, cos(%theta / 2), -exp(i * %lambda) * sin(%theta / 2)\n    0, 0, exp(i * %phi) * sin(%theta / 2), exp(i * %lambda + i * %phi) * cos(%theta / 2)"
                },
                pyquil: {
                    name: "cu3",
                    params: ["theta", "phi", "lambda"],
                    array: "[[1,0,0,0],[0,1,0,0],[0, 0, quil_cos(p_theta/2),-quil_exp(1j*p_lambda)*quil_sin(p_theta/2)],[0, 0, quil_exp(1j*p_phi)*quil_sin(p_theta/2),quil_exp(1j*p_lambda+1j*p_phi)*quil_cos(p_theta/2)]]"
                }
            }
        },

        cs: {
            description: "Controlled PI/2 rotation over Z-axis (synonym for `cr2`)",
            matrix: [
                [1, 0, 0, 0],
                [0, 1, 0, 0],
                [0, 0, 1, 0],
                [0, 0, 0, "pow(e, multiply(i, PI / 2))"]
            ],
            params: [],
            drawingInfo: {
                connectors: ["dot", "box"],
                label: "S"
            },
            exportInfo: {
                quil: {
                    replacement: {
                        name: "crz",
                        params: {
                            phi: "pi/2"
                        }
                    }
                }
            }
        },

        ct: {
            description: "Controlled PI/4 rotation over Z-axis (synonym for `cr4`)",
            matrix: [
                [1, 0, 0, 0],
                [0, 1, 0, 0],
                [0, 0, 1, 0],
                [0, 0, 0, "pow(e, multiply(i, PI / 4))"]
            ],
            params: [],
            drawingInfo: {
                connectors: ["dot", "box"],
                label: "T"
            },
            exportInfo: {
                quil: {
                    replacement: {
                        name: "crz",
                        params: {
                            phi: "pi/4"
                        }
                    }
                }
            }
        },

        csdg: {
            description: "Controlled (-PI/2) rotation over Z-axis",
            matrix: [
                [1, 0, 0, 0],
                [0, 1, 0, 0],
                [0, 0, 1, 0],
                [0, 0, 0, "pow(e, multiply(i, (-1 * PI) / 2))"]
            ],
            params: [],
            drawingInfo: {
                connectors: ["dot", "box"],
                label: "-S"
            },
            exportInfo: {
                quil: {
                    replacement: {
                        name: "crz",
                        params: {
                            phi: "-pi/2"
                        }
                    }
                }
            }
        },

        ctdg: {
            description: "Controlled (-PI/4) rotation over Z-axis",
            matrix: [
                [1, 0, 0, 0],
                [0, 1, 0, 0],
                [0, 0, 1, 0],
                [0, 0, 0, "pow(e, multiply(i, (-1 * PI) / 4))"]
            ],
            params: [],
            drawingInfo: {
                connectors: ["dot", "box"],
                label: "-T"
            },
            exportInfo: {
                quil: {
                    replacement: {
                        name: "crz",
                        params: {
                            phi: "-pi/4"
                        }
                    }
                }
            }
        },

        ccx: {
            description: "Toffoli aka \"CCNOT\" gate",
            matrix: [
                [1, 0, 0, 0, 0, 0, 0, 0],
                [0, 1, 0, 0, 0, 0, 0, 0],
                [0, 0, 1, 0, 0, 0, 0, 0],
                [0, 0, 0, 1, 0, 0, 0, 0],
                [0, 0, 0, 0, 1, 0, 0, 0],
                [0, 0, 0, 0, 0, 1, 0, 0],
                [0, 0, 0, 0, 0, 0, 0, 1],
                [0, 0, 0, 0, 0, 0, 1, 0]
            ],
            params: [],
            drawingInfo: {
                connectors: ["dot", "dot", "not"],
                label: "CCNOT"
            },
            exportInfo: {
                quil: {
                    name: "CCNOT"
                }
            }
        },

        cswap: {
            description: "Controlled swap aka \"Fredkin\" gate",
            matrix: [
                [1, 0, 0, 0, 0, 0, 0, 0],
                [0, 1, 0, 0, 0, 0, 0, 0],
                [0, 0, 1, 0, 0, 0, 0, 0],
                [0, 0, 0, 1, 0, 0, 0, 0],
                [0, 0, 0, 0, 1, 0, 0, 0],
                [0, 0, 0, 0, 0, 0, 1, 0],
                [0, 0, 0, 0, 0, 1, 0, 0],
                [0, 0, 0, 0, 0, 0, 0, 1]
            ],
            params: [],
            drawingInfo: {
                connectors: ["dot", "x", "x"],
                label: ""
            },
            exportInfo: {

            }
        },

        csrswap: {
            description: "Controlled square root of swap",
            matrix: [
                [1, 0, 0, 0, 0, 0, 0, 0],
                [0, 1, 0, 0, 0, 0, 0, 0],
                [0, 0, 1, 0, 0, 0, 0, 0],
                [0, 0, 0, 1, 0, 0, 0, 0],
                [0, 0, 0, 0, 1, 0, 0, 0],
                [0, 0, 0, 0, 0, "multiply(0.5, add(1, i))", "multiply(0.5, subtract(1, i))", 0],
                [0, 0, 0, 0, 0, "multiply(0.5, subtract(1, i))", "multiply(0.5, add(1, i))", 0],
                [0, 0, 0, 0, 0, 0, 0, 1]
            ],
            params: [],
            drawingInfo: {
                connectors: ["dot", "box", "box"],
                label: ""
            },
            exportInfo: {

            }
        },

        measure: {
            description: "Measures qubit and stores chance (0 or 1) into classical bit",
            matrix: [],
            params: [],
            drawingInfo: {
                connectors: ["gauge"],
                label: ""
            },
            exportInfo: {
                quil: {
                    name: "MEASURE"
                }
            }
        },
    };

    public numQubits: number; // number of Qubits in the circuit
    public params: object; // TODO
    public customGates: object;
    public cregs: any; // maybe Classical Registers
    public collapsed: number[];
    public prob: number[];
    public gates: object[][]; // NECESSARY
    public state: any;
    public stateBits: number;
    public stats:object;

    /**
     * 
     
    *@param {number} numQubits - number of qubits in your circuit
    *
    */
    constructor(numQubits: number = 1) {

        this.numQubits = numQubits;
        this.params = [];
        this.customGates = {};
        this.cregs = {};
        this.collapsed = [];
        this.prob = [];
        this.gates = [];
        this.clear();
    }

    clear(): void {
        for (let i = 0; i < this.numQubits; i++) {
            this.gates.push([]);
        }
        this.resetState();
    };

    resetState():void {
        // reset state
        this.state = {};
        this.stateBits = 0;

        // reset cregs
        for (let creg in this.cregs) {
            let len = this.cregs[creg].length || 0;
            this.cregs[creg] = [];
            for (let i = 0; i < len; i++) {
                this.cregs[creg].push(0);
            }
        }

        // reset measurement
        this.collapsed = [];
        this.prob = [];

        // reset statistics
        this.stats = {};
    };
    initState():void {
        this.resetState();
        this.state["0"] = math.complex(1, 0);
        this.stateBits = 0;
    };

    numAmplitudes() {
        return math.pow(2, this.numQubits);
    };

    numCols():number {
        return this.gates.length ? this.gates[0].length : 0;
    };

    numGates(decompose:boolean):number {
        let circuit = null;
        if (decompose) {
            circuit = new QuantumCircuit();
            circuit.load(this.save(true));
        } else {
            circuit = this;
        }

        let numGates:number = 0;
        let numCols:number = circuit.numCols();
        for (let column = 0; column < numCols; column++) {
            for (let wire = 0; wire < circuit.numQubits; wire++) {
                let gate = circuit.getGateAt(column, wire);
                if (gate && gate.connector == 0) {
                    numGates++;
                }
            }
        }

        return numGates;
    };

    isEmptyCell(col:number, wire:number):boolean {
        if (this.gates[wire] && this.gates[wire][col]) {
            return false;
        }

        for (let w = 0; w < this.numQubits; w++) {
            let gate = this.getGateAt(col, w);
            if (gate) {
                if (gate.name == "measure" || (gate.options && gate.options.condition && gate.options.condition.creg) || (Math.min.apply(null, gate.wires) < wire && Math.max.apply(null, gate.wires) > wire)) {
                    return false;
                }
            }
        }

        return true;
    };

    lastNonEmptyPlace(wires: number[], usingCregs: boolean): number {
        let col: number = this.numCols();
        let allEmpty: boolean = true;

        let minWire = Math.min.apply(null, wires);
        let maxWire = Math.max.apply(null, wires);

        if (usingCregs) {
            let mx = this.numQubits - 1;
            if (mx > maxWire) {
                maxWire = mx;
            }
        }

        while (allEmpty && col--) {
            for (let wire = minWire; wire <= maxWire; wire++) {
                if (!this.isEmptyCell(col, wire)) {
                    allEmpty = false;
                }
            }
        }

        return col;
    };

    addGate(gateName: string, column:number, wires: number[], options: any):void {
        let wireList = [];
        if (Array.isArray(wires)) {
            for (let i = 0; i < wires.length; i++) {
                wireList.push(wires[i]);
            }
        } else {
            // if its a single number
            wireList.push(wires);
        }

        if (column < 0) {
            column = this.lastNonEmptyPlace(wireList, gateName == "measure" || (options && options.condition && options.condition.creg)) + 1;
        }

        let numConnectors:number = wireList.length;
        let id:string = randomStr();
        for (let connector = 0; connector < numConnectors; connector++) {
            let wire = wireList[connector];

            if ((wire + 1) > this.numQubits) {
                this.numQubits = wire + 1;
            }

            while (this.gates.length < this.numQubits) {
                this.gates.push([]);
            }

            let numCols: number = this.numCols();
            if ((column + 1) > numCols) {
                numCols = column + 1;
            }

            for (let i = 0; i < this.gates.length; i++) {
                while (this.gates[i].length < numCols) {
                    this.gates[i].push(null);
                }
            }

            let gate:object = {
                id: id,
                name: gateName,
                connector: connector,
                options: {}
            }

            if (options) {
                gate.options = options;

                if (options.creg) {
                    let existingCreg = this.cregs[options.creg.name] || [];
                    let currentValue = existingCreg.length > options.creg.bit ? existingCreg[options.creg.bit] : 0;
                    this.setCregBit(options.creg.name, options.creg.bit || 0, currentValue);
                }
            }

            this.gates[wire][column] = gate;
        }
    };

    removeGate(column: number, wire: number): void {
        if (!this.gates[wire]) {
            return;
        }

        let gate = this.gates[wire][column];
        if (!gate) {
            return;
        }

        let id = gate.id;

        let numWires = this.gates[0].length;
        for (let wire = 0; wire < numWires; wire++) {
            if (this.gates[wire][column].id == id) {
                this.gates[wire][column] = null;
            }
        }
    };

    addMeasure(wire, creg, cbit):void {
        this.addGate("measure", -1, wire, { creg: { name: creg, bit: cbit } });
    };

    applyTransform(U, qubits) {
        // clone list of wires to itself (remove reference to original array)
        qubits = qubits.slice(0);

        // convert index from 0-based to end-based
        for (let i = 0; i < qubits.length; i++) {
            qubits[i] = (this.numQubits - 1) - qubits[i];
        }
        // reverse order
        qubits.reverse();

        //
        // "incMap" and "fixMap" are instructions about bit-wise operations used to calculate row and column index of destination transform matrix elements
        //
        let incMap:object[] = [];
        let fixMap:object[] = [];
        let usedCount: number = 0;
        let unusedCount: number = 0;
        for (let i = 0; i < this.numQubits; i++) {
            if (qubits.indexOf(i) < 0) {
                incMap.push({
                    and: 1 << incMap.length,
                    or: 1 << i
                });
                unusedCount++;
            } else {
                fixMap.push({
                    rowAnd: 1 << (fixMap.length + qubits.length),
                    colAnd: 1 << fixMap.length,
                    or: 1 << qubits[fixMap.length]
                });
                usedCount++;
            }
        }

        //
        // "uflat" is flatten transform matrix, only non-zero elements
        //
        let uflat = {};
        let unum: number = 0;
        let uindex: number = 0;
        U.map(function (urow) {
            urow.map(function (uval) {
                if (uval) {
                    let rowOr: number = 0;
                    let colOr: number = 0;

                    let fix: number = usedCount;
                    while (fix--) {
                        let fmap = fixMap[fix];
                        if (uindex & fmap.rowAnd) {
                            rowOr |= fmap.or;
                        }
                        if (uindex & fmap.colAnd) {
                            colOr |= fmap.or;
                        }
                    }

                    uflat[unum] = {
                        uval: uval,
                        rowOr: rowOr,
                        colOr: colOr
                    };
                    unum++;
                }
                uindex++;
            });
        });

        //
        // main loop
        //
        // current state is multiplied and stored into newState
        let newState = {};
        let newStateBits: number = 0;
        let incCount: number = (1 << unusedCount);
        while (incCount--) {
            let row: number = 0;

            let inc: number = unusedCount;
            while (inc--) {
                if (incCount & incMap[inc].and) {
                    row |= incMap[inc].or;
                }
            }

            if ((this.stateBits & row) == row) {
                let ucount = unum;
                while (ucount--) {
                    let u = uflat[ucount];

                    let i = row | u.rowOr;
                    let j = row | u.colOr;

                    let state = this.state[j];

                    if (state) {
                        if (math.equal(u.uval, 1)) {
                            newState[i] = math.add(newState[i] || math.complex(0, 0), state);
                        } else {
                            newState[i] = math.add(newState[i] || math.complex(0, 0), math.multiply(u.uval, state));
                        }
                        newStateBits |= i;
                    }
                }
            }
        }

        // replace current state with new state
        this.state = newState;
        this.stateBits = newStateBits;
    };

    applyGate(gateName:string, wires: number[], options): void {
        if (gateName == "measure") {
            if (!options.creg) {
                throw "Error: \"measure\" gate requires destination.";
            }
            this.measure(wires[0], options.creg.name, options.creg.bit);
            return;
        }

        let gate = this.basicGates[gateName];
        if (!gate) {
            console.log("Unknown gate \"" + gateName + "\".");
            return;
        }


        let rawGate = this.getRawGate(gate, options);

        this.collapsed = [];
        this.prob = [];

        this.applyTransform(rawGate, wires);
    };

    getRawGate(gate, options) {
        let rawGate = [];
        gate.matrix.map(function (row) {
            let rawGateRow:any = [];
            row.map(function (item:any): void {
                if (typeof item == "string") {
                    let params = options ? options.params || {} : {};

                    let vars: any = {};
                    gate.params.map(function (varName: string, varIndex: number) {
                        if (Array.isArray(params)) {
                            // Deprecated. For backward compatibility only. "params" should be object - not array.
                            vars[varName] = params.length > varIndex ? math.eval(params[varIndex]) : null;
                        } else {
                            vars[varName] = math.eval(params[varName]);
                        }
                    });

                    let ev = math.eval(item, vars);
                    rawGateRow.push(ev);
                } else {
                    rawGateRow.push(item);
                }
            });
            rawGate.push(rawGateRow);
        });
        return rawGate;
    };

    decompose(obj:any) {
        if (!obj.gates.length) {
            return obj;
        }

        function injectArray(a1, a2, pos) {
            return a1.slice(0, pos).concat(a2).concat(a1.slice(pos));
        }

        for (let column = 0; column < obj.gates[0].length; column++) {
            for (let wire = 0; wire < obj.numQubits; wire++) {
                let gate = obj.gates[wire][column];
                if (gate && gate.connector == 0 && !(this.basicGates[gate.name] || gate.name == "measure")) {
                    let tmp = new QuantumCircuit();
                    let custom = obj.customGates[gate.name];
                    if (custom) {
                        tmp.load(custom);
                        // ---
                        // circuit with params
                        if (tmp.params.length && gate.options && gate.options.params) {
                            let globalParams = gate.options.params;
                            for (let cc = 0; cc < tmp.gates[0].length; cc++) {
                                for (let ww = 0; ww < tmp.numQubits; ww++) {
                                    let gg = tmp.gates[ww][cc];
                                    if (gg && gg.connector == 0) {
                                        if (gg.options && gg.options.params) {
                                            for (let destParam in gg.options.params) {
                                                // parse param, replace variable with global param and assemble it back
                                                let node = math.parse(gg.options.params[destParam]);
                                                let transformed = node.transform(function (node, path, parent) {
                                                    if (node.isSymbolNode && globalParams.hasOwnProperty(node.name)) {
                                                        return math.parse("(" + globalParams[node.name] + ")");
                                                    } else {
                                                        return node;
                                                    }
                                                });
                                                gg.options.params[destParam] = transformed.toString();
                                            }
                                        }
                                    }
                                }
                            }
                        }
                        // ---

                        let decomposed = tmp.save(true);
                        let empty = [];
                        for (let i = 0; i < decomposed.gates[0].length - 1; i++) {
                            empty.push(null);
                        }

                        // shift columns right
                        for (let w = 0; w < obj.numQubits; w++) {
                            let g = obj.gates[w][column];
                            if (g && g.id == gate.id) {
                                obj.gates[w].splice(column, 1);
                                let insertGate = decomposed.gates[g.connector];
                                obj.gates[w] = injectArray(obj.gates[w], insertGate, column);
                            } else {
                                obj.gates[w] = injectArray(obj.gates[w], empty, column + 1);
                            }
                        }
                    }
                }
            }
        }

        obj.customGates = {};

        return obj;
    };

    usedGates() {
        let decomposed = new QuantumCircuit();
        decomposed.load(this.save(true));
        let used = [];
        for (let wire = 0; wire < decomposed.numQubits; wire++) {
            for (let col = 0; col < decomposed.numCols(); col++) {
                let gate = decomposed.gates[wire][col];
                if (gate && used.indexOf(gate.name) < 0) {
                    used.push(gate.name);
                }
            }
        }
        return used;
    };
    // getter
    getGateDef(name: string) {
        let gateDef = this.basicGates[name];
        if (!gateDef) {
            gateDef = this.customGates[name];
        }
        return gateDef;
    };

    save(decompose:boolean):object {
        let data: object = {
            numQubits: this.numQubits,
            params: JSON.parse(JSON.stringify(this.params)),
            gates: JSON.parse(JSON.stringify(this.gates)),
            customGates: JSON.parse(JSON.stringify(this.customGates))
        }

        if (decompose) {
            return this.decompose(data);
        } else {
            return data;
        }
    };

    load(obj:object) {
        this.numQubits = obj.numQubits || 1;
        this.clear();
        this.params = JSON.parse(JSON.stringify(obj.params || []));
        this.gates = JSON.parse(JSON.stringify(obj.gates || []));
        this.customGates = JSON.parse(JSON.stringify(obj.customGates || {}));
    };

    registerGate(name, obj) {
        this.customGates[name] = obj;
    };

    getGateAt(column: number, wire: number) {
        if (!this.gates[wire] || !this.gates[wire][column]) {
            return null;
        }

        let gate = JSON.parse(JSON.stringify(this.gates[wire][column]));
        if (!gate) {
            return null;
        }
        gate.wires = [];

        let id = gate.id;
        let numWires: number = this.gates.length;

        for (let wire = 0; wire < numWires; wire++) {
            let g = this.gates[wire][column];
            if (g && g.id == id) {
                gate.wires[g.connector] = wire;
            }
        }
        return gate;
    };

    exportQASM(comment: string, decompose: boolean, exportAsGateName) {
        let circuit = null;

        // decompose
        if (decompose) {
            circuit = new QuantumCircuit();
            circuit.load(this.save(true));
        } else {
            circuit = this;
        }

        let qasm = "";

        // comment
        if (comment) {
            let comm = (comment || "").split("\n");
            comm.map(function (cline) {
                if (cline.length >= 2 && cline[0] != "/" && cline[1] != "/") {
                    qasm += "// ";
                }
                qasm += cline;
                qasm += "\n";
            });
        }

        if (exportAsGateName) {
            qasm += "gate " + exportAsGateName;
            for (let i = 0; i < circuit.numQubits; i++) {
                if (i == 0) {
                    qasm += " ";
                }
                if (i > 0) {
                    qasm += ",";
                }
                qasm += String.fromCharCode(97 + i);
            }
            qasm += "\n{\n";
        } else {
            qasm += "OPENQASM 2.0;\n";
            qasm += "include \"qelib1.inc\";\n";
            qasm += "qreg q[" + circuit.numQubits + "];\n";

            for (let cregName in this.cregs) {
                qasm += "creg " + cregName + "[" + (this.cregs[cregName].length || 1) + "];\n";
            }

            if (!decompose) {
                for (let customGateName in this.customGates) {
                    let customGate = this.customGates[customGateName];
                    let customCircuit = new QuantumCircuit();
                    customCircuit.load(customGate);
                    qasm += customCircuit.exportQASM("", true, customGateName);
                }
            }
        }

        let numCols = circuit.numCols();
        for (let column = 0; column < numCols; column++) {
            for (let wire = 0; wire < this.numQubits; wire++) {
                let gate = circuit.getGateAt(column, wire);
                if (gate && gate.connector == 0) {
                    if (exportAsGateName) {
                        qasm += "  ";
                    }

                    if (gate.options && gate.options.condition && gate.options.condition.creg) {
                        qasm += "if(" + gate.options.condition.creg + "==" + gate.options.condition.value + ") ";
                    }

                    qasm += gate.name;

                    if (gate.options && gate.options.params) {
                        let gateDef = this.basicGates[gate.name];
                        if (!gateDef) {
                            gateDef = this.customGates[gate.name];
                        }

                        if (gateDef) {
                            let paramDef = gateDef.params || [];
                            let paramCount: number = paramDef.length;
                            if (paramCount) {
                                qasm += " (";
                                for (let p = 0; p < paramCount; p++) {
                                    let paramName = paramDef[p];
                                    qasm += gate.options.params[paramName];
                                }
                                qasm += ")";
                            }
                        }
                    }

                    for (let w = 0; w < gate.wires.length; w++) {
                        if (w > 0) {
                            qasm += ",";
                        }
                        if (exportAsGateName) {
                            qasm += " " + String.fromCharCode(97 + gate.wires[w]);
                        } else {
                            qasm += " q[" + gate.wires[w] + "]";
                        }
                    }

                    if (gate.name == "measure" && gate.options && gate.options.creg) {
                        qasm += " -> ";
                        qasm += gate.options.creg.name + "[" + gate.options.creg.bit + "]";
                    }

                    qasm += ";\n";
                }
            }
        }

        if (exportAsGateName) {
            qasm += "}\n\n";
        }

        return qasm;
    };


    importQASM(input, errorCallback) {
        this.init();
        Qasm(this, input, errorCallback);
    };


    exportPyquil(comment: string, decompose: boolean, exportAsGateName, versionStr: string="2.0") {
        let self = this;

        let version: number = parseFloat(versionStr);
        if (isNaN(version)) {
            version = 2.0;
        }

        // decompose
        let circuit = null;
        if (decompose) {
            circuit = new QuantumCircuit();
            circuit.load(this.save(true));
        } else {
            circuit = this;
        }

        let importGates = "";
        let defParams = [];
        let defGates = "";
        let defRun = "";
        let defArrays = "";
        let usedGates = circuit.usedGates();

        let defGateNames = [];
        let defCircNames = [];
        usedGates.map(function (usedGateName) {
            let basicGate = circuit.basicGates[usedGateName];
            if (basicGate) {
                if (basicGate.exportInfo && basicGate.exportInfo.pyquil) {
                    let quilInfo = basicGate.exportInfo.pyquil;
                    if (quilInfo.array) {

                        // defgate

                        let paramList: string = "";
                        if (quilInfo.params) {
                            paramList += ", [";
                            quilInfo.params.map(function (paramName, paramIndex) {
                                if (paramIndex > 0) {
                                    paramList += ", ";
                                }
                                paramList += "p_" + paramName;
                                let paramText = "p_" + paramName + " = Parameter(\'" + paramName + "\')";
                                if (defParams.indexOf(paramText) < 0) {
                                    defParams.push(paramText);
                                }
                            });
                            paramList += "]";
                        }

                        defRun += "p.inst(" + quilInfo.name + "_defgate)\n";
                        defArrays += quilInfo.name + "_array = np.array(" + quilInfo.array + ")\n";
                        defGates += quilInfo.name + "_defgate = DefGate(\'" + quilInfo.name + "\', " + quilInfo.name + "_array" + paramList + ")\n";
                        defGates += quilInfo.name + " = " + quilInfo.name + "_defgate.get_constructor()\n";

                        defGateNames.push(quilInfo.name);
                    } else {
                        let importName: string = "";
                        if (quilInfo.replacement) {
                            let bg = circuit.basicGates[quilInfo.replacement.name];
                            if (bg) {
                                if (bg.exportInfo) {
                                    if (bg.exportInfo.pyquil) {
                                        importName = bg.exportInfo.pyquil.name;
                                    } else {
                                        if (bg.exportInfo.quil) {
                                            importName = bg.exportInfo.quil.name;
                                        }
                                    }
                                }
                            }
                        } else {
                            importName = quilInfo.name;
                        }

                        if (importName) {
                            if (importGates) {
                                importGates += ", ";
                            }
                            importGates += importName;
                        }
                    }
                } else {
                    if (basicGate.exportInfo && basicGate.exportInfo.quil) {
                        let quilInfo = basicGate.exportInfo.quil;

                        if (!quilInfo.defgate) {

                            let importName: string = "";
                            if (quilInfo.replacement) {
                                let bg = circuit.basicGates[quilInfo.replacement.name];
                                if (bg) {
                                    if (bg.exportInfo) {
                                        if (bg.exportInfo.pyquil) {
                                            importName = bg.exportInfo.pyquil.name;
                                        } else {
                                            if (bg.exportInfo.quil) {
                                                importName = bg.exportInfo.quil.name;
                                            }
                                        }
                                    }
                                }
                            } else {
                                importName = quilInfo.name;
                            }

                            if (importName) {
                                if (importGates) {
                                    importGates += ", ";
                                }
                                importGates += importName;
                            }

                        }
                    } else {
                        // basic gate not supported by pyquil
                        // TODO: add pyquil define gate code
                    }
                }
            }
        });

        // import MOVE, AND, OR if circuit has conditions
        let gotConditions: boolean = false;
        for (let column = 0; column < circuit.numCols(); column++) {
            for (let wire = 0; wire < circuit.numQubits; wire++) {
                let gate = circuit.getGateAt(column, wire);
                if (gate && gate.connector == 0) {
                    if (gate.options && gate.options.condition && gate.options.condition.creg) {
                        gotConditions = true;
                    }
                }
            }
        }
        if (gotConditions) {
            if (importGates) {
                importGates += ", ";
            }
            if (version < 2) {
                importGates += "FALSE, NOT, OR, AND";
            } else {
                importGates += "MOVE, NOT, IOR, AND";
            }
        }

        let importsForDefgate: string = "";
        if (defGates) {
            importsForDefgate = "from pyquil.parameters import Parameter, quil_sin, quil_cos, quil_sqrt, quil_exp, quil_cis\nfrom pyquil.quilbase import DefGate";
        }

        let pyquil: string = "";

        // comment
        if (comment) {
            let comm = (comment || "").split("\n");
            comm.map(function (cline) {
                if (cline.length >= 1 && cline[0] != "#") {
                    pyquil += "# ";
                }
                pyquil += cline;
                pyquil += "\n";
            });
        }

        let indent: string = "";
        if (exportAsGateName) {
            let args: string = "";
            let argCount: number = 0;
            for (let i = 0; i < circuit.params.length; i++) {
                if (argCount > 0) {
                    args += ", ";
                }
                args += circuit.params[i];
                argCount++;
            }
            for (let i = 0; i < circuit.numQubits; i++) {
                if (argCount > 0) {
                    args += ", ";
                }
                args += "q" + i;
                argCount++;
            }
            pyquil += "def " + exportAsGateName + (args ? "(" + args + ")" : "") + ":\n";
            indent = "    ";
        } else {
            if (version < 2) {
                pyquil += "from pyquil.api import QVMConnection\n";
                pyquil += "from pyquil.quil import Program\n";
            } else {
                pyquil += "from pyquil import Program, get_qc\n";
            }

            pyquil += "from pyquil.gates import " + importGates + "\n";
            if (importsForDefgate) {
                pyquil += importsForDefgate + "\n";
            }

            pyquil += "import numpy as np\n";
            if (defGates) {
                defParams.map(function (defParamItem, defIndex) {
                    if (defIndex == 0) {
                        pyquil += "\n";
                    }
                    pyquil += defParamItem + "\n";
                });
                pyquil += "\n";
                pyquil += defArrays + "\n";
                pyquil += "\n";
                pyquil += defGates + "\n";
            }
            pyquil += "\n";

            if (!decompose) {
                for (let customGateName in circuit.customGates) {
                    let customGate = circuit.customGates[customGateName];
                    let customCircuit = new QuantumCircuit();
                    customCircuit.load(customGate);
                    pyquil += customCircuit.exportPyquil("", false, customGateName, versionStr);
                    defCircNames.push(customGateName);
                }
            }
        }

        function mathToStringHandler(node, options) {
            if (node.isSymbolNode) {
                if (node.name == "pi") {
                    return "np.pi";
                }
            }
        };

        pyquil += indent + "p = Program()\n\n";

        if (version >= 2 && !exportAsGateName) {
            let totalBits = circuit.cregTotalBits();
            if (gotConditions) {
                totalBits += 1;
            };
            if (totalBits) {
                pyquil += "ro = p.declare('ro', memory_type='BIT', memory_size='" + totalBits + "')\n";
                pyquil += "\n";
            }
        }

        pyquil += defRun ? (defRun + "\n") : "";

        for (let column = 0; column < circuit.numCols(); column++) {
            for (let wire = 0; wire < circuit.numQubits; wire++) {
                let gate = circuit.getGateAt(column, wire);
                if (gate && gate.connector == 0) {
                    let gateDef = circuit.getGateDef(gate.name);
                    let gateParams = gateParams = gate.options && gate.options.params ? gate.options.params : {};
                    let quilInfo = null;
                    if (gateDef) {
                        if (gateDef.exportInfo) {
                            if (gateDef.exportInfo.pyquil && gateDef.exportInfo.pyquil.replacement) {
                                if (gateDef.exportInfo.pyquil.replacement.params) {
                                    gateParams = gateDef.exportInfo.pyquil.replacement.params;
                                }
                                gateDef = circuit.getGateDef(gateDef.exportInfo.pyquil.replacement.name);
                            } else {
                                if (gateDef.exportInfo.quil && gateDef.exportInfo.quil.replacement) {
                                    if (gateDef.exportInfo.quil.replacement.params) {
                                        gateParams = gateDef.exportInfo.quil.replacement.params;
                                    }
                                    gateDef = circuit.getGateDef(gateDef.exportInfo.quil.replacement.name);
                                }
                            }

                            if (gateDef && gateDef.exportInfo) {
                                if (gateDef.exportInfo.pyquil) {
                                    quilInfo = gateDef.exportInfo.pyquil;
                                } else {
                                    if (gateDef.exportInfo.quil) {
                                        quilInfo = gateDef.exportInfo.quil;
                                    }
                                }
                            }
                        }

                        let isDefGate: boolean = false;
                        let isDefCirc: boolean = false;
                        if (quilInfo) {
                            isDefGate = defGateNames.indexOf(quilInfo.name) >= 0;
                            isDefCirc = defCircNames.indexOf(quilInfo.name) >= 0;
                        } else {
                            isDefGate = defGateNames.indexOf(gate.name) >= 0;
                            isDefCirc = defCircNames.indexOf(gate.name) >= 0;
                        }

                        let insideControl: boolean = false;
                        if (gate.options && gate.options.condition && gate.options.condition.creg) {
                            // ---
                            // Flow control
                            // ---
                            insideControl = true;
                            pyquil += "\n";

                            let testBit = self.cregTotalBits();
                            let condition = gate.options.condition;
                            let conditionValue = condition.value || 0;
                            let cregBase = self.cregBase(condition.creg);

                            if (conditionValue == 0) {
                                let cregSize = self.cregs[condition.creg].length;
                                if (version < 2) {
                                    pyquil += indent + "p.inst(FALSE(" + testBit + "))\n";
                                    for (let bitIndex = 0; bitIndex < cregSize; bitIndex++) {
                                        pyquil += indent + "p.inst(OR(" + (bitIndex + cregBase) + ", " + testBit + "))\n";
                                    }
                                    pyquil += indent + "p.inst(NOT(" + testBit + "))\n";
                                    pyquil += indent + "p.if_then(" + testBit + ", Program(";
                                } else {
                                    pyquil += indent + "p.inst(MOVE(ro[" + testBit + "], 0))\n";
                                    for (let bitIndex = 0; bitIndex < cregSize; bitIndex++) {
                                        pyquil += indent + "p.inst(IOR(ro[" + (bitIndex + cregBase) + "], ro[" + testBit + "]))\n";
                                    }
                                    pyquil += indent + "p.inst(NOT(ro[" + testBit + "]))\n";
                                    pyquil += indent + "p.if_then(ro[" + testBit + "], Program(";
                                }
                            } else {
                                let bitStr = conditionValue.toString(2).split("").reverse();
                                let bitCount: number = 0;
                                let singleBitIndex: number = 0;
                                bitStr.map(function (bitValue, bitIndex) {
                                    let bitVal: number = parseInt(bitValue);
                                    bitStr[bitIndex] = bitVal;
                                    if (bitVal) {
                                        bitCount++;
                                        singleBitIndex = bitIndex;
                                    }
                                });

                                if (bitCount == 1) {
                                    if (version < 2) {
                                        pyquil += indent + "p.if_then(" + (singleBitIndex + cregBase) + ", Program(";
                                    } else {
                                        pyquil += indent + "p.if_then(ro[" + (singleBitIndex + cregBase) + "], Program(";
                                    }
                                } else {
                                    if (version < 2) {
                                        pyquil += indent + "p.inst(FALSE(" + testBit + "))\n";
                                        let firstSet: boolean = true;
                                        bitStr.map(function (bitValue, bitIndex) {
                                            if (bitValue) {
                                                if (firstSet) {
                                                    firstSet = false;
                                                    pyquil += indent + "p.inst(OR(" + (bitIndex + cregBase) + ", " + testBit + "))\n";
                                                } else {
                                                    pyquil += indent + "p.inst(AND(" + (bitIndex + cregBase) + ", " + testBit + "))\n";
                                                }
                                            }
                                        });
                                        pyquil += indent + "p.if_then(" + testBit + ", Program(";
                                    } else {
                                        pyquil += indent + "p.inst(MOVE(ro[" + testBit + "], 0))\n";
                                        let firstSet: boolean = true;
                                        bitStr.map(function (bitValue, bitIndex) {
                                            if (bitValue) {
                                                if (firstSet) {
                                                    firstSet = false;
                                                    pyquil += indent + "p.inst(IOR(ro[" + (bitIndex + cregBase) + "], ro[" + testBit + "]))\n";
                                                } else {
                                                    pyquil += indent + "p.inst(AND(ro[" + (bitIndex + cregBase) + "], ro[" + testBit + "]))\n";
                                                }
                                            }
                                        });
                                        pyquil += indent + "p.if_then(ro[" + testBit + "], Program(";
                                    }
                                }
                            }
                            // ---
                        } else {
                            pyquil += indent + "p.inst(";
                        }

                        if (quilInfo) {
                            pyquil += quilInfo.name;
                        } else {
                            pyquil += gate.name;
                        }

                        let gotOpenBrace: boolean = false;
                        if (quilInfo && quilInfo.params && quilInfo.params.length) {
                            let argCount: number = 0;
                            pyquil += "(";
                            gotOpenBrace = true;
                            for (let p = 0; p < quilInfo.params.length; p++) {
                                if (argCount > 0) {
                                    pyquil += ", ";
                                }

                                // ---
                                // prepend 'np' to math constants
                                let node = math.parse(gateParams[quilInfo.params[p]]);
                                pyquil += node.toString({ handler: mathToStringHandler });
                                // ---

                                argCount++;
                            }
                            if (version < 2 || isDefGate) {
                                pyquil += ")";
                            } else {
                                pyquil += ", ";
                            }
                        } else {
                            if (gateDef && gateDef.params && gateDef.params.length) {
                                let argCount: number = 0;
                                pyquil += "(";
                                gotOpenBrace = true;
                                for (let p = 0; p < gateDef.params.length; p++) {
                                    if (argCount > 0) {
                                        pyquil += ", ";
                                    }

                                    // ---
                                    // prepend 'np' to math constants
                                    let node = math.parse(gateParams[gateDef.params[p]]);
                                    pyquil += node.toString({ handler: mathToStringHandler });
                                    // ---

                                    argCount++;
                                }
                                if (version < 2 || isDefGate) {
                                    pyquil += ")";
                                } else {
                                    pyquil += ", ";
                                }
                            }
                        }

                        if (gate.wires.length) {
                            let argCount: number = 0;
                            if (version < 2 || !gotOpenBrace || isDefGate) {
                                pyquil += "(";
                                gotOpenBrace = true;
                            }
                            for (let w = 0; w < gate.wires.length; w++) {
                                if (argCount > 0) {
                                    pyquil += ", ";
                                }

                                if (exportAsGateName) {
                                    pyquil += "q" + gate.wires[w];
                                } else {
                                    pyquil += "" + gate.wires[w];
                                }

                                argCount++;
                            }

                            if (gate.name == "measure" && gate.options && gate.options.creg) {
                                if (argCount > 0) {
                                    pyquil += ", ";
                                }

                                if (version < 2) {
                                    pyquil += (gate.options.creg.bit + self.cregBase(gate.options.creg.name));
                                } else {
                                    pyquil += "ro[" + (gate.options.creg.bit + self.cregBase(gate.options.creg.name)) + "]";
                                }

                                argCount++;
                            }
                            pyquil += ")";
                        }

                        pyquil += ")";
                        if (insideControl) {
                            pyquil += ")\n";
                        }
                        pyquil += "\n";
                    } else {
                        // unknown gate?
                    }
                }
            }
        }

        if (exportAsGateName) {
            pyquil += indent + "return p\n";
            pyquil += "\n";
        } else {
            pyquil += "\n";
            if (version < 2) {
                pyquil += "qvm = QVMConnection()\n";
                pyquil += "print(qvm.run(p))\n";
            } else {
                pyquil += "qvm = get_qc('9q-generic-qvm')\n";
                pyquil += "print(qvm.run(p))\n";
            }
        }

        return pyquil;
    };

    exportQuil(comment: string="", decompose: boolean, exportAsGateName, versionStr: string="2.0") {
        let self = this;

        let version = parseFloat(versionStr);
        if (isNaN(version)) {
            version = 2.0;
        }

        // decompose
        let circuit = null;
        if (decompose) {
            circuit = new QuantumCircuit();
            circuit.load(this.save(true));
        } else {
            circuit = this;
        }

        let quil: string = "";

        // comment
        if (comment) {
            let comm = (comment || "").split("\n");
            comm.map(function (cline) {
                if (cline.length >= 1 && cline[0] != "#") {
                    quil += "# ";
                }
                quil += cline;
                quil += "\n";
            });
        }

        let usedGates = circuit.usedGates();
        usedGates.map(function (usedGateName) {
            let basicGate = circuit.basicGates[usedGateName];
            if (basicGate) {
                if (basicGate.exportInfo && basicGate.exportInfo.quil) {
                    if (basicGate.exportInfo.quil.defgate) {
                        quil += basicGate.exportInfo.quil.defgate;
                        quil += "\n\n";
                    }
                } else {
                    // basic gate not supported by quil
                    // TODO: add quil define gate code
                }
            }
        });

        let gotConditions: boolean = false;
        for (let column = 0; column < circuit.numCols(); column++) {
            for (let wire = 0; wire < circuit.numQubits; wire++) {
                let gate = circuit.getGateAt(column, wire);
                if (gate && gate.connector == 0) {
                    if (gate.options && gate.options.condition && gate.options.condition.creg) {
                        gotConditions = true;
                    }
                }
            }
        }

        let indent: string = "";
        if (exportAsGateName) {
            let params: string = "";
            if (circuit.params.length) {
                params += "(";
                for (let i = 0; i < circuit.params.length; i++) {
                    if (i > 0) {
                        params += ", ";
                    }
                    params += "%" + circuit.params[i];
                }
                params += ")";
            }

            let args: string = "";
            for (let i = 0; i < circuit.numQubits; i++) {
                if (i > 0) {
                    args += " ";
                }
                args += "q" + i;
            }
            quil += "DEFCIRCUIT " + exportAsGateName + (params ? " " + params : "") + (args ? " " + args : "") + ":\n";
            indent = "    ";
        } else {
            quil += "\n";

            if (version >= 2) {
                let totalBits = circuit.cregTotalBits();
                if (gotConditions) {
                    totalBits += 1;
                };
                if (totalBits) {
                    quil += "DECLARE ro BIT[" + totalBits + "]\n\n";
                }
            }

            if (!decompose) {
                for (let customGateName in circuit.customGates) {
                    let customGate = circuit.customGates[customGateName];
                    let customCircuit = new QuantumCircuit();
                    customCircuit.load(customGate);
                    quil += customCircuit.exportQuil("", false, customGateName);
                }
            }
        }

        function mathToStringHandler(node, options) {
            if (node.isSymbolNode && circuit.params.indexOf(node.name) >= 0) {
                return "%" + node.name;
            }
        };

        let labelCounter: number = 1;
        for (let column = 0; column < circuit.numCols(); column++) {
            for (let wire = 0; wire < circuit.numQubits; wire++) {
                let gate = circuit.getGateAt(column, wire);
                if (gate && gate.connector == 0) {
                    let gateDef = circuit.getGateDef(gate.name);
                    let gateParams = gate.options && gate.options.params ? gate.options.params : {};
                    let quilInfo = null;
                    if (gateDef) {
                        if (gateDef.exportInfo) {
                            if (gateDef.exportInfo.quil && gateDef.exportInfo.quil.replacement) {
                                if (gateDef.exportInfo.quil.replacement.params) {
                                    gateParams = gateDef.exportInfo.quil.replacement.params;
                                }
                                gateDef = circuit.getGateDef(gateDef.exportInfo.quil.replacement.name);
                            }

                            quilInfo = (gateDef && gateDef.exportInfo && gateDef.exportInfo.quil) ? gateDef.exportInfo.quil : null;
                        }

                        let insideControl: boolean = false;
                        if (gate.options && gate.options.condition && gate.options.condition.creg) {
                            // ---
                            // Flow control
                            // ---
                            insideControl = true;
                            quil += "\n";

                            let testBit = self.cregTotalBits();
                            let condition = gate.options.condition;
                            let conditionValue = condition.value || 0;
                            let cregBase = self.cregBase(condition.creg);

                            if (conditionValue == 0) {
                                let cregSize = self.cregs[condition.creg].length;
                                if (version < 2) {
                                    quil += indent + "FALSE [" + testBit + "]\n";
                                    for (let bitIndex = 0; bitIndex < cregSize; bitIndex++) {
                                        quil += indent + "OR [" + (bitIndex + cregBase) + "] [" + testBit + "]\n";
                                    }
                                    quil += indent + "NOT [" + testBit + "]\n";
                                    quil += "JUMP-WHEN @THEN" + labelCounter + " [" + testBit + "]\n";
                                    quil += "JUMP @END" + (labelCounter + 1) + "\n";
                                    quil += "LABEL @THEN" + labelCounter + "\n";
                                } else {
                                    quil += indent + "FALSE ro[" + testBit + "]\n";
                                    for (let bitIndex = 0; bitIndex < cregSize; bitIndex++) {
                                        quil += indent + "OR ro[" + (bitIndex + cregBase) + "] ro[" + testBit + "]\n";
                                    }
                                    quil += indent + "NOT ro[" + testBit + "]\n";
                                    quil += "JUMP-WHEN @THEN" + labelCounter + " ro[" + testBit + "]\n";
                                    quil += "JUMP @END" + (labelCounter + 1) + "\n";
                                    quil += "LABEL @THEN" + labelCounter + "\n";
                                }
                            } else {
                                let bitStr = conditionValue.toString(2).split("").reverse();
                                let bitCount = 0;
                                let singleBitIndex = 0;
                                bitStr.map(function (bitValue, bitIndex) {
                                    let bitVal = parseInt(bitValue);
                                    bitStr[bitIndex] = bitVal;
                                    if (bitVal) {
                                        bitCount++;
                                        singleBitIndex = bitIndex;
                                    }
                                });

                                if (bitCount == 1) {
                                    if (version < 2) {
                                        quil += "JUMP-WHEN @THEN" + labelCounter + " [" + (singleBitIndex + cregBase) + "]\n";
                                        quil += "JUMP @END" + (labelCounter + 1) + "\n";
                                        quil += "LABEL @THEN" + labelCounter + "\n";
                                    } else {
                                        quil += "JUMP-WHEN @THEN" + labelCounter + " ro[" + (singleBitIndex + cregBase) + "]\n";
                                        quil += "JUMP @END" + (labelCounter + 1) + "\n";
                                        quil += "LABEL @THEN" + labelCounter + "\n";
                                    }
                                } else {
                                    if (version < 2) {
                                        quil += indent + "FALSE [" + testBit + "]\n";
                                        let firstSet: boolean = true;
                                        bitStr.map(function (bitValue, bitIndex) {
                                            if (bitValue) {
                                                if (firstSet) {
                                                    firstSet = false;
                                                    quil += indent + "OR [" + (bitIndex + cregBase) + "] [" + testBit + "]\n";
                                                } else {
                                                    quil += indent + "AND [" + (bitIndex + cregBase) + "] [" + testBit + "]\n";
                                                }
                                            }
                                        });
                                        quil += "JUMP-WHEN @THEN" + labelCounter + " [" + testBit + "]\n";
                                        quil += "JUMP @END" + (labelCounter + 1) + "\n";
                                        quil += "LABEL @THEN" + labelCounter + "\n";
                                    } else {
                                        quil += indent + "FALSE ro[" + testBit + "]\n";
                                        let firstSet: boolean = true;
                                        bitStr.map(function (bitValue, bitIndex) {
                                            if (bitValue) {
                                                if (firstSet) {
                                                    firstSet = false;
                                                    quil += indent + "OR ro[" + (bitIndex + cregBase) + "] ro[" + testBit + "]\n";
                                                } else {
                                                    quil += indent + "AND ro[" + (bitIndex + cregBase) + "] ro[" + testBit + "]\n";
                                                }
                                            }
                                        });
                                        quil += "JUMP-WHEN @THEN" + labelCounter + " ro[" + testBit + "]\n";
                                        quil += "JUMP @END" + (labelCounter + 1) + "\n";
                                        quil += "LABEL @THEN" + labelCounter + "\n";
                                    }
                                }
                            }
                        }

                        if (quilInfo) {
                            quil += indent + quilInfo.name;
                        } else {
                            quil += indent + gate.name;
                        }

                        quil += " ";
                        let argCount: number = 0;
                        if (quilInfo && quilInfo.params && quilInfo.params.length) {
                            quil += "(";
                            for (let p = 0; p < quilInfo.params.length; p++) {
                                if (argCount > 0) {
                                    quil += ", ";
                                }

                                // ---
                                // prepend '%' to global params
                                let node = math.parse(gateParams[quilInfo.params[p]]);
                                quil += node.toString({ handler: mathToStringHandler });
                                // ---

                                argCount++;
                            }
                            quil += ")";
                        } else {
                            if (gateDef && gateDef.params && gateDef.params.length) {
                                quil += "(";
                                for (let p = 0; p < gateDef.params.length; p++) {
                                    if (argCount > 0) {
                                        quil += ", ";
                                    }

                                    // ---
                                    // prepend '%' to global params
                                    let node = math.parse(gateParams[gateDef.params[p]]);
                                    quil += node.toString({ handler: mathToStringHandler });
                                    // ---

                                    argCount++;
                                }
                                quil += ")";
                            }
                        }

                        for (let w = 0; w < gate.wires.length; w++) {
                            if (argCount > 0) {
                                quil += " ";
                            }

                            if (exportAsGateName) {
                                quil += "q" + gate.wires[w];
                            } else {
                                quil += "" + gate.wires[w];
                            }

                            argCount++;
                        }

                        if (gate.name == "measure" && gate.options && gate.options.creg) {
                            if (argCount > 0) {
                                quil += " ";
                            }

                            if (version < 2) {
                                quil += "[" + (gate.options.creg.bit + self.cregBase(gate.options.creg.name)) + "]";
                            } else {
                                quil += "ro[" + (gate.options.creg.bit + self.cregBase(gate.options.creg.name)) + "]";
                            }
                            argCount++;
                        }

                        quil += "\n";

                        if (insideControl) {
                            quil += "LABEL @END" + (labelCounter + 1) + "\n";
                            quil += "\n";
                            labelCounter += 2;
                        }
                    } else {
                        console.log("unknown gate", gate.name);
                    }
                }
            }
        }

        if (exportAsGateName) {
            quil += "\n";
        }
        return quil; 
    };

    exportSVG(embedded:boolean):string {
        let self = this;
        let cellWidth: number = 40;
        let cellHeight: number = 40;
        let hSpacing: number = 20;
        let vSpacing: number = 20;
        let blackboxPaddingX: number = 2;
        let blackboxPaddingY: number = 2;
        let blackboxLineColor: string = "black";
        let wireColor: string = "black";
        let gateLineColor: string = "black";
        let cWireColor: string = "silver";
        let cArrowSize: number = 10;
        let wireWidth: number = 1;
        let dotRadius: number = 5;

        function cregIndex(name): number {
            let cregIndex: number = 0;
            for (let cregName in self.cregs) {
                if (cregName == name) {
                    return cregIndex;
                }
                cregIndex++;
            }
            return cregIndex;
        };

        function cregCount(): number {
            let cregCount: number = 0;
            for (let cregName in self.cregs) {
                cregCount++;
            }
            return cregCount;
        };

        let numRows: number = this.numQubits;
        let numCols: number = this.numCols();
        let numCregs: number = cregCount();

        let totalWidth: number = ((cellWidth + hSpacing) * numCols) + hSpacing;
        let totalHeight: number = ((cellHeight + vSpacing) * (numRows + numCregs)) + vSpacing;

        function polarToCartesian(centerX: number, centerY: number, radius: number, angleInDegrees: number) {
            let angleInRadians = (angleInDegrees - 90) * Math.PI / 180.0;

            return {
                x: centerX + (radius * Math.cos(angleInRadians)),
                y: centerY + (radius * Math.sin(angleInRadians))
            };
        }

        function describeArc(x: number, y: number, radius: number, startAngle: number, endAngle: number) {

            let start = polarToCartesian(x, y, radius, endAngle);
            let end = polarToCartesian(x, y, radius, startAngle);

            let largeArcFlag = endAngle - startAngle <= 180 ? "0" : "1";

            let d = [
                "M", start.x, start.y,
                "A", radius, radius, 0, largeArcFlag, 0, end.x, end.y
            ].join(" ");

            return d;
        }

        function qWireY(wire: number): number {
            return ((cellHeight + vSpacing) * wire) + (vSpacing + (cellHeight / 2))
        };

        function qGateY(wire: number): number {
                return ((cellHeight + vSpacing) * wire) + vSpacing
        };

        function cWireY(cregName): number {
                return ((cellHeight + vSpacing) * (numRows + cregIndex(cregName))) + (vSpacing + (cellHeight / 2))
        };

        function drawGate(gate, colIndex: number, rowIndex: number): string {
            let dinfo = self.basicGates[gate.name] ? self.basicGates[gate.name].drawingInfo : null;
            let blackbox: boolean = false;
            if (!dinfo) {
                if (gate.wires.length == 1) {
                    dinfo = { connectors: ["box"] };
                } else {
                    dinfo = { connectors: [] };
                    blackbox = true;
                }
            }
            while (dinfo.connectors.length < gate.wires.length) {
                dinfo.connectors.push("box");
            }

            let topWire = Math.min.apply(null, gate.wires);
            let bottomWire = Math.max.apply(null, gate.wires);
            let cLinkTopY = cWireY(bottomWire);

            let svg: string = "";
            svg += "<g class=\"qc-gate-group\">";
            if (blackbox) {
                let gateX: number = (((cellWidth + hSpacing) * colIndex) + hSpacing) - blackboxPaddingX;
                let gateY: number = qGateY(topWire) - blackboxPaddingY;
                let gateWidth: number = cellWidth + (2 * blackboxPaddingX);
                let gateHeight: number = ((qGateY(bottomWire) + cellHeight) - gateY) + blackboxPaddingY;

                cLinkTopY = gateY + gateHeight;

                svg += "<rect class=\"qc-gate-blackbox\" x=\"" + gateX + "\" y=\"" + gateY + "\" width=\"" + gateWidth + "\" height=\"" + gateHeight + "\" stroke=\"" + blackboxLineColor + "\" fill=\"transparent\" stroke-width=\"1\" />";
            }

                // link
            if (topWire != bottomWire && !blackbox) {
                let linkX: number = (((cellWidth + hSpacing) * colIndex) + hSpacing) + (cellWidth / 2);
                let linkY1: number = (((cellHeight + vSpacing) * topWire) + vSpacing) + (cellHeight / 2);
                let linkY2: number = (((cellHeight + vSpacing) * bottomWire) + vSpacing) + (cellHeight / 2);
                svg += "<line class=\"qc-gate-link\" x1=\"" + linkX + "\" x2=\"" + linkX + "\" y1=\"" + linkY1 + "\" y2=\"" + linkY2 + "\" stroke=\"" + wireColor + "\" stroke-width=\"1\" />";
            }

                // connectors
            gate.wires.map(function (wire, connector) {

                switch (dinfo.connectors[connector]) {
                    case "box": {
                        let gateWidth = cellWidth;
                        let gateHeight = cellWidth;
                        let gateX = ((cellWidth + hSpacing) * colIndex) + hSpacing;
                        let gateY = ((cellHeight + vSpacing) * wire) + vSpacing;

                        if (!blackbox && wire == bottomWire) {
                            cLinkTopY = gateY + gateHeight;
                        }

                        svg += "<rect class=\"qc-gate-box\" x=\"" + gateX + "\" y=\"" + gateY + "\" width=\"" + gateWidth + "\" height=\"" + gateHeight + "\" stroke=\"" + gateLineColor + "\" fill=\"white\" stroke-width=\"1\" />";
                        svg += "<text class=\"qc-gate-label\" x=\"" + (gateX + (gateWidth / 2)) + "\" y=\"" + (gateY + (gateHeight / 2)) + "\" alignment-baseline=\"middle\" text-anchor=\"middle\">" + (blackbox ? String.fromCharCode(97 + connector) : (dinfo.label || gate.name)) + "</text>";
                    }; break;

                    case "not": {
                        let gateWidth: number = cellWidth;
                        let gateHeight: number = cellWidth;
                        let gateX: number = ((cellWidth + hSpacing) * colIndex) + hSpacing;
                        let gateY: number = ((cellHeight + vSpacing) * wire) + vSpacing;
                        let centerX: number = gateX + (gateWidth / 2);
                        let centerY: number = gateY + (gateHeight / 2);

                        if (!blackbox && wire == bottomWire) {
                            cLinkTopY = gateY + gateHeight;
                        }

                        svg += "<ellipse class=\"qc-gate-not\" cx=\"" + centerX + "\" cy=\"" + centerY + "\" rx=\"" + (gateWidth / 2) + "\" ry=\"" + (gateHeight / 2) + "\" stroke=\"" + gateLineColor + "\" fill=\"white\" stroke-width=\"1\" />";

                        svg += "<line class=\"qc-gate-not-line\" x1=\"" + centerX + "\" x2=\"" + centerX + "\" y1=\"" + gateY + "\" y2=\"" + (gateY + gateHeight) + "\" stroke=\"" + gateLineColor + "\" stroke-width=\"1\" />";

                        svg += "<line class=\"qc-gate-not-line\" x1=\"" + gateX + "\" x2=\"" + (gateX + gateWidth) + "\" y1=\"" + centerY + "\" y2=\"" + centerY + "\" stroke=\"" + gateLineColor + "\" stroke-width=\"1\" />";
                    }; break;

                    case "x": {
                        let gateWidth: number = cellWidth / 2;
                        let gateHeight: number = cellWidth / 2;
                        let gateX: number = (((cellWidth + hSpacing) * colIndex) + hSpacing) + (gateWidth / 2);
                        let gateY: number = (((cellHeight + vSpacing) * wire) + vSpacing) + (gateHeight / 2);

                        if (!blackbox && wire == bottomWire) {
                            cLinkTopY = cWireY(bottomWire);
                        }

                        svg += "<line class=\"qc-gate-x\" x1=\"" + gateX + "\" x2=\"" + (gateX + gateWidth) + "\" y1=\"" + gateY + "\" y2=\"" + (gateY + gateHeight) + "\" stroke=\"" + gateLineColor + "\" stroke-width=\"1\" />";

                        svg += "<line class=\"qc-gate-x\" x1=\"" + gateX + "\" x2=\"" + (gateX + gateWidth) + "\" y1=\"" + (gateY + gateHeight) + "\" y2=\"" + gateY + "\" stroke=\"" + gateLineColor + "\" stroke-width=\"1\" />";
                    }; break;

                    case "dot": {
                        let gateWidth: number = cellWidth;
                        let gateHeight: number = cellWidth;
                        let gateX: number = (((cellWidth + hSpacing) * colIndex) + hSpacing) + (gateWidth / 2);
                        let gateY: number = (((cellHeight + vSpacing) * wire) + vSpacing) + (gateHeight / 2);

                        if (!blackbox && wire == bottomWire) {
                            cLinkTopY = cWireY(bottomWire) + dotRadius;
                        }

                        svg += "<circle class=\"qc-gate-dot\" cx=\"" + gateX + "\" cy=\"" + gateY + "\" r=\"" + dotRadius + "\" stroke=\"" + wireColor + "\" fill=\"" + wireColor + "\" stroke-width=\"1\" />";
                    }; break;

                    case "gauge": {
                        let gateWidth: number = cellWidth;
                        let gateHeight: number = cellWidth;
                        let gateX: number = ((cellWidth + hSpacing) * colIndex) + hSpacing;
                        let gateY: number = ((cellHeight + vSpacing) * wire) + vSpacing;
                        let centerX: number = gateX + (gateWidth / 2);
                        let centerY: number = gateY + (gateHeight / 2);
                        let movedown: number = gateHeight / 5;

                        if (!blackbox && wire == bottomWire) {
                            cLinkTopY = gateY + gateHeight;
                        }

                        svg += "<rect class=\"qc-gate-box\" x=\"" + gateX + "\" y=\"" + gateY + "\" width=\"" + gateWidth + "\" height=\"" + gateHeight + "\" stroke=\"" + gateLineColor + "\" fill=\"white\" stroke-width=\"1\" />";
                        svg += "<path class=\"gc-gate-gauge-arc\" d=\"" + describeArc(centerX, centerY + movedown, gateWidth / 2.3, 300, 60) + "\" stroke=\"" + gateLineColor + "\" fill=\"none\" stroke-width=\"1\" />";
                        svg += "<line class=\"qc-gate-gauge-scale\" x1=\"" + centerX + "\" x2=\"" + ((gateX + gateWidth) - movedown) + "\" y1=\"" + (centerY + movedown) + "\" y2=\"" + (gateY + movedown) + "\" stroke=\"" + gateLineColor + "\" stroke-width=\"1\" />";
                    }; break;

                }
            });

                // measure
            if (gate.name == "measure" && gate.options && gate.options.creg && gate.options.creg.name) {
                let linkX: number = (((cellWidth + hSpacing) * colIndex) + hSpacing) + (cellWidth / 2);
                let linkY1: number = cLinkTopY;
                let linkY2: number = cWireY(gate.options.creg.name);

                svg += "<line class=\"qc-gate-link-c\" x1=\"" + linkX + "\" x2=\"" + linkX + "\" y1=\"" + linkY1 + "\" y2=\"" + linkY2 + "\" stroke=\"" + cWireColor + "\" stroke-width=\"1\" />";

                svg += "<line class=\"qc-gate-link-c\" x2=\"" + linkX + "\" x1=\"" + (linkX - (cArrowSize / 2)) + "\" y1=\"" + (linkY2 - cArrowSize) + "\" y2=\"" + linkY2 + "\" stroke=\"" + cWireColor + "\" stroke-width=\"1\" />";
                svg += "<line class=\"qc-gate-link-c\" x2=\"" + linkX + "\" x1=\"" + (linkX + (cArrowSize / 2)) + "\" y1=\"" + (linkY2 - cArrowSize) + "\" y2=\"" + linkY2 + "\" stroke=\"" + cWireColor + "\" stroke-width=\"1\" />";
            }

            // controlled by classic register
            if (gate.options && gate.options.condition && gate.options.condition.creg) {
                let linkX: number = (((cellWidth + hSpacing) * colIndex) + hSpacing) + (cellWidth / 2);
                let linkY1: number = cLinkTopY;
                let linkY2: number = cWireY(gate.options.condition.creg);

                svg += "<line class=\"qc-gate-link-c\" x1=\"" + linkX + "\" x2=\"" + linkX + "\" y1=\"" + linkY1 + "\" y2=\"" + linkY2 + "\" stroke=\"" + cWireColor + "\" stroke-width=\"1\" />";

                svg += "<circle class=\"qc-gate-dot-c\" cx=\"" + linkX + "\" cy=\"" + linkY2 + "\" r=\"" + dotRadius + "\" stroke=\"" + cWireColor + "\" fill=\"" + cWireColor + "\" stroke-width=\"1\" />";
            }

            svg += "</g>";

            return svg;
        }

        let svg: string = "";
        if (!embedded) {
            svg += "<?xml version=\"1.0\"?>";
            svg += "<!DOCTYPE svg PUBLIC \"-//W3C//DTD SVG 1.1//EN\" \"http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd\">";
        }

        svg += "<svg class=\"qc-circuit\" width=\"" + totalWidth + "\" height=\"" + totalHeight + "\" version=\"1.1\" xmlns=\"http://www.w3.org/2000/svg\">";

        for (let wire = 0; wire < numRows; wire++) {
            let wireY: number = qWireY(wire);
            svg += "<line class=\"qc-wire\" x1=\"0\" x2=\"" + totalWidth + "\" y1=\"" + wireY + "\" y2=\"" + wireY + "\" stroke=\"" + wireColor + "\" stroke-width=\"" + wireWidth + "\" />";
        }

        for (let cregName in this.cregs) {
            let wireY: number = cWireY(cregName);
            svg += "<line class=\"qc-wire-c\" x1=\"0\" x2=\"" + totalWidth + "\" y1=\"" + wireY + "\" y2=\"" + wireY + "\" stroke=\"" + cWireColor + "\" stroke-width=\"" + wireWidth + "\" />";
        }

        let numCols = this.numCols();
        for (let column = 0; column < numCols; column++) {
            for (let wire = 0; wire < this.numQubits; wire++) {
                let gate = this.getGateAt(column, wire);
                if (gate && gate.connector == 0) {
                    svg += drawGate(gate, column, wire);
                }
            }
        }
        svg += "</svg>";

        return svg;
    };
    

    run(initialValues, options) {
        options = options || {};

        this.initState();

        this.stats.start = new Date();

        if (initialValues) {
            for (let wire = 0; wire < this.numQubits; wire++) {
                if (initialValues[wire]) {
                    this.applyGate("x", [wire]);
                }
            }
        }

        let decomposed = new QuantumCircuit();
        decomposed.load(this.save(true));
        let numCols: number = decomposed.numCols();
        let gateCounter: number = 0;
        for (let column = 0; column < numCols; column++) {
            for (let wire = 0; wire < decomposed.numQubits; wire++) {
                let gate = decomposed.getGateAt(column, wire);
                if (gate && gate.connector == 0) {
                    gateCounter++;

                    let executeGate: boolean = true;
                    if (gate.options && gate.options.condition && gate.options.condition.creg) {
                        let cregValue = this.getCregValue(gate.options.condition.creg);
                        executeGate = cregValue === gate.options.condition.value;
                    }

                    if (executeGate) {
                        this.applyGate(gate.name, gate.wires, gate.options);
                    }

                    // callback after gate is finished
                    if (options && options.onGate) {
                        options.onGate(column, wire, gateCounter);
                    }
                }
            }
            // callback after column is finished
            if (options && options.onColumn) {
                options.onColumn(column);
            }
        }

        this.stats.end = new Date();
        this.stats.duration = this.stats.end - this.stats.start;
    };

    test(name, gates, expectedState) {

        console.log("TEST: " + name);

        this.clear();

        if (!gates || !gates.length) {
            console.log("Invalid input");
            return false;
        }

        for (let i = 0; i < gates.length; i++) {
            let gate = gates[i];
            if (!gate || !gate.length || gate.length < 3) {
                console.log("Invalid input");
                return false;
            }
            this.addGate(gate[0], gate[1], gate[2]);
        }

        this.run();

        let numRes = this.numAmplitudes();
        if (numRes > expectedState.length) {
            console.log("Warning: expected state is incomplette.");
            numRes = expectedState.length;
        }

        let gotError: boolean = false;
        for (let i = 0; i < numRes; i++) {
            let expected = expectedState[i];
            let state = this.state[i] || math.complex(0, 0);

            if (math.round(expected[0], 5) != math.round(state.re, 5) || math.round(expected[1], 5) != math.round(state.im, 5)) {
                if (!gotError) {
                    gotError = true;
                    console.log("ERROR");
                }

                let bin = i.toString(2);
                while (bin.length < this.numQubits) {
                    bin = "0" + bin;
                }

                console.log("|" + bin + "> Expected: " + formatComplex2(expected[0], expected[1]) + " Got: " + formatComplex(state));
            }
        }

        console.log(gotError ? "Didn't pass." : "Passed.");
        console.log("");

        return !gotError;
    };

    stateAsString(onlyPossible) {

        let numAmplitudes = this.numAmplitudes();
        if (!this.state) {
            return "Error: circuit is not initialized. Please call initState() or run() method.";
        }

        let s: string = "";
        let count: number = 0;
        for (let i = 0; i < numAmplitudes; i++) {
            let state = this.state[i] || math.complex(0, 0);
            let m = math.round(math.pow(math.abs(state), 2) * 100, 2);
            if (!onlyPossible || m) {
                if (count) { s += "\n"; }

                // binary string
                let bin = i.toString(2);
                while (bin.length < this.numQubits) {
                    bin = "0" + bin;
                }

                s += formatComplex(state) + "|" + bin + ">\t" + m + "%";
                count++;
            }
        }
        return s;
    };

    print(onlyPossible) {
        console.log(this.stateAsString(onlyPossible));
    };


    createCreg(creg, len) {
        this.cregs[creg] = [];

        // extend register
        while (this.cregs[creg].length < (len || 1)) {
            this.cregs[creg].push(0);
        }
    };

    setCregBit(creg, cbit, value) {
        // see if cbit is integer
        let bit = parseInt(cbit);
        if (isNaN(bit)) {
            throw "Error: invalid \"cbit\" argument to \"setCregBit\" method: expected \"integer\" got \"" + typeof cbit + "\".";
        }

        // create register if does not exist
        if (!this.cregs[creg]) {
            this.cregs[creg] = [];
        }

        // extend register if needed
        while (bit >= this.cregs[creg].length) {
            this.cregs[creg].push(0);
        }

        // set bit
        this.cregs[creg][bit] = value ? 1 : 0;
    };

    getCregBit(creg, cbit) {
        if (!this.cregs[creg]) {
            throw "Error: \"getCregBit\": unknown register \"" + creg + "\".";
        }

        let bit = parseInt(cbit);
        if (isNaN(bit) || bit >= this.cregs[creg].length) {
            throw "Error: \"getCregBit\": bit \"" + cbit + "\" not found.";
        }
        return this.cregs[creg][bit];
    };

    cregBase(creg) {
        if (!this.cregs[creg]) {
            throw "Error: \"getCregBit\": unknown register \"" + creg + "\".";
        }

        let base: number = 0;
        for (let regName in this.cregs) {
            if (regName == creg) {
                return base;
            }
            base += this.cregs[regName].length;
        }
    };

    cregTotalBits() {
        let bits: number = 0;
        for (let regName in this.cregs) {
            bits += this.cregs[regName].length;
        }
        return bits;
    };

    getCregValue(creg) {
        if (!this.cregs[creg]) {
            throw "Error: \"getCregBit\": unknown register \"" + creg + "\".";
        }

        let len: number = this.cregs[creg].length;
        let value: number = 0;
        for (let i = 0; i < len; i++) {
            if (this.cregs[creg][i]) {
                value += math.pow(2, i);
            }
        }
        return value;
    };

    measureAll(force) {
        if (this.collapsed && this.collapsed.length == this.numQubits && !force) {
            return this.collapsed;
        }

        this.collapsed = [];
        let maxChance: number = 0;
        for (let is in this.state) {
            let i = parseInt(is);
            let state = this.state[is];
            let chance: number = 0;
            if (state.re || state.im) {
                chance = math.round(math.pow(math.abs(state), 2), 5);
            }

            if (chance > maxChance || (chance == maxChance && (!this.collapsed.length || !!Math.round(Math.random())))) {
                maxChance = chance;
                this.collapsed = [];
                for (let q = this.numQubits - 1; q >= 0; q--) {
                    this.collapsed.push(1 << q & i ? 1 : 0);
                }
            }
        }
        return this.collapsed;
    };

    measure(wire, creg, cbit) {
        if (!this.collapsed || this.collapsed.length != this.numQubits) {
            this.measureAll();
        }

        let val = this.collapsed[wire];

        if (creg && typeof cbit != "undefined") {
            this.setCregBit(creg, cbit, val);
        }

        return val;
    };

    probabilities() {
        this.prob = [];
        for (let wire = 0; wire < this.numQubits; wire++) {
            this.prob.push(0);
        }

        for (let is in this.state) {
            let i = parseInt(is);

            for (let wire = 0; wire < this.numQubits; wire++) {
                let bit = math.pow(2, (this.numQubits - 1) - wire);
                if (i & bit) {
                    let state = this.state[is];
                    if (state.re || state.im) {
                        this.prob[wire] += math.pow(math.abs(state), 2);
                    }
                }
            }
        }

        for (let wire = 0; wire < this.numQubits; wire++) {
            this.prob[wire] = math.round(this.prob[wire], 5);
        }
        return this.prob;
    };

    probability(wire: number) {
        if (!this.prob || this.prob.length != this.numQubits) {
            this.probabilities();
        }

        return this.prob[wire];
    };
    // end of QuantumCircuit class
};

export = QuantumCircuit;