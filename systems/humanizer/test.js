#!/usr/bin/env node
'use strict';

const { humanize } = require('./humanize');

let passed = 0, failed = 0;
const failures = [];

function test(name, input, shouldNotContain, shouldContain) {
  const result = humanize(input);
  let ok = true;

  for (const bad of (shouldNotContain || [])) {
    if (result.toLowerCase().includes(bad.toLowerCase())) {
      ok = false;
      failures.push({ name, issue: `Still contains "${bad}"`, result });
    }
  }
  for (const good of (shouldContain || [])) {
    if (!result.toLowerCase().includes(good.toLowerCase())) {
      ok = false;
      failures.push({ name, issue: `Missing expected "${good}"`, result });
    }
  }
  if (ok) passed++; else failed++;
}

// === AI Vocabulary ===
test('delve into', 'Let us delve into the details.', ['delve into'], ['exploring']);
test('delve deeper', 'We need to delve deeper into this.', ['delve deeper'], ['exploring']);
test('landscape', 'The evolving landscape of technology.', ['evolving landscape'], ['changing']);
test('tapestry', 'A rich tapestry of cultures.', ['tapestry of'], ['mix of']);
test('leverage', 'We can leverage this tool.', ['leverage'], ['use']);
test('robust', 'A robust solution for all.', ['robust'], ['strong']);
test('comprehensive', 'A comprehensive guide to cooking.', ['comprehensive'], ['thorough']);
test('streamline', 'We need to streamline our process.', ['streamline'], ['simplify']);
test('foster collaboration', 'We foster collaboration here.', ['foster collaboration'], ['build']);
test('in terms of', 'In terms of performance, it is great.', ['in terms of'], ['for']);
test('utilize', 'We utilize advanced methods.', ['utilize'], ['use']);
test('facilitate', 'This will facilitate learning.', ['facilitate'], ['help with']);
test('multifaceted', 'A multifaceted problem.', ['multifaceted'], ['complex']);
test('paradigm shift', 'A paradigm shift in thinking.', ['paradigm shift'], ['change']);
test('pivotal', 'A pivotal moment in history.', ['pivotal'], ['key']);
test('realm', 'In the realm of science.', ['in the realm of'], ['in']);
test('navigate complexities', 'We navigate the complexities of law.', ['navigate the complexities'], ['deal with']);

// === Stock Phrases ===
test('worth noting', "It's worth noting that the sky is blue.", ["it's worth noting that"], ['sky is blue']);
test('important to note', "It is important to note that prices vary.", ['important to note that']);
test('at the end of the day', 'At the end of the day, results matter.', ['at the end of the day'], ['ultimately']);
test('in today world', "In today's fast-paced world, speed matters.", ["in today's fast-paced world"], ['now']);
test('in conclusion', 'In conclusion, the plan works.', ['in conclusion'], ['so']);
test('testament', 'This stands as a testament to our work.', ['stands as a testament'], ['shows']);
test('reminder', 'It serves as a stark reminder of failure.', ['serves as a stark reminder'], ['reminds us']);
test('without a doubt', 'This is without a doubt the best.', ['without a doubt'], ['clearly']);
test('only time will tell', 'Only time will tell what happens.', ['only time will tell'], ["we'll see"]);
test('cannot be overstated', 'Its importance cannot be overstated.', ['cannot be overstated'], ['matters a lot']);

// === Structural ===
test('em-dash', 'The tool — which is powerful — works well.', ['—'], [',']);

// === Hedging ===
test('However', 'The plan failed. However, we tried.', ['However,'], ['But']);
test('Moreover', 'We won. Moreover, we celebrated.', ['Moreover,'], ['Also']);
test('Furthermore', 'It works. Furthermore, it scales.', ['Furthermore,'], ['And']);
test('Additionally', 'Good results. Additionally, cheap.', ['Additionally,'], ['Also']);
test('nevertheless', 'It was hard. We nevertheless succeeded.', ['nevertheless'], ['still']);

// === Performed Authenticity ===
test('crucial role', 'Education plays a crucial role in society.', ['plays a crucial role'], ['matters']);
test('not without challenges', 'The project is not without challenges.', ['not without challenges'], ['hard']);
test('raises important questions', 'This raises important questions about ethics.', ['raises important questions'], ['makes you wonder']);
test('shed light', 'Research sheds light on the issue.', ['sheds light on'], ['explain']);
test('pave the way', 'This paves the way for progress.', ['paves the way for'], ['open up']);

// === Full paragraph (integration test) ===
test('full-ai-paragraph',
  "In today's fast-paced world, it's worth noting that artificial intelligence plays a crucial role in the evolving landscape of technology. Delving into this multifaceted topic — which cannot be overstated — we leverage comprehensive tools to streamline processes. Furthermore, fostering collaboration stands as a testament to our robust approach. At the end of the day, only time will tell.",
  ['delve', 'landscape', 'multifaceted', 'leverage', 'comprehensive', 'streamline', 'furthermore', 'robust', 'testament', 'at the end of the day', 'only time will tell', "it's worth noting", 'crucial role', 'cannot be overstated']
);

// === Report ===
console.log(`\n${'='.repeat(50)}`);
console.log(`Humanizer Regression Tests`);
console.log(`${'='.repeat(50)}`);
console.log(`✅ Passed: ${passed}`);
console.log(`❌ Failed: ${failed}`);
if (failures.length) {
  console.log(`\nFailures:`);
  for (const f of failures) {
    console.log(`  [${f.name}] ${f.issue}`);
    console.log(`    Result: "${f.result.slice(0, 120)}..."`);
  }
}
console.log();
process.exit(failed > 0 ? 1 : 0);
