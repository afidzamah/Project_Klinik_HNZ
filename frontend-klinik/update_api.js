const fs = require('fs');
const path = require('path');

const filesToUpdate = [
  'src/app/page.tsx',
  'src/app/login/page.tsx',
  'src/app/superadmin/page.tsx',
  'src/components/MasterLayout.tsx',
  'src/app/kiosk/page.tsx',
  'src/app/monitoring/page.tsx',
  'src/app/farmasi/page.tsx',
  'src/app/dokter/page.tsx',
  'src/app/nurse-station/page.tsx',
  'src/app/pendaftaran/page.tsx',
  'src/app/pendaftaran/laporan/page.tsx'
];

filesToUpdate.forEach(fileRelPath => {
  const filePath = path.join(__dirname, fileRelPath);
  if (!fs.existsSync(filePath)) {
    console.log(`File not found: ${filePath}`);
    return;
  }

  let content = fs.readFileSync(filePath, 'utf8');

  // Check if API_URL is already imported
  if (!content.includes("import { API_URL }")) {
    // Insert import at the top after 'use client' if present, otherwise at absolute top
    const useClientIndex = content.indexOf("'use client';");
    const useClientDoubleIndex = content.indexOf('"use client";');
    
    let importStatement = "\nimport { API_URL } from '@/lib/api';";
    
    if (useClientIndex !== -1) {
      const insertPos = useClientIndex + "'use client';".length;
      content = content.slice(0, insertPos) + importStatement + content.slice(insertPos);
    } else if (useClientDoubleIndex !== -1) {
      const insertPos = useClientDoubleIndex + '"use client";'.length;
      content = content.slice(0, insertPos) + importStatement + content.slice(insertPos);
    } else {
      content = "import { API_URL } from '@/lib/api';" + importStatement + content;
    }
  }

  // Replace single quote localhost:3000 calls
  content = content.replace(/'http:\/\/localhost:3000([^']*)'/g, '`\${API_URL}\$1`');
  
  // Replace double quote localhost:3000 calls
  content = content.replace(/"http:\/\/localhost:3000([^"]*)"/g, '`\${API_URL}\$1`');

  // Replace backtick localhost:3000 calls (be careful to match correctly)
  content = content.replace(/`http:\/\/localhost:3000([^`]*)`/g, '`\${API_URL}\$1`');

  fs.writeFileSync(filePath, content, 'utf8');
  console.log(`Successfully updated endpoints in: ${fileRelPath}`);
});

console.log('All API endpoints updated successfully!');
