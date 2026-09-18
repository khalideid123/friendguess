// Real end-to-end database checks using only the same publishable key as the game.
// Creates isolated QA rooms; finally removes each test identity with leave_room.
import assert from 'node:assert/strict';
import {randomUUID,randomBytes} from 'node:crypto';
import {SUPABASE_URL,SUPABASE_KEY} from '../lib/supabase.js';
const people=Array.from({length:11},(_,i)=>({id:randomUUID(),secret:randomBytes(32).toString('hex'),name:i===1?'VeryLongNickname18':`QA-${i}-${randomBytes(2).toString('hex')}`}));
let roomId,code,checks=0;
const credentials=p=>({p_room_id:roomId,p_user_id:p.id,p_player_secret:p.secret});
async function rpc(name,args){const response=await fetch(`${SUPABASE_URL}/rest/v1/rpc/${name}`,{method:'POST',headers:{apikey:SUPABASE_KEY,'Content-Type':'application/json'},body:JSON.stringify(args)});const text=await response.text();return {ok:response.ok,data:text?JSON.parse(text):null,status:response.status};}
async function ok(name,args){const r=await rpc(name,args);assert(r.ok,`${name}: ${r.data?.message||r.status}`);return r.data;}
async function denied(name,args){const r=await rpc(name,args);assert(!r.ok,`${name} unexpectedly allowed`);return r;}
async function state(p){return ok('get_room_state',credentials(p));}
function pass(message){checks++;console.log(`PASS ${message}`);}
try{
 await denied('create_room',{p_nickname:'x'.repeat(19),p_rounds_total:2,p_user_id:people[0].id,p_player_secret:people[0].secret});
 await denied('create_room',{p_nickname:'   ',p_rounds_total:2,p_user_id:people[0].id,p_player_secret:people[0].secret});pass('nickname validation');
 const created=await ok('create_room',{p_nickname:people[0].name,p_rounds_total:2,p_user_id:people[0].id,p_player_secret:people[0].secret});roomId=created[0].room_id;code=created[0].room_code;assert.match(code,/^[A-Z0-9]{5}$/);pass('create room with five-character code');
 await denied('get_room_state',{...credentials(people[0]),p_player_secret:'wrong-secret'});pass('player-secret verification');
 await denied('join_room',{p_code:'XXXXX',p_nickname:people[1].name,p_user_id:people[1].id,p_player_secret:people[1].secret});pass('room validation');
 await denied('join_room',{p_code:code,p_nickname:people[0].name,p_user_id:people[1].id,p_player_secret:people[1].secret});pass('duplicate nickname rejected');
 for(const p of people.slice(1,10))await ok('join_room',{p_code:code,p_nickname:p.name,p_user_id:p.id,p_player_secret:p.secret});
 await denied('join_room',{p_code:code,p_nickname:people[10].name,p_user_id:people[10].id,p_player_secret:people[10].secret});assert.equal((await state(people[0])).players.length,10);pass('multiple players, long nickname and maximum of 10');
 await denied('join_room',{p_code:code,p_nickname:people[0].name,p_user_id:people[0].id,p_player_secret:people[1].secret});pass('cannot hijack another player identity');
 await denied('start_game',{...credentials(people[1]),p_question:'Question',p_rounds_total:2});pass('only host can start');
 await ok('start_game',{...credentials(people[0]),p_question:'Question',p_rounds_total:2});let s=await state(people[0]);let round=s.currentRound;assert.equal(s.room.status,'playing');assert.equal(round.answerer_user_id,people[0].id);pass('game start and first Answerer');
 const rc=p=>({p_round_id:round.id,p_user_id:p.id,p_player_secret:p.secret});
 await denied('lock_answer',{...rc(people[1]),p_answer:'violet',p_hint:'A color'});pass('only Answerer can lock');
 await ok('lock_answer',{...rc(people[0]),p_answer:'violet',p_hint:'A color'});s=await state(people[1]);assert.equal(s.mySecret,null);assert.equal(s.currentRound.revealed_answer,null);assert.equal(s.currentRound.hint,'A color');assert.equal((await state(people[0])).mySecret,'violet');pass('secret answer stays hidden from guessers; hint visible');
 await denied('ai_guess_context',{...credentials(people[1]),p_round_id:round.id});
 const secretResponse=await fetch(`${SUPABASE_URL}/rest/v1/secret_answers?round_id=eq.${round.id}&select=answer`,{headers:{apikey:SUPABASE_KEY}});const secretText=await secretResponse.text();assert(!secretResponse.ok||secretText==='[]');pass('AI context and direct table cannot leak answer');
 await denied('submit_guess',{...credentials(people[0]),p_round_id:round.id,p_guess:'violet'});pass('Answerer cannot guess');
 await ok('submit_guess',{...credentials(people[1]),p_round_id:round.id,p_guess:'red'});s=await state(people[0]);assert.equal(s.currentRound.status,'guessing');assert.equal(s.guesses[0].is_correct,false);pass('wrong guess leaves round active');
 const raced=await Promise.all([1,2].map(i=>rpc('submit_guess',{...credentials(people[i]),p_round_id:round.id,p_guess:'violet'})));assert(raced.some(r=>r.ok));s=await state(people[0]);assert.equal(s.currentRound.status,'complete');assert.equal(s.currentRound.revealed_answer,'violet');const scoring=s.players.filter(p=>p.score>0);assert.equal(scoring.length,1);assert(scoring[0].score>=100&&scoring[0].score<=160);assert.equal(s.guesses.filter(g=>g.is_correct).length,1);pass('concurrent correct guesses award exactly one winner');
 await denied('next_round',{...credentials(people[1]),p_question:'Next'});pass('only host can advance');
 await ok('next_round',{...credentials(people[0]),p_question:'Next'});s=await state(people[1]);round=s.currentRound;assert.equal(round.answerer_user_id,people[1].id);pass('Answerer rotates');
 await ok('lock_answer',{...rc(people[1]),p_answer:'pizza',p_hint:'A food'});await ok('finish_round_timeout',rc(people[0]));assert.equal((await state(people[0])).currentRound.status,'guessing');pass('cannot end timer early');
 console.log('Waiting for a real 60-second round to expire…');
 const end=new Date((await state(people[0])).currentRound.ends_at).getTime();
 while(Date.now()<end+350)await new Promise(resolve=>setTimeout(resolve,Math.min(5000,end+350-Date.now())));
 await ok('finish_round_timeout',rc(people[0]));s=await state(people[2]);assert.equal(s.currentRound.status,'complete');assert.equal(s.currentRound.revealed_answer,'pizza');pass('real timer expiration reveals answer without a winner');
 await ok('next_round',{...credentials(people[0]),p_question:'Next'});s=await state(people[0]);assert.equal(s.room.status,'finished');assert(s.players.some(p=>p.score>0));pass('final leaderboard');
 await denied('reset_room',credentials(people[1]));await ok('reset_room',credentials(people[0]));s=await state(people[0]);assert.equal(s.room.status,'lobby');assert(s.players.every(p=>p.score===0));assert.equal(s.currentRound,null);pass('host reset and cleared scores');
 await denied('kick_player',{p_room_id:roomId,p_host_user_id:people[1].id,p_host_player_secret:people[1].secret,p_target_user_id:people[2].id});
 await ok('kick_player',{p_room_id:roomId,p_host_user_id:people[0].id,p_host_player_secret:people[0].secret,p_target_user_id:people[9].id});await denied('get_room_state',credentials(people[9]));assert.equal((await state(people[0])).players.length,9);pass('host-only kicking revokes membership');
 await ok('leave_room',credentials(people[8]));assert.equal((await state(people[0])).players.length,8);pass('player leaving removes membership');
 await ok('start_game',{...credentials(people[0]),p_question:'Question',p_rounds_total:2});
 await ok('leave_room',credentials(people[0]));s=await state(people[1]);assert.equal(s.room.host_user_id,people[1].id);assert.equal(s.currentRound.status,'complete');pass('host / Answerer leaving transfers host and resolves round');
 await ok('next_round',{...credentials(people[1]),p_question:'Next'});pass('new host can advance');
 await ok('reset_room',credentials(people[1]));pass('new host can reset');
 console.log(`${checks} real multiplayer checks passed.`);
}finally{
 if(roomId){for(const p of people)await rpc('leave_room',credentials(p));console.log('QA room cleanup requested for every test identity.');}
}
