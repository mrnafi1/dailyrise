import { useState, useCallback, useEffect } from "react";
import { signInWithPopup } from "firebase/auth";
import { auth, googleProvider } from "./firebase.config.js"; 
const TODAY = new Date().toISOString().slice(0,10);
const THIS_MONTH = TODAY.slice(0,7);
const APP_VER = "2.1.0";
const PRAYERS_EN = ["Fajr","Dhuhr","Asr","Maghrib","Isha"];
const OPT_PRAYERS = [{key:"tahajjud",color:"#8b5cf6"},{key:"ishraq",color:"#f59e0b"},{key:"chasht",color:"#f97316"},{key:"awwabin",color:"#06b6d4"},{key:"nafl",color:"#10b981"}];
const TB_KEYS = ["subhanAllah","alhamdulillah","allahuAkbar","astaghfirullah"];
const TB_COLORS = ["#10b981","#7c6fff","#f59e0b","#ef4444"];
const INIT_TB = {subhanAllah:0,alhamdulillah:0,allahuAkbar:0,astaghfirullah:0};
const MOOD_META = {great:{c:"#10b981",e:"😄"},good:{c:"#84cc16",e:"🙂"},okay:{c:"#eab308",e:"😐"},bad:{c:"#f97316",e:"😔"},awful:{c:"#ef4444",e:"😢"}};
const EX_PRE = [["🏃","Running"],["💪","Push-ups"],["🚴","Cycling"],["🧘","Yoga"],["🏊","Swimming"],["🚶","Walking"],["🏋️","Weights"]];
const CAT_PRE = ["🍔 Food","🚌 Transport","🛒 Shopping","📚 Education","💊 Health","🎮 Fun","🏠 House"];
const DEF_HABITS = [{id:"h1",en:"Wake up early",bn:"ভোরে ওঠা",icon:"🌅"},{id:"h2",en:"Morning routine",bn:"সকালের রুটিন",icon:"🪥"},{id:"h3",en:"No phone before Fajr",bn:"ফজরের আগে ফোন নয়",icon:"📵"},{id:"h4",en:"Read 30 min",bn:"৩০ মিনিট পড়া",icon:"📖"},{id:"h5",en:"Drink water",bn:"পানি পান করো",icon:"💧"}];
const CHALLENGES = [{en:"Complete all 5 prayers daily",bn:"প্রতিদিন ৫ ওয়াক্ত নামাজ"},{en:"Read at least 20 min daily",bn:"প্রতিদিন ২০ মিনিট পড়ো"},{en:"Exercise 4 days this week",bn:"এই সপ্তাহে ৪ দিন ব্যায়াম"},{en:"Drink 8 glasses water daily",bn:"প্রতিদিন ৮ গ্লাস পানি"},{en:"No wasted time >30 min/day",bn:"৩০ মিনিটের বেশি সময় নষ্ট না করা"},{en:"Complete all daily tasks",bn:"সব দৈনিক কাজ শেষ করো"}];
const ACHIEVEMENTS = [
  {id:"a1",icon:"🕌",en:"Prayer Keeper",bn:"নামাজ রক্ষক",check:d=>PRAYERS_EN.filter(p=>(d.prayers[TODAY]||{})[p]).length===5},
  {id:"a2",icon:"📚",en:"Bookworm",bn:"পাঠকসেরা",check:d=>(d.reading?.sessions?.[TODAY]||[]).reduce((s,r)=>s+r.mins,0)>=60},
  {id:"a3",icon:"💧",en:"Hydrated",bn:"সুসিক্ত",check:d=>(d.water[TODAY]||0)>=8},
  {id:"a4",icon:"🏃",en:"Athlete",bn:"অ্যাথলেট",check:d=>(d.exercise[TODAY]||[]).reduce((s,e)=>s+e.mins,0)>=30},
  {id:"a5",icon:"📿",en:"Dhikr Master",bn:"যিকর গুরু",check:d=>TB_KEYS.every(k=>(d.tasbeeh?.[TODAY]?.[k]||0)>=33)},
  {id:"a6",icon:"✅",en:"Task Master",bn:"কাজের মাস্টার",check:d=>(d.tasks.today||[]).filter(x=>x.done).length>=5},
];
const INIT = {expenses:{},reading:{sessions:{},quran:{},notes:[]},exercise:{},prayers:{},tasbeeh:{},optPrayers:{},duas:{},tasks:{today:[],tomorrow:[],history:{}},habits:{defs:[...DEF_HABITS],log:{}},journal:{},weights:[],water:{},sleep:{},wasted:{},mood:{},weekly:[],monthly:[],weeklyChallenge:null,challengeProgress:{},monthBudget:0,height:170,readPlan:"",userName:"",email:"",pin:"",unlockedAchievements:[]};
const THEMES = {
  dark:{bg:"#07080f",card:"#13141f",border:"rgba(255,255,255,0.07)",text:"#e2e4f0",muted:"rgba(226,228,240,0.42)",input:"#0a0b14",accent:"#7c6fff",accentB:"#5b4fff",glow:"rgba(124,111,255,0.22)",navBg:"rgba(13,14,25,0.97)"},
  light:{bg:"#f0f2fa",card:"#ffffff",border:"rgba(0,0,0,0.08)",text:"#0f1020",muted:"rgba(15,16,32,0.45)",input:"#f5f6fc",accent:"#6366f1",accentB:"#4f52d9",glow:"rgba(99,102,241,0.18)",navBg:"rgba(255,255,255,0.97)"},
};

const T = {
  en:{app:"DailyRise",sw:"বাংলা",nav:{home:"Home",expense:"Expense",reading:"Reading",exercise:"Exercise",prayer:"Prayer",tasks:"Tasks",health:"Health",habits:"Habits",journal:"Journal",timeline:"Timeline",weekly:"Weekly",monthly:"Monthly",stats:"Stats",settings:"Settings"},home:{summary:"Today's Overview",tasks:"Tasks",prayer:"Prayers",water:"Water",budget:"Spent",reading:"Reading",exercise:"Exercise",wasted:"Wasted",streak:"Streak",sleep:"Sleep",mood:"Mood",challenge:"Challenge"},onboard:{title:"Welcome to DailyRise",sub:"Set up your profile to begin",name:"Your Name",height:"Height (cm)",budget:"Monthly Budget (৳)",pin:"PIN Lock (optional)",next:"Get Started →"},expense:{title:"Expenses",add:"Add Expense",amount:"Amount (৳)",category:"Category",total:"Today's Total",monthBudget:"Monthly Budget",spent:"Spent",remaining:"Remaining"},reading:{title:"Reading",tabs:["📚 Books","🕌 Quran","📝 Notes"],book:"Book Title",author:"Author",mins:"Time (min)",pages:"Pages",totalPages:"Total Pages",note:"Key Takeaway",rating:"Rating",plan_label:"Tomorrow's Plan",genres:["📖 Islamic","📚 Self-Help","🔬 Science","📰 Fiction","🎓 Academic","💼 Business","🌍 History"],add:"Log Session",weekChart:"7-Day Reading",progress:"Progress",stats:{sessions:"Sessions",pages:"Pages",mins:"Minutes",avgRating:"Avg Rating"},quranSurah:"Surah / Ayah",quranMins:"Minutes",addQuran:"Log Tilawat",noteTitle:"Title",noteBody:"Note...",addNote:"Add Note",allNotes:"All Notes"},exercise:{title:"Exercise",type:"Type",mins:"Duration (min)",total:"Total",add:"Add"},prayer:{title:"Prayers",tabs:["🕌 Fardh","✨ Nafl","📿 Tasbeeh","🤲 Dua"],names:["Fajr","Dhuhr","Asr","Maghrib","Isha"],times:["🌅 Dawn","☀️ Noon","🌤 Afternoon","🌇 Sunset","🌙 Night"],prayed:"Prayed",missed:"Missed",tahajjud:"Tahajjud",tahajjudDesc:"🌙 Late Night",ishraq:"Ishraq",ishraqDesc:"🌅 After Sunrise",chasht:"Chasht (Duha)",chashtDesc:"☀️ Mid-Morning",awwabin:"Awwabin",awwabinDesc:"🌇 After Maghrib",nafl:"Nafl",naflDesc:"✨ Any Time",subhanAllah:"سُبْحَانَ ٱللَّٰهِ",alhamdulillah:"ٱلْحَمْدُ لِلَّٰهِ",allahuAkbar:"ٱللَّٰهُ أَكْبَرُ",astaghfirullah:"أَسْتَغْفِرُ ٱللَّٰهَ",target:"Target: 33",totalTasbeeh:"Today's Total",resetAll:"Reset All",addDua:"Write your dua...",saveDua:"Save",weekChart:"This Week"},tasks:{title:"Tasks",today:"Today",tomorrow:"Tomorrow",add:"New task...",done:"Done",pending:"Pending",important:"Important",completion:"Completion"},health:{title:"Health",weight:"Weight (kg)",height:"Height (cm)",bmi:"BMI",mood:"Mood",water:"Water",sleep:"Sleep (hrs)",wasted:"Wasted Time",reason:"Reason",mins:"Minutes",addWeight:"Log Weight",history:"Weight History"},habits:{title:"Habits",habitName:"Habit name",streak:"day streak",done:"Done",pending:"Pending",custom:"Add Custom"},journal:{title:"Journal",learned:"What did I learn?",grateful:"What am I grateful for?",improve:"What to improve?",save:"Save Entry",today:"Today's Entry",past:"Past Entries"},timeline:{title:"Today's Timeline",empty:"No activities logged yet"},weekly:{title:"Weekly Goals"},monthly:{title:"Monthly Goals"},stats:{title:"Statistics",bestStreak:"Best Streak",thisMonth:"This Month",expTrend:"Expense Trend (7d)",taskRate:"Task Rate",prayerRate:"Prayer Rate",aiSummary:"AI Weekly Summary",generate:"Generate",generating:"Generating..."},settings:{title:"Settings",profile:"Profile",name:"Name",height:"Height (cm)",budget:"Monthly Budget",pin:"PIN Lock",data:"Data",export:"Export CSV",reset:"Reset All Data",resetConfirm:"Type RESET to confirm",backup:"Auto Backup",backupInfo:"All data saved to localStorage automatically"},moods:{great:"Great 😄",good:"Good 🙂",okay:"Okay 😐",bad:"Bad 😔",awful:"Awful 😢"},achievements:{title:"Achievements"},challenge:{title:"Weekly Challenge",complete:"Mark Day Done",completed:"Completed! ✅"},export:{csv:"Export CSV",copy:"Copy JSON"},emptyState:"No entries yet",},
  bn:{app:"DailyRise",sw:"English",nav:{home:"হোম",expense:"খরচ",reading:"পড়াশোনা",exercise:"ব্যায়াম",prayer:"নামাজ",tasks:"কাজ",health:"স্বাস্থ্য",habits:"অভ্যাস",journal:"জার্নাল",timeline:"টাইমলাইন",weekly:"সাপ্তাহিক",monthly:"মাসিক",stats:"পরিসংখ্যান",settings:"সেটিংস"},home:{summary:"আজকের সারসংক্ষেপ",tasks:"কাজ",prayer:"নামাজ",water:"পানি",budget:"খরচ",reading:"পড়াশোনা",exercise:"ব্যায়াম",wasted:"নষ্ট সময়",streak:"ধারা",sleep:"ঘুম",mood:"মেজাজ",challenge:"চ্যালেঞ্জ"},onboard:{title:"DailyRise-এ স্বাগতম",sub:"তোমার প্রোফাইল সেটআপ করো",name:"তোমার নাম",height:"উচ্চতা (সেমি)",budget:"মাসিক বাজেট (৳)",pin:"PIN লক (ঐচ্ছিক)",next:"শুরু করো →"},expense:{title:"খরচ",add:"খরচ যোগ করো",amount:"পরিমাণ (৳)",category:"ক্যাটাগরি",total:"আজকের মোট",monthBudget:"মাসিক বাজেট",spent:"খরচ",remaining:"বাকি"},reading:{title:"পড়াশোনা",tabs:["📚 বই","🕌 কুরআন","📝 নোট"],book:"বইয়ের নাম",author:"লেখক",mins:"সময় (মিনিট)",pages:"পৃষ্ঠা",totalPages:"মোট পৃষ্ঠা",note:"মূল শিক্ষা",rating:"রেটিং",plan_label:"আগামীকালের পরিকল্পনা",genres:["📖 ইসলামিক","📚 সেলফ-হেল্প","🔬 বিজ্ঞান","📰 ফিকশন","🎓 একাডেমিক","💼 ব্যবসা","🌍 ইতিহাস"],add:"সেশন লগ করো",weekChart:"৭ দিনের পড়া",progress:"অগ্রগতি",stats:{sessions:"সেশন",pages:"পৃষ্ঠা",mins:"মিনিট",avgRating:"রেটিং"},quranSurah:"সূরা / আয়াত",quranMins:"মিনিট",addQuran:"তিলাওয়াত লগ করো",noteTitle:"শিরোনাম",noteBody:"নোট...",addNote:"নোট যোগ করো",allNotes:"সব নোট"},exercise:{title:"ব্যায়াম",type:"ব্যায়ামের ধরন",mins:"সময় (মিনিট)",total:"মোট",add:"যোগ করো"},prayer:{title:"নামাজ",tabs:["🕌 ফরজ","✨ নফল","📿 তাসবিহ","🤲 দোয়া"],names:["ফজর","জোহর","আসর","মাগরিব","ইশা"],times:["🌅 ভোর","☀️ দুপুর","🌤 বিকেল","🌇 সন্ধ্যা","🌙 রাত"],prayed:"পড়েছি",missed:"পড়িনি",tahajjud:"তাহাজ্জুদ",tahajjudDesc:"🌙 রাত ৩টার পর",ishraq:"ইশরাক",ishraqDesc:"🌅 সূর্যোদয়ের পর",chasht:"চাশত",chashtDesc:"☀️ সকাল ৯-১১টা",awwabin:"আওয়াবীন",awwabinDesc:"🌇 মাগরিবের পর",nafl:"নফল",naflDesc:"✨ যেকোনো সময়",subhanAllah:"سُبْحَانَ ٱللَّٰهِ",alhamdulillah:"ٱلْحَمْدُ لِلَّٰهِ",allahuAkbar:"ٱللَّٰهُ أَكْبَرُ",astaghfirullah:"أَسْتَغْفِرُ ٱللَّٰهَ",target:"লক্ষ্য: ৩৩ বার",totalTasbeeh:"আজকের মোট",resetAll:"সব রিসেট",addDua:"দোয়া লিখুন...",saveDua:"সেভ করো",weekChart:"এই সপ্তাহ"},tasks:{title:"কাজ",today:"আজকের কাজ",tomorrow:"আগামীকালের কাজ",add:"নতুন কাজ...",done:"শেষ",pending:"বাকি",important:"গুরুত্বপূর্ণ",completion:"সম্পন্নের হার"},health:{title:"স্বাস্থ্য",weight:"ওজন (কেজি)",height:"উচ্চতা (সেমি)",bmi:"বিএমআই",mood:"মেজাজ",water:"পানি পান",sleep:"ঘুম (ঘণ্টা)",wasted:"নষ্ট সময়",reason:"কারণ",mins:"মিনিট",addWeight:"ওজন লগ করো",history:"ওজনের ইতিহাস"},habits:{title:"অভ্যাস",habitName:"অভ্যাসের নাম",streak:"দিনের ধারা",done:"হয়েছে",pending:"বাকি",custom:"কাস্টম যোগ করো"},journal:{title:"জার্নাল",learned:"আজ কী শিখলাম?",grateful:"কীসের জন্য কৃতজ্ঞ?",improve:"কোথায় উন্নতি করবো?",save:"সেভ করো",today:"আজকের এন্ট্রি",past:"আগের এন্ট্রি"},timeline:{title:"আজকের টাইমলাইন",empty:"আজ কোনো অ্যাক্টিভিটি নেই"},weekly:{title:"সাপ্তাহিক লক্ষ্য"},monthly:{title:"মাসিক লক্ষ্য"},stats:{title:"পরিসংখ্যান",bestStreak:"সেরা ধারা",thisMonth:"এই মাস",expTrend:"খরচের ট্রেন্ড (৭ দিন)",taskRate:"কাজের হার",prayerRate:"নামাজের হার",aiSummary:"AI সাপ্তাহিক সারসংক্ষেপ",generate:"তৈরি করো",generating:"তৈরি হচ্ছে..."},settings:{title:"সেটিংস",profile:"প্রোফাইল",name:"নাম",height:"উচ্চতা (সেমি)",budget:"মাসিক বাজেট",pin:"PIN লক",data:"ডেটা",export:"CSV এক্সপোর্ট",reset:"সব ডেটা রিসেট",resetConfirm:"নিশ্চিত করতে RESET লিখুন",backup:"অটো ব্যাকআপ",backupInfo:"সব ডেটা localStorage-এ স্বয়ংক্রিয়ভাবে সংরক্ষিত হচ্ছে"},moods:{great:"দারুণ 😄",good:"ভালো 🙂",okay:"ঠিকঠাক 😐",bad:"খারাপ 😔",awful:"খুব খারাপ 😢"},achievements:{title:"অর্জন"},challenge:{title:"সাপ্তাহিক চ্যালেঞ্জ",complete:"আজকের দিন সম্পন্ন",completed:"সম্পন্ন! ✅"},export:{csv:"CSV এক্সপোর্ট",copy:"JSON কপি"},emptyState:"এখনো কোনো এন্ট্রি নেই",},
};

// ── HOOK ──────────────────────────────────────────────────────────────────────
function usePersist(key,init){
  const [v,sv]=useState(()=>{try{const s=localStorage.getItem(key);return s?JSON.parse(s):init;}catch{return init;}});
  const set=useCallback(fn=>sv(p=>{const n=typeof fn==="function"?fn(p):fn;try{localStorage.setItem(key,JSON.stringify(n));}catch{}return n;}),[key]);
  return [v,set];
}

// ── PRIMITIVES ────────────────────────────────────────────────────────────────
const S = {
  card:{background:"var(--card)",border:"1px solid var(--border)",borderRadius:20,padding:"16px 18px"},
  inp:{background:"var(--input)",border:"1px solid var(--border)",borderRadius:12,padding:"10px 13px",color:"var(--text)",fontSize:14,outline:"none",width:"100%",boxSizing:"border-box",fontFamily:"inherit"},
};

function Card({children,style={},onClick,glow}){
  const [h,sH]=useState(false);
  return <div onClick={onClick} onMouseEnter={()=>sH(true)} onMouseLeave={()=>sH(false)}
    style={{...S.card,boxShadow:h&&onClick?"0 8px 28px var(--glow)":glow?"0 4px 18px var(--glow)":"0 2px 10px rgba(0,0,0,0.1)",cursor:onClick?"pointer":"default",transform:h&&onClick?"translateY(-2px)":"none",transition:"all .2s",...style}}>{children}</div>;
}
function Pill({label,active,onClick,color="#7c6fff"}){
  return <button onClick={onClick} style={{background:active?color:"var(--input)",color:active?"#fff":"var(--muted)",border:active?"none":"1px solid var(--border)",borderRadius:100,padding:"6px 13px",fontSize:12,fontWeight:600,cursor:"pointer",transition:"all .15s",whiteSpace:"nowrap",flexShrink:0}}>{label}</button>;
}
function FInp({label,style:st={},...p}){
  return <div style={{display:"flex",flexDirection:"column",gap:4}}>
    {label&&<span style={{fontSize:10,fontWeight:700,color:"var(--muted)",textTransform:"uppercase",letterSpacing:".06em"}}>{label}</span>}
    <input {...p} style={{...S.inp,...st}} onFocus={e=>e.target.style.borderColor="var(--accent)"} onBlur={e=>e.target.style.borderColor="var(--border)"}/>
  </div>;
}
function FTA({label,...p}){
  return <div style={{display:"flex",flexDirection:"column",gap:4}}>
    {label&&<span style={{fontSize:10,fontWeight:700,color:"var(--muted)",textTransform:"uppercase",letterSpacing:".06em"}}>{label}</span>}
    <textarea {...p} style={{...S.inp,resize:"vertical",minHeight:65,lineHeight:1.5,...(p.style||{})}} onFocus={e=>e.target.style.borderColor="var(--accent)"} onBlur={e=>e.target.style.borderColor="var(--border)"}></textarea>
  </div>;
}
function Btn({children,onClick,v="pri",sz="md",full,color,disabled}){
  const bg=disabled?"#6b7280":v==="pri"?(color||"var(--accent)"):v==="ghost"?"transparent":"#ef444418";
  const cl=v==="pri"?"#fff":v==="dan"?"#ef4444":"var(--muted)";
  const pd=sz==="sm"?"6px 13px":sz==="xs"?"3px 9px":"10px 18px";
  return <button onClick={onClick} disabled={disabled} style={{background:bg,color:cl,border:v==="ghost"?"1px solid var(--border)":"none",borderRadius:12,padding:pd,fontSize:sz==="xs"?11:sz==="sm"?12:14,fontWeight:700,cursor:disabled?"not-allowed":"pointer",transition:"all .15s",width:full?"100%":"auto",fontFamily:"inherit",opacity:disabled?.7:1}}>{children}</button>;
}
function Tag({children,color="#7c6fff"}){
  return <span style={{background:color+"20",color,borderRadius:100,padding:"3px 10px",fontSize:11,fontWeight:700,flexShrink:0}}>{children}</span>;
}
function SecHead({icon,title,extra}){
  return <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:2}}>
    <div style={{width:38,height:38,borderRadius:12,background:"var(--accent)22",display:"flex",alignItems:"center",justifyContent:"center",fontSize:19,flexShrink:0}}>{icon}</div>
    <h2 style={{margin:0,fontSize:18,fontWeight:900,letterSpacing:-.4,flex:1,minWidth:0}}>{title}</h2>
    {extra}
  </div>;
}
function SubTabs({tabs,active,onSelect,color}){
  return <div style={{display:"flex",gap:6,overflowX:"auto",scrollbarWidth:"none"}}>{tabs.map((tb,i)=><Pill key={i} label={tb} active={active===i} onClick={()=>onSelect(i)} color={color}/>)}</div>;
}
function Empty({icon="📭",text}){
  return <div style={{textAlign:"center",padding:"28px 16px",opacity:.5}}><div style={{fontSize:38,marginBottom:8}}>{icon}</div><div style={{fontSize:13,fontWeight:600}}>{text}</div></div>;
}
function Bar({data,color="var(--accent)",h=50}){
  const max=Math.max(...data.map(d=>d.v),1);
  return <div style={{display:"flex",alignItems:"flex-end",gap:4,height:h}}>
    {data.map((d,i)=><div key={i} style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",gap:3}}>
      <div style={{width:"100%",background:color,borderRadius:"4px 4px 2px 2px",height:Math.max(3,d.v/max*(h-14)),opacity:.85,transition:"height .4s"}}/>
      <span style={{fontSize:9,color:"var(--muted)",fontWeight:500}}>{d.l}</span>
    </div>)}
  </div>;
}
function Ring({pct=0,color="var(--accent)",size=78,thick=8,label}){
  const r=(size-thick*2)/2,c=2*Math.PI*r,dash=Math.min(pct/100,1)*c;
  return <div style={{display:"flex",flexDirection:"column",alignItems:"center",gap:4}}>
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{overflow:"visible"}}>
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="rgba(128,128,128,0.12)" strokeWidth={thick}/>
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth={thick} strokeDasharray={`${dash} ${c}`} strokeLinecap="round" transform={`rotate(-90 ${size/2} ${size/2})`} style={{transition:"stroke-dasharray .5s",filter:`drop-shadow(0 0 4px ${color}55)`}}/>
      <text x={size/2} y={size/2} textAnchor="middle" dominantBaseline="middle" fontSize={size>70?14:11} fontWeight="800" fill={color}>{pct}%</text>
    </svg>
    {label&&<div style={{fontSize:10,color:"var(--muted)",fontWeight:600}}>{label}</div>}
  </div>;
}

// ── ONBOARDING ────────────────────────────────────────────────────────────────
function Onboarding({onDone,lang}){
  const [step,setStep]=useState(0);
  const [name,sN]=useState("");const [height,sH]=useState("170");const [budget,sB]=useState("");const [pin,sP]=useState("");
  const iS={background:"rgba(255,255,255,.07)",border:"1.5px solid rgba(255,255,255,.14)",borderRadius:14,padding:"13px 16px",color:"#fff",fontSize:15,outline:"none",width:"100%",boxSizing:"border-box"};
  
  // লজিক: গুগল লগইন হ্যান্ডলার
  const handleGoogleLogin = () => {
    signInWithPopup(auth, googleProvider)
      .then((result) => {
        sN(result.user.displayName || "");
        setStep(1); // লগইন হলে নিজে থেকেই পরের ধাপে চলে যাবে
      })
      .catch((error) => console.error("Login failed", error));
  };

  const STEPS=[
    {icon:"🌅",title:lang==="bn"?"DailyRise-এ স্বাগতম":"Welcome to DailyRise",sub:lang==="bn"?"প্রতিদিন উন্নত হওয়ার সঙ্গী":"Your daily growth companion"},
    {icon:"⚖️",title:lang==="bn"?"শারীরিক তথ্য":"Body Info",sub:lang==="bn"?"স্বাস্থ্য ট্র্যাক করতে সাহায্য করবে":"Helps track your health"},
    {icon:"🔒",title:lang==="bn"?"নিরাপত্তা":"Security",sub:lang==="bn"?"PIN দিলে App লক হবে (ঐচ্ছিক)":"Optional PIN lock for privacy"},
  ];
  const cur=STEPS[step];const isLast=step===STEPS.length-1;
  const body=step===0?(<div style={{display:"flex",flexDirection:"column",gap:12}}>
    <div style={{display:"flex",flexDirection:"column",gap:6}}>
      <span style={{fontSize:11,fontWeight:700,color:"rgba(255,255,255,.5)",textTransform:"uppercase",letterSpacing:".08em"}}>{lang==="bn"?"তোমার নাম":"Your Name"}</span>
      <input value={name} onChange={e=>sN(e.target.value)} placeholder={lang==="bn"?"যেমন: রাফিক":"e.g. Rafiq"} style={iS}/>
    </div>
    <div style={{display:"flex",alignItems:"center",gap:10,margin:"4px 0"}}>
      <div style={{flex:1,height:1,background:"rgba(255,255,255,0.1)"}}/>
      <span style={{fontSize:11,color:"rgba(255,255,255,0.5)"}}>{lang==="bn"?"অথবা":"OR"}</span>
      <div style={{flex:1,height:1,background:"rgba(255,255,255,0.1)"}}/>
    </div>
    <button onClick={handleGoogleLogin} style={{padding:"11px",borderRadius:12,background:"#fff",color:"#000",border:"none",fontSize:13,fontWeight:700,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",gap:8,boxShadow:"0 4px 12px rgba(0,0,0,0.1)"}}>
      <svg width="16" height="16" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
      {lang==="bn"?"Google-এর সাহায্যে চালিয়ে যান":"Continue with Google"}
    </button>
  </div>)
  :step===1?(<div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}><div style={{display:"flex",flexDirection:"column",gap:6}}><span style={{fontSize:11,fontWeight:700,color:"rgba(255,255,255,.5)",textTransform:"uppercase"}}>{lang==="bn"?"উচ্চতা (সেমি)":"Height (cm)"}</span><input value={height} onChange={e=>sH(e.target.value)} type="number" style={iS}/></div><div style={{display:"flex",flexDirection:"column",gap:6}}><span style={{fontSize:11,fontWeight:700,color:"rgba(255,255,255,.5)",textTransform:"uppercase"}}>{lang==="bn"?"মাসিক বাজেট (৳)":"Monthly Budget"}</span><input value={budget} onChange={e=>sB(e.target.value)} type="number" style={iS}/></div></div>)
  :(<div style={{display:"flex",flexDirection:"column",gap:6}}><span style={{fontSize:11,fontWeight:700,color:"rgba(255,255,255,.5)",textTransform:"uppercase"}}>{"🔒 PIN"}</span><input value={pin} onChange={e=>sP(e.target.value.slice(0,4))} type="password" inputMode="numeric" placeholder="4-digit PIN" style={iS}/><p style={{fontSize:12,color:"rgba(255,255,255,.35)",margin:0,lineHeight:1.5}}>{lang==="bn"?"PIN না দিলে এই ধাপ বাদ দিতে পারো":"Skip if you don't want a PIN"}</p></div>);
  return <div style={{minHeight:"100vh",background:"linear-gradient(160deg,#0d0b1e 0%,#1a1040 45%,#0d1a2e 100%)",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:"20px 16px",position:"relative",overflow:"hidden"}}>
    <div style={{position:"absolute",top:-100,right:-80,width:300,height:300,borderRadius:"50%",background:"radial-gradient(circle,rgba(124,111,255,0.2) 0%,transparent 70%)",pointerEvents:"none"}}/>
    <div style={{position:"absolute",bottom:-80,left:-60,width:250,height:250,borderRadius:"50%",background:"radial-gradient(circle,rgba(167,139,250,0.13) 0%,transparent 70%)",pointerEvents:"none"}}/>
    <div style={{width:"100%",maxWidth:400}}>
      <div style={{display:"flex",justifyContent:"center",gap:8,marginBottom:30}}>
        {STEPS.map((_,i)=><div key={i} style={{width:i===step?28:8,height:8,borderRadius:100,background:i<=step?"#7c6fff":"rgba(255,255,255,.13)",transition:"all .35s"}}/>)}
      </div>
      <div style={{background:"rgba(255,255,255,.04)",border:"1px solid rgba(255,255,255,.09)",borderRadius:28,padding:"28px 22px",backdropFilter:"blur(40px)",WebkitBackdropFilter:"blur(40px)"}}>
        <div style={{textAlign:"center",marginBottom:22}}>
          <div style={{width:70,height:70,borderRadius:22,background:"linear-gradient(135deg,rgba(124,111,255,.25),rgba(167,139,250,.15))",border:"1px solid rgba(124,111,255,.3)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:30,margin:"0 auto 12px"}}>{cur.icon}</div>
          <div style={{fontSize:21,fontWeight:900,color:"#fff",letterSpacing:-.4,marginBottom:5}}>{cur.title}</div>
          <div style={{fontSize:12,color:"rgba(255,255,255,.4)",lineHeight:1.5}}>{cur.sub}</div>
        </div>
        <div style={{marginBottom:20}}>{body}</div>
        <div style={{display:"flex",gap:10}}>
          {step>0&&<button onClick={()=>setStep(s=>s-1)} style={{flex:1,padding:"13px",borderRadius:14,background:"rgba(255,255,255,.06)",border:"1px solid rgba(255,255,255,.1)",color:"rgba(255,255,255,.65)",fontSize:14,fontWeight:700,cursor:"pointer"}}>←</button>}
          <button onClick={()=>{if(isLast)onDone({userName:name.trim()||"User",height:Number(height)||170,monthBudget:Number(budget)||0,pin});else setStep(s=>s+1);}} style={{flex:2,padding:"13px",borderRadius:14,background:"linear-gradient(135deg,#6d5fff,#a78bfa)",border:"none",color:"#fff",fontSize:14,fontWeight:800,cursor:"pointer",boxShadow:"0 4px 22px rgba(109,95,255,.45)"}}>
            {isLast?(lang==="bn"?"শুরু করো 🚀":"Let's Go 🚀"):(lang==="bn"?"পরবর্তী →":"Next →")}
          </button>
        </div>
      </div>
      {step===0&&<div style={{marginTop:18,display:"flex",justifyContent:"center",gap:14,flexWrap:"wrap"}}>
        {["🕌 নামাজ","📚 পড়া","💸 খরচ","❤️ স্বাস্থ্য","✅ কাজ","📿 তাসবিহ"].map(f=><span key={f} style={{fontSize:11,color:"rgba(255,255,255,.3)",fontWeight:600}}>{f}</span>)}
      </div>}
    </div>
  </div>;
}

// ── PIN LOCK ──────────────────────────────────────────────────────────────────
function PinLock({correctPin,onUnlock}){
  const [entered,sE]=useState("");const [err,sErr]=useState(false);const [shake,setShake]=useState(false);
  const press=n=>{
    const next=entered+n;
    if(next.length===4){
      if(next===correctPin){onUnlock();}
      else{sErr(true);setShake(true);setTimeout(()=>{sE("");sErr(false);setShake(false);},700);}
    } else sE(next);
  };
  return <div style={{minHeight:"100vh",background:"linear-gradient(160deg,#0d0b1e 0%,#1a1040 45%,#0d1a2e 100%)",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:0,position:"relative",overflow:"hidden"}}>
    <div style={{position:"absolute",top:-120,right:-100,width:350,height:350,borderRadius:"50%",background:"radial-gradient(circle,rgba(124,111,255,0.18) 0%,transparent 70%)",pointerEvents:"none"}}/>
    <div style={{position:"absolute",bottom:-100,left:-80,width:280,height:280,borderRadius:"50%",background:"radial-gradient(circle,rgba(167,139,250,0.12) 0%,transparent 70%)",pointerEvents:"none"}}/>
    <div style={{display:"flex",flexDirection:"column",alignItems:"center",gap:28}}>
      {/* Logo */}
      <div style={{display:"flex",flexDirection:"column",alignItems:"center",gap:10}}>
        <div style={{width:72,height:72,borderRadius:22,background:"linear-gradient(135deg,#6d5fff,#a78bfa)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:32,boxShadow:"0 8px 32px rgba(109,95,255,.5)"}}>🌅</div>
        <div style={{fontSize:22,fontWeight:900,color:"#fff",letterSpacing:-.5}}>DailyRise</div>
        <div style={{fontSize:12,color:"rgba(255,255,255,.4)"}}>Enter your PIN to continue</div>
      </div>
      {/* Dots */}
      <div style={{display:"flex",gap:14,transform:shake?"translateX(0)":"none",animation:shake?"shake .5s":"none"}}>
        {[0,1,2,3].map(i=><div key={i} style={{width:14,height:14,borderRadius:"50%",background:entered.length>i?(err?"#ef4444":"linear-gradient(135deg,#7c6fff,#a78bfa)"):"rgba(255,255,255,.15)",boxShadow:entered.length>i&&!err?"0 0 10px rgba(124,111,255,.6)":"none",transition:"all .2s"}}/>)}
      </div>
      {err&&<div style={{fontSize:12,color:"#ef4444",fontWeight:600,marginTop:-10}}>Incorrect PIN</div>}
      {/* Keypad */}
      <div style={{background:"rgba(255,255,255,.04)",border:"1px solid rgba(255,255,255,.08)",borderRadius:28,padding:"20px",backdropFilter:"blur(30px)"}}>
        <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:10}}>
          {[1,2,3,4,5,6,7,8,9,"",0,"⌫"].map((n,i)=>{
            const isEmpty=n==="";
            return <button key={i} onClick={()=>{if(n==="⌫")sE(e=>e.slice(0,-1));else if(!isEmpty)press(String(n));}}
              style={{width:70,height:70,borderRadius:18,background:isEmpty?"transparent":n==="⌫"?"rgba(239,68,68,.12)":"rgba(255,255,255,.07)",border:isEmpty?"none":n==="⌫"?"1px solid rgba(239,68,68,.2)":"1px solid rgba(255,255,255,.09)",color:n==="⌫"?"#ef4444":"#fff",fontSize:n==="⌫"?20:22,fontWeight:700,cursor:isEmpty?"default":"pointer",transition:"all .12s",backdropFilter:"blur(10px)"}}>
              {n}
            </button>;
          })}
        </div>
      </div>
    </div>
  </div>;
}

// ── HOME ──────────────────────────────────────────────────────────────────────
function Home({data,t,setData,lang}){
  const todayExp=(data.expenses[TODAY]||[]).reduce((s,e)=>s+Number(e.amount),0);
  const todayTasks=data.tasks.today||[];const done=todayTasks.filter(x=>x.done).length;
  const pct=todayTasks.length?Math.round(done/todayTasks.length*100):0;
  const prayerDone=PRAYERS_EN.filter(p=>(data.prayers[TODAY]||{})[p]).length;
  const water=data.water[TODAY]||0;const wastedMin=(data.wasted[TODAY]||[]).reduce((s,w)=>s+Number(w.min),0);
  const mood=data.mood[TODAY];const sleepH=data.sleep[TODAY]?.hours;
  const readMins=(data.reading?.sessions?.[TODAY]||[]).reduce((s,r)=>s+Number(r.mins),0);
  const exMins=(data.exercise[TODAY]||[]).reduce((s,e)=>s+Number(e.mins),0);
  const streak=(()=>{let s=0;for(let i=0;i<60;i++){const d=new Date();d.setDate(d.getDate()-i);const k=d.toISOString().slice(0,10);const ts=data.tasks.history?.[k]||[];if(ts.length&&ts.every(x=>x.done))s++;else if(i>0)break;}return s;})();
  const challenge=data.weeklyChallenge;const days=data.challengeProgress?.days||0;
  const newAch=ACHIEVEMENTS.filter(a=>a.check(data)&&!(data.unlockedAchievements||[]).includes(a.id));
  useEffect(()=>{if(newAch.length>0)setData(d=>({...d,unlockedAchievements:[...(d.unlockedAchievements||[]),...newAch.map(a=>a.id)]}));});
  const last7=Array.from({length:7},(_,i)=>{const d=new Date();d.setDate(d.getDate()-(6-i));const k=d.toISOString().slice(0,10);const ts=data.tasks.history?.[k]||[];return{l:d.toLocaleDateString("en",{weekday:"short"}).slice(0,2),v:ts.length?Math.round(ts.filter(x=>x.done).length/ts.length*100):0};});
  const now=new Date();const hr=now.getHours();
  const greeting=hr<12?(lang==="bn"?"শুভ সকাল":"Good Morning"):hr<17?(lang==="bn"?"শুভ দুপুর":"Good Afternoon"):(lang==="bn"?"শুভ সন্ধ্যা":"Good Evening");
  const greetIcon=hr<12?"🌤":hr<17?"☀️":"🌙";
  const topCards=[
    {icon:"🕌",label:t.home.prayer,value:`${prayerDone}/5`,pct:Math.round(prayerDone/5*100),color:"#10b981",bg:"linear-gradient(135deg,#10b981,#059669)"},
    {icon:"✅",label:t.home.tasks,value:`${done}/${todayTasks.length}`,pct,color:"#7c6fff",bg:"linear-gradient(135deg,#7c6fff,#5b4fff)"},
    {icon:"💧",label:t.home.water,value:`${water}/8`,pct:Math.round(water/8*100),color:"#06b6d4",bg:"linear-gradient(135deg,#06b6d4,#0284c7)"},
  ];
  const miniCards=[
    {icon:"💸",label:t.home.budget,value:`৳${todayExp}`,color:"#f59e0b"},
    {icon:"📚",label:t.home.reading,value:`${readMins}m`,color:"#8b5cf6"},
    {icon:"🏋️",label:t.home.exercise,value:`${exMins}m`,color:"#f97316"},
    {icon:"⏱️",label:t.home.wasted,value:`${wastedMin}m`,color:"#ef4444"},
    {icon:"🔥",label:t.home.streak,value:`${streak}d`,color:"#f59e0b"},
    {icon:sleepH?"😴":"—",label:t.home.sleep,value:sleepH?`${sleepH}h`:"—",color:"#8b5cf6"},
  ];
  return <div style={{display:"flex",flexDirection:"column",gap:13}}>
    {/* Premium Hero */}
    <div style={{background:"linear-gradient(145deg,var(--accentB) 0%,var(--accent) 50%,#a78bfa 100%)",borderRadius:24,padding:"22px 20px",color:"#fff",position:"relative",overflow:"hidden"}}>
      <div style={{position:"absolute",top:-40,right:-40,width:160,height:160,borderRadius:"50%",background:"rgba(255,255,255,0.06)"}}/>
      <div style={{position:"absolute",bottom:-30,left:20,width:100,height:100,borderRadius:"50%",background:"rgba(255,255,255,0.04)"}}/>
      <div style={{position:"absolute",top:16,right:16,fontSize:28,opacity:.7}}>{greetIcon}</div>
      <div style={{position:"relative"}}>
        <div style={{fontSize:11,opacity:.65,fontWeight:700,marginBottom:5,textTransform:"uppercase",letterSpacing:".09em"}}>{new Date().toLocaleDateString(undefined,{weekday:"long",day:"numeric",month:"long"})}</div>
        <div style={{fontSize:23,fontWeight:900,letterSpacing:-.5,marginBottom:3,lineHeight:1.2}}>{greeting} {mood?MOOD_META[mood]?.e:"✨"}</div>
        <div style={{fontSize:12,opacity:.7,marginBottom:16}}>{streak>0?`🔥 ${streak}-day streak — keep going!`:lang==="bn"?"আজকেই শুরু করো!":"Start your streak today!"}</div>
        {/* Progress bar row */}
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:8}}>
          {topCards.map((c,i)=><div key={i} style={{background:"rgba(255,255,255,.1)",borderRadius:14,padding:"10px 10px 8px"}}>
            <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:5}}>
              <span style={{fontSize:13}}>{c.icon}</span>
              <span style={{fontSize:12,fontWeight:800}}>{c.value}</span>
            </div>
            <div style={{background:"rgba(255,255,255,.15)",borderRadius:100,height:4}}><div style={{height:"100%",borderRadius:100,width:Math.min(100,c.pct)+"%",background:"rgba(255,255,255,.85)",transition:"width .5s"}}/></div>
            <div style={{fontSize:8,opacity:.65,fontWeight:700,marginTop:4,textTransform:"uppercase"}}>{c.label}</div>
          </div>)}
        </div>
      </div>
    </div>

    {/* Achievement popup */}
    {newAch.length>0&&<div style={{background:"linear-gradient(135deg,#f59e0b,#f97316)",borderRadius:18,padding:"12px 16px",display:"flex",alignItems:"center",gap:10}}>
      <div style={{fontSize:22}}>🏅</div>
      <div style={{flex:1,minWidth:0}}><div style={{fontWeight:800,color:"#fff",fontSize:13}}>Achievement Unlocked!</div><div style={{fontSize:11,color:"rgba(255,255,255,.8)"}}>{newAch.map(a=>a.icon+" "+(lang==="bn"?a.bn:a.en)).join(", ")}</div></div>
    </div>}

    {/* Weekly challenge */}
    {challenge&&<Card style={{borderLeft:"3px solid #7c6fff",padding:"12px 14px"}}>
      <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:7}}>
        <div style={{fontSize:16}}>🎯</div>
        <div style={{flex:1,minWidth:0}}>
          <div style={{fontSize:10,fontWeight:700,color:"var(--muted)",textTransform:"uppercase",letterSpacing:".06em"}}>{t.home.challenge}</div>
          <div style={{fontSize:13,fontWeight:700,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{lang==="bn"?challenge.bn:challenge.en}</div>
        </div>
        <div style={{fontSize:12,fontWeight:800,color:"#7c6fff"}}>{days}/7</div>
      </div>
      <div style={{background:"var(--border)",borderRadius:100,height:5}}><div style={{height:"100%",borderRadius:100,width:Math.min(100,days/7*100)+"%",background:"#7c6fff",transition:"width .4s",boxShadow:"0 0 8px rgba(124,111,255,.4)"}}/></div>
    </Card>}

    {/* Mini stat grid */}
    <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:8}}>
      {miniCards.map((c,i)=><Card key={i} style={{padding:"11px 8px",textAlign:"center"}}>
        <div style={{fontSize:18,marginBottom:3}}>{c.icon}</div>
        <div style={{fontSize:13,fontWeight:800,color:c.color,letterSpacing:-.2}}>{c.value}</div>
        <div style={{fontSize:8,color:"var(--muted)",fontWeight:700,marginTop:1,textTransform:"uppercase"}}>{c.label}</div>
      </Card>)}
    </div>

    {/* Chart + Ring */}
    <div style={{display:"grid",gridTemplateColumns:"1.4fr 1fr",gap:11}}>
      <Card glow>
        <div style={{fontSize:9,fontWeight:700,color:"var(--muted)",textTransform:"uppercase",letterSpacing:".07em",marginBottom:9}}>7-Day Completion</div>
        <Bar data={last7} color="var(--accent)"/>
      </Card>
      <Card style={{display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:6}}>
        <Ring pct={pct} color="var(--accent)" size={72}/>
        <div style={{fontSize:9,color:"var(--muted)",fontWeight:700,textTransform:"uppercase"}}>{t.home.tasks}</div>
      </Card>
    </div>

    {/* Mood + Sleep row */}
    {(mood||sleepH)&&<div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:11}}>
      {mood&&<Card style={{textAlign:"center",padding:"14px 8px",borderTop:`3px solid ${MOOD_META[mood]?.c}`}}>
        <div style={{fontSize:30,marginBottom:4}}>{MOOD_META[mood]?.e}</div>
        <div style={{fontSize:12,fontWeight:700,color:MOOD_META[mood]?.c}}>{t.moods[mood]?.split(" ")[0]}</div>
        <div style={{fontSize:9,color:"var(--muted)",fontWeight:600,marginTop:2,textTransform:"uppercase"}}>{t.home.mood}</div>
      </Card>}
      {sleepH&&<Card style={{textAlign:"center",padding:"14px 8px",borderTop:"3px solid #8b5cf6"}}>
        <div style={{fontSize:28,marginBottom:4}}>😴</div>
        <div style={{fontSize:18,fontWeight:900,color:"#8b5cf6"}}>{sleepH}h</div>
        <div style={{fontSize:9,color:"var(--muted)",fontWeight:600,marginTop:2,textTransform:"uppercase"}}>{t.home.sleep}</div>
      </Card>}
    </div>}
  </div>;
}

// ── EXPENSE ───────────────────────────────────────────────────────────────────
function Expense({data,setData,t}){
  const [amt,sA]=useState("");const [cat,sC]=useState("");const [budget,sB]=useState(data.monthBudget||"");
  const list=data.expenses[TODAY]||[];const total=list.reduce((s,e)=>s+Number(e.amount),0);
  const monthSpent=Object.entries(data.expenses).filter(([k])=>k.startsWith(THIS_MONTH)).reduce((s,[,arr])=>s+arr.reduce((a,e)=>a+Number(e.amount),0),0);
  const bPct=data.monthBudget?Math.min(100,Math.round(monthSpent/data.monthBudget*100)):0;
  const add=()=>{if(!amt||!cat)return;setData(d=>({...d,expenses:{...d.expenses,[TODAY]:[...list,{id:Date.now(),amount:Number(amt),cat,time:new Date().toLocaleTimeString("en",{hour:"2-digit",minute:"2-digit"})}]}}));sA("");sC("");};
  const del=id=>setData(d=>({...d,expenses:{...d.expenses,[TODAY]:list.filter(e=>e.id!==id)}}));
  const CC=["#7c6fff","#f59e0b","#10b981","#ef4444","#06b6d4","#f97316","#8b5cf6"];
  const catT=list.reduce((a,e)=>{a[e.cat]=(a[e.cat]||0)+Number(e.amount);return a;},{});
  return <div style={{display:"flex",flexDirection:"column",gap:11}}>
    <SecHead icon="💸" title={t.expense.title}/>
    <Card style={{textAlign:"center",background:"linear-gradient(135deg,#f97316,#f59e0b)",padding:"14px"}}><div style={{fontSize:10,fontWeight:700,color:"rgba(255,255,255,.75)",textTransform:"uppercase"}}>{t.expense.total}</div><div style={{fontSize:32,fontWeight:900,color:"#fff",letterSpacing:-1}}>৳{total.toLocaleString()}</div></Card>
    <Card><div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:9,marginBottom:9}}><FInp label={t.expense.amount} type="number" value={amt} onChange={e=>sA(e.target.value)} placeholder="0"/><FInp label={t.expense.category} value={cat} onChange={e=>sC(e.target.value)} placeholder="Food..."/></div><div style={{display:"flex",flexWrap:"wrap",gap:5,marginBottom:9}}>{CAT_PRE.map(c=><Pill key={c} label={c} active={cat===c} onClick={()=>sC(c)} color="#f59e0b"/>)}</div><Btn onClick={add} full>+ {t.expense.add}</Btn></Card>
    <Card><div style={{fontSize:10,fontWeight:700,color:"var(--muted)",textTransform:"uppercase",marginBottom:7}}>{t.expense.monthBudget}</div><div style={{display:"flex",gap:7,marginBottom:7}}><input value={budget} onChange={e=>sB(e.target.value)} type="number" placeholder="৳ 5000" style={{...S.inp}} onFocus={e=>e.target.style.borderColor="var(--accent)"} onBlur={e=>e.target.style.borderColor="var(--border)"}/><Btn onClick={()=>setData(d=>({...d,monthBudget:Number(budget)}))} sz="sm">✓</Btn></div>{data.monthBudget>0&&<><div style={{display:"flex",justifyContent:"space-between",fontSize:11,color:"var(--muted)",marginBottom:5}}><span>{t.expense.spent}: ৳{monthSpent}</span><span>{t.expense.remaining}: ৳{Math.max(0,data.monthBudget-monthSpent)}</span></div><div style={{background:"var(--border)",borderRadius:100,height:7}}><div style={{height:"100%",borderRadius:100,width:bPct+"%",background:bPct>85?"#ef4444":bPct>60?"#f59e0b":"#10b981",transition:"width .5s"}}/></div><div style={{textAlign:"right",fontSize:10,color:"var(--muted)",marginTop:2}}>{bPct}%</div></>}</Card>
    {Object.keys(catT).length>0&&<Card><Bar data={Object.entries(catT).map(([l,v])=>({l:l.split(" ").pop().slice(0,5),v}))} color="#f59e0b"/></Card>}
    {list.length===0&&<Empty icon="💸" text={t.emptyState}/>}
    {list.map((e,i)=><Card key={e.id} style={{display:"flex",alignItems:"center",gap:11}}><div style={{width:36,height:36,borderRadius:11,background:CC[i%CC.length]+"22",display:"flex",alignItems:"center",justifyContent:"center",fontSize:16,flexShrink:0}}>{e.cat.split(" ")[0]||"💰"}</div><div style={{flex:1,minWidth:0}}><div style={{fontWeight:700,fontSize:13,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{e.cat}</div><div style={{fontSize:10,color:"var(--muted)"}}>{e.time}</div></div><div style={{fontWeight:800,fontSize:14,color:"#f59e0b",flexShrink:0}}>৳{Number(e.amount).toLocaleString()}</div><Btn onClick={()=>del(e.id)} v="dan" sz="xs">✕</Btn></Card>)}
  </div>;
}

// ── READING ───────────────────────────────────────────────────────────────────
function Reading({data,setData,t}){
  const rt=t.reading;const [sub,setSub]=useState(0);
  const [book,sBook]=useState("");const [author,sAuthor]=useState("");const [genre,sGenre]=useState("");const [mins,sMins]=useState("");const [pages,sPages]=useState("");const [totPages,sTotPages]=useState("");const [note,sNote]=useState("");const [rating,sRating]=useState(0);
  const [surah,sSurah]=useState("");const [qMins,sQMins]=useState("");const [nTitle,sNTitle]=useState("");const [nBody,sNBody]=useState("");const [plan,sPlan]=useState(data.readPlan||"");
  const sessions=data.reading?.sessions?.[TODAY]||[];const quranList=data.reading?.quran?.[TODAY]||[];const notes=data.reading?.notes||[];
  const totalMins=sessions.reduce((s,r)=>s+Number(r.mins),0);const totalPgs=sessions.reduce((s,r)=>s+Number(r.pages||0),0);const avgR=sessions.length?Math.round(sessions.reduce((s,r)=>s+Number(r.rating||0),0)/sessions.length*10)/10:0;
  const addSess=()=>{if(!book||!mins)return;setData(d=>({...d,reading:{...(d.reading||{}),sessions:{...(d.reading?.sessions||{}),[TODAY]:[...sessions,{id:Date.now(),book,author,genre,mins:Number(mins),pages:Number(pages||0),totPages:Number(totPages||0),note,rating}]}}}));sBook("");sAuthor("");sGenre("");sMins("");sPages("");sTotPages("");sNote("");sRating(0);};
  const delSess=id=>setData(d=>({...d,reading:{...d.reading,sessions:{...d.reading.sessions,[TODAY]:sessions.filter(s=>s.id!==id)}}}));
  const addQ=()=>{if(!surah||!qMins)return;setData(d=>({...d,reading:{...d.reading,quran:{...(d.reading?.quran||{}),[TODAY]:[...quranList,{id:Date.now(),surah,mins:Number(qMins)}]}}}));sSurah("");sQMins("");};
  const delQ=id=>setData(d=>({...d,reading:{...d.reading,quran:{...d.reading.quran,[TODAY]:quranList.filter(q=>q.id!==id)}}}));
  const addNote=()=>{if(!nTitle&&!nBody)return;setData(d=>({...d,reading:{...d.reading,notes:[...(d.reading?.notes||[]),{id:Date.now(),title:nTitle,body:nBody,date:TODAY}]}}));sNTitle("");sNBody("");};
  const delNote=id=>setData(d=>({...d,reading:{...d.reading,notes:(d.reading?.notes||[]).filter(n=>n.id!==id)}}));
  const last7=Array.from({length:7},(_,i)=>{const d=new Date();d.setDate(d.getDate()-(6-i));const k=d.toISOString().slice(0,10);return{l:d.toLocaleDateString("en",{weekday:"short"}).slice(0,2),v:(data.reading?.sessions?.[k]||[]).reduce((s,r)=>s+r.mins,0)};});
  return <div style={{display:"flex",flexDirection:"column",gap:11}}>
    <SecHead icon="📚" title={rt.title}/>
    <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:7}}>{[{l:rt.stats.sessions,v:sessions.length,c:"#7c6fff"},{l:rt.stats.pages,v:totalPgs,c:"#10b981"},{l:rt.stats.mins,v:totalMins,c:"#f59e0b"},{l:rt.stats.avgRating,v:avgR||"—",c:"#f97316"}].map((s,i)=><Card key={i} style={{padding:"9px 5px",textAlign:"center"}}><div style={{fontSize:13,fontWeight:800,color:s.c}}>{s.v}</div><div style={{fontSize:8,color:"var(--muted)",fontWeight:600}}>{s.l}</div></Card>)}</div>
    <SubTabs tabs={rt.tabs} active={sub} onSelect={setSub} color="#7c6fff"/>
    {sub===0&&<>
      <Card><div style={{display:"flex",flexDirection:"column",gap:9}}>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:9}}><FInp label={rt.book} value={book} onChange={e=>sBook(e.target.value)} placeholder="Book title..."/><FInp label={rt.author} value={author} onChange={e=>sAuthor(e.target.value)} placeholder="Author..."/></div>
        <div style={{display:"flex",flexWrap:"wrap",gap:5}}>{rt.genres.map(g=><Pill key={g} label={g} active={genre===g} onClick={()=>sGenre(g)} color="#7c6fff"/>)}</div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:9}}><FInp label={rt.mins} type="number" value={mins} onChange={e=>sMins(e.target.value)} placeholder="30"/><FInp label={rt.pages} type="number" value={pages} onChange={e=>sPages(e.target.value)} placeholder="20"/><FInp label={rt.totalPages} type="number" value={totPages} onChange={e=>sTotPages(e.target.value)} placeholder="300"/></div>
        <FTA label={rt.note} value={note} onChange={e=>sNote(e.target.value)} placeholder="Key takeaway..."/>
        <div><span style={{fontSize:10,fontWeight:700,color:"var(--muted)",textTransform:"uppercase"}}>{rt.rating}</span><div style={{display:"flex",gap:5,marginTop:4}}>{[1,2,3,4,5].map(n=><button key={n} onClick={()=>sRating(n)} style={{fontSize:19,background:"none",border:"none",cursor:"pointer",opacity:rating>=n?1:.2,transition:"opacity .15s"}}>⭐</button>)}</div></div>
        <Btn onClick={addSess} full color="#7c6fff">+ {rt.add}</Btn>
      </div></Card>
      <Card><div style={{fontSize:9,fontWeight:700,color:"var(--muted)",textTransform:"uppercase",marginBottom:8}}>{rt.weekChart}</div><Bar data={last7} color="#7c6fff"/></Card>
      <Card><div style={{fontSize:10,fontWeight:700,color:"var(--muted)",textTransform:"uppercase",marginBottom:6}}>📌 {rt.plan_label}</div><div style={{display:"flex",gap:7}}><input value={plan} onChange={e=>sPlan(e.target.value)} placeholder="Tomorrow's book..." style={{...S.inp}} onFocus={e=>e.target.style.borderColor="#7c6fff"} onBlur={e=>e.target.style.borderColor="var(--border)"}/><Btn onClick={()=>setData(d=>({...d,readPlan:plan}))} sz="sm" color="#7c6fff">✓</Btn></div>{data.readPlan&&<div style={{marginTop:6,padding:"6px 10px",background:"#7c6fff18",borderRadius:10,fontSize:12,color:"#7c6fff",fontWeight:600}}>📖 {data.readPlan}</div>}</Card>
      {sessions.length===0&&<Empty icon="📚" text={t.emptyState}/>}
      {sessions.map(s=><Card key={s.id} style={{display:"flex",flexDirection:"column",gap:7}}>
        <div style={{display:"flex",alignItems:"flex-start",gap:10}}>
          <div style={{width:36,height:36,borderRadius:11,background:"#7c6fff22",display:"flex",alignItems:"center",justifyContent:"center",fontSize:16,flexShrink:0}}>📖</div>
          <div style={{flex:1,minWidth:0}}><div style={{fontWeight:700,fontSize:13,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{s.book}</div>{s.author&&<div style={{fontSize:10,color:"var(--muted)"}}>by {s.author}</div>}<div style={{display:"flex",flexWrap:"wrap",gap:3,marginTop:3}}>{s.genre&&<Tag color="#7c6fff">{s.genre.split(" ").slice(1).join(" ")}</Tag>}<Tag color="#f59e0b">{s.mins}m</Tag>{s.pages>0&&<Tag color="#10b981">{s.pages}p</Tag>}{s.rating>0&&<Tag color="#f97316">{"⭐".repeat(s.rating)}</Tag>}</div></div>
          <Btn onClick={()=>delSess(s.id)} v="dan" sz="xs">✕</Btn>
        </div>
        {s.note&&<div style={{fontSize:12,color:"var(--muted)",fontStyle:"italic",padding:"5px 9px",background:"var(--input)",borderRadius:9,lineHeight:1.5}}>💡 {s.note}</div>}
        {s.totPages>0&&<div><div style={{display:"flex",justifyContent:"space-between",fontSize:10,color:"var(--muted)",marginBottom:3}}><span>{rt.progress}</span><span>{s.pages}/{s.totPages} ({Math.round(s.pages/s.totPages*100)}%)</span></div><div style={{background:"var(--border)",borderRadius:100,height:4}}><div style={{height:"100%",borderRadius:100,width:Math.round(s.pages/s.totPages*100)+"%",background:"#7c6fff"}}/></div></div>}
      </Card>)}
    </>}
    {sub===1&&<>
      <Card style={{background:"linear-gradient(135deg,#10b98118,#064e3b)"}}><div style={{textAlign:"center",marginBottom:10}}><div style={{fontSize:24}}>📖</div><div style={{fontWeight:900,fontSize:14,color:"#10b981",marginTop:3}}>Quran Tilawat</div><div style={{fontSize:12,color:"rgba(255,255,255,.5)",marginTop:1}}>{(data.reading?.quran?.[TODAY]||[]).reduce((s,q)=>s+Number(q.mins),0)} min today</div></div><div style={{display:"grid",gridTemplateColumns:"1.5fr 1fr",gap:9,marginBottom:9}}><FInp label={rt.quranSurah} value={surah} onChange={e=>sSurah(e.target.value)} placeholder="Al-Baqarah 1-10"/><FInp label={rt.quranMins} type="number" value={qMins} onChange={e=>sQMins(e.target.value)} placeholder="20"/></div><Btn onClick={addQ} full color="#10b981">+ {rt.addQuran}</Btn></Card>
      {quranList.length===0&&<Empty icon="📖" text={t.emptyState}/>}
      {quranList.map(q=><Card key={q.id} style={{display:"flex",alignItems:"center",gap:11}}><div style={{width:36,height:36,borderRadius:11,background:"#10b98122",display:"flex",alignItems:"center",justifyContent:"center",fontSize:16,flexShrink:0}}>📖</div><div style={{flex:1,minWidth:0,fontWeight:700,fontSize:13,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{q.surah}</div><Tag color="#10b981">{q.mins} min</Tag><Btn onClick={()=>delQ(q.id)} v="dan" sz="xs">✕</Btn></Card>)}
    </>}
    {sub===2&&<>
      <Card><div style={{display:"flex",flexDirection:"column",gap:9}}><FInp label={rt.noteTitle} value={nTitle} onChange={e=>sNTitle(e.target.value)} placeholder="Title..."/><FTA label={rt.noteBody} value={nBody} onChange={e=>sNBody(e.target.value)} placeholder="Notes..."/><Btn onClick={addNote} full color="#7c6fff">+ {rt.addNote}</Btn></div></Card>
      <div style={{fontSize:10,fontWeight:700,color:"var(--muted)",textTransform:"uppercase",letterSpacing:".06em"}}>{rt.allNotes} ({notes.length})</div>
      {notes.length===0&&<Empty icon="📝" text={t.emptyState}/>}
      {notes.slice().reverse().map(n=><Card key={n.id}><div style={{display:"flex",alignItems:"flex-start",gap:10}}><div style={{flex:1,minWidth:0}}><div style={{fontWeight:700,fontSize:13,marginBottom:3}}>{n.title||"Untitled"}</div><div style={{fontSize:12,color:"var(--muted)",lineHeight:1.5}}>{n.body}</div><div style={{fontSize:10,color:"var(--muted)",marginTop:5}}>{n.date}</div></div><Btn onClick={()=>delNote(n.id)} v="dan" sz="xs">✕</Btn></div></Card>)}
    </>}
  </div>;
}

// ── EXERCISE ──────────────────────────────────────────────────────────────────
function Exercise({data,setData,t}){
  const [type,sT]=useState("");const [mins,sM]=useState("");
  const list=data.exercise[TODAY]||[];const total=list.reduce((s,e)=>s+Number(e.mins),0);
  const add=()=>{if(!type||!mins)return;setData(d=>({...d,exercise:{...d.exercise,[TODAY]:[...list,{id:Date.now(),type,mins:Number(mins)}]}}));sT("");sM("");};
  const del=id=>setData(d=>({...d,exercise:{...d.exercise,[TODAY]:list.filter(e=>e.id!==id)}}));
  const last7=Array.from({length:7},(_,i)=>{const d=new Date();d.setDate(d.getDate()-(6-i));const k=d.toISOString().slice(0,10);return{l:d.toLocaleDateString("en",{weekday:"short"}).slice(0,2),v:(data.exercise[k]||[]).reduce((s,e)=>s+e.mins,0)};});
  return <div style={{display:"flex",flexDirection:"column",gap:11}}>
    <SecHead icon="🏋️" title={t.exercise.title}/>
    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:11}}>
      <Card style={{textAlign:"center",background:"linear-gradient(135deg,#f97316,#dc2626)",padding:"13px"}}><div style={{fontSize:10,color:"rgba(255,255,255,.7)",fontWeight:700,textTransform:"uppercase"}}>{t.exercise.total}</div><div style={{fontSize:26,fontWeight:900,color:"#fff"}}>{total}m</div></Card>
      <Card style={{display:"flex",alignItems:"center",justifyContent:"center"}}><Ring pct={Math.min(100,Math.round(total/60*100))} color="#f97316" label="60m goal"/></Card>
    </div>
    <Card><div style={{display:"flex",flexWrap:"wrap",gap:5,marginBottom:9}}>{EX_PRE.map(([ic,n])=><Pill key={n} label={`${ic} ${n}`} active={type===n} onClick={()=>sT(n)} color="#f97316"/>)}</div><div style={{display:"grid",gridTemplateColumns:"1.5fr 1fr",gap:9,marginBottom:9}}><FInp label={t.exercise.type} value={type} onChange={e=>sT(e.target.value)} placeholder="Custom..."/><FInp label={t.exercise.mins} type="number" value={mins} onChange={e=>sM(e.target.value)} placeholder="30"/></div><Btn onClick={add} full color="#f97316">+ {t.exercise.add}</Btn></Card>
    <Card><Bar data={last7} color="#f97316"/></Card>
    {list.length===0&&<Empty icon="🏋️" text={t.emptyState}/>}
    {list.map(e=>{const p=EX_PRE.find(([,n])=>n===e.type);return <Card key={e.id} style={{display:"flex",alignItems:"center",gap:11}}><div style={{width:36,height:36,borderRadius:11,background:"#f9731622",display:"flex",alignItems:"center",justifyContent:"center",fontSize:16,flexShrink:0}}>{p?p[0]:"🏃"}</div><div style={{flex:1,fontWeight:700}}>{e.type}</div><Tag color="#f97316">{e.mins} min</Tag><Btn onClick={()=>del(e.id)} v="dan" sz="xs">✕</Btn></Card>;})}
  </div>;
}

// ── PRAYER ────────────────────────────────────────────────────────────────────
function Prayer({data,setData,t}){
  const pt=t.prayer;const [sub,setSub]=useState(0);const [duaText,sDua]=useState("");
  const todayP=data.prayers[TODAY]||{};const todayOpt=data.optPrayers?.[TODAY]||{};const tb=data.tasbeeh?.[TODAY]||{...INIT_TB};const todayDuas=data.duas?.[TODAY]||[];
  const toggleF=name=>setData(d=>{const cur=d.prayers?.[TODAY]||{};return{...d,prayers:{...d.prayers,[TODAY]:{...cur,[name]:!cur[name]}}};});
  const toggleO=key=>setData(d=>{const cur=d.optPrayers?.[TODAY]||{};return{...d,optPrayers:{...d.optPrayers,[TODAY]:{...cur,[key]:!cur[key]}}};});
  const incT=key=>setData(d=>{const cur=d.tasbeeh?.[TODAY]||{...INIT_TB};return{...d,tasbeeh:{...(d.tasbeeh||{}),[TODAY]:{...cur,[key]:(cur[key]||0)+1}}};});
  const resetT=()=>setData(d=>({...d,tasbeeh:{...(d.tasbeeh||{}),[TODAY]:{...INIT_TB}}}));
  const addDua=()=>{if(!duaText)return;setData(d=>({...d,duas:{...(d.duas||{}),[TODAY]:[...todayDuas,{id:Date.now(),text:duaText}]}}));sDua("");};
  const delDua=id=>setData(d=>({...d,duas:{...d.duas,[TODAY]:todayDuas.filter(x=>x.id!==id)}}));
  const fardhDone=PRAYERS_EN.filter(p=>todayP[p]).length;const optDone=OPT_PRAYERS.filter(o=>todayOpt[o.key]).length;const totalTB=Object.values(tb).reduce((a,b)=>a+b,0);
  const last7=Array.from({length:7},(_,i)=>{const d=new Date();d.setDate(d.getDate()-(6-i));const k=d.toISOString().slice(0,10);const ps=data.prayers[k]||{};return{l:d.toLocaleDateString("en",{weekday:"short"}).slice(0,2),v:PRAYERS_EN.filter(p=>ps[p]).length};});
  return <div style={{display:"flex",flexDirection:"column",gap:11}}>
    <SecHead icon="🕌" title={pt.title}/>
    <Card style={{display:"flex",alignItems:"center",gap:14,background:"linear-gradient(135deg,#10b98122,#064e3b)"}}><Ring pct={Math.round(fardhDone/5*100)} color="#10b981" size={72}/><div><div style={{fontSize:20,fontWeight:900,color:"#fff"}}>{fardhDone}/5 <span style={{fontSize:12,opacity:.65}}>Fardh</span></div><div style={{fontSize:11,color:"rgba(255,255,255,.6)",marginTop:2}}>✨ {optDone} nafl • 📿 {totalTB} tasbeeh</div></div></Card>
    <SubTabs tabs={pt.tabs} active={sub} onSelect={setSub} color="#10b981"/>
    {sub===0&&<>
      {PRAYERS_EN.map((name,i)=>{const isDone=!!todayP[name];return <Card key={name} onClick={()=>toggleF(name)} style={{display:"flex",alignItems:"center",gap:12,cursor:"pointer",border:isDone?"1.5px solid #10b981":"1px solid var(--border)",background:isDone?"#10b98110":"var(--card)"}}><div style={{width:40,height:40,borderRadius:13,background:isDone?"#10b981":"var(--input)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:18,transition:"all .2s",flexShrink:0}}>{isDone?"✅":"⬜"}</div><div style={{flex:1,minWidth:0}}><div style={{fontWeight:700,fontSize:14}}>{pt.names[i]}</div><div style={{fontSize:11,color:"var(--muted)"}}>{pt.times[i]}</div></div><Tag color={isDone?"#10b981":"#9ca3af"}>{isDone?pt.prayed:pt.missed}</Tag></Card>;})}
      <Card><div style={{fontSize:9,fontWeight:700,color:"var(--muted)",textTransform:"uppercase",marginBottom:8}}>{pt.weekChart}</div><Bar data={last7} color="#10b981"/></Card>
    </>}
    {sub===1&&<>
      <div style={{fontSize:11,color:"var(--muted)",padding:"0 2px"}}>Tap to mark as prayed 🤲</div>
      {OPT_PRAYERS.map(({key,color})=>{const isDone=!!todayOpt[key];return <Card key={key} onClick={()=>toggleO(key)} style={{display:"flex",alignItems:"center",gap:12,cursor:"pointer",border:isDone?`1.5px solid ${color}`:"1px solid var(--border)",background:isDone?color+"10":"var(--card)"}}><div style={{width:40,height:40,borderRadius:13,background:isDone?color:"var(--input)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:18,transition:"all .2s",flexShrink:0}}>{isDone?"✅":"⬜"}</div><div style={{flex:1,minWidth:0}}><div style={{fontWeight:700,fontSize:14}}>{pt[key]}</div><div style={{fontSize:11,color:"var(--muted)"}}>{pt[key+"Desc"]}</div></div><Tag color={isDone?color:"#9ca3af"}>{isDone?pt.prayed:pt.missed}</Tag></Card>;})}
    </>}
    {sub===2&&<>
      <Card style={{textAlign:"center",padding:"11px 14px"}}><div style={{fontSize:10,color:"var(--muted)",fontWeight:700,textTransform:"uppercase"}}>{pt.totalTasbeeh}</div><div style={{fontSize:28,fontWeight:900,color:"#7c6fff"}}>{totalTB} 📿</div></Card>
      {TB_KEYS.map((key,i)=>{const count=tb[key]||0;const pct=Math.min(100,Math.round(count/33*100));return <Card key={key}>
        <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:7}}>
          <div style={{flex:1,minWidth:0}}><div style={{fontWeight:800,fontSize:15,color:TB_COLORS[i],direction:"rtl",textAlign:"right",marginBottom:2,lineHeight:1.4}}>{pt[key]}</div><div style={{fontSize:10,color:"var(--muted)"}}>{pt.target}</div></div>
          <div style={{fontSize:20,fontWeight:900,color:TB_COLORS[i],minWidth:36,textAlign:"center"}}>{count}</div>
          <button onClick={()=>incT(key)} style={{width:52,height:52,borderRadius:15,background:TB_COLORS[i],border:"none",color:"#fff",fontSize:24,fontWeight:800,cursor:"pointer",flexShrink:0,boxShadow:`0 3px 12px ${TB_COLORS[i]}55`,transition:"transform .08s"}} onMouseDown={e=>e.currentTarget.style.transform="scale(.88)"} onMouseUp={e=>e.currentTarget.style.transform="scale(1)"} onTouchStart={e=>e.currentTarget.style.transform="scale(.88)"} onTouchEnd={e=>e.currentTarget.style.transform="scale(1)"}>+</button>
        </div>
        <div style={{background:"var(--border)",borderRadius:100,height:4}}><div style={{height:"100%",borderRadius:100,width:pct+"%",background:TB_COLORS[i],transition:"width .3s"}}/></div>
        <div style={{display:"flex",justifyContent:"space-between",fontSize:10,color:"var(--muted)",marginTop:2}}><span>{count}/33</span><span>{pct}%</span></div>
      </Card>;})}
      <Btn onClick={resetT} v="dan" full>{pt.resetAll}</Btn>
    </>}
    {sub===3&&<>
      <Card><FTA value={duaText} onChange={e=>sDua(e.target.value)} placeholder={pt.addDua} style={{minHeight:80}}/><div style={{marginTop:8}}><Btn onClick={addDua} full color="#f59e0b">{pt.saveDua}</Btn></div></Card>
      {todayDuas.length===0&&<Empty icon="🤲" text={t.emptyState}/>}
      {todayDuas.map(d=><Card key={d.id} style={{display:"flex",alignItems:"flex-start",gap:10}}><div style={{fontSize:18,flexShrink:0}}>🤲</div><div style={{flex:1,minWidth:0,fontSize:13,lineHeight:1.5}}>{d.text}</div><Btn onClick={()=>delDua(d.id)} v="dan" sz="xs">✕</Btn></Card>)}
    </>}
  </div>;
}

// ── TASKS ─────────────────────────────────────────────────────────────────────
function Tasks({data,setData,t}){
  const [tab,sTab]=useState("today");const [text,sText]=useState("");const [imp,sImp]=useState(false);const [tmText,sTm]=useState("");
  const today=data.tasks.today||[];const tomorrow=data.tasks.tomorrow||[];const done=today.filter(x=>x.done).length;
  const addT=()=>{if(!text)return;const u=[...today,{id:Date.now(),text,done:false,imp}];setData(d=>({...d,tasks:{...d.tasks,today:u,history:{...(d.tasks.history||{}),[TODAY]:u}}}));sText("");sImp(false);};
  const togT=id=>{const u=today.map(x=>x.id===id?{...x,done:!x.done}:x);setData(d=>({...d,tasks:{...d.tasks,today:u,history:{...(d.tasks.history||{}),[TODAY]:u}}}));};
  const delT=id=>{const u=today.filter(x=>x.id!==id);setData(d=>({...d,tasks:{...d.tasks,today:u,history:{...(d.tasks.history||{}),[TODAY]:u}}}));};
  const addTm=()=>{if(!tmText)return;setData(d=>({...d,tasks:{...d.tasks,tomorrow:[...tomorrow,{id:Date.now(),text:tmText,done:false}]}}));sTm("");};
  const delTm=id=>setData(d=>({...d,tasks:{...d.tasks,tomorrow:tomorrow.filter(x=>x.id!==id)}}));
  return <div style={{display:"flex",flexDirection:"column",gap:11}}>
    <SecHead icon="✅" title={t.tasks.title} extra={<Tag color="var(--accent)">{done}/{today.length}</Tag>}/>
    {today.length>0&&<Card style={{display:"flex",alignItems:"center",gap:14}}><Ring pct={today.length?Math.round(done/today.length*100):0} color="var(--accent)" size={68}/><div><div style={{fontSize:18,fontWeight:900}}>{done}/{today.length}</div><div style={{fontSize:11,color:"var(--muted)"}}>{t.tasks.completion}</div></div></Card>}
    <div style={{display:"flex",gap:6}}><Pill label={t.tasks.today} active={tab==="today"} onClick={()=>sTab("today")}/><Pill label={t.tasks.tomorrow} active={tab==="tomorrow"} onClick={()=>sTab("tomorrow")}/></div>
    {tab==="today"&&<>
      <Card><div style={{display:"flex",gap:7,marginBottom:8}}><input value={text} onChange={e=>sText(e.target.value)} onKeyDown={e=>e.key==="Enter"&&addT()} placeholder={t.tasks.add} style={{...S.inp}} onFocus={e=>e.target.style.borderColor="var(--accent)"} onBlur={e=>e.target.style.borderColor="var(--border)"}/><Btn onClick={addT}>+</Btn></div><label style={{display:"flex",alignItems:"center",gap:7,cursor:"pointer",fontSize:13,color:"var(--muted)"}}><input type="checkbox" checked={imp} onChange={e=>sImp(e.target.checked)} style={{width:15,height:15}}/> ⭐ {t.tasks.important}</label></Card>
      {today.length===0&&<Empty icon="✅" text={t.emptyState}/>}
      {today.sort((a,b)=>b.imp-a.imp).map(task=><Card key={task.id} style={{display:"flex",alignItems:"center",gap:11,opacity:task.done?.7:1}}>
        <button onClick={()=>togT(task.id)} style={{width:22,height:22,borderRadius:7,border:`2px solid ${task.done?"#10b981":"var(--border)"}`,background:task.done?"#10b98122":"transparent",display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer",flexShrink:0,fontSize:11,color:"#10b981"}}>{task.done?"✓":""}</button>
        <div style={{flex:1,minWidth:0,textDecoration:task.done?"line-through":"none",fontWeight:task.imp?700:500,fontSize:14,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{task.imp&&"⭐ "}{task.text}</div>
        <Tag color={task.done?"#10b981":"#9ca3af"}>{task.done?t.tasks.done:t.tasks.pending}</Tag>
        <Btn onClick={()=>delT(task.id)} v="dan" sz="xs">✕</Btn>
      </Card>)}
    </>}
    {tab==="tomorrow"&&<>
      <Card><div style={{display:"flex",gap:7}}><input value={tmText} onChange={e=>sTm(e.target.value)} onKeyDown={e=>e.key==="Enter"&&addTm()} placeholder={t.tasks.add} style={{...S.inp}} onFocus={e=>e.target.style.borderColor="var(--accent)"} onBlur={e=>e.target.style.borderColor="var(--border)"}/><Btn onClick={addTm}>+</Btn></div></Card>
      {tomorrow.length===0&&<Empty icon="📌" text={t.emptyState}/>}
      {tomorrow.map(task=><Card key={task.id} style={{display:"flex",alignItems:"center",gap:11}}><div style={{fontSize:16}}>📌</div><div style={{flex:1,minWidth:0,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{task.text}</div><Btn onClick={()=>delTm(task.id)} v="dan" sz="xs">✕</Btn></Card>)}
    </>}
  </div>;
}

// ── HEALTH ────────────────────────────────────────────────────────────────────
function Health({data,setData,t}){
  const [wt,sWt]=useState("");const [dt,sDt]=useState(TODAY);const [ht,sHt]=useState(data.height||"");
  const [slp,sSlp]=useState("");const [wMin,sWMin]=useState("");const [wR,sWR]=useState("");const [mood,sMood]=useState(data.mood[TODAY]||"");
  const water=data.water[TODAY]||0;
  const addW=delta=>{const n=Math.max(0,(data.water[TODAY]||0)+delta);setData(d=>({...d,water:{...d.water,[TODAY]:n}}));};
  const addSlp=()=>{if(!slp)return;setData(d=>({...d,sleep:{...d.sleep,[TODAY]:{hours:Number(slp)}}}));sSlp("");};
  const addWasted=()=>{if(!wMin)return;setData(d=>({...d,wasted:{...d.wasted,[TODAY]:[...(d.wasted[TODAY]||[]),{id:Date.now(),min:Number(wMin),reason:wR}]}}));sWMin("");sWR("");};
  const setMoodF=m=>{sMood(m);setData(d=>({...d,mood:{...d.mood,[TODAY]:m}}));};
  const addWt=()=>{if(!wt)return;const u=[...(data.weights||[]).filter(w=>w.date!==dt),{date:dt,weight:Number(wt)}].sort((a,b)=>a.date.localeCompare(b.date));setData(d=>({...d,weights:u}));sWt("");};
  const wastedTotal=(data.wasted[TODAY]||[]).reduce((s,w)=>s+Number(w.min),0);
  const weights=data.weights||[];const latestW=weights[weights.length-1]?.weight;
  const bmi=latestW&&data.height?(latestW/((data.height/100)**2)).toFixed(1):null;
  const bmiC=!bmi?"var(--muted)":bmi<18.5?"#06b6d4":bmi<25?"#10b981":bmi<30?"#f59e0b":"#ef4444";
  const bmiL=!bmi?"":bmi<18.5?"Underweight":bmi<25?"Normal ✅":bmi<30?"Overweight":"Obese ⚠️";
  return <div style={{display:"flex",flexDirection:"column",gap:11}}>
    <SecHead icon="❤️" title={t.health.title}/>
    <Card><div style={{fontSize:10,fontWeight:700,color:"var(--muted)",textTransform:"uppercase",marginBottom:8}}>😊 {t.health.mood}</div><div style={{display:"flex",justifyContent:"space-around"}}>{Object.entries(MOOD_META).map(([k,{c,e}])=><button key={k} onClick={()=>setMoodF(k)} style={{fontSize:26,background:mood===k?c+"22":"transparent",border:`2px solid ${mood===k?c:"transparent"}`,borderRadius:12,padding:5,cursor:"pointer",transition:"all .15s"}}>{e}</button>)}</div>{mood&&<div style={{textAlign:"center",marginTop:7,fontSize:12,fontWeight:700,color:MOOD_META[mood].c}}>{t.moods[mood]}</div>}</Card>
    <Card><div style={{fontSize:10,fontWeight:700,color:"var(--muted)",textTransform:"uppercase",marginBottom:8}}>💧 {t.health.water}</div><div style={{display:"flex",alignItems:"center",gap:11}}><Btn onClick={()=>addW(-1)} v="ghost" sz="sm">−</Btn><div style={{flex:1,textAlign:"center"}}><div style={{fontSize:22,fontWeight:900,color:"#06b6d4"}}>{water}<span style={{fontSize:12,fontWeight:600,opacity:.6}}>/8</span></div><div style={{fontSize:10,color:"var(--muted)"}}>glasses</div></div><Btn onClick={()=>addW(1)} sz="sm" color="#06b6d4">+</Btn></div><div style={{display:"flex",gap:4,marginTop:8}}>{Array.from({length:8},(_,i)=><div key={i} onClick={()=>setData(d=>({...d,water:{...d.water,[TODAY]:i+1}}))} style={{flex:1,height:7,borderRadius:100,background:i<water?"#06b6d4":"var(--input)",transition:"background .2s",cursor:"pointer"}}/>)}</div></Card>
    <Card><div style={{fontSize:10,fontWeight:700,color:"var(--muted)",textTransform:"uppercase",marginBottom:8}}>😴 {t.health.sleep}</div><div style={{display:"flex",gap:7}}><input value={slp} onChange={e=>sSlp(e.target.value)} type="number" step=".5" placeholder="7.5" style={{...S.inp}} onFocus={e=>e.target.style.borderColor="#8b5cf6"} onBlur={e=>e.target.style.borderColor="var(--border)"}/><Btn onClick={addSlp} color="#8b5cf6">Log</Btn></div>{data.sleep[TODAY]&&<div style={{marginTop:7,padding:"6px 10px",background:"#8b5cf620",borderRadius:9,fontSize:12,color:"#8b5cf6",fontWeight:600}}>Last: {data.sleep[TODAY].hours}h 😴</div>}</Card>
    <Card><div style={{fontSize:10,fontWeight:700,color:"var(--muted)",textTransform:"uppercase",marginBottom:8}}>⏱️ {t.health.wasted}</div><div style={{display:"grid",gridTemplateColumns:"1fr 1.5fr",gap:8,marginBottom:8}}><FInp label={t.health.mins} type="number" value={wMin} onChange={e=>sWMin(e.target.value)} placeholder="30"/><FInp label={t.health.reason} value={wR} onChange={e=>sWR(e.target.value)} placeholder="Social media..."/></div><Btn onClick={addWasted} full color="#ef4444">+ Log</Btn>{wastedTotal>0&&<div style={{marginTop:7,padding:"6px 10px",background:"#ef444420",borderRadius:9,fontSize:12,color:"#ef4444",fontWeight:700}}>Total: {wastedTotal} min ⚠️</div>}</Card>
    <Card><div style={{fontSize:10,fontWeight:700,color:"var(--muted)",textTransform:"uppercase",marginBottom:8}}>⚖️ {t.health.weight}</div><div style={{display:"flex",gap:7,marginBottom:8}}><input value={ht} onChange={e=>sHt(e.target.value)} type="number" placeholder={t.health.height} style={{...S.inp}} onFocus={e=>e.target.style.borderColor="var(--accent)"} onBlur={e=>e.target.style.borderColor="var(--border)"}/><Btn onClick={()=>setData(d=>({...d,height:Number(ht)}))} v="ghost" sz="sm">✓</Btn></div><div style={{display:"grid",gridTemplateColumns:"1.2fr 1fr",gap:8,marginBottom:8}}><FInp label={t.health.weight} type="number" value={wt} onChange={e=>sWt(e.target.value)} placeholder="65.5"/><FInp label="Date" type="date" value={dt} onChange={e=>sDt(e.target.value)}/></div><Btn onClick={addWt} full color="#8b5cf6">+ {t.health.addWeight}</Btn>{bmi&&<div style={{marginTop:8,display:"flex",alignItems:"center",justifyContent:"space-between",padding:"8px 12px",background:"var(--input)",borderRadius:11}}><span style={{fontWeight:700}}>{t.health.bmi}: <span style={{color:bmiC,fontSize:16}}>{bmi}</span></span><Tag color={bmiC}>{bmiL}</Tag></div>}</Card>
    {weights.length>1&&<Card><div style={{fontSize:9,fontWeight:700,color:"var(--muted)",textTransform:"uppercase",marginBottom:8}}>📈 {t.health.history}</div><Bar data={weights.slice(-8).map(w=>({l:w.date.slice(5),v:w.weight}))} color="#8b5cf6" h={55}/><div style={{display:"flex",justifyContent:"space-between",marginTop:6,fontSize:11,color:"var(--muted)"}}><span>Start: {weights[0].weight}kg</span><span>Now: {latestW}kg</span><span style={{color:latestW-weights[0].weight>0?"#ef4444":"#10b981"}}>{latestW>weights[0].weight?"+":""}{(latestW-weights[0].weight).toFixed(1)}kg</span></div></Card>}
  </div>;
}

// ── HABITS ────────────────────────────────────────────────────────────────────
function Habits({data,setData,t,lang}){
  const ht=t.habits;const [newName,sName]=useState("");const [newIcon,sIcon]=useState("⭐");
  const habits=data.habits?.defs||DEF_HABITS;const log=data.habits?.log||{};const todayLog=log[TODAY]||{};
  const toggle=id=>setData(d=>{const cur=d.habits?.log?.[TODAY]||{};return{...d,habits:{...d.habits,log:{...(d.habits?.log||{}),[TODAY]:{...cur,[id]:!cur[id]}}}};});
  const addH=()=>{if(!newName)return;setData(d=>({...d,habits:{...d.habits,defs:[...(d.habits?.defs||DEF_HABITS),{id:"h"+Date.now(),en:newName,bn:newName,icon:newIcon}]}}));sName("");sIcon("⭐");};
  const delH=id=>setData(d=>({...d,habits:{...d.habits,defs:(d.habits?.defs||DEF_HABITS).filter(h=>h.id!==id)}}));
  const getStreak=id=>{let s=0;for(let i=0;i<30;i++){const dd=new Date();dd.setDate(dd.getDate()-i);const k=dd.toISOString().slice(0,10);if(log[k]?.[id])s++;else break;}return s;};
  const doneCount=habits.filter(h=>todayLog[h.id]).length;
  const ICONS=["⭐","🌅","🏃","📚","💧","🧘","💪","🥗","🎯","🛌","✍️","🎵","🌿","🙏"];
  return <div style={{display:"flex",flexDirection:"column",gap:11}}>
    <SecHead icon="🌱" title={ht.title} extra={<Tag color="#10b981">{doneCount}/{habits.length}</Tag>}/>
    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:11}}>
      <Card style={{textAlign:"center",background:"linear-gradient(135deg,#10b98133,#064e3b)",padding:"13px"}}><div style={{fontSize:24,fontWeight:900,color:"#10b981"}}>{doneCount}/{habits.length}</div><div style={{fontSize:9,color:"rgba(255,255,255,.7)",fontWeight:600,textTransform:"uppercase"}}>Done</div></Card>
      <Card style={{display:"flex",alignItems:"center",justifyContent:"center"}}><Ring pct={habits.length?Math.round(doneCount/habits.length*100):0} color="#10b981" size={70}/></Card>
    </div>
    {habits.map(h=>{const isDone=!!todayLog[h.id];const streak=getStreak(h.id);return <Card key={h.id} onClick={()=>toggle(h.id)} style={{display:"flex",alignItems:"center",gap:11,cursor:"pointer",border:isDone?"1.5px solid #10b981":"1px solid var(--border)",background:isDone?"#10b98110":"var(--card)"}}>
      <div style={{width:40,height:40,borderRadius:13,background:isDone?"#10b981":"var(--input)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:19,flexShrink:0,transition:"all .2s"}}>{isDone?"✅":h.icon}</div>
      <div style={{flex:1,minWidth:0}}><div style={{fontWeight:700,fontSize:13}}>{lang==="bn"?h.bn:h.en}</div>{streak>0&&<div style={{fontSize:10,color:"#f59e0b"}}>🔥 {streak} {ht.streak}</div>}</div>
      <Tag color={isDone?"#10b981":"#9ca3af"}>{isDone?ht.done:ht.pending}</Tag>
      <Btn onClick={e=>{e.stopPropagation();delH(h.id);}} v="dan" sz="xs">✕</Btn>
    </Card>;})}
    <Card><div style={{fontSize:10,fontWeight:700,color:"var(--muted)",textTransform:"uppercase",marginBottom:8}}>{ht.custom}</div><div style={{display:"flex",flexWrap:"wrap",gap:5,marginBottom:8}}>{ICONS.map(ic=><button key={ic} onClick={()=>sIcon(ic)} style={{fontSize:20,background:newIcon===ic?"var(--accent)22":"transparent",border:newIcon===ic?"2px solid var(--accent)":"2px solid transparent",borderRadius:9,padding:4,cursor:"pointer"}}>{ic}</button>)}</div><div style={{display:"flex",gap:7}}><input value={newName} onChange={e=>sName(e.target.value)} placeholder={ht.habitName+"..."} style={{...S.inp}} onFocus={e=>e.target.style.borderColor="var(--accent)"} onBlur={e=>e.target.style.borderColor="var(--border)"}/><Btn onClick={addH} color="#10b981">+</Btn></div></Card>
  </div>;
}

// ── JOURNAL ───────────────────────────────────────────────────────────────────
function Journal({data,setData,t}){
  const jt=t.journal;const existing=data.journal?.[TODAY]||{learned:"",grateful:"",improve:""};
  const [learned,sL]=useState(existing.learned);const [grateful,sG]=useState(existing.grateful);const [improve,sI]=useState(existing.improve);
  const save=()=>setData(d=>({...d,journal:{...(d.journal||{}),[TODAY]:{learned,grateful,improve,saved:new Date().toLocaleTimeString("en",{hour:"2-digit",minute:"2-digit"})}}}));
  const entries=Object.entries(data.journal||{}).sort((a,b)=>b[0].localeCompare(a[0])).slice(0,10);
  const saved=data.journal?.[TODAY]?.saved;
  return <div style={{display:"flex",flexDirection:"column",gap:11}}>
    <SecHead icon="📓" title={jt.title}/>
    <Card style={{background:"linear-gradient(135deg,#8b5cf622,#4c1d95)"}}><div style={{fontWeight:700,fontSize:13,marginBottom:10}}>✍️ {jt.today}</div><div style={{display:"flex",flexDirection:"column",gap:9}}><FTA label={"💡 "+jt.learned} value={learned} onChange={e=>sL(e.target.value)} placeholder="I learned..."/><FTA label={"🙏 "+jt.grateful} value={grateful} onChange={e=>sG(e.target.value)} placeholder="I'm grateful for..."/><FTA label={"📈 "+jt.improve} value={improve} onChange={e=>sI(e.target.value)} placeholder="I want to improve..."/></div><div style={{marginTop:9,display:"flex",alignItems:"center",gap:9}}><Btn onClick={save} full color="#8b5cf6">{jt.save}</Btn>{saved&&<span style={{fontSize:11,color:"#10b981",fontWeight:600}}>✓ {saved}</span>}</div></Card>
    <div style={{fontSize:10,fontWeight:700,color:"var(--muted)",textTransform:"uppercase",letterSpacing:".06em",marginTop:4}}>{jt.past}</div>
    {entries.filter(([k])=>k!==TODAY).length===0&&<Empty icon="📓" text={t.emptyState}/>}
    {entries.filter(([k])=>k!==TODAY).map(([date,entry])=><Card key={date} style={{borderLeft:"3px solid #8b5cf6"}}><div style={{fontSize:11,color:"var(--muted)",fontWeight:600,marginBottom:7}}>{date}</div>{entry.learned&&<div style={{fontSize:12,marginBottom:3}}><span style={{color:"#7c6fff",fontWeight:700}}>💡 </span>{entry.learned}</div>}{entry.grateful&&<div style={{fontSize:12,marginBottom:3}}><span style={{color:"#10b981",fontWeight:700}}>🙏 </span>{entry.grateful}</div>}{entry.improve&&<div style={{fontSize:12}}><span style={{color:"#f59e0b",fontWeight:700}}>📈 </span>{entry.improve}</div>}</Card>)}
  </div>;
}

// ── TIMELINE ──────────────────────────────────────────────────────────────────
function Timeline({data,t}){
  const events=[];
  (data.expenses[TODAY]||[]).forEach(e=>events.push({icon:"💸",label:`৳${e.amount} — ${e.cat}`,color:"#f59e0b",time:e.time||""}));
  (data.reading?.sessions?.[TODAY]||[]).forEach(r=>events.push({icon:"📚",label:`${r.book} — ${r.mins}min`,color:"#7c6fff",time:""}));
  (data.exercise[TODAY]||[]).forEach(e=>events.push({icon:"🏋️",label:`${e.type} — ${e.mins}min`,color:"#f97316",time:""}));
  (data.reading?.quran?.[TODAY]||[]).forEach(q=>events.push({icon:"📖",label:`Quran: ${q.surah} — ${q.mins}min`,color:"#10b981",time:""}));
  (data.wasted[TODAY]||[]).forEach(w=>events.push({icon:"⏱️",label:`Wasted: ${w.reason||"—"} ${w.min}min`,color:"#ef4444",time:""}));
  PRAYERS_EN.forEach(p=>{if((data.prayers[TODAY]||{})[p])events.push({icon:"🕌",label:`${p} ✅`,color:"#10b981",time:""});});
  if(data.sleep[TODAY])events.push({icon:"😴",label:`Sleep: ${data.sleep[TODAY].hours}h`,color:"#8b5cf6",time:""});
  if(data.mood[TODAY])events.push({icon:MOOD_META[data.mood[TODAY]]?.e||"😊",label:`Mood: ${t.moods[data.mood[TODAY]]?.split(" ")[0]||""}`,color:MOOD_META[data.mood[TODAY]]?.c||"#7c6fff",time:""});
  return <div style={{display:"flex",flexDirection:"column",gap:11}}>
    <SecHead icon="⏰" title={t.timeline.title}/>
    {events.length===0?<Empty icon="🌙" text={t.timeline.empty}/>:
    <div style={{position:"relative",paddingLeft:26}}>
      <div style={{position:"absolute",left:10,top:0,bottom:0,width:2,background:"var(--border)",borderRadius:2}}/>
      {events.map((ev,i)=><div key={i} style={{position:"relative",marginBottom:11}}>
        <div style={{position:"absolute",left:-21,top:5,width:13,height:13,borderRadius:"50%",background:ev.color,boxShadow:`0 0 7px ${ev.color}55`}}/>
        <Card style={{padding:"9px 13px"}}><div style={{display:"flex",alignItems:"center",gap:8}}><span style={{fontSize:15}}>{ev.icon}</span><div style={{flex:1,minWidth:0}}><div style={{fontSize:13,fontWeight:600,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{ev.label}</div>{ev.time&&<div style={{fontSize:10,color:"var(--muted)"}}>{ev.time}</div>}</div><div style={{width:5,height:5,borderRadius:"50%",background:ev.color,flexShrink:0}}/></div></Card>
      </div>)}
    </div>}
  </div>;
}

// ── STATS ─────────────────────────────────────────────────────────────────────
function Stats({data,t,lang}){
  const st=t.stats;const [aiText,sAI]=useState("");const [loading,sLoad]=useState(false);
  const monthSpent=Object.entries(data.expenses).filter(([k])=>k.startsWith(THIS_MONTH)).reduce((s,[,arr])=>s+arr.reduce((a,e)=>a+Number(e.amount),0),0);
  const last30=Array.from({length:30},(_,i)=>{const d=new Date();d.setDate(d.getDate()-(29-i));return d.toISOString().slice(0,10);});
  const bestStreak=(()=>{let best=0,cur=0;last30.forEach(k=>{const ts=data.tasks.history?.[k]||[];if(ts.length&&ts.every(x=>x.done))cur++;else cur=0;if(cur>best)best=cur;});return best;})();
  const avgTaskRate=Math.round(last30.filter(k=>{const ts=data.tasks.history?.[k]||[];return ts.length&&ts.every(x=>x.done);}).length/30*100);
  const avgPrayerRate=Math.round(last30.filter(k=>PRAYERS_EN.filter(p=>(data.prayers[k]||{})[p]).length===5).length/30*100);
  const last7Exp=Array.from({length:7},(_,i)=>{const d=new Date();d.setDate(d.getDate()-(6-i));const k=d.toISOString().slice(0,10);return{l:d.toLocaleDateString("en",{weekday:"short"}).slice(0,2),v:(data.expenses[k]||[]).reduce((s,e)=>s+Number(e.amount),0)};});
  const unlocked=ACHIEVEMENTS.filter(a=>(data.unlockedAchievements||[]).includes(a.id));
  const genAI=async()=>{
    sLoad(true);sAI("");
    const summary={tasks:{done:(data.tasks.today||[]).filter(x=>x.done).length,total:(data.tasks.today||[]).length},prayers:PRAYERS_EN.filter(p=>(data.prayers[TODAY]||{})[p]).length,exercise:(data.exercise[TODAY]||[]).reduce((s,e)=>s+e.mins,0),reading:(data.reading?.sessions?.[TODAY]||[]).reduce((s,r)=>s+r.mins,0),water:data.water[TODAY]||0,streak:bestStreak,monthSpent};
    try{const res=await fetch("https://api.anthropic.com/v1/messages",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({model:"claude-sonnet-4-6",max_tokens:400,messages:[{role:"user",content:`You are a personal life coach. Write a warm, motivating 3-sentence weekly summary in ${lang==="bn"?"Bengali":"English"}. Be specific. Data: ${JSON.stringify(summary)}`}]})});const d=await res.json();sAI(d.content?.[0]?.text||"Could not generate.");}catch{sAI("Error. Please try again.");}
    sLoad(false);
  };
  return <div style={{display:"flex",flexDirection:"column",gap:11}}>
    <SecHead icon="📊" title={st.title}/>
    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:11}}>
      <Card style={{textAlign:"center"}}><div style={{fontSize:26,fontWeight:900,color:"#f97316"}}>{bestStreak}🔥</div><div style={{fontSize:9,color:"var(--muted)",fontWeight:700,textTransform:"uppercase"}}>{st.bestStreak}</div></Card>
      <Card style={{textAlign:"center"}}><div style={{fontSize:22,fontWeight:900,color:"#7c6fff"}}>৳{monthSpent.toLocaleString()}</div><div style={{fontSize:9,color:"var(--muted)",fontWeight:700,textTransform:"uppercase"}}>{st.thisMonth}</div></Card>
    </div>
    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:11}}>
      <Card style={{display:"flex",flexDirection:"column",alignItems:"center",gap:5,padding:"13px"}}><Ring pct={avgTaskRate} color="#7c6fff" size={70}/><div style={{fontSize:9,color:"var(--muted)",fontWeight:700,textTransform:"uppercase"}}>{st.taskRate}</div></Card>
      <Card style={{display:"flex",flexDirection:"column",alignItems:"center",gap:5,padding:"13px"}}><Ring pct={avgPrayerRate} color="#10b981" size={70}/><div style={{fontSize:9,color:"var(--muted)",fontWeight:700,textTransform:"uppercase"}}>{st.prayerRate}</div></Card>
    </div>
    <Card><div style={{fontSize:9,fontWeight:700,color:"var(--muted)",textTransform:"uppercase",marginBottom:8}}>{st.expTrend}</div><Bar data={last7Exp} color="#f59e0b"/></Card>
    {unlocked.length>0&&<Card><div style={{fontSize:10,fontWeight:700,color:"var(--muted)",textTransform:"uppercase",marginBottom:9}}>{t.achievements.title}</div><div style={{display:"flex",flexWrap:"wrap",gap:7}}>{unlocked.map(a=><div key={a.id} style={{display:"flex",alignItems:"center",gap:6,background:"var(--input)",borderRadius:11,padding:"6px 11px"}}><span style={{fontSize:17}}>{a.icon}</span><div style={{fontSize:11,fontWeight:700}}>{lang==="bn"?a.bn:a.en}</div></div>)}</div></Card>}
    <Card><div style={{fontSize:10,fontWeight:700,color:"var(--muted)",textTransform:"uppercase",marginBottom:9}}>🤖 {st.aiSummary}</div>{aiText&&<div style={{fontSize:13,lineHeight:1.6,color:"var(--text)",background:"var(--input)",borderRadius:11,padding:"11px 13px",marginBottom:9}}>{aiText}</div>}<Btn onClick={genAI} full color="#7c6fff" disabled={loading}>{loading?st.generating:st.generate}</Btn></Card>
  </div>;
}

// ── SETTINGS ──────────────────────────────────────────────────────────────────
function Settings({data,setData,t,dark,setDark,lang,setLang}){
  const st=t.settings;const [name,sN]=useState(data.userName||"");const [height,sH]=useState(data.height||"");const [budget,sB]=useState(data.monthBudget||"");const [pin,sP]=useState(data.pin||"");const [resetTxt,sR]=useState("");const [saved,sSaved]=useState(false);
  
  // লজিক: সেটিংস থেকে গুগল অ্যাকাউন্ট যুক্ত করা
  const handleGoogleLogin = () => {
    signInWithPopup(auth, googleProvider)
      .then((res) => {
        sN(res.user.displayName || name);
        setData(d => ({ ...d, userName: res.user.displayName || name, email: res.user.email }));
      })
      .catch((err) => console.error("Login failed", err));
  };

  const saveProfile=()=>{setData(d=>({...d,userName:name,height:Number(height),monthBudget:Number(budget),pin}));sSaved(true);setTimeout(()=>sSaved(false),1500);};
  const exportCSV=()=>{const rows=[["Date","Category","Amount"]];Object.entries(data.expenses).forEach(([date,arr])=>arr.forEach(e=>rows.push([date,e.cat,e.amount])));const a=document.createElement("a");a.href="data:text/csv;charset=utf-8,"+encodeURIComponent(rows.map(r=>r.join(",")).join("\n"));a.download="dailyrise-expenses.csv";a.click();};
  const copyData=()=>{try{navigator.clipboard.writeText(JSON.stringify(data,null,2));}catch{}};
  return <div style={{display:"flex",flexDirection:"column",gap:13}}>
    <SecHead icon="⚙️" title={st.title}/>
    <Card>
      <div style={{fontSize:10,fontWeight:700,color:"var(--muted)",textTransform:"uppercase",marginBottom:11}}>👤 {st.profile}</div>
      <div style={{display:"flex",flexDirection:"column",gap:9}}>
        
        {/* গুগল লগইন / ইমেইল সেকশন */}
        {data.email ? (
           <div style={{fontSize:12,color:"var(--accent)",fontWeight:600,background:"var(--accent)22",padding:"6px 10px",borderRadius:8,width:"fit-content"}}>📧 {data.email}</div>
        ) : (
           <button onClick={handleGoogleLogin} style={{padding:"8px 12px",borderRadius:10,background:"var(--input)",border:"1px solid var(--border)",color:"var(--text)",fontSize:12,fontWeight:700,cursor:"pointer",display:"flex",alignItems:"center",gap:6,width:"fit-content",boxShadow:"0 2px 6px rgba(0,0,0,0.05)"}}>
              <svg width="14" height="14" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
              {lang==="bn"?"Google অ্যাকাউন্ট লিঙ্ক করুন":"Link Google Account"}
           </button>
        )}

        <FInp label={st.name} value={name} onChange={e=>sN(e.target.value)} placeholder="Your name"/>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:9}}><FInp label={st.height} type="number" value={height} onChange={e=>sH(e.target.value)} placeholder="170"/><FInp label={st.budget} type="number" value={budget} onChange={e=>sB(e.target.value)} placeholder="5000"/></div>
        <div style={{display:"flex",flexDirection:"column",gap:4}}><span style={{fontSize:10,fontWeight:700,color:"var(--muted)",textTransform:"uppercase"}}>🔒 {st.pin}</span><input value={pin} onChange={e=>sP(e.target.value.slice(0,4))} type="password" inputMode="numeric" placeholder="4-digit PIN" style={{...S.inp}} onFocus={e=>e.target.style.borderColor="var(--accent)"} onBlur={e=>e.target.style.borderColor="var(--border)"}/></div>
        <div style={{display:"flex",gap:8,alignItems:"center"}}><Btn onClick={saveProfile} full>Save Profile</Btn>{saved&&<span style={{fontSize:12,color:"#10b981",fontWeight:700}}>✓ Saved!</span>}</div>
      </div>
    </Card>
    <Card><div style={{fontSize:10,fontWeight:700,color:"var(--muted)",textTransform:"uppercase",marginBottom:10}}>🎨 Appearance</div><div style={{display:"flex",gap:9,marginBottom:9}}><button onClick={()=>setDark(false)} style={{flex:1,padding:"9px",borderRadius:11,border:`2px solid ${!dark?"var(--accent)":"var(--border)"}`,background:!dark?"var(--accent)22":"var(--input)",color:"var(--text)",cursor:"pointer",fontWeight:700,fontSize:13}}>☀️ Light</button><button onClick={()=>setDark(true)} style={{flex:1,padding:"9px",borderRadius:11,border:`2px solid ${dark?"var(--accent)":"var(--border)"}`,background:dark?"var(--accent)22":"var(--input)",color:"var(--text)",cursor:"pointer",fontWeight:700,fontSize:13}}>🌙 Dark</button></div><div style={{display:"flex",gap:9}}><button onClick={()=>setLang("en")} style={{flex:1,padding:"9px",borderRadius:11,border:`2px solid ${lang==="en"?"var(--accent)":"var(--border)"}`,background:lang==="en"?"var(--accent)22":"var(--input)",color:"var(--text)",cursor:"pointer",fontWeight:700,fontSize:13}}>🇬🇧 English</button><button onClick={()=>setLang("bn")} style={{flex:1,padding:"9px",borderRadius:11,border:`2px solid ${lang==="bn"?"var(--accent)":"var(--border)"}`,background:lang==="bn"?"var(--accent)22":"var(--input)",color:"var(--text)",cursor:"pointer",fontWeight:700,fontSize:13}}>🇧🇩 বাংলা</button></div></Card>
    <Card><div style={{fontSize:10,fontWeight:700,color:"var(--muted)",textTransform:"uppercase",marginBottom:9}}>☁️ {st.backup}</div><div style={{fontSize:12,color:"#10b981",fontWeight:600}}>✅ {st.backupInfo}</div></Card>
    <Card><div style={{fontSize:10,fontWeight:700,color:"var(--muted)",textTransform:"uppercase",marginBottom:9}}>📤 {st.data}</div><div style={{display:"flex",gap:9,marginBottom:11}}><Btn onClick={exportCSV} v="ghost" full>{t.export.csv}</Btn><Btn onClick={copyData} v="ghost" full>{t.export.copy}</Btn></div><div style={{fontSize:10,fontWeight:700,color:"#ef4444",textTransform:"uppercase",marginBottom:7}}>⚠️ {st.reset}</div><div style={{display:"flex",gap:7}}><input value={resetTxt} onChange={e=>sR(e.target.value)} placeholder={st.resetConfirm} style={{...S.inp,borderColor:resetTxt==="RESET"?"#ef4444":"var(--border)"}} onFocus={e=>e.target.style.borderColor="#ef4444"} onBlur={e=>e.target.style.borderColor="var(--border)"}/><Btn onClick={()=>{if(resetTxt==="RESET"){setData(INIT);sR("");}}} v="dan" disabled={resetTxt!=="RESET"}>Reset</Btn></div></Card>
    <Card style={{textAlign:"center",padding:"11px"}}><div style={{fontSize:11,color:"var(--muted)"}}>🌅 DailyRise v{APP_VER}</div><div style={{fontSize:10,color:"var(--muted)",marginTop:2}}>Built for productivity & growth</div></Card>
  </div>;
}

// ── WEEKLY + MONTHLY ──────────────────────────────────────────────────────────
function GoalList({items,setItems,title,icon,color,t,challenge,setData,data,lang}){
  const [text,sT]=useState("");const done=items.filter(x=>x.done).length;
  const add=()=>{if(!text)return;setItems([...items,{id:Date.now(),text,done:false}]);sT("");};
  const tog=id=>setItems(items.map(x=>x.id===id?{...x,done:!x.done}:x));
  const del=id=>setItems(items.filter(x=>x.id!==id));
  const ct=t.challenge;const days=data?.challengeProgress?.days||0;
  const pickChallenge=()=>{const c=CHALLENGES[Math.floor(Math.random()*CHALLENGES.length)];setData&&setData(d=>({...d,weeklyChallenge:c,challengeProgress:{days:0}}));};
  const markDay=()=>setData&&setData(d=>({...d,challengeProgress:{...(d.challengeProgress||{}),days:Math.min(7,(d.challengeProgress?.days||0)+1)}}));
  return <div style={{display:"flex",flexDirection:"column",gap:11}}>
    <SecHead icon={icon} title={title} extra={<Tag color={color}>{done}/{items.length}</Tag>}/>
    {challenge&&<Card style={{background:"linear-gradient(135deg,#7c6fff22,#4c1d95)"}}><div style={{fontSize:10,fontWeight:700,color:"var(--muted)",textTransform:"uppercase",marginBottom:9}}>🎯 {ct.title}</div>{data?.weeklyChallenge?<><div style={{fontSize:13,fontWeight:700,marginBottom:9,lineHeight:1.5}}>{lang==="bn"?data.weeklyChallenge.bn:data.weeklyChallenge.en}</div><div style={{display:"flex",gap:3,marginBottom:7}}>{Array.from({length:7},(_,i)=><div key={i} style={{flex:1,height:7,borderRadius:100,background:i<days?"#7c6fff":"var(--border)",transition:"background .3s"}}/>)}</div><div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}><span style={{fontSize:11,color:"var(--muted)"}}>{days}/7 days</span>{days<7?<Btn onClick={markDay} sz="sm" color="#7c6fff">{ct.complete}</Btn>:<Tag color="#10b981">{ct.completed}</Tag>}</div></>:<><div style={{fontSize:13,color:"var(--muted)",marginBottom:9}}>No active challenge. Pick one!</div><Btn onClick={pickChallenge} full color="#7c6fff">🎲 Pick Random Challenge</Btn></>}</Card>}
    {items.length>0&&<Card style={{display:"flex",alignItems:"center",gap:14}}><Ring pct={items.length?Math.round(done/items.length*100):0} color={color} size={68}/><div><div style={{fontSize:18,fontWeight:900}}>{done}/{items.length}</div><div style={{fontSize:11,color:"var(--muted)"}}>Completed</div></div></Card>}
    <Card><div style={{display:"flex",gap:7}}><input value={text} onChange={e=>sT(e.target.value)} onKeyDown={e=>e.key==="Enter"&&add()} placeholder={title+"..."} style={{...S.inp}} onFocus={e=>e.target.style.borderColor=color} onBlur={e=>e.target.style.borderColor="var(--border)"}/><Btn onClick={add} color={color}>+</Btn></div></Card>
    {items.length===0&&<Empty icon={icon} text={t.emptyState}/>}
    {items.map(item=><Card key={item.id} style={{display:"flex",alignItems:"center",gap:11,border:item.done?`1.5px solid ${color}40`:"1px solid var(--border)"}}>
      <button onClick={()=>tog(item.id)} style={{width:22,height:22,borderRadius:7,border:`2px solid ${item.done?color:"var(--border)"}`,background:item.done?color+"22":"transparent",display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer",flexShrink:0,fontSize:11,color}}>{item.done?"✓":""}</button>
      <div style={{flex:1,minWidth:0,textDecoration:item.done?"line-through":"none",opacity:item.done?.6:1,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{item.text}</div>
      <Btn onClick={()=>del(item.id)} v="dan" sz="xs">✕</Btn>
    </Card>)}
  </div>;
}

// ── APP ROOT ──────────────────────────────────────────────────────────────────
const NAV=[{k:"home",i:"🏠"},{k:"expense",i:"💸"},{k:"reading",i:"📚"},{k:"exercise",i:"🏋️"},{k:"prayer",i:"🕌"},{k:"tasks",i:"✅"},{k:"health",i:"❤️"},{k:"habits",i:"🌱"},{k:"journal",i:"📓"},{k:"timeline",i:"⏰"},{k:"weekly",i:"📅"},{k:"monthly",i:"🎯"},{k:"stats",i:"📊"},{k:"settings",i:"⚙️"}];

export default function App(){
  const [dark,setDark]=usePersist("dr_dark",true);
  const [lang,setLang]=usePersist("dr_lang","bn");
  const [data,setData]=usePersist("dr_data",INIT);
  const [tab,setTab]=useState("home");
  const [unlocked,setUnlocked]=useState(false);
  const t=T[lang];const th=dark?THEMES.dark:THEMES.light;
  const cssVars=Object.entries(th).reduce((s,[k,v])=>s+`--${k}:${v};`,"");
  if(!data.userName) return <Onboarding lang={lang} onDone={profile=>setData(d=>({...d,...profile}))}/>;
  if(data.pin&&!unlocked) return <PinLock correctPin={data.pin} onUnlock={()=>setUnlocked(true)}/>;
  const p={data,setData,t,lang};
  const render=()=>{
    if(tab==="home")    return <Home {...p}/>;
    if(tab==="expense") return <Expense {...p}/>;
    if(tab==="reading") return <Reading {...p}/>;
    if(tab==="exercise")return <Exercise {...p}/>;
    if(tab==="prayer")  return <Prayer {...p}/>;
    if(tab==="tasks")   return <Tasks {...p}/>;
    if(tab==="health")  return <Health {...p}/>;
    if(tab==="habits")  return <Habits {...p}/>;
    if(tab==="journal") return <Journal {...p}/>;
    if(tab==="timeline")return <Timeline {...p}/>;
    if(tab==="weekly")  return <GoalList {...p} items={data.weekly} setItems={v=>setData(d=>({...d,weekly:v}))} title={t.weekly.title} icon="📅" color="#8b5cf6" challenge data={data} setData={setData}/>;
    if(tab==="monthly") return <GoalList {...p} items={data.monthly} setItems={v=>setData(d=>({...d,monthly:v}))} title={t.monthly.title} icon="🎯" color="#ef4444"/>;
    if(tab==="stats")   return <Stats {...p}/>;
    if(tab==="settings")return <Settings {...p} dark={dark} setDark={setDark} lang={lang} setLang={setLang}/>;
  };
  return <div style={{fontFamily:"-apple-system,BlinkMacSystemFont,'Segoe UI',system-ui,sans-serif",minHeight:"100vh",background:"var(--bg)",color:"var(--text)"}}>
    <style>{`:root{${cssVars}}*{box-sizing:border-box}body{margin:0}input,button,select,textarea{font-family:inherit}::-webkit-scrollbar{display:none}`}</style>
    <div style={{position:"sticky",top:0,zIndex:50,background:"var(--navBg)",borderBottom:"1px solid var(--border)",backdropFilter:"blur(20px)",WebkitBackdropFilter:"blur(20px)"}}>
      <div style={{maxWidth:520,margin:"0 auto",padding:"10px 12px",display:"flex",alignItems:"center",gap:9}}>
        <div style={{flex:1,display:"flex",alignItems:"center",gap:7}}>
          <div style={{width:26,height:26,borderRadius:8,background:"linear-gradient(135deg,var(--accent),#a78bfa)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:13}}>🌅</div>
          <span style={{fontWeight:900,fontSize:16,background:"linear-gradient(135deg,var(--accent),#a78bfa)",WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent"}}>DailyRise</span>
        </div>
        <button onClick={()=>setLang(l=>l==="en"?"bn":"en")} style={{background:"var(--input)",border:"1px solid var(--border)",color:"var(--text)",borderRadius:100,padding:"4px 12px",fontSize:11,fontWeight:700,cursor:"pointer"}}>{t.sw}</button>
        <button onClick={()=>setDark(d=>!d)} style={{width:32,height:32,borderRadius:10,background:"var(--input)",border:"1px solid var(--border)",cursor:"pointer",fontSize:14,display:"flex",alignItems:"center",justifyContent:"center"}}>{dark?"☀️":"🌙"}</button>
      </div>
    </div>
    <div style={{maxWidth:520,margin:"0 auto",padding:"12px 12px 90px"}}>{render()}</div>
    <div style={{position:"fixed",bottom:0,left:0,right:0,zIndex:50,background:"var(--navBg)",borderTop:"1px solid var(--border)",backdropFilter:"blur(20px)",WebkitBackdropFilter:"blur(20px)"}}>
      <div style={{maxWidth:520,margin:"0 auto",display:"flex",overflowX:"auto",scrollbarWidth:"none",padding:"4px 2px 8px"}}>
        {NAV.map(n=><button key={n.k} onClick={()=>setTab(n.k)} style={{flex:"0 0 auto",display:"flex",flexDirection:"column",alignItems:"center",gap:1,padding:"3px 8px",background:"transparent",border:"none",cursor:"pointer",position:"relative"}}>
          <div style={{width:34,height:32,borderRadius:9,display:"flex",alignItems:"center",justifyContent:"center",fontSize:17,background:tab===n.k?"var(--accent)22":"transparent",transition:"all .2s"}}>{n.i}</div>
          <span style={{fontSize:8,fontWeight:700,color:tab===n.k?"var(--accent)":"var(--muted)",transition:"color .2s"}}>{t.nav[n.k]}</span>
          {tab===n.k&&<div style={{position:"absolute",bottom:0,left:"50%",transform:"translateX(-50%)",width:4,height:4,borderRadius:"50%",background:"var(--accent)"}}/>}
        </button>)}
      </div>
    </div>
  </div>;
}