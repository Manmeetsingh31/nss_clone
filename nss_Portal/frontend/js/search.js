
window.NSSSearch={
  open(){
    if(document.querySelector(".search-overlay"))return;
    const box=document.createElement("div");box.className="search-overlay";
    box.innerHTML=`<div class="search-box"><button class="btn btn-outline" id="closeSearch" style="float:right">Close</button><input id="globalSearch" aria-label="Search NSS" placeholder="Search NSS..." autofocus><div id="globalResults" class="search-results"></div></div>`;
    document.body.appendChild(box);
    const input=box.querySelector("#globalSearch"),results=box.querySelector("#globalResults");
    const data=[
      ...(window.notices||[]).map(x=>({...x,type:"Notice",url:"notices.html"})),
      ...(window.events||[]).map(x=>({...x,type:"Event",url:"events.html"})),
      ...(window.activities||[]).map(x=>({...x,type:"Activity",url:"activities.html"})),
      ...(window.units||[]).map(x=>({...x,type:"Unit",url:"units.html"})),
      ...(window.achievements||[]).map(x=>({...x,type:"Achievement",url:"achievements.html"}))
    ];
    const render=q=>{
      const hits=q?data.filter(x=>JSON.stringify(x).toLowerCase().includes(q.toLowerCase())).slice(0,12):[];
      results.innerHTML=hits.length?hits.map(x=>`<a class="search-result" href="${x.url}"><strong>${x.title||x.unit}</strong><br><small>${x.type} · ${x.category||""}</small></a>`).join(""):`<div class="search-result">${q?"No results found.":"Start typing to search notices, events, activities, units and achievements."}</div>`;
    };
    input.addEventListener("input",()=>render(input.value));box.querySelector("#closeSearch").onclick=()=>box.remove();
    box.addEventListener("click",e=>{if(e.target===box)box.remove()});
    document.addEventListener("keydown",function esc(e){if(e.key==="Escape"){box.remove();document.removeEventListener("keydown",esc)}});
  }
};
