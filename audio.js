import {musicProfile} from './ambience.js';
import {points} from './universe.js';
// Original, sparse chiptune motifs. All sound is synthesized locally after opt-in.
export function createSoundscape(){
 let ctx,master,engine,engineGain,enabled=false,nextNote=0,note=0,place='',systemId='',lastDock=null,nextMine=0,lastClick=0;
 const motifs={station:[48,55,60,64,55,62,60,55],belt:[45,52,57,60,52,59,57,52],space:[41,48,53,60,48,55,53,48]};
 function tone(freq,duration,level=.06,type='triangle',delay=0){if(!enabled||!ctx||ctx.state!=='running')return;const at=ctx.currentTime+delay,o=ctx.createOscillator(),g=ctx.createGain();o.type=type;o.frequency.value=freq;g.gain.setValueAtTime(0,at);g.gain.linearRampToValueAtTime(level,at+.025);g.gain.exponentialRampToValueAtTime(.0001,at+duration);o.connect(g);g.connect(master);o.start(at);o.stop(at+duration+.02);o.onended=()=>{o.disconnect();g.disconnect();};}
 function cue(kind){if(kind==='dock'){tone(196,.6);tone(294,.8,.04,'triangle',.2);}else if(kind==='launch'){tone(147,.5);tone(220,.6,.04,'triangle',.15);}else if(kind==='click'&&ctx?.currentTime-lastClick>.07){lastClick=ctx.currentTime;tone(660,.07,.025,'square');}}
 async function toggle(){if(enabled){enabled=false;master.gain.setTargetAtTime(0,ctx.currentTime,.04);return false;}if(!ctx){const A=globalThis.AudioContext||globalThis.webkitAudioContext;if(!A)throw Error('Audio indisponible');ctx=new A();master=ctx.createGain();master.gain.value=0;master.connect(ctx.destination);engine=ctx.createOscillator();engine.type='triangle';engine.frequency.value=48;engineGain=ctx.createGain();engineGain.gain.value=0;engine.connect(engineGain);engineGain.connect(master);engine.start();}await ctx.resume();enabled=true;master.gain.setTargetAtTime(.32,ctx.currentTime,.1);nextNote=ctx.currentTime+.1;nextMine=ctx.currentTime;lastDock=null;return true;}
 function update(w,controls){if(!enabled||!ctx||ctx.state!=='running')return;const t=ctx.currentTime,s=w.ship,zone=s.docked||points(w).some(p=>p.kind==='port'&&Math.hypot(s.x-p.x,s.y-p.y)<300)?'station':w.asteroids.some(a=>Math.hypot(s.x-a.x,s.y-a.y)<320)?'belt':'space';if(zone!==place||systemId!==w.systemId){systemId=w.systemId;place=zone;note=0;nextNote=t+.4;}
 if(lastDock!==null&&lastDock!==s.docked)cue(s.docked?'dock':'launch');lastDock=s.docked;
 const thrust=!s.docked&&s.fuel>0&&(controls.thrust||controls.reverse||controls.brake);engineGain.gain.setTargetAtTime(thrust?.11:0,t,.12);engine.frequency.setTargetAtTime(controls.brake?38:48+Math.min(24,Math.hypot(s.vx,s.vy)/14),t,.15);
 if(t>=nextNote){const profile=musicProfile(w.systemId),midi=motifs[place][(note++ + profile.motifShift)%8]+profile.transpose;tone(440*2**((midi-69)/12),2.8,.07,profile.wave);if(note%4===1)tone(440*2**((midi+12-69)/12),1.6,.016,'square',.2);nextNote=t+(place==='space'?2.8:2.1)*profile.tempo;}
 if(w.extracting&&t>=nextMine){tone(110+(note%3)*27.5,.14,.04,'square');nextMine=t+.32;}}
 document.addEventListener('visibilitychange',()=>{if(!ctx)return;if(document.hidden){ctx.suspend().catch(()=>{});}else if(enabled){ctx.resume().then(()=>{nextNote=ctx.currentTime+.3;}).catch(()=>{});}});
 return {toggle,update,cue};
}
