import seed from '../data/seed.json' with { type: 'json' };
export default async function handler(req,res){
  if(req.method!=='GET')return res.status(405).json({error:'Method not allowed'});
  res.setHeader('Cache-Control','no-store');
  const url=process.env.SUPABASE_URL,key=process.env.SUPABASE_PUBLISHABLE_KEY;
  if(!url||!key)return res.status(200).json({...seed,mode:'snapshot'});
  try{
    const base=new URL(url);if(base.protocol!=='https:'||!base.hostname.endsWith('.supabase.co'))throw new Error('Invalid storage host');
    const headers={apikey:key};
    const responses=await Promise.all(['ship_happens_days?select=*&order=day.asc','ship_happens_releases?select=*&order=day.asc,id.asc','ship_happens_settings?select=*&id=eq.main'].map(path=>fetch(`${base.origin}/rest/v1/${path}`,{headers,signal:AbortSignal.timeout(8000)})));
    if(responses.some(r=>!r.ok))throw new Error('Storage read failed');
    const [days,releases,settings]=await Promise.all(responses.map(r=>r.json()));
    if(days.length!==28||settings.length!==1)throw new Error('Storage is not initialized');
    return res.status(200).json({challenge:settings[0].content,days,releases,mode:'supabase'});
  }catch{return res.status(200).json({...seed,mode:'snapshot',warning:'Live storage unavailable; showing the verified snapshot.'});}
}
