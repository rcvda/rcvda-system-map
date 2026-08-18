import os
ROOT=os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PLUG=os.path.join(ROOT,"plugin","rcvda-system-map")
css=open(os.path.join(PLUG,"assets/css/system-map.css")).read()
js=open(os.path.join(PLUG,"assets/js/system-map.js")).read()
libs=[open(os.path.join(PLUG,"assets/js/vendor",f)).read() for f in ["cytoscape.min.js","layout-base.js","cose-base.js","cytoscape-fcose.js"]]
# The plugin's bundled copy is the single on-disk data file (refreshed from the data repo by build.sh).
data=open(os.path.join(PLUG,"assets/data","system-data.json")).read()
h=('<!DOCTYPE html><html lang="en"><head><meta charset="utf-8">'
   '<meta name="viewport" content="width=device-width, initial-scale=1">'
   '<title>Tees Valley Public System — Network Map</title>'
   '<style>html,body{margin:0;height:100%}.rcvda-system-map{border:0;border-radius:0}</style>'
   '<style>'+css+'</style></head><body>'
   '<div class="rcvda-system-map" data-title="Tees Valley Public System" style="height:100vh"></div>'
   '<script>window.RCVDA_SYSTEM_MAP_DATA='+data+';</script>')
for L in libs: h+='<script>'+L+'</script>'
h+='<script>'+js+'</script></body></html>'
open(os.path.join(ROOT,"dist","tees-valley-public-system-map.html"),"w").write(h)
print("standalone rebuilt")
