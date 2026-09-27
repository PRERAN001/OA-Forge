export function parseInputString(inputStr: string): Record<string, any> {
  const argsObj: Record<string, any> = {};
  if (!inputStr || !inputStr.trim()) return argsObj;

  const tokens = inputStr.split(/,\s*(?=[a-zA-Z0-9_]+\s*=)/);
  for (const tok of tokens) {
    const eqIdx = tok.indexOf('=');
    if (eqIdx !== -1) {
      const key = tok.slice(0, eqIdx).trim();
      const valStr = tok.slice(eqIdx + 1).trim();
      try {
        const sanitized = valStr
          .replace(/'/g, '"')
          .replace(/\bTrue\b/g, 'true')
          .replace(/\bFalse\b/g, 'false')
          .replace(/\bNone\b/g, 'null');
        argsObj[key] = JSON.parse(sanitized);
      } catch {
        argsObj[key] = valStr;
      }
    }
  }
  return argsObj;
}

export function toJavaLiteral(val: any): string {
  if (val === null || val === undefined) return 'null';
  if (typeof val === 'boolean') return val ? 'true' : 'false';
  if (typeof val === 'number') return String(val);
  if (typeof val === 'string') return JSON.stringify(val);
  if (Array.isArray(val)) {
    if (val.length === 0) return 'new int[]{}';
    if (Array.isArray(val[0])) {
      if (val[0].length === 0 || typeof val[0][0] === 'number') {
        const rows = val.map((r: any[]) => '{' + r.map(toJavaLiteral).join(',') + '}');
        return 'new int[][]{' + rows.join(',') + '}';
      } else if (typeof val[0][0] === 'string') {
        const rows = val.map((r: any[]) => '{' + r.map(toJavaLiteral).join(',') + '}');
        return 'new String[][]{' + rows.join(',') + '}';
      }
    } else {
      if (typeof val[0] === 'number') {
        return 'new int[]{' + val.map(toJavaLiteral).join(',') + '}';
      } else if (typeof val[0] === 'string') {
        return 'new String[]{' + val.map(toJavaLiteral).join(',') + '}';
      } else if (typeof val[0] === 'boolean') {
        return 'new boolean[]{' + val.map(toJavaLiteral).join(',') + '}';
      }
    }
  }
  return 'null';
}

export function toJavaDeclaration(varName: string, val: any, paramName = ''): string {
  const pLow = paramName.toLowerCase();
  if (val === null || val === undefined) {
    if (['head', 'l1', 'l2', 'list1', 'list2', 'node', 'cur', 'first', 'second', 'heada', 'headb'].some((k) => pLow.includes(k))) {
      return `ListNode ${varName} = null;`;
    }
    if (['root', 'subroot', 'tree', 'p', 'q', 't1', 't2', 'node'].some((k) => pLow.includes(k))) {
      return `TreeNode ${varName} = null;`;
    }
    return `Object ${varName} = null;`;
  }
  if (typeof val === 'boolean') {
    return `boolean ${varName} = ${val ? 'true' : 'false'};`;
  }
  if (typeof val === 'number') {
    return Number.isInteger(val) ? `int ${varName} = ${val};` : `double ${varName} = ${val};`;
  }
  if (typeof val === 'string') {
    return `String ${varName} = ${JSON.stringify(val)};`;
  }
  if (Array.isArray(val)) {
    if (['head', 'l1', 'l2', 'list1', 'list2', 'node', 'cur', 'first', 'second', 'heada', 'headb'].some((k) => pLow.includes(k))) {
      return `ListNode ${varName} = toListNode(new int[]{${val.join(', ')}});`;
    }
    if (['root', 'subroot', 'tree', 'p', 'q', 't1', 't2', 'node'].some((k) => pLow.includes(k))) {
      const elements = val.map((x) => (x === null ? 'null' : x)).join(', ');
      return `TreeNode ${varName} = toTreeNode(new Integer[]{${elements}});`;
    }
    if (val.length === 0) {
      if (['strs', 'words', 'names'].some((k) => pLow.includes(k))) {
        return `String[] ${varName} = new String[]{};`;
      }
      return `int[] ${varName} = new int[]{};`;
    }
    if (Array.isArray(val[0])) {
      if (val[0].length === 0 || typeof val[0][0] === 'number') {
        const rows = val.map((r: any[]) => '{' + r.map(toJavaLiteral).join(',') + '}');
        return `int[][] ${varName} = new int[][]{${rows.join(', ')}};`;
      } else if (typeof val[0][0] === 'string') {
        const rows = val.map((r: any[]) => '{' + r.map(toJavaLiteral).join(',') + '}');
        return `String[][] ${varName} = new String[][]{${rows.join(', ')}};`;
      }
    } else {
      if (typeof val[0] === 'number') {
        return `int[] ${varName} = new int[]{${val.map(toJavaLiteral).join(', ')}};`;
      } else if (typeof val[0] === 'string') {
        return `String[] ${varName} = new String[]{${val.map(toJavaLiteral).join(', ')}};`;
      } else if (typeof val[0] === 'boolean') {
        return `boolean[] ${varName} = new boolean[]{${val.map(toJavaLiteral).join(', ')}};`;
      }
    }
  }
  return `Object ${varName} = null;`;
}

export function toCppLiteral(val: any): string {
  if (val === null || val === undefined) return 'nullptr';
  if (typeof val === 'boolean') return val ? 'true' : 'false';
  if (typeof val === 'number') return String(val);
  if (typeof val === 'string') return JSON.stringify(val);
  if (Array.isArray(val)) {
    return '{' + val.map(toCppLiteral).join(', ') + '}';
  }
  return '0';
}

export function toCppDeclaration(varName: string, val: any, paramName = ''): string {
  const pLow = paramName.toLowerCase();
  if (val === null || val === undefined) {
    if (['head', 'l1', 'l2', 'list1', 'list2', 'node', 'cur', 'first', 'second', 'heada', 'headb'].some((k) => pLow.includes(k))) {
      return `ListNode* ${varName} = nullptr;`;
    }
    if (['root', 'subroot', 'tree', 'p', 'q', 't1', 't2', 'node'].some((k) => pLow.includes(k))) {
      return `TreeNode* ${varName} = nullptr;`;
    }
    return `auto* ${varName} = nullptr;`;
  }
  if (typeof val === 'boolean') {
    return `bool ${varName} = ${val ? 'true' : 'false'};`;
  }
  if (typeof val === 'number') {
    return Number.isInteger(val) ? `int ${varName} = ${val};` : `double ${varName} = ${val};`;
  }
  if (typeof val === 'string') {
    return `string ${varName} = ${JSON.stringify(val)};`;
  }
  if (Array.isArray(val)) {
    if (['head', 'l1', 'l2', 'list1', 'list2', 'node', 'cur', 'first', 'second', 'heada', 'headb'].some((k) => pLow.includes(k))) {
      return `ListNode* ${varName} = toListNode({${val.join(', ')}});`;
    }
    if (['root', 'subroot', 'tree', 'p', 'q', 't1', 't2', 'node'].some((k) => pLow.includes(k))) {
      return `TreeNode* ${varName} = toTreeNode({${val.map((x) => (x === null ? 'INT_MIN' : x)).join(', ')}});`;
    }
    if (val.length === 0) {
      if (['strs', 'words', 'names'].some((k) => pLow.includes(k))) {
        return `vector<string> ${varName} = {};`;
      }
      return `vector<int> ${varName} = {};`;
    }
    if (Array.isArray(val[0])) {
      if (val[0].length === 0 || typeof val[0][0] === 'number') {
        const rows = val.map((r: any[]) => '{' + r.join(', ') + '}').join(', ');
        return `vector<vector<int>> ${varName} = {${rows}};`;
      } else if (typeof val[0][0] === 'string') {
        const rows = val
          .map((r: any[]) => '{' + r.map((s: string) => JSON.stringify(s)).join(', ') + '}')
          .join(', ');
        return `vector<vector<string>> ${varName} = {${rows}};`;
      }
    } else {
      if (typeof val[0] === 'number') {
        return `vector<int> ${varName} = {${val.join(', ')}};`;
      } else if (typeof val[0] === 'string') {
        return `vector<string> ${varName} = {${val.map((s: string) => JSON.stringify(s)).join(', ')}};`;
      } else if (typeof val[0] === 'boolean') {
        return `vector<bool> ${varName} = {${val.map((b: boolean) => (b ? 'true' : 'false')).join(', ')}};`;
      }
    }
  }
  return `auto ${varName} = 0;`;
}

export function toGoDeclaration(varName: string, val: any, paramName = ''): string {
  const pLow = paramName.toLowerCase();
  if (val === null || val === undefined) {
    if (['head', 'l1', 'l2', 'list1', 'list2', 'node', 'cur', 'first', 'second', 'heada', 'headb'].some((k) => pLow.includes(k))) {
      return `var ${varName} *ListNode = nil`;
    }
    if (['root', 'subroot', 'tree', 'p', 'q', 't1', 't2', 'node'].some((k) => pLow.includes(k))) {
      return `var ${varName} *TreeNode = nil`;
    }
    return `var ${varName} interface{} = nil`;
  }
  if (typeof val === 'boolean') {
    return `${varName} := ${val ? 'true' : 'false'}`;
  }
  if (typeof val === 'number') {
    return `${varName} := ${val}`;
  }
  if (typeof val === 'string') {
    return `${varName} := ${JSON.stringify(val)}`;
  }
  if (Array.isArray(val)) {
    if (['head', 'l1', 'l2', 'list1', 'list2', 'node', 'cur', 'first', 'second', 'heada', 'headb'].some((k) => pLow.includes(k))) {
      return `${varName} := toListNode([]int{${val.join(', ')}})`;
    }
    if (['root', 'subroot', 'tree', 'p', 'q', 't1', 't2', 'node'].some((k) => pLow.includes(k))) {
      return `${varName} := toTreeNode([]int{${val.map((x) => (x === null ? '-1000000000' : x)).join(', ')}})`;
    }
    if (val.length === 0) {
      if (['strs', 'words', 'names'].some((k) => pLow.includes(k))) {
        return `${varName} := []string{}`;
      }
      return `${varName} := []int{}`;
    }
    if (Array.isArray(val[0])) {
      if (val[0].length === 0 || typeof val[0][0] === 'number') {
        const rows = val.map((r: any[]) => '{' + r.join(', ') + '}').join(', ');
        return `${varName} := [][]int{${rows}}`;
      } else if (typeof val[0][0] === 'string') {
        const isByte = val.every((r: any[]) => r.every((c: any) => typeof c === 'string' && c.length === 1));
        if (isByte && ['board', 'grid', 'matrix'].some((k) => pLow.includes(k))) {
          const rows = val
            .map((r: any[]) => '{' + r.map((s: string) => `'${s.replace(/'/g, "\\'")}'`).join(', ') + '}')
            .join(', ');
          return `${varName} := [][]byte{${rows}}`;
        }
        const rows = val
          .map((r: any[]) => '{' + r.map((s: string) => JSON.stringify(s)).join(', ') + '}')
          .join(', ');
        return `${varName} := [][]string{${rows}}`;
      }
    } else {
      if (typeof val[0] === 'number') {
        return `${varName} := []int{${val.join(', ')}}`;
      } else if (typeof val[0] === 'string') {
        return `${varName} := []string{${val.map((s: string) => JSON.stringify(s)).join(', ')}}`;
      } else if (typeof val[0] === 'boolean') {
        return `${varName} := []bool{${val.map((b: boolean) => (b ? 'true' : 'false')).join(', ')}}`;
      }
    }
  }
  return `var ${varName} interface{} = nil`;
}

export function toGoLiteral(val: any): string {
  if (val === null || val === undefined) return 'nil';
  if (typeof val === 'boolean') return val ? 'true' : 'false';
  if (typeof val === 'number') return String(val);
  if (typeof val === 'string') return JSON.stringify(val);
  if (Array.isArray(val)) {
    if (val.length === 0) return '[]int{}';
    if (Array.isArray(val[0])) {
      return (
        '[][]int{' +
        val.map((r: any[]) => '[]int{' + r.map(toGoLiteral).join(',') + '}').join(',') +
        '}'
      );
    }
    return '[]int{' + val.map(toGoLiteral).join(',') + '}';
  }
  return 'nil';
}
