import { Question } from '@/types/oa';

export interface ParsedParam {
  name: string;
  pyType: string;
}

export interface ParsedSignature {
  methodName: string;
  params: ParsedParam[];
  returnTypePy: string;
}

export function parsePythonSignature(question: Question): ParsedSignature {
  const entryMatch = question.entryPoint.match(/\.([a-zA-Z0-9_]+)/);
  const methodName = entryMatch ? entryMatch[1] : 'solve';

  const starter = question.starterCode || '';

  // Find def methodName(self, ...) -> ReturnType:
  const defRegex = new RegExp(`def\\s+${methodName}\\s*\\(([^)]*)\\)(?:\\s*->\\s*([^:]+))?`);
  const match = starter.match(defRegex) || starter.match(/def\s+[a-zA-Z0-9_]+\s*\(([^)]*)\)(?:\s*->\s*([^:]+))?/);

  const params: ParsedParam[] = [];
  let returnTypePy = 'int';

  if (match) {
    const paramsStr = match[1] || '';
    if (match[2]) {
      returnTypePy = match[2].trim();
    }

    const rawParams = paramsStr
      .split(',')
      .map((p) => p.trim())
      .filter((p) => p && p !== 'self');

    for (const raw of rawParams) {
      if (raw.includes(':')) {
        const [name, typeStr] = raw.split(':').map((s) => s.trim());
        params.push({ name, pyType: typeStr });
      } else {
        params.push({ name: raw, pyType: '' });
      }
    }
  }

  if (params.length === 0) {
    params.push({ name: 'nums', pyType: 'List[int]' });
  }

  return { methodName, params, returnTypePy };
}

export function mapPyTypeToCpp(pyType: string): { type: string; isRef: boolean } {
  const t = pyType.trim();
  if (!t) return { type: 'int', isRef: false };
  if (t === 'int') return { type: 'int', isRef: false };
  if (t === 'str' || t === 'string') return { type: 'string', isRef: false };
  if (t === 'bool') return { type: 'bool', isRef: false };
  if (t === 'float') return { type: 'double', isRef: false };
  if (t === 'None' || t === 'void') return { type: 'void', isRef: false };
  if (t.includes('ListNode')) return { type: 'ListNode*', isRef: false };
  if (t.includes('TreeNode')) return { type: 'TreeNode*', isRef: false };

  // Handle List[T]
  const listMatch = t.match(/List\[(.*)\]/);
  if (listMatch) {
    const inner = mapPyTypeToCpp(listMatch[1]).type;
    return { type: `vector<${inner}>`, isRef: true };
  }

  return { type: 'int', isRef: false };
}

export function mapPyTypeToJava(pyType: string): string {
  const t = pyType.trim();
  if (!t) return 'int';
  if (t === 'int') return 'int';
  if (t === 'str' || t === 'string') return 'String';
  if (t === 'bool') return 'boolean';
  if (t === 'float') return 'double';
  if (t === 'None' || t === 'void') return 'void';
  if (t.includes('ListNode')) return 'ListNode';
  if (t.includes('TreeNode')) return 'TreeNode';

  const listMatch = t.match(/List\[(.*)\]/);
  if (listMatch) {
    const inner = mapPyTypeToJava(listMatch[1]);
    if (inner === 'int') return 'int[]';
    if (inner === 'String') return 'String[]';
    if (inner === 'boolean') return 'boolean[]';
    if (inner === 'double') return 'double[]';
    return `${inner}[]`;
  }

  return 'int';
}

export function mapPyTypeToTs(pyType: string): string {
  const t = pyType.trim();
  if (!t) return 'number';
  if (t === 'int' || t === 'float') return 'number';
  if (t === 'str' || t === 'string') return 'string';
  if (t === 'bool') return 'boolean';
  if (t === 'None' || t === 'void') return 'void';
  if (t.includes('ListNode')) return 'ListNode | null';
  if (t.includes('TreeNode')) return 'TreeNode | null';

  const listMatch = t.match(/List\[(.*)\]/);
  if (listMatch) {
    const inner = mapPyTypeToTs(listMatch[1]);
    return `${inner}[]`;
  }

  return 'any';
}

export function mapPyTypeToJsDoc(pyType: string): string {
  const t = pyType.trim();
  if (!t) return 'number';
  if (t === 'int' || t === 'float') return 'number';
  if (t === 'str' || t === 'string') return 'string';
  if (t === 'bool') return 'boolean';
  if (t === 'None' || t === 'void') return 'void';
  if (t.includes('ListNode')) return 'ListNode';
  if (t.includes('TreeNode')) return 'TreeNode';

  const listMatch = t.match(/List\[(.*)\]/);
  if (listMatch) {
    const inner = mapPyTypeToJsDoc(listMatch[1]);
    return `${inner}[]`;
  }

  return 'any';
}

export function mapPyTypeToGo(pyType: string): string {
  const t = pyType.trim();
  if (!t) return 'int';
  if (t === 'int') return 'int';
  if (t === 'str' || t === 'string') return 'string';
  if (t === 'bool') return 'bool';
  if (t === 'float') return 'float64';
  if (t === 'None' || t === 'void') return '';
  if (t.includes('ListNode')) return '*ListNode';
  if (t.includes('TreeNode')) return '*TreeNode';

  const listMatch = t.match(/List\[(.*)\]/);
  if (listMatch) {
    const inner = mapPyTypeToGo(listMatch[1]);
    return `[]${inner}`;
  }

  return 'int';
}

export function getStarterTemplate(question: Question, language: string): string {
  if (question.starterCodes && question.starterCodes[language]) {
    return question.starterCodes[language];
  }

  const { methodName, params, returnTypePy } = parsePythonSignature(question);

  switch (language) {
    // Pure LeetCode C++ Starter Template
    case 'cpp': {
      const cppReturn = mapPyTypeToCpp(returnTypePy).type;
      const cppParams = params
        .map((p) => {
          const mapped = mapPyTypeToCpp(p.pyType);
          const refStr = mapped.isRef ? '&' : '';
          return `${mapped.type}${refStr} ${p.name}`;
        })
        .join(', ');

      return `class Solution {
public:
    ${cppReturn} ${methodName}(${cppParams}) {
        
    }
};
`;
    }

    // Pure LeetCode Java Starter Template
    case 'java': {
      const javaReturn = mapPyTypeToJava(returnTypePy);
      const javaParams = params
        .map((p) => `${mapPyTypeToJava(p.pyType)} ${p.name}`)
        .join(', ');

      return `class Solution {
    public ${javaReturn} ${methodName}(${javaParams}) {
        
    }
}
`;
    }

    // Pure LeetCode JavaScript (JSDoc + Function Expression)
    case 'javascript': {
      const paramDocs = params
        .map((p) => ` * @param {${mapPyTypeToJsDoc(p.pyType)}} ${p.name}`)
        .join('\n');
      const returnDoc = ` * @return {${mapPyTypeToJsDoc(returnTypePy)}}`;
      const jsParams = params.map((p) => p.name).join(', ');

      return `/**
${paramDocs}
${returnDoc}
 */
var ${methodName} = function(${jsParams}) {
    
};
`;
    }

    // Pure LeetCode TypeScript Starter Template
    case 'typescript': {
      const tsReturn = mapPyTypeToTs(returnTypePy);
      const tsParams = params
        .map((p) => `${p.name}: ${mapPyTypeToTs(p.pyType)}`)
        .join(', ');

      return `function ${methodName}(${tsParams}): ${tsReturn} {
    
};
`;
    }

    // Pure LeetCode Go Starter Template
    case 'go': {
      const goReturn = mapPyTypeToGo(returnTypePy);
      const goParams = params
        .map((p) => `${p.name} ${mapPyTypeToGo(p.pyType)}`)
        .join(', ');

      return `func ${methodName}(${goParams}) ${goReturn} {
    
}
`;
    }

    // Pure LeetCode Python 3 Starter Template
    case 'python':
    default:
      if (question.starterCode && question.starterCode.trim()) {
        return question.starterCode;
      }
      return `class Solution:\n    def ${methodName}(self, ${params.map((p) => (p.pyType ? `${p.name}: ${p.pyType}` : p.name)).join(', ')}) -> ${returnTypePy}:\n        `;
  }
}
