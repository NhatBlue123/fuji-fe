const cp = require('child_process');
const fs = require('fs');
try {
  const content = cp.execSync('git show e3671f6:"src/app/Exam/JLPTtest/ExamHeader.tsx"');
  fs.writeFileSync('src/app/Exam/JLPTtest/ExamHeader.tsx', content);
  console.log('Restored successfully');
} catch (e) {
  console.error(e.message);
}
