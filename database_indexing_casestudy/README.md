# Database Indexing and Query Optimization
## A Discrete Mathematical Approach Using Permutations, Combinations, and Mathematical Induction

An academic case study project designed for college-level presentations, laboratory demonstrations, and academic reference.

---

## 📋 Project Summary

This project investigates the search space and execution performance of relational database management systems (RDBMS) through core discrete mathematics:
- **Combinations (\(nCr\))**: Applied to the *Index Selection Problem* to identify optimal candidate index subsets under storage budgets and write-amplification penalties.
- **Permutations (\(n!\) & \(P(n, r)\))**: Applied to *Composite Multi-Column Indexes* (the B+Tree Leftmost Prefix Rule) and the join order evaluation search space in Cost-Based Query Optimizers (CBO).
- **Mathematical Induction**: Provides a formal 4-step proof (Base Case, Induction Hypothesis, Induction Step, Conclusion) establishing that \(n\) index evaluation sequences generate exactly \(n!\) distinct orders.
- **Interactive Demonstrator & Simulator**: An empirical client-side tool to calculate combinatorial metrics, generate evaluation sequences, and simulate disk I/O savings on tables with up to 10,000,000 records.

---

## 📁 Repository Structure

```
c:\Nemo\database_indexing_casestudy\
├── index.html               # Master 12-page web application
├── style.css                # Academic white-and-blue theme, responsive typography, print CSS
├── app.js                   # Navigation engine, keyboard shortcuts, BigInt math, simulator
├── optimizer_calculator.py  # Python standalone calculator, CLI generator, and unit tests
└── README.md                # Project documentation and guide
```

---

## 📖 12-Page Strict Academic Structure

| Page | Section | Description |
| :---: | :--- | :--- |
| **Page 1** | **Title Page** | College name, student credentials, guide details, and academic session placeholders (inline editable). |
| **Page 2** | **Abstract** | Dedicated solely to the abstract; outlines indexing, query optimization, and discrete mathematical modeling. |
| **Page 3** | **Introduction** | B+Tree fundamentals, \(\mathcal{O}(\log N)\) vs \(\mathcal{O}(N)\), and query optimizer architecture. |
| **Page 4** | **Problem Statement & Objectives** | E-commerce 5,000,000 row scenario, write amplification dilemma, and research objectives. |
| **Page 5** | **Permutations** | Formula \(P(n, r)\), worked examples, composite index column precedence, and Leftmost Prefix Rule. |
| **Page 6** | **Combinations** | Formula \(\binom{n}{r}\), worked examples, candidate index pools, and 0/1 knapsack optimization. |
| **Page 7** | **Mathematical Induction** | Rigorous 4-step induction proof establishing \(P(n) = n!\) for all \(n \ge 1\). |
| **Page 8** | **Project Implementation** | Interactive calculator for \(n!\), \(nCr\), permutation list generator, induction step checker, and query cost simulator. |
| **Page 9** | **Results and Discussion** | Growth tables (\(n=1\) to \(15\)), benchmark simulation (625x speedup), and System R dynamic programming analysis. |
| **Page 10** | **Applications and Advantages** | PostgreSQL GEQO, MySQL InnoDB composite rules, Oracle CBO, Snowflake/BigQuery clustering keys. |
| **Page 11** | **Conclusion** | Summary of findings, mathematical synthesis, and database design guidelines. |
| **Page 12** | **References** | Formal citations (Silberschatz, Ramakrishnan, Garcia-Molina, Rosen, Selinger et al.). |

---

## 🚀 How to Run the Project

### Method 1: Direct Browser Launch (No server required)
Simply open the `index.html` file in any modern web browser (Google Chrome, Microsoft Edge, Mozilla Firefox, or Safari):
```powershell
# In PowerShell:
Start-Process "c:\Nemo\database_indexing_casestudy\index.html"
```

### Method 2: Local HTTP Server (Optional)
If you prefer running via a local web server:
```powershell
cd c:\Nemo\database_indexing_casestudy
python -m http.server 3000
# Open http://localhost:3000 in your browser
```

### Method 3: Running the Python Mathematical Module & Unit Tests
To verify all formulas and execute the CLI calculator:
```powershell
c:\Nemo\backend\venv\Scripts\python.exe c:\Nemo\database_indexing_casestudy\optimizer_calculator.py
```
This runs 5 automated unit tests (`unittest`), outputs worked numerical examples, and tests the mathematical induction steps for \(k = 1\) through \(10\).

---

## ⌨️ Navigation Shortcuts

- **Next Page**: Press `Right Arrow (→)` or `PageDown` or click `Next →`
- **Previous Page**: Press `Left Arrow (←)` or `PageUp` or click `← Prev`
- **Direct Jump**: Press keys `1` through `9` on your keyboard, or use the top dropdown selector or quick navigation pill bar.
- **Export to PDF**: Click the **"Export / Print Case Study (PDF)"** button on Page 12 or press `Ctrl + P`. Clean academic print styling with page-breaks is included.
- **Editable Title Page**: On Page 1, click directly on any placeholder (e.g., student name, college name, guide name) to edit your details; changes are automatically saved to `localStorage`.

---

## 🎓 Academic Presentation Tips

1. **Start with the Problem (Page 4):** Show the SQL query on 5,000,000 rows and explain why creating every possible index destroys write performance.
2. **Explain Combinations (Page 6):** Show how choosing candidate index subsets is governed by \(\binom{n}{r}\).
3. **Highlight Permutations & Asymmetry (Page 5):** Emphasize that `INDEX(A, B)` is not equal to `INDEX(B, A)` due to the B+Tree Leftmost Prefix Rule.
4. **Present the Proof (Page 7):** Walk the panel through the Base Case (\(n=1\)), the Induction Hypothesis (\(n=k\)), and show how the \((k+1)\)-th index has \((k+1)\) insertion slots, proving \((k+1) \cdot k! = (k+1)!\).
5. **Live Interactive Demo (Page 8):** Change \(n\) and \(r\), show the generated sequences, and toggle the simulated index configuration to show the 625x latency drop!
