const fs=require('node:fs');
const file=process.argv[2];
if(!fs.existsSync(file)){console.log('::error::Unit test report was not produced');process.exitCode=1;}else{
 const result=JSON.parse(fs.readFileSync(file,'utf8'));
 const summary=`Tests: ${result.numPassedTests} passed, ${result.numFailedTests} failed, ${result.numPendingTests} pending`;
 console.log(summary);console.log(`::notice title=Unit test summary::${summary}; ${result.numTotalTests} total`);if(process.env.GITHUB_STEP_SUMMARY)fs.appendFileSync(process.env.GITHUB_STEP_SUMMARY,summary+'\n');
 for(const suite of result.testResults){
  const failed=suite.assertionResults?.filter(t=>t.status==='failed')??[];
  for(const t of failed){const text=`${suite.name}: ${t.fullName}\n${(t.failureMessages??[]).join('\n').slice(0,2500)}`;console.log('::error title=Unit test failed::'+text.replaceAll('%','%25').replaceAll('\r','%0D').replaceAll('\n','%0A'));}
  if(suite.status==='failed'&&!failed.length)console.log('::error title=Test collection failed::'+`${suite.name}: ${suite.message}`.slice(0,2500).replaceAll('%','%25').replaceAll('\r','%0D').replaceAll('\n','%0A'));
 }
}
