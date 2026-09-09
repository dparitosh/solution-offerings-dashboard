import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import * as googleTTS from 'google-tts-api';

const TEMP_DIR = './temp_video_build';
const OUTPUT_VIDEO = './public/executive_dashboard_demo.mp4';

fs.mkdirSync(TEMP_DIR, { recursive: true });
fs.mkdirSync('./public', { recursive: true });

function escapeXml(unsafe) {
  if (!unsafe) return '';
  return String(unsafe)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

const scenes = [
  {
    id: 'scene1_intro',
    title: 'Executive Performance & Remedial Governance Platform',
    subtitle: 'Comprehensive 4-Layer Operational Decision System',
    layerBadge: 'OVERVIEW',
    layerColor: '#3b82f6',
    duration: 16,
    voiceText: 'Welcome to the Executive Performance and Remedial Governance Platform. This platform delivers end-to-end operational visibility across four integrated layers: the Executive Dashboard, Geography Breakdown, Pipeline Gaps, and Total Contract Value Remedial Actions.',
    bullets: [
      'Layer 1: Executive Performance Dashboard with Offering Hierarchies',
      'Layer 2: Regional Performance & Geographic Deficit Analysis',
      'Layer 3: Pipeline Gaps & Remedial Initiative Assignments',
      'Layer 4: Solution Offering TCV Targets & Practice Owner Action Plans'
    ],
    kpis: [
      { label: 'Total AOP Target', val: '$140.2M', col: '#64748b' },
      { label: 'Actual Booked', val: '$106.8M', col: '#10b981' },
      { label: 'Deficit Gap', val: '-$33.4M', col: '#f43f5e' },
      { label: 'Pipeline Coverage', val: '2.84x', col: '#6366f1' }
    ]
  },
  {
    id: 'scene2_dashboard',
    title: 'Layer 1: Executive Performance Dashboard',
    subtitle: 'Unified Operational Performance Matrix & Offering Drilldowns',
    layerBadge: 'LAYER 1: DASHBOARD',
    layerColor: '#0ea5e9',
    duration: 26,
    voiceText: 'Layer 1 presents the Executive Dashboard. It aggregates total financial targets, actual booked revenues, pipeline multiples, and quota attainment across all five solution practices. Leaders can drill down into sub offerings, inspect win rates, and search across initiatives in real time.',
    bullets: [
      'Top-level executive telemetry for Revenue, TCV, and Pipeline',
      'Hierarchical accordion drilldown into practices & sub-offerings',
      'Instant search filtering across offerings, owners, and remedial notes',
      'Live status badges highlighting Critical, At Risk, and On Track segments'
    ],
    kpis: [
      { label: 'AI & Data Services', val: '$38.5M (88%)', col: '#10b981' },
      { label: 'Cloud Transformation', val: '$44.2M (74%)', col: '#eab308' },
      { label: 'Cybersecurity', val: '$22.0M (69%)', col: '#f43f5e' },
      { label: 'Enterprise Apps', val: '$24.1M (81%)', col: '#10b981' }
    ]
  },
  {
    id: 'scene3_geography',
    title: 'Layer 2: Geography & Regional Performance',
    subtitle: 'Macro and Regional Attainment Across Global Markets',
    layerBadge: 'LAYER 2: GEOGRAPHY',
    layerColor: '#8b5cf6',
    duration: 26,
    voiceText: 'Layer 2 breaks down performance by Geography. Executives can analyze revenue and contract distribution across North America, Europe, Asia Pacific, and Latin America. Visual bar charts immediately reveal regional variances, pipeline coverage ratios, and specific market deficits.',
    bullets: [
      'Comparative bar charts tracking AOP Target vs Actuals by theater',
      'Regional pipeline health analysis and win rate benchmarks',
      'Market-specific gap quantification to redirect commercial focus',
      'Full quarterly and currency toggle support in Millions or Thousands'
    ],
    kpis: [
      { label: 'North America', val: '$68.4M / $54.2M (79%)', col: '#3b82f6' },
      { label: 'EMEA', val: '$42.1M / $30.8M (73%)', col: '#8b5cf6' },
      { label: 'APAC', val: '$21.5M / $16.3M (76%)', col: '#06b6d4' },
      { label: 'LATAM', val: '$8.2M / $5.5M (67%)', col: '#f59e0b' }
    ]
  },
  {
    id: 'scene4_pipeline',
    title: 'Layer 3: Pipeline Gaps & Remedial Actions',
    subtitle: 'Proactive Pipeline Health, Deficit Sizing & Intervention Logs',
    layerBadge: 'LAYER 3: PIPELINE GAPS',
    layerColor: '#f59e0b',
    duration: 28,
    voiceText: 'Layer 3 focuses on Pipeline Gaps and Remediation. When pipeline coverage falls below the healthy 3.5 multiplier benchmark, leaders can assign targeted remedial actions. Each initiative captures root cause analysis, expected dollar impact, due dates, and milestone completion status.',
    bullets: [
      'Identifies pipeline deficit gaps across all solution offerings',
      'Action logging with expected dollar lift and target completion dates',
      'Root cause classification: deal slippage, lead velocity, or enablement',
      'Interactive workflow to update status from In Progress to Completed'
    ],
    kpis: [
      { label: 'Healthy Benchmark', val: '3.50x Multiplier', col: '#10b981' },
      { label: 'Current Pipeline', val: '$398.2M', col: '#3b82f6' },
      { label: 'Remediation Pipeline Lift', val: '+$42.5M Target', col: '#6366f1' },
      { label: 'Open Initiatives', val: '14 Active Actions', col: '#f59e0b' }
    ]
  },
  {
    id: 'scene5_tcv',
    title: 'Layer 4: TCV Gaps & Practice Owner Remediation',
    subtitle: 'Offering Value Delivery & Dedicated Practice Owner Scorecards',
    layerBadge: 'LAYER 4: TCV GAPS',
    layerColor: '#10b981',
    duration: 26,
    voiceText: 'Layer 4 addresses Total Contract Value Gaps. It visualizes contract target versus actuals across Solution Offerings. Selecting a Practice Owner from the dropdown provides their dedicated scorecard, win rates, and clean, bulleted remedial action plans for accountable execution.',
    bullets: [
      'Solution Offering visual chart sorted by target volume, gap, or attainment',
      'Practice Owner dropdown to inspect individual performance scorecards',
      'Action plans structured in clean, scannable bullet points',
      'Direct gap resolution tracking for senior leadership review'
    ],
    kpis: [
      { label: 'Total TCV Target', val: '$140.2M', col: '#64748b' },
      { label: 'TCV Actual Booked', val: '$106.8M', col: '#10b981' },
      { label: 'Practices Tracked', val: '5 Strategic Offerings', col: '#3b82f6' },
      { label: 'Practice Owners', val: '8 Assigned Leaders', col: '#6366f1' }
    ]
  },
  {
    id: 'scene6_outro',
    title: 'Accelerate Operational Execution & Gap Closure',
    subtitle: 'Unified Intelligence for Executive Leadership',
    layerBadge: 'EXECUTIVE SUMMARY',
    layerColor: '#6366f1',
    duration: 10,
    voiceText: 'With real-time visibility across all four layers, leadership teams can rapidly diagnose deficits, assign accountability, and ensure quarter over quarter success. Thank you for watching.',
    bullets: [
      'Export audit-ready Excel reports at any time with one click',
      'Quarterly trend analysis across Q1 through Q4 FY27',
      'Structured governance driving consistent target attainment'
    ],
    kpis: [
      { label: 'Quarter', val: 'Q1 FY 27', col: '#3b82f6' },
      { label: 'Governance', val: 'Weekly Review', col: '#10b981' },
      { label: 'Decision Speed', val: 'Real-Time', col: '#6366f1' },
      { label: 'Platform Status', val: 'Enterprise Ready', col: '#0ea5e9' }
    ]
  }
];

function generateSVG(scene, frameIndex, totalFrames) {
  const progressPercent = Math.min(100, Math.round((frameIndex / totalFrames) * 100));

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="1920" height="1080" viewBox="0 0 1920 1080">
  <defs>
    <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#0b0f19" />
      <stop offset="50%" stop-color="#0f172a" />
      <stop offset="100%" stop-color="#1e1b4b" />
    </linearGradient>
    <linearGradient id="cardGrad" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#1e293b" stop-opacity="0.95" />
      <stop offset="100%" stop-color="#0f172a" stop-opacity="0.95" />
    </linearGradient>
  </defs>

  <!-- Background -->
  <rect width="1920" height="1080" fill="url(#bgGrad)"/>

  <!-- Subtle Grid Lines -->
  <g stroke="#334155" stroke-width="0.75" opacity="0.3">
    <line x1="0" y1="180" x2="1920" y2="180" />
    <line x1="0" y1="360" x2="1920" y2="360" />
    <line x1="0" y1="540" x2="1920" y2="540" />
    <line x1="0" y1="720" x2="1920" y2="720" />
    <line x1="0" y1="900" x2="1920" y2="900" />
    <line x1="320" y1="0" x2="320" y2="1080" />
    <line x1="640" y1="0" x2="640" y2="1080" />
    <line x1="960" y1="0" x2="960" y2="1080" />
    <line x1="1280" y1="0" x2="1280" y2="1080" />
    <line x1="1600" y1="0" x2="1600" y2="1080" />
  </g>

  <!-- Top Header Navigation Bar -->
  <rect x="60" y="40" width="1800" height="90" rx="16" fill="#1e293b" stroke="#334155" stroke-width="1.5"/>

  <!-- Logo & Title -->
  <circle cx="110" cy="85" r="22" fill="${scene.layerColor}"/>
  <text x="110" y="93" font-family="sans-serif" font-size="20" font-weight="bold" fill="#ffffff" text-anchor="middle">EP</text>

  <text x="150" y="78" font-family="sans-serif" font-size="22" font-weight="bold" fill="#ffffff">Executive Performance Dashboard</text>
  <text x="150" y="103" font-family="sans-serif" font-size="14" fill="#94a3b8">Q1 FY27 Performance &amp; Remedial Governance Platform</text>

  <!-- 4 Layer Navigation Pills in Header -->
  <g transform="translate(900, 62)">
    <rect x="0" y="0" width="180" height="46" rx="8" fill="${scene.id.includes('dashboard') ? '#0ea5e9' : '#334155'}" />
    <text x="90" y="28" font-family="sans-serif" font-size="13" font-weight="bold" fill="#ffffff" text-anchor="middle">1. Executive View</text>

    <rect x="195" y="0" width="180" height="46" rx="8" fill="${scene.id.includes('geography') ? '#8b5cf6' : '#334155'}" />
    <text x="285" y="28" font-family="sans-serif" font-size="13" font-weight="bold" fill="#ffffff" text-anchor="middle">2. Geography</text>

    <rect x="390" y="0" width="180" height="46" rx="8" fill="${scene.id.includes('pipeline') ? '#f59e0b' : '#334155'}" />
    <text x="480" y="28" font-family="sans-serif" font-size="13" font-weight="bold" fill="#ffffff" text-anchor="middle">3. Pipeline Gaps</text>

    <rect x="585" y="0" width="180" height="46" rx="8" fill="${scene.id.includes('tcv') ? '#10b981' : '#334155'}" />
    <text x="675" y="28" font-family="sans-serif" font-size="13" font-weight="bold" fill="#ffffff" text-anchor="middle">4. TCV Gaps</text>
  </g>

  <!-- Main Hero Card -->
  <rect x="60" y="150" width="1800" height="740" rx="20" fill="url(#cardGrad)" stroke="#334155" stroke-width="2"/>

  <!-- Layer Badge -->
  <rect x="100" y="190" width="220" height="34" rx="17" fill="${scene.layerColor}" />
  <text x="210" y="213" font-family="sans-serif" font-size="13" font-weight="bold" fill="#ffffff" text-anchor="middle">${escapeXml(scene.layerBadge)}</text>

  <!-- Title & Subtitle -->
  <text x="100" y="270" font-family="sans-serif" font-size="34" font-weight="bold" fill="#ffffff">${escapeXml(scene.title)}</text>
  <text x="100" y="305" font-family="sans-serif" font-size="18" fill="#94a3b8">${escapeXml(scene.subtitle)}</text>

  <!-- 4 KPI Telemetry Cards -->
  <g transform="translate(100, 335)">
    ${scene.kpis.map((kpi, idx) => `
      <g transform="translate(${idx * 410}, 0)">
        <rect x="0" y="0" width="380" height="110" rx="14" fill="#0f172a" stroke="#334155" stroke-width="1.5"/>
        <circle cx="30" cy="35" r="8" fill="${kpi.col}"/>
        <text x="50" y="40" font-family="sans-serif" font-size="14" fill="#94a3b8" font-weight="bold">${escapeXml(kpi.label)}</text>
        <text x="30" y="85" font-family="sans-serif" font-size="28" font-weight="bold" fill="${kpi.col}">${escapeXml(kpi.val)}</text>
      </g>
    `).join('')}
  </g>

  <!-- Feature Highlights Box (Left) -->
  <rect x="100" y="475" width="880" height="370" rx="16" fill="#0f172a" stroke="#334155" stroke-width="1.5"/>
  <text x="140" y="525" font-family="sans-serif" font-size="20" font-weight="bold" fill="#ffffff">Key Capabilities &amp; Workflow Highlights</text>

  <g transform="translate(140, 560)">
    ${scene.bullets.map((b, idx) => `
      <g transform="translate(0, ${idx * 65})">
        <circle cx="12" cy="14" r="7" fill="${scene.layerColor}"/>
        <text x="35" y="20" font-family="sans-serif" font-size="17" fill="#e2e8f0" font-weight="500">${escapeXml(b)}</text>
      </g>
    `).join('')}
  </g>

  <!-- Visual Representation Box (Right) -->
  <rect x="1010" y="475" width="810" height="370" rx="16" fill="#0f172a" stroke="#334155" stroke-width="1.5"/>
  <text x="1050" y="525" font-family="sans-serif" font-size="20" font-weight="bold" fill="#ffffff">Live Decision Interface &amp; Telemetry</text>

  <!-- Render scene-specific visual mockup -->
  ${renderMockup(scene)}

  <!-- Bottom Player & Timeline Footer -->
  <rect x="60" y="910" width="1800" height="120" rx="16" fill="#1e293b" stroke="#334155" stroke-width="1.5"/>

  <text x="100" y="955" font-family="sans-serif" font-size="16" font-weight="bold" fill="#ffffff">Interactive Video Walkthrough</text>
  <text x="100" y="985" font-family="sans-serif" font-size="14" fill="#94a3b8">Covering: Dashboard • Geography • Pipeline Gaps • TCV Practice Owners</text>

  <!-- Progress Bar Background -->
  <rect x="580" y="960" width="1120" height="12" rx="6" fill="#334155"/>
  <!-- Progress Bar Filled -->
  <rect x="580" y="960" width="${(1120 * progressPercent) / 100}" height="12" rx="6" fill="${scene.layerColor}"/>

  <!-- Timestamp -->
  <text x="1720" y="972" font-family="sans-serif" font-size="14" font-weight="bold" fill="#ffffff" text-anchor="end">${progressPercent}% (2:00 Demo)</text>
</svg>`;
}

function renderMockup(scene) {
  if (scene.id.includes('dashboard')) {
    return `
      <g transform="translate(1050, 555)">
        <rect x="0" y="0" width="730" height="50" rx="8" fill="#1e293b"/>
        <text x="20" y="30" font-family="sans-serif" font-size="14" fill="#38bdf8" font-weight="bold">AI &amp; Data Services</text>
        <text x="360" y="30" font-family="sans-serif" font-size="14" fill="#94a3b8">AOP: $38.5M</text>
        <text x="520" y="30" font-family="sans-serif" font-size="14" fill="#10b981" font-weight="bold">Actual: $33.8M (88%)</text>

        <rect x="0" y="65" width="730" height="50" rx="8" fill="#1e293b"/>
        <text x="20" y="95" font-family="sans-serif" font-size="14" fill="#38bdf8" font-weight="bold">Cloud Transformation</text>
        <text x="360" y="95" font-family="sans-serif" font-size="14" fill="#94a3b8">AOP: $44.2M</text>
        <text x="520" y="95" font-family="sans-serif" font-size="14" fill="#eab308" font-weight="bold">Actual: $32.7M (74%)</text>

        <rect x="0" y="130" width="730" height="50" rx="8" fill="#1e293b"/>
        <text x="20" y="160" font-family="sans-serif" font-size="14" fill="#38bdf8" font-weight="bold">Cybersecurity &amp; Risk</text>
        <text x="360" y="160" font-family="sans-serif" font-size="14" fill="#94a3b8">AOP: $22.0M</text>
        <text x="520" y="160" font-family="sans-serif" font-size="14" fill="#f43f5e" font-weight="bold">Actual: $15.2M (69%)</text>

        <rect x="0" y="195" width="730" height="50" rx="8" fill="#1e293b"/>
        <text x="20" y="225" font-family="sans-serif" font-size="14" fill="#38bdf8" font-weight="bold">Enterprise Applications</text>
        <text x="360" y="225" font-family="sans-serif" font-size="14" fill="#94a3b8">AOP: $24.1M</text>
        <text x="520" y="225" font-family="sans-serif" font-size="14" fill="#10b981" font-weight="bold">Actual: $19.5M (81%)</text>
      </g>
    `;
  } else if (scene.id.includes('geography')) {
    return `
      <g transform="translate(1050, 555)">
        <text x="20" y="25" font-family="sans-serif" font-size="14" fill="#ffffff" font-weight="bold">North America ($68.4M Target)</text>
        <rect x="20" y="35" width="500" height="20" rx="4" fill="#334155"/>
        <rect x="20" y="35" width="395" height="20" rx="4" fill="#3b82f6"/>
        <text x="535" y="50" font-family="sans-serif" font-size="13" fill="#3b82f6" font-weight="bold">$54.2M (79%)</text>

        <text x="20" y="85" font-family="sans-serif" font-size="14" fill="#ffffff" font-weight="bold">EMEA ($42.1M Target)</text>
        <rect x="20" y="95" width="500" height="20" rx="4" fill="#334155"/>
        <rect x="20" y="95" width="365" height="20" rx="4" fill="#8b5cf6"/>
        <text x="535" y="110" font-family="sans-serif" font-size="13" fill="#8b5cf6" font-weight="bold">$30.8M (73%)</text>

        <text x="20" y="145" font-family="sans-serif" font-size="14" fill="#ffffff" font-weight="bold">APAC ($21.5M Target)</text>
        <rect x="20" y="155" width="500" height="20" rx="4" fill="#334155"/>
        <rect x="20" y="155" width="380" height="20" rx="4" fill="#06b6d4"/>
        <text x="535" y="170" font-family="sans-serif" font-size="13" fill="#06b6d4" font-weight="bold">$16.3M (76%)</text>

        <text x="20" y="205" font-family="sans-serif" font-size="14" fill="#ffffff" font-weight="bold">LATAM ($8.2M Target)</text>
        <rect x="20" y="215" width="500" height="20" rx="4" fill="#334155"/>
        <rect x="20" y="215" width="335" height="20" rx="4" fill="#f59e0b"/>
        <text x="535" y="230" font-family="sans-serif" font-size="13" fill="#f59e0b" font-weight="bold">$5.5M (67%)</text>
      </g>
    `;
  } else if (scene.id.includes('pipeline')) {
    return `
      <g transform="translate(1050, 555)">
        <rect x="0" y="0" width="730" height="110" rx="8" fill="#1e293b" stroke="#f59e0b" stroke-width="1"/>
        <text x="20" y="30" font-family="sans-serif" font-size="15" fill="#ffffff" font-weight="bold">Enterprise Migration Pipeline Uplift</text>
        <text x="20" y="55" font-family="sans-serif" font-size="13" fill="#94a3b8">• Launch co-sell program with hyperscalers</text>
        <text x="20" y="78" font-family="sans-serif" font-size="13" fill="#94a3b8">• Accelerate 8 stalled stage-3 cloud deals</text>
        <text x="540" y="35" font-family="sans-serif" font-size="14" fill="#10b981" font-weight="bold">+$12.5M Target Lift</text>
        <text x="540" y="65" font-family="sans-serif" font-size="12" fill="#f59e0b">Status: In Progress</text>

        <rect x="0" y="130" width="730" height="110" rx="8" fill="#1e293b" stroke="#334155" stroke-width="1"/>
        <text x="20" y="160" font-family="sans-serif" font-size="15" fill="#ffffff" font-weight="bold">GenAI Workshop Demand Generation</text>
        <text x="20" y="185" font-family="sans-serif" font-size="13" fill="#94a3b8">• Execute 15 executive briefings in Q1</text>
        <text x="20" y="208" font-family="sans-serif" font-size="13" fill="#94a3b8">• Target top 50 banking accounts</text>
        <text x="540" y="165" font-family="sans-serif" font-size="14" fill="#10b981" font-weight="bold">+$8.0M Target Lift</text>
        <text x="540" y="195" font-family="sans-serif" font-size="12" fill="#10b981">Status: On Track</text>
      </g>
    `;
  } else if (scene.id.includes('tcv')) {
    return `
      <g transform="translate(1050, 555)">
        <rect x="0" y="0" width="730" height="40" rx="6" fill="#1e293b"/>
        <text x="20" y="25" font-family="sans-serif" font-size="13" fill="#10b981" font-weight="bold">Practice Owner: Sarah Chen — Cloud Services Lead</text>

        <g transform="translate(0, 55)">
          <rect x="0" y="0" width="730" height="180" rx="8" fill="#1e293b" stroke="#334155" stroke-width="1"/>
          <text x="20" y="30" font-family="sans-serif" font-size="14" fill="#ffffff" font-weight="bold">Remedial Action Plan (Bulleted Execution):</text>
          <text x="20" y="65" font-family="sans-serif" font-size="13" fill="#e2e8f0">• Implement fast-track deal desk for contracts &gt; $2M</text>
          <text x="20" y="95" font-family="sans-serif" font-size="13" fill="#e2e8f0">• Standardize multi-year cloud transformation terms</text>
          <text x="20" y="125" font-family="sans-serif" font-size="13" fill="#e2e8f0">• Re-engage 4 delayed enterprise renewals</text>

          <rect x="20" y="145" width="690" height="25" rx="4" fill="#0f172a"/>
          <text x="30" y="162" font-family="sans-serif" font-size="12" fill="#10b981" font-weight="bold">Target TCV Lift: +$9.5M</text>
          <text x="450" y="162" font-family="sans-serif" font-size="12" fill="#94a3b8">Owner Accountability: Sarah Chen</text>
        </g>
      </g>
    `;
  } else {
    return `
      <g transform="translate(1050, 555)">
        <rect x="0" y="0" width="730" height="240" rx="12" fill="#1e293b" stroke="#6366f1" stroke-width="1"/>
        <text x="40" y="50" font-family="sans-serif" font-size="18" fill="#ffffff" font-weight="bold">Executive Decision Support</text>
        <text x="40" y="90" font-family="sans-serif" font-size="14" fill="#cbd5e1">&#10003; Instant audit-ready data export</text>
        <text x="40" y="130" font-family="sans-serif" font-size="14" fill="#cbd5e1">&#10003; Real-time remedial accountability tracking</text>
        <text x="40" y="170" font-family="sans-serif" font-size="14" fill="#cbd5e1">&#10003; Continuous pipeline &amp; TCV gap remediation</text>
      </g>
    `;
  }
}

async function main() {
  console.log('Generating audio narration and visual frames for demo video...');

  const sceneClips = [];

  for (let i = 0; i < scenes.length; i++) {
    const scene = scenes[i];
    console.log(`Processing Scene ${i + 1}/${scenes.length}: ${scene.title}`);

    // 1. Generate Voiceover MP3 using getAllAudioBase64 for reliable chunking
    const audioPath = path.join(TEMP_DIR, `${scene.id}.mp3`);
    try {
      const results = await googleTTS.getAllAudioBase64(scene.voiceText, {
        lang: 'en',
        slow: false,
        host: 'https://translate.google.com',
        timeout: 10000,
        splitPunct: ',.?!'
      });

      const buffers = results.map(r => Buffer.from(r.base64, 'base64'));
      fs.writeFileSync(audioPath, Buffer.concat(buffers));
    } catch (e) {
      console.warn(`TTS fetch warning for ${scene.id}, generating tone fallback:`, e.message);
      execSync(`ffmpeg -y -f lavfi -i "sine=frequency=440:duration=${scene.duration}" "${audioPath}"`);
    }

    // 2. Measure Audio Duration
    let actualAudioDuration = scene.duration;
    try {
      const probe = execSync(`ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "${audioPath}"`).toString().trim();
      actualAudioDuration = parseFloat(probe) + 1.2; // slight buffer
    } catch (e) {
      actualAudioDuration = scene.duration;
    }

    // 3. Generate SVG and Render PNG
    const svgContent = generateSVG(scene, i + 1, scenes.length);
    const svgPath = path.join(TEMP_DIR, `${scene.id}.svg`);
    const pngPath = path.join(TEMP_DIR, `${scene.id}.png`);
    fs.writeFileSync(svgPath, svgContent);

    execSync(`ffmpeg -y -i "${svgPath}" -vf "scale=1920:1080" "${pngPath}"`);

    // 4. Create Video Segment
    const clipPath = path.join(TEMP_DIR, `${scene.id}.mp4`);
    execSync(
      `ffmpeg -y -loop 1 -framerate 25 -t ${actualAudioDuration.toFixed(2)} -i "${pngPath}" ` +
      `-i "${audioPath}" -c:v libx264 -tune stillimage -c:a aac -b:a 192k -pix_fmt yuv420p -shortest "${clipPath}"`
    );

    sceneClips.push(clipPath);
  }

  // 5. Concatenate all scene clips into the final video
  console.log('Concatenating clips into final 2-minute MP4 video...');
  const concatListPath = path.join(TEMP_DIR, 'concat_list.txt');
  const concatContent = sceneClips.map(clip => `file '${path.resolve(clip)}'`).join('\n');
  fs.writeFileSync(concatListPath, concatContent);

  execSync(
    `ffmpeg -y -f concat -safe 0 -i "${concatListPath}" -c:v libx264 -preset fast -crf 22 -c:a aac -b:a 192k -movflags +faststart "${OUTPUT_VIDEO}"`
  );

  console.log(`Video generated successfully at: ${OUTPUT_VIDEO}`);
  const stats = fs.statSync(OUTPUT_VIDEO);
  console.log(`File size: ${(stats.size / (1024 * 1024)).toFixed(2)} MB`);
}

main().catch(err => {
  console.error('Video generation error:', err);
  process.exit(1);
});
