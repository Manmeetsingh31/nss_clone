
const translations={
  en:{
    home:"Home",about:"About NSS",administration:"Administration",units:"NSS Units",activities:"Activities",
    events:"Events",notices:"Notices",gallery:"Gallery",achievements:"Achievements",contact:"Contact Us",
    login:"Login",joinNss:"Join NSS",loginAs:"Login As",volunteer:"Volunteer",programmeOfficer:"Programme Officer",
    heroEyebrow:"Punjabi University, Patiala",heroTitle:"National Service Scheme",heroUniversity:"Punjabi University, Patiala",
    heroText:"Empowering students through service, leadership, community engagement and social responsibility.",
    exploreNss:"Explore NSS →",becomeVolunteer:"Become an NSS Volunteer →",latestNotices:"Latest Notices",
    stayInformed:"Stay informed",viewAll:"View All",upcomingEvents:"Upcoming Events",eventsAndProgrammes:"Events & Programmes",
    featuredActivities:"Featured Activities",serviceInAction:"Service in action",photoGallery:"Photo Gallery",
    momentsOfService:"Moments of service",joinMovement:"Join the movement",beTheChange:"Be the change. Serve the nation.",
    joinMovementText:"Join thousands of NSS volunteers and make a meaningful impact in society.",
    joinNssToday:"Join NSS Today →"
  },
  pa:{
    home:"ਮੁੱਖ ਪੰਨਾ",about:"ਐਨ.ਐਸ.ਐਸ. ਬਾਰੇ",administration:"ਪ੍ਰਸ਼ਾਸਨ",units:"ਐਨ.ਐਸ.ਐਸ. ਯੂਨਿਟ",
    activities:"ਗਤੀਵਿਧੀਆਂ",events:"ਸਮਾਗਮ",notices:"ਨੋਟਿਸ",gallery:"ਗੈਲਰੀ",achievements:"ਪ੍ਰਾਪਤੀਆਂ",contact:"ਸੰਪਰਕ ਕਰੋ",
    login:"ਲਾਗਇਨ",joinNss:"ਐਨ.ਐਸ.ਐਸ. ਨਾਲ ਜੁੜੋ",loginAs:"ਲਾਗਇਨ ਕਰੋ",volunteer:"ਵਲੰਟੀਅਰ",programmeOfficer:"ਪ੍ਰੋਗਰਾਮ ਅਫਸਰ",
    heroEyebrow:"ਪੰਜਾਬੀ ਯੂਨੀਵਰਸਿਟੀ, ਪਟਿਆਲਾ",heroTitle:"ਰਾਸ਼ਟਰੀ ਸੇਵਾ ਯੋਜਨਾ",heroUniversity:"ਪੰਜਾਬੀ ਯੂਨੀਵਰਸਿਟੀ, ਪਟਿਆਲਾ",
    heroText:"ਸੇਵਾ, ਅਗਵਾਈ, ਸਮਾਜਿਕ ਭਾਗੀਦਾਰੀ ਅਤੇ ਸਮਾਜਿਕ ਜ਼ਿੰਮੇਵਾਰੀ ਰਾਹੀਂ ਵਿਦਿਆਰਥੀਆਂ ਨੂੰ ਸਸ਼ਕਤ ਬਣਾਉਣਾ।",
    exploreNss:"ਐਨ.ਐਸ.ਐਸ. ਵੇਖੋ →",becomeVolunteer:"ਐਨ.ਐਸ.ਐਸ. ਵਲੰਟੀਅਰ ਬਣੋ →",latestNotices:"ਤਾਜ਼ਾ ਨੋਟਿਸ",
    stayInformed:"ਜਾਣਕਾਰੀ ਨਾਲ ਜੁੜੇ ਰਹੋ",viewAll:"ਸਭ ਵੇਖੋ",upcomingEvents:"ਆਉਣ ਵਾਲੇ ਸਮਾਗਮ",
    eventsAndProgrammes:"ਸਮਾਗਮ ਅਤੇ ਪ੍ਰੋਗਰਾਮ",featuredActivities:"ਮੁੱਖ ਗਤੀਵਿਧੀਆਂ",serviceInAction:"ਸੇਵਾ ਅਮਲ ਵਿੱਚ",
    photoGallery:"ਫੋਟੋ ਗੈਲਰੀ",momentsOfService:"ਸੇਵਾ ਦੇ ਪਲ",joinMovement:"ਮੁਹਿੰਮ ਨਾਲ ਜੁੜੋ",
    beTheChange:"ਬਦਲਾਅ ਬਣੋ। ਦੇਸ਼ ਦੀ ਸੇਵਾ ਕਰੋ।",joinMovementText:"ਹਜ਼ਾਰਾਂ ਐਨ.ਐਸ.ਐਸ. ਵਲੰਟੀਅਰਾਂ ਨਾਲ ਜੁੜੋ ਅਤੇ ਸਮਾਜ ਵਿੱਚ ਅਰਥਪੂਰਨ ਯੋਗਦਾਨ ਪਾਓ।",
    joinNssToday:"ਅੱਜ ਹੀ ਐਨ.ਐਸ.ਐਸ. ਨਾਲ ਜੁੜੋ →"
  }
};

function applyLanguage(lang){
  const t=translations[lang]||translations.en;
  document.documentElement.lang=lang==="pa"?"pa":"en";

  document.querySelectorAll("[data-i18n]").forEach(el=>{
    const key=el.dataset.i18n;
    if(Object.prototype.hasOwnProperty.call(t,key)) el.textContent=t[key];
  });

  const switcher=document.querySelector("#langSwitch");
  if(switcher){
    switcher.textContent=lang==="en"?"ਪੰਜਾਬੀ":"English";
    switcher.setAttribute("aria-label",lang==="en"?"Switch to Punjabi":"Switch to English");
  }

  localStorage.setItem("nssLanguage",lang);
}

document.addEventListener("DOMContentLoaded",()=>{
  const saved=localStorage.getItem("nssLanguage")||"en";
  applyLanguage(saved);

  const switcher=document.querySelector("#langSwitch");
  if(switcher){
    switcher.addEventListener("click",()=>{
      const next=(localStorage.getItem("nssLanguage")||"en")==="en"?"pa":"en";
      applyLanguage(next);
    });
  }
});
