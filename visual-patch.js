/* visual-patch.js - overrides visuals/settings after app.js. Load after app.js. */
(function(){
  function safe(){return typeof state!=="undefined" && typeof BIO!=="undefined";}
  if(!safe()) return;
  // Migrate old saved machine model. Lowest track on the real unit is around 3 ft, not floor.
  state.gym.trackBottomIn = (state.gym.trackBottomIn && state.gym.trackBottomIn>24) ? state.gym.trackBottomIn : 36;
  state.gym.trackTopIn = state.gym.trackTopIn || 76;
  state.gym.armLenIn = state.gym.armLenIn || 30;
  state.gym.tracks = 8; state.gym.armAngles=11; state.gym.armDepth=5;
  state.gym.dumbbells = state.gym.dumbbells || [3,5,8,10,12];
  state.gym.attachments = state.gym.attachments || ["d-handle","rope","straight-bar","v-bar","lat-bar","ankle-strap"];
  var oldMach=mach;
  window.mach=function(){var g=state.gym;return {tracks:g.tracks,trackTopIn:g.trackTopIn,trackBottomIn:g.trackBottomIn,armLenIn:g.armLenIn,armAngles:g.armAngles,armDepth:g.armDepth,stackMin:g.min,stackMax:g.max,stackInc:g.inc};};
  window.figureCard=function(e){
    if(!e.setup||!BIO.hasMove(e.id)) return zoneCard(e);
    var s=BIO.solve(e.id,hIn(),mach());
    return '<div class="figure-card">'+figSvg(s,false)+
      '<div class="setrow"><div class="setpill"><b>'+s.track+' / 8</b><small>Track mount</small></div><div class="setpill"><b>'+s.ang+' / 11</b><small>Arm tilt</small></div><div class="setpill"><b>'+s.dep+' / 5</b><small>Arm in-out</small></div></div>'+ 
      '<div class="callout" style="border-radius:14px;margin-top:10px;border:1px solid var(--line)"><span class="badge">Set up</span><span class="txt">'+esc(s.instruction)+'</span></div></div>';
  };
  window.figSvg=function(s,mini){
    var W=340,H=mini?150:280,floorY=H-20,pad=16,m=s.machine;
    var topIn=Math.max(m.trackTopIn,s.userHeightIn*1.25)+4;
    var ppi=(floorY-pad)/topIn; function y(v){return floorY-v*ppi;}
    var towerLeft=(s.posture==="lying"&&s.headToMachine), towerX=towerLeft?42:298;
    var mountY=y(s.mountIn), drawn=drawBody(s,y,floorY,mini,towerX,towerLeft);
    var svg='<svg class="fig" viewBox="0 0 '+W+' '+H+'" preserveAspectRatio="xMidYMid meet">';
    svg+='<line class="floor" x1="10" y1="'+floorY+'" x2="'+(W-10)+'" y2="'+floorY+'"></line>';
    // The numbered track is only the vertical mount rail, ending around 3 ft; faded lower post shows the frame below it.
    svg+='<rect class="tower" x="'+(towerX-10)+'" y="'+y(m.trackTopIn)+'" width="20" height="'+(y(m.trackBottomIn)-y(m.trackTopIn))+'" rx="6"></rect>';
    svg+='<line class="rail" x1="'+towerX+'" y1="'+y(m.trackTopIn)+'" x2="'+towerX+'" y2="'+y(m.trackBottomIn)+'"></line>';
    svg+='<line class="rail" x1="'+towerX+'" y1="'+y(m.trackBottomIn)+'" x2="'+towerX+'" y2="'+floorY+'" style="opacity:.25"></line>';
    if(!mini){for(var t=1;t<=m.tracks;t++){var ty=y(BIO.trackHeight(t,m)),on=t===s.track,lx=towerLeft?towerX+14:towerX-14;svg+='<circle class="tickdot '+(on?'on':'')+'" cx="'+lx+'" cy="'+ty+'" r="'+(on?4:2.5)+'"></circle><text class="tt '+(on?'on':'')+'" x="'+(towerLeft?lx+8:lx-8)+'" y="'+(ty+3)+'" text-anchor="'+(towerLeft?'start':'end')+'">'+t+'</text>';}}
    // This is the real concept: rigid metal arm from the vertical mount to the handle. No floor contact.
    svg+='<line class="arm" x1="'+towerX+'" y1="'+mountY+'" x2="'+drawn.hx+'" y2="'+drawn.hy+'"></line><circle class="pivot" cx="'+towerX+'" cy="'+mountY+'" r="5"></circle>';
    svg+=drawn.svg+'<circle class="handle" cx="'+drawn.hx+'" cy="'+drawn.hy+'" r="7"></circle>';
    if(!mini) svg+='<text class="cap g" x="'+towerX+'" y="'+(mountY-10)+'" text-anchor="middle">track '+s.track+'</text>';
    return svg+'</svg>';
  };
  window.drawBody=function(s,y,floorY,mini,towerX,towerLeft){
    var h=s.userHeightIn; function limb(x1,y1,x2,y2){return '<path class="limb" d="M '+x1+' '+y1+' L '+x2+' '+y2+'"></path>';}
    var handleY=y(s.handleIn);
    if(s.posture==="lying"){
      var benchY=y(18),headX=towerX+46,feetX=headX+150,bx0=headX-8,bx1=feetX+6,torsoY=benchY-2,svg='';
      svg+='<rect class="bench" x="'+bx0+'" y="'+benchY+'" width="'+(bx1-bx0)+'" height="8" rx="4"></rect><line class="bench-leg" x1="'+(bx0+12)+'" y1="'+(benchY+8)+'" x2="'+(bx0+6)+'" y2="'+floorY+'"></line><line class="bench-leg" x1="'+(bx1-12)+'" y1="'+(benchY+8)+'" x2="'+(bx1-6)+'" y2="'+floorY+'"></line>';
      svg+='<rect class="body" x="'+(headX+8)+'" y="'+(torsoY-11)+'" width="64" height="20" rx="10"></rect><circle class="body" cx="'+headX+'" cy="'+(torsoY-1)+'" r="10"></circle>';
      svg+=limb(headX+72,torsoY,feetX-6,torsoY-2)+limb(feetX-6,torsoY-2,feetX+2,floorY-2);
      var chestX=headX+22,hx=chestX+26,hy=Math.min(torsoY-18,handleY); svg+=limb(chestX,torsoY-6,hx,hy)+limb(chestX+8,torsoY-6,hx-2,hy+2); return {svg:svg,hx:hx,hy:hy};
    }
    if(s.posture==="seated"){
      var benchY=y(18),bodyX=180,hipY=benchY-2,shoulderY=hipY-52,crownY=shoulderY-22,svg='';
      svg+='<rect class="bench" x="'+(bodyX-32)+'" y="'+benchY+'" width="62" height="8" rx="4"></rect><line class="bench-leg" x1="'+(bodyX-24)+'" y1="'+(benchY+8)+'" x2="'+(bodyX-29)+'" y2="'+floorY+'"></line><line class="bench-leg" x1="'+(bodyX+20)+'" y1="'+(benchY+8)+'" x2="'+(bodyX+25)+'" y2="'+floorY+'"></line>';
      svg+='<rect class="body" x="'+(bodyX-11)+'" y="'+shoulderY+'" width="22" height="'+(hipY-shoulderY)+'" rx="10"></rect><circle class="body" cx="'+bodyX+'" cy="'+(crownY+10)+'" r="10"></circle>';
      svg+=limb(bodyX-4,hipY,bodyX-40,hipY+2)+limb(bodyX-40,hipY+2,bodyX-44,floorY); var hx=bodyX-42,hy=handleY; svg+=limb(bodyX,shoulderY+8,hx,hy); return {svg:svg,hx:hx,hy:hy};
    }
    if(s.posture==="kneel"||s.posture==="half-kneel"){
      var bodyX=180,kneeY=y(6),hipY=kneeY-(s.posture==="kneel"?38:44),shoulderY=hipY-48,crownY=shoulderY-20,svg='';
      svg+='<rect class="body" x="'+(bodyX-11)+'" y="'+shoulderY+'" width="22" height="'+(hipY-shoulderY)+'" rx="10"></rect><circle class="body" cx="'+bodyX+'" cy="'+(crownY+10)+'" r="10"></circle>';
      if(s.posture==="kneel") svg+=limb(bodyX-4,hipY,bodyX-16,floorY)+limb(bodyX+4,hipY,bodyX+16,floorY); else svg+=limb(bodyX-4,hipY,bodyX-26,y(3))+limb(bodyX-26,y(3),bodyX-30,floorY)+limb(bodyX+4,hipY,bodyX+14,floorY);
      var hx=bodyX-8,hy=handleY; svg+=limb(bodyX,shoulderY+6,hx,hy); return {svg:svg,hx:hx,hy:hy};
    }
    var bodyX=168,crownY=y(h),shoulderY=y(h*.82),hipY=y(h*.5),hr=Math.max(8,(shoulderY-crownY)/2.2),toward=s.face==="toward",side=s.face==="side";
    var hx=toward?bodyX-42:(side?bodyX+40:bodyX+48),hy=handleY;
    var torso='M '+(bodyX-13)+' '+shoulderY+' Q '+(bodyX-16)+' '+((shoulderY+hipY)/2)+' '+(bodyX-9)+' '+hipY+' L '+(bodyX+9)+' '+hipY+' Q '+(bodyX+16)+' '+((shoulderY+hipY)/2)+' '+(bodyX+13)+' '+shoulderY+' Q '+bodyX+' '+(shoulderY-6)+' '+(bodyX-13)+' '+shoulderY+' Z';
    var svg=limb(bodyX-6,hipY,bodyX-12,floorY)+limb(bodyX+6,hipY,bodyX+12,floorY)+'<path class="body" d="'+torso+'"></path><circle class="body" cx="'+bodyX+'" cy="'+(crownY+hr)+'" r="'+hr+'"></circle>'+limb(bodyX,shoulderY+2,hx,hy);
    return {svg:svg,hx:hx,hy:hy};
  };
  window.sheetMachine=function(){
    openSheet('<h3>Apex Free-Arm Trainer</h3><p class="sub">These drive every setup the app shows.</p><div class="legend"><b>Your machine\u2019s levers</b><div><b>Track 1\u20138</b> \u2014 vertical ARM MOUNT height. 1 = highest, 8 = lowest (~3 ft, not floor).</div><div><b>Arm tilt 1\u201311</b> \u2014 swings the metal arm up/down from that mount.</div><div><b>Arm in/out 1\u20135</b> \u2014 how far out the arm reaches.</div><div>The <b>handle at the arm end</b> is what you line up with your body. The arm never should be drawn as touching the floor.</div></div><div class="field-2"><div class="field"><label>Highest track height (in)</label><input id="m-top" inputmode="numeric" value="'+state.gym.trackTopIn+'"></div><div class="field"><label>Lowest track height (in)</label><input id="m-bot" inputmode="numeric" value="'+state.gym.trackBottomIn+'"></div></div><div class="field"><label>Arm length (in)</label><input id="m-arm" inputmode="numeric" value="'+state.gym.armLenIn+'"></div><div class="field-3"><div class="field"><label>Stack min</label><input id="m-min" inputmode="numeric" value="'+state.gym.min+'"></div><div class="field"><label>Stack max</label><input id="m-max" inputmode="numeric" value="'+state.gym.max+'"></div><div class="field"><label>Step</label><input id="m-inc" inputmode="numeric" value="'+state.gym.inc+'"></div></div><div class="sheet-actions"><button class="btn primary block" onclick="saveMachine()">Save</button></div>');
  };
  window.saveMachine=function(){state.gym.trackTopIn=+el("m-top").value||76;state.gym.trackBottomIn=+el("m-bot").value||36;state.gym.armLenIn=+el("m-arm").value||30;state.gym.min=+el("m-min").value||10;state.gym.max=+el("m-max").value||200;state.gym.inc=+el("m-inc").value||10;closeSheet();render();};
  save();
  if(typeof render==="function") render();
})();
