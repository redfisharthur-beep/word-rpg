import baseWorker,{UserStore as LegacyUserStore,Matchmaker} from './index.js';
import {cleanProgress,progressRecord,prepareProgressWrite} from './progress-revision.js';

const json=(data,status=200,headers={})=>new Response(JSON.stringify(data),{status,headers:{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store',...headers}});
const userStub=(env,userId)=>env.USER_STORE.get(env.USER_STORE.idFromName(userId));

export {Matchmaker};

export class UserStore extends LegacyUserStore{
  async fetch(request){
    const url=new URL(request.url);
    if(url.pathname!=='/progress')return super.fetch(request);
    if(request.method==='GET'){
      const stored=await this.ctx.storage.get('progress');
      return json(progressRecord(stored||{}));
    }
    if(request.method==='POST'){
      let body;
      try{body=await request.json()}catch{return json({error:'Invalid JSON'},400)}
      const current=progressRecord(await this.ctx.storage.get('progress')||{});
      const hasBase=!!body&&Object.prototype.hasOwnProperty.call(body,'baseRevision');
      const candidate=body?.progress??body;
      const prepared=prepareProgressWrite(current,candidate,hasBase,body?.baseRevision);
      if(!prepared.ok)return json({error:prepared.error,progress:prepared.current},prepared.status);
      await this.ctx.storage.put('progress',prepared.progress);
      return json(prepared.progress);
    }
    return json({error:'Method not allowed'},405);
  }
}

async function sessionWithRevision(request,env){
  const response=await baseWorker.fetch(request,env);
  if(!response.ok)return response;
  const data=await response.json().catch(()=>({}));
  const userId=data?.authenticated?data?.profile?.userId:null;
  if(userId){
    const progressResponse=await userStub(env,userId).fetch('https://user/progress');
    if(progressResponse.ok){
      const record=progressRecord(await progressResponse.json());
      data.progress={...(data.progress||{}),revision:record.revision};
    }
  }
  return json(data,response.status);
}

async function progressApi(request,env){
  if(request.method!=='POST')return json({error:'Method not allowed'},405);
  const url=new URL(request.url),origin=request.headers.get('Origin');
  if(origin&&origin!==url.origin)return json({error:'Forbidden'},403);

  const sessionRequest=new Request(`${url.origin}/api/session`,{method:'GET',headers:request.headers});
  const sessionResponse=await baseWorker.fetch(sessionRequest,env);
  if(!sessionResponse.ok)return json({error:'Unauthorized'},401);
  const session=await sessionResponse.json().catch(()=>({}));
  const userId=session?.authenticated?session?.profile?.userId:null;
  if(!userId)return json({error:'Unauthorized'},401);

  let body;
  try{body=await request.json()}catch{return json({error:'Invalid JSON'},400)}
  const payload={progress:cleanProgress(body)};
  if(Object.prototype.hasOwnProperty.call(body,'baseRevision'))payload.baseRevision=body.baseRevision;

  const saveResponse=await userStub(env,userId).fetch('https://user/progress',{
    method:'POST',
    headers:{'Content-Type':'application/json'},
    body:JSON.stringify(payload)
  });
  const data=await saveResponse.json().catch(()=>({}));
  if(saveResponse.status===409)return json(data,409);
  if(!saveResponse.ok)return json({error:data?.error||'Save failed'},500);
  return json({ok:true,progress:progressRecord(data)});
}

export default{
  async fetch(request,env){
    const path=new URL(request.url).pathname;
    if(path==='/api/session')return sessionWithRevision(request,env);
    if(path==='/api/progress')return progressApi(request,env);
    return baseWorker.fetch(request,env);
  }
};
