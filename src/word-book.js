// Only attempted words enter the collection. Word IDs match the shared 1,200-word deck.
export const WORD_BOOK_SIZE=1200;
export const WORD_MASTERED_AT=4;
export const WORD_TITLES=[
  {id:'word-101',required:101,name:'百詞先鋒'},
  {id:'word-301',required:301,name:'詞海賢者'},
  {id:'word-801',required:801,name:'八百詞宗師'}
];
const validIndex=i=>Number.isInteger(i)&&i>=0&&i<WORD_BOOK_SIZE;
const count=v=>Math.max(0,Math.min(99999,Math.floor(Number(v)||0)));
export const emptyWordBook=()=>({entries:{},activeTitle:''});
export function cleanWordBook(raw){
  const entries={};
  if(raw?.entries&&typeof raw.entries==='object'&&!Array.isArray(raw.entries)){
    for(const [key,record] of Object.entries(raw.entries)){
      const index=Number(key);
      if(!validIndex(index)||!record||typeof record!=='object')continue;
      const correct=count(record.correct),wrong=count(record.wrong);
      if(correct+wrong===0)continue;
      const first=record.first==='wrong'?'wrong':record.first==='correct'?'correct':wrong>0?'wrong':'correct';
      entries[String(index)]={correct,wrong,first,lastAt:Math.max(0,Math.min(Date.now(),Math.floor(Number(record.lastAt)||0)))};
    }
  }
  const activeTitle=WORD_TITLES.some(t=>t.name===raw?.activeTitle)?raw.activeTitle:'';
  const result={entries,activeTitle};
  if(activeTitle&&!unlockedWordTitles(result).some(t=>t.name===activeTitle))result.activeTitle='';
  return result;
}
export function wordStatus(entry){
  if(!entry)return null;
  if(entry.correct>=WORD_MASTERED_AT)return '精熟';
  if(entry.first==='wrong'||entry.wrong>0)return '重點詞彙';
  return '學習中';
}
export function wordBookProgress(raw){
  const entries=Object.values(raw?.entries||{}).filter(x=>x&&typeof x==='object');
  const mastered=entries.filter(x=>x.correct>=WORD_MASTERED_AT).length;
  const focus=entries.filter(x=>wordStatus(x)==='重點詞彙').length;
  return {collected:entries.length,mastered,focus,learning:entries.length-mastered-focus};
}
export function unlockedWordTitles(raw){
  const mastered=wordBookProgress(raw).mastered;
  return WORD_TITLES.filter(title=>mastered>=title.required);
}
export function recordWordAnswer(raw,index,correct,at=Date.now()){
  const book=cleanWordBook(raw);
  if(!validIndex(index))return book;
  const before=unlockedWordTitles(book);
  const key=String(index),prev=book.entries[key];
  const entry=prev?{...prev}:{correct:0,wrong:0,first:correct?'correct':'wrong',lastAt:0};
  if(correct===true)entry.correct=Math.min(99999,entry.correct+1);
  else entry.wrong=Math.min(99999,entry.wrong+1);
  entry.lastAt=Math.max(0,Math.floor(Number(at)||Date.now()));
  book.entries[key]=entry;
  const after=unlockedWordTitles(book);
  if(after.length>before.length)book.activeTitle=after[after.length-1].name;
  return book;
}
export function equipWordTitle(raw,title){
  const book=cleanWordBook(raw);
  if(unlockedWordTitles(book).some(t=>t.name===title))book.activeTitle=title;
  return book;
}
