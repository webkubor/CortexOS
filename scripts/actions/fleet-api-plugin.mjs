import fs from "fs";
import path from "path";
import { exec } from "child_process";

const projectRoot = path.resolve(process.cwd());
const fleetFile = path.join(projectRoot, ".memory/fleet/fleet_status.md");

export function fleetApiPlugin() {
  return {
    name: "fleet-api-plugin",
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        if (req.method !== "POST" || !req.url.startsWith("/api/fleet/action")) {
          return next();
        }

        let body = "";
        req.on("data", chunk => (body += chunk));
        req.on("end", () => {
          try {
            const data = JSON.parse(body);
            const { action, memberId } = data; // e.g. action: 'make-captain' | 'kick-out'
            
            if (!fs.existsSync(fleetFile)) {
              res.statusCode = 404;
              res.end(JSON.stringify({ error: "fleet_status.md not found" }));
              return;
            }

            let content = fs.readFileSync(fleetFile, "utf8");
            let lines = content.split('\n');
            let tableStartIndex = lines.findIndex(l => l.includes("| 节点 ID"));
            
            if (tableStartIndex !== -1) {
              for (let i = tableStartIndex + 2; i < lines.length; i++) {
                if (!lines[i].trim().startsWith("|")) break;
                
                // Identify the member
                if (lines[i].includes(memberId)) {
                  let cols = lines[i].split('|');
                  if (cols.length < 8) continue;
                  
                  if (action === 'kick-out') {
                    // Change status column (index 7 typically) to include [ 已离线 ]
                    cols[7] = " [ 已离线 ] ";
                  } 
                  else if (action === 'make-captain') {
                    // Give captain lock
                    if (!cols[7].includes("队长锁")) {
                       cols[7] = " 👑 [ 队长锁 ] 活跃 ";
                    }
                  }
                  
                  lines[i] = cols.join('|');
                } else if (action === 'make-captain') {
                  // Remove captain lock from others
                  let cols = lines[i].split('|');
                  if (cols.length >= 8 && cols[7].includes("队长锁")) {
                    cols[7] = cols[7].replace("👑 [ 队长锁 ]", "[ 执行中 ]");
                    lines[i] = cols.join('|');
                  }
                }
              }
              
              fs.writeFileSync(fleetFile, lines.join('\n'), "utf8");
              
              // Run sync-fleet-dashboard.mjs to update the JSON
              exec(`node scripts/actions/sync-fleet-dashboard.mjs`, { cwd: projectRoot }, (error, stdout) => {
                res.setHeader("Content-Type", "application/json");
                res.end(JSON.stringify({ success: true, stdout }));
              });
              
            } else {
               res.statusCode = 500;
               res.end(JSON.stringify({ error: "Table not found in fleet_status.md" }));
            }
          } catch (e) {
            res.statusCode = 500;
            res.end(JSON.stringify({ error: e.message }));
          }
        });
      });
    }
  };
}
