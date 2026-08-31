import crypto from 'crypto';
export const AUTH_URL = 'https://api.kroger.com/v1/connect/oauth2/authorize';
export const TOKEN_URL = 'https://api.kroger.com/v1/connect/oauth2/token';
export const API_BASE = 'https://api.kroger.com/v1';
export const COOKIE_NAME = 'cgp_kroger_session';
export const STATE_COOKIE = 'cgp_kroger_state';
export function configured(){return !!(process.env.KROGER_CLIENT_ID&&process.env.KROGER_CLIENT_SECRET&&process.env.KROGER_SESSION_SECRET)}
export function originFromReq(req){const proto=String(req.headers['x-forwarded-proto']||'https').split(',')[0].trim();const host=req.headers['x-forwarded-host']||req.headers.host;return `${proto}://${host}`}
export function parseCookies(req){const raw=req.headers.cookie||'';return Object.fromEntries(raw.split(';').map(v=>v.trim()).filter(Boolean).map(v=>{const i=v.indexOf('=');return [decodeURIComponent(v.slice(0,i)),decodeURIComponent(v.slice(i+1))]}))}
function key(){return crypto.createHash('sha256').update(process.env.KROGER_SESSION_SECRET||'').digest()}
export function seal(obj){const iv=crypto.randomBytes(12),cipher=crypto.createCipheriv('aes-256-gcm',key(),iv);const enc=Buffer.concat([cipher.update(JSON.stringify(obj),'utf8'),cipher.final()]);const tag=cipher.getAuthTag();return Buffer.concat([iv,tag,enc]).toString('base64url')}
export function unseal(value){try{const b=Buffer.from(value,'base64url'),iv=b.subarray(0,12),tag=b.subarray(12,28),enc=b.subarray(28),d=crypto.createDecipheriv('aes-256-gcm',key(),iv);d.setAuthTag(tag);return JSON.parse(Buffer.concat([d.update(enc),d.final()]).toString('utf8'))}catch{return null}}
export function session(req){const c=parseCookies(req);return c[COOKIE_NAME]?unseal(c[COOKIE_NAME]):null}
export function cookie(name,value,maxAge=3600){return `${encodeURIComponent(name)}=${encodeURIComponent(value)}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${maxAge}`}
export function clearCookie(name){return `${encodeURIComponent(name)}=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0`}
export async function exchangeCode(code,redirectUri){const auth=Buffer.from(`${process.env.KROGER_CLIENT_ID}:${process.env.KROGER_CLIENT_SECRET}`).toString('base64');const body=new URLSearchParams({grant_type:'authorization_code',code,redirect_uri:redirectUri});const r=await fetch(TOKEN_URL,{method:'POST',headers:{Authorization:`Basic ${auth}`,'Content-Type':'application/x-www-form-urlencoded',Accept:'application/json'},body});if(!r.ok)throw new Error(`Kroger token exchange failed (${r.status})`);return r.json()}
export async function refreshAccess(refreshToken){const auth=Buffer.from(`${process.env.KROGER_CLIENT_ID}:${process.env.KROGER_CLIENT_SECRET}`).toString('base64');const body=new URLSearchParams({grant_type:'refresh_token',refresh_token:refreshToken});const r=await fetch(TOKEN_URL,{method:'POST',headers:{Authorization:`Basic ${auth}`,'Content-Type':'application/x-www-form-urlencoded',Accept:'application/json'},body});if(!r.ok)throw new Error(`Kroger token refresh failed (${r.status})`);return r.json()}
export async function apiGet(path,token){const r=await fetch(API_BASE+path,{headers:{Authorization:`Bearer ${token}`,Accept:'application/json'},cache:'no-store'});if(!r.ok)throw new Error(`Kroger API ${r.status}`);return r.json()}
