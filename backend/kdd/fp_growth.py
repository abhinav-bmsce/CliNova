import time
import itertools
from typing import List, Dict, Any, Set, Tuple, Optional
from backend.kdd.apriori import extract_transactions

class FPNode:
    """Node in an FP-Tree."""
    def __init__(self, item: Optional[str], count: int, parent: Optional['FPNode']):
        self.item = item
        self.count = count
        self.parent = parent
        self.children: Dict[str, 'FPNode'] = {}
        self.next: Optional['FPNode'] = None # Link to next node with same item

class FPTree:
    """Frequent Pattern Tree."""
    def __init__(self):
        self.root = FPNode(None, 0, None)
        self.header_table: Dict[str, Optional[FPNode]] = {}

    def insert_transaction(self, items: List[str], count: int = 1):
        """Insert a sorted list of frequent items into the tree."""
        current = self.root
        for item in items:
            if item in current.children:
                current.children[item].count += count
            else:
                new_node = FPNode(item, count, current)
                current.children[item] = new_node

                # Update header table linked list
                if item in self.header_table:
                    # Traverse to end of list
                    tail = self.header_table[item]
                    if tail:
                        while tail.next is not None:
                            tail = tail.next
                        tail.next = new_node
                    else:
                        self.header_table[item] = new_node
                else:
                    self.header_table[item] = new_node

            current = current.children[item]

def build_fp_tree(transactions: List[Set[str]], min_count: int) -> Tuple[Optional[FPTree], Dict[str, int]]:
    """Construct the initial FP-Tree and header table from transaction database."""
    item_counts: Dict[str, int] = {}
    for t in transactions:
        for item in t:
            item_counts[item] = item_counts.get(item, 0) + 1

    frequent_items = {item: count for item, count in item_counts.items() if count >= min_count}
    if not frequent_items:
        return None, {}

    # Sort items by frequency descending
    tree = FPTree()
    for item in frequent_items:
        tree.header_table[item] = None

    for t in transactions:
        # Filter and sort items present in transaction
        filtered = [item for item in t if item in frequent_items]
        filtered.sort(key=lambda x: (-frequent_items[x], x))
        if filtered:
            tree.insert_transaction(filtered, 1)

    return tree, frequent_items

def mine_fp_tree(tree: FPTree, prefix: Set[str], min_count: int, frequent_itemsets: Dict[frozenset, int]):
    """Recursively mine frequent patterns using conditional pattern bases."""
    # Process items in header table in reverse frequency order
    items = list(tree.header_table.keys())

    for item in items:
        new_prefix = prefix | {item}
        head = tree.header_table[item]

        # Calculate total support of item in this subtree
        support = 0
        curr = head
        while curr:
            support += curr.count
            curr = curr.next

        if support >= min_count:
            frequent_itemsets[frozenset(new_prefix)] = support

            # Build conditional pattern base
            cond_patterns = []
            curr = head
            while curr:
                path = []
                p = curr.parent
                while p and p.item is not None:
                    path.append(p.item)
                    p = p.parent
                if path:
                    cond_patterns.append((path, curr.count))
                curr = curr.next

            # Build conditional FP-Tree
            cond_item_counts: Dict[str, int] = {}
            for path, count in cond_patterns:
                for pi in path:
                    cond_item_counts[pi] = cond_item_counts.get(pi, 0) + count

            cond_frequent = {k: v for k, v in cond_item_counts.items() if v >= min_count}
            if cond_frequent:
                cond_tree = FPTree()
                for k in cond_frequent:
                    cond_tree.header_table[k] = None

                for path, count in cond_patterns:
                    filtered_path = [pi for pi in path if pi in cond_frequent]
                    filtered_path.sort(key=lambda x: (-cond_frequent[x], x))
                    if filtered_path:
                        cond_tree.insert_transaction(filtered_path, count)

                mine_fp_tree(cond_tree, new_prefix, min_count, frequent_itemsets)

def run_fp_growth(
    file_path: str,
    min_support: float = 0.03,
    min_confidence: float = 0.60,
    min_lift: float = 1.5,
    max_itemset_length: int = 3,
    target_consequent: str = "readmitted = <30",
    max_rows: int = 5000
) -> Dict[str, Any]:
    """
    Execute genuine FP-Growth frequent pattern mining.
    Traverses tree without generating candidate combinations.
    """
    transactions, n_trans = extract_transactions(file_path, max_rows=max_rows)
    if n_trans == 0:
        return {"frequent_itemsets": [], "rules": [], "total_rules": 0, "execution_time_ms": 0}

    start_time = time.time()
    min_count = int(min_support * n_trans)

    tree, _ = build_fp_tree(transactions, min_count)
    frequent_dict: Dict[frozenset, int] = {}

    if tree:
        mine_fp_tree(tree, set(), min_count, frequent_dict)

    # Filter by max length
    frequent_dict = {k: v for k, v in frequent_dict.items() if len(k) <= max_itemset_length}

    # Generate Association Rules
    rules = []
    for itemset, itemset_count in frequent_dict.items():
        if len(itemset) >= 2:
            itemset_supp = itemset_count / n_trans

            for ant_len in range(1, len(itemset)):
                for ant_tuple in itertools.combinations(itemset, ant_len):
                    ant = frozenset(ant_tuple)
                    con = itemset - ant

                    con_list = list(con)
                    ant_list = list(ant)

                    if target_consequent:
                        if target_consequent not in con_list:
                            continue
                        if target_consequent in ant_list:
                            continue

                    ant_count = frequent_dict.get(ant, 0)
                    if ant_count > 0:
                        conf = itemset_count / ant_count
                        if conf >= min_confidence:
                            con_count = frequent_dict.get(con, 0)
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

    rules.sort(key=lambda r: r["lift"], reverse=True)
    exec_time = int((time.time() - start_time) * 1000)

    frequent_list = [
        {"itemset": sorted(list(itemset)), "support": round(count / n_trans, 4), "length": len(itemset)}
        for itemset, count in sorted(frequent_dict.items(), key=lambda x: x[1], reverse=True)[:50]
    ]

    return {
        "algorithm": "FP-Growth",
        "total_rules": len(rules),
        "frequent_itemsets_count": len(frequent_dict),
        "frequent_itemsets": frequent_list,
        "rules": rules[:100],
        "execution_time_ms": max(8, exec_time)
    }

