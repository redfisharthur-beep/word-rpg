import {DurableObject} from 'cloudflare:workers';
import {SOCIAL_HISTORY_LIMIT,SOCIAL_RATE_MS,SOCIAL_REQUEST_LIMIT,SOCIAL_FRIEND_LIMIT,safeMessage,canSend,socialName,validFriendCode,socialPublicMessage} from './social-rules.js';

const json=(value,status=200)=>new Response(JSON.stringify(value),{status,headers:{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store'}});
const identity=request=>({id:request.headers.get('X-Social-User')||'',code:request.headers.get('X-Social-Code')||''});
const userKey=id=>'member:'+id;
const codeKey=code=>'friend-code:'+code;
const blank=()=>({friends:[],incoming:[],outgoing:[],blocked:[],lastRequestAt:0,lastMessageAt:0});
const unique=list=>[...new Set(Array.isArray(list)?list.filter(x=>typeof x==='string'):[])];
const cleanRecord=raw=>({...blank(),friends:unique(raw?.friends).slice(0,SOCIAL_FRIEND_LIMIT),incoming:unique(raw?.incoming).slice(0,SOCIAL_REQUEST_LIMIT),outgoing:unique(raw?.outgoing).slice(0,SOCIAL_REQUEST_LIMIT),blocked:unique(raw?.blocked).slice(0,150),lastRequestAt:Number(raw?.lastRequestAt)||0,lastMessageAt:Number(raw?.lastMessageAt)||0});
const upsert=(items,id)=>unique([...items,id]);
const drop=(items,id)=>items.filter(value=>value!==id);
const publicChat=(m,blocked)=>m.filter(msg=>!blocked.includes(msg.authorId)).map(msg=>({...socialPublicMessage(msg),...(msg.kind==='duel'&&/^[0-9a-f-]{36}$/.test(msg.room||'')?{kind:'duel',room:msg.room}:{})}));
const textLimit=(value,max)=>typeof value==='string'?value.slice(0,max):'';

export class SocialHub extends DurableObject {
  constructor(ctx,env){super(ctx,env);this.ctx=ctx;this.env=env}
  async profile(id){return cleanRecord(await this.ctx.storage.get(userKey(id)))}
  async publicProfile(id){const code=await this.ctx.storage.get('code-for:'+id);return {code:code||'',name:socialName(code||'??????')}}
  async ensureIdentity(id,code){
    if(!id||!validFriendCode(code))return;
    const existing=await this.ctx.storage.get('code-for:'+id);
    if(existing===code)return;
    const holder=await this.ctx.storage.get(codeKey(code));
    if(holder&&holder!==id)throw Error('Invitation code collision');
    await this.ctx.storage.put({['code-for:'+id]:code,[codeKey(code)]:id});
  }
  async snapshot(id,code){
    await this.ensureIdentity(id,code);
    const record=await this.profile(id);
    const profile=async userId=>{const p=await this.publicProfile(userId);return {code:p.code,name:p.name}};
    const incoming=await Promise.all(record.incoming.map(profile));
    const outgoing=await Promise.all(record.outgoing.map(profile));
    const friends=await Promise.all(record.friends.map(profile));
    const blocked=await Promise.all(record.blocked.map(profile));
    return {code,name:socialName(code),incoming,outgoing,friends,blocked,limits:{friends:SOCIAL_FRIEND_LIMIT,requests:SOCIAL_REQUEST_LIMIT}};
  }
  async fetch(request){
    const url=new URL(request.url),auth=identity(request),id=auth.id,code=auth.code;
    if(url.pathname==='/record'&&request.method==='POST')return this.recordBattle(request);
    if(url.pathname==='/chat'&&request.method==='GET'){
      const messages=await this.ctx.storage.get('chat')||[];
      const blocked=id?(await this.profile(id)).blocked:[];
      return json({messages:publicChat(messages,blocked),limit:SOCIAL_HISTORY_LIMIT,readOnly:!id});
    }
    if(!id||!validFriendCode(code))return json({error:'需要 LINE 登入才能使用社群'},401);
    await this.ensureIdentity(id,code);
    if(url.pathname==='/me'&&request.method==='GET')return json(await this.snapshot(id,code));
    if(url.pathname==='/friends'&&request.method==='GET')return json(await this.snapshot(id,code));
    if(url.pathname==='/records'&&request.method==='GET')return json({records:await this.ctx.storage.get('battles:'+id)||[]});
    if(request.method!=='POST')return json({error:'Method not allowed'},405);
    let body;try{body=await request.json()}catch{return json({error:'Invalid JSON'},400)}
    if(url.pathname==='/chat')return this.sendChat(id,code,body);
    if(url.pathname==='/duel')return this.postDuel(id,code);
    if(url.pathname==='/friends')return this.changeFriend(id,code,body);
    if(url.pathname==='/report')return this.report(id,body);
    return json({error:'Not found'},404);
  }
  async sendChat(id,code,body){
    const result=safeMessage(body?.text);if(result.error)return json(result,400);
    const member=await this.profile(id),now=Date.now();
    if(!canSend(member.lastMessageAt,now))return json({error:'發送過於頻繁，請稍後再試'},429);
    const messages=await this.ctx.storage.get('chat')||[];
    const message={id:crypto.randomUUID(),authorId:id,name:socialName(code),text:result.text,at:now};
    member.lastMessageAt=now;
    await this.ctx.storage.put({chat:[...messages,message].slice(-SOCIAL_HISTORY_LIMIT),[userKey(id)]:member});
    return json({message:socialPublicMessage(message)},201);
  }
  async postDuel(id,code){
    const member=await this.profile(id),now=Date.now();
    if(!canSend(member.lastMessageAt,now))return json({error:'請稍後再發送'},429);
    const room=crypto.randomUUID(),message={id:crypto.randomUUID(),authorId:id,name:socialName(code),text:'邀請你一起 PK',kind:'duel',room,at:now};
    const messages=await this.ctx.storage.get('chat')||[];
    member.lastMessageAt=now;
    await this.ctx.storage.put({chat:[...messages,message].slice(-SOCIAL_HISTORY_LIMIT),[userKey(id)]:member});
    return json({message:publicChat([message],[])[0]},201);
  }
  async recordBattle(request){
    // This route is never exposed by the public /api/community gateway.
    const id=request.headers.get('X-Social-User');
    if(!id)return json({error:'Unauthorized'},401);
    let body;try{body=await request.json()}catch{return json({error:'Invalid JSON'},400)}
    const matchId=String(body?.matchId||''),outcome=String(body?.outcome||'');
    if(!/^[0-9a-f-]{36}$/.test(matchId)||!['win','loss','draw'].includes(outcome))return json({error:'Invalid record'},400);
    const key='battles:'+id,history=await this.ctx.storage.get(key)||[];
    if(history.some(item=>item.matchId===matchId))return json({ok:true});
    const opponent=String(body?.opponent||'對手').slice(0,22);
    const record={matchId,outcome,opponent,room:!!body?.room,at:Date.now()};
    await this.ctx.storage.put(key,[record,...history].slice(0,30));
    return json({ok:true});
  }
  async changeFriend(id,code,body){
    const action=textLimit(body?.action,24),targetCode=textLimit(body?.code,32).trim().toUpperCase();
    if(!['request','accept','reject','cancel','remove','block','unblock'].includes(action))return json({error:'Invalid friend action'},400);
    if(!validFriendCode(targetCode))return json({error:'請輸入正確的好友邀請代碼'},400);
    const target=await this.ctx.storage.get(codeKey(targetCode));
    if(!target||target===id)return json({error:'找不到此邀請代碼'},404);
    // Serialize multi-party edits for this single worldwide social hub, preserving both sides.
    return this.ctx.storage.transaction(async txn=>{
      const get=async user=>cleanRecord(await txn.get(userKey(user)));
      const me=await get(id),other=await get(target),now=Date.now();
      const blocked=me.blocked.includes(target)||other.blocked.includes(id);
      if(action==='request'){
        if(blocked)return json({error:'無法邀請此冒險者'},403);
        if(me.friends.includes(target))return json({error:'已是好友'},409);
        if(me.outgoing.includes(target))return json({error:'邀請已送出'},409);
        if(other.outgoing.includes(id))return json({error:'對方已邀請你，請先接受對方的好友邀請'},409);
        if(me.friends.length>=SOCIAL_FRIEND_LIMIT||other.friends.length>=SOCIAL_FRIEND_LIMIT)return json({error:'好友數已達上限'},409);
        if(me.outgoing.length>=SOCIAL_REQUEST_LIMIT||other.incoming.length>=SOCIAL_REQUEST_LIMIT)return json({error:'待處理邀請已達上限'},429);
        if(now-me.lastRequestAt<30000)return json({error:'好友邀請過於頻繁，請稍後再試'},429);
        me.outgoing=upsert(me.outgoing,target);other.incoming=upsert(other.incoming,id);me.lastRequestAt=now;
      }else if(action==='accept'){
        if(blocked)return json({error:'無法接受此邀請'},403);
        if(!me.incoming.includes(target)||!other.outgoing.includes(id))return json({error:'好友邀請不存在'},404);
        if(me.friends.length>=SOCIAL_FRIEND_LIMIT||other.friends.length>=SOCIAL_FRIEND_LIMIT)return json({error:'好友數已達上限'},409);
        me.incoming=drop(me.incoming,target);other.outgoing=drop(other.outgoing,id);
        me.friends=upsert(me.friends,target);other.friends=upsert(other.friends,id);
      }else if(action==='reject'||action==='cancel'){
        if(action==='reject'&&!me.incoming.includes(target))return json({error:'沒有這筆邀請'},404);
        if(action==='cancel'&&!me.outgoing.includes(target))return json({error:'沒有這筆邀請'},404);
        me.incoming=drop(me.incoming,target);other.outgoing=drop(other.outgoing,id);
        me.outgoing=drop(me.outgoing,target);other.incoming=drop(other.incoming,id);
      }else if(action==='remove'||action==='block'){
        if(action==='remove'&&!me.friends.includes(target))return json({error:'目前不是好友'},404);
        me.friends=drop(me.friends,target);other.friends=drop(other.friends,id);
        me.incoming=drop(me.incoming,target);me.outgoing=drop(me.outgoing,target);
        other.incoming=drop(other.incoming,id);other.outgoing=drop(other.outgoing,id);
        if(action==='block')me.blocked=upsert(me.blocked,target).slice(-150);
      }else if(action==='unblock'){
        if(!me.blocked.includes(target))return json({error:'未封鎖此冒險者'},404);
        me.blocked=drop(me.blocked,target);
      }
      await txn.put({[userKey(id)]:me,[userKey(target)]:other});
      return json({ok:true});
    });
  }
  async report(id,body){
    const messageId=textLimit(body?.messageId,80);
    if(!/^[0-9a-f-]{36}$/.test(messageId))return json({error:'Invalid message'},400);
    const messages=await this.ctx.storage.get('chat')||[];
    const found=messages.find(m=>m.id===messageId);
    if(!found||found.authorId===id)return json({error:'找不到這則訊息'},404);
    const key='report:'+messageId+':'+id;
    if(await this.ctx.storage.get(key))return json({error:'已提交過檢舉'},409);
    await this.ctx.storage.put(key,{reporter:id,author:found.authorId,messageId,text:found.text,at:Date.now()});
    const me=await this.profile(id);me.blocked=upsert(me.blocked,found.authorId).slice(-150);
    await this.ctx.storage.put(userKey(id),me);
    return json({ok:true,message:'已提交檢舉並隱藏此冒險者的訊息'});
  }
}
