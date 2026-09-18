const $=s=>document.querySelector(s), $$=s=>[...document.querySelectorAll(s)];
const KEY="minjeong_money_v01", CLOUD="minjeong_money_cloud_v01";
const money=n=>(Number(n)||0).toLocaleString("ko-KR")+"원";
const iso=d=>{let x=new Date(d); x.setMinutes(x.getMinutes()-x.getTimezoneOffset()); return x.toISOString().slice(0,10)};
const today=()=>iso(new Date());
const defaults={weeklyBudget:100000,categories:["식비","카페·간식","교통","쇼핑","생활","기타"],pots:[],expenses:[],deletedExpenseIds:[],updatedAt:0};
let data=load(), kind="weekly", calDate=new Date(), statsDate=new Date(), selectedDay=today();

function load(){try{let x={...defaults,...JSON.parse(localStorage.getItem(KEY)||"{}")};x.deletedExpenseIds=Array.isArray(x.deletedExpenseIds)?x.deletedExpenseIds:[];return x}catch{return structuredClone(defaults)}}
function save(localOnly=false){data.updatedAt=Date.now();localStorage.setItem(KEY,JSON.stringify(data));render();if(!localOnly) scheduleSync()}
function cloud(){try{return JSON.parse(localStorage.getItem(CLOUD)||"{}")}catch{return {}}}
function saveCloudObj(x){localStorage.setItem(CLOUD,JSON.stringify(x))}
function startOfWeek(d=new Date()){let x=new Date(d);x.setHours(0,0,0,0);let day=(x.getDay()+6)%7;x.setDate(x.getDate()-day);return x}
function endOfWeek(d=new Date()){let x=startOfWeek(d);x.setDate(x.getDate()+6);return x}
function inRange(ds,a,b){let x=new Date(ds+"T12:00:00");return x>=a&&x<=b}
function weeklySpent(){let a=startOfWeek(),b=endOfWeek();return data.expenses.filter(e=>e.kind==="weekly"&&inRange(e.date,a,b)).reduce((s,e)=>s+e.amount,0)}
function todaySpendable(){
 let a=startOfWeek(),b=endOfWeek(),td=today(),now=new Date();
 let beforeToday=data.expenses.filter(e=>e.kind==="weekly"&&inRange(e.date,a,b)&&e.date<td).reduce((s,e)=>s+e.amount,0);
 let todaySpent=data.expenses.filter(e=>e.kind==="weekly"&&e.date===td).reduce((s,e)=>s+e.amount,0);
 let days=Math.max(1,Math.floor((b-new Date(now.getFullYear(),now.getMonth(),now.getDate()))/86400000)+1);
 let todayBase=Math.floor(Math.max(0,data.weeklyBudget-beforeToday)/days);
 return todayBase-todaySpent;
}
function monthKey(d){return d.getFullYear()+"-"+String(d.getMonth()+1).padStart(2,"0")}
function esc(s=""){return String(s).replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[m]))}

function render(){
 let a=startOfWeek(),b=endOfWeek(),spent=weeklySpent();
 $("#weekRemain").textContent=money(Math.max(0,data.weeklyBudget-spent));
 $("#todaySpendable").textContent=money(todaySpendable());
 $("#weekRange").textContent=`${a.getMonth()+1}/${a.getDate()} ~ ${b.getMonth()+1}/${b.getDate()} · 사용 ${money(spent)} / ${money(data.weeklyBudget)}`;
 $("#weeklyBudget").value=data.weeklyBudget; $("#date").value=$("#date").value||today();
 $("#category").innerHTML=data.categories.map(x=>`<option>${esc(x)}</option>`).join("");
 $("#potSelect").innerHTML=data.pots.length?data.pots.map(p=>`<option value="${p.id}">${esc(p.name)}</option>`).join(""):`<option value="">별도항목을 먼저 만들어주세요</option>`;
 $("#recent").innerHTML=data.expenses.length?data.expenses.slice().sort((a,b)=>b.date.localeCompare(a.date)||b.createdAt-a.createdAt).slice(0,8).map(expenseHTML).join(""):"아직 지출이 없어요.";
 $("#categoryChips").innerHTML=data.categories.map((x,i)=>`<button class="chip" data-delcat="${i}">${esc(x)} ×</button>`).join("");
 $("#potList").innerHTML=data.pots.length?data.pots.map(p=>`<div class="pot"><div class="potTop"><b>${esc(p.name)}</b><button style="width:auto" data-delpot="${p.id}">삭제</button></div><small>월 예산 ${money(p.budget)}</small></div>`).join(""):"등록된 별도항목이 없어요.";
 renderCalendar();renderStats();
}
function expenseHTML(e){let label=e.kind==="pot"?(data.pots.find(p=>p.id===e.potId)?.name||"별도항목"):e.category;return `<div class="expense"><div><strong>${esc(e.memo||label)}</strong><div class="meta">${e.date} · ${esc(label)}</div></div><div class="money">-${money(e.amount)}</div><div></div><button data-del="${e.id}">삭제</button></div>`}

function renderCalendar(){
 let y=calDate.getFullYear(),m=calDate.getMonth();$("#monthTitle").textContent=`${y}년 ${m+1}월`;
 let first=new Date(y,m,1), last=new Date(y,m+1,0), blanks=(first.getDay()+6)%7, html="";
 for(let i=0;i<blanks;i++) html+=`<div class="day blank"></div>`;
 for(let d=1;d<=last.getDate();d++){let ds=iso(new Date(y,m,d)),sum=data.expenses.filter(e=>e.date===ds).reduce((s,e)=>s+e.amount,0);html+=`<button class="day ${ds===today()?"today":""} ${ds===selectedDay?"selected":""}" data-day="${ds}"><b>${d}</b>${sum?`<em>${money(sum)}</em>`:""}</button>`}
 $("#calendarGrid").innerHTML=html;
 let arr=data.expenses.filter(e=>e.date===selectedDay);$("#dayDetail").innerHTML=`<b>${selectedDay}</b>`+(arr.length?arr.map(expenseHTML).join(""):"<p>지출 없음</p>");
}
function renderStats(){
 let mk=monthKey(statsDate), arr=data.expenses.filter(e=>e.date.startsWith(mk));$("#statsTitle").textContent=`${statsDate.getFullYear()}년 ${statsDate.getMonth()+1}월`;
 let total=arr.reduce((s,e)=>s+e.amount,0);$("#monthTotal").textContent=money(total);
 let groups={};arr.forEach(e=>{let n=e.kind==="pot"?"[별도] "+(data.pots.find(p=>p.id===e.potId)?.name||"별도항목"):e.category;groups[n]=(groups[n]||0)+e.amount});
 $("#categoryStats").innerHTML=Object.keys(groups).length?Object.entries(groups).sort((a,b)=>b[1]-a[1]).map(([n,v])=>bar(n,v,total)).join(""):"이번 달 지출이 없어요.";
 $("#potStats").innerHTML=data.pots.length?data.pots.map(p=>{let used=arr.filter(e=>e.kind==="pot"&&e.potId===p.id).reduce((s,e)=>s+e.amount,0);return `<div class="pot"><div class="potTop"><b>${esc(p.name)}</b><span>${money(used)} / ${money(p.budget)}</span></div>${bar("",used,p.budget||used||1)}</div>`}).join(""):"별도항목이 없어요.";
}
function bar(n,v,total){let pct=Math.min(100,Math.round(v/(total||1)*100));return `<div class="barRow"><div class="barTop"><span>${esc(n)}</span><b>${money(v)}</b></div><div class="bar"><i style="width:${pct}%"></i></div></div>`}

$$("nav button").forEach(b=>b.onclick=()=>{$$(".page").forEach(x=>x.classList.remove("active"));$$("nav button").forEach(x=>x.classList.remove("active"));$("#"+b.dataset.page).classList.add("active");b.classList.add("active");render()});
$$(".seg button").forEach(b=>b.onclick=()=>{kind=b.dataset.kind;$$(".seg button").forEach(x=>x.classList.toggle("active",x===b));$("#potSelect").classList.toggle("hidden",kind!=="pot")});
$("#addExpense").onclick=()=>{let amount=Number($("#amount").value);if(!amount||amount<1)return alert("금액을 입력해줘!");if(kind==="pot"&&!$("#potSelect").value)return alert("월간 별도항목을 먼저 만들어줘!");
 data.expenses.push({id:crypto.randomUUID(),amount,date:$("#date").value||today(),category:$("#category").value,memo:$("#memo").value.trim(),kind,potId:kind==="pot"?$("#potSelect").value:null,createdAt:Date.now()});$("#amount").value="";$("#memo").value="";save()};
document.addEventListener("click",e=>{let id=e.target.dataset.del;if(id){data.deletedExpenseIds=[...new Set([...(data.deletedExpenseIds||[]),id])];data.expenses=data.expenses.filter(x=>x.id!==id);save()}let dc=e.target.dataset.delcat;if(dc!==undefined&&data.categories.length>1){data.categories.splice(Number(dc),1);save()}let dp=e.target.dataset.delpot;if(dp){data.pots=data.pots.filter(x=>x.id!==dp);save()}let day=e.target.closest("[data-day]")?.dataset.day;if(day){selectedDay=day;renderCalendar()}});
$("#saveBudget").onclick=()=>{data.weeklyBudget=Math.max(0,Number($("#weeklyBudget").value)||0);save()};
$("#addCategory").onclick=()=>{let v=$("#newCategory").value.trim();if(v&&!data.categories.includes(v)){data.categories.push(v);$("#newCategory").value="";save()}};
$("#addPot").onclick=()=>{let n=$("#newPotName").value.trim(),b=Number($("#newPotBudget").value)||0;if(!n)return alert("항목 이름을 입력해줘!");data.pots.push({id:crypto.randomUUID(),name:n,budget:b});$("#newPotName").value="";$("#newPotBudget").value="";save()};
$("#prevMonth").onclick=()=>{calDate.setMonth(calDate.getMonth()-1);renderCalendar()};$("#nextMonth").onclick=()=>{calDate.setMonth(calDate.getMonth()+1);renderCalendar()};
$("#prevStats").onclick=()=>{statsDate.setMonth(statsDate.getMonth()-1);renderStats()};$("#nextStats").onclick=()=>{statsDate.setMonth(statsDate.getMonth()+1);renderStats()};

$("#generateSyncKey").onclick=()=>{let a=new Uint8Array(24);crypto.getRandomValues(a);$("#syncKey").value=btoa(String.fromCharCode(...a)).replace(/[+/=]/g,"").slice(0,32)};
$("#copySyncKey").onclick=async()=>{let v=$("#syncKey").value;if(!v)return alert("먼저 동기화 코드를 만들어줘!");try{await navigator.clipboard.writeText(v);alert("동기화 코드 복사 완료!")}catch{prompt("아래 코드를 길게 눌러 복사해줘.",v)}};
$("#saveCloud").onclick=()=>{let c={url:$("#sbUrl").value.trim().replace(/\/$/,""),key:$("#sbKey").value.trim(),syncKey:$("#syncKey").value};if(!c.url||!c.key||!c.syncKey)return alert("URL, publishable key, 동기화 코드를 모두 넣어줘!");saveCloudObj(c);setStatus("연결 정보 저장됨");};
function fillCloud(){let c=cloud();$("#sbUrl").value=c.url||"";$("#sbKey").value=c.key||"";$("#syncKey").value=c.syncKey||"";if(c.url&&c.key&&c.syncKey)setStatus("클라우드 연결 정보 있음")} fillCloud();
function setStatus(s){$("#syncStatus").textContent=s}
async function sha256(s){let b=await crypto.subtle.digest("SHA-256",new TextEncoder().encode(s));return [...new Uint8Array(b)].map(x=>x.toString(16).padStart(2,"0")).join("")}
async function deriveKey(pass,salt){let base=await crypto.subtle.importKey("raw",new TextEncoder().encode(pass),"PBKDF2",false,["deriveKey"]);return crypto.subtle.deriveKey({name:"PBKDF2",salt,iterations:150000,hash:"SHA-256"},base,{name:"AES-GCM",length:256},false,["encrypt","decrypt"])}
const b64=u=>btoa(String.fromCharCode(...u)), unb64=s=>Uint8Array.from(atob(s),c=>c.charCodeAt(0));
async function encryptPayload(obj,pass){let salt=crypto.getRandomValues(new Uint8Array(16)),iv=crypto.getRandomValues(new Uint8Array(12)),key=await deriveKey(pass,salt),plain=new TextEncoder().encode(JSON.stringify(obj)),ct=await crypto.subtle.encrypt({name:"AES-GCM",iv},key,plain);return {v:1,salt:b64(salt),iv:b64(iv),cipher:b64(new Uint8Array(ct))}}
async function decryptPayload(enc,pass){let salt=unb64(enc.salt),iv=unb64(enc.iv),key=await deriveKey(pass,salt),pt=await crypto.subtle.decrypt({name:"AES-GCM",iv},key,unb64(enc.cipher));return JSON.parse(new TextDecoder().decode(pt))}
async function rpc(name,args){let c=cloud(),r=await fetch(c.url+"/rest/v1/rpc/"+name,{method:"POST",headers:{"Content-Type":"application/json","apikey":c.key,"Authorization":"Bearer "+c.key},body:JSON.stringify(args)});if(!r.ok)throw new Error(await r.text());let t=await r.text();return t?JSON.parse(t):null}
function mergeData(local,remote){
 if(!remote)return {...defaults,...local,deletedExpenseIds:local.deletedExpenseIds||[]};
 let deleted=[...new Set([...(local.deletedExpenseIds||[]),...(remote.deletedExpenseIds||[])])];
 let map=new Map();
 [...(remote.expenses||[]),...(local.expenses||[])].forEach(e=>{if(e&&e.id&&!deleted.includes(e.id)){let prev=map.get(e.id);if(!prev||Number(e.createdAt||0)>=Number(prev.createdAt||0))map.set(e.id,e)}});
 let newer=Number(remote.updatedAt||0)>Number(local.updatedAt||0)?remote:local;
 return {...defaults,...newer,
   categories:[...new Set([...(remote.categories||[]),...(local.categories||[])])],
   pots:[...(remote.pots||[]),...(local.pots||[])].reduce((a,p)=>{if(p&&p.id&&!a.some(x=>x.id===p.id))a.push(p);return a},[]),
   expenses:[...map.values()],
   deletedExpenseIds:deleted,
   updatedAt:Math.max(Number(local.updatedAt||0),Number(remote.updatedAt||0))
 };
}
let syncTimer;
function scheduleSync(){clearTimeout(syncTimer);if(cloud().url)syncTimer=setTimeout(()=>syncData(true),900)}
async function syncData(silent=false){let c=cloud();if(!c.url||!c.key||!c.syncKey){if(!silent)alert("먼저 동기화 연결 정보를 저장해줘!");return}
 try{setStatus("동기화 중…");let hash=await sha256(c.syncKey),rows=await rpc("money_sync_pull",{p_sync_key_hash:hash}),remote=Array.isArray(rows)&&rows[0]?.payload?await decryptPayload(rows[0].payload,c.syncKey):null;
 let merged=mergeData(data,remote);data=merged;localStorage.setItem(KEY,JSON.stringify(data));
 let enc=await encryptPayload(merged,c.syncKey);await rpc("money_sync_push",{p_sync_key_hash:hash,p_payload:enc});setStatus("동기화 완료");render();if(!silent)alert("동기화 완료!")}
 catch(e){console.error(e);setStatus("동기화 실패");if(!silent)alert("동기화에 실패했어. 연결 정보와 SQL 설정을 확인해줘.")}}
$("#syncNow").onclick=()=>syncData(false);
window.addEventListener("focus",()=>{if(cloud().url)syncData(true)});

$("#backup").onclick=()=>{let blob=new Blob([JSON.stringify(data,null,2)],{type:"application/json"}),a=document.createElement("a");a.href=URL.createObjectURL(blob);a.download=`minjeong-money-backup-${today()}.json`;a.click();URL.revokeObjectURL(a.href)};
$("#restore").onchange=async e=>{try{let obj=JSON.parse(await e.target.files[0].text());if(!confirm("현재 데이터를 백업 파일로 바꿀까?"))return;data={...defaults,...obj,updatedAt:Date.now()};save()}catch{alert("백업 파일을 읽지 못했어.")}};
if("serviceWorker"in navigator)navigator.serviceWorker.register("./sw.js").catch(()=>{});
render();