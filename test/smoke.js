const assert = require("assert");
const QuantumCircuit = require("..");

function approx(actual, expected, tolerance = 1e-8) {
  assert.ok(
    Math.abs(actual - expected) <= tolerance,
    `expected ${actual} to be within ${tolerance} of ${expected}`,
  );
}

function amplitude(circuit, index) {
  return circuit.state[index] || { re: 0, im: 0 };
}

function testPackageEntrypoint() {
  assert.strictEqual(typeof QuantumCircuit, "function");
  const circuit = new QuantumCircuit(1);
  assert.strictEqual(circuit.numQubits, 1);
}

function testBellStateSimulation() {
  const circuit = new QuantumCircuit(2);
  circuit.addGate("h", -1, 0);
  circuit.addGate("cx", -1, [0, 1]);

  circuit.run();

  const invSqrt2 = 1 / Math.sqrt(2);
  approx(amplitude(circuit, 0).re, invSqrt2);
  approx(amplitude(circuit, 0).im, 0);
  approx(amplitude(circuit, 3).re, invSqrt2);
  approx(amplitude(circuit, 3).im, 0);
  approx(amplitude(circuit, 1).re, 0);
  approx(amplitude(circuit, 2).re, 0);
  assert.deepStrictEqual(circuit.probabilities(), [0.5, 0.5]);
}

function testClearDoesNotDuplicateRows() {
  const circuit = new QuantumCircuit(2);
  circuit.addGate("x", -1, 0);
  circuit.clear();

  assert.strictEqual(circuit.gates.length, 2);
  assert.strictEqual(circuit.numCols(), 0);
}

function testRemoveMultiwireGate() {
  const circuit = new QuantumCircuit(2);
  circuit.addGate("cx", -1, [0, 1]);
  circuit.removeGate(0, 0);

  assert.strictEqual(circuit.gates[0][0], null);
  assert.strictEqual(circuit.gates[1][0], null);
}

function testSaveLoadPreservesClassicalRegisters() {
  const circuit = new QuantumCircuit(1);
  circuit.addMeasure(0, "c", 0);

  const loaded = new QuantumCircuit();
  loaded.load(circuit.save(false));

  assert.deepStrictEqual(loaded.cregs.c, [0]);
}

function testQASMExportFormatsGateParameters() {
  const circuit = new QuantumCircuit(1);
  circuit.addGate("u3", -1, 0, {
    params: { theta: "pi/2", phi: "pi/4", lambda: "pi/8" },
  });

  const qasm = circuit.exportQASM("", false);
  assert.ok(qasm.includes("u3 (pi/2,pi/4,pi/8) q[0];"));
}

function testQASMImport() {
  const circuit = new QuantumCircuit();
  let errors = null;

  circuit.importQASM(
    [
      "OPENQASM 2.0;",
      'include "qelib1.inc";',
      "qreg q[2];",
      "creg c[2];",
      "h q[0];",
      "CX q[0],q[1];",
      "measure q -> c;",
      "",
    ].join("\n"),
    (parserErrors) => {
      errors = parserErrors;
    },
  );

  assert.deepStrictEqual(errors, []);
  assert.strictEqual(circuit.numQubits, 2);
  assert.deepStrictEqual(circuit.cregs.c, [0, 0]);
  assert.strictEqual(circuit.numGates(false), 4);
}

function testQASMImportUGateParameters() {
  const circuit = new QuantumCircuit();
  let errors = null;

  circuit.importQASM(
    [
      "OPENQASM 2.0;",
      'include "qelib1.inc";',
      "qreg q[1];",
      "U(pi/2,pi/4,pi/8) q[0];",
      "",
    ].join("\n"),
    (parserErrors) => {
      errors = parserErrors;
    },
  );

  const gate = circuit.getGateAt(0, 0);
  assert.deepStrictEqual(errors, []);
  assert.strictEqual(gate.name, "u3");
  assert.deepStrictEqual(gate.options.params, {
    theta: "pi/2",
    phi: "pi/4",
    lambda: "pi/8",
  });
}

testPackageEntrypoint();
testBellStateSimulation();
testClearDoesNotDuplicateRows();
testRemoveMultiwireGate();
testSaveLoadPreservesClassicalRegisters();
testQASMExportFormatsGateParameters();
testQASMImport();
testQASMImportUGateParameters();

console.log("Smoke tests passed");
