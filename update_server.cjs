const fs = require('fs');

let content = fs.readFileSync('server.js', 'utf8');

if (!content.includes("const { verifyToken } = require('./middleware/auth');")) {
  content = content.replace("const cors = require('cors');", "const cors = require('cors');\nconst { verifyToken } = require('./middleware/auth');");
}

const protectedRoutes = [
  'customers', 'appointments', 'followups', 'orders', 'quotations',
  'production', 'trials', 'deliveries', 'measurement-templates', 'measurement-history',
  'inventory', 'billing', 'reports', 'employees', 'attendance', 'email', 'leads', 'settings'
];

protectedRoutes.forEach(route => {
  const find = `app.use('/api/${route}', `;
  if (content.includes(find) && !content.includes(`${find}verifyToken, `)) {
    content = content.replace(new RegExp(`app\\.use\\('/api/${route}',\\s*`), `app.use('/api/${route}', verifyToken, `);
  }
});

fs.writeFileSync('server.js', content);
console.log('server.js updated');
