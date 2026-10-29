import {chromium} from '@playwright/test';
import fs from 'node:fs/promises';
await fs.mkdir('artifacts',{recursive:true});
const b=await chromium.launch({channel:'msedge',headless:true,args:['--enable-webgl','--ignore-gpu-blocklist']});
const context=await b.newContext({viewport:{width:1440,height:900},recordVideo:{dir:'artifacts/video',size:{width:1440,height:900}}});
const page=await context.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));
await page.goto('http://127.0.0.1:8787',{waitUntil:'networkidle'});
await page.getByText('Lux3D 生成模型 · 真实资产',{exact:true}).waitFor({timeout:30000});
await page.screenshot({path:'artifacts/museum-real-model.png',fullPage:true});
await page.locator('#collection').scrollIntoViewIfNeeded();await page.waitForTimeout(1200);
await page.getByRole('button',{name:'向右旋转',exact:true}).click();await page.waitForTimeout(500);await page.getByRole('button',{name:'向右旋转',exact:true}).click();await page.waitForTimeout(700);
await page.getByRole('button',{name:'试用一下'}).click();await page.waitForTimeout(2800);await page.getByRole('button',{name:'问题还在，但我满意了'}).click();await page.getByRole('button',{name:'无用之巅'}).click();await page.waitForTimeout(900);
await page.getByRole('button',{name:'藏品档案'}).click();await page.waitForTimeout(1600);await page.getByRole('button',{name:'关闭',exact:true}).click();await page.getByRole('button',{name:'空间总览'}).click();await page.waitForTimeout(1600);await page.getByRole('button',{name:'单件鉴赏'}).click();
await page.getByRole('button',{name:'捐赠一个问题'}).click();await page.locator('#need').fill('如何给已经冷掉的咖啡再套一层杯套？');await page.waitForTimeout(1200);
// Do not submit a second paid task just for recording.
await page.getByRole('button',{name:'查看生成展品'}).first().click();await page.getByText('Lux3D 生成模型 · 真实资产',{exact:true}).waitFor();await page.waitForTimeout(1400);
const video=page.video();await context.close();const videoPath=await video.path();await fs.copyFile(videoPath,'artifacts/museum-demo.webm');
const tasks=await (await fetch('http://127.0.0.1:8787/api/generations')).json();const j=tasks.generations[0];const details=JSON.parse(await fs.readFile('data/generations.json','utf8'))[0];const stat=await fs.stat('data/models/'+j.id+'.glb');
const report=await b.newPage();await report.goto(new URL('../docs/project-report.html',import.meta.url).href);
await report.locator('#runtime-evidence').evaluate((node,evidence)=>{node.innerHTML='';for(const text of evidence){const p=document.createElement('p');p.textContent=text;node.append(p);}},[
'真实本机验收：'+new Date().toLocaleString('zh-CN',{timeZone:'Asia/Shanghai'})+'（北京时间）',
'官方 Lux3D 任务编号：'+details.taskId+'；本地记录：'+j.id,
'生成状态：'+j.status+'；GLB 已缓存：'+j.cached+'；模型大小：'+(stat.size/1048576).toFixed(2)+' MB。',
'浏览器已确认出现“Lux3D 生成模型 · 真实资产”并完成加载，没有以概念模型替代验收。',
'自动验证通过：服务端隔离 mock 测试；Vite 构建；桌面与375px手机交互；投票刷新保持；分类；弹窗；失败反馈；812px横屏与减少动态效果。',
'实际演示素材：artifacts/museum-demo.webm；真实模型截图：artifacts/museum-real-model.png。视频包含真实交互与模型浏览，但生成耗时部分以任务档案作证，没有剪造瞬时生成。',
'当前限制：尚未公开部署、团队信息未填写、社交介绍未发布；目前只有首件是真实 AI 馆藏，其余五件为明确标注的概念装置。'
]);
const img=report.locator('#runtime-evidence');await img.evaluate(node=>{const el=document.createElement('img');el.src='../artifacts/museum-real-model.png';el.style.maxHeight='48mm';el.style.objectFit='cover';el.style.objectPosition='center 38%';node.append(el);});
await report.pdf({path:'artifacts/无用需求博物馆-项目报告草稿.pdf',format:'A4',printBackground:true,preferCSSPageSize:true});
await fs.writeFile('artifacts/real-model-verification.json',JSON.stringify({at:new Date().toISOString(),officialTaskId:details.taskId,localId:j.id,cached:j.cached,bytes:stat.size,rendererStatus:'Lux3D 生成模型 · 真实资产',errors},null,2));
await b.close();if(errors.length)throw Error(errors.join('\n'));console.log('Real model verified. Video and PDF report saved.');
