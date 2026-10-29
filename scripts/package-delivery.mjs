import fs from 'node:fs/promises';
import path from 'node:path';
import {execFileSync} from 'node:child_process';
const root=process.cwd();
const out=path.join(root,'无用需求博物馆-项目交付包-20261029.zip');
const files=['README.md','package.json','package-lock.json','.gitignore','.env.example','vite.config.js','index.html','server.mjs','server.test.mjs'];
async function collect(dir,exclude=()=>false){for(const entry of await fs.readdir(path.join(root,dir),{withFileTypes:true})){const rel=path.join(dir,entry.name);if(exclude(rel))continue;if(entry.isDirectory())await collect(rel,exclude);else if(entry.isFile())files.push(rel);}}
await collect('src');await collect('scripts');await collect('dist');await collect('docs',p=>p.endsWith('competition-source.js'));
await collect('data',p=>p.endsWith('.tmp'));
await collect('artifacts',p=>p==='artifacts\\video'||p==='artifacts/video');
const secret=(await fs.readFile('.env','utf8')).match(/^LUX3D_API_KEY\s*=\s*(.+)$/m)?.[1]?.trim().replace(/^['"]|['"]$/g,'');
for(const file of files){if(path.basename(file)==='.env')throw Error('Secret file included');if(secret&&(await fs.readFile(file)).includes(Buffer.from(secret)))throw Error('Credential detected in '+file);}
const entries=files.map(p=>({source:path.join(root,p),entry:'museum-of-useless-needs/'+p.replaceAll('\\','/')}));
for(const pkg of ['three','lucide','vite','@playwright/test','playwright','playwright-core']){const dir=path.join(root,'node_modules',pkg);for(const name of await fs.readdir(dir)){if(/^(LICENSE|NOTICE)(\.|$)/i.test(name))entries.push({source:path.join(dir,name),entry:'museum-of-useless-needs/third-party-licenses/'+pkg.replaceAll('/','-')+'-'+name});}}
const note=`无用需求博物馆 · 项目交付包\n\n本地服务已按要求停止。\n\n查看项目：安装 Node.js 22+，在解压目录执行 npm start，再打开 http://127.0.0.1:8787 。已包含 dist，查看已有展品无需安装依赖或配置 API key。\n继续开发：npm ci，然后 npm run dev。\n新生成：复制 .env.example 为 .env 并填入自己的 LUX3D_API_KEY。出于凭据隔离，本包未包含原 .env。原机器 .env 未删除。\n\n包含：源码、锁文件、构建产物、真实 GLB、任务/审计记录、PDF报告草稿、HTML报告模板、演示视频、截图和测试记录、比赛规则及提交说明。\n已排除：node_modules、真实密钥、重复录屏、下载的官网源码与临时 HTML。\n\n真实官方任务：4477428；缓存模型 7,731,300 字节。\n参赛材料仍须补团队身份与公开链接，不代表已报名或已提交。\n`;
const manifest={out,entries,note};
const py=`import json,sys,zipfile\nsys.stdin.reconfigure(encoding='utf-8')\nm=json.loads(sys.stdin.buffer.read().decode('utf-8'))\nwith zipfile.ZipFile(m['out'],'x',compression=zipfile.ZIP_DEFLATED,compresslevel=6) as z:\n for e in m['entries']: z.write(e['source'],e['entry'])\n z.writestr('museum-of-useless-needs/打开说明.txt',m['note'])\nwith zipfile.ZipFile(m['out']) as z:\n assert z.testzip() is None\n assert not any(n.endswith('/.env') for n in z.namelist())\n print('Archive verified:',len(z.namelist()),'files')\n`;
execFileSync('python',['-c',py],{input:JSON.stringify(manifest),stdio:['pipe','inherit','inherit']});
console.log(out);console.log('Bytes:',(await fs.stat(out)).size);
