import {session,apiGet,refreshAccess,COOKIE_NAME,seal,cookie} from './_kroger.js';
export default async function handler(req,res){
  res.setHeader('Cache-Control','no-store');
  let s=session(req);
  if(!s) return res.status(401).json({error:'Kroger not connected'});
  try{
    if(s.expires_at && Date.now()>s.expires_at && s.refresh_token){
      const t=await refreshAccess(s.refresh_token);
      s={...s,access_token:t.access_token,refresh_token:t.refresh_token||s.refresh_token,expires_at:Date.now()+((Number(t.expires_in)||1800)*1000)-30000,scope:t.scope||s.scope};
      res.setHeader('Set-Cookie',cookie(COOKIE_NAME,seal(s),60*60*24*30));
    }
    const zip=String(req.query.zip||'').replace(/\D/g,'').slice(0,5);
    if(zip.length!==5) return res.status(400).json({error:'Enter a 5-digit ZIP code'});
    const data=await apiGet(`/locations?filter.zipCode.near=${encodeURIComponent(zip)}&filter.radiusInMiles=50&filter.limit=20`,s.access_token);
    return res.status(200).json(data);
  }catch(e){ return res.status(e.status||500).json({error:e.message||'Location lookup failed'}); }
}
