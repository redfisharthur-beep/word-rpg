// Shared validation for the LINE-account-only community. Never trust browser identity fields.
export const SOCIAL_MESSAGE_LIMIT=160;
export const SOCIAL_HISTORY_LIMIT=60;
export const SOCIAL_RATE_MS=4000;
export const SOCIAL_REQUEST_LIMIT=8;
export const SOCIAL_FRIEND_LIMIT=60;
export const socialName=code=>'冒險者-'+String(code||'??????').replace(/^F-/,'').slice(0,6);
export const validFriendCode=code=>/^F-[A-F0-9]{12}$/.test(String(code||''));
export function safeMessage(value){
  if(typeof value!=='string')return {error:'請輸入文字訊息'};
  const text=value.trim().replace(/[\u0000-\u001f\u007f]/g,' ').replace(/\s{3,}/g,'  ');
  if(!text||text.length>SOCIAL_MESSAGE_LIMIT)return {error:'訊息限 1～160 字'};
  // Public learning game: limit direct contact requests/links to reduce sharing private details.
  if(/(?:https?:\/\/|www\.|(?:line|discord|telegram|instagram|ig)\s*[:：@]|(?:\+?886[-\s]?)?09\d{2}[-\s]?\d{3}[-\s]?\d{3}|@[\w.-]+\.[a-z]{2,})/i.test(text))return {error:'公開聊天室請勿張貼連結、聯絡方式或個人資料'};
  return {text};
}
export function canSend(lastSent,at=Date.now()){return at-(Number(lastSent)||0)>=SOCIAL_RATE_MS}
export function socialPublicMessage(m){return {id:m.id,authorCode:m.authorCode,name:m.name,text:m.text,at:m.at}}
