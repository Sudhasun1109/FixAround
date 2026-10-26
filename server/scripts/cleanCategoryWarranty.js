const fs = require('fs');
const path = require('path');

const files = [
  {
    path: path.resolve(__dirname, '../../client/src/pages/customer/CreateBooking.jsx'),
    pattern: /label:\s*`\$\{c\.name\}\s*\(Warranty:\s*\$\{c\.warranty_period_days\}\s*days\)`/,
    replacement: 'label: c.name'
  },
  {
    path: path.resolve(__dirname, '../../client/src/pages/customer/EmergencyRequest.jsx'),
    pattern: /label:\s*`\$\{c\.name\}\s*\(\$\{c\.warranty_period_days\}d\s*Warranty\)`/i,
    replacement: 'label: c.name'
  },
  {
    path: path.resolve(__dirname, '../../client/src/pages/public/Emergency.jsx'),
    pattern: /label:\s*`\$\{c\.name\}\s*\(\$\{c\.warranty_period_days\}d\s*warranty\)`/i,
    replacement: 'label: c.name'
  },
  {
    path: path.resolve(__dirname, '../../client/src/pages/public/HowItWorks.jsx'),
    pattern: /Each service category carries a defined warranty period \(ranging from 3 to 30 days\)\./,
    replacement: 'Every completed repair is covered by the FixAround Service Quality Guarantee.'
  },
  {
    path: path.resolve(__dirname, '../../client/src/pages/public/Terms.jsx'),
    pattern: /Every completed job carries a platform warranty according to the specific service category \(typically 3 to 30 days\)\./,
    replacement: 'Every completed repair is backed by the standard FixAround Service Warranty.'
  }
];

for (const item of files) {
  let content = fs.readFileSync(item.path, 'utf8');
  if (item.pattern.test(content)) {
    content = content.replace(item.pattern, item.replacement);
    fs.writeFileSync(item.path, content, 'utf8');
    console.log(`Updated: ${path.basename(item.path)}`);
  } else {
    console.log(`Pattern not found in: ${path.basename(item.path)}`);
  }
}
