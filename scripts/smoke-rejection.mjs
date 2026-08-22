// Smoke test: the rejection path.
// 3/8 rejections mathematically block approval, a reason is mandatory, and a
// late vote on a decided application is refused.
//
// Runs against a LIVE server and a REAL Postgres over HTTP - it does not mock.
// Verifies behaviour that only appears once the database exists, which is
// exactly what a Railway deploy exercises for the first time.
//
// Usage (server already running, DATABASE_URL pointing at its database):
//   BASE_URL=http://127.0.0.1:4010 DEV_ACCESS_KEY=yourkey node scripts/smoke-rejection.mjs
//
// DESTRUCTIVE: clears applications, reviews and members first.
// Never point this at anything but a disposable test database.

import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
const BASE = process.env.BASE_URL || 'http://127.0.0.1:4010';
let f = 0; const ok = (c,m)=>{console.log(`${c?'  PASS':'  FAIL'}  ${m}`); if(!c) f++;};

const p = {
  tier:'ASSOCIATE', organizationName:'Konkan Consultants LLP', contactName:'Meera Shah',
  contactEmail:'meera@konkancons.test', contactPhone:'9812345670',
  addressLine:'22 Residency Road', city:'Nashik', state:'Maharashtra', pincode:'422001',
  pan:'AAXCS9876F', gstNumber:'', crushingCapacityMtMonth:'', natureOfBusiness:'Consultancy',
  signatoryName:'Meera Shah', signatoryDesignation:'Partner',
  signatoryEmail:'meera@konkancons.test', signatoryPhone:'9812345670',
  companyProofUrl:'https://drive.google.com/file/d/proof2', companyProofType:'partnership_deed',
  proposerName:'Dr. Karnail Singh Bhoon', proposerEmail:'ksbhoon@rdcconcrete.com',
  seconderName:'Mr. Rudra Mohan Sahu', seconderEmail:'rmsahu@jagannathstones.com',
  agreeRules:true,
};
const r = await fetch(`${BASE}/api/membership/apply`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(p)});
const d = await r.json();
ok(r.status===200, `associate application -> ${d.applicationNo}`);

const app = await prisma.membershipApplication.findFirst({where:{applicationNo:d.applicationNo},include:{reviews:true}});
const t = app.reviews.map(x=>x.token);

// reject without a reason must be refused
const noReason = await fetch(`${BASE}/api/review/${t[0]}/vote`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({decision:'REJECT'})});
ok(noReason.status===400, `REJECT with no comment -> ${noReason.status} (expect 400)`);

for (let i=0;i<3;i++){
  const v = await fetch(`${BASE}/api/review/${t[i]}/vote`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({decision:'REJECT',comment:`insufficient documentation ${i+1}`})});
  const vd = await v.json();
  if(i<2) ok(vd.newStatus==='UNDER_REVIEW', `reject ${i+1}/3 -> ${vd.newStatus}`);
  else ok(vd.newStatus==='REJECTED', `reject 3/3 -> ${vd.newStatus} (blocks approval)`);
}
const after = await prisma.membershipApplication.findFirst({where:{id:app.id}});
ok(after.status==='REJECTED' && !!after.rejectionReason, `stored status=${after.status}, reasons recorded=${!!after.rejectionReason}`);

// a 4th member voting on a decided application must be refused
const late = await fetch(`${BASE}/api/review/${t[3]}/vote`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({decision:'APPROVE'})});
ok(late.status===409, `vote after decision -> ${late.status} (expect 409)`);

ok((await prisma.member.count())===1, `member count still 1 (rejected app created no member)`);
console.log(f===0?'\nREJECTION PATH PASSED':`\n${f} FAILED`);
await prisma.$disconnect(); process.exit(f?1:0);
