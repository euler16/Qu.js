"use strict";
var math = require("mathjs");
var Qasm = require("../qasm_files/QASMImport.js");
var Helper_1 = require("./Helper");
var BasicGates_1 = require("./BasicGates");
var QuantumCircuit = (function () {
    function QuantumCircuit(numQubits) {
        if (numQubits === void 0) { numQubits = 1; }
        this.numQubits = numQubits;
        this.params = [];
        this.customGates = {};
        this.cregs = {};
        this.collapsed = [];
        this.prob = [];
        this.gates = [];
        this.clear();
    }
    QuantumCircuit.prototype.clear = function () {
        for (var i = 0; i < this.numQubits; i++) {
            this.gates.push([]);
        }
        this.resetState();
    };
    ;
    QuantumCircuit.prototype.resetState = function () {
        this.state = {};
        this.stateBits = 0;
        for (var creg in this.cregs) {
            var len = this.cregs[creg].length || 0;
            this.cregs[creg] = [];
            for (var i = 0; i < len; i++) {
                this.cregs[creg].push(0);
            }
        }
        this.collapsed = [];
        this.prob = [];
        this.stats = {};
    };
    ;
    QuantumCircuit.prototype.initState = function () {
        this.resetState();
        this.state["0"] = math.complex(1, 0);
        this.stateBits = 0;
    };
    ;
    QuantumCircuit.prototype.numAmplitudes = function () {
        return math.pow(2, this.numQubits);
    };
    ;
    QuantumCircuit.prototype.numCols = function () {
        return this.gates.length ? this.gates[0].length : 0;
    };
    ;
    QuantumCircuit.prototype.numGates = function (decompose) {
        var circuit = null;
        if (decompose) {
            circuit = new QuantumCircuit();
            circuit.load(this.save(true));
        }
        else {
            circuit = this;
        }
        var numGates = 0;
        var numCols = circuit.numCols();
        for (var column = 0; column < numCols; column++) {
            for (var wire = 0; wire < circuit.numQubits; wire++) {
                var gate = circuit.getGateAt(column, wire);
                if (gate && gate.connector == 0) {
                    numGates++;
                }
            }
        }
        return numGates;
    };
    ;
    QuantumCircuit.prototype.isEmptyCell = function (col, wire) {
        if (this.gates[wire] && this.gates[wire][col]) {
            return false;
        }
        for (var w = 0; w < this.numQubits; w++) {
            var gate = this.getGateAt(col, w);
            if (gate) {
                if (gate.name == "measure" || (gate.options && gate.options.condition && gate.options.condition.creg) || (Math.min.apply(null, gate.wires) < wire && Math.max.apply(null, gate.wires) > wire)) {
                    return false;
                }
            }
        }
        return true;
    };
    ;
    QuantumCircuit.prototype.lastNonEmptyPlace = function (wires, usingCregs) {
        var col = this.numCols();
        var allEmpty = true;
        var minWire = Math.min.apply(null, wires);
        var maxWire = Math.max.apply(null, wires);
        if (usingCregs) {
            var mx = this.numQubits - 1;
            if (mx > maxWire) {
                maxWire = mx;
            }
        }
        while (allEmpty && col--) {
            for (var wire = minWire; wire <= maxWire; wire++) {
                if (!this.isEmptyCell(col, wire)) {
                    allEmpty = false;
                }
            }
        }
        return col;
    };
    ;
    QuantumCircuit.prototype.addGate = function (gateName, column, wires, options) {
        var wireList = [];
        if (Array.isArray(wires)) {
            for (var i = 0; i < wires.length; i++) {
                wireList.push(wires[i]);
            }
        }
        else {
            wireList.push(wires);
        }
        if (column < 0) {
            column = this.lastNonEmptyPlace(wireList, gateName == "measure" || (options && options.condition && options.condition.creg)) + 1;
        }
        var numConnectors = wireList.length;
        var id = Helper_1.randomStr();
        for (var connector = 0; connector < numConnectors; connector++) {
            var wire = wireList[connector];
            if ((wire + 1) > this.numQubits) {
                this.numQubits = wire + 1;
            }
            while (this.gates.length < this.numQubits) {
                this.gates.push([]);
            }
            var numCols = this.numCols();
            if ((column + 1) > numCols) {
                numCols = column + 1;
            }
            for (var i = 0; i < this.gates.length; i++) {
                while (this.gates[i].length < numCols) {
                    this.gates[i].push(null);
                }
            }
            var gate = {
                id: id,
                name: gateName,
                connector: connector,
                options: {}
            };
            if (options) {
                gate.options = options;
                if (options.creg) {
                    var existingCreg = this.cregs[options.creg.name] || [];
                    var currentValue = existingCreg.length > options.creg.bit ? existingCreg[options.creg.bit] : 0;
                    this.setCregBit(options.creg.name, options.creg.bit || 0, currentValue);
                }
            }
            this.gates[wire][column] = gate;
        }
    };
    ;
    QuantumCircuit.prototype.removeGate = function (column, wire) {
        if (!this.gates[wire]) {
            return;
        }
        var gate = this.gates[wire][column];
        if (!gate) {
            return;
        }
        var id = gate.id;
        var numWires = this.gates[0].length;
        for (var wire_1 = 0; wire_1 < numWires; wire_1++) {
            if (this.gates[wire_1][column].id == id) {
                this.gates[wire_1][column] = null;
            }
        }
    };
    ;
    QuantumCircuit.prototype.addMeasure = function (wire, creg, cbit) {
        this.addGate("measure", -1, wire, { creg: { name: creg, bit: cbit } });
    };
    ;
    QuantumCircuit.prototype.applyTransform = function (U, qubits) {
        qubits = qubits.slice(0);
        for (var i = 0; i < qubits.length; i++) {
            qubits[i] = (this.numQubits - 1) - qubits[i];
        }
        qubits.reverse();
        var incMap = [];
        var fixMap = [];
        var usedCount = 0;
        var unusedCount = 0;
        for (var i = 0; i < this.numQubits; i++) {
            if (qubits.indexOf(i) < 0) {
                incMap.push({
                    and: 1 << incMap.length,
                    or: 1 << i
                });
                unusedCount++;
            }
            else {
                fixMap.push({
                    rowAnd: 1 << (fixMap.length + qubits.length),
                    colAnd: 1 << fixMap.length,
                    or: 1 << qubits[fixMap.length]
                });
                usedCount++;
            }
        }
        var uflat = {};
        var unum = 0;
        var uindex = 0;
        U.map(function (urow) {
            urow.map(function (uval) {
                if (uval) {
                    var rowOr = 0;
                    var colOr = 0;
                    var fix = usedCount;
                    while (fix--) {
                        var fmap = fixMap[fix];
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
        var newState = {};
        var newStateBits = 0;
        var incCount = (1 << unusedCount);
        while (incCount--) {
            var row = 0;
            var inc = unusedCount;
            while (inc--) {
                if (incCount & incMap[inc].and) {
                    row |= incMap[inc].or;
                }
            }
            if ((this.stateBits & row) == row) {
                var ucount = unum;
                while (ucount--) {
                    var u = uflat[ucount];
                    var i = row | u.rowOr;
                    var j = row | u.colOr;
                    var state = this.state[j];
                    if (state) {
                        if (math.equal(u.uval, 1)) {
                            newState[i] = math.add(newState[i] || math.complex(0, 0), state);
                        }
                        else {
                            newState[i] = math.add(newState[i] || math.complex(0, 0), math.multiply(u.uval, state));
                        }
                        newStateBits |= i;
                    }
                }
            }
        }
        this.state = newState;
        this.stateBits = newStateBits;
    };
    ;
    QuantumCircuit.prototype.applyGate = function (gateName, wires, options) {
        if (gateName == "measure") {
            if (!options.creg) {
                throw "Error: \"measure\" gate requires destination.";
            }
            this.measure(wires[0], options.creg.name, options.creg.bit);
            return;
        }
        var gate = this.basicGates[gateName];
        if (!gate) {
            console.log("Unknown gate \"" + gateName + "\".");
            return;
        }
        var rawGate = this.getRawGate(gate, options);
        this.collapsed = [];
        this.prob = [];
        this.applyTransform(rawGate, wires);
    };
    ;
    QuantumCircuit.prototype.getRawGate = function (gate, options) {
        var rawGate = [];
        gate.matrix.map(function (row) {
            var rawGateRow = [];
            row.map(function (item) {
                if (typeof item == "string") {
                    var params_1 = options ? options.params || {} : {};
                    var vars_1 = {};
                    gate.params.map(function (varName, varIndex) {
                        if (Array.isArray(params_1)) {
                            vars_1[varName] = params_1.length > varIndex ? math.eval(params_1[varIndex]) : null;
                        }
                        else {
                            vars_1[varName] = math.eval(params_1[varName]);
                        }
                    });
                    var ev = math.eval(item, vars_1);
                    rawGateRow.push(ev);
                }
                else {
                    rawGateRow.push(item);
                }
            });
            rawGate.push(rawGateRow);
        });
        return rawGate;
    };
    ;
    QuantumCircuit.prototype.decompose = function (obj) {
        if (!obj.gates.length) {
            return obj;
        }
        function injectArray(a1, a2, pos) {
            return a1.slice(0, pos).concat(a2).concat(a1.slice(pos));
        }
        for (var column = 0; column < obj.gates[0].length; column++) {
            var _loop_1 = function (wire) {
                var gate = obj.gates[wire][column];
                if (gate && gate.connector == 0 && !(this_1.basicGates[gate.name] || gate.name == "measure")) {
                    var tmp = new QuantumCircuit();
                    var custom = obj.customGates[gate.name];
                    if (custom) {
                        tmp.load(custom);
                        if (tmp.params.length && gate.options && gate.options.params) {
                            var globalParams_1 = gate.options.params;
                            for (var cc = 0; cc < tmp.gates[0].length; cc++) {
                                for (var ww = 0; ww < tmp.numQubits; ww++) {
                                    var gg = tmp.gates[ww][cc];
                                    if (gg && gg.connector == 0) {
                                        if (gg.options && gg.options.params) {
                                            for (var destParam in gg.options.params) {
                                                var node = math.parse(gg.options.params[destParam]);
                                                var transformed = node.transform(function (node, path, parent) {
                                                    if (node.isSymbolNode && globalParams_1.hasOwnProperty(node.name)) {
                                                        return math.parse("(" + globalParams_1[node.name] + ")");
                                                    }
                                                    else {
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
                        var decomposed = tmp.save(true);
                        var empty = [];
                        for (var i = 0; i < decomposed.gates[0].length - 1; i++) {
                            empty.push(null);
                        }
                        for (var w = 0; w < obj.numQubits; w++) {
                            var g = obj.gates[w][column];
                            if (g && g.id == gate.id) {
                                obj.gates[w].splice(column, 1);
                                var insertGate = decomposed.gates[g.connector];
                                obj.gates[w] = injectArray(obj.gates[w], insertGate, column);
                            }
                            else {
                                obj.gates[w] = injectArray(obj.gates[w], empty, column + 1);
                            }
                        }
                    }
                }
            };
            var this_1 = this;
            for (var wire = 0; wire < obj.numQubits; wire++) {
                _loop_1(wire);
            }
        }
        obj.customGates = {};
        return obj;
    };
    ;
    QuantumCircuit.prototype.usedGates = function () {
        var decomposed = new QuantumCircuit();
        decomposed.load(this.save(true));
        var used = [];
        for (var wire = 0; wire < decomposed.numQubits; wire++) {
            for (var col = 0; col < decomposed.numCols(); col++) {
                var gate = decomposed.gates[wire][col];
                if (gate && used.indexOf(gate.name) < 0) {
                    used.push(gate.name);
                }
            }
        }
        return used;
    };
    ;
    QuantumCircuit.prototype.getGateDef = function (name) {
        var gateDef = this.basicGates[name];
        if (!gateDef) {
            gateDef = this.customGates[name];
        }
        return gateDef;
    };
    ;
    QuantumCircuit.prototype.save = function (decompose) {
        var data = {
            numQubits: this.numQubits,
            params: JSON.parse(JSON.stringify(this.params)),
            gates: JSON.parse(JSON.stringify(this.gates)),
            customGates: JSON.parse(JSON.stringify(this.customGates))
        };
        if (decompose) {
            return this.decompose(data);
        }
        else {
            return data;
        }
    };
    ;
    QuantumCircuit.prototype.load = function (obj) {
        this.numQubits = obj.numQubits || 1;
        this.clear();
        this.params = JSON.parse(JSON.stringify(obj.params || []));
        this.gates = JSON.parse(JSON.stringify(obj.gates || []));
        this.customGates = JSON.parse(JSON.stringify(obj.customGates || {}));
    };
    ;
    QuantumCircuit.prototype.registerGate = function (name, obj) {
        this.customGates[name] = obj;
    };
    ;
    QuantumCircuit.prototype.getGateAt = function (column, wire) {
        if (!this.gates[wire] || !this.gates[wire][column]) {
            return null;
        }
        var gate = JSON.parse(JSON.stringify(this.gates[wire][column]));
        if (!gate) {
            return null;
        }
        gate.wires = [];
        var id = gate.id;
        var numWires = this.gates.length;
        for (var wire_2 = 0; wire_2 < numWires; wire_2++) {
            var g = this.gates[wire_2][column];
            if (g && g.id == id) {
                gate.wires[g.connector] = wire_2;
            }
        }
        return gate;
    };
    ;
    QuantumCircuit.prototype.exportQASM = function (comment, decompose, exportAsGateName) {
        var circuit = null;
        if (decompose) {
            circuit = new QuantumCircuit();
            circuit.load(this.save(true));
        }
        else {
            circuit = this;
        }
        var qasm = "";
        if (comment) {
            var comm = (comment || "").split("\n");
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
            for (var i = 0; i < circuit.numQubits; i++) {
                if (i == 0) {
                    qasm += " ";
                }
                if (i > 0) {
                    qasm += ",";
                }
                qasm += String.fromCharCode(97 + i);
            }
            qasm += "\n{\n";
        }
        else {
            qasm += "OPENQASM 2.0;\n";
            qasm += "include \"qelib1.inc\";\n";
            qasm += "qreg q[" + circuit.numQubits + "];\n";
            for (var cregName in this.cregs) {
                qasm += "creg " + cregName + "[" + (this.cregs[cregName].length || 1) + "];\n";
            }
            if (!decompose) {
                for (var customGateName in this.customGates) {
                    var customGate = this.customGates[customGateName];
                    var customCircuit = new QuantumCircuit();
                    customCircuit.load(customGate);
                    qasm += customCircuit.exportQASM("", true, customGateName);
                }
            }
        }
        var numCols = circuit.numCols();
        for (var column = 0; column < numCols; column++) {
            for (var wire = 0; wire < this.numQubits; wire++) {
                var gate = circuit.getGateAt(column, wire);
                if (gate && gate.connector == 0) {
                    if (exportAsGateName) {
                        qasm += "  ";
                    }
                    if (gate.options && gate.options.condition && gate.options.condition.creg) {
                        qasm += "if(" + gate.options.condition.creg + "==" + gate.options.condition.value + ") ";
                    }
                    qasm += gate.name;
                    if (gate.options && gate.options.params) {
                        var gateDef = this.basicGates[gate.name];
                        if (!gateDef) {
                            gateDef = this.customGates[gate.name];
                        }
                        if (gateDef) {
                            var paramDef = gateDef.params || [];
                            var paramCount = paramDef.length;
                            if (paramCount) {
                                qasm += " (";
                                for (var p = 0; p < paramCount; p++) {
                                    var paramName = paramDef[p];
                                    qasm += gate.options.params[paramName];
                                }
                                qasm += ")";
                            }
                        }
                    }
                    for (var w = 0; w < gate.wires.length; w++) {
                        if (w > 0) {
                            qasm += ",";
                        }
                        if (exportAsGateName) {
                            qasm += " " + String.fromCharCode(97 + gate.wires[w]);
                        }
                        else {
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
    ;
    QuantumCircuit.prototype.importQASM = function (input, errorCallback) {
        this.init();
        Qasm(this, input, errorCallback);
    };
    ;
    QuantumCircuit.prototype.exportPyquil = function (comment, decompose, exportAsGateName, versionStr) {
        if (versionStr === void 0) { versionStr = "2.0"; }
        var self = this;
        var version = parseFloat(versionStr);
        if (isNaN(version)) {
            version = 2.0;
        }
        var circuit = null;
        if (decompose) {
            circuit = new QuantumCircuit();
            circuit.load(this.save(true));
        }
        else {
            circuit = this;
        }
        var importGates = "";
        var defParams = [];
        var defGates = "";
        var defRun = "";
        var defArrays = "";
        var usedGates = circuit.usedGates();
        var defGateNames = [];
        var defCircNames = [];
        usedGates.map(function (usedGateName) {
            var basicGate = circuit.basicGates[usedGateName];
            if (basicGate) {
                if (basicGate.exportInfo && basicGate.exportInfo.pyquil) {
                    var quilInfo = basicGate.exportInfo.pyquil;
                    if (quilInfo.array) {
                        var paramList_1 = "";
                        if (quilInfo.params) {
                            paramList_1 += ", [";
                            quilInfo.params.map(function (paramName, paramIndex) {
                                if (paramIndex > 0) {
                                    paramList_1 += ", ";
                                }
                                paramList_1 += "p_" + paramName;
                                var paramText = "p_" + paramName + " = Parameter(\'" + paramName + "\')";
                                if (defParams.indexOf(paramText) < 0) {
                                    defParams.push(paramText);
                                }
                            });
                            paramList_1 += "]";
                        }
                        defRun += "p.inst(" + quilInfo.name + "_defgate)\n";
                        defArrays += quilInfo.name + "_array = np.array(" + quilInfo.array + ")\n";
                        defGates += quilInfo.name + "_defgate = DefGate(\'" + quilInfo.name + "\', " + quilInfo.name + "_array" + paramList_1 + ")\n";
                        defGates += quilInfo.name + " = " + quilInfo.name + "_defgate.get_constructor()\n";
                        defGateNames.push(quilInfo.name);
                    }
                    else {
                        var importName = "";
                        if (quilInfo.replacement) {
                            var bg = circuit.basicGates[quilInfo.replacement.name];
                            if (bg) {
                                if (bg.exportInfo) {
                                    if (bg.exportInfo.pyquil) {
                                        importName = bg.exportInfo.pyquil.name;
                                    }
                                    else {
                                        if (bg.exportInfo.quil) {
                                            importName = bg.exportInfo.quil.name;
                                        }
                                    }
                                }
                            }
                        }
                        else {
                            importName = quilInfo.name;
                        }
                        if (importName) {
                            if (importGates) {
                                importGates += ", ";
                            }
                            importGates += importName;
                        }
                    }
                }
                else {
                    if (basicGate.exportInfo && basicGate.exportInfo.quil) {
                        var quilInfo = basicGate.exportInfo.quil;
                        if (!quilInfo.defgate) {
                            var importName = "";
                            if (quilInfo.replacement) {
                                var bg = circuit.basicGates[quilInfo.replacement.name];
                                if (bg) {
                                    if (bg.exportInfo) {
                                        if (bg.exportInfo.pyquil) {
                                            importName = bg.exportInfo.pyquil.name;
                                        }
                                        else {
                                            if (bg.exportInfo.quil) {
                                                importName = bg.exportInfo.quil.name;
                                            }
                                        }
                                    }
                                }
                            }
                            else {
                                importName = quilInfo.name;
                            }
                            if (importName) {
                                if (importGates) {
                                    importGates += ", ";
                                }
                                importGates += importName;
                            }
                        }
                    }
                    else {
                    }
                }
            }
        });
        var gotConditions = false;
        for (var column = 0; column < circuit.numCols(); column++) {
            for (var wire = 0; wire < circuit.numQubits; wire++) {
                var gate = circuit.getGateAt(column, wire);
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
            }
            else {
                importGates += "MOVE, NOT, IOR, AND";
            }
        }
        var importsForDefgate = "";
        if (defGates) {
            importsForDefgate = "from pyquil.parameters import Parameter, quil_sin, quil_cos, quil_sqrt, quil_exp, quil_cis\nfrom pyquil.quilbase import DefGate";
        }
        var pyquil = "";
        if (comment) {
            var comm = (comment || "").split("\n");
            comm.map(function (cline) {
                if (cline.length >= 1 && cline[0] != "#") {
                    pyquil += "# ";
                }
                pyquil += cline;
                pyquil += "\n";
            });
        }
        var indent = "";
        if (exportAsGateName) {
            var args = "";
            var argCount = 0;
            for (var i = 0; i < circuit.params.length; i++) {
                if (argCount > 0) {
                    args += ", ";
                }
                args += circuit.params[i];
                argCount++;
            }
            for (var i = 0; i < circuit.numQubits; i++) {
                if (argCount > 0) {
                    args += ", ";
                }
                args += "q" + i;
                argCount++;
            }
            pyquil += "def " + exportAsGateName + (args ? "(" + args + ")" : "") + ":\n";
            indent = "    ";
        }
        else {
            if (version < 2) {
                pyquil += "from pyquil.api import QVMConnection\n";
                pyquil += "from pyquil.quil import Program\n";
            }
            else {
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
                for (var customGateName in circuit.customGates) {
                    var customGate = circuit.customGates[customGateName];
                    var customCircuit = new QuantumCircuit();
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
        }
        ;
        pyquil += indent + "p = Program()\n\n";
        if (version >= 2 && !exportAsGateName) {
            var totalBits = circuit.cregTotalBits();
            if (gotConditions) {
                totalBits += 1;
            }
            ;
            if (totalBits) {
                pyquil += "ro = p.declare('ro', memory_type='BIT', memory_size='" + totalBits + "')\n";
                pyquil += "\n";
            }
        }
        pyquil += defRun ? (defRun + "\n") : "";
        for (var column = 0; column < circuit.numCols(); column++) {
            var _loop_2 = function (wire) {
                var gate = circuit.getGateAt(column, wire);
                if (gate && gate.connector == 0) {
                    var gateDef = circuit.getGateDef(gate.name);
                    var gateParams = gateParams = gate.options && gate.options.params ? gate.options.params : {};
                    var quilInfo = null;
                    if (gateDef) {
                        if (gateDef.exportInfo) {
                            if (gateDef.exportInfo.pyquil && gateDef.exportInfo.pyquil.replacement) {
                                if (gateDef.exportInfo.pyquil.replacement.params) {
                                    gateParams = gateDef.exportInfo.pyquil.replacement.params;
                                }
                                gateDef = circuit.getGateDef(gateDef.exportInfo.pyquil.replacement.name);
                            }
                            else {
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
                                }
                                else {
                                    if (gateDef.exportInfo.quil) {
                                        quilInfo = gateDef.exportInfo.quil;
                                    }
                                }
                            }
                        }
                        var isDefGate = false;
                        var isDefCirc = false;
                        if (quilInfo) {
                            isDefGate = defGateNames.indexOf(quilInfo.name) >= 0;
                            isDefCirc = defCircNames.indexOf(quilInfo.name) >= 0;
                        }
                        else {
                            isDefGate = defGateNames.indexOf(gate.name) >= 0;
                            isDefCirc = defCircNames.indexOf(gate.name) >= 0;
                        }
                        var insideControl = false;
                        if (gate.options && gate.options.condition && gate.options.condition.creg) {
                            insideControl = true;
                            pyquil += "\n";
                            var testBit_1 = self.cregTotalBits();
                            var condition = gate.options.condition;
                            var conditionValue = condition.value || 0;
                            var cregBase_1 = self.cregBase(condition.creg);
                            if (conditionValue == 0) {
                                var cregSize = self.cregs[condition.creg].length;
                                if (version < 2) {
                                    pyquil += indent + "p.inst(FALSE(" + testBit_1 + "))\n";
                                    for (var bitIndex = 0; bitIndex < cregSize; bitIndex++) {
                                        pyquil += indent + "p.inst(OR(" + (bitIndex + cregBase_1) + ", " + testBit_1 + "))\n";
                                    }
                                    pyquil += indent + "p.inst(NOT(" + testBit_1 + "))\n";
                                    pyquil += indent + "p.if_then(" + testBit_1 + ", Program(";
                                }
                                else {
                                    pyquil += indent + "p.inst(MOVE(ro[" + testBit_1 + "], 0))\n";
                                    for (var bitIndex = 0; bitIndex < cregSize; bitIndex++) {
                                        pyquil += indent + "p.inst(IOR(ro[" + (bitIndex + cregBase_1) + "], ro[" + testBit_1 + "]))\n";
                                    }
                                    pyquil += indent + "p.inst(NOT(ro[" + testBit_1 + "]))\n";
                                    pyquil += indent + "p.if_then(ro[" + testBit_1 + "], Program(";
                                }
                            }
                            else {
                                var bitStr_1 = conditionValue.toString(2).split("").reverse();
                                var bitCount_1 = 0;
                                var singleBitIndex_1 = 0;
                                bitStr_1.map(function (bitValue, bitIndex) {
                                    var bitVal = parseInt(bitValue);
                                    bitStr_1[bitIndex] = bitVal;
                                    if (bitVal) {
                                        bitCount_1++;
                                        singleBitIndex_1 = bitIndex;
                                    }
                                });
                                if (bitCount_1 == 1) {
                                    if (version < 2) {
                                        pyquil += indent + "p.if_then(" + (singleBitIndex_1 + cregBase_1) + ", Program(";
                                    }
                                    else {
                                        pyquil += indent + "p.if_then(ro[" + (singleBitIndex_1 + cregBase_1) + "], Program(";
                                    }
                                }
                                else {
                                    if (version < 2) {
                                        pyquil += indent + "p.inst(FALSE(" + testBit_1 + "))\n";
                                        var firstSet_1 = true;
                                        bitStr_1.map(function (bitValue, bitIndex) {
                                            if (bitValue) {
                                                if (firstSet_1) {
                                                    firstSet_1 = false;
                                                    pyquil += indent + "p.inst(OR(" + (bitIndex + cregBase_1) + ", " + testBit_1 + "))\n";
                                                }
                                                else {
                                                    pyquil += indent + "p.inst(AND(" + (bitIndex + cregBase_1) + ", " + testBit_1 + "))\n";
                                                }
                                            }
                                        });
                                        pyquil += indent + "p.if_then(" + testBit_1 + ", Program(";
                                    }
                                    else {
                                        pyquil += indent + "p.inst(MOVE(ro[" + testBit_1 + "], 0))\n";
                                        var firstSet_2 = true;
                                        bitStr_1.map(function (bitValue, bitIndex) {
                                            if (bitValue) {
                                                if (firstSet_2) {
                                                    firstSet_2 = false;
                                                    pyquil += indent + "p.inst(IOR(ro[" + (bitIndex + cregBase_1) + "], ro[" + testBit_1 + "]))\n";
                                                }
                                                else {
                                                    pyquil += indent + "p.inst(AND(ro[" + (bitIndex + cregBase_1) + "], ro[" + testBit_1 + "]))\n";
                                                }
                                            }
                                        });
                                        pyquil += indent + "p.if_then(ro[" + testBit_1 + "], Program(";
                                    }
                                }
                            }
                        }
                        else {
                            pyquil += indent + "p.inst(";
                        }
                        if (quilInfo) {
                            pyquil += quilInfo.name;
                        }
                        else {
                            pyquil += gate.name;
                        }
                        var gotOpenBrace = false;
                        if (quilInfo && quilInfo.params && quilInfo.params.length) {
                            var argCount = 0;
                            pyquil += "(";
                            gotOpenBrace = true;
                            for (var p = 0; p < quilInfo.params.length; p++) {
                                if (argCount > 0) {
                                    pyquil += ", ";
                                }
                                var node = math.parse(gateParams[quilInfo.params[p]]);
                                pyquil += node.toString({ handler: mathToStringHandler });
                                argCount++;
                            }
                            if (version < 2 || isDefGate) {
                                pyquil += ")";
                            }
                            else {
                                pyquil += ", ";
                            }
                        }
                        else {
                            if (gateDef && gateDef.params && gateDef.params.length) {
                                var argCount = 0;
                                pyquil += "(";
                                gotOpenBrace = true;
                                for (var p = 0; p < gateDef.params.length; p++) {
                                    if (argCount > 0) {
                                        pyquil += ", ";
                                    }
                                    var node = math.parse(gateParams[gateDef.params[p]]);
                                    pyquil += node.toString({ handler: mathToStringHandler });
                                    argCount++;
                                }
                                if (version < 2 || isDefGate) {
                                    pyquil += ")";
                                }
                                else {
                                    pyquil += ", ";
                                }
                            }
                        }
                        if (gate.wires.length) {
                            var argCount = 0;
                            if (version < 2 || !gotOpenBrace || isDefGate) {
                                pyquil += "(";
                                gotOpenBrace = true;
                            }
                            for (var w = 0; w < gate.wires.length; w++) {
                                if (argCount > 0) {
                                    pyquil += ", ";
                                }
                                if (exportAsGateName) {
                                    pyquil += "q" + gate.wires[w];
                                }
                                else {
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
                                }
                                else {
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
                    }
                    else {
                    }
                }
            };
            for (var wire = 0; wire < circuit.numQubits; wire++) {
                _loop_2(wire);
            }
        }
        if (exportAsGateName) {
            pyquil += indent + "return p\n";
            pyquil += "\n";
        }
        else {
            pyquil += "\n";
            if (version < 2) {
                pyquil += "qvm = QVMConnection()\n";
                pyquil += "print(qvm.run(p))\n";
            }
            else {
                pyquil += "qvm = get_qc('9q-generic-qvm')\n";
                pyquil += "print(qvm.run(p))\n";
            }
        }
        return pyquil;
    };
    ;
    QuantumCircuit.prototype.exportQuil = function (comment, decompose, exportAsGateName, versionStr) {
        if (comment === void 0) { comment = ""; }
        if (versionStr === void 0) { versionStr = "2.0"; }
        var self = this;
        var version = parseFloat(versionStr);
        if (isNaN(version)) {
            version = 2.0;
        }
        var circuit = null;
        if (decompose) {
            circuit = new QuantumCircuit();
            circuit.load(this.save(true));
        }
        else {
            circuit = this;
        }
        var quil = "";
        if (comment) {
            var comm = (comment || "").split("\n");
            comm.map(function (cline) {
                if (cline.length >= 1 && cline[0] != "#") {
                    quil += "# ";
                }
                quil += cline;
                quil += "\n";
            });
        }
        var usedGates = circuit.usedGates();
        usedGates.map(function (usedGateName) {
            var basicGate = circuit.basicGates[usedGateName];
            if (basicGate) {
                if (basicGate.exportInfo && basicGate.exportInfo.quil) {
                    if (basicGate.exportInfo.quil.defgate) {
                        quil += basicGate.exportInfo.quil.defgate;
                        quil += "\n\n";
                    }
                }
                else {
                }
            }
        });
        var gotConditions = false;
        for (var column = 0; column < circuit.numCols(); column++) {
            for (var wire = 0; wire < circuit.numQubits; wire++) {
                var gate = circuit.getGateAt(column, wire);
                if (gate && gate.connector == 0) {
                    if (gate.options && gate.options.condition && gate.options.condition.creg) {
                        gotConditions = true;
                    }
                }
            }
        }
        var indent = "";
        if (exportAsGateName) {
            var params = "";
            if (circuit.params.length) {
                params += "(";
                for (var i = 0; i < circuit.params.length; i++) {
                    if (i > 0) {
                        params += ", ";
                    }
                    params += "%" + circuit.params[i];
                }
                params += ")";
            }
            var args = "";
            for (var i = 0; i < circuit.numQubits; i++) {
                if (i > 0) {
                    args += " ";
                }
                args += "q" + i;
            }
            quil += "DEFCIRCUIT " + exportAsGateName + (params ? " " + params : "") + (args ? " " + args : "") + ":\n";
            indent = "    ";
        }
        else {
            quil += "\n";
            if (version >= 2) {
                var totalBits = circuit.cregTotalBits();
                if (gotConditions) {
                    totalBits += 1;
                }
                ;
                if (totalBits) {
                    quil += "DECLARE ro BIT[" + totalBits + "]\n\n";
                }
            }
            if (!decompose) {
                for (var customGateName in circuit.customGates) {
                    var customGate = circuit.customGates[customGateName];
                    var customCircuit = new QuantumCircuit();
                    customCircuit.load(customGate);
                    quil += customCircuit.exportQuil("", false, customGateName);
                }
            }
        }
        function mathToStringHandler(node, options) {
            if (node.isSymbolNode && circuit.params.indexOf(node.name) >= 0) {
                return "%" + node.name;
            }
        }
        ;
        var labelCounter = 1;
        for (var column = 0; column < circuit.numCols(); column++) {
            var _loop_3 = function (wire) {
                var gate = circuit.getGateAt(column, wire);
                if (gate && gate.connector == 0) {
                    var gateDef = circuit.getGateDef(gate.name);
                    var gateParams = gate.options && gate.options.params ? gate.options.params : {};
                    var quilInfo = null;
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
                        var insideControl = false;
                        if (gate.options && gate.options.condition && gate.options.condition.creg) {
                            insideControl = true;
                            quil += "\n";
                            var testBit_2 = self.cregTotalBits();
                            var condition = gate.options.condition;
                            var conditionValue = condition.value || 0;
                            var cregBase_2 = self.cregBase(condition.creg);
                            if (conditionValue == 0) {
                                var cregSize = self.cregs[condition.creg].length;
                                if (version < 2) {
                                    quil += indent + "FALSE [" + testBit_2 + "]\n";
                                    for (var bitIndex = 0; bitIndex < cregSize; bitIndex++) {
                                        quil += indent + "OR [" + (bitIndex + cregBase_2) + "] [" + testBit_2 + "]\n";
                                    }
                                    quil += indent + "NOT [" + testBit_2 + "]\n";
                                    quil += "JUMP-WHEN @THEN" + labelCounter + " [" + testBit_2 + "]\n";
                                    quil += "JUMP @END" + (labelCounter + 1) + "\n";
                                    quil += "LABEL @THEN" + labelCounter + "\n";
                                }
                                else {
                                    quil += indent + "FALSE ro[" + testBit_2 + "]\n";
                                    for (var bitIndex = 0; bitIndex < cregSize; bitIndex++) {
                                        quil += indent + "OR ro[" + (bitIndex + cregBase_2) + "] ro[" + testBit_2 + "]\n";
                                    }
                                    quil += indent + "NOT ro[" + testBit_2 + "]\n";
                                    quil += "JUMP-WHEN @THEN" + labelCounter + " ro[" + testBit_2 + "]\n";
                                    quil += "JUMP @END" + (labelCounter + 1) + "\n";
                                    quil += "LABEL @THEN" + labelCounter + "\n";
                                }
                            }
                            else {
                                var bitStr_2 = conditionValue.toString(2).split("").reverse();
                                var bitCount_2 = 0;
                                var singleBitIndex_2 = 0;
                                bitStr_2.map(function (bitValue, bitIndex) {
                                    var bitVal = parseInt(bitValue);
                                    bitStr_2[bitIndex] = bitVal;
                                    if (bitVal) {
                                        bitCount_2++;
                                        singleBitIndex_2 = bitIndex;
                                    }
                                });
                                if (bitCount_2 == 1) {
                                    if (version < 2) {
                                        quil += "JUMP-WHEN @THEN" + labelCounter + " [" + (singleBitIndex_2 + cregBase_2) + "]\n";
                                        quil += "JUMP @END" + (labelCounter + 1) + "\n";
                                        quil += "LABEL @THEN" + labelCounter + "\n";
                                    }
                                    else {
                                        quil += "JUMP-WHEN @THEN" + labelCounter + " ro[" + (singleBitIndex_2 + cregBase_2) + "]\n";
                                        quil += "JUMP @END" + (labelCounter + 1) + "\n";
                                        quil += "LABEL @THEN" + labelCounter + "\n";
                                    }
                                }
                                else {
                                    if (version < 2) {
                                        quil += indent + "FALSE [" + testBit_2 + "]\n";
                                        var firstSet_3 = true;
                                        bitStr_2.map(function (bitValue, bitIndex) {
                                            if (bitValue) {
                                                if (firstSet_3) {
                                                    firstSet_3 = false;
                                                    quil += indent + "OR [" + (bitIndex + cregBase_2) + "] [" + testBit_2 + "]\n";
                                                }
                                                else {
                                                    quil += indent + "AND [" + (bitIndex + cregBase_2) + "] [" + testBit_2 + "]\n";
                                                }
                                            }
                                        });
                                        quil += "JUMP-WHEN @THEN" + labelCounter + " [" + testBit_2 + "]\n";
                                        quil += "JUMP @END" + (labelCounter + 1) + "\n";
                                        quil += "LABEL @THEN" + labelCounter + "\n";
                                    }
                                    else {
                                        quil += indent + "FALSE ro[" + testBit_2 + "]\n";
                                        var firstSet_4 = true;
                                        bitStr_2.map(function (bitValue, bitIndex) {
                                            if (bitValue) {
                                                if (firstSet_4) {
                                                    firstSet_4 = false;
                                                    quil += indent + "OR ro[" + (bitIndex + cregBase_2) + "] ro[" + testBit_2 + "]\n";
                                                }
                                                else {
                                                    quil += indent + "AND ro[" + (bitIndex + cregBase_2) + "] ro[" + testBit_2 + "]\n";
                                                }
                                            }
                                        });
                                        quil += "JUMP-WHEN @THEN" + labelCounter + " ro[" + testBit_2 + "]\n";
                                        quil += "JUMP @END" + (labelCounter + 1) + "\n";
                                        quil += "LABEL @THEN" + labelCounter + "\n";
                                    }
                                }
                            }
                        }
                        if (quilInfo) {
                            quil += indent + quilInfo.name;
                        }
                        else {
                            quil += indent + gate.name;
                        }
                        quil += " ";
                        var argCount = 0;
                        if (quilInfo && quilInfo.params && quilInfo.params.length) {
                            quil += "(";
                            for (var p = 0; p < quilInfo.params.length; p++) {
                                if (argCount > 0) {
                                    quil += ", ";
                                }
                                var node = math.parse(gateParams[quilInfo.params[p]]);
                                quil += node.toString({ handler: mathToStringHandler });
                                argCount++;
                            }
                            quil += ")";
                        }
                        else {
                            if (gateDef && gateDef.params && gateDef.params.length) {
                                quil += "(";
                                for (var p = 0; p < gateDef.params.length; p++) {
                                    if (argCount > 0) {
                                        quil += ", ";
                                    }
                                    var node = math.parse(gateParams[gateDef.params[p]]);
                                    quil += node.toString({ handler: mathToStringHandler });
                                    argCount++;
                                }
                                quil += ")";
                            }
                        }
                        for (var w = 0; w < gate.wires.length; w++) {
                            if (argCount > 0) {
                                quil += " ";
                            }
                            if (exportAsGateName) {
                                quil += "q" + gate.wires[w];
                            }
                            else {
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
                            }
                            else {
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
                    }
                    else {
                        console.log("unknown gate", gate.name);
                    }
                }
            };
            for (var wire = 0; wire < circuit.numQubits; wire++) {
                _loop_3(wire);
            }
        }
        if (exportAsGateName) {
            quil += "\n";
        }
        return quil;
    };
    ;
    QuantumCircuit.prototype.exportSVG = function (embedded) {
        var self = this;
        var cellWidth = 40;
        var cellHeight = 40;
        var hSpacing = 20;
        var vSpacing = 20;
        var blackboxPaddingX = 2;
        var blackboxPaddingY = 2;
        var blackboxLineColor = "black";
        var wireColor = "black";
        var gateLineColor = "black";
        var cWireColor = "silver";
        var cArrowSize = 10;
        var wireWidth = 1;
        var dotRadius = 5;
        function cregIndex(name) {
            var cregIndex = 0;
            for (var cregName in self.cregs) {
                if (cregName == name) {
                    return cregIndex;
                }
                cregIndex++;
            }
            return cregIndex;
        }
        ;
        function cregCount() {
            var cregCount = 0;
            for (var cregName in self.cregs) {
                cregCount++;
            }
            return cregCount;
        }
        ;
        var numRows = this.numQubits;
        var numCols = this.numCols();
        var numCregs = cregCount();
        var totalWidth = ((cellWidth + hSpacing) * numCols) + hSpacing;
        var totalHeight = ((cellHeight + vSpacing) * (numRows + numCregs)) + vSpacing;
        function polarToCartesian(centerX, centerY, radius, angleInDegrees) {
            var angleInRadians = (angleInDegrees - 90) * Math.PI / 180.0;
            return {
                x: centerX + (radius * Math.cos(angleInRadians)),
                y: centerY + (radius * Math.sin(angleInRadians))
            };
        }
        function describeArc(x, y, radius, startAngle, endAngle) {
            var start = polarToCartesian(x, y, radius, endAngle);
            var end = polarToCartesian(x, y, radius, startAngle);
            var largeArcFlag = endAngle - startAngle <= 180 ? "0" : "1";
            var d = [
                "M", start.x, start.y,
                "A", radius, radius, 0, largeArcFlag, 0, end.x, end.y
            ].join(" ");
            return d;
        }
        function qWireY(wire) {
            return ((cellHeight + vSpacing) * wire) + (vSpacing + (cellHeight / 2));
        }
        ;
        function qGateY(wire) {
            return ((cellHeight + vSpacing) * wire) + vSpacing;
        }
        ;
        function cWireY(cregName) {
            return ((cellHeight + vSpacing) * (numRows + cregIndex(cregName))) + (vSpacing + (cellHeight / 2));
        }
        ;
        function drawGate(gate, colIndex, rowIndex) {
            var dinfo = self.basicGates[gate.name] ? self.basicGates[gate.name].drawingInfo : null;
            var blackbox = false;
            if (!dinfo) {
                if (gate.wires.length == 1) {
                    dinfo = { connectors: ["box"] };
                }
                else {
                    dinfo = { connectors: [] };
                    blackbox = true;
                }
            }
            while (dinfo.connectors.length < gate.wires.length) {
                dinfo.connectors.push("box");
            }
            var topWire = Math.min.apply(null, gate.wires);
            var bottomWire = Math.max.apply(null, gate.wires);
            var cLinkTopY = cWireY(bottomWire);
            var svg = "";
            svg += "<g class=\"qc-gate-group\">";
            if (blackbox) {
                var gateX = (((cellWidth + hSpacing) * colIndex) + hSpacing) - blackboxPaddingX;
                var gateY = qGateY(topWire) - blackboxPaddingY;
                var gateWidth = cellWidth + (2 * blackboxPaddingX);
                var gateHeight = ((qGateY(bottomWire) + cellHeight) - gateY) + blackboxPaddingY;
                cLinkTopY = gateY + gateHeight;
                svg += "<rect class=\"qc-gate-blackbox\" x=\"" + gateX + "\" y=\"" + gateY + "\" width=\"" + gateWidth + "\" height=\"" + gateHeight + "\" stroke=\"" + blackboxLineColor + "\" fill=\"transparent\" stroke-width=\"1\" />";
            }
            if (topWire != bottomWire && !blackbox) {
                var linkX = (((cellWidth + hSpacing) * colIndex) + hSpacing) + (cellWidth / 2);
                var linkY1 = (((cellHeight + vSpacing) * topWire) + vSpacing) + (cellHeight / 2);
                var linkY2 = (((cellHeight + vSpacing) * bottomWire) + vSpacing) + (cellHeight / 2);
                svg += "<line class=\"qc-gate-link\" x1=\"" + linkX + "\" x2=\"" + linkX + "\" y1=\"" + linkY1 + "\" y2=\"" + linkY2 + "\" stroke=\"" + wireColor + "\" stroke-width=\"1\" />";
            }
            gate.wires.map(function (wire, connector) {
                switch (dinfo.connectors[connector]) {
                    case "box":
                        {
                            var gateWidth = cellWidth;
                            var gateHeight = cellWidth;
                            var gateX = ((cellWidth + hSpacing) * colIndex) + hSpacing;
                            var gateY = ((cellHeight + vSpacing) * wire) + vSpacing;
                            if (!blackbox && wire == bottomWire) {
                                cLinkTopY = gateY + gateHeight;
                            }
                            svg += "<rect class=\"qc-gate-box\" x=\"" + gateX + "\" y=\"" + gateY + "\" width=\"" + gateWidth + "\" height=\"" + gateHeight + "\" stroke=\"" + gateLineColor + "\" fill=\"white\" stroke-width=\"1\" />";
                            svg += "<text class=\"qc-gate-label\" x=\"" + (gateX + (gateWidth / 2)) + "\" y=\"" + (gateY + (gateHeight / 2)) + "\" alignment-baseline=\"middle\" text-anchor=\"middle\">" + (blackbox ? String.fromCharCode(97 + connector) : (dinfo.label || gate.name)) + "</text>";
                        }
                        ;
                        break;
                    case "not":
                        {
                            var gateWidth = cellWidth;
                            var gateHeight = cellWidth;
                            var gateX = ((cellWidth + hSpacing) * colIndex) + hSpacing;
                            var gateY = ((cellHeight + vSpacing) * wire) + vSpacing;
                            var centerX = gateX + (gateWidth / 2);
                            var centerY = gateY + (gateHeight / 2);
                            if (!blackbox && wire == bottomWire) {
                                cLinkTopY = gateY + gateHeight;
                            }
                            svg += "<ellipse class=\"qc-gate-not\" cx=\"" + centerX + "\" cy=\"" + centerY + "\" rx=\"" + (gateWidth / 2) + "\" ry=\"" + (gateHeight / 2) + "\" stroke=\"" + gateLineColor + "\" fill=\"white\" stroke-width=\"1\" />";
                            svg += "<line class=\"qc-gate-not-line\" x1=\"" + centerX + "\" x2=\"" + centerX + "\" y1=\"" + gateY + "\" y2=\"" + (gateY + gateHeight) + "\" stroke=\"" + gateLineColor + "\" stroke-width=\"1\" />";
                            svg += "<line class=\"qc-gate-not-line\" x1=\"" + gateX + "\" x2=\"" + (gateX + gateWidth) + "\" y1=\"" + centerY + "\" y2=\"" + centerY + "\" stroke=\"" + gateLineColor + "\" stroke-width=\"1\" />";
                        }
                        ;
                        break;
                    case "x":
                        {
                            var gateWidth = cellWidth / 2;
                            var gateHeight = cellWidth / 2;
                            var gateX = (((cellWidth + hSpacing) * colIndex) + hSpacing) + (gateWidth / 2);
                            var gateY = (((cellHeight + vSpacing) * wire) + vSpacing) + (gateHeight / 2);
                            if (!blackbox && wire == bottomWire) {
                                cLinkTopY = cWireY(bottomWire);
                            }
                            svg += "<line class=\"qc-gate-x\" x1=\"" + gateX + "\" x2=\"" + (gateX + gateWidth) + "\" y1=\"" + gateY + "\" y2=\"" + (gateY + gateHeight) + "\" stroke=\"" + gateLineColor + "\" stroke-width=\"1\" />";
                            svg += "<line class=\"qc-gate-x\" x1=\"" + gateX + "\" x2=\"" + (gateX + gateWidth) + "\" y1=\"" + (gateY + gateHeight) + "\" y2=\"" + gateY + "\" stroke=\"" + gateLineColor + "\" stroke-width=\"1\" />";
                        }
                        ;
                        break;
                    case "dot":
                        {
                            var gateWidth = cellWidth;
                            var gateHeight = cellWidth;
                            var gateX = (((cellWidth + hSpacing) * colIndex) + hSpacing) + (gateWidth / 2);
                            var gateY = (((cellHeight + vSpacing) * wire) + vSpacing) + (gateHeight / 2);
                            if (!blackbox && wire == bottomWire) {
                                cLinkTopY = cWireY(bottomWire) + dotRadius;
                            }
                            svg += "<circle class=\"qc-gate-dot\" cx=\"" + gateX + "\" cy=\"" + gateY + "\" r=\"" + dotRadius + "\" stroke=\"" + wireColor + "\" fill=\"" + wireColor + "\" stroke-width=\"1\" />";
                        }
                        ;
                        break;
                    case "gauge":
                        {
                            var gateWidth = cellWidth;
                            var gateHeight = cellWidth;
                            var gateX = ((cellWidth + hSpacing) * colIndex) + hSpacing;
                            var gateY = ((cellHeight + vSpacing) * wire) + vSpacing;
                            var centerX = gateX + (gateWidth / 2);
                            var centerY = gateY + (gateHeight / 2);
                            var movedown = gateHeight / 5;
                            if (!blackbox && wire == bottomWire) {
                                cLinkTopY = gateY + gateHeight;
                            }
                            svg += "<rect class=\"qc-gate-box\" x=\"" + gateX + "\" y=\"" + gateY + "\" width=\"" + gateWidth + "\" height=\"" + gateHeight + "\" stroke=\"" + gateLineColor + "\" fill=\"white\" stroke-width=\"1\" />";
                            svg += "<path class=\"gc-gate-gauge-arc\" d=\"" + describeArc(centerX, centerY + movedown, gateWidth / 2.3, 300, 60) + "\" stroke=\"" + gateLineColor + "\" fill=\"none\" stroke-width=\"1\" />";
                            svg += "<line class=\"qc-gate-gauge-scale\" x1=\"" + centerX + "\" x2=\"" + ((gateX + gateWidth) - movedown) + "\" y1=\"" + (centerY + movedown) + "\" y2=\"" + (gateY + movedown) + "\" stroke=\"" + gateLineColor + "\" stroke-width=\"1\" />";
                        }
                        ;
                        break;
                }
            });
            if (gate.name == "measure" && gate.options && gate.options.creg && gate.options.creg.name) {
                var linkX = (((cellWidth + hSpacing) * colIndex) + hSpacing) + (cellWidth / 2);
                var linkY1 = cLinkTopY;
                var linkY2 = cWireY(gate.options.creg.name);
                svg += "<line class=\"qc-gate-link-c\" x1=\"" + linkX + "\" x2=\"" + linkX + "\" y1=\"" + linkY1 + "\" y2=\"" + linkY2 + "\" stroke=\"" + cWireColor + "\" stroke-width=\"1\" />";
                svg += "<line class=\"qc-gate-link-c\" x2=\"" + linkX + "\" x1=\"" + (linkX - (cArrowSize / 2)) + "\" y1=\"" + (linkY2 - cArrowSize) + "\" y2=\"" + linkY2 + "\" stroke=\"" + cWireColor + "\" stroke-width=\"1\" />";
                svg += "<line class=\"qc-gate-link-c\" x2=\"" + linkX + "\" x1=\"" + (linkX + (cArrowSize / 2)) + "\" y1=\"" + (linkY2 - cArrowSize) + "\" y2=\"" + linkY2 + "\" stroke=\"" + cWireColor + "\" stroke-width=\"1\" />";
            }
            if (gate.options && gate.options.condition && gate.options.condition.creg) {
                var linkX = (((cellWidth + hSpacing) * colIndex) + hSpacing) + (cellWidth / 2);
                var linkY1 = cLinkTopY;
                var linkY2 = cWireY(gate.options.condition.creg);
                svg += "<line class=\"qc-gate-link-c\" x1=\"" + linkX + "\" x2=\"" + linkX + "\" y1=\"" + linkY1 + "\" y2=\"" + linkY2 + "\" stroke=\"" + cWireColor + "\" stroke-width=\"1\" />";
                svg += "<circle class=\"qc-gate-dot-c\" cx=\"" + linkX + "\" cy=\"" + linkY2 + "\" r=\"" + dotRadius + "\" stroke=\"" + cWireColor + "\" fill=\"" + cWireColor + "\" stroke-width=\"1\" />";
            }
            svg += "</g>";
            return svg;
        }
        var svg = "";
        if (!embedded) {
            svg += "<?xml version=\"1.0\"?>";
            svg += "<!DOCTYPE svg PUBLIC \"-//W3C//DTD SVG 1.1//EN\" \"http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd\">";
        }
        svg += "<svg class=\"qc-circuit\" width=\"" + totalWidth + "\" height=\"" + totalHeight + "\" version=\"1.1\" xmlns=\"http://www.w3.org/2000/svg\">";
        for (var wire = 0; wire < numRows; wire++) {
            var wireY = qWireY(wire);
            svg += "<line class=\"qc-wire\" x1=\"0\" x2=\"" + totalWidth + "\" y1=\"" + wireY + "\" y2=\"" + wireY + "\" stroke=\"" + wireColor + "\" stroke-width=\"" + wireWidth + "\" />";
        }
        for (var cregName in this.cregs) {
            var wireY = cWireY(cregName);
            svg += "<line class=\"qc-wire-c\" x1=\"0\" x2=\"" + totalWidth + "\" y1=\"" + wireY + "\" y2=\"" + wireY + "\" stroke=\"" + cWireColor + "\" stroke-width=\"" + wireWidth + "\" />";
        }
        var numCols = this.numCols();
        for (var column = 0; column < numCols; column++) {
            for (var wire = 0; wire < this.numQubits; wire++) {
                var gate = this.getGateAt(column, wire);
                if (gate && gate.connector == 0) {
                    svg += drawGate(gate, column, wire);
                }
            }
        }
        svg += "</svg>";
        return svg;
    };
    ;
    QuantumCircuit.prototype.run = function (initialValues, options) {
        options = options || {};
        this.initState();
        this.stats.start = new Date();
        if (initialValues) {
            for (var wire = 0; wire < this.numQubits; wire++) {
                if (initialValues[wire]) {
                    this.applyGate("x", [wire]);
                }
            }
        }
        var decomposed = new QuantumCircuit();
        decomposed.load(this.save(true));
        var numCols = decomposed.numCols();
        var gateCounter = 0;
        for (var column = 0; column < numCols; column++) {
            for (var wire = 0; wire < decomposed.numQubits; wire++) {
                var gate = decomposed.getGateAt(column, wire);
                if (gate && gate.connector == 0) {
                    gateCounter++;
                    var executeGate = true;
                    if (gate.options && gate.options.condition && gate.options.condition.creg) {
                        var cregValue = this.getCregValue(gate.options.condition.creg);
                        executeGate = cregValue === gate.options.condition.value;
                    }
                    if (executeGate) {
                        this.applyGate(gate.name, gate.wires, gate.options);
                    }
                    if (options && options.onGate) {
                        options.onGate(column, wire, gateCounter);
                    }
                }
            }
            if (options && options.onColumn) {
                options.onColumn(column);
            }
        }
        this.stats.end = new Date();
        this.stats.duration = this.stats.end - this.stats.start;
    };
    ;
    QuantumCircuit.prototype.test = function (name, gates, expectedState) {
        console.log("TEST: " + name);
        this.clear();
        if (!gates || !gates.length) {
            console.log("Invalid input");
            return false;
        }
        for (var i = 0; i < gates.length; i++) {
            var gate = gates[i];
            if (!gate || !gate.length || gate.length < 3) {
                console.log("Invalid input");
                return false;
            }
            this.addGate(gate[0], gate[1], gate[2]);
        }
        this.run();
        var numRes = this.numAmplitudes();
        if (numRes > expectedState.length) {
            console.log("Warning: expected state is incomplette.");
            numRes = expectedState.length;
        }
        var gotError = false;
        for (var i = 0; i < numRes; i++) {
            var expected = expectedState[i];
            var state = this.state[i] || math.complex(0, 0);
            if (math.round(expected[0], 5) != math.round(state.re, 5) || math.round(expected[1], 5) != math.round(state.im, 5)) {
                if (!gotError) {
                    gotError = true;
                    console.log("ERROR");
                }
                var bin = i.toString(2);
                while (bin.length < this.numQubits) {
                    bin = "0" + bin;
                }
                console.log("|" + bin + "> Expected: " + formatComplex2(expected[0], expected[1]) + " Got: " + Helper_1.formatComplex(state));
            }
        }
        console.log(gotError ? "Didn't pass." : "Passed.");
        console.log("");
        return !gotError;
    };
    ;
    QuantumCircuit.prototype.stateAsString = function (onlyPossible) {
        var numAmplitudes = this.numAmplitudes();
        if (!this.state) {
            return "Error: circuit is not initialized. Please call initState() or run() method.";
        }
        var s = "";
        var count = 0;
        for (var i = 0; i < numAmplitudes; i++) {
            var state = this.state[i] || math.complex(0, 0);
            var m = math.round(math.pow(math.abs(state), 2) * 100, 2);
            if (!onlyPossible || m) {
                if (count) {
                    s += "\n";
                }
                var bin = i.toString(2);
                while (bin.length < this.numQubits) {
                    bin = "0" + bin;
                }
                s += Helper_1.formatComplex(state) + "|" + bin + ">\t" + m + "%";
                count++;
            }
        }
        return s;
    };
    ;
    QuantumCircuit.prototype.print = function (onlyPossible) {
        console.log(this.stateAsString(onlyPossible));
    };
    ;
    QuantumCircuit.prototype.createCreg = function (creg, len) {
        this.cregs[creg] = [];
        while (this.cregs[creg].length < (len || 1)) {
            this.cregs[creg].push(0);
        }
    };
    ;
    QuantumCircuit.prototype.setCregBit = function (creg, cbit, value) {
        var bit = parseInt(cbit);
        if (isNaN(bit)) {
            throw "Error: invalid \"cbit\" argument to \"setCregBit\" method: expected \"integer\" got \"" + typeof cbit + "\".";
        }
        if (!this.cregs[creg]) {
            this.cregs[creg] = [];
        }
        while (bit >= this.cregs[creg].length) {
            this.cregs[creg].push(0);
        }
        this.cregs[creg][bit] = value ? 1 : 0;
    };
    ;
    QuantumCircuit.prototype.getCregBit = function (creg, cbit) {
        if (!this.cregs[creg]) {
            throw "Error: \"getCregBit\": unknown register \"" + creg + "\".";
        }
        var bit = parseInt(cbit);
        if (isNaN(bit) || bit >= this.cregs[creg].length) {
            throw "Error: \"getCregBit\": bit \"" + cbit + "\" not found.";
        }
        return this.cregs[creg][bit];
    };
    ;
    QuantumCircuit.prototype.cregBase = function (creg) {
        if (!this.cregs[creg]) {
            throw "Error: \"getCregBit\": unknown register \"" + creg + "\".";
        }
        var base = 0;
        for (var regName in this.cregs) {
            if (regName == creg) {
                return base;
            }
            base += this.cregs[regName].length;
        }
    };
    ;
    QuantumCircuit.prototype.cregTotalBits = function () {
        var bits = 0;
        for (var regName in this.cregs) {
            bits += this.cregs[regName].length;
        }
        return bits;
    };
    ;
    QuantumCircuit.prototype.getCregValue = function (creg) {
        if (!this.cregs[creg]) {
            throw "Error: \"getCregBit\": unknown register \"" + creg + "\".";
        }
        var len = this.cregs[creg].length;
        var value = 0;
        for (var i = 0; i < len; i++) {
            if (this.cregs[creg][i]) {
                value += math.pow(2, i);
            }
        }
        return value;
    };
    ;
    QuantumCircuit.prototype.measureAll = function (force) {
        if (this.collapsed && this.collapsed.length == this.numQubits && !force) {
            return this.collapsed;
        }
        this.collapsed = [];
        var maxChance = 0;
        for (var is in this.state) {
            var i = parseInt(is);
            var state = this.state[is];
            var chance = 0;
            if (state.re || state.im) {
                chance = math.round(math.pow(math.abs(state), 2), 5);
            }
            if (chance > maxChance || (chance == maxChance && (!this.collapsed.length || !!Math.round(Math.random())))) {
                maxChance = chance;
                this.collapsed = [];
                for (var q = this.numQubits - 1; q >= 0; q--) {
                    this.collapsed.push(1 << q & i ? 1 : 0);
                }
            }
        }
        return this.collapsed;
    };
    ;
    QuantumCircuit.prototype.measure = function (wire, creg, cbit) {
        if (!this.collapsed || this.collapsed.length != this.numQubits) {
            this.measureAll();
        }
        var val = this.collapsed[wire];
        if (creg && typeof cbit != "undefined") {
            this.setCregBit(creg, cbit, val);
        }
        return val;
    };
    ;
    QuantumCircuit.prototype.probabilities = function () {
        this.prob = [];
        for (var wire = 0; wire < this.numQubits; wire++) {
            this.prob.push(0);
        }
        for (var is in this.state) {
            var i = parseInt(is);
            for (var wire = 0; wire < this.numQubits; wire++) {
                var bit = math.pow(2, (this.numQubits - 1) - wire);
                if (i & bit) {
                    var state = this.state[is];
                    if (state.re || state.im) {
                        this.prob[wire] += math.pow(math.abs(state), 2);
                    }
                }
            }
        }
        for (var wire = 0; wire < this.numQubits; wire++) {
            this.prob[wire] = math.round(this.prob[wire], 5);
        }
        return this.prob;
    };
    ;
    QuantumCircuit.prototype.probability = function (wire) {
        if (!this.prob || this.prob.length != this.numQubits) {
            this.probabilities();
        }
        return this.prob[wire];
    };
    ;
    QuantumCircuit.basicGates = BasicGates_1.BasicGates;
    return QuantumCircuit;
}());
;
module.exports = QuantumCircuit;
//# sourceMappingURL=Qu.js.map