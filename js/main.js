(()=>{
const $=s=>document.querySelector(s),H=$('header');

/* Header solid on scroll */
addEventListener('scroll',()=>H.classList.toggle('solid',scrollY>30),{passive:true});

/* Mobile menu */
const b=$('.burger'),l=$('.links');
if(b&&l){
  b.onclick=()=>{const o=l.classList.toggle('open');b.setAttribute('aria-expanded',o)};
  l.querySelectorAll('a').forEach(a=>a.onclick=()=>l.classList.remove('open'));
}

/* Age gate */
const g=$('#gate');let ok=0;
try{ok=localStorage.getItem('sk18')}catch(e){}
if(!ok&&g){g.classList.add('show');document.body.style.overflow='hidden'}
if(g){
  $('#yes').onclick=()=>{try{localStorage.setItem('sk18','1')}catch(e){}g.classList.remove('show');document.body.style.overflow=''};
  $('#no').onclick=()=>{g.innerHTML='<div><h2>See you at 18.</h2><p>Shisha King serves adults only. Please come back when you are old enough.</p></div>'};
}

/* Smoke canvas — fewer particles on small screens */
const c=$('#smoke');
if(c&&!matchMedia('(prefers-reduced-motion:reduce)').matches){
  const x=c.getContext('2d');let W,Hh,P=[];
  const N=()=>innerWidth<760?14:26;
  const rs=()=>{W=c.width=c.offsetWidth;Hh=c.height=c.offsetHeight};rs();addEventListener('resize',rs);
  const mk=()=>({x:W*(.25+Math.random()*.5),y:Hh+40,r:50+Math.random()*110,v:.3+Math.random()*.7,d:(Math.random()-.5)*.6,a:0,life:0,m:.05+Math.random()*.08});
  const seed=()=>{P=[];for(let i=0;i<N();i++){const p=mk();p.y=Math.random()*Hh;p.life=Math.random();P.push(p)}};seed();
  addEventListener('resize',()=>{if(P.length!==N())seed()});
  (function f(){x.clearRect(0,0,W,Hh);P.forEach((p,i)=>{p.y-=p.v;p.x+=p.d+Math.sin(p.y/80)*.5;p.r+=.25;p.life+=.0016;p.a=Math.sin(Math.min(p.life,1)*Math.PI)*p.m;
  const gr=x.createRadialGradient(p.x,p.y,0,p.x,p.y,p.r);gr.addColorStop(0,`rgba(255,225,200,${p.a})`);gr.addColorStop(1,'rgba(255,225,200,0)');x.fillStyle=gr;x.fillRect(p.x-p.r,p.y-p.r,p.r*2,p.r*2);
  if(p.life>1||p.y<-p.r)P[i]=mk()});requestAnimationFrame(f)})()
}

/* Booking form -> WhatsApp */
const f=$('#book');
if(f)f.onsubmit=e=>{
  e.preventDefault();
  const d=new FormData(f),
  t=`Hello Shisha King, I want to book.\nName: ${d.get('name')}\nEvent: ${d.get('type')}\nDate: ${d.get('date')}\nGuests: ${d.get('guests')||'-'}\nPackage: ${d.get('pkg')}\nVenue/notes: ${d.get('msg')||'-'}\nI confirm this event is for adults 18+.`;
  open('https://wa.me/2347042776167?text='+encodeURIComponent(t),'_blank')
};

/* Count-up stats — staggered, eased, with a completion pop */
const reduced=matchMedia('(prefers-reduced-motion:reduce)').matches;
const counters=[...document.querySelectorAll('[data-count]')];
counters.forEach((el,i)=>{
  const end=+el.dataset.count,suf=el.dataset.suffix||'';
  if(reduced||!end){el.textContent=end+suf;return}
  const start=performance.now()+i*140, dur=1600;
  const tick=now=>{
    const raw=(now-start)/dur, k=raw<0?0:Math.min(raw,1), eased=1-Math.pow(1-k,4);
    el.textContent=Math.round(end*eased)+suf;
    if(k<1)requestAnimationFrame(tick);
    else el.classList.add('pop');
  };
  new IntersectionObserver((es,o)=>{es.forEach(en=>{if(en.isIntersecting){requestAnimationFrame(tick);o.unobserve(en.target)}})},{threshold:.4}).observe(el);
});
})();

/* Reveal on scroll — staggered via CSS nth-child delays */
if('IntersectionObserver' in window&&!matchMedia('(prefers-reduced-motion:reduce)').matches){
  const o=new IntersectionObserver(e=>e.forEach(i=>{
    if(i.isIntersecting){i.target.classList.add('in');o.unobserve(i.target)}
  }),{threshold:.12});
  document.querySelectorAll('.card,.split .ph,.story .ph,.tl,.stats,details,.band h2,form,h2').forEach(el=>{
    el.classList.add('rv');o.observe(el)
  });
}
