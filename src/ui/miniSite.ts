import * as THREE from 'three';
import { CSS3DObject, CSS3DRenderer } from 'three/examples/jsm/renderers/CSS3DRenderer.js';
import { portfolioConfig } from '../config';

export class MiniSite {
  private rootEl: HTMLDivElement;
  private css3dObj: CSS3DObject | null = null;
  private visible = false;
  onClose?: () => void;

  private commandHistory: string[] = [];
  private historyIndex: number = -1;
  private outputEl: HTMLDivElement;
  private inputEl: HTMLInputElement;
  private styleEl: HTMLStyleElement;

  constructor() {
    this.rootEl = document.createElement('div');
    this.rootEl.className = 'mini-site';
    this.rootEl.style.width = '900px';
    this.rootEl.style.height = '550px';
    this.rootEl.style.background = '#1a1a1a';
    this.rootEl.style.border = '2px solid #333';
    this.rootEl.style.borderRadius = '8px';
    this.rootEl.style.overflow = 'hidden';
    this.rootEl.style.pointerEvents = 'auto';
    this.rootEl.style.fontFamily = 'monospace';
    this.rootEl.style.display = 'block';
    this.rootEl.style.position = 'relative';
    this.rootEl.style.touchAction = 'pan-y';
    
    // Add additional properties to ensure proper scrolling behavior in CSS3D context
    this.rootEl.style.transform = 'translateZ(0)'; // Force hardware acceleration
    this.rootEl.style.willChange = 'auto';

    // Create style element that we can update
    this.styleEl = document.createElement('style');
    this.updateStyles();
    this.rootEl.appendChild(this.styleEl);

    // Add resize listener to update font sizes
    window.addEventListener('resize', () => this.updateStyles());

    const additionalStyle = document.createElement('style');
    additionalStyle.textContent = `
      .terminal-header { 
        background: #333; 
        color: #fff; 
        padding: 8px 12px; 
        border-bottom: 2px solid #555; 
        font-size: ${this.getResponsiveHeaderFontSize()}px;
        display: flex;
        align-items: center;
        gap: 15px;
        flex-wrap: wrap;
        min-height: auto;
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        z-index: 10;
        box-sizing: border-box;
      }
      .terminal-header span { 
        cursor: pointer; 
        transition: color 0.2s; 
        padding: ${this.getResponsiveHeaderPadding()}px;
        min-height: ${this.getResponsiveTouchTarget()}px;
        display: inline-flex;
        align-items: center;
        border-radius: 3px;
      }
      .terminal-header span:hover { color: #00ff00; text-decoration: underline; }
      .terminal-content { 
        padding: ${this.getResponsiveContentPadding()}px; 
        background: #1a1a1a;
        line-height: ${this.getResponsiveLineHeight()};
        display: flex;
        flex-direction: column;
        position: absolute;
        top: 50px;
        bottom: 60px;
        left: 0;
        right: 0;
        overflow: hidden;
      }
      .terminal-output { 
        position: absolute;
        top: 0;
        bottom: 0;
        left: 0;
        right: 0;
        overflow-y: auto;
        overflow-x: hidden;
        white-space: pre-wrap; 
        word-wrap: break-word;
        line-height: ${this.getResponsiveLineHeight()};
        padding-right: 8px;
        scrollbar-width: thin;
        scrollbar-color: #00ff00 #2a2a2a;
        touch-action: pan-y;
        -webkit-overflow-scrolling: touch;
      }
      .terminal-output::-webkit-scrollbar {
        width: 8px;
      }
      .terminal-output::-webkit-scrollbar-track {
        background: #2a2a2a;
        border-radius: 4px;
      }
      .terminal-output::-webkit-scrollbar-thumb {
        background: #00ff00;
        border-radius: 4px;
      }
      .terminal-output::-webkit-scrollbar-thumb:hover {
        background: #66ff66;
      }
      .terminal-content::after {
        content: '';
        position: absolute;
        bottom: 0;
        right: 0;
        width: 20px;
        height: 20px;
        background: linear-gradient(45deg, transparent 30%, rgba(0,255,0,0.1) 100%);
        pointer-events: none;
        border-radius: 3px 0 0 0;
      }
      /* Force proper CSS3D scrolling behavior */
      .mini-site * {
        transform-style: flat !important;
      }
      .terminal-output * {
        transform: none !important;
        backface-visibility: visible !important;
      }
      .terminal-input-line { 
        display: flex; 
        align-items: center; 
        background: #1a1a1a;
        padding: ${this.getResponsiveInputPadding()}px;
        min-height: ${this.getResponsiveTouchTarget()}px;
        border-top: 1px solid #333;
        position: absolute;
        bottom: 0;
        left: 0;
        right: 0;
        z-index: 5;
        box-sizing: border-box;
      }
      .terminal-prompt { 
        color: #00ff00; 
        margin-right: 8px; 
        font-size: ${this.getResponsiveFontSize()}px;
      }
      .terminal-input { 
        background: transparent; 
        border: none; 
        color: #00ff00; 
        font-family: inherit; 
        font-size: ${this.getResponsiveFontSize()}px; 
        outline: none; 
        flex: 1;
        min-height: ${this.getResponsiveInputHeight()}px;
        padding: 4px 0;
      }
      .command-output { margin: 8px 0; }
      .command-output img { 
        max-width: 150px; 
        height: auto; 
        border-radius: 6px; 
        border: 1px solid #00ff00;
        image-rendering: auto;
      }
      .error { color: #ff6666; }
      .info { color: #66ccff; }
      .success { color: #66ff66; }
      .highlight { color: #ffff66; }
      a { 
        color: #00ff00; 
        text-decoration: underline; 
        cursor: pointer;
      }
      a:hover { 
        color: #66ff66; 
        text-decoration: none; 
      }
      a:visited { 
        color: #00cc00; 
      }
    `;
    this.rootEl.appendChild(additionalStyle);

    // Terminal header with navigation options
    const header = document.createElement('div');
    header.className = 'terminal-header';
    header.innerHTML = `
      <span data-cmd="help">help</span> |
      <span data-cmd="about">about</span> |
      <span data-cmd="projects">projects</span> |
      <span data-cmd="skills">skills</span> |
      <span data-cmd="experience">experience</span> |
      <span data-cmd="contact">contact</span> |
      <span data-cmd="education">education</span> |
      <span data-cmd="certifications">certifications</span> |
      <span data-cmd="leadership">leadership</span> |
      <span data-cmd="sudo">sudo</span> |
      <span data-cmd="clear">clear</span>
    `;
    this.rootEl.appendChild(header);

    // Terminal content
    const content = document.createElement('div');
    content.className = 'terminal-content';
    
    this.outputEl = document.createElement('div');
    this.outputEl.className = 'terminal-output';
    const welcome = portfolioConfig.getTerminalWelcome();
    this.outputEl.innerHTML = `<div class="success">${welcome.title}</div>
<div class="info">${welcome.subtitle}</div>
<div>${welcome.divider}</div>`;
    
    const inputContainer = document.createElement('div');
    inputContainer.className = 'terminal-input-line';
    
    const prompt = document.createElement('span');
    prompt.className = 'terminal-prompt';
    prompt.textContent = portfolioConfig.getTerminalPrompt();
    
    this.inputEl = document.createElement('input');
    this.inputEl.className = 'terminal-input';
    this.inputEl.type = 'text';
    this.inputEl.placeholder = portfolioConfig.getTerminalPlaceholder();
    
    inputContainer.appendChild(prompt);
    inputContainer.appendChild(this.inputEl);
    
    content.appendChild(this.outputEl);
    
    this.rootEl.appendChild(content);
    this.rootEl.appendChild(inputContainer);

    // Event listeners
    this.inputEl.addEventListener('keydown', (e) => this.handleKeyDown(e));
    header.addEventListener('click', async (e) => {
      const target = e.target as HTMLElement;
      const cmd = target.getAttribute('data-cmd');
      if (cmd) {
        // Show the command as if it was typed
        this.appendToOutput(`<div><span class="terminal-prompt">user@portfolio:~$</span> ${cmd}</div>`);
        this.addToHistory(cmd);
        await this.executeCommand(cmd);
      }
    });

    // Add explicit scroll event handlers
    this.setupScrollHandlers();

    // Auto-focus input when visible
    setTimeout(() => this.inputEl.focus(), 100);
  }

  private async handleKeyDown(e: KeyboardEvent) {
    if (e.key === 'Enter') {
      const command = this.inputEl.value.trim();
      if (command) {
        this.addToHistory(command);
        this.appendToOutput(`<div><span class="terminal-prompt">user@portfolio:~$</span> ${command}</div>`);
        await this.executeCommand(command);
        this.inputEl.value = '';
      }
      this.historyIndex = -1;
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      this.navigateHistory(-1);
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      this.navigateHistory(1);
    }
  }

  private addToHistory(command: string) {
    this.commandHistory.unshift(command);
    if (this.commandHistory.length > 50) {
      this.commandHistory = this.commandHistory.slice(0, 50);
    }
  }

  private navigateHistory(direction: number) {
    if (this.commandHistory.length === 0) return;
    
    this.historyIndex += direction;
    if (this.historyIndex < -1) this.historyIndex = -1;
    if (this.historyIndex >= this.commandHistory.length) this.historyIndex = this.commandHistory.length - 1;
    
    this.inputEl.value = this.historyIndex === -1 ? '' : this.commandHistory[this.historyIndex];
  }

  private appendToOutput(content: string) {
    this.outputEl.innerHTML += content;
    this.scrollToBottom();
  }

  private scrollToBottom() {
    // Scroll the output element which now has the overflow
    requestAnimationFrame(() => {
      this.outputEl.scrollTop = this.outputEl.scrollHeight;
    });
  }

  private setupScrollHandlers() {
    // Handle mouse wheel scrolling
    this.outputEl.addEventListener('wheel', (e) => {
      e.stopPropagation();
      const delta = e.deltaY;
      this.outputEl.scrollTop += delta;
      e.preventDefault();
    }, { passive: false });

    // Handle touch scrolling on mobile
    let touchStart = 0;
    this.outputEl.addEventListener('touchstart', (e) => {
      e.stopPropagation();
      touchStart = e.touches[0].clientY;
    }, { passive: true });

    this.outputEl.addEventListener('touchmove', (e) => {
      e.stopPropagation();
      const touchCurrent = e.touches[0].clientY;
      const diff = touchStart - touchCurrent;
      this.outputEl.scrollTop += diff;
      touchStart = touchCurrent;
      e.preventDefault();
    }, { passive: false });

    // Handle keyboard scrolling
    this.outputEl.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
        e.stopPropagation();
        const scrollAmount = 50;
        if (e.key === 'ArrowUp') {
          this.outputEl.scrollTop -= scrollAmount;
        } else {
          this.outputEl.scrollTop += scrollAmount;
        }
        e.preventDefault();
      }
    });

    // Make output element focusable for keyboard events
    this.outputEl.setAttribute('tabindex', '0');
  }

  private async typeOutput(content: string, speed: number = 20) {
    const div = document.createElement('div');
    div.className = 'command-output';
    this.outputEl.appendChild(div);
    
    // Split content into lines and process each line
    const lines = content.trim().split('\n');
    
    for (let lineIndex = 0; lineIndex < lines.length; lineIndex++) {
      const line = lines[lineIndex];
      
      if (line.trim() === '') {
        // Add empty line
        const lineDiv = document.createElement('div');
        lineDiv.innerHTML = '&nbsp;';
        div.appendChild(lineDiv);
        this.scrollToBottom();
        await new Promise(resolve => setTimeout(resolve, speed * 2));
        continue;
      }
      
      const lineDiv = document.createElement('div');
      div.appendChild(lineDiv);
      
      // For lines with HTML tags, we need to type the visible text while preserving HTML
      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = line;
      const textContent = tempDiv.textContent || tempDiv.innerText || '';
      
      // Type character by character
      for (let i = 0; i <= textContent.length; i++) {
        const visibleText = textContent.substring(0, i);
        
        // Create a version of the HTML with only the visible characters
        let htmlWithPartialText = line;
        if (textContent.length > 0) {
          // Replace text content in HTML with partial text
          const ratio = i / textContent.length;
          if (ratio < 1) {
            // Find and replace text nodes
            tempDiv.innerHTML = line;
            this.replaceTextContent(tempDiv, visibleText, textContent);
            htmlWithPartialText = tempDiv.innerHTML;
          }
        }
        
        lineDiv.innerHTML = htmlWithPartialText;
        this.scrollToBottom();
        
        if (i < textContent.length) {
          await new Promise(resolve => setTimeout(resolve, speed));
        }
      }
    }
    
    this.scrollToBottom();
  }

  private replaceTextContent(element: HTMLElement, visibleText: string, fullText: string) {
    const walker = document.createTreeWalker(
      element,
      NodeFilter.SHOW_TEXT
    );
    
    let textNodes: Text[] = [];
    let node;
    
    while (node = walker.nextNode()) {
      textNodes.push(node as Text);
    }
    
    let currentPos = 0;
    const targetLength = visibleText.length;
    
    for (const textNode of textNodes) {
      const nodeText = textNode.textContent || '';
      const nodeStart = currentPos;
      const nodeEnd = currentPos + nodeText.length;
      
      if (nodeStart >= targetLength) {
        // This node is completely beyond our target, hide it
        textNode.textContent = '';
      } else if (nodeEnd <= targetLength) {
        // This node is completely within our target, keep it
        currentPos = nodeEnd;
      } else {
        // This node is partially within our target
        const partialLength = targetLength - nodeStart;
        textNode.textContent = nodeText.substring(0, partialLength);
        currentPos = targetLength;
        break;
      }
    }
  }

  private async executeCommand(cmd: string) {
    const command = cmd.toLowerCase().trim();
    
    switch (command) {
      case 'help':
        await this.showHelp();
        break;
      case 'about':
        await this.showAbout();
        break;
      case 'projects':
        await this.showProjects();
        break;
      case 'skills':
        await this.showSkills();
        break;
      case 'experience':
        await this.showExperience();
        break;
      case 'contact':
        await this.showContact();
        break;
      case 'education':
        await this.showEducation();
        break;
      case 'certifications':
        await this.showCertifications();
        break;
      case 'leadership':
        await this.showLeadership();
        break;
      case 'sudo':
        await this.showSudo();
        break;
      case 'clear':
        this.clearTerminal();
        break;
      case 'exit':
      case 'close':
        this.setVisible(false);
        this.onClose?.();
        break;
      default:
        await this.typeOutput(`<div class="error">Command not found: ${cmd}</div><div class="info">Type 'help' to see available commands.</div>`, 20);
    }
  }

  private async showHelp() {
    const helpConfig = portfolioConfig.getTerminalSection('help') as any;
    const commandsHtml = helpConfig.commands
      .map((cmd: any) => `  <span class="success">${cmd.cmd}</span>${' '.repeat(Math.max(1, 15 - cmd.cmd.length))} - ${cmd.desc}`)
      .join('\n');
    
    await this.typeOutput(`
<div class="highlight">${helpConfig.title}</div>
<div>
${commandsHtml}
</div>
<div class="info">${helpConfig.footer}</div>
`, 15);
  }

  private async showAbout() {
    const aboutConfig = portfolioConfig.getTerminalSection('about') as any;
    const profileImage = portfolioConfig.getProfileImage();
    const specialtiesHtml = aboutConfig.specialties
      .map((specialty: string) => `• ${specialty}`)
      .join('\n');
    
    await this.typeOutput(`
<div class="highlight">${aboutConfig.title}</div>
<div style="display: flex; gap: 20px; align-items: flex-start; margin: 15px 0;">
  <img src="${profileImage}" alt="Profile Picture" style="width: 120px; height: 120px; border-radius: 8px; object-fit: cover; border: 2px solid #00ff00;">
  <div style="flex: 1;">
    ${aboutConfig.content}
  </div>
</div>
<div>
<span class="info">Specialties:</span>
${specialtiesHtml}
</div>
`, 15);
  }

  private async showProjects() {
    const projectsConfig = portfolioConfig.getTerminalSection('projects') as any;
    const projectsHtml = projectsConfig.projects
      .map((project: any) => `<span class="success">${project.icon} ${project.name}</span>
${project.description}
Technologies: ${project.technologies}`)
      .join('\n\n');
    
    await this.typeOutput(`
<div class="highlight">${projectsConfig.title}</div>
<div>
${projectsHtml}

<span class="info">${projectsConfig.footer}</span>
</div>
`, 15);
  }

  private async showSkills() {
    const skillsConfig = portfolioConfig.getTerminalSection('skills') as any;
    const categoriesHtml = skillsConfig.categories
      .map((category: any) => {
        const skillsHtml = category.skills.map((skill: string) => `• ${skill}`).join('\n');
        return `<span class="success">${category.name}:</span>\n${skillsHtml}`;
      })
      .join('\n\n');
    
    await this.typeOutput(`
<div class="highlight">${skillsConfig.title}</div>
<div>
${categoriesHtml}
</div>
`, 15);
  }

  private async showExperience() {
    const experienceConfig = portfolioConfig.getTerminalSection('experience') as any;
    const positionsHtml = experienceConfig.positions
      .map((position: any) => {
        const highlightsHtml = position.highlights.map((highlight: string) => `• ${highlight}`).join('\n');
        return `<span class="success">${position.title}</span> <span class="info">(${position.period})</span>
${position.company}
${highlightsHtml}`;
      })
      .join('\n\n');
    
    await this.typeOutput(`
<div class="highlight">${experienceConfig.title}</div>
<div>
${positionsHtml}
</div>
`, 15);
  }

  private async showContact() {
    const contact = portfolioConfig.getContact();
    
    await this.typeOutput(`
<div class="highlight">Contact Information</div>
<div>
📧 <span class="success">Email:</span> <a href="mailto:${contact.email}" target="_blank" rel="noopener noreferrer">${contact.email}</a>
🌐 <span class="success">Website:</span> <a href="${contact.website}" target="_blank" rel="noopener noreferrer">${contact.website}</a>
💼 <span class="success">LinkedIn:</span> <a href="${contact.linkedin}" target="_blank" rel="noopener noreferrer">${contact.linkedin}</a>
🐙 <span class="success">GitHub:</span> <a href="${contact.github}" target="_blank" rel="noopener noreferrer">${contact.github}</a>
📱 <span class="success">Phone:</span> <a href="tel:${contact.phone}">${contact.phone}</a>

<span class="info">Feel free to reach out for opportunities or collaborations!</span>
</div>
`, 15);
  }

  private async showEducation() {
    const educationConfig = portfolioConfig.getTerminalSection('education') as any;
    const degree = educationConfig.degree;
    const detailsHtml = degree.details.map((detail: string) => `• ${detail}`).join('\n');
    const courseworkHtml = educationConfig.coursework.map((course: string) => `• ${course}`).join('\n');
    const projectsHtml = educationConfig.projects.map((project: string) => `• ${project}`).join('\n');
    
    await this.typeOutput(`
<div class="highlight">${educationConfig.title}</div>
<div>
<span class="success">${degree.title}</span>
${degree.school} <span class="info">(${degree.period})</span>
${detailsHtml}

<span class="success">Relevant Coursework:</span>
${courseworkHtml}

<span class="success">Academic Projects:</span>
${projectsHtml}
</div>
`, 15);
  }

  private async showCertifications() {
    const certificationsConfig = portfolioConfig.getTerminalSection('certifications') as any;
    const certificationsHtml = certificationsConfig.certifications
      .map((cert: any) => `<span class="success">${cert.name}</span> <span class="info">(${cert.year})</span>
${cert.issuer}`)
      .join('\n\n');
    
    await this.typeOutput(`
<div class="highlight">${certificationsConfig.title}</div>
<div>
${certificationsHtml}

<span class="info">${certificationsConfig.footer}</span>
</div>
`, 15);
  }

  private async showLeadership() {
    const leadershipConfig = portfolioConfig.getTerminalSection('leadership') as any;
    
    const experienceHtml = leadershipConfig.experience
      .map((exp: any) => {
        const highlightsHtml = exp.highlights.map((highlight: string) => `• ${highlight}`).join('\n');
        const period = exp.period ? ` <span class="info">(${exp.period})</span>` : '';
        return `<span class="success">${exp.role}</span>${period}
${highlightsHtml}`;
      })
      .join('\n\n');
    
    const achievementsHtml = leadershipConfig.achievements
      .map((achievement: string) => `• ${achievement}`)
      .join('\n');
      
    const communityHtml = leadershipConfig.community
      .map((activity: string) => `• ${activity}`)
      .join('\n');
    
    await this.typeOutput(`
<div class="highlight">${leadershipConfig.title}</div>
<div>
${experienceHtml}

<span class="success">Achievements:</span>
${achievementsHtml}

<span class="success">Community Involvement:</span>
${communityHtml}
</div>
`, 15);
  }

  private async showSudo() {
    const sudoConfig = portfolioConfig.getTerminalSection('sudo') as any;
    const factsHtml = sudoConfig.funFacts
      .map((fact: string) => `• ${fact}`)
      .join('\n');
    
    await this.typeOutput(`
<div class="error">${sudoConfig.title}</div>
<div class="info">${sudoConfig.message}</div>
<div>
However, I appreciate your curiosity! Here's a secret:
<span class="highlight">${sudoConfig.secret}</span>

<span class="success">Fun Facts:</span>
${factsHtml}
</div>
`, 15);
  }

  private clearTerminal() {
    const welcome = portfolioConfig.getTerminalWelcome();
    this.outputEl.innerHTML = `<div class="success">Terminal cleared. Welcome back!</div>
<div class="info">Type 'help' to see available commands.</div>
<div>${welcome.divider}</div>`;
  }

  attachTo(screenNode: THREE.Object3D, css3d: CSS3DRenderer, camera: THREE.Camera) {
    console.log(`🖥️ MiniSite attachTo called, screenNode:`, screenNode);
    // Create only once
    if (!this.css3dObj) {
      this.css3dObj = new CSS3DObject(this.rootEl);
      this.css3dObj.element.style.pointerEvents = 'none';
      console.log(`🖥️ Created CSS3DObject for mini site`);
    }

  // Parent under the screen node for orientation alignment
  screenNode.add(this.css3dObj);
  this.css3dObj.rotation.set(0, 0, 0);

  // Compute bbox center in world, then convert to screen local to position the CSS3D at the screen's center
  const bbox = new THREE.Box3().setFromObject(screenNode);
  const size = new THREE.Vector3();
  bbox.getSize(size);
  const centerWorld = new THREE.Vector3();
  bbox.getCenter(centerWorld);
  const centerLocal = screenNode.worldToLocal(centerWorld.clone());
  this.css3dObj.position.set(centerLocal.x, centerLocal.y, centerLocal.z + 0.001);

  // Match Screen aspect exactly by resizing the HTML element, then use uniform scale so
  // world height == screen height and world width == screen width (no distortion, edge-to-edge)
  const width = Math.max(1e-6, size.x);
  const height = Math.max(1e-6, size.y);
  const aspect = width / height;
  
  // Responsive pixel height for better text scaling on smaller screens
  const targetPxH = this.getResponsiveCanvasHeight();
  const targetPxW = Math.max(1, Math.round(targetPxH * aspect));
  this.rootEl.style.width = `${targetPxW}px`;
  this.rootEl.style.height = `${targetPxH}px`;
  // Uniform scale to map pixel height to world height
  const s = height / targetPxH;
  this.css3dObj.scale.setScalar(s);
  }

  setVisible(v: boolean) {
    console.log(`🖥️ MiniSite setVisible(${v}), has css3dObj: ${!!this.css3dObj}`);
    this.visible = v;
    if (this.css3dObj) {
      this.css3dObj.element.style.pointerEvents = v ? 'auto' : 'none';
      // CSS3DObject uses Object3D.visible property
      (this.css3dObj as any).visible = v;
      console.log(`🖥️ CSS3D object visibility set to: ${v}`);
    }
    this.rootEl.style.display = v ? 'block' : 'none';
    this.rootEl.style.visibility = v ? 'visible' : 'hidden';
    
    // Auto-focus input when becoming visible
    if (v) {
      setTimeout(() => this.inputEl.focus(), 100);
    }
  }

  isVisible() {
    return this.visible;
  }

  async navigate(section: string) {
    // Execute the command directly
    await this.executeCommand(section);
  }

  private showTab(tabKey: string) {
    this.navigate(tabKey);
  }

  private showTabById(id: string) {
    // Not needed for terminal interface
  }

  private updateStyles(): void {
    if (!this.styleEl) return;
    
    const fontSize = this.getResponsiveFontSize();
    const headerSize = this.getResponsiveHeaderFontSize();
    
    console.log(`MiniSite: Updating styles - Screen: ${window.innerWidth}x${window.innerHeight}, FontSize: ${fontSize}px, HeaderSize: ${headerSize}px`);
    
    this.styleEl.textContent = `
      .mini-site { 
        color: #00ff00; 
        font-family: 'Courier New', monospace; 
        font-size: ${fontSize}px; 
      }
      .terminal-prompt { 
        color: #00ff00; 
        margin-right: 8px; 
        flex-shrink: 0; 
        font-size: ${fontSize}px;
      }
      .terminal-input { 
        background: transparent; 
        border: none; 
        color: #00ff00; 
        font-family: inherit; 
        font-size: ${fontSize}px; 
        outline: none; 
        flex: 1;
        min-height: ${this.getResponsiveInputHeight()}px;
        padding: 4px 0;
      }
      .terminal-header { 
        font-size: ${headerSize}px;
      }
      .terminal-output { 
        line-height: ${this.getResponsiveLineHeight()};
      }
    `;
  }

  private getResponsiveFontSize(): number {
    const width = window.innerWidth;
    const height = window.innerHeight;
    
    // Base font sizes for different screen sizes
    if (width <= 480) {
      // Mobile phones - larger font for readability
      return height <= 500 ? 16 : 32; // Landscape vs portrait
    } else if (width <= 768) {
      // Tablets and large phones
      return 32;
    } else if (width <= 1024) {
      // Medium screens
      return 32;
    } else {
      // Desktop - original size
      return 14;
    }
  }

  private getResponsiveHeaderFontSize(): number {
    const width = window.innerWidth;
    const height = window.innerHeight;
    
    // Header font sizes for different screen sizes
    if (width <= 480) {
      // Mobile phones - larger header for better navigation
      return height <= 500 ? 32 : 36; // Landscape vs portrait
    } else if (width <= 768) {
      // Tablets and large phones
      return 36;
    } else if (width <= 1024) {
      // Medium screens
      return 13;
    } else {
      // Desktop - original size
      return 12;
    }
  }

  private getResponsiveHeaderPadding(): number {
    const width = window.innerWidth;
    return width <= 480 ? 6 : width <= 768 ? 4 : 2;
  }

  private getResponsiveTouchTarget(): number {
    const width = window.innerWidth;
    return width <= 768 ? 44 : 32; // Minimum 44px touch targets on mobile
  }

  private getResponsiveContentPadding(): number {
    const width = window.innerWidth;
    return width <= 480 ? 12 : width <= 768 ? 14 : 16;
  }

  private getResponsiveHeaderHeight(): number {
    const width = window.innerWidth;
    return width <= 480 ? 60 : width <= 768 ? 55 : 50;
  }

  private getResponsiveLineHeight(): string {
    const width = window.innerWidth;
    return width <= 480 ? '1.6' : width <= 768 ? '1.5' : '1.4';
  }

  private getResponsiveInputPadding(): number {
    const width = window.innerWidth;
    return width <= 480 ? 10 : width <= 768 ? 8 : 8;
  }

  private getResponsiveInputHeight(): number {
    const width = window.innerWidth;
    return width <= 480 ? 32 : width <= 768 ? 28 : 24;
  }

  private isTouchDevice(): boolean {
    return 'ontouchstart' in window || navigator.maxTouchPoints > 0;
  }

  private getResponsiveCanvasHeight(): number {
    const isMobile = window.innerWidth <= 480;
    const isTablet = window.innerWidth <= 768;
    
    // Increase base pixel height for better text quality on smaller screens
    if (isMobile) return 1200; // Higher resolution for mobile
    if (isTablet) return 1000; // Medium resolution for tablet
    return 900; // Standard resolution for desktop
  }

  // Public method for testing responsive font sizes
  public testFontSizes(): void {
    console.log('=== Font Size Test ===');
    console.log(`Current screen: ${window.innerWidth}x${window.innerHeight}`);
    console.log(`Font size: ${this.getResponsiveFontSize()}px`);
    console.log(`Header font size: ${this.getResponsiveHeaderFontSize()}px`);
    console.log(`Canvas height: ${this.getResponsiveCanvasHeight()}px`);
    console.log('======================');
    
    // Force update styles and show mini site for testing
    this.updateStyles();
    this.setVisible(true);
  }

  // Force larger fonts for mobile testing
  public forceMobileFonts(): void {
    if (!this.styleEl) return;
    
    console.log('Forcing mobile font sizes...');
    this.styleEl.textContent = `
      .mini-site { 
        color: #00ff00; 
        font-family: 'Courier New', monospace; 
        font-size: 20px !important; 
      }
      .terminal-prompt { 
        color: #00ff00; 
        margin-right: 8px; 
        flex-shrink: 0; 
        font-size: 20px !important;
      }
      .terminal-input { 
        background: transparent; 
        border: none; 
        color: #00ff00; 
        font-family: inherit; 
        font-size: 20px !important; 
        outline: none; 
        flex: 1;
        min-height: 35px;
        padding: 4px 0;
      }
      .terminal-header { 
        font-size: 18px !important;
      }
      .terminal-output { 
        line-height: 1.6 !important;
        font-size: 20px !important;
      }
    `;
    this.setVisible(true);
  }
}
