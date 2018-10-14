<div align="center">
  <img src="images/Qujs2.png" alt="Qu.js" width="250" height="100">
  <br>
</div>
<h1 align="center">Quantum Computing for Humans!</h1>

...

**Qu.js is a JavaScript first Quantum Computing framework**.
## Motivation

Currently the Quantum Computing environment, though in its nascent stage, is dominated by 2 Python based Quantum Computing frameworks [Qiskit](https://qiskit.org/) and [PyQuil](https://pyquil.readthedocs.io/en/stable/) developed by [IBM](https://www.research.ibm.com/ibm-q/) and [Rigetti](https://www.rigetti.com/) respectively. These libraries are in turn high-level versions of Assembly like languages QASM (Qiskit) and Quil (PyQuil) which enable users to run their Quantum programs on actual Quantum Computers being developed by these companies.<br>
Qu.js aims to be a common JavaScript frontend that allows developers to  write **backend agnostic Quantum Programs**. *In this sense, the motive behind Qu.js is similar to [Keras] in Machine Learning*.<br>  

>Moreover I developed this library in order to understand the basics of Quantum Computing properly :).

## Functionality
Currently Qu.js provides (or aims to provide) the following functionalities:

- [x] A local Quantum Simulator that can run on browser as well as Node.js
- [x] Compilation of JS code into QASM and Quil
- [ ] Circuit Visualization
- [ ] Saving and Loading Circuit
- [ ] QASM to Quil
- [ ] A Twitter based interface (working on it :) )
- [ ] Support [Cirq](https://ai.googleblog.com/2018/07/announcing-cirq-open-source-framework.html) backend (another Quantum Computing Library)