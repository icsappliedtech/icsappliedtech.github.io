/* Shared site bar and previous/next links. Works from any folder because all links are relative. */
(function(){
  'use strict';
  var P=[
    ['index.html','Home'],
    ['stages.html','Stages'],
    ['checking.html','Checking'],
    ['decide.html','Decide'],
    ['time-test.html','Time test'],
    ['who.html','Who uses it'],
    ['teach.html','Teach it'],
    ['lab.html','Lab'],
    ['sources.html','Sources']
  ];
  var file=(location.pathname.split('/').pop()||'index.html').toLowerCase();
  var cur=0;
  for(var i=0;i<P.length;i++){if(P[i][0]===file){cur=i;break}}

  var css='.wm-bar{background:#fff;border-bottom:1px solid #e8eaee;font-family:Inter,system-ui,sans-serif}'
   +'.wm-in{max-width:1120px;margin:0 auto;padding:8px 24px;display:flex;align-items:center;gap:10px 18px;flex-wrap:wrap}'
   +'.wm-brand{font-family:"Space Grotesk",Inter,system-ui,sans-serif;font-weight:700;font-size:17px;color:#14130f;text-decoration:none;display:flex;align-items:center;gap:9px;white-space:nowrap}'
   +'.wm-brand i{display:flex;gap:3px}.wm-brand i b{display:block;width:6px;height:14px;border-radius:2px}'
   +'.wm-links{list-style:none;margin:0 0 0 auto;padding:0;display:flex;flex-wrap:wrap;gap:2px}'
   +'.wm-links a{display:block;padding:5px 11px;border-radius:999px;font-size:14px;font-weight:600;color:#55544f;text-decoration:none}'
   +'.wm-links a:hover{background:#f6f7f9;color:#14130f}'
   +'.wm-links a[aria-current="page"]{background:#14130f;color:#fff}'
   +'.wm-pager{display:flex;justify-content:space-between;gap:12px;flex-wrap:wrap;margin-top:48px;font-family:Inter,system-ui,sans-serif}'
   +'.wm-pager a{display:block;text-decoration:none;color:#14130f;border:1.5px solid #14130f;border-radius:14px;padding:12px 18px;min-width:200px;font-weight:600;background:#fff}'
   +'.wm-pager a:hover{background:#14130f;color:#fff}'
   +'.wm-pager a small{display:block;font-size:12px;letter-spacing:1.3px;text-transform:uppercase;font-weight:600;opacity:.65}'
   +'.wm-pager a.n{margin-left:auto;text-align:right}'
   +'@media (max-width:700px){.wm-links{margin-left:0}}';
  var st=document.createElement('style');st.textContent=css;document.head.appendChild(st);

  var bar=document.createElement('header');bar.className='wm-bar';
  var inner='<div class="wm-in"><a class="wm-brand" href="index.html"><i aria-hidden="true"><b style="background:#0f9d8a"></b><b style="background:#2f62e0"></b><b style="background:#e0405a"></b></i>AI Moves Work Model</a><nav aria-label="Site"><ul class="wm-links">';
  P.forEach(function(p,i){inner+='<li><a href="'+p[0]+'"'+(i===cur?' aria-current="page"':'')+'>'+p[1]+'</a></li>'});
  inner+='</ul></nav></div>';
  bar.innerHTML=inner;
  document.body.insertBefore(bar,document.body.firstChild);

  var slot=document.querySelector('[data-pager]');
  if(slot){
    var h='<div class="wm-pager">';
    if(cur>0)h+='<a class="p" href="'+P[cur-1][0]+'"><small>Previous</small>'+P[cur-1][1]+'</a>';
    if(cur<P.length-1)h+='<a class="n" href="'+P[cur+1][0]+'"><small>Next</small>'+P[cur+1][1]+'</a>';
    h+='</div>';
    slot.innerHTML=h;
  }
})();
