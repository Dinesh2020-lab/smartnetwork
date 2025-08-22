// Stage setup
const stage = new Konva.Stage({
  container: document.body,
  width: window.innerWidth,
  height: window.innerHeight,
});
const layer = new Konva.Layer();
stage.add(layer);

const tooltip = document.getElementById('tooltip');
const modal = document.getElementById('modal');

let nodes = [];
let links = [];
let linkMode = false;
let linkStart = null;
let previewLine = null;

// Predefined campus buildings
const buildings = [
  {name:"CSC Building",x:150,y:150,color:"#2196f3"},
  {name:"ECE Building",x:450,y:150,color:"#f44336"},
  {name:"Mechanical Building",x:150,y:350,color:"#ff9800"},
  {name:"Civil Building",x:450,y:350,color:"#9c27b0"},
  {name:"Library",x:300,y:550,color:"#4caf50"}
];

// Node creation
function createNode(data,type="building"){
  const group = new Konva.Group({x:data.x,y:data.y,draggable:true});
  const circle = new Konva.Circle({
    radius:30, fill:data.color, stroke:'#fff', strokeWidth:3,
    shadowColor:'black', shadowBlur:8, shadowOffset:{x:2,y:2}, shadowOpacity:0.5
  });
  const label = new Konva.Text({
    text:data.name, fontSize:14, fill:'#fff', offsetY:40, width:120, align:'center'
  });
  group.add(circle); group.add(label);

  // AP coverage
  let coverage=null;
  if(type==="AP"){
    coverage=new Konva.Circle({
      radius:100, fill:'rgba(0,255,255,0.15)', stroke:'cyan', strokeWidth:2
    });
    group.add(coverage); coverage.moveToBottom();
  }

  layer.add(group);

  // Hover tooltip
  group.on('mouseover',()=>{ tooltip.style.display='block'; tooltip.innerText=data.name+" ("+type+")"; });
  group.on('mousemove',(e)=>{ tooltip.style.left=e.evt.clientX+10+'px'; tooltip.style.top=e.evt.clientY+10+'px'; });
  group.on('mouseout',()=>{ tooltip.style.display='none'; });

  // Click for link or modal
  group.on('click',()=>{
    if(linkMode){
      if(!linkStart){ linkStart=group; createPreviewLine(linkStart); }
      else if(linkStart!==group){ createLink(linkStart,group); linkStart=null; if(previewLine){previewLine.destroy(); previewLine=null;} }
    } else { showModal(data,type,group.x(),group.y()); }
  });

  group.on('dragmove',()=>updateLinks());

  nodes.push({group,data,type});
  layer.draw();
}

// Show node modal
function showModal(data,type,x,y){
  modal.style.display='block';
  modal.style.left=(x+50)+'px';
  modal.style.top=(y-50)+'px';
  modal.innerHTML=`<h3>${data.name} (${type})</h3>
  <p>IP: 192.168.${Math.floor(Math.random()*255)}.${Math.floor(Math.random()*255)}</p>
  <p>MAC: 00:1B:44:11:3A:${Math.floor(Math.random()*90+10)}</p>
  <p>Connected Devices: ${Math.floor(Math.random()*20)}</p>`;
  setTimeout(()=>{ modal.style.display='none'; },3000);
}

// Link creation
function createLink(nodeA,nodeB){
  const line = new Konva.Line({
    points:[nodeA.x()+nodeA.width()/2,nodeA.y()+nodeA.height()/2,nodeB.x()+nodeB.width()/2,nodeB.y()+nodeB.height()/2],
    stroke:'yellow', strokeWidth:3, shadowColor:'yellow', shadowBlur:8
  });
  layer.add(line); links.push({line,from:nodeA,to:nodeB}); layer.draw();
}

// Preview line
function createPreviewLine(startNode){
  previewLine=new Konva.Line({
    points:[startNode.x()+startNode.width()/2,startNode.y()+startNode.height()/2,startNode.x()+startNode.width()/2,startNode.y()+startNode.height()/2],
    stroke:'lime', dash:[10,5], strokeWidth:2
  });
  layer.add(previewLine);
}

// Mouse move for preview
stage.on('mousemove',e=>{
  if(previewLine && linkStart){
    const pos = stage.getPointerPosition();
    previewLine.points([linkStart.x()+linkStart.width()/2,linkStart.y()+linkStart.height()/2,pos.x,pos.y]);
    layer.batchDraw();
  }
});

// Update links on drag
function updateLinks(){
  links.forEach(l=>l.line.points([l.from.x()+l.from.width()/2,l.from.y()+l.from.height()/2,l.to.x()+l.to.width()/2,l.to.y()+l.to.height()/2]));
  layer.batchDraw();
}

// Animate traffic
function animateTraffic(line){
  const points=line.points();
  const circle=new Konva.Circle({radius:6,fill:'red',shadowColor:'red',shadowBlur:5});
  layer.add(circle);
  let t=0;
  const speed=0.01+Math.random()*0.02;
  const anim=new Konva.Animation(frame=>{
    t+=speed; if(t>1) t=0;
    const x=points[0]+(points[2]-points[0])*t;
    const y=points[1]+(points[3]-points[1])*t;
    circle.x(x); circle.y(y);
    // Traffic heatmap effect
    const ratio=Math.random();
    line.stroke(ratio>0.7?'red':ratio>0.3?'yellow':'green');
  },layer);
  anim.start();
}

// Initialize buildings
buildings.forEach(b=>createNode(b));

// Toolbar buttons
document.getElementById('addServer').onclick=()=>createNode({name:"Server",x:Math.random()*500+50,y:Math.random()*400+50,color:"#00bcd4"},"Server");
document.getElementById('addSwitch').onclick=()=>createNode({name:"Switch",x:Math.random()*500+50,y:Math.random()*400+50,color:"#ffeb3b"},"Switch");
document.getElementById('addAP').onclick=()=>createNode({name:"Access Point",x:Math.random()*500+50,y:Math.random()*400+50,color:"#e91e63"},"AP");
document.getElementById('linkMode').onclick=e=>{linkMode=!linkMode;e.target.innerText="Link Mode: "+(linkMode?"On":"Off"); if(!linkMode && previewLine){previewLine.destroy();previewLine=null;layer.draw();}};
document.getElementById('clear').onclick=()=>{layer.destroyChildren();nodes=[];links=[];previewLine=null;buildings.forEach(b=>createNode(b));};
document.getElementById('simulate').onclick=()=>{links.forEach(l=>animateTraffic(l.line));};

// Responsive
window.addEventListener('resize',()=>{stage.width(window.innerWidth);stage.height(window.innerHeight);updateLinks();});