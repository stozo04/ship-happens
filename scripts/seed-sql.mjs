import seed from '../data/seed.json' with {type:'json'};
const sqlString=v=>v==null?'null':`'${String(v).replaceAll("'","''")}'`;
console.log('begin;');
console.log(`insert into public.ship_happens_settings(id,content) values ('main',${sqlString(JSON.stringify(seed.challenge))}::jsonb) on conflict(id) do update set content=excluded.content;`);
for (const d of seed.days) console.log(`insert into public.ship_happens_days(day,date,ship_status,reset_status,reset_source_url,poll_url,note) values (${d.day},${[d.date,d.ship_status,d.reset_status,d.reset_source_url,d.poll_url,d.note].map(sqlString).join(',')}) on conflict(day) do nothing;`);
for (const r of seed.releases) console.log(`insert into public.ship_happens_releases(id,day,title,summary,category,source_url,product_url) values (${sqlString(r.id)},${r.day},${[r.title,r.summary,r.category,r.source_url,r.product_url].map(sqlString).join(',')}) on conflict(id) do nothing;`);
console.log('commit;');
