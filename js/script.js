const fields = {
  wake:"wakeTime", breakfast:"breakfast", lunch:"lunch", snacks:"snacks",
  dinner:"dinner", water:"water", exercise:"exercise", work:"work",
  sleep:"sleepTime", notes:"notes"
};

function getData(){
  const d={};
  Object.keys(fields).forEach(k=>d[k]=document.getElementById(fields[k]).value);
  return d;
}

function updateProgress(){
  const d=getData();
  let done=0, total=10;
  if(d.wake)done++;
  if(d.breakfast.trim())done++;
  if(d.lunch.trim())done++;
  if(d.snacks.trim())done++;
  if(d.dinner.trim())done++;
  if(d.water)done++;
  if(d.exercise.trim())done++;
  if(d.work.trim())done++;
  if(d.sleep)done++;
  if(d.notes.trim())done++;
  const p=Math.round(done/total*100);
  document.getElementById("progressNumber").textContent=p;
  document.getElementById("progressCircle").textContent=p+"%";
  document.getElementById("progressFill").style.width=p+"%";
  document.getElementById("wakePreview").textContent=d.wake||"--:--";
  document.getElementById("waterPreview").textContent=d.water?(d.water+" L"):"0 L";
  document.getElementById("exercisePreview").textContent=d.exercise||"Not logged";
  document.getElementById("sleepPreview").textContent=d.sleep||"--:--";
}

function saveRoutine(){
  const data=getData();
  localStorage.setItem("dailyRoutineProfessional",JSON.stringify(data));
  updateProgress();
  document.getElementById("historyContent").innerHTML=
    '<div class="history-empty"><span>✓</span><h3>Routine saved for today</h3><p>Your entries are stored in this browser.</p></div>';
  const t=document.getElementById("toast");t.classList.add("show");
  setTimeout(()=>t.classList.remove("show"),2200);
}

function loadRoutine(){
  const saved=localStorage.getItem("dailyRoutineProfessional");
  if(!saved)return;
  const d=JSON.parse(saved);
  Object.keys(fields).forEach(k=>document.getElementById(fields[k]).value=d[k]||"");
  updateProgress();
  document.getElementById("historyContent").innerHTML=
    '<div class="history-empty"><span>✓</span><h3>Routine saved for today</h3><p>Your previous entries are loaded.</p></div>';
}
document.querySelectorAll(".nav").forEach(a=>a.addEventListener("click",function(){
  document.querySelectorAll(".nav").forEach(x=>x.classList.remove("active"));this.classList.add("active");
}));
loadRoutine();updateProgress();
