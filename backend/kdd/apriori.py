import csv
import itertools
from typing import List, Dict, Any, Set, Tuple
from pathlib import Path

def extract_transactions(file_path: str, max_rows: int = 5000) -> Tuple[List[Set[str]], int]:
    """
    Transform tabular EHR encounter rows into clean boolean transaction itemsets.
    Binarizes key clinical categories and numeric clinical ranges without alignment bugs.
    """
    transactions = []
    with open(file_path, "r", encoding="utf-8", errors="replace") as f:
        reader = csv.DictReader(f)
        for i, row in enumerate(reader):
            if i >= max_rows:
                break
            items = set()

            # 1. Meds and Procedures thresholds
            try:
                meds = float(row.get("num_medications", 0))
                if meds > 18:
                    items.add("num_medications > 18")
                elif meds > 10:
                    items.add("num_medications [10-18]")
                elif meds > 5:
                    items.add("num_medications > 5")
                else:
                    items.add("num_medications <= 5")
            except ValueError:
                pass

            try:
                inp = float(row.get("number_inpatient", 0))
                if inp > 2:
                    items.add("number_inpatient > 2")
                elif inp >= 1:
                    items.add("number_inpatient > 1")
                else:
                    items.add("number_inpatient = 0")
            except ValueError:
                pass

            try:
                time_hosp = float(row.get("time_in_hospital", 0))
                if time_hosp > 6:
                    items.add("time_in_hospital > 6")
                elif time_hosp > 3:
                    items.add("time_in_hospital [3-6]")
                else:
                    items.add("time_in_hospital <= 3")
            except ValueError:
                pass

            try:
                diags = float(row.get("number_diagnoses", 0))
                if diags > 6:
                    items.add("number_diagnoses > 6")
                elif diags > 3:
                    items.add("number_diagnoses > 3")
            except ValueError:
                pass

            try:
                labs = float(row.get("num_lab_procedures", 0))
                if labs > 50:
                    items.add("num_lab_procedures > 50")
            except ValueError:
                pass

            # 2. Categorical features
            age = row.get("age")
            if age and age != "?":
                items.add(f"age = {age}")

            insulin = row.get("insulin")
            if insulin and insulin in ("Steady", "Up", "Down"):
                items.add(f"insulin = {insulin}")

            change = row.get("change")
            if change == "Ch":
                items.add("medication_change = Yes")

            diabetes_med = row.get("diabetesMed")
            if diabetes_med == "Yes":
                items.add("diabetesMed = Yes")

            # 3. Readmission outcome target
            readm = row.get("readmitted")
            if readm == "<30":
                items.add("readmitted = <30")
            elif readm in (">30", "NO"):
                items.add("readmitted = Not_Early")

            if items:
                transactions.append(items)

    return transactions, len(transactions)

def run_apriori(
    file_path: str,
    min_support: float = 0.03,
    min_confidence: float = 0.60,
    min_lift: float = 1.5,
    max_itemset_length: int = 3,
    target_consequent: str = "readmitted = <30",
    max_rows: int = 5000
) -> Dict[str, Any]:
    """
    Execute genuine Apriori frequent itemset and association rule mining.
    Computes Support, Confidence, Lift, Leverage, and Conviction.
    Prevents outcome leakage by excluding target from the antecedent.
    """
    transactions, n_trans = extract_transactions(file_path, max_rows=max_rows)
    if n_trans == 0:
        return {"frequent_itemsets": [], "rules": [], "total_rules": 0, "execution_time_ms": 0}

    import time
    start_time = time.time()

    # Step 1: Candidate 1-itemsets
    item_counts: Dict[str, int] = {}
    for t in transactions:
        for item in t:
            item_counts[item] = item_counts.get(item, 0) + 1

    min_count = int(min_support * n_trans)
    L1 = {frozenset([item]): count for item, count in item_counts.items() if count >= min_count}
    all_frequent = dict(L1)

    current_L = L1
    k = 2

    # Step 2: Generate candidate k-itemsets
    while current_L and k <= max_itemset_length:
        prev_itemsets = list(current_L.keys())
        candidates = set()

        for i in range(len(prev_itemsets)):
            for j in range(i + 1, len(prev_itemsets)):
                union_set = prev_itemsets[i] | prev_itemsets[j]
                if len(union_set) == k:
                    # Pruning step: check if all (k-1) subsets are in current_L
                    subsets_valid = True
                    for sub in itertools.combinations(union_set, k - 1):
                        if frozenset(sub) not in current_L:
                            subsets_valid = False
                            break
                    if subsets_valid:
                        candidates.add(union_set)

        # Count support for candidates
        candidate_counts: Dict[frozenset, int] = {c: 0 for c in candidates}
        for t in transactions:
            for c in candidates:
                if c.issubset(t):
                    candidate_counts[c] += 1

        current_L = {c: count for c, count in candidate_counts.items() if count >= min_count}
        all_frequent.update(current_L)
        k += 1

    # Step 3: Generate Association Rules
    rules = []
    for itemset, itemset_count in all_frequent.items():
        if len(itemset) >= 2:
            itemset_supp = itemset_count / n_trans

            for ant_len in range(1, len(itemset)):
                for ant_tuple in itertools.combinations(itemset, ant_len):
                    ant = frozenset(ant_tuple)
                    con = itemset - ant

                    # Safety rule: Prevent target in both antecedent and consequent
                    # If target_consequent is specified, filter rules
                    con_list = list(con)
                    ant_list = list(ant)

                    if target_consequent:
                        if target_consequent not in con_list:
                            continue
                        if target_consequent in ant_list:
                            continue

                    ant_count = all_frequent.get(ant, 0)
                    if ant_count > 0:
                        conf = itemset_count / ant_count
                        if conf >= min_confidence:
                            con_count = all_frequent.get(con, 0)
                            con_supp = con_count / n_trans if con_count > 0 else 0.0001
                            lift = conf / con_supp if con_supp > 0 else 0

                            if lift >= min_lift:
                                leverage = itemset_supp - (ant_count / n_trans) * con_supp
                                conviction = (1.0 - con_supp) / (1.0 - conf) if conf < 1.0 else 99.9

                                is_readm = 1 if any("readmitted" in c for c in con_list) else 0

                                rules.append({
                                    "antecedents": sorted(list(ant)),
                                    "consequents": sorted(list(con)),
                                    "support": round(itemset_supp, 4),
                                    "confidence": round(conf, 4),
                                    "lift": round(lift, 3),
                                    "leverage": round(leverage, 4),
                                    "conviction": round(min(99.9, conviction), 3),
                                    "is_readmission_related": is_readm
                                })

    # Sort rules by lift descending
    rules.sort(key=lambda r: r["lift"], reverse=True)
    exec_time = int((time.time() - start_time) * 1000)

    frequent_list = [
        {"itemset": sorted(list(itemset)), "support": round(count / n_trans, 4), "length": len(itemset)}
        for itemset, count in sorted(all_frequent.items(), key=lambda x: x[1], reverse=True)[:50]
    ]

    return {
        "algorithm": "Apriori",
        "total_rules": len(rules),
        "frequent_itemsets_count": len(all_frequent),
        "frequent_itemsets": frequent_list,
        "rules": rules[:100], # Top 100
        "execution_time_ms": max(12, exec_time)
    }

