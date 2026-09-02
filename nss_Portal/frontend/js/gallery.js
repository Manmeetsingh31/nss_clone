
function renderGallery(items=galleryImages){
  const grid=document.querySelector("#galleryGrid");if(!grid)return;
  grid.innerHTML=items.length?items.map((x,i)=>`<article class="gallery-item" tabindex="0" data-gallery-index="${i}"><img src="${x.image}" alt="${x.title}"><div class="gallery-caption"><strong>${x.title}</strong><br><small>${x.date} · ${x.location}</small></div></article>`).join(""):`<div class="empty" style="grid-column:1/-1">No gallery results.</div>`;
  grid.querySelectorAll(".gallery-item").forEach(el=>{el.onclick=()=>openLightbox(Number(el.dataset.galleryIndex));el.onkeydown=e=>{if(e.key==="Enter")openLightbox(Number(el.dataset.galleryIndex))}});
}
function openLightbox(index){
  const old=document.querySelector("#lightbox");if(old)old.remove();const x=galleryImages[index];
  const modal=document.createElement("div");modal.id="lightbox";modal.className="modal";
  modal.innerHTML=`<div class="modal-box"><button class="modal-close" aria-label="Close">×</button><img class="lightbox-image" src="${x.image}" alt="${x.title}"><div class="lightbox-nav"><button class="btn btn-outline" id="prev">← Previous</button><div><strong>${x.title}</strong><br><small>${x.date} · ${x.location}</small></div><button class="btn btn-outline" id="next">Next →</button></div></div>`;
  document.body.appendChild(modal);
  const close=()=>modal.remove();modal.querySelector(".modal-close").onclick=close;modal.onclick=e=>{if(e.target===modal)close()};
  const move=delta=>openLightbox((index+delta+galleryImages.length)%galleryImages.length);
  modal.querySelector("#prev").onclick=()=>move(-1);modal.querySelector("#next").onclick=()=>move(1);
  document.onkeydown=e=>{if(e.key==="Escape")close();if(e.key==="ArrowLeft")move(-1);if(e.key==="ArrowRight")move(1)};
}
document.addEventListener("DOMContentLoaded",()=>{
  if(!document.querySelector("#galleryGrid"))return;
  renderGallery();
  document.querySelectorAll("[data-gallery-filter]").forEach(b=>b.onclick=()=>{document.querySelectorAll("[data-gallery-filter]").forEach(x=>x.classList.remove("btn-primary"));b.classList.add("btn-primary");renderGallery(b.dataset.galleryFilter==="All"?galleryImages:galleryImages.filter(x=>x.category===b.dataset.galleryFilter))});
});
