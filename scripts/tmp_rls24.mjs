import { loadEnv } from "./lib_env.mjs";
loadEnv();
const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
console.log("key prefix:", key.slice(0,20));
const payload = key.split(".")[1];
const json = JSON.parse(Buffer.from(payload, "base64url").toString());
console.log("JWT payload:", JSON.stringify(json, null, 2));
