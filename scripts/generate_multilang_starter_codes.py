import json
import re
import ast
import os
import sys

def parse_py_type(type_str: str) -> dict:
    """
    Parses a python type string into structured representation:
    { "kind": "int" | "float" | "str" | "bool" | "list" | "list_list" | "list_node" | "tree_node" | "any", "inner": ... }
    """
    if not type_str or type_str == 'any':
        return {"kind": "any"}
    
    t = type_str.strip()
    if t.startswith('Optional[') and t.endswith(']'):
        t = t[9:-1].strip()

    if t == 'int':
        return {"kind": "int"}
    elif t in ['float', 'double']:
        return {"kind": "float"}
    elif t in ['str', 'string']:
        return {"kind": "str"}
    elif t in ['bool', 'boolean']:
        return {"kind": "bool"}
    elif t == 'ListNode':
        return {"kind": "list_node"}
    elif t == 'TreeNode':
        return {"kind": "tree_node"}
    elif t.startswith('List[') and t.endswith(']'):
        inner_str = t[5:-1].strip()
        inner_type = parse_py_type(inner_str)
        return {"kind": "list", "inner": inner_type}
    elif t.startswith('list[') and t.endswith(']'):
        inner_str = t[5:-1].strip()
        inner_type = parse_py_type(inner_str)
        return {"kind": "list", "inner": inner_type}
    else:
        return {"kind": "custom", "name": t}

def to_cpp_type(t: dict, is_param: bool = False) -> str:
    k = t.get("kind", "any")
    if k == "int":
        return "int"
    elif k == "float":
        return "double"
    elif k == "str":
        return "string&" if is_param else "string"
    elif k == "bool":
        return "bool"
    elif k == "list_node":
        return "ListNode*"
    elif k == "tree_node":
        return "TreeNode*"
    elif k == "list":
        inner = to_cpp_type(t.get("inner", {"kind": "int"}), False)
        base = f"vector<{inner}>"
        return f"{base}&" if is_param else base
    elif k == "custom":
        name = t.get("name", "int")
        return f"{name}&" if is_param else name
    return "auto" if not is_param else "auto&"

def to_java_type(t: dict) -> str:
    k = t.get("kind", "any")
    if k == "int":
        return "int"
    elif k == "float":
        return "double"
    elif k == "str":
        return "String"
    elif k == "bool":
        return "boolean"
    elif k == "list_node":
        return "ListNode"
    elif k == "tree_node":
        return "TreeNode"
    elif k == "list":
        inner = t.get("inner", {})
        ik = inner.get("kind")
        if ik == "int":
            return "int[]"
        elif ik == "str":
            return "String[]"
        elif ik == "float":
            return "double[]"
        elif ik == "bool":
            return "boolean[]"
        elif ik == "list":
            inner2 = inner.get("inner", {})
            if inner2.get("kind") == "int":
                return "int[][]"
            return "String[][]"
        elif ik == "list_node":
            return "ListNode[]"
        elif ik == "tree_node":
            return "TreeNode[]"
        else:
            return "List<Object>"
    elif k == "custom":
        return t.get("name", "Object")
    return "Object"

def to_ts_type(t: dict) -> str:
    k = t.get("kind", "any")
    if k == "int" or k == "float":
        return "number"
    elif k == "str":
        return "string"
    elif k == "bool":
        return "boolean"
    elif k == "list_node":
        return "ListNode | null"
    elif k == "tree_node":
        return "TreeNode | null"
    elif k == "list":
        inner = to_ts_type(t.get("inner", {"kind": "any"}))
        return f"{inner}[]"
    elif k == "custom":
        return t.get("name", "any")
    return "any"

def to_go_type(t: dict) -> str:
    k = t.get("kind", "any")
    if k == "int":
        return "int"
    elif k == "float":
        return "float64"
    elif k == "str":
        return "string"
    elif k == "bool":
        return "bool"
    elif k == "list_node":
        return "*ListNode"
    elif k == "tree_node":
        return "*TreeNode"
    elif k == "list":
        inner = to_go_type(t.get("inner", {"kind": "int"}))
        return f"[]{inner}"
    elif k == "custom":
        return t.get("name", "interface{}")
    return "interface{}"

def to_jsdoc_type(t: dict) -> str:
    k = t.get("kind", "any")
    if k == "int" or k == "float":
        return "number"
    elif k == "str":
        return "string"
    elif k == "bool":
        return "boolean"
    elif k == "list_node":
        return "ListNode"
    elif k == "tree_node":
        return "TreeNode"
    elif k == "list":
        inner = to_jsdoc_type(t.get("inner", {"kind": "any"}))
        return f"{inner}[]"
    return "*"

def camel_to_snake(name: str) -> str:
    s1 = re.sub('(.)([A-Z][a-z]+)', r'\1_\2', name)
    return re.sub('([a-z0-9])([A-Z])', r'\1_\2', s1).lower()

def extract_signature_info(starter_code: str, entry_point: str):
    method_name = "solve"
    if entry_point and '.' in entry_point:
        method_name = entry_point.split('.')[-1].strip()

    params = []
    return_type_dict = {"kind": "any"}
    has_list_node = False
    has_tree_node = False

    # Try AST parse
    parsed_ast = False
    try:
        # Append pass in case def has no body
        code_to_parse = starter_code.strip()
        if not code_to_parse.endswith('pass'):
            code_to_parse += '\n        pass'
        tree = ast.parse(code_to_parse)
        for node in ast.walk(tree):
            if isinstance(node, ast.FunctionDef):
                method_name = node.name
                for arg in node.args.args:
                    if arg.arg != 'self':
                        ann_str = ast.unparse(arg.annotation) if (hasattr(ast, 'unparse') and arg.annotation) else 'any'
                        p_type = parse_py_type(ann_str)
                        params.append({"name": arg.arg, "type": p_type, "raw": ann_str})
                if node.returns:
                    ret_str = ast.unparse(node.returns) if hasattr(ast, 'unparse') else 'any'
                    return_type_dict = parse_py_type(ret_str)
                parsed_ast = True
                break
    except Exception:
        pass

    # Regex fallback if AST parsing failed
    if not parsed_ast:
        match = re.search(r'def\s+([a-zA-Z0-9_]+)\s*\(([^)]*)\)(?:\s*->\s*([^:]+))?:', starter_code)
        if match:
            method_name = match.group(1)
            raw_args = match.group(2)
            ret_str = match.group(3) or 'any'
            return_type_dict = parse_py_type(ret_str.strip())
            for arg_part in raw_args.split(','):
                arg_part = arg_part.strip()
                if not arg_part or arg_part == 'self':
                    continue
                if ':' in arg_part:
                    aname, atype = arg_part.split(':', 1)
                    params.append({"name": aname.strip(), "type": parse_py_type(atype.strip()), "raw": atype.strip()})
                else:
                    params.append({"name": arg_part, "type": {"kind": "any"}, "raw": "any"})

    # Check for ListNode / TreeNode in types or comments
    all_raw = starter_code + " " + " ".join(p.get("raw", "") for p in params)
    if "ListNode" in all_raw:
        has_list_node = True
    if "TreeNode" in all_raw:
        has_tree_node = True

    return {
        "method_name": method_name,
        "params": params,
        "return_type": return_type_dict,
        "has_list_node": has_list_node,
        "has_tree_node": has_tree_node
    }

def generate_templates(starter_code: str, entry_point: str, title: str) -> dict:
    info = extract_signature_info(starter_code, entry_point)
    method_name = info["method_name"]
    params = info["params"]
    ret_type = info["return_type"]
    has_list_node = info["has_list_node"]
    has_tree_node = info["has_tree_node"]

    # 1. C++
    cpp_params = [f"{to_cpp_type(p['type'], True)} {p['name']}" for p in params]
    cpp_ret = to_cpp_type(ret_type, False)
    cpp_code = ""
    if has_list_node:
        cpp_code += "/**\n * Definition for singly-linked list.\n * struct ListNode {\n *     int val;\n *     ListNode *next;\n *     ListNode() : val(0), next(nullptr) {}\n *     ListNode(int x) : val(x), next(nullptr) {}\n *     ListNode(int x, ListNode *next) : val(x), next(next) {}\n * };\n */\n"
    if has_tree_node:
        cpp_code += "/**\n * Definition for a binary tree node.\n * struct TreeNode {\n *     int val;\n *     TreeNode *left;\n *     TreeNode *right;\n *     TreeNode() : val(0), left(nullptr), right(nullptr) {}\n *     TreeNode(int x) : val(x), left(nullptr), right(nullptr) {}\n *     TreeNode(int x, TreeNode *left, TreeNode *right) : val(x), left(left), right(right) {}\n * };\n */\n"
    cpp_code += f"""class Solution {{
public:
    {cpp_ret} {method_name}({', '.join(cpp_params)}) {{
        
    }}
}};"""

    # 2. Java
    java_params = [f"{to_java_type(p['type'])} {p['name']}" for p in params]
    java_ret = to_java_type(ret_type)
    java_code = ""
    if has_list_node:
        java_code += "/**\n * Definition for singly-linked list.\n * public class ListNode {\n *     int val;\n *     ListNode next;\n *     ListNode() {}\n *     ListNode(int val) { this.val = val; }\n *     ListNode(int val, ListNode next) { this.val = val; this.next = next; }\n * }\n */\n"
    if has_tree_node:
        java_code += "/**\n * Definition for a binary tree node.\n * public class TreeNode {\n *     int val;\n *     TreeNode left;\n *     TreeNode right;\n *     TreeNode() {}\n *     TreeNode(int val) { this.val = val; }\n *     TreeNode(int val, TreeNode left, TreeNode right) {\n *         this.val = val;\n *         this.left = left;\n *         this.right = right;\n *     }\n * }\n */\n"
    java_code += f"""class Solution {{
    public {java_ret} {method_name}({', '.join(java_params)}) {{
        
    }}
}}"""

    # 3. JavaScript
    js_param_names = [p['name'] for p in params]
    js_doc_params = "\n".join([f" * @param {{{to_jsdoc_type(p['type'])}}} {p['name']}" for p in params])
    js_doc_ret = f" * @return {{{to_jsdoc_type(ret_type)}}}"
    js_code = ""
    if has_list_node:
        js_code += "/**\n * Definition for singly-linked list.\n * function ListNode(val, next) {\n *     this.val = (val===undefined ? 0 : val)\n *     this.next = (next===undefined ? null : next)\n * }\n */\n"
    if has_tree_node:
        js_code += "/**\n * Definition for a binary tree node.\n * function TreeNode(val, left, right) {\n *     this.val = (val===undefined ? 0 : val)\n *     this.left = (left===undefined ? null : left)\n *     this.right = (right===undefined ? null : right)\n * }\n */\n"
    js_code += f"""/**
{js_doc_params}
{js_doc_ret}
 */
var {method_name} = function({', '.join(js_param_names)}) {{
    
}};"""

    # 4. TypeScript
    ts_params = [f"{p['name']}: {to_ts_type(p['type'])}" for p in params]
    ts_ret = to_ts_type(ret_type)
    ts_code = ""
    if has_list_node:
        ts_code += "/**\n * Definition for singly-linked list.\n * class ListNode {\n *     val: number\n *     next: ListNode | null\n *     constructor(val?: number, next?: ListNode | null) {\n *         this.val = (val===undefined ? 0 : val)\n *         this.next = (next===undefined ? null : next)\n *     }\n * }\n */\n"
    if has_tree_node:
        ts_code += "/**\n * Definition for a binary tree node.\n * class TreeNode {\n *     val: number\n *     left: TreeNode | null\n *     right: TreeNode | null\n *     constructor(val?: number, left?: TreeNode | null, right?: TreeNode | null) {\n *         this.val = (val===undefined ? 0 : val)\n *         this.left = (left===undefined ? null : left)\n *         this.right = (right===undefined ? null : right)\n *     }\n * }\n */\n"
    ts_code += f"""function {method_name}({', '.join(ts_params)}): {ts_ret} {{
    
}};"""

    # 5. Go
    go_params = [f"{p['name']} {to_go_type(p['type'])}" for p in params]
    go_ret = to_go_type(ret_type)
    go_code = ""
    if has_list_node:
        go_code += "/**\n * Definition for singly-linked list.\n * type ListNode struct {\n *     Val int\n *     Next *ListNode\n * }\n */\n"
    if has_tree_node:
        go_code += "/**\n * Definition for a binary tree node.\n * type TreeNode struct {\n *     Val int\n *     Left *TreeNode\n *     Right *TreeNode\n * }\n */\n"
    go_code += f"""func {method_name}({', '.join(go_params)}) {go_ret} {{
    
}}"""

    # 6. Ruby
    ruby_method = camel_to_snake(method_name)
    ruby_param_names = [camel_to_snake(p['name']) for p in params]
    ruby_code = f"""# @param {{{', '.join([to_jsdoc_type(p['type']) for p in params])}}}
# @return {{{to_jsdoc_type(ret_type)}}}
def {ruby_method}({', '.join(ruby_param_names)})
    
end"""

    return {
        "python": starter_code,
        "cpp": cpp_code,
        "java": java_code,
        "javascript": js_code,
        "typescript": ts_code,
        "go": go_code,
        "ruby": ruby_code
    }

def main():
    json_path = 'src/data/questions.json'
    print(f"Loading {json_path}...")
    with open(json_path, 'r', encoding='utf-8') as f:
        questions = json.load(f)

    print(f"Processing {len(questions)} questions for multi-language templates...")
    for idx, q in enumerate(questions):
        st = q.get('starterCode', '')
        ep = q.get('entryPoint', '')
        title = q.get('title', '')
        templates = generate_templates(st, ep, title)
        q['starterCodes'] = templates
        if (idx + 1) % 500 == 0:
            print(f"Processed {idx + 1} / {len(questions)} questions...")

    print("Saving updated dataset with multi-language starter codes...")
    with open('src/data/questions.json', 'w', encoding='utf-8') as f:
        json.dump(questions, f, ensure_ascii=False)
    
    with open('public/data/questions.json', 'w', encoding='utf-8') as f:
        json.dump(questions, f, ensure_ascii=False)

    print("Successfully generated LeetCode-standard multi-language starter codes for all 2,869 questions!")

if __name__ == '__main__':
    main()
