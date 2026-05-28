<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Kiri AI — AI Chatbot Widget for Business Websites</title>
  <meta name="description" content="Kiri AI helps businesses answer customer questions automatically, capture leads, and switch to human live chat when needed. Add an AI assistant to your website in minutes." />
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link href="https://fonts.googleapis.com/css2?family=Syne:wght@400;500;600;700;800&family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;1,9..40,300&display=swap" rel="stylesheet" />
  <style>
    /* ── CSS Reset & Variables ─────────────────────────────── */
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

    :root {
      --bg:        #080b12;
      --bg2:       #0d1120;
      --bg3:       #111827;
      --surface:   rgba(255,255,255,0.04);
      --border:    rgba(255,255,255,0.08);
      --border2:   rgba(255,255,255,0.14);

      --teal:      #00e5c3;
      --teal-dim:  #00b89a;
      --blue:      #3b6fff;
      --blue-dim:  #2d57e0;
      --violet:    #7c5cfc;

      --text:      #f0f4ff;
      --text2:     #9aa5c4;
      --text3:     #60718a;

      --grad-hero: linear-gradient(135deg, #00e5c3 0%, #3b6fff 50%, #7c5cfc 100%);
      --grad-btn:  linear-gradient(135deg, #00e5c3, #3b6fff);
      --grad-card: linear-gradient(145deg, rgba(255,255,255,0.06) 0%, rgba(255,255,255,0.02) 100%);

      --radius:    14px;
      --radius-sm: 8px;
      --shadow:    0 24px 80px rgba(0,0,0,0.6);
      --glow-teal: 0 0 40px rgba(0,229,195,0.25);
      --glow-blue: 0 0 40px rgba(59,111,255,0.25);

      --font-display: 'Syne', sans-serif;
      --font-body:    'DM Sans', sans-serif;
    }

    html { scroll-behavior: smooth; }

    body {
      background: var(--bg);
      color: var(--text);
      font-family: var(--font-body);
      font-size: 16px;
      line-height: 1.6;
      overflow-x: hidden;
    }

    /* ── Noise Texture Overlay ─────────────────────────────── */
    body::before {
      content: '';
      position: fixed;
      inset: 0;
      background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.04'/%3E%3C/svg%3E");
      pointer-events: none;
      z-index: 0;
      opacity: 0.4;
    }

    /* ── Utilities ─────────────────────────────────────────── */
    .container { max-width: 1160px; margin: 0 auto; padding: 0 24px; }
    .badge {
      display: inline-flex; align-items: center; gap: 8px;
      background: rgba(0,229,195,0.08); border: 1px solid rgba(0,229,195,0.2);
      color: var(--teal); font-size: 12px; font-weight: 600; letter-spacing: 0.08em;
      text-transform: uppercase; padding: 6px 14px; border-radius: 100px;
    }
    .badge::before { content: ''; width: 6px; height: 6px; border-radius: 50%; background: var(--teal); animation: pulse 2s infinite; }
    @keyframes pulse { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:0.4;transform:scale(1.4)} }

    .section-label {
      font-family: var(--font-display); font-size: 12px; font-weight: 700;
      letter-spacing: 0.14em; text-transform: uppercase; color: var(--teal);
      margin-bottom: 16px;
    }
    .section-title {
      font-family: var(--font-display); font-size: clamp(32px, 4vw, 52px);
      font-weight: 700; line-height: 1.12; color: var(--text);
    }
    .section-sub {
      font-size: 18px; color: var(--text2); line-height: 1.7;
      max-width: 540px; margin-top: 16px;
    }
    .gradient-text {
      background: var(--grad-hero); -webkit-background-clip: text;
      -webkit-text-fill-color: transparent; background-clip: text;
    }

    /* ── Buttons ───────────────────────────────────────────── */
    .btn {
      display: inline-flex; align-items: center; justify-content: center; gap: 8px;
      font-family: var(--font-body); font-size: 15px; font-weight: 500;
      padding: 13px 26px; border-radius: var(--radius-sm);
      cursor: pointer; border: none; text-decoration: none;
      transition: all 0.2s ease; position: relative; white-space: nowrap;
    }
    .btn-primary {
      background: var(--grad-btn); color: #000; font-weight: 700;
      box-shadow: 0 0 30px rgba(0,229,195,0.35);
    }
    .btn-primary:hover { transform: translateY(-2px); box-shadow: 0 0 50px rgba(0,229,195,0.5); }
    .btn-ghost {
      background: transparent; color: var(--text2); border: 1px solid var(--border2);
    }
    .btn-ghost:hover { background: var(--surface); color: var(--text); border-color: rgba(255,255,255,0.22); }
    .btn-outline {
      background: transparent; color: var(--text); border: 1px solid var(--border2);
    }
    .btn-outline:hover { border-color: var(--teal); color: var(--teal); box-shadow: 0 0 20px rgba(0,229,195,0.15); }
    .btn svg { width: 16px; height: 16px; flex-shrink: 0; }

    /* ── Navbar ────────────────────────────────────────────── */
    nav {
      position: fixed; top: 0; left: 0; right: 0; z-index: 100;
      padding: 0 24px;
      transition: all 0.3s ease;
    }
    nav.scrolled {
      background: rgba(8,11,18,0.85);
      backdrop-filter: blur(20px);
      -webkit-backdrop-filter: blur(20px);
      border-bottom: 1px solid var(--border);
    }
    .nav-inner {
      max-width: 1160px; margin: 0 auto;
      display: flex; align-items: center; justify-content: space-between;
      height: 68px;
    }
    .logo {
      font-family: var(--font-display); font-size: 22px; font-weight: 800;
      text-decoration: none; color: var(--text); letter-spacing: -0.02em;
      display: flex; align-items: center; gap: 10px;
    }
    .logo-icon {
      width: 32px; height: 32px; border-radius: 9px;
      background: var(--grad-btn);
      display: flex; align-items: center; justify-content: center;
      box-shadow: 0 0 20px rgba(0,229,195,0.4);
    }
    .logo-icon svg { width: 18px; height: 18px; }
    .nav-links { display: flex; align-items: center; gap: 8px; list-style: none; }
    .nav-links a {
      text-decoration: none; color: var(--text2); font-size: 14px; font-weight: 500;
      padding: 8px 14px; border-radius: var(--radius-sm);
      transition: all 0.18s ease;
    }
    .nav-links a:hover { color: var(--text); background: var(--surface); }
    .nav-actions { display: flex; align-items: center; gap: 10px; }
    .hamburger { display: none; flex-direction: column; gap: 5px; cursor: pointer; padding: 8px; }
    .hamburger span { width: 22px; height: 2px; background: var(--text2); border-radius: 2px; transition: all 0.3s; }
    .mobile-menu {
      display: none; position: fixed; top: 68px; left: 0; right: 0;
      background: rgba(8,11,18,0.97); backdrop-filter: blur(20px);
      border-bottom: 1px solid var(--border); padding: 20px 24px 28px; z-index: 99;
      flex-direction: column; gap: 6px;
    }
    .mobile-menu.open { display: flex; }
    .mobile-menu a {
      text-decoration: none; color: var(--text2); font-size: 16px; font-weight: 500;
      padding: 12px 16px; border-radius: var(--radius-sm);
      transition: all 0.18s ease;
    }
    .mobile-menu a:hover { background: var(--surface); color: var(--text); }
    .mobile-menu .divider { height: 1px; background: var(--border); margin: 8px 0; }
    @media (max-width: 820px) {
      .nav-links, .nav-actions { display: none; }
      .hamburger { display: flex; }
    }

    /* ── Hero ──────────────────────────────────────────────── */
    .hero {
      min-height: 100vh; display: flex; align-items: center;
      position: relative; overflow: hidden; padding: 120px 24px 80px;
    }
    .hero-bg {
      position: absolute; inset: 0; pointer-events: none; z-index: 0;
    }
    .hero-orb {
      position: absolute; border-radius: 50%; filter: blur(80px); opacity: 0.3;
    }
    .hero-orb-1 {
      width: 600px; height: 600px; top: -100px; left: -100px;
      background: radial-gradient(circle, #00e5c3 0%, transparent 70%);
      animation: orb-drift 8s ease-in-out infinite;
    }
    .hero-orb-2 {
      width: 500px; height: 500px; top: 100px; right: -50px;
      background: radial-gradient(circle, #3b6fff 0%, transparent 70%);
      animation: orb-drift 10s ease-in-out infinite reverse;
    }
    .hero-orb-3 {
      width: 400px; height: 400px; bottom: -50px; left: 40%;
      background: radial-gradient(circle, #7c5cfc 0%, transparent 70%);
      animation: orb-drift 12s ease-in-out infinite;
    }
    @keyframes orb-drift {
      0%,100% { transform: translate(0,0) scale(1); }
      33% { transform: translate(30px,-20px) scale(1.05); }
      66% { transform: translate(-20px,30px) scale(0.95); }
    }
    .hero-grid {
      display: grid; grid-template-columns: 1fr 1fr;
      align-items: center; gap: 60px;
      position: relative; z-index: 1; max-width: 1160px; margin: 0 auto; width: 100%;
    }
    .hero-content { animation: fadeUp 0.9s cubic-bezier(0.16,1,0.3,1) forwards; opacity: 0; }
    @keyframes fadeUp {
      from { opacity: 0; transform: translateY(30px); }
      to   { opacity: 1; transform: translateY(0); }
    }
    .hero-badge { margin-bottom: 28px; }
    .hero-title {
      font-family: var(--font-display);
      font-size: clamp(40px, 5.5vw, 72px);
      font-weight: 800; line-height: 1.04; letter-spacing: -0.03em;
      color: var(--text); margin-bottom: 24px;
    }
    .hero-sub {
      font-size: 19px; color: var(--text2); line-height: 1.7;
      margin-bottom: 40px; max-width: 480px;
    }
    .hero-actions { display: flex; gap: 14px; flex-wrap: wrap; margin-bottom: 48px; }
    .hero-trust {
      display: flex; align-items: center; gap: 12px;
      font-size: 13px; color: var(--text3);
    }
    .hero-trust-avatars { display: flex; }
    .hero-trust-avatars span {
      width: 28px; height: 28px; border-radius: 50%; border: 2px solid var(--bg);
      background: var(--grad-hero); display: inline-flex; align-items: center;
      justify-content: center; font-size: 11px; font-weight: 700; color: #000;
      margin-left: -8px; font-family: var(--font-display);
    }
    .hero-trust-avatars span:first-child { margin-left: 0; }

    /* ── Widget Mockup ─────────────────────────────────────── */
    .hero-visual {
      position: relative; animation: fadeUp 0.9s 0.2s cubic-bezier(0.16,1,0.3,1) forwards; opacity: 0;
    }
    .browser-mockup {
      background: var(--bg2); border: 1px solid var(--border2);
      border-radius: 16px; overflow: hidden; box-shadow: var(--shadow), var(--glow-blue);
    }
    .browser-bar {
      background: var(--bg3); padding: 10px 16px;
      display: flex; align-items: center; gap: 12px;
      border-bottom: 1px solid var(--border);
    }
    .browser-dots { display: flex; gap: 6px; }
    .browser-dots span { width: 10px; height: 10px; border-radius: 50%; }
    .browser-dots span:nth-child(1) { background: #ff5f57; }
    .browser-dots span:nth-child(2) { background: #ffbe2e; }
    .browser-dots span:nth-child(3) { background: #28c840; }
    .browser-url {
      flex: 1; background: rgba(255,255,255,0.05); border-radius: 6px;
      padding: 5px 12px; font-size: 12px; color: var(--text3); font-family: monospace;
    }
    .browser-body {
      padding: 24px; min-height: 380px; position: relative;
      background: linear-gradient(135deg, #0d1120, #111827);
    }
    .site-placeholder {
      background: rgba(255,255,255,0.03); border-radius: 8px;
      padding: 16px; margin-bottom: 12px;
    }
    .site-line { height: 10px; border-radius: 4px; background: rgba(255,255,255,0.08); margin-bottom: 8px; }
    .site-line.w80 { width: 80%; }
    .site-line.w60 { width: 60%; }
    .site-line.w90 { width: 90%; }
    .site-line.w40 { width: 40%; }

    /* Chat Widget */
    .chat-widget {
      position: absolute; bottom: 20px; right: 20px; width: 290px;
      animation: widget-float 4s ease-in-out infinite;
    }
    @keyframes widget-float {
      0%,100% { transform: translateY(0); }
      50% { transform: translateY(-8px); }
    }
    .chat-bubble-btn {
      position: absolute; bottom: -10px; right: 0;
      width: 52px; height: 52px; border-radius: 50%;
      background: var(--grad-btn); box-shadow: 0 0 30px rgba(0,229,195,0.5);
      display: flex; align-items: center; justify-content: center;
      cursor: pointer;
    }
    .chat-bubble-btn svg { width: 24px; height: 24px; }
    .chat-window {
      background: rgba(13,17,32,0.95); border: 1px solid var(--border2);
      border-radius: 14px; overflow: hidden;
      box-shadow: 0 20px 60px rgba(0,0,0,0.8), 0 0 0 1px rgba(255,255,255,0.05);
      backdrop-filter: blur(20px);
    }
    .chat-header {
      background: linear-gradient(135deg, #0d1829, #0a1a14);
      padding: 14px 16px; display: flex; align-items: center; gap: 10px;
      border-bottom: 1px solid var(--border);
    }
    .chat-avatar {
      width: 34px; height: 34px; border-radius: 50%;
      background: var(--grad-btn); display: flex; align-items: center; justify-content: center;
      font-size: 16px; box-shadow: 0 0 12px rgba(0,229,195,0.4);
    }
    .chat-header-info { flex: 1; }
    .chat-header-name { font-size: 13px; font-weight: 600; color: var(--text); }
    .chat-header-status { font-size: 11px; color: var(--teal); display: flex; align-items: center; gap: 4px; }
    .chat-header-status::before { content: ''; width: 5px; height: 5px; border-radius: 50%; background: var(--teal); }
    .chat-messages { padding: 14px; display: flex; flex-direction: column; gap: 10px; min-height: 160px; }
    .chat-msg { max-width: 85%; }
    .chat-msg-bot {
      background: rgba(255,255,255,0.06); border: 1px solid var(--border);
      border-radius: 12px 12px 12px 3px; padding: 10px 13px;
      font-size: 12.5px; color: var(--text2); line-height: 1.5;
    }
    .chat-msg-user { align-self: flex-end; }
    .chat-msg-user .chat-msg-bot {
      background: linear-gradient(135deg, rgba(0,229,195,0.15), rgba(59,111,255,0.15));
      border-color: rgba(0,229,195,0.2);
      border-radius: 12px 12px 3px 12px; color: var(--text);
    }
    .chat-typing {
      display: flex; align-items: center; gap: 4px; padding: 10px 13px;
      background: rgba(255,255,255,0.06); border: 1px solid var(--border);
      border-radius: 12px 12px 12px 3px; width: fit-content;
    }
    .chat-typing span {
      width: 6px; height: 6px; border-radius: 50%; background: var(--text3);
      animation: typing-bounce 1.2s infinite;
    }
    .chat-typing span:nth-child(2) { animation-delay: 0.2s; }
    .chat-typing span:nth-child(3) { animation-delay: 0.4s; }
    @keyframes typing-bounce {
      0%,60%,100% { transform: translateY(0); opacity: 0.4; }
      30% { transform: translateY(-4px); opacity: 1; }
    }
    .chat-input-row {
      padding: 10px 12px; border-top: 1px solid var(--border);
      display: flex; align-items: center; gap: 8px;
    }
    .chat-input-fake {
      flex: 1; background: rgba(255,255,255,0.05); border: 1px solid var(--border);
      border-radius: 8px; padding: 8px 12px; font-size: 12px; color: var(--text3);
    }
    .chat-send {
      width: 30px; height: 30px; border-radius: 8px;
      background: var(--grad-btn); display: flex; align-items: center; justify-content: center;
    }
    .chat-send svg { width: 13px; height: 13px; }

    /* ── Trust Strip ───────────────────────────────────────── */
    .trust-strip {
      border-top: 1px solid var(--border); border-bottom: 1px solid var(--border);
      padding: 28px 0; background: rgba(255,255,255,0.015);
      position: relative; z-index: 1;
    }
    .trust-inner {
      display: flex; align-items: center; justify-content: center;
      gap: 0; overflow: hidden;
    }
    .trust-label { font-size: 13px; color: var(--text3); margin-right: 36px; white-space: nowrap; flex-shrink: 0; }
    .trust-scroll { display: flex; gap: 0; animation: scroll-left 25s linear infinite; }
    .trust-item {
      display: flex; align-items: center; gap: 8px;
      font-family: var(--font-display); font-size: 14px; font-weight: 600;
      color: var(--text3); padding: 0 36px; white-space: nowrap;
      transition: color 0.2s;
    }
    .trust-item:hover { color: var(--text2); }
    .trust-sep { color: var(--border2); }
    @keyframes scroll-left {
      from { transform: translateX(0); }
      to { transform: translateX(-50%); }
    }

    /* ── Features ──────────────────────────────────────────── */
    .features { padding: 120px 0; position: relative; z-index: 1; }
    .features-header { text-align: center; margin-bottom: 72px; }
    .features-header .section-sub { margin: 0 auto; }
    .features-grid {
      display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px;
    }
    .feature-card {
      background: var(--grad-card); border: 1px solid var(--border);
      border-radius: var(--radius); padding: 32px 28px;
      transition: all 0.3s ease; position: relative; overflow: hidden;
    }
    .feature-card::before {
      content: ''; position: absolute; inset: 0; opacity: 0;
      background: linear-gradient(135deg, rgba(0,229,195,0.04), rgba(59,111,255,0.04));
      transition: opacity 0.3s;
    }
    .feature-card:hover { border-color: var(--border2); transform: translateY(-4px); box-shadow: 0 20px 60px rgba(0,0,0,0.4); }
    .feature-card:hover::before { opacity: 1; }
    .feature-icon {
      width: 48px; height: 48px; border-radius: 12px;
      display: flex; align-items: center; justify-content: center;
      font-size: 22px; margin-bottom: 20px; flex-shrink: 0;
    }
    .fi-teal { background: rgba(0,229,195,0.1); border: 1px solid rgba(0,229,195,0.2); }
    .fi-blue { background: rgba(59,111,255,0.1); border: 1px solid rgba(59,111,255,0.2); }
    .fi-violet { background: rgba(124,92,252,0.1); border: 1px solid rgba(124,92,252,0.2); }
    .feature-title { font-family: var(--font-display); font-size: 18px; font-weight: 700; color: var(--text); margin-bottom: 10px; }
    .feature-desc { font-size: 14.5px; color: var(--text2); line-height: 1.65; }
    @media (max-width: 900px) { .features-grid { grid-template-columns: repeat(2, 1fr); } }
    @media (max-width: 560px) { .features-grid { grid-template-columns: 1fr; } }

    /* ── Demo ──────────────────────────────────────────────── */
    .demo { padding: 100px 0; position: relative; z-index: 1; }
    .demo-inner { display: grid; grid-template-columns: 1fr 1fr; gap: 80px; align-items: center; }
    .demo-mockup { position: relative; }
    .demo-browser {
      background: var(--bg2); border: 1px solid var(--border2);
      border-radius: 16px; overflow: hidden; box-shadow: var(--shadow), var(--glow-teal);
    }
    .demo-page { padding: 28px; min-height: 420px; position: relative; }
    .demo-page-header { margin-bottom: 20px; }
    .demo-page-logo { width: 70px; height: 12px; background: rgba(255,255,255,0.12); border-radius: 4px; }
    .demo-page-nav { display: flex; gap: 12px; margin-top: 10px; }
    .demo-page-nav span { width: 40px; height: 8px; background: rgba(255,255,255,0.06); border-radius: 3px; }
    .demo-content { }
    .demo-hero-block { margin-bottom: 20px; }
    .demo-h1 { height: 22px; background: rgba(255,255,255,0.12); border-radius: 5px; width: 75%; margin-bottom: 10px; }
    .demo-h2 { height: 14px; background: rgba(255,255,255,0.07); border-radius: 4px; width: 90%; margin-bottom: 6px; }
    .demo-h2.short { width: 65%; }
    .demo-btn-fake { height: 36px; width: 110px; background: rgba(0,229,195,0.25); border-radius: 8px; margin-top: 14px; }
    .demo-img-block { height: 100px; background: rgba(255,255,255,0.04); border-radius: 10px; border: 1px solid var(--border); }

    .demo-widget {
      position: absolute; bottom: 16px; right: 16px; width: 260px;
    }
    .demo-chat-window {
      background: rgba(8,11,18,0.97); border: 1px solid rgba(0,229,195,0.2);
      border-radius: 14px; overflow: hidden; box-shadow: 0 16px 50px rgba(0,0,0,0.7);
    }
    .demo-chat-header {
      background: linear-gradient(90deg, rgba(0,229,195,0.15), rgba(59,111,255,0.15));
      padding: 12px 14px; display: flex; align-items: center; gap: 8px;
      border-bottom: 1px solid rgba(0,229,195,0.15);
    }
    .demo-avatar {
      width: 30px; height: 30px; border-radius: 50%;
      background: var(--grad-btn); display: flex; align-items: center; justify-content: center;
      font-size: 14px;
    }
    .demo-header-name { font-size: 12px; font-weight: 600; color: var(--text); }
    .demo-header-status { font-size: 10px; color: var(--teal); }
    .demo-msgs { padding: 12px; display: flex; flex-direction: column; gap: 9px; }
    .dm { font-size: 11.5px; line-height: 1.5; padding: 9px 11px; border-radius: 10px; max-width: 90%; }
    .dm-bot { background: rgba(255,255,255,0.06); border: 1px solid var(--border); color: var(--text2); border-radius: 10px 10px 10px 2px; }
    .dm-user { background: linear-gradient(135deg, rgba(0,229,195,0.18), rgba(59,111,255,0.18)); border: 1px solid rgba(0,229,195,0.2); color: var(--text); align-self: flex-end; border-radius: 10px 10px 2px 10px; }
    .dm-human { background: rgba(59,111,255,0.1); border: 1px solid rgba(59,111,255,0.2); color: #7ba5ff; border-radius: 10px 10px 10px 2px; }
    .dm-tag { font-size: 9px; color: var(--text3); margin-bottom: 3px; }
    .demo-input-row { padding: 8px 10px; border-top: 1px solid var(--border); display: flex; gap: 6px; align-items: center; }
    .demo-input-fake { flex: 1; background: rgba(255,255,255,0.04); border: 1px solid var(--border); border-radius: 6px; padding: 6px 10px; font-size: 11px; color: var(--text3); }
    .demo-send { width: 26px; height: 26px; border-radius: 6px; background: var(--grad-btn); display: flex; align-items: center; justify-content: center; }
    .demo-send svg { width: 12px; height: 12px; }
    .demo-fab { position: absolute; bottom: -12px; right: 0; width: 44px; height: 44px; border-radius: 50%; background: var(--grad-btn); box-shadow: 0 0 20px rgba(0,229,195,0.5); display: flex; align-items: center; justify-content: center; }
    .demo-fab svg { width: 20px; height: 20px; }

    .demo-content-side { }
    .demo-features { display: flex; flex-direction: column; gap: 24px; margin-top: 40px; }
    .demo-feat { display: flex; gap: 16px; align-items: flex-start; }
    .demo-feat-icon {
      width: 40px; height: 40px; border-radius: 10px; flex-shrink: 0;
      display: flex; align-items: center; justify-content: center; font-size: 18px;
      background: rgba(0,229,195,0.08); border: 1px solid rgba(0,229,195,0.15);
    }
    .demo-feat-title { font-family: var(--font-display); font-size: 15px; font-weight: 600; color: var(--text); margin-bottom: 4px; }
    .demo-feat-desc { font-size: 13.5px; color: var(--text2); line-height: 1.6; }

    @media (max-width: 860px) { .demo-inner { grid-template-columns: 1fr; } }

    /* ── How It Works ──────────────────────────────────────── */
    .how { padding: 120px 0; position: relative; z-index: 1; background: linear-gradient(180deg, transparent, rgba(255,255,255,0.015) 50%, transparent); }
    .how-header { text-align: center; margin-bottom: 72px; }
    .how-header .section-sub { margin: 0 auto; }
    .steps {
      display: grid; grid-template-columns: repeat(4, 1fr);
      gap: 2px; position: relative;
    }
    .steps::before {
      content: ''; position: absolute; top: 42px; left: 12.5%; right: 12.5%; height: 1px;
      background: linear-gradient(90deg, var(--teal), var(--blue), var(--violet));
      opacity: 0.3;
    }
    .step { padding: 0 20px; text-align: center; position: relative; }
    .step-num {
      width: 48px; height: 48px; border-radius: 50%; margin: 0 auto 24px;
      display: flex; align-items: center; justify-content: center;
      font-family: var(--font-display); font-size: 16px; font-weight: 800;
      background: var(--bg); border: 2px solid var(--border2); color: var(--text2);
      position: relative; z-index: 1; transition: all 0.3s;
    }
    .step:hover .step-num { border-color: var(--teal); color: var(--teal); box-shadow: 0 0 20px rgba(0,229,195,0.2); }
    .step-title { font-family: var(--font-display); font-size: 16px; font-weight: 700; color: var(--text); margin-bottom: 10px; }
    .step-desc { font-size: 13.5px; color: var(--text2); line-height: 1.65; }
    .step-emoji { font-size: 28px; margin-bottom: 16px; display: block; }
    @media (max-width: 760px) {
      .steps { grid-template-columns: repeat(2, 1fr); gap: 32px; }
      .steps::before { display: none; }
    }
    @media (max-width: 480px) { .steps { grid-template-columns: 1fr; } }

    /* ── Pricing ───────────────────────────────────────────── */
    .pricing { padding: 120px 0; position: relative; z-index: 1; }
    .pricing-header { text-align: center; margin-bottom: 64px; }
    .pricing-header .section-sub { margin: 0 auto; }
    .pricing-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; align-items: start; }
    .plan-card {
      background: var(--grad-card); border: 1px solid var(--border);
      border-radius: var(--radius); padding: 36px 32px;
      position: relative; overflow: hidden; transition: all 0.3s;
    }
    .plan-card:hover { transform: translateY(-4px); box-shadow: 0 24px 60px rgba(0,0,0,0.4); }
    .plan-card.popular {
      border-color: rgba(0,229,195,0.35);
      background: linear-gradient(145deg, rgba(0,229,195,0.05), rgba(59,111,255,0.04));
      box-shadow: 0 0 60px rgba(0,229,195,0.1), inset 0 1px 0 rgba(0,229,195,0.15);
    }
    .popular-badge {
      position: absolute; top: 20px; right: 20px;
      background: var(--grad-btn); color: #000; font-size: 11px; font-weight: 800;
      font-family: var(--font-display); text-transform: uppercase; letter-spacing: 0.08em;
      padding: 4px 10px; border-radius: 100px;
    }
    .plan-name {
      font-family: var(--font-display); font-size: 13px; font-weight: 700;
      text-transform: uppercase; letter-spacing: 0.1em; color: var(--text3);
      margin-bottom: 12px;
    }
    .plan-price { margin-bottom: 8px; display: flex; align-items: baseline; gap: 4px; }
    .plan-price-amount {
      font-family: var(--font-display); font-size: 52px; font-weight: 800;
      letter-spacing: -0.04em; color: var(--text);
    }
    .plan-price-period { font-size: 14px; color: var(--text3); }
    .plan-desc { font-size: 14px; color: var(--text2); margin-bottom: 28px; line-height: 1.6; }
    .plan-divider { height: 1px; background: var(--border); margin-bottom: 28px; }
    .plan-features { display: flex; flex-direction: column; gap: 12px; margin-bottom: 32px; }
    .plan-feat {
      display: flex; align-items: flex-start; gap: 10px;
      font-size: 14px; color: var(--text2);
    }
    .plan-feat-icon { width: 18px; height: 18px; flex-shrink: 0; margin-top: 1px; color: var(--teal); }
    .plan-feat-icon.dim { color: var(--text3); }
    .plan-feat-icon svg { width: 100%; height: 100%; }
    .btn-plan-primary {
      width: 100%; background: var(--grad-btn); color: #000; font-weight: 700;
      padding: 14px; border-radius: var(--radius-sm); cursor: pointer; border: none;
      font-family: var(--font-body); font-size: 15px;
      box-shadow: 0 0 30px rgba(0,229,195,0.3);
      transition: all 0.2s; display: flex; align-items: center; justify-content: center; gap: 8px;
    }
    .btn-plan-primary:hover { transform: translateY(-2px); box-shadow: 0 0 50px rgba(0,229,195,0.5); }
    .btn-plan-outline {
      width: 100%; background: transparent; color: var(--text); font-weight: 500;
      padding: 14px; border-radius: var(--radius-sm); cursor: pointer;
      border: 1px solid var(--border2); font-family: var(--font-body); font-size: 15px;
      transition: all 0.2s; display: flex; align-items: center; justify-content: center; gap: 8px;
      text-decoration: none;
    }
    .btn-plan-outline:hover { border-color: var(--teal); color: var(--teal); box-shadow: 0 0 20px rgba(0,229,195,0.15); }
    @media (max-width: 860px) { .pricing-grid { grid-template-columns: 1fr; max-width: 460px; margin: 0 auto; } }

    /* ── FAQ ───────────────────────────────────────────────── */
    .faq { padding: 100px 0; position: relative; z-index: 1; }
    .faq-inner { display: grid; grid-template-columns: 1fr 1.8fr; gap: 80px; align-items: start; }
    .faq-list { display: flex; flex-direction: column; gap: 2px; }
    .faq-item {
      border: 1px solid var(--border); border-radius: var(--radius-sm);
      overflow: hidden; transition: border-color 0.2s;
    }
    .faq-item.open { border-color: var(--border2); }
    .faq-q {
      padding: 20px 24px; display: flex; align-items: center; justify-content: space-between;
      cursor: pointer; font-size: 15px; font-weight: 500; color: var(--text);
      gap: 16px; user-select: none;
    }
    .faq-q:hover { color: var(--teal); }
    .faq-chevron { width: 18px; height: 18px; flex-shrink: 0; color: var(--text3); transition: transform 0.3s; }
    .faq-item.open .faq-chevron { transform: rotate(180deg); color: var(--teal); }
    .faq-a {
      max-height: 0; overflow: hidden; transition: max-height 0.35s ease;
    }
    .faq-item.open .faq-a { max-height: 300px; }
    .faq-a-inner { padding: 0 24px 20px; font-size: 14.5px; color: var(--text2); line-height: 1.7; }
    @media (max-width: 760px) { .faq-inner { grid-template-columns: 1fr; gap: 48px; } }

    /* ── Final CTA ─────────────────────────────────────────── */
    .cta-section { padding: 120px 24px; position: relative; z-index: 1; overflow: hidden; }
    .cta-card {
      max-width: 860px; margin: 0 auto;
      background: linear-gradient(135deg, rgba(0,229,195,0.06) 0%, rgba(59,111,255,0.06) 50%, rgba(124,92,252,0.06) 100%);
      border: 1px solid rgba(0,229,195,0.2); border-radius: 24px; padding: 80px 60px;
      text-align: center; position: relative; overflow: hidden;
      box-shadow: 0 0 80px rgba(0,229,195,0.08);
    }
    .cta-card::before {
      content: ''; position: absolute; top: 0; left: 0; right: 0; height: 1px;
      background: linear-gradient(90deg, transparent, rgba(0,229,195,0.5), transparent);
    }
    .cta-glow {
      position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%);
      width: 500px; height: 300px; border-radius: 50%;
      background: radial-gradient(ellipse, rgba(0,229,195,0.08) 0%, transparent 70%);
      pointer-events: none;
    }
    .cta-title { font-family: var(--font-display); font-size: clamp(32px, 4vw, 52px); font-weight: 800; line-height: 1.1; margin-bottom: 20px; position: relative; }
    .cta-sub { font-size: 18px; color: var(--text2); margin-bottom: 40px; position: relative; }
    .cta-actions { display: flex; gap: 14px; justify-content: center; flex-wrap: wrap; position: relative; }
    .cta-note { margin-top: 20px; font-size: 13px; color: var(--text3); position: relative; }
    @media (max-width: 600px) { .cta-card { padding: 48px 28px; } }

    /* ── Footer ────────────────────────────────────────────── */
    footer {
      border-top: 1px solid var(--border); padding: 60px 24px 40px;
      position: relative; z-index: 1;
    }
    .footer-inner { max-width: 1160px; margin: 0 auto; }
    .footer-top { display: grid; grid-template-columns: 1.5fr 1fr 1fr 1fr; gap: 48px; margin-bottom: 48px; }
    .footer-brand p { font-size: 14px; color: var(--text3); line-height: 1.7; margin-top: 12px; max-width: 240px; }
    .footer-col-title { font-family: var(--font-display); font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.1em; color: var(--text3); margin-bottom: 16px; }
    .footer-col a { display: block; text-decoration: none; font-size: 14px; color: var(--text2); padding: 4px 0; transition: color 0.2s; }
    .footer-col a:hover { color: var(--text); }
    .footer-bottom { display: flex; align-items: center; justify-content: space-between; padding-top: 24px; border-top: 1px solid var(--border); }
    .footer-copy { font-size: 13px; color: var(--text3); }
    .footer-legal { display: flex; gap: 20px; }
    .footer-legal a { font-size: 13px; color: var(--text3); text-decoration: none; transition: color 0.2s; }
    .footer-legal a:hover { color: var(--text2); }
    @media (max-width: 860px) { .footer-top { grid-template-columns: 1fr 1fr; } }
    @media (max-width: 480px) { .footer-top { grid-template-columns: 1fr; } .footer-bottom { flex-direction: column; gap: 12px; } }

    /* ── Hero + Other Responsive ───────────────────────────── */
    @media (max-width: 860px) {
      .hero-grid { grid-template-columns: 1fr; gap: 48px; }
      .hero-visual { display: none; }
      .hero { min-height: auto; padding: 100px 24px 60px; }
    }

    /* ── Scroll Animations ─────────────────────────────────── */
    .reveal { opacity: 0; transform: translateY(20px); transition: opacity 0.6s ease, transform 0.6s ease; }
    .reveal.visible { opacity: 1; transform: translateY(0); }

    /* ── Toast ─────────────────────────────────────────────── */
    #toast {
      position: fixed; bottom: 32px; left: 50%; transform: translateX(-50%) translateY(100px);
      background: var(--bg2); border: 1px solid var(--border2); color: var(--text);
      font-size: 14px; padding: 12px 24px; border-radius: 100px;
      box-shadow: 0 8px 32px rgba(0,0,0,0.5); z-index: 999;
      transition: transform 0.4s cubic-bezier(0.16,1,0.3,1);
      white-space: nowrap; display: flex; align-items: center; gap: 8px;
    }
    #toast.show { transform: translateX(-50%) translateY(0); }
  </style>
</head>
<body>

<!-- ── NAVBAR ─────────────────────────────────────────────── -->
<nav id="navbar">
  <div class="nav-inner">
    <a href="/" class="logo">
      <div class="logo-icon">
        <svg viewBox="0 0 24 24" fill="none" stroke="#000" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
        </svg>
      </div>
      Kiri AI
    </a>
    <ul class="nav-links">
      <li><a href="#features">Features</a></li>
      <li><a href="#demo">Demo</a></li>
      <li><a href="#pricing">Pricing</a></li>
      <li><a href="#faq">FAQ</a></li>
    </ul>
    <div class="nav-actions">
      <a href="/app.html" class="btn btn-ghost" style="padding:10px 20px;font-size:14px;">Login</a>
      <a href="/app.html" class="btn btn-primary" style="padding:10px 20px;font-size:14px;">Get Started</a>
    </div>
    <div class="hamburger" onclick="toggleMenu()" id="hamburger">
      <span></span><span></span><span></span>
    </div>
  </div>
</nav>

<div class="mobile-menu" id="mobileMenu">
  <a href="#features" onclick="closeMenu()">Features</a>
  <a href="#demo" onclick="closeMenu()">Demo</a>
  <a href="#pricing" onclick="closeMenu()">Pricing</a>
  <a href="#faq" onclick="closeMenu()">FAQ</a>
  <div class="divider"></div>
  <a href="/app.html">Login</a>
  <a href="/app.html" style="color:var(--teal);font-weight:600;">Get Started →</a>
</div>

<!-- ── HERO ───────────────────────────────────────────────── -->
<section class="hero" id="home">
  <div class="hero-bg">
    <div class="hero-orb hero-orb-1"></div>
    <div class="hero-orb hero-orb-2"></div>
    <div class="hero-orb hero-orb-3"></div>
  </div>
  <div class="hero-grid">
    <div class="hero-content">
      <div class="hero-badge">
        <span class="badge">AI-Powered Customer Chat</span>
      </div>
      <h1 class="hero-title">
        Your website<br>deserves a<br><span class="gradient-text">smarter chat.</span>
      </h1>
      <p class="hero-sub">
        Kiri AI answers customer questions instantly, captures leads 24/7, and hands off to your team the moment a human touch is needed.
      </p>
      <div class="hero-actions">
        <a href="/app.html" class="btn btn-primary">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
          Start Free
        </a>
        <a href="#demo" class="btn btn-outline">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polygon points="10 8 16 12 10 16 10 8"/></svg>
          View Demo
        </a>
      </div>
      <div class="hero-trust">
        <div class="hero-trust-avatars">
          <span>S</span><span>M</span><span>A</span><span>K</span>
        </div>
        <span>Trusted by 500+ businesses — no credit card required</span>
      </div>
    </div>

    <div class="hero-visual">
      <div class="browser-mockup">
        <div class="browser-bar">
          <div class="browser-dots"><span></span><span></span><span></span></div>
          <div class="browser-url">yourwebsite.com</div>
        </div>
        <div class="browser-body">
          <div class="site-placeholder">
            <div class="site-line w80"></div>
            <div class="site-line w60"></div>
            <div class="site-line w90"></div>
            <div class="site-line w40"></div>
          </div>
          <div class="site-placeholder">
            <div class="site-line w60"></div>
            <div class="site-line w80"></div>
          </div>

          <div class="chat-widget">
            <div class="chat-window">
              <div class="chat-header">
                <div class="chat-avatar">🤖</div>
                <div class="chat-header-info">
                  <div class="chat-header-name">Kiri AI</div>
                  <div class="chat-header-status">Online — AI powered</div>
                </div>
              </div>
              <div class="chat-messages">
                <div class="chat-msg">
                  <div class="chat-msg-bot">👋 Hi! I'm Kiri. How can I help you today?</div>
                </div>
                <div class="chat-msg chat-msg-user">
                  <div class="chat-msg-bot">What's your pricing?</div>
                </div>
                <div class="chat-msg">
                  <div class="chat-msg-bot">We offer a Free plan, a $29/mo Pro plan with unlimited chats, and custom Enterprise pricing. Want me to show you a comparison?</div>
                </div>
                <div class="chat-typing">
                  <span></span><span></span><span></span>
                </div>
              </div>
              <div class="chat-input-row">
                <div class="chat-input-fake">Type a message…</div>
                <div class="chat-send">
                  <svg viewBox="0 0 24 24" fill="none" stroke="#000" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
                </div>
              </div>
            </div>
            <div class="chat-bubble-btn">
              <svg viewBox="0 0 24 24" fill="none" stroke="#000" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</section>

<!-- ── TRUST STRIP ─────────────────────────────────────────── -->
<div class="trust-strip">
  <div class="trust-inner container">
    <span class="trust-label">Built for</span>
    <div style="overflow:hidden;flex:1;mask-image:linear-gradient(90deg,transparent,black 10%,black 90%,transparent)">
      <div class="trust-scroll">
        <span class="trust-item">🛒 eCommerce Shops</span>
        <span class="trust-item trust-sep">·</span>
        <span class="trust-item">🏢 Digital Agencies</span>
        <span class="trust-item trust-sep">·</span>
        <span class="trust-item">💼 Service Businesses</span>
        <span class="trust-item trust-sep">·</span>
        <span class="trust-item">🚀 SaaS Startups</span>
        <span class="trust-item trust-sep">·</span>
        <span class="trust-item">🏥 Healthcare Practices</span>
        <span class="trust-item trust-sep">·</span>
        <span class="trust-item">🏠 Real Estate</span>
        <span class="trust-item trust-sep">·</span>
        <span class="trust-item">⚖️ Law Firms</span>
        <span class="trust-item trust-sep">·</span>
        <!-- duplicate for seamless loop -->
        <span class="trust-item">🛒 eCommerce Shops</span>
        <span class="trust-item trust-sep">·</span>
        <span class="trust-item">🏢 Digital Agencies</span>
        <span class="trust-item trust-sep">·</span>
        <span class="trust-item">💼 Service Businesses</span>
        <span class="trust-item trust-sep">·</span>
        <span class="trust-item">🚀 SaaS Startups</span>
        <span class="trust-item trust-sep">·</span>
        <span class="trust-item">🏥 Healthcare Practices</span>
        <span class="trust-item trust-sep">·</span>
        <span class="trust-item">🏠 Real Estate</span>
        <span class="trust-item trust-sep">·</span>
        <span class="trust-item">⚖️ Law Firms</span>
        <span class="trust-item trust-sep">·</span>
      </div>
    </div>
  </div>
</div>

<!-- ── FEATURES ───────────────────────────────────────────── -->
<section class="features" id="features">
  <div class="container">
    <div class="features-header reveal">
      <div class="section-label">What Kiri AI Does</div>
      <h2 class="section-title">Everything your support<br>team needs — automated.</h2>
      <p class="section-sub">Kiri AI handles the repetitive questions so your team can focus on conversations that actually matter.</p>
    </div>
    <div class="features-grid">
      <div class="feature-card reveal">
        <div class="feature-icon fi-teal">🧠</div>
        <div class="feature-title">AI Website Assistant</div>
        <p class="feature-desc">Trained on your content, FAQs, and product info. Answers customer questions instantly — accurately — around the clock.</p>
      </div>
      <div class="feature-card reveal">
        <div class="feature-icon fi-blue">👥</div>
        <div class="feature-title">Human Takeover & Live Chat</div>
        <p class="feature-desc">One click and your team jumps in seamlessly. The full conversation history is right there — no context lost.</p>
      </div>
      <div class="feature-card reveal">
        <div class="feature-icon fi-violet">📚</div>
        <div class="feature-title">Knowledge Base Training</div>
        <p class="feature-desc">Upload docs, paste URLs, or type your FAQs. Kiri learns your business and answers questions the way you would.</p>
      </div>
      <div class="feature-card reveal">
        <div class="feature-icon fi-teal">🎨</div>
        <div class="feature-title">Widget Customization</div>
        <p class="feature-desc">Match your brand perfectly. Custom colors, logo, chat bubble, welcome message, and button position — all without touching code.</p>
      </div>
      <div class="feature-card reveal">
        <div class="feature-icon fi-blue">📥</div>
        <div class="feature-title">Conversation Inbox</div>
        <p class="feature-desc">All your chats in one clean dashboard. Filter by status, search conversations, and assign tickets to team members.</p>
      </div>
      <div class="feature-card reveal">
        <div class="feature-icon fi-violet">📊</div>
        <div class="feature-title">Analytics & Usage Tracking</div>
        <p class="feature-desc">See conversation volume, response rates, top questions, lead captures, and human takeover frequency at a glance.</p>
      </div>
    </div>
  </div>
</section>

<!-- ── DEMO ───────────────────────────────────────────────── -->
<section class="demo" id="demo">
  <div class="container">
    <div class="demo-inner">
      <div class="demo-mockup reveal">
        <div class="demo-browser">
          <div class="browser-bar">
            <div class="browser-dots"><span></span><span></span><span></span></div>
            <div class="browser-url">acmeshop.com</div>
          </div>
          <div class="demo-page">
            <div class="demo-page-header">
              <div class="demo-page-logo"></div>
              <div class="demo-page-nav">
                <span></span><span></span><span></span><span></span>
              </div>
            </div>
            <div class="demo-content">
              <div class="demo-hero-block">
                <div class="demo-h1"></div>
                <div class="demo-h2"></div>
                <div class="demo-h2 short"></div>
                <div class="demo-btn-fake"></div>
              </div>
              <div class="demo-img-block"></div>
            </div>

            <div class="demo-widget">
              <div class="demo-chat-window">
                <div class="demo-chat-header">
                  <div class="demo-avatar">🤖</div>
                  <div>
                    <div class="demo-header-name">Kiri AI</div>
                    <div class="demo-header-status">Online now</div>
                  </div>
                </div>
                <div class="demo-msgs">
                  <div class="dm dm-bot">Hi there! 👋 Can I help you find the right product?</div>
                  <div class="dm dm-user">Do you ship to Poland?</div>
                  <div class="dm dm-bot">Yes! We ship to 40+ countries including Poland. Standard delivery is 5–7 days, express 2–3 days.</div>
                  <div class="dm dm-user">Can I talk to someone?</div>
                  <div style="font-size:9px;color:var(--text3);padding:2px 0">🔄 Transferring to human agent…</div>
                  <div class="dm dm-human">
                    <div class="dm-tag">Sarah · Support Agent</div>
                    Hey! I'm Sarah. Happy to help you directly 😊
                  </div>
                </div>
                <div class="demo-input-row">
                  <div class="demo-input-fake">Reply to Sarah…</div>
                  <div class="demo-send">
                    <svg viewBox="0 0 24 24" fill="none" stroke="#000" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
                  </div>
                </div>
              </div>
              <div class="demo-fab">
                <svg viewBox="0 0 24 24" fill="none" stroke="#000" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="demo-content-side reveal">
        <div class="section-label">See It In Action</div>
        <h2 class="section-title">AI answers first.<br>Humans step in<br><span class="gradient-text">when it counts.</span></h2>
        <p class="section-sub">Watch Kiri handle a real customer conversation — from the first question to a seamless agent handoff.</p>
        <div class="demo-features">
          <div class="demo-feat">
            <div class="demo-feat-icon">⚡</div>
            <div>
              <div class="demo-feat-title">Instant AI Replies</div>
              <p class="demo-feat-desc">Your bot responds in under a second, 24/7. No wait times, no missed leads.</p>
            </div>
          </div>
          <div class="demo-feat">
            <div class="demo-feat-icon">🔁</div>
            <div>
              <div class="demo-feat-title">Smooth Human Handoff</div>
              <p class="demo-feat-desc">When the customer asks for a person, your agent gets the full chat history instantly.</p>
            </div>
          </div>
          <div class="demo-feat">
            <div class="demo-feat-icon">🎯</div>
            <div>
              <div class="demo-feat-title">Lead Capture Built In</div>
              <p class="demo-feat-desc">Kiri collects name, email, and intent before a human is even needed.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</section>

<!-- ── HOW IT WORKS ────────────────────────────────────────── -->
<section class="how" id="how">
  <div class="container">
    <div class="how-header reveal">
      <div class="section-label">Setup in Minutes</div>
      <h2 class="section-title">Four steps to live.</h2>
      <p class="section-sub">No developers, no complex setup. Go from signup to live AI chat in under 10 minutes.</p>
    </div>
    <div class="steps">
      <div class="step reveal">
        <div class="step-num">01</div>
        <span class="step-emoji">🏗️</span>
        <div class="step-title">Create Account</div>
        <p class="step-desc">Sign up free. No credit card required. Your dashboard is ready instantly.</p>
      </div>
      <div class="step reveal">
        <div class="step-num">02</div>
        <span class="step-emoji">🧠</span>
        <div class="step-title">Train Your Bot</div>
        <p class="step-desc">Paste your website URL or upload your FAQs. Kiri learns your business in minutes.</p>
      </div>
      <div class="step reveal">
        <div class="step-num">03</div>
        <span class="step-emoji">📋</span>
        <div class="step-title">Paste the Script</div>
        <p class="step-desc">Copy one line of code and paste it into your website. Works on any platform.</p>
      </div>
      <div class="step reveal">
        <div class="step-num">04</div>
        <span class="step-emoji">🚀</span>
        <div class="step-title">Go Live</div>
        <p class="step-desc">Your AI assistant is live. Watch conversations start rolling into your inbox.</p>
      </div>
    </div>
  </div>
</section>

<!-- ── PRICING ─────────────────────────────────────────────── -->
<section class="pricing" id="pricing">
  <div class="container">
    <div class="pricing-header reveal">
      <div class="section-label">Simple Pricing</div>
      <h2 class="section-title">Start strong. Scale when ready.</h2>
      <p class="section-sub">Simple plans for businesses that want a professional AI assistant on their website.</p>
    </div>
    <div class="pricing-grid">

      <!-- Free -->
      <div class="plan-card reveal">
        <div class="plan-name">Starter</div>
        <div class="plan-price">
          <span class="plan-price-amount">$30</span>
          <span class="plan-price-period">/month</span>
        </div>
        <p class="plan-desc">For small businesses that want a real AI chatbot installed on their website.</p>
        <div class="plan-divider"></div>
        <div class="plan-features">
          <div class="plan-feat">
            <span class="plan-feat-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg></span>
            <span>500 conversations / month</span>
          </div>
          <div class="plan-feat">
            <span class="plan-feat-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg></span>
            <span>1 website widget</span>
          </div>
          <div class="plan-feat">
            <span class="plan-feat-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg></span>
            <span>AI customer support responses</span>
          </div>
          <div class="plan-feat">
            <span class="plan-feat-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg></span>
            <span>Conversation inbox</span>
          </div>
          <div class="plan-feat">
            <span class="plan-feat-icon dim"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg></span>
            <span style="color:var(--text3)">Human takeover</span>
          </div>
          <div class="plan-feat">
            <span class="plan-feat-icon dim"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg></span>
            <span style="color:var(--text3)">Analytics dashboard</span>
          </div>
        </div>
        <a href="/app.html" class="btn-plan-outline">Start Starter</a>
      </div>

      <!-- Pro -->
      <div class="plan-card popular reveal">
        <div class="popular-badge">Most Popular</div>
        <div class="plan-name">Pro</div>
        <div class="plan-price">
          <span class="plan-price-amount">$120</span>
          <span class="plan-price-period">/month</span>
        </div>
        <p class="plan-desc">For growing businesses that need advanced AI support, live chat, analytics, and full customization.</p>
        <div class="plan-divider"></div>
        <div class="plan-features">
          <div class="plan-feat">
            <span class="plan-feat-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg></span>
            <span><strong style="color:var(--text)">Unlimited</strong> conversations</span>
          </div>
          <div class="plan-feat">
            <span class="plan-feat-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg></span>
            <span>Up to 5 websites</span>
          </div>
          <div class="plan-feat">
            <span class="plan-feat-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg></span>
            <span>Advanced AI + custom training</span>
          </div>
          <div class="plan-feat">
            <span class="plan-feat-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg></span>
            <span>Human takeover & live chat</span>
          </div>
          <div class="plan-feat">
            <span class="plan-feat-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg></span>
            <span>Analytics dashboard</span>
          </div>
          <div class="plan-feat">
            <span class="plan-feat-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg></span>
            <span>Widget branding & colors</span>
          </div>
          <div class="plan-feat">
            <span class="plan-feat-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg></span>
            <span>Lead capture forms</span>
          </div>
          <div class="plan-feat">
            <span class="plan-feat-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg></span>
            <span>Email support</span>
          </div>
        </div>
        <button class="btn-plan-primary" onclick="buyPro()">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
          Start Pro
        </button>
      </div>

      <!-- Enterprise -->
      <div class="plan-card reveal">
        <div class="plan-name">Enterprise</div>
        <div class="plan-price">
          <span class="plan-price-amount" style="font-size:38px;">Custom</span>
        </div>
        <p class="plan-desc">For larger teams and agencies needing white-label, SLAs, and dedicated support.</p>
        <div class="plan-divider"></div>
        <div class="plan-features">
          <div class="plan-feat">
            <span class="plan-feat-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg></span>
            <span>Everything in Pro</span>
          </div>
          <div class="plan-feat">
            <span class="plan-feat-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg></span>
            <span>Unlimited websites</span>
          </div>
          <div class="plan-feat">
            <span class="plan-feat-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg></span>
            <span>White-label widget</span>
          </div>
          <div class="plan-feat">
            <span class="plan-feat-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg></span>
            <span>Dedicated account manager</span>
          </div>
          <div class="plan-feat">
            <span class="plan-feat-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg></span>
            <span>Custom integrations & API</span>
          </div>
          <div class="plan-feat">
            <span class="plan-feat-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg></span>
            <span>SLA uptime guarantee</span>
          </div>
        </div>
        <a href="mailto:hello@kiri.ai" class="btn-plan-outline">Contact Sales</a>
      </div>
    </div>
  </div>
</section>

<!-- ── FAQ ────────────────────────────────────────────────── -->
<section class="faq" id="faq">
  <div class="container">
    <div class="faq-inner">
      <div class="reveal">
        <div class="section-label">FAQ</div>
        <h2 class="section-title">Questions?<br>We've got<br><span class="gradient-text">answers.</span></h2>
        <p style="font-size:15px;color:var(--text2);margin-top:20px;line-height:1.7;">
          Still curious? Drop us a line at<br>
          <a href="mailto:hello@kiri.ai" style="color:var(--teal);text-decoration:none;font-weight:500;">hello@kiri.ai</a>
        </p>
      </div>
      <div class="faq-list reveal">
        <div class="faq-item">
          <div class="faq-q" onclick="toggleFaq(this)">
            Does Kiri AI work on any website?
            <svg class="faq-chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"/></svg>
          </div>
          <div class="faq-a"><div class="faq-a-inner">Yes. Kiri AI works on any website — WordPress, Webflow, Shopify, Squarespace, Wix, custom HTML, or any framework. You just paste one line of JavaScript into your site's &lt;head&gt; or body and it's live.</div></div>
        </div>
        <div class="faq-item">
          <div class="faq-q" onclick="toggleFaq(this)">
            Can I customize how the widget looks?
            <svg class="faq-chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"/></svg>
          </div>
          <div class="faq-a"><div class="faq-a-inner">Absolutely. You can change the chat bubble color, header branding, bot avatar, welcome message, button position, and font — all from the dashboard without touching code. Pro and Enterprise plans also support full white-labeling.</div></div>
        </div>
        <div class="faq-item">
          <div class="faq-q" onclick="toggleFaq(this)">
            Can a human agent take over a conversation?
            <svg class="faq-chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"/></svg>
          </div>
          <div class="faq-a"><div class="faq-a-inner">Yes — that's one of Kiri's best features. On the Pro plan, any agent can click "Take Over" in the inbox and step into the conversation. The customer sees a smooth transition and the agent gets the full chat history. The AI steps aside automatically.</div></div>
        </div>
        <div class="faq-item">
          <div class="faq-q" onclick="toggleFaq(this)">
            Do I need to know how to code?
            <svg class="faq-chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"/></svg>
          </div>
          <div class="faq-a"><div class="faq-a-inner">No coding skills required. The dashboard walks you through everything — training your bot, customizing the widget, and installing it. Installation is a single copy-paste. If you can edit your website, you can install Kiri AI.</div></div>
        </div>
        <div class="faq-item">
          <div class="faq-q" onclick="toggleFaq(this)">
            What happens after I buy the Pro plan?
            <svg class="faq-chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"/></svg>
          </div>
          <div class="faq-a"><div class="faq-a-inner">You're upgraded instantly. All Pro features unlock immediately — unlimited conversations, human takeover, advanced analytics, and more. You'll receive a receipt via email and can manage your billing anytime from your account settings. Cancel anytime, no penalty.</div></div>
        </div>
        <div class="faq-item">
          <div class="faq-q" onclick="toggleFaq(this)">
            How does Kiri AI learn about my business?
            <svg class="faq-chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"/></svg>
          </div>
          <div class="faq-a"><div class="faq-a-inner">You can train Kiri by pasting your website URL (it crawls the content automatically), uploading PDF documents, or manually entering Q&A pairs. The more you train it, the more accurate it becomes. Training updates are live within seconds.</div></div>
        </div>
      </div>
    </div>
  </div>
</section>

<!-- ── FINAL CTA ───────────────────────────────────────────── -->
<section class="cta-section">
  <div class="cta-card reveal">
    <div class="cta-glow"></div>
    <div class="section-label" style="margin-bottom:20px;">Ready to launch?</div>
    <h2 class="cta-title">Launch your AI assistant<br><span class="gradient-text">today. For free.</span></h2>
    <p class="cta-sub">Join hundreds of businesses using Kiri AI to answer customers, capture leads, and never miss a conversation again.</p>
    <div class="cta-actions">
      <a href="/app.html" class="btn btn-primary" style="padding:15px 32px;font-size:16px;">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
        Start Free — No Card Needed
      </a>
      <a href="#demo" class="btn btn-outline" style="padding:15px 32px;font-size:16px;">See the Demo</a>
    </div>
    <p class="cta-note">Free plan forever · Upgrade anytime · Cancel anytime</p>
  </div>
</section>

<!-- ── FOOTER ─────────────────────────────────────────────── -->
<footer>
  <div class="footer-inner">
    <div class="footer-top">
      <div class="footer-brand">
        <a href="/" class="logo" style="font-size:18px;">
          <div class="logo-icon" style="width:28px;height:28px;border-radius:8px;">
            <svg viewBox="0 0 24 24" fill="none" stroke="#000" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="width:14px;height:14px;"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
          </div>
          Kiri AI
        </a>
        <p>AI chatbot widget for business websites. Answer customers, capture leads, and hand off to humans — all in one tool.</p>
      </div>
      <div>
        <div class="footer-col-title">Product</div>
        <div class="footer-col">
          <a href="#features">Features</a>
          <a href="#pricing">Pricing</a>
          <a href="#demo">Demo</a>
          <a href="#how">How It Works</a>
        </div>
      </div>
      <div>
        <div class="footer-col-title">Company</div>
        <div class="footer-col">
          <a href="#">About</a>
          <a href="#">Blog</a>
          <a href="#">Changelog</a>
          <a href="mailto:hello@kiri.ai">Contact</a>
        </div>
      </div>
      <div>
        <div class="footer-col-title">Legal</div>
        <div class="footer-col">
          <a href="#">Privacy Policy</a>
          <a href="#">Terms of Service</a>
          <a href="#">Cookie Policy</a>
          <a href="#">GDPR</a>
        </div>
      </div>
    </div>
    <div class="footer-bottom">
      <div class="footer-copy">© 2026 Kiri AI. All rights reserved.</div>
      <div class="footer-legal">
        <a href="#">Privacy</a>
        <a href="#">Terms</a>
        <a href="mailto:hello@kiri.ai">Contact</a>
      </div>
    </div>
  </div>
</footer>

<div id="toast"></div>

<script>
  /* ── Navbar scroll ─────────────────────────────────────── */
  const navbar = document.getElementById('navbar');
  window.addEventListener('scroll', () => {
    navbar.classList.toggle('scrolled', window.scrollY > 20);
  });

  /* ── Mobile menu ────────────────────────────────────────── */
  function toggleMenu() {
    document.getElementById('mobileMenu').classList.toggle('open');
  }
  function closeMenu() {
    document.getElementById('mobileMenu').classList.remove('open');
  }

  /* ── FAQ accordion ──────────────────────────────────────── */
  function toggleFaq(el) {
    const item = el.closest('.faq-item');
    const isOpen = item.classList.contains('open');
    document.querySelectorAll('.faq-item').forEach(i => i.classList.remove('open'));
    if (!isOpen) item.classList.add('open');
  }

  /* ── Scroll reveal ──────────────────────────────────────── */
  const reveals = document.querySelectorAll('.reveal');
  const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry, i) => {
      if (entry.isIntersecting) {
        const delay = Array.from(entry.target.parentNode.children).indexOf(entry.target) * 80;
        setTimeout(() => entry.target.classList.add('visible'), delay);
        revealObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });
  reveals.forEach(el => revealObserver.observe(el));

  /* ── Toast helper ───────────────────────────────────────── */
  function showToast(msg, emoji = '✅') {
    const t = document.getElementById('toast');
    t.innerHTML = `<span>${emoji}</span> ${msg}`;
    t.classList.add('show');
    setTimeout(() => t.classList.remove('show'), 3500);
  }

  /* ── Plan CTA ───────────────────────────────────────────── */
  function buyPro() {
    /*
      Safe flow for current Kiri backend:
      Your backend /create-checkout currently needs an existing user.site_key.
      So public landing page sends customers to the app first.
      After they register/login, checkout can happen safely from app.html.
    */
    showToast('Create your account first — then choose Pro inside the app.', '⚡');

    setTimeout(() => {
      window.location.href = '/app.html?plan=pro';
    }, 700);
  }

  /* ── Smooth anchor scroll ───────────────────────────────── */
  document.querySelectorAll('a[href^="#"]').forEach(a => {
    a.addEventListener('click', e => {
      const target = document.querySelector(a.getAttribute('href'));
      if (target) {
        e.preventDefault();
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });
  });
</script>
</body>
</html>
