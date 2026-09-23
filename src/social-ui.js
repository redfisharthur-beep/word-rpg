// Public, read-only-for-guests chat and opt-in LINE friend invitations.
// Only server-issued pseudonyms, invitation codes and public messages are rendered.
export function createSocialUI({app,getMeta,onLogin,esc}){
  let tab='chat',timer=null,root=null,session=null,messages=[],records=[],pending=false,epoch=0;
  const endpoint='/api/community';
  const signedIn=()=>getMeta()?.authMode==='line';
  const req=async(path,method='GET',body)=>{
    const response=await fetch(endpoint+path,{method,credentials:'same-origin',cache:'no-store',headers:method==='POST'?{'Content-Type':'application/json'}:{},body:body===undefined?undefined:JSON.stringify(body)});
    const data=await response.json();
    if(!response.ok)throw Error(String(data.error||'社群連線失敗'));
    return data;
  };
  const card=user=>'<b>'+esc(user.name||'冒險者')+'</b><small>'+esc(user.code||'')+'</small>';
  const list=(users,kind,buttons)=>users?.length?users.map(user=>'<div class="social-friend">'+card(user)+'<span>'+buttons.map(([action,label])=>'<button type="button" data-social-action="'+action+'" data-social-code="'+esc(user.code)+'">'+label+'</button>').join('')+'</span></div>').join(''):'<p class="social-empty">目前沒有'+kind+'。</p>';
  function renderFriends(){
    if(!root||tab!=='friends')return;
    const slot=root.querySelector('[data-social-friend-view]');
    if(!slot)return;
    if(!signedIn()){slot.innerHTML='<p>LINE 登入後使用好友功能</p><button data-social-login type="button">使用 LINE 登入</button>';return}
    if(!session){slot.innerHTML='<p class="social-empty">正在讀取好友資料…</p>';return}
    slot.innerHTML='<section class="social-me"><b>我的好友邀請代碼</b><div class="social-code"><input data-social-my-code readonly aria-label="我的好友邀請代碼" value="'+esc(session.code)+'"><button type="button" data-social-action="copy-code">複製</button></div><small>邀請需對方接受</small></section><form data-social-request><label for="social-request-code">輸入好友代碼</label><div class="social-code"><input id="social-request-code" name="code" maxlength="14" autocapitalize="characters" autocomplete="off" placeholder="F-XXXXXXXXXXXX" required><button type="submit">送出邀請</button></div></form><h3>好友 '+session.friends.length+'/'+session.limits.friends+'</h3>'+list(session.friends,'好友',[['remove','移除'],['block','封鎖']])+'<h3>收到的邀請 '+session.incoming.length+'</h3>'+list(session.incoming,'好友邀請',[['accept','接受'],['reject','拒絕']])+'<h3>已送出的邀請 '+session.outgoing.length+'</h3>'+list(session.outgoing,'送出中的好友邀請',[['cancel','取消']])+(session.blocked?.length?'<h3>已封鎖</h3>'+list(session.blocked,'封鎖名單',[['unblock','解除封鎖']]):'');
  }
  function renderMessages(){
    if(!root||tab!=='chat')return;
    const listEl=root.querySelector('[data-social-messages]');if(!listEl)return;
    const nearBottom=listEl.scrollTop+listEl.clientHeight>=listEl.scrollHeight-65;
    listEl.innerHTML=messages.length?messages.map(m=>{
      const link=m.kind==='duel'&&/^[0-9a-f-]{36}$/.test(m.room||'')?'<a class="social-duel-link" href="/?duel='+encodeURIComponent(m.room)+'">加入 PK · 選角色</a>':'';
      return '<article class="social-msg"><div class="social-msg-head"><b>'+esc(m.name||'冒險者')+'</b><time>'+esc(new Date(m.at).toLocaleString('zh-TW',{month:'numeric',day:'numeric',hour:'2-digit',minute:'2-digit'}))+'</time></div><p>'+esc(m.text)+'</p>'+link+(signedIn()?'<button type="button" data-social-action="report" data-social-message-id="'+esc(m.id)+'" aria-label="檢舉訊息">檢舉</button>':'')+'</article>';
    }).join(''):'<p class="social-empty">還沒有訊息</p>';
    if(nearBottom)listEl.scrollTop=listEl.scrollHeight;
  }
  function renderRecords(){
    if(!root||tab!=='records')return;
    const slot=root.querySelector('[data-social-record-view]');if(!slot)return;
    if(!signedIn()){slot.innerHTML='<p class="social-empty">LINE 登入後查看對戰紀錄</p><button type="button" data-social-login>LINE 登入</button>';return}
    slot.innerHTML=records.length?records.map(rec=>'<article class="social-record"><strong class="social-record-'+esc(rec.outcome)+'">'+(rec.outcome==='win'?'勝':rec.outcome==='loss'?'敗':'平')+'</strong><div><b>'+esc(rec.opponent||'對手')+'</b><small>'+(rec.room?'好友 PK':'PK')+' · '+esc(new Date(rec.at).toLocaleString('zh-TW',{month:'numeric',day:'numeric',hour:'2-digit',minute:'2-digit'}))+'</small></div></article>').join(''):'<p class="social-empty">尚無對戰紀錄</p>';
  }
  function host(){
    if(!root)return;
    root.innerHTML='<nav class="social-tabs" aria-label="社群"><button type="button" data-social-tab="chat" class="'+(tab==='chat'?'active':'')+'">聊天室</button><button type="button" data-social-tab="friends" class="'+(tab==='friends'?'active':'')+'">好友'+(session?.incoming?.length?' ('+session.incoming.length+')':'')+'</button><button type="button" data-social-tab="records" class="'+(tab==='records'?'active':'')+'">對戰紀錄</button></nav><p class="social-guidance">公開聊天勿留個資、聯絡方式。</p><p class="social-feedback" data-social-feedback aria-live="polite"></p>'+(tab==='chat'?'<div class="social-messages" data-social-messages role="log" aria-live="polite"></div>'+(signedIn()?'<form data-social-compose class="social-compose"><div><input id="social-draft" name="message" maxlength="160" autocomplete="off" aria-label="訊息" placeholder="輸入訊息…" required><button type="submit" aria-label="送出訊息">➤</button></div></form><button class="social-duel-create" type="button" data-social-action="duel">發送 PK 連結</button>':'<button type="button" data-social-login>LINE 登入後發言／邀戰</button>'):tab==='friends'?'<div class="social-friends" data-social-friend-view></div>':'<div class="social-records" data-social-record-view></div>');
    renderMessages();renderFriends();renderRecords();
  }
  const feedback=text=>{const label=root?.querySelector('[data-social-feedback]');if(label)label.textContent=text||''};
  async function refresh(showError=false){
    const run=epoch;
    if(!root||pending)return;
    pending=true;
    try{
      const chat=await req('/chat');
      if(run!==epoch)return;
      messages=chat.messages||[];
      if(signedIn()){
        session=await req('/friends');
        if(run!==epoch)return;
      }
      renderMessages();
      if(tab==='friends')renderFriends();
      if(signedIn()){const history=await req('/records');if(run!==epoch)return;records=history.records||[];}
      if(tab==='records')renderRecords();
    }catch(err){if(run===epoch&&showError)feedback(err.message||'社群目前無法連線')}
    finally{pending=false}
  }
  async function sendMessage(form){
    if(!signedIn())return onLogin();
    const input=form.querySelector('[name="message"]');
    const text=String(input?.value||'').trim();
    if(!text)return;
    try{await req('/chat','POST',{text});if(input)input.value='';feedback('訊息已送出');await refresh(true)}
    catch(err){feedback(err.message)}
  }
  async function updateFriend(action,code){
    try{await req('/friends','POST',{action,code});feedback('好友資料已更新');session=await req('/friends');if(root)host()}
    catch(err){feedback(err.message)}
  }
  async function onAction(target){
    const action=target.dataset.socialAction;
    if(action==='duel'){
      try{await req('/duel','POST',{});feedback('PK 連結已發送');await refresh(true)}catch(err){feedback(err.message)}return;
    }
    if(action==='copy-code'){
      try{await navigator.clipboard.writeText(session?.code||'');feedback('邀請代碼已複製')}catch{feedback('請長按上方代碼手動複製')}return;
    }
    if(action==='report'){
      if(!confirm('檢舉這則訊息，並隱藏該冒險者的公開訊息？'))return;
      try{const data=await req('/report','POST',{messageId:target.dataset.socialMessageId});feedback(data.message);await refresh(true)}
      catch(err){feedback(err.message)}return;
    }
    if(action==='remove'||action==='block'){
      if(!confirm(action==='block'?'封鎖這位冒險者並移除好友？':'確定要移除好友？'))return;
    }
    if(['accept','reject','cancel','remove','block','unblock'].includes(action))await updateFriend(action,target.dataset.socialCode);
  }
  function handleClick(event){
    if(!root)return;
    const target=event.target.closest('[data-social-tab],[data-social-login],[data-social-action]');
    if(!target||!root.contains(target))return;
    if(target.hasAttribute('data-social-login')){onLogin();return}
    if(target.dataset.socialTab){tab=['chat','friends','records'].includes(target.dataset.socialTab)?target.dataset.socialTab:'chat';host();void refresh(true);return}
    if(target.dataset.socialAction)void onAction(target);
  }
  function handleSubmit(event){
    if(!root)return;
    const form=event.target;
    if(form?.matches?.('[data-social-compose]')){event.preventDefault();void sendMessage(form);return}
    if(form?.matches?.('[data-social-request]')){
      event.preventDefault();
      const code=String(form.querySelector('[name="code"]')?.value||'').trim().toUpperCase();
      if(code)void updateFriend('request',code);
    }
  }
  function mount(){
    const next=app.querySelector('#social-app');
    if(!next)return;
    if(root!==next){leave();root=next;tab='chat';root.addEventListener('click',handleClick);root.addEventListener('submit',handleSubmit);host()}
    if(!timer)timer=setInterval(()=>{void refresh(false)},5000);
    void refresh(true);
  }
  function leave(){epoch++;if(timer)clearInterval(timer);timer=null;root=null;pending=false}
  return {mount,leave};
}
