export const BasicGates: object = {
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