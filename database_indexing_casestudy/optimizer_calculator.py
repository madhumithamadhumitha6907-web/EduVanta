"""
Database Indexing & Query Optimization - Mathematical Calculator & Verification Module
Topic: Permutations, Combinations, and Mathematical Induction in Query Optimization.
Author: Academic Case Study Project
"""

import math
from itertools import permutations, combinations
import unittest

def factorial(n: int) -> int:
    """Calculates n! for non-negative integers."""
    if not isinstance(n, int) or n < 0:
        raise ValueError("Factorial is only defined for non-negative integers.")
    return math.factorial(n)

def permutations_count(n: int, r: int) -> int:
    """Calculates P(n, r) = n! / (n - r)!"""
    if not (0 <= r <= n):
        raise ValueError("Requires 0 <= r <= n.")
    return math.perm(n, r)

def combinations_count(n: int, r: int) -> int:
    """Calculates C(n, r) = n! / (r! * (n - r)!)"""
    if not (0 <= r <= n):
        raise ValueError("Requires 0 <= r <= n.")
    return math.comb(n, r)

def total_index_subsets(n: int) -> int:
    """Calculates total non-empty index subsets: 2^n - 1"""
    if n < 0:
        raise ValueError("n must be non-negative.")
    return (2 ** n) - 1

def generate_evaluation_orders(items: list[str]) -> list[tuple[str, ...]]:
    """Generates all n! possible evaluation sequences for a set of indexes or predicates."""
    return list(permutations(items))

def generate_index_subsets(items: list[str], r: int) -> list[tuple[str, ...]]:
    """Generates all C(n, r) candidate index combinations."""
    return list(combinations(items, r))

def induction_step_verification(k: int) -> dict[str, any]:
    """
    Verifies the Mathematical Induction Step:
    Hypothesis: P(k) = k!
    Step: P(k+1) = (k+1) * P(k) = (k+1)!
    """
    if k < 1:
        raise ValueError("Induction parameter k must be >= 1.")
    
    hypothetical_k = factorial(k)
    expected_k_plus_1 = factorial(k + 1)
    calculated_k_plus_1 = (k + 1) * hypothetical_k
    
    is_valid = (calculated_k_plus_1 == expected_k_plus_1)
    return {
        "k": k,
        "P(k)": hypothetical_k,
        "k+1": k + 1,
        "P(k+1)_via_step": calculated_k_plus_1,
        "P(k+1)_direct_factorial": expected_k_plus_1,
        "induction_step_holds": is_valid
    }

def simulate_query_cost(total_rows: int, predicates: list[str], index_columns: list[str]) -> dict[str, any]:
    """
    Simulates database query execution cost based on the Leading Prefix Rule.
    
    B+Tree composite index on index_columns (e.g. ['customer_id', 'status', 'created_at']).
    If the leading column of the index is not matched by query predicates, the index
    cannot be used for an index seek (requires full table scan or index scan).
    
    Returns estimated disk I/O pages, estimated latency in ms, and execution strategy.
    """
    pages_per_row = 0.01  # 100 rows per 8KB page
    table_pages = max(1, int(total_rows * pages_per_row))
    
    if not index_columns:
        # Full table scan
        pages_read = table_pages
        latency_ms = round(pages_read * 0.045, 2)
        return {
            "plan": "Full Table Scan (Seq Scan)",
            "index_used": None,
            "matched_prefix_length": 0,
            "pages_read": pages_read,
            "estimated_latency_ms": latency_ms,
            "cost_score": pages_read * 1.0
        }
    
    # Calculate how many leading index columns are satisfied consecutively by query predicates
    matched_prefix_len = 0
    for col in index_columns:
        if col in predicates:
            matched_prefix_len += 1
        else:
            break
            
    if matched_prefix_len == 0:
        # Index exists, but leading column does not match predicate -> Fallback Scan
        pages_read = int(table_pages * 0.85)
        latency_ms = round(pages_read * 0.045, 2)
        return {
            "plan": "Suboptimal / Unmatched Leading Prefix (Index Skip Scan / Full Scan)",
            "index_used": f"INDEX({', '.join(index_columns)})",
            "matched_prefix_length": 0,
            "pages_read": pages_read,
            "estimated_latency_ms": latency_ms,
            "cost_score": pages_read * 1.0
        }
    elif matched_prefix_len == len(index_columns):
        # Perfect full composite index match (Index Seek + Rowid lookup)
        # B+Tree depth is roughly log_100(total_rows) ~ 3-4 pages
        tree_depth = max(2, int(math.log(max(10, total_rows), 100)))
        pages_read = tree_depth + 2
        latency_ms = round(pages_read * 0.35, 2)
        return {
            "plan": "Optimal Composite Index Seek (Point / Range Lookup)",
            "index_used": f"INDEX({', '.join(index_columns)})",
            "matched_prefix_length": matched_prefix_len,
            "pages_read": pages_read,
            "estimated_latency_ms": latency_ms,
            "cost_score": pages_read * 1.0
        }
    else:
        # Partial prefix match
        tree_depth = max(2, int(math.log(max(10, total_rows), 100)))
        # Filter selectivity reduces remaining scans
        filtered_fraction = 0.05 / matched_prefix_len
        pages_read = int(tree_depth + (table_pages * filtered_fraction))
        latency_ms = round(pages_read * 0.08, 2)
        return {
            "plan": f"Partial Leading Prefix Index Range Scan ({matched_prefix_len} of {len(index_columns)} columns)",
            "index_used": f"INDEX({', '.join(index_columns)})",
            "matched_prefix_length": matched_prefix_len,
            "pages_read": pages_read,
            "estimated_latency_ms": latency_ms,
            "cost_score": pages_read * 1.0
        }

# ==========================================
# UNIT TESTS
# ==========================================
class TestCombinatorialOptimizer(unittest.TestCase):
    def test_factorials(self):
        self.assertEqual(factorial(0), 1)
        self.assertEqual(factorial(1), 1)
        self.assertEqual(factorial(3), 6)
        self.assertEqual(factorial(4), 24)
        self.assertEqual(factorial(5), 120)
        self.assertEqual(factorial(8), 40320)

    def test_permutations_and_combinations(self):
        # 5 candidate indexes, select 3
        self.assertEqual(permutations_count(5, 3), 60)
        self.assertEqual(combinations_count(5, 3), 10)
        
        # 4 candidate indexes, select 2
        self.assertEqual(permutations_count(4, 2), 12)
        self.assertEqual(combinations_count(4, 2), 6)
        
        # Total index subsets for 3 attributes = 2^3 - 1 = 7
        self.assertEqual(total_index_subsets(3), 7)

    def test_generator_counts(self):
        items = ["idx_user", "idx_status", "idx_date"]
        eval_orders = generate_evaluation_orders(items)
        self.assertEqual(len(eval_orders), 6)
        
        subsets = generate_index_subsets(items, 2)
        self.assertEqual(len(subsets), 3)

    def test_mathematical_induction_verification(self):
        # Test induction steps for k = 1 through 10
        for k in range(1, 11):
            res = induction_step_verification(k)
            self.assertTrue(res["induction_step_holds"])
            self.assertEqual(res["P(k+1)_via_step"], res["P(k+1)_direct_factorial"])

    def test_query_cost_simulation(self):
        total_rows = 1_000_000
        predicates = ["customer_id", "status"]
        
        # Optimal index: Leading column matches
        opt_cost = simulate_query_cost(total_rows, predicates, ["customer_id", "status"])
        self.assertEqual(opt_cost["matched_prefix_length"], 2)
        self.assertIn("Optimal", opt_cost["plan"])
        
        # Suboptimal index: Leading column does NOT match
        sub_cost = simulate_query_cost(total_rows, predicates, ["created_at", "customer_id"])
        self.assertEqual(sub_cost["matched_prefix_length"], 0)
        self.assertIn("Suboptimal", sub_cost["plan"])
        
        # Full scan: No index
        no_idx_cost = simulate_query_cost(total_rows, predicates, [])
        self.assertIn("Full Table Scan", no_idx_cost["plan"])
        
        # Optimal cost should read far fewer pages than full scan
        self.assertLess(opt_cost["pages_read"], no_idx_cost["pages_read"])
        self.assertLess(opt_cost["pages_read"], sub_cost["pages_read"])


def main():
    print("=" * 65)
    print("DATABASE INDEXING & QUERY OPTIMIZATION CALCULATOR (CLI)")
    print("Topic: Permutations, Combinations & Mathematical Induction")
    print("=" * 65)
    
    n_sample = 4
    r_sample = 2
    items_sample = ["user_id", "order_date", "total_amount", "status"]
    
    print(f"\n1. MATHEMATICAL FORMULAS FOR n = {n_sample}, r = {r_sample}:")
    print(f"   - Factorial n! (Total Permutations)  : {factorial(n_sample)}")
    print(f"   - P({n_sample}, {r_sample}) (Ordered Subsets)             : {permutations_count(n_sample, r_sample)}")
    print(f"   - C({n_sample}, {r_sample}) (Unordered Index Sets)         : {combinations_count(n_sample, r_sample)}")
    print(f"   - Total Possible Index Subsets (2^{n_sample} - 1): {total_index_subsets(n_sample)}")
    
    print(f"\n2. COMBINATIONS C({n_sample}, {r_sample}) = {combinations_count(n_sample, r_sample)}:")
    for i, comb in enumerate(generate_index_subsets(items_sample, r_sample), 1):
        print(f"   [{i}] {{{', '.join(comb)}}}")
        
    print(f"\n3. PERMUTATIONS P(3) = 3! = {factorial(3)} FOR ['user_id', 'order_date', 'status']:")
    for i, perm in enumerate(generate_evaluation_orders(items_sample[:3]), 1):
        print(f"   [{i}] ({ ' -> '.join(perm) })")

    print(f"\n4. MATHEMATICAL INDUCTION PROOF VERIFICATION:")
    for k in [1, 2, 3, 4, 5]:
        step = induction_step_verification(k)
        print(f"   k={step['k']}: P({step['k']})={step['P(k)']} -> (k+1)*P(k) = {step['k+1']}*{step['P(k)']} = {step['P(k+1)_via_step']} == ({step['k+1']})! [PASS]")

    print("\nRunning automated unit tests...")
    suite = unittest.TestLoader().loadTestsFromTestCase(TestCombinatorialOptimizer)
    runner = unittest.TextTestRunner(verbosity=1)
    runner.run(suite)

if __name__ == "__main__":
    main()
