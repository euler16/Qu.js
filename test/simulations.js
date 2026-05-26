const assert = require("assert");
const QuantumCircuit = require("..");

const EPSILON = 1e-8;

function approx(actual, expected, tolerance = EPSILON) {
  assert.ok(
    Math.abs(actual - expected) <= tolerance,
    `expected ${actual} to be within ${tolerance} of ${expected}`,
  );
}

function amplitude(circuit, index) {
  return circuit.state[index] || { re: 0, im: 0 };
}

function assertComplex(actual, expectedRe, expectedIm = 0) {
  approx(actual.re || 0, expectedRe);
  approx(actual.im || 0, expectedIm);
}

function assertState(circuit, expected) {
  for (let index = 0; index < Math.pow(2, circuit.numQubits); index++) {
    const value = expected[index] || [0, 0];
    assertComplex(amplitude(circuit, index), value[0], value[1]);
  }
}

function runCircuit(numQubits, operations) {
  const circuit = new QuantumCircuit(numQubits);
  operations(circuit);
  circuit.run();
  return circuit;
}

function testSingleQubitBasisAndPhaseGates() {
  assertState(runCircuit(1, (circuit) => circuit.addGate("x", -1, 0)), {
    1: [1, 0],
  });

  assertState(runCircuit(1, (circuit) => circuit.addGate("y", -1, 0)), {
    1: [0, 1],
  });

  assertState(
    runCircuit(1, (circuit) => {
      circuit.addGate("x", -1, 0);
      circuit.addGate("z", -1, 0);
    }),
    {
      1: [-1, 0],
    },
  );

  const invSqrt2 = 1 / Math.sqrt(2);
  assertState(runCircuit(1, (circuit) => circuit.addGate("h", -1, 0)), {
    0: [invSqrt2, 0],
    1: [invSqrt2, 0],
  });

  assertState(
    runCircuit(1, (circuit) => {
      circuit.addGate("h", -1, 0);
      circuit.addGate("h", -1, 0);
    }),
    {
      0: [1, 0],
    },
  );

  assertState(
    runCircuit(1, (circuit) => {
      circuit.addGate("x", -1, 0);
      circuit.addGate("s", -1, 0);
    }),
    {
      1: [0, 1],
    },
  );

  assertState(
    runCircuit(1, (circuit) => {
      circuit.addGate("x", -1, 0);
      circuit.addGate("t", -1, 0);
    }),
    {
      1: [invSqrt2, invSqrt2],
    },
  );
}

function testParameterizedRotationGates() {
  assertState(
    runCircuit(1, (circuit) =>
      circuit.addGate("rx", -1, 0, { params: { theta: "pi" } }),
    ),
    {
      1: [0, -1],
    },
  );

  assertState(
    runCircuit(1, (circuit) =>
      circuit.addGate("ry", -1, 0, { params: { theta: "pi" } }),
    ),
    {
      1: [1, 0],
    },
  );

  assertState(
    runCircuit(1, (circuit) => {
      circuit.addGate("x", -1, 0);
      circuit.addGate("rz", -1, 0, { params: { phi: "pi" } });
    }),
    {
      1: [-1, 0],
    },
  );
}

function testEntanglingAndMultiQubitGates() {
  const invSqrt2 = 1 / Math.sqrt(2);

  assertState(
    runCircuit(2, (circuit) => {
      circuit.addGate("h", -1, 0);
      circuit.addGate("cx", -1, [0, 1]);
    }),
    {
      0: [invSqrt2, 0],
      3: [invSqrt2, 0],
    },
  );

  assertState(
    runCircuit(2, (circuit) => {
      circuit.addGate("x", -1, 0);
      circuit.addGate("swap", -1, [0, 1]);
    }),
    {
      1: [1, 0],
    },
  );

  assertState(
    runCircuit(3, (circuit) => {
      circuit.addGate("x", -1, 0);
      circuit.addGate("x", -1, 1);
      circuit.addGate("ccx", -1, [0, 1, 2]);
    }),
    {
      7: [1, 0],
    },
  );
}

function testDeutschJozsaBalancedOracle() {
  const invSqrt2 = 1 / Math.sqrt(2);
  const circuit = runCircuit(2, (c) => {
    c.addGate("x", -1, 1);
    c.addGate("h", -1, 0);
    c.addGate("h", -1, 1);
    c.addGate("cx", -1, [0, 1]);
    c.addGate("h", -1, 0);
  });

  assertState(circuit, {
    2: [invSqrt2, 0],
    3: [-invSqrt2, 0],
  });
  assert.deepStrictEqual(circuit.probabilities(), [1, 0.5]);
}

function testTwoQubitGroverSearch() {
  const circuit = runCircuit(2, (c) => {
    c.addGate("h", -1, 0);
    c.addGate("h", -1, 1);
    c.addGate("cz", -1, [0, 1]);
    c.addGate("h", -1, 0);
    c.addGate("h", -1, 1);
    c.addGate("x", -1, 0);
    c.addGate("x", -1, 1);
    c.addGate("cz", -1, [0, 1]);
    c.addGate("x", -1, 0);
    c.addGate("x", -1, 1);
    c.addGate("h", -1, 0);
    c.addGate("h", -1, 1);
  });

  assertState(circuit, {
    3: [-1, 0],
  });
  assert.deepStrictEqual(circuit.probabilities(), [1, 1]);
}

function testClassicalMeasurementCondition() {
  const circuit = runCircuit(2, (c) => {
    c.addGate("x", -1, 0);
    c.addMeasure(0, "c", 0);
    c.addGate("x", -1, 1, { condition: { creg: "c", value: 1 } });
  });

  assert.deepStrictEqual(circuit.cregs.c, [1]);
  assertState(circuit, {
    3: [1, 0],
  });
}

function testCustomGateDecomposition() {
  const custom = new QuantumCircuit(1);
  custom.addGate("h", -1, 0);

  const circuit = new QuantumCircuit(1);
  circuit.registerGate("myh", custom.save(false));
  circuit.addGate("myh", -1, 0);
  circuit.run();

  const invSqrt2 = 1 / Math.sqrt(2);
  assertState(circuit, {
    0: [invSqrt2, 0],
    1: [invSqrt2, 0],
  });
  assert.strictEqual(circuit.numGates(true), 1);
}

testSingleQubitBasisAndPhaseGates();
testParameterizedRotationGates();
testEntanglingAndMultiQubitGates();
testDeutschJozsaBalancedOracle();
testTwoQubitGroverSearch();
testClassicalMeasurementCondition();
testCustomGateDecomposition();

console.log("Simulation tests passed");
