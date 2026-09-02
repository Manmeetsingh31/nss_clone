
document.addEventListener("DOMContentLoaded",()=>{
  const toggle=document.querySelector(".nav-toggle"), nav=document.querySelector(".nav");
  if(toggle&&nav){
    toggle.addEventListener("click",()=>{const open=nav.classList.toggle("open");toggle.setAttribute("aria-expanded",open)});
    nav.querySelectorAll("a").forEach(a=>a.addEventListener("click",()=>nav.classList.remove("open")));
  }
  const year=document.querySelectorAll("[data-year]"); year.forEach(el=>el.textContent=new Date().getFullYear());
  document.querySelectorAll("[data-counter]").forEach(el=>{
    const target=Number(el.dataset.counter); let n=0; const step=Math.max(1,Math.ceil(target/45));
    const tick=()=>{n=Math.min(target,n+step);el.textContent=n.toLocaleString();if(n<target)requestAnimationFrame(tick)}; tick();
  });
  document.querySelectorAll("[data-page]").forEach(a=>{if(location.pathname.endsWith(a.getAttribute("href")))a.classList.add("active")});
  const searchBtn=document.querySelector("[data-open-search]");
  if(searchBtn)searchBtn.addEventListener("click",()=>window.NSSSearch?.open());
  document.querySelectorAll("[data-close-modal]").forEach(x=>x.addEventListener("click",e=>e.target.closest(".modal")?.remove()));
});
