import { Question } from '@/types/oa';

export function extractMethodAndParams(question: Question) {
  const entryMatch = question.entryPoint.match(/\.([a-zA-Z0-9_]+)/);
  const methodName = entryMatch ? entryMatch[1] : 'solve';

  const starter = question.starterCode || '';
  const defMatch = starter.match(/def\s+[a-zA-Z0-9_]+\s*\(([^)]*)\)/);
  let params: string[] = [];

  if (defMatch && defMatch[1]) {
    params = defMatch[1]
      .split(',')
      .map((p) => p.trim())
      .filter((p) => p && p !== 'self')
      .map((p) => p.split(':')[0].trim());
  }

  if (params.length === 0) {
    params = ['inputData'];
  }

  return { methodName, params };
}

export function getStarterTemplate(question: Question, language: string): string {
  if (question.starterCodes && question.starterCodes[language]) {
    return question.starterCodes[language];
  }

  const { methodName, params } = extractMethodAndParams(question);
  const paramList = params.join(', ');

  switch (language) {
    case 'javascript':
      return `/**
 * Problem: ${question.title}
 * Entry: Solution().${methodName}
 */
class Solution {
    ${methodName}(${paramList}) {
        // Write your solution here
    }
}
`;

    case 'typescript':
      return `/**
 * Problem: ${question.title}
 */
class Solution {
    ${methodName}(${params.map((p) => `${p}: any`).join(', ')}): any {
        // Write your solution here
    }
}
`;

    case 'cpp':
      return `#include <iostream>
#include <vector>
#include <string>
#include <unordered_map>
#include <algorithm>

using namespace std;

class Solution {
public:
    // Solve ${question.title}
};

int main() {
    // Fast I/O
    ios_base::sync_with_stdio(false);
    cin.tie(NULL);

    // Read input and output result
    return 0;
}
`;

    case 'java':
      return `import java.util.*;

public class Main {
    public static void main(String[] args) {
        Scanner scanner = new Scanner(System.in);
        // Solve ${question.title}
    }
}
`;

    case 'go':
      return `package main

import (
    "fmt"
)

func main() {
    // Solve ${question.title}
}
`;

    case 'ruby':
      return `# Problem: ${question.title}
class Solution
    def ${methodName}(${paramList})
        # Write your solution here
    end
end
`;

    case 'python':
    default:
      return question.starterCode || `class Solution:\n    def ${methodName}(self, ${paramList}):\n        pass\n`;
  }
}
