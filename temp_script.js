const cp = require('child_process');
const fs = require('fs');
const log = cp.execSync('git log --oneline -- "src/app/Exam/JLPTtest/ExamHeader.tsx"', {encoding: 'utf8'});
fs.writeFileSync('git_logs.txt', log, 'utf8');
