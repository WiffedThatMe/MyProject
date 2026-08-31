import {COOKIE_NAME,clearCookie} from './_kroger.js';
export default async function handler(req,res){res.setHeader('Set-Cookie',clearCookie(COOKIE_NAME));res.status(200).json({ok:true})}
