class Gate {
    public name: string;

};

export = Gate;

/*

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
        }
 */