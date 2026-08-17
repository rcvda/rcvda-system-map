(function(){
  "use strict";
  // register fcose once
  try{ var F=window.cytoscapeFcose||window['cytoscape-fcose']; if(window.cytoscape&&F&&!window.__rcvdaFcose){window.cytoscape.use(F);window.__rcvdaFcose=1;} }catch(e){}

  var COLT={"Statutory body":"#1f4e79","NHS body":"#0b7285","Emergency service":"#c92a2a","Partnership / board":"#6741d9","VCSE org":"#2f9e44","Education":"#e8590c","Funder":"#f08c00","Programme / evidence":"#495057","Role / post":"#a61e4d","Representative body":"#7048e8","Geography (LA)":"#868e96","Council internal":"#868e96"};
  var COLS={"officer":"#495057","member":"#a61e4d","committee":"#6741d9","practice":"#3bc9db","board":"#f59f00"};
  var KIND={"governance":"#212529","officer":"#1c7ed6","political":"#e64980","commissioning":"#0ca678","funding":"#f08c00","membership":"#adb5bd","delivery":"#7048e8"};
  function nodeColor(d){return d.org?(COLS[d.subtype]||"#868e96"):(COLT[d.type]||"#888");}
  function nodeShape(d){ if(!d.org) return "ellipse"; if(d.subtype==="member") return "diamond"; if(d.subtype==="committee") return "round-hexagon"; if(d.subtype==="practice") return "ellipse"; if(d.subtype==="board") return "diamond"; return "round-rectangle";}
  function esc(s){return String(s==null?"":s).replace(/[&<>"]/g,function(c){return {"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;"}[c];});}

  // --- Geography lenses -------------------------------------------------------
  // A lens is a set of Tees Valley local-authority GSS codes. A node shows in a
  // lens if its area overlaps that set (context on) or is fully within it
  // (context off); regional/national and Tees-Valley-wide bodies are treated as
  // covering all LAs; external partners appear when connected to a shown node.
  var LA5=["E06000001","E06000002","E06000003","E06000004","E06000005"];
  var GEXP={ "south-tees":["E06000002","E06000003"], "north-tees":["E06000001","E06000004"],
             "cleveland":["E06000001","E06000002","E06000003","E06000004"], "E47000006":LA5 };
  var COVER_ALL={"E12000001":1,"E92000001":1};
  var LENS={ "tees-valley":LA5, "cleveland":["E06000001","E06000002","E06000003","E06000004"],
             "south-tees":["E06000002","E06000003"], "north-tees":["E06000001","E06000004"],
             "darlington":["E06000005"], "hartlepool":["E06000001"], "middlesbrough":["E06000002"],
             "redcar-cleveland":["E06000003"], "stockton":["E06000004"],
             "ceremonial-north-yorkshire":["E06000002","E06000003"],
             "ceremonial-county-durham":["E06000001","E06000004","E06000005"],
             // Westminster constituencies → the borough(s) they cover (borough-resolution)
             "constituency-redcar":["E06000003"],                                  // PCON E14001440
             "constituency-middlesbrough-south-east-cleveland":["E06000002","E06000003"],
             "constituency-middlesbrough-thornaby-east":["E06000002","E06000004"] };
  function areaSet(d){ var a=d.area; if(!a) return []; if(LA5.indexOf(a)>=0) return [a];
    if(GEXP[a]) return GEXP[a]; if(COVER_ALL[a]) return LA5.slice(); return []; }
  function lensAllowedSet(lensKey,contextOn,nodes,adj){
    var L=LENS[lensKey]||LA5, Lset={}; L.forEach(function(c){Lset[c]=1;});
    var allowed={};
    nodes.forEach(function(n){ var d=n.data, A=areaSet(d), ok=false;
      if(A.length){ ok=contextOn ? A.some(function(c){return Lset[c];})
                                  : A.every(function(c){return Lset[c];}); }
      if(ok) allowed[d.id]=1;
    });
    if(contextOn){ nodes.forEach(function(n){ var d=n.data; if(!d.external||allowed[d.id]) return;
      var nb=adj[d.id]||[]; for(var i=0;i<nb.length;i++){ if(allowed[nb[i]]){ allowed[d.id]=1; break; } } }); }
    return allowed;
  }

  var UI = ''
   + '<div class="rsm-header"><h2></h2><span class="rsm-sub" style="color:var(--rsm-muted);font-size:12.5px">Network map — bodies, boards, roles &amp; relationships</span>'
   + '<div class="rsm-stats"><span><b class="rsm-n">0</b> shown</span><span><b class="rsm-t">0</b> top-level</span><span><b class="rsm-v">0</b> to verify</span></div></div>'
   + '<aside>'
   + '<h3>Lens</h3><select class="rsm-field rsm-lens">'
   +   '<optgroup label="Administrative">'
   +     '<option value="tees-valley">Tees Valley (all five)</option>'
   +     '<option value="cleveland">Cleveland (four boroughs)</option>'
   +     '<option value="south-tees">South Tees</option>'
   +     '<option value="north-tees">North Tees</option>'
   +     '<option value="darlington">Darlington</option>'
   +     '<option value="hartlepool">Hartlepool</option>'
   +     '<option value="middlesbrough">Middlesbrough</option>'
   +     '<option value="redcar-cleveland">Redcar &amp; Cleveland</option>'
   +     '<option value="stockton">Stockton-on-Tees</option>'
   +   '</optgroup>'
   +   '<optgroup label="Ceremonial county">'
   +     '<option value="ceremonial-north-yorkshire">North Yorkshire</option>'
   +     '<option value="ceremonial-county-durham">County Durham</option>'
   +   '</optgroup>'
   +   '<optgroup label="Constituency">'
   +     '<option value="constituency-redcar">Redcar</option>'
   +     '<option value="constituency-middlesbrough-south-east-cleveland">Middlesbrough South &amp; East Cleveland</option>'
   +     '<option value="constituency-middlesbrough-thornaby-east">Middlesbrough &amp; Thornaby East</option>'
   +   '</optgroup>'
   + '</select>'
   + '<label class="rsm-toggle"><input type="checkbox" class="rsm-context" checked> Show wider context</label>'
   + '<h3>Search</h3><input class="rsm-field rsm-search" placeholder="Find anything…" autocomplete="off" list="">'
   + '<datalist class="rsm-names"></datalist>'
   + '<h3>Organisations</h3><div class="rsm-orgbtns"></div><button class="rsm-btn rsm-collapseall">Collapse all</button>'
   + '<h3>Node types</h3><div class="rsm-legend"></div>'
   + '<div class="rsm-li" style="cursor:default"><span class="rsm-sw" style="background:#495057"></span>Officer (internal)</div>'
   + '<div class="rsm-li" style="cursor:default"><span class="rsm-sw" style="background:#a61e4d;border-radius:50%"></span>Cabinet member (internal)</div>'
   + '<div class="rsm-li" style="cursor:default"><span class="rsm-sw" style="background:#f59f00"></span>Non-exec / board</div>'
   + '<div class="rsm-li" style="cursor:default"><span class="rsm-sw" style="background:#3bc9db;border-radius:50%"></span>GP practice</div>'
   + '<h3>Relationship type</h3>'
   + '<div class="rsm-kind"><span class="rsm-kl" style="border-top-color:#212529"></span>Governance &amp; accountability</div>'
   + '<div class="rsm-kind"><span class="rsm-kl" style="border-top-color:#1c7ed6"></span>Line management</div>'
   + '<div class="rsm-kind"><span class="rsm-kl" style="border-top-color:#e64980;border-top-style:dashed"></span>Political / portfolio oversight</div>'
   + '<div class="rsm-kind"><span class="rsm-kl" style="border-top-color:#0ca678"></span>Commissioning</div>'
   + '<div class="rsm-kind"><span class="rsm-kl" style="border-top-color:#f08c00"></span>Funding</div>'
   + '<div class="rsm-kind"><span class="rsm-kl" style="border-top-color:#adb5bd"></span>Membership &amp; representation</div>'
   + '<div class="rsm-kind"><span class="rsm-kl" style="border-top-color:#7048e8;border-top-style:dashed"></span>Partnership &amp; delivery</div>'
   + '<h3>System domain</h3><select class="rsm-field rsm-domain"><option value="">All domains</option></select>'
   + '<h3>Geography tier</h3><select class="rsm-field rsm-tier"><option value="">All tiers</option></select>'
   + '<h3>Layout</h3><select class="rsm-field rsm-layout"><option value="fcose">Tidy (fcose)</option><option value="cose">Force</option><option value="concentric">Concentric</option><option value="breadthfirst">Hierarchy</option></select>'
   + '<label class="rsm-toggle"><input type="checkbox" class="rsm-sizedeg" checked> Size by connections</label>'
   + '<button class="rsm-btn rsm-fit">Fit to screen</button><button class="rsm-btn rsm-reset">Reset</button>'
   + '</aside>'
   + '<div class="rsm-cy"></div>'
   + '<div class="rsm-hint">Click an organisation to expand its internal structure</div>'
   + '<div class="rsm-detail"></div>';

  function initMap(container){
    var title=container.getAttribute('data-title')||'';
    if(window.RCVDA_SYSTEM_MAP_DATA){ build(container,window.RCVDA_SYSTEM_MAP_DATA,title); return; }
    var src=container.getAttribute('data-src'); if(!src) return;
    var fb=container.getAttribute('data-fallback')||'';
    function fail(){ container.innerHTML='<p style="padding:1rem;color:#a15c00">Could not load map data.</p>'; }
    function load(url,onFail){
      fetch(url).then(function(r){ if(!r.ok) throw new Error('HTTP '+r.status); return r.json(); })
        .then(function(data){ build(container,data,title); })
        .catch(function(e){ onFail(); });
    }
    // Try the primary source (usually the CDN); on any failure fall back to the
    // bundled copy shipped in the plugin, so the map still renders if the CDN is
    // unreachable or the repo/ref isn't public yet.
    load(src,function(){ if(fb && fb!==src){ load(fb,fail); } else { fail(); } });
  }

  function build(container,data,title){
    container.innerHTML=UI;
    var q=function(s){return container.querySelector(s);};
    q('.rsm-header h2').textContent=title||'System map';

    // lens: initial scope from the shortcode (data-lens / data-context), switchable in the sidebar
    var lensKey=container.getAttribute('data-lens')||'tees-valley';
    if(!LENS[lensKey]) lensKey='tees-valley';
    var contextOn=(container.getAttribute('data-context')!=='off');
    if(q('.rsm-lens')){ q('.rsm-lens').value=lensKey; }
    if(q('.rsm-context')){ q('.rsm-context').checked=contextOn; }
    var adj={}; data.edges.forEach(function(e){ var s=e.data.source,t=e.data.target;
      (adj[s]=adj[s]||[]).push(t); (adj[t]=adj[t]||[]).push(s); });
    var lensAllowed=lensAllowedSet(lensKey,contextOn,data.nodes,adj);
    function recomputeLens(){ lensKey=q('.rsm-lens')?q('.rsm-lens').value:lensKey;
      contextOn=q('.rsm-context')?q('.rsm-context').checked:contextOn;
      lensAllowed=lensAllowedSet(lensKey,contextOn,data.nodes,adj); }
    var dlId='rsm-names-'+Math.random().toString(36).slice(2);
    q('.rsm-search').setAttribute('list',dlId); q('.rsm-names').id=dlId;

    var orgSet=[]; (function(){var seen={};data.nodes.forEach(function(n){var o=n.data.org;if(o&&!seen[o]){seen[o]=1;orgSet.push(o);}});})();
    var expanded={}, hiddenTypes={}, pcnOpen=false;

    var cy=window.cytoscape({container:q('.rsm-cy'),elements:data.nodes.concat(data.edges),wheelSensitivity:.2,
     style:[
      {selector:'node',style:{'background-color':function(e){return nodeColor(e.data());},'shape':function(e){return nodeShape(e.data());},'label':'data(label)','font-size':8,'color':'#2b2f33','text-wrap':'wrap','text-max-width':92,'text-valign':'bottom','text-margin-y':3,'border-width':function(e){return e.data('status')==='verify'?2:0;},'border-color':'#d9480f','border-style':'dashed'}},
      {selector:'node:parent',style:{'background-opacity':0.55,'background-color':'#eef1f5','border-width':1,'border-color':'#d4dae1','shape':'round-rectangle','text-valign':'top','text-halign':'center','text-margin-y':7,'font-size':9,'text-transform':'uppercase','color':'#8a94a0','padding':20}},
      {selector:'edge',style:{'width':function(e){return Math.max(1,e.data('weight')||1);},'line-color':function(e){return KIND[e.data('kind')]||'#c4cad2';},'line-style':function(e){var k=e.data('kind');return (k==='political'||k==='delivery')?'dashed':'solid';},'target-arrow-color':function(e){return KIND[e.data('kind')]||'#c4cad2';},'target-arrow-shape':'triangle','arrow-scale':.75,'curve-style':'bezier','opacity':.6}},
      {selector:'.rsm-faded',style:{'opacity':.07,'text-opacity':.04}},
      {selector:'.rsm-hl',style:{'opacity':1,'text-opacity':1}},
      {selector:'edge.rsm-hl',style:{'opacity':.95,'width':function(e){return Math.max(2,(e.data('weight')||1)+1);},'label':'data(label)','font-size':7.5,'color':'#495057','text-rotation':'autorotate','text-background-color':'#fff','text-background-opacity':.9,'text-background-padding':2}},
      {selector:'node.rsm-sel',style:{'border-width':3,'border-color':'#1f4e79','border-style':'solid'}}
     ]});

    var layouts={
      fcose:function(){return {name:'fcose',quality:'default',animate:true,animationDuration:500,randomize:true,nodeSeparation:75,packComponents:true,nodeRepulsion:6000,idealEdgeLength:70,padding:30};},
      cose:function(){return {name:'cose',animate:true,animationDuration:600,nodeRepulsion:5000,idealEdgeLength:60,gravity:1.3,nestingFactor:1.1,componentSpacing:70,padding:30};},
      concentric:function(){return {name:'concentric',concentric:function(n){return n.connectedEdges(':visible').length;},levelWidth:function(){return 2;},minNodeSpacing:22,padding:30,animate:true};},
      breadthfirst:function(){return {name:'breadthfirst',directed:true,spacingFactor:1.05,padding:30,animate:true};}
    };
    function chosen(){var v=q('.rsm-layout').value; if(v==='fcose'&&!(window.cytoscapeFcose||window['cytoscape-fcose'])) v='cose'; return layouts[v]?layouts[v]():layouts.cose();}
    function relayout(){ cy.elements(':visible').layout(chosen()).run(); }

    function nodeVisible(n){var d=n.data(); if(!lensAllowed[d.id]) return false; if(d.org){ if(!expanded[d.org]) return false; } else { if(hiddenTypes[d.type]) return false; } var t=q('.rsm-tier').value; if(t&&d.tier!==t) return false; var g=q('.rsm-domain').value; if(g&&d.group!==g) return false; return true; }
    function sizeByDegree(on){ cy.nodes().forEach(function(n){ if(n.isParent()){return;} if(n.data('org')){ n.style({'width':20,'height':20,'font-size':7.5}); return; } var dg=n.connectedEdges(':visible').length; var s=on?16+dg*3.5:22; n.style({'width':s,'height':s,'font-size':Math.min(12,8+dg*0.4)}); }); }
    function apply(){ cy.batch(function(){ cy.nodes().forEach(function(n){ n.style('display',nodeVisible(n)?'element':'none'); }); cy.edges().forEach(function(e){ var v=e.source().style('display')==='element'&&e.target().style('display')==='element'; e.style('display',v?'element':'none'); }); }); sizeByDegree(q('.rsm-sizedeg').checked); stats(); orgBtns(); }
    function stats(){ q('.rsm-n').textContent=cy.nodes(':visible').length; q('.rsm-t').textContent=data.nodes.filter(function(n){return !n.data.org && lensAllowed[n.data.id];}).length; q('.rsm-v').textContent=data.nodes.filter(function(n){return n.data.status==='verify' && lensAllowed[n.data.id];}).length; }

    function toggleOrg(o){ expanded[o]=!expanded[o]; apply(); relayout(); }
    cy.on('tap','node',function(ev){ var n=ev.target,d=n.data(); if(!d.org&&orgSet.indexOf(d.id)>=0){ toggleOrg(d.id);} selectNode(n); });
    cy.on('tap',function(ev){ if(ev.target===cy) clearSel(); });
    function selectNode(n){ cy.elements().removeClass('rsm-hl rsm-faded rsm-sel'); cy.elements(':visible').addClass('rsm-faded'); n.closedNeighborhood(':visible').removeClass('rsm-faded').addClass('rsm-hl'); n.addClass('rsm-sel'); showDetail(n); }
    function clearSel(){ cy.elements().removeClass('rsm-hl rsm-faded rsm-sel'); container.classList.remove('rsm-detail-open'); }

    function relList(n,kind){ var out=[]; n.connectedEdges().forEach(function(ed){ if(ed.data('kind')!==kind) return; if(ed.source().style('display')!=='element'||ed.target().style('display')!=='element') return; var outgoing=ed.source().id()===n.id(); var other=outgoing?ed.target():ed.source(); out.push(outgoing?'<div class="rsm-rel"><span class="rsm-v">'+esc(ed.data('label'))+'</span> → '+esc(other.data('label'))+'</div>':'<div class="rsm-rel">'+esc(other.data('label'))+' <span class="rsm-v">'+esc(ed.data('label'))+'</span> → this</div>'); }); return out.join(''); }
    function showDetail(n){ var d=n.data(),col=nodeColor(d); var kn=d.org?(d.subtype==='officer'?'Officer':d.subtype==='member'?'Cabinet member':d.subtype==='practice'?'GP practice':d.subtype==='board'?'Non-executive / board':'Committee'):d.type;
      var h='<button class="rsm-cx" aria-label="Close">×</button><span class="rsm-tag" style="background:'+col+'">'+esc(kn)+'</span><h4>'+esc(d.label)+'</h4>';
      if(d.person) h+='<div class="rsm-person">'+esc(d.person)+'</div>';
      if(d.portfolio) h+='<div class="rsm-meta">Portfolio: '+esc(d.portfolio)+'</div>';
      if(d.org) h+='<div class="rsm-meta">Part of: '+esc(d.org)+'</div>';
      if(d.area_label) h+='<div class="rsm-meta">Area: '+esc(d.area_label)+(d.ceremonial?' · '+esc(d.ceremonial.replace(/-/g,' '))+' (ceremonial)':'')+'</div>';
      else if(d.geography) h+='<div class="rsm-meta">'+esc(d.geography)+(d.tier?' · '+esc(d.tier)+' tier':'')+'</div>';
      if(d.constituency) h+='<div class="rsm-meta">Constituency: '+esc(d.constituency)+'</div>';
      if(d.external) h+='<div class="rsm-meta">External partner (outside Tees Valley)</div>';
      if(d.description) h+='<div class="rsm-desc">'+esc(d.description)+'</div>';
      if(d.status==='verify') h+='<div class="rsm-vf">⚠ Flagged to verify</div>';
      if(d.source) h+='<div class="rsm-src"><a href="'+esc(d.source)+'" target="_blank" rel="noopener">Source ↗</a></div>';
      var RK=[['political','Political / portfolio oversight'],['governance','Governance & accountability'],['officer','Line management'],['commissioning','Commissioning'],['funding','Funding'],['membership','Membership & representation'],['delivery','Partnership & delivery']];
      var any=false; RK.forEach(function(rk){var r=relList(n,rk[0]); if(r){any=true; h+='<h5 class="rsm-h5">'+rk[1]+'</h5>'+r;}});
      if(!any) h+='<h5 class="rsm-h5">Connections</h5><div class="rsm-rel">None currently visible</div>';
      q('.rsm-detail').innerHTML=h; container.classList.add('rsm-detail-open');
      q('.rsm-cx').onclick=clearSel;
    }

    // tiers
    var tiers={}; data.nodes.forEach(function(n){if(n.data.tier)tiers[n.data.tier]=1;});
    Object.keys(tiers).sort().forEach(function(t){var o=document.createElement('option');o.value=t;o.textContent=t;q('.rsm-tier').appendChild(o);});
    var doms={}; data.nodes.forEach(function(n){if(n.data.group)doms[n.data.group]=(doms[n.data.group]||0)+1;});
    Object.keys(doms).sort().forEach(function(g){var o=document.createElement('option');o.value=g;o.textContent=g+' ('+doms[g]+')';q('.rsm-domain').appendChild(o);});
    // legend
    var counts={}; data.nodes.forEach(function(n){if(!n.data.org)counts[n.data.type]=(counts[n.data.type]||0)+1;});
    var legend=q('.rsm-legend');
    Object.keys(COLT).forEach(function(t){ if(!counts[t])return; var el=document.createElement('div'); el.className='rsm-li'; el.innerHTML='<span class="rsm-sw" style="background:'+COLT[t]+'"></span>'+esc(t)+'<span class="rsm-ct">'+counts[t]+'</span>'; el.onclick=function(){ if(hiddenTypes[t]){delete hiddenTypes[t];el.classList.remove('rsm-off');}else{hiddenTypes[t]=1;el.classList.add('rsm-off');} apply(); }; legend.appendChild(el); });
    // org buttons
    function orgCat(o){ if(/ PCN$/.test(o)) return 'Primary Care Networks'; if(o.indexOf('Council')>=0) return 'Councils'; if(o.indexOf('University Hospitals')>=0||o.indexOf('Foundation Trust')>=0) return 'NHS trusts & groups'; if(o.indexOf('HDRC')>=0) return 'Research'; return 'Other'; }
    function orgBtns(){
      var c=q('.rsm-orgbtns'); c.innerHTML='';
      var cats={}; orgSet.forEach(function(o){var k=orgCat(o);(cats[k]=cats[k]||[]).push(o);});
      var order=['Councils','NHS trusts & groups','Primary Care Networks','Research','Other'];
      function mkHd(txt){ var h=document.createElement('div'); h.style.cssText='font-size:10px;text-transform:uppercase;letter-spacing:.05em;color:#8a94a0;margin:9px 0 3px'; h.textContent=txt; return h; }
      function addBtn(o){ var b=document.createElement('button'); b.className='rsm-btn'; b.style.marginTop='4px'; b.textContent=(expanded[o]?'Collapse ':'Expand ')+o; b.onclick=function(){toggleOrg(o);}; c.appendChild(b); }
      order.forEach(function(cat){ if(!cats[cat])return;
        if(cat==='Primary Care Networks'){
          var h=mkHd((pcnOpen?'▾ ':'▸ ')+cat+' ('+cats[cat].length+')'); h.style.cursor='pointer';
          h.onclick=function(){pcnOpen=!pcnOpen; orgBtns();}; c.appendChild(h);
          var anyExp=cats[cat].some(function(o){return expanded[o];});
          var ba=document.createElement('button'); ba.className='rsm-btn'; ba.style.marginTop='4px';
          ba.textContent=anyExp?'Collapse all PCNs':'Expand all PCNs';
          ba.onclick=function(){ var v=!anyExp; cats[cat].forEach(function(o){expanded[o]=v;}); apply(); relayout(); }; c.appendChild(ba);
          if(pcnOpen) cats[cat].forEach(addBtn);
        } else { c.appendChild(mkHd(cat)); cats[cat].forEach(addBtn); }
      });
    }
    q('.rsm-collapseall').onclick=function(){ expanded={}; apply(); relayout(); };
    q('.rsm-tier').onchange=function(){ apply(); relayout(); };
    q('.rsm-domain').onchange=function(){ apply(); relayout(); };
    if(q('.rsm-lens')) q('.rsm-lens').onchange=function(){ recomputeLens(); apply(); relayout(); setTimeout(function(){cy.fit(cy.elements(':visible'),40);},650); };
    if(q('.rsm-context')) q('.rsm-context').onchange=function(){ recomputeLens(); apply(); relayout(); };
    q('.rsm-layout').onchange=relayout;
    q('.rsm-sizedeg').onchange=function(e){ sizeByDegree(e.target.checked); };
    q('.rsm-fit').onclick=function(){ cy.fit(cy.elements(':visible'),40); };
    q('.rsm-reset').onclick=function(){ expanded={}; hiddenTypes={}; q('.rsm-tier').value=''; q('.rsm-domain').value=''; container.querySelectorAll('.rsm-legend .rsm-li').forEach(function(e){e.classList.remove('rsm-off');}); clearSel(); apply(); relayout(); setTimeout(function(){cy.fit(cy.elements(':visible'),40);},650); };
    // search datalist
    var dl=q('.rsm-names'); data.nodes.forEach(function(n){var o=document.createElement('option');o.value=n.data.label;dl.appendChild(o);});
    q('.rsm-search').addEventListener('change',function(e){ var m=null; for(var i=0;i<data.nodes.length;i++){if(data.nodes[i].data.label===e.target.value){m=data.nodes[i];break;}} if(!m)return; if(m.data.org&&!expanded[m.data.org]){expanded[m.data.org]=1;apply();relayout();} var n=cy.getElementById(m.data.id); setTimeout(function(){cy.animate({center:{eles:n},zoom:1.3},{duration:400});selectNode(n);},m.data.org?650:0); });

    apply(); relayout();
  }

  function boot(){ var els=document.querySelectorAll('.rcvda-system-map'); for(var i=0;i<els.length;i++){ if(!els[i].getAttribute('data-inited')){ els[i].setAttribute('data-inited','1'); initMap(els[i]); } } }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',boot); else boot();
})();
