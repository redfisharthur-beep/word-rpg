// Pure question-ledger rules, also exercised by the Node test suite.
export const QUESTION_WINDOW_MS=24*60*60*1000;
const validIndex=(i,count)=>Number.isInteger(i)&&i>=0&&i<count;
export function taiwanDay(now){return new Date(now+8*60*60*1000).toISOString().slice(0,10)}
export function normalizeQuestionHistory(raw,now=Date.now(),legacy=null,wordCount=1200){
  const seen={},pending={};
  if(raw){
    for(const [key,at] of Object.entries(raw.seen||{})){
      const i=Number(key),time=Number(at);
      if(validIndex(i,wordCount)&&time>now-QUESTION_WINDOW_MS&&time<=now)seen[i]=time;
    }
    for(const [key,value] of Object.entries(raw.pending||{})){
      const i=Number(key);if(value&&validIndex(i,wordCount))pending[i]=true;
    }
  }else if(legacy?.date===taiwanDay(now)){
    for(const i of legacy.used||[])if(validIndex(i,wordCount))seen[i]=now;
  }
  return {seen,pending};
}
export function reserveQuestionHistory(history,indices,now=Date.now(),wordCount=1200){
  const chosen=[...new Set(indices.map(Number))];
  if(!chosen.length||chosen.length>20||chosen.some(i=>!validIndex(i,wordCount)))throw new Error('Invalid questions');
  if(chosen.some(i=>history.seen[i]&&!history.pending[i]))throw new Error('Question conflict');
  const next={seen:{...history.seen},pending:{...history.pending}};
  for(const i of chosen)next.seen[i]=now;
  return next;
}
export function gradeQuestionHistory(history,results,answerFor,wordCount=1200){
  if(!Array.isArray(results)||!results.length||results.length>20)throw new Error('Invalid results');
  const next={seen:{...history.seen},pending:{...history.pending}};
  for(const item of results){
    const i=Number(item?.index);
    if(!validIndex(i,wordCount)||(!next.seen[i]&&!next.pending[i]))throw new Error('Question was not issued');
    if(String(item.answer??'')===String(answerFor(i)))delete next.pending[i];
    else next.pending[i]=true;
  }
  return next;
}
