(function () {
  'use strict';

  /* ===========================
     State
     =========================== */

  var lang = 'EN';
  var conversationHistory = [];
  var isOpen = false;
  var isSending = false;
  var hasShownWelcome = false;
  var currentCategory = null;
  var chatGeneration = 0;
  var pendingTimer = null;
  var userActions = [];     /* every button label the user has clicked (lowercased) */

  /* ===========================
     Text / i18n
     =========================== */

  var TEXT = {
    EN: {
      title: 'Move Logistics Assistant',
      subtitle: 'Online now',
      welcome: "Hi! I'm your Move Logistics Assistant. How can I help with your move?",
      placeholder: 'Type your message...',
      error: "I'm sorry, I'm having trouble connecting. Please call Move Logistics at (210) 942-0357 for help.",
      langButton: 'ES',
      mainMenu: 'Main Menu'
    },
    ES: {
      title: 'Asistente Move Logistics',
      subtitle: 'En linea',
      welcome: 'Hola! Soy su Asistente de Move Logistics. Como puedo ayudarle con su mudanza?',
      placeholder: 'Escriba su mensaje...',
      error: 'Lo siento, tengo problemas para conectarme. Llame a Move Logistics al (210) 942-0357.',
      langButton: 'EN',
      mainMenu: 'Menu Principal'
    }
  };

  /* ===========================
     Menu Data
     =========================== */

  var MENU = [
    {
      id: 'quote', emoji: '\uD83D\uDCCB', label: 'Get a Quote', es: 'Cotizacion',
      directMsg: 'I would like to get a free moving quote.', directMsgEs: 'Me gustaria obtener una cotizacion gratuita para mi mudanza.',
      subs: [
        { label: 'Local Move', es: 'Mudanza Local', msg: 'I need a quote for a local move in the San Antonio area.', msgEs: 'Necesito una cotizacion para una mudanza local en el area de San Antonio.' },
        { label: 'Long Distance', es: 'Larga Distancia', msg: 'I need a quote for a long distance or out-of-state move.', msgEs: 'Necesito una cotizacion para una mudanza de larga distancia o fuera del estado.' },
        { label: 'Office Move', es: 'Oficina', msg: 'I need a quote for an office or commercial move.', msgEs: 'Necesito una cotizacion para una mudanza de oficina o comercial.' }
      ]
    },
    {
      id: 'local', emoji: '\uD83C\uDFE0', label: 'Local Moving', es: 'Mudanza Local',
      subs: [
        { label: 'What\'s Included', es: 'Que Incluye', msg: 'What is included in your local moving service?', msgEs: 'Que incluye su servicio de mudanza local?' },
        { label: 'Service Area', es: 'Area de Servicio', msg: 'What areas do you serve for local moves?', msgEs: 'Que areas cubren para mudanzas locales?' },
        { label: 'Why Choose Us', es: 'Por Que Elegirnos', msg: 'Why should I choose Move Logistics for my local move?', msgEs: 'Por que deberia elegir Move Logistics para mi mudanza local?' }
      ]
    },
    {
      id: 'longdistance', emoji: '\uD83D\uDE9A', label: 'Long Distance', es: 'Larga Distancia',
      subs: [
        { label: 'How It Works', es: 'Como Funciona', msg: 'How does your long distance moving service work?', msgEs: 'Como funciona su servicio de mudanza de larga distancia?' },
        { label: 'Destinations', es: 'Destinos', msg: 'What states and cities do you move to for long distance?', msgEs: 'A que estados y ciudades se mudan para larga distancia?' },
        { label: 'Licensing', es: 'Licencias', msg: 'Are you licensed for interstate moves?', msgEs: 'Estan licenciados para mudanzas interestatales?' }
      ]
    },
    {
      id: 'storage', emoji: '\uD83D\uDCE6', label: 'Storage', es: 'Almacenamiento',
      subs: [
        { label: 'Climate Controlled', es: 'Climatizado', msg: 'Tell me about your climate-controlled storage options.', msgEs: 'Cuentame sobre sus opciones de almacenamiento climatizado.' },
        { label: 'Short & Long Term', es: 'Corto y Largo Plazo', msg: 'Do you offer both short-term and long-term storage?', msgEs: 'Ofrecen almacenamiento a corto y largo plazo?' },
        { label: 'Security', es: 'Seguridad', msg: 'How secure is your storage facility?', msgEs: 'Que tan seguro es su almacen?' }
      ]
    },
    {
      id: 'packing', emoji: '\uD83D\uDCE5', label: 'Packing Services', es: 'Empaque',
      subs: [
        { label: 'Full Packing', es: 'Empaque Completo', msg: 'Tell me about your full packing service.', msgEs: 'Cuentame sobre su servicio de empaque completo.' },
        { label: 'Partial Packing', es: 'Empaque Parcial', msg: 'Do you offer partial packing where you only pack some items?', msgEs: 'Ofrecen empaque parcial donde solo empacan algunos articulos?' },
        { label: 'Packing Supplies', es: 'Materiales', msg: 'Do you sell packing supplies and moving boxes?', msgEs: 'Venden materiales de empaque y cajas para mudanza?' }
      ]
    },
    {
      id: 'contact', emoji: '\uD83D\uDCDE', label: 'Contact Us', es: 'Contactenos',
      subs: [
        { label: 'Phone & Text', es: 'Telefono y Texto', msg: 'What is the Move Logistics phone number?', msgEs: 'Cual es el numero de telefono de Move Logistics?' },
        { label: 'Locations', es: 'Ubicaciones', msg: 'Where are your office locations?', msgEs: 'Donde estan sus oficinas?' },
        { label: 'Hours', es: 'Horarios', msg: 'What are your business hours?', msgEs: 'Cual es su horario de atencion?' }
      ]
    }
  ];

  /* ===========================
     SVG Icons (inline styles for Safari)
     =========================== */

  var ICON_CHAT =
    '<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" style="width:28px;height:28px;fill:#ffffff;display:block;"><path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 14H5.2L4 17.2V4h16v12z"/></svg>';

  var ICON_SEND =
    '<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" style="width:18px;height:18px;fill:#ffffff;display:block;"><path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/></svg>';

  var ICON_BOLT =
    '<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" style="width:18px;height:18px;fill:#ffffff;display:block;"><path d="M7 2v11h3v9l7-12h-4l4-8z"/></svg>';

  /* ===========================
     DOM References
     =========================== */

  var bubble, chatWindow, messagesEl, inputEl, sendBtn, typingEl, langBtn;
  var headerTitle, headerSubtitle;

  /* ===========================
     Build DOM
     =========================== */

  function init() {
    injectStylesheet();
    buildBubble();
    buildChatWindow();
  }

  function injectStylesheet() {
    if (document.querySelector('link[href*="widget.css"]')) return;
    var link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = 'widget.css?v=' + Date.now();
    document.head.appendChild(link);
  }

  function buildBubble() {
    bubble = document.createElement('div');
    bubble.className = 'cps-chat-bubble';
    bubble.setAttribute('role', 'button');
    bubble.setAttribute('tabindex', '0');
    bubble.setAttribute('aria-label', 'Open Move Logistics chat assistant');
    bubble.innerHTML = ICON_CHAT;
    bubble.addEventListener('click', toggleChat);
    bubble.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggleChat(); }
    });
    document.body.appendChild(bubble);
  }

  function buildChatWindow() {
    chatWindow = document.createElement('div');
    chatWindow.className = 'cps-chat-window';
    chatWindow.setAttribute('role', 'dialog');
    chatWindow.setAttribute('aria-label', 'Move Logistics Chat Assistant');

    /* Header */
    var header = document.createElement('div');
    header.className = 'cps-chat-header';

    var headerLeft = document.createElement('div');
    headerLeft.className = 'cps-chat-header-left';

    var headerIcon = document.createElement('div');
    headerIcon.className = 'cps-header-icon';
    headerIcon.innerHTML = ICON_BOLT;

    var headerText = document.createElement('div');
    headerTitle = document.createElement('div');
    headerTitle.className = 'cps-chat-header-title';
    headerTitle.textContent = TEXT[lang].title;
    headerSubtitle = document.createElement('div');
    headerSubtitle.className = 'cps-chat-header-subtitle';
    headerSubtitle.textContent = TEXT[lang].subtitle;

    headerText.appendChild(headerTitle);
    headerText.appendChild(headerSubtitle);
    headerLeft.appendChild(headerIcon);
    headerLeft.appendChild(headerText);

    var headerRight = document.createElement('div');
    headerRight.className = 'cps-chat-header-right';

    langBtn = document.createElement('button');
    langBtn.className = 'cps-lang-toggle';
    langBtn.setAttribute('aria-label', 'Toggle language');
    langBtn.textContent = TEXT[lang].langButton;
    langBtn.addEventListener('click', toggleLanguage);

    var closeBtn = document.createElement('button');
    closeBtn.className = 'cps-close-btn';
    closeBtn.setAttribute('aria-label', 'Close chat');
    closeBtn.innerHTML = '\u00D7';
    closeBtn.addEventListener('click', toggleChat);

    headerRight.appendChild(langBtn);
    headerRight.appendChild(closeBtn);
    header.appendChild(headerLeft);
    header.appendChild(headerRight);

    /* Messages */
    messagesEl = document.createElement('div');
    messagesEl.className = 'cps-chat-messages';
    messagesEl.setAttribute('role', 'log');
    messagesEl.setAttribute('aria-live', 'polite');

    /* Typing indicator */
    rebuildTypingIndicator();

    /* Input area */
    var inputArea = document.createElement('div');
    inputArea.className = 'cps-chat-input-area';

    inputEl = document.createElement('input');
    inputEl.className = 'cps-chat-input';
    inputEl.type = 'text';
    inputEl.placeholder = TEXT[lang].placeholder;
    inputEl.setAttribute('aria-label', 'Type your message');
    inputEl.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); }
    });
    inputEl.addEventListener('focus', function () {
      setTimeout(function () {
        if (inputEl && inputEl.scrollIntoView) {
          inputEl.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
        }
      }, 300);
    });

    sendBtn = document.createElement('button');
    sendBtn.className = 'cps-send-btn';
    sendBtn.setAttribute('aria-label', 'Send message');
    sendBtn.innerHTML = ICON_SEND;
    sendBtn.addEventListener('click', handleSend);

    inputArea.appendChild(inputEl);
    inputArea.appendChild(sendBtn);

    chatWindow.appendChild(header);
    chatWindow.appendChild(messagesEl);
    chatWindow.appendChild(inputArea);
    document.body.appendChild(chatWindow);
  }

  function rebuildTypingIndicator() {
    typingEl = document.createElement('div');
    typingEl.className = 'cps-typing';
    typingEl.setAttribute('aria-label', 'Assistant is typing');
    for (var d = 0; d < 3; d++) {
      var dot = document.createElement('span');
      dot.className = 'cps-typing-dot';
      typingEl.appendChild(dot);
    }
    messagesEl.appendChild(typingEl);
  }

  /* ===========================
     FIX 4: BUTTON GROUP REMOVAL
     Every clickable action button lives inside a .cps-button-group div.
     nukeMyGroup walks up from the clicked element, removes the group,
     then removes ALL remaining groups as a safety net.
     =========================== */

  function nukeMyGroup(clickedElement) {
    var node = clickedElement;
    while (node && node !== messagesEl) {
      if (node.className && typeof node.className === 'string' && node.className.indexOf('cps-button-group') !== -1) {
        if (node.parentNode) {
          node.parentNode.removeChild(node);
        }
        break;
      }
      node = node.parentNode;
    }
    /* Safety: nuke ALL remaining .cps-button-group elements */
    var remaining = messagesEl.querySelectorAll('.cps-button-group');
    for (var i = 0; i < remaining.length; i++) {
      if (remaining[i].parentNode) {
        remaining[i].parentNode.removeChild(remaining[i]);
      }
    }
  }

  /* ===========================
     FIX 2: userActions check — returns true if label was already clicked
     =========================== */

  function isAlreadyClicked(label) {
    var lower = label.toLowerCase();
    for (var i = 0; i < userActions.length; i++) {
      if (userActions[i] === lower) return true;
    }
    return false;
  }

  /* ===========================
     Markdown Parser
     =========================== */

  function escapeHtml(str) {
    return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  function parseMarkdown(text) {
    var lines = text.split('\n');
    var htmlParts = [];
    var inList = false;
    var bulletPattern = /^[\s]*(?:[-*\u2022\u2023\u25E6\u25CF\u25CB]|\d+[\.\)])\s+(.+)$/;

    for (var i = 0; i < lines.length; i++) {
      var line = lines[i];
      var match = line.match(bulletPattern);
      if (match) {
        if (!inList) {
          htmlParts.push('<ul style="margin:4px 0;padding-left:18px;">');
          inList = true;
        }
        var itemHtml = escapeHtml(match[1]);
        itemHtml = itemHtml.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
        htmlParts.push('<li style="margin-bottom:2px;">' + itemHtml + '</li>');
      } else {
        if (inList) {
          htmlParts.push('</ul>');
          inList = false;
        }
        var escaped = escapeHtml(line);
        escaped = escaped.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
        htmlParts.push(escaped);
      }
    }
    if (inList) htmlParts.push('</ul>');

    var html = htmlParts.join('<br>');
    html = html.replace(/<br><ul/g, '<ul');
    html = html.replace(/<\/ul><br>/g, '</ul>');
    html = html.replace(/(<br>){3,}/g, '<br><br>');
    html = html.replace(/(<br>)+$/, '');
    html = html.replace(/^(<br>)+/, '');

    return { html: html };
  }

  function formatTimestamp(ms) {
    var d = new Date(ms);
    var h = d.getHours();
    var m = d.getMinutes();
    var ampm = h >= 12 ? 'PM' : 'AM';
    h = h % 12 || 12;
    m = m < 10 ? '0' + m : '' + m;
    return h + ':' + m + ' ' + ampm;
  }

  /* ===========================
     Message Rendering
     =========================== */

  function addBotMessage(text) {
    var parsed = parseMarkdown(text);

    var row = document.createElement('div');
    row.className = 'cps-msg-row bot cps-fade-in';

    var avatar = document.createElement('div');
    avatar.className = 'cps-avatar';
    avatar.textContent = '\u26A1';
    row.appendChild(avatar);

    var wrap = document.createElement('div');
    wrap.className = 'cps-msg-wrap';

    var msg = document.createElement('div');
    msg.className = 'cps-message bot';
    msg.innerHTML = parsed.html;
    wrap.appendChild(msg);

    var ts = document.createElement('div');
    ts.className = 'cps-timestamp';
    ts.textContent = formatTimestamp(Date.now());
    wrap.appendChild(ts);

    row.appendChild(wrap);
    messagesEl.insertBefore(row, typingEl);
    scrollToBottom();
  }

  function createStreamingBotMessage() {
    var row = document.createElement('div');
    row.className = 'cps-msg-row bot cps-fade-in';

    var avatar = document.createElement('div');
    avatar.className = 'cps-avatar';
    avatar.textContent = '\u26A1';
    row.appendChild(avatar);

    var wrap = document.createElement('div');
    wrap.className = 'cps-msg-wrap';

    var msg = document.createElement('div');
    msg.className = 'cps-message bot';
    wrap.appendChild(msg);

    var ts = document.createElement('div');
    ts.className = 'cps-timestamp';
    ts.textContent = formatTimestamp(Date.now());
    wrap.appendChild(ts);

    row.appendChild(wrap);
    messagesEl.insertBefore(row, typingEl);
    scrollToBottom();

    return msg;
  }

  function addUserMessage(text) {
    var row = document.createElement('div');
    row.className = 'cps-msg-row user cps-fade-in';

    var wrap = document.createElement('div');
    wrap.className = 'cps-msg-wrap';

    var msg = document.createElement('div');
    msg.className = 'cps-message user';
    msg.textContent = text;
    wrap.appendChild(msg);

    var ts = document.createElement('div');
    ts.className = 'cps-timestamp right';
    ts.textContent = formatTimestamp(Date.now());
    wrap.appendChild(ts);

    row.appendChild(wrap);
    messagesEl.insertBefore(row, typingEl);
    scrollToBottom();
  }

  /* ===========================
     FIX 1: GO BACK PILL — factory function
     Removes last bot response + last user message.
     If nothing left, shows main menu.
     Gray pill, always above Main Menu link.
     =========================== */

  function createGoBackPill() {
    var pill = document.createElement('div');
    pill.className = 'cps-pill cps-pill-back cps-fade-in';
    pill.setAttribute('role', 'button');
    pill.setAttribute('tabindex', '0');
    pill.textContent = '\u2190 Go Back';

    var handler = function () {
      /* FIX 4: remove entire button group FIRST */
      nukeMyGroup(pill);

      /* Remove last 2 message rows (bot + user) from DOM */
      var rows = messagesEl.querySelectorAll('.cps-msg-row');
      var removed = 0;
      for (var i = rows.length - 1; i >= 0 && removed < 2; i--) {
        if (rows[i].parentNode) {
          rows[i].parentNode.removeChild(rows[i]);
          removed++;
        }
      }

      /* Trim conversationHistory to match */
      if (conversationHistory.length > 0 && conversationHistory[conversationHistory.length - 1].role === 'assistant') {
        conversationHistory.pop();
      }
      if (conversationHistory.length > 0 && conversationHistory[conversationHistory.length - 1].role === 'user') {
        conversationHistory.pop();
      }

      /* Check what remains */
      var remainingRows = messagesEl.querySelectorAll('.cps-msg-row');
      if (remainingRows.length <= 1) {
        /* Nothing meaningful left — full main menu reset */
        doFullReset();
      } else {
        /* Still messages — show follow-ups for current state */
        renderFollowUps();
      }
    };

    pill.addEventListener('click', handler);
    pill.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handler(); }
    });

    return pill;
  }

  /* ===========================
     FIX 3: MAIN MENU FULL RESET — shared function
     messagesContainer.innerHTML = '', conversationHistory = [],
     userActions = [], currentCategory = null, then fresh welcome + menu.
     =========================== */

  function doFullReset() {
    messagesEl.innerHTML = '';
    conversationHistory.length = 0;
    userActions.length = 0;
    currentCategory = null;
    if (pendingTimer) { clearTimeout(pendingTimer); pendingTimer = null; }
    chatGeneration++;
    isSending = false;
    sendBtn.disabled = false;
    rebuildTypingIndicator();
    addBotMessage(TEXT[lang].welcome);
    renderMainMenu();
  }

  /* ===========================
     Main Menu Cards (inside .cps-button-group > .cps-menu-grid)
     =========================== */

  function renderMainMenu() {
    var group = document.createElement('div');
    group.className = 'cps-button-group';

    var grid = document.createElement('div');
    grid.className = 'cps-menu-grid cps-fade-in';

    for (var i = 0; i < MENU.length; i++) {
      (function (cat, idx) {
        var card = document.createElement('div');
        card.className = 'cps-menu-card';
        card.setAttribute('role', 'button');
        card.setAttribute('tabindex', '0');
        card.style.cssText = '-webkit-animation-delay:' + (idx * 0.04) + 's;animation-delay:' + (idx * 0.04) + 's;';

        var emojiSpan = document.createElement('span');
        emojiSpan.className = 'cps-menu-emoji';
        emojiSpan.textContent = cat.emoji;
        card.appendChild(emojiSpan);

        var labelText = lang === 'ES' && cat.es ? cat.es : cat.label;
        var labelNode = document.createTextNode(labelText);
        card.appendChild(labelNode);

        var handler = function () {
          /* FIX 4: nuke entire button group FIRST */
          nukeMyGroup(card);

          userActions.push(labelText.toLowerCase());
          currentCategory = cat.id;

          if (cat.directMsg) {
            addUserMessage(cat.emoji + ' ' + labelText);
            var apiMsg = lang === 'ES' && cat.directMsgEs ? cat.directMsgEs : cat.directMsg;
            sendMessage(apiMsg, true);
          } else {
            addUserMessage(cat.emoji + ' ' + labelText);
            showTypingThen(400, function () {
              renderSubOptions(cat);
            });
          }
        };

        card.addEventListener('click', handler);
        card.addEventListener('keydown', function (e) {
          if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handler(); }
        });

        grid.appendChild(card);
      })(MENU[i], i);
    }

    group.appendChild(grid);
    messagesEl.insertBefore(group, typingEl);
    scrollToBottom();
  }

  /* ===========================
     Sub-Option Pills (inside .cps-button-group)
     FIX 2: filters out buttons already in userActions
     FIX 1: includes Go Back pill
     =========================== */

  function renderSubOptions(cat) {
    var group = document.createElement('div');
    group.className = 'cps-button-group';

    var container = document.createElement('div');
    container.className = 'cps-pills cps-fade-in';

    var delay = 0;
    for (var i = 0; i < cat.subs.length; i++) {
      (function (sub, d) {
        var label = lang === 'ES' && sub.es ? sub.es : sub.label;

        /* FIX 2: skip if user already clicked this button */
        if (isAlreadyClicked(label)) return;

        var pill = createPill(label, function () {
          /* FIX 4: nuke entire button group FIRST */
          nukeMyGroup(pill);
          userActions.push(label.toLowerCase());
          var apiMsg = lang === 'ES' && sub.msgEs ? sub.msgEs : sub.msg;
          sendMessage(apiMsg);
        });
        pill.style.cssText = '-webkit-animation-delay:' + (d * 0.05) + 's;animation-delay:' + (d * 0.05) + 's;';
        pill.className = 'cps-pill cps-fade-in';
        container.appendChild(pill);
        delay++;
      })(cat.subs[i], delay);
    }

    /* FIX 1: Go Back pill (gray, above Main Menu) */
    var goBackPill = createGoBackPill();
    goBackPill.style.cssText = '-webkit-animation-delay:' + (delay * 0.05) + 's;animation-delay:' + (delay * 0.05) + 's;';
    container.appendChild(goBackPill);

    group.appendChild(container);

    /* Main Menu link inside same group so nukeMyGroup removes it too */
    var menuLink = createMainMenuLink();
    group.appendChild(menuLink);

    messagesEl.insertBefore(group, typingEl);
    scrollToBottom();
  }

  /* ===========================
     Follow-Up Pills (after bot responses)
     FIX 2: filters out buttons already in userActions
     FIX 1: includes Go Back pill
     =========================== */

  function renderFollowUps() {
    var group = document.createElement('div');
    group.className = 'cps-button-group';

    var container = document.createElement('div');
    container.className = 'cps-pills cps-fade-in';
    var delay = 0;

    /* Show remaining category sub-items (filtered by userActions) */
    if (currentCategory) {
      var cat = findCategory(currentCategory);
      if (cat) {
        for (var i = 0; i < cat.subs.length; i++) {
          (function (sub, d) {
            var label = lang === 'ES' && sub.es ? sub.es : sub.label;

            /* FIX 2: skip if user already clicked this button */
            if (isAlreadyClicked(label)) return;

            var pill = createPill(label, function () {
              /* FIX 4: nuke entire button group FIRST */
              nukeMyGroup(pill);
              userActions.push(label.toLowerCase());
              var apiMsg = lang === 'ES' && sub.msgEs ? sub.msgEs : sub.msg;
              sendMessage(apiMsg);
            });
            pill.className = 'cps-pill cps-fade-in';
            pill.style.cssText = '-webkit-animation-delay:' + (d * 0.05) + 's;animation-delay:' + (d * 0.05) + 's;';
            container.appendChild(pill);
            delay++;
          })(cat.subs[i], delay);
        }
      }
    }

    /* FIX 1: Go Back pill (gray, above Main Menu) */
    var goBackPill = createGoBackPill();
    goBackPill.style.cssText = '-webkit-animation-delay:' + (delay * 0.05) + 's;animation-delay:' + (delay * 0.05) + 's;';
    container.appendChild(goBackPill);

    group.appendChild(container);

    var menuLink = createMainMenuLink();
    group.appendChild(menuLink);

    messagesEl.insertBefore(group, typingEl);
    scrollToBottom();
  }

  /* ===========================
     Bracket Option Pills (from API response [bracketed] options)
     FIX 1: includes Go Back pill
     =========================== */

  function renderBracketOptions(options) {
    if (options.length === 0) return;

    var group = document.createElement('div');
    group.className = 'cps-button-group';

    var optContainer = document.createElement('div');
    optContainer.className = 'cps-pills cps-fade-in';

    var delay = 0;
    for (var i = 0; i < options.length; i++) {
      (function (optText, idx) {
        var pill = createPill(optText, function () {
          /* FIX 4: nuke entire button group FIRST */
          nukeMyGroup(pill);
          userActions.push(optText.toLowerCase());
          sendMessage(optText);
        });
        pill.style.cssText = '-webkit-animation-delay:' + (idx * 0.05) + 's;animation-delay:' + (idx * 0.05) + 's;';
        pill.className = 'cps-pill cps-fade-in';
        optContainer.appendChild(pill);
        delay++;
      })(options[i], i);
    }

    /* FIX 1: Go Back pill (gray, above Main Menu) */
    var goBackPill = createGoBackPill();
    goBackPill.style.cssText = '-webkit-animation-delay:' + (delay * 0.05) + 's;animation-delay:' + (delay * 0.05) + 's;';
    optContainer.appendChild(goBackPill);

    group.appendChild(optContainer);

    var menuLink = createMainMenuLink();
    group.appendChild(menuLink);

    messagesEl.insertBefore(group, typingEl);
    scrollToBottom();
  }

  /* ===========================
     FIX 3: Main Menu Link — FULL CHAT RESET
     messagesContainer.innerHTML = '', conversationHistory = [],
     userActions = [], currentCategory = null
     =========================== */

  function createMainMenuLink() {
    var menuLink = document.createElement('div');
    menuLink.className = 'cps-main-menu-link cps-fade-in';
    menuLink.textContent = TEXT[lang].mainMenu;
    menuLink.setAttribute('role', 'button');
    menuLink.setAttribute('tabindex', '0');

    var handler = function () {
      /* FIX 4: nuke entire button group FIRST */
      nukeMyGroup(menuLink);
      /* FIX 3: full reset */
      doFullReset();
    };

    menuLink.addEventListener('click', handler);
    menuLink.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handler(); }
    });

    return menuLink;
  }

  /* ===========================
     Pill Helper (generic pill creator)
     =========================== */

  function createPill(label, onClick) {
    var pill = document.createElement('div');
    pill.className = 'cps-pill';
    pill.setAttribute('role', 'button');
    pill.setAttribute('tabindex', '0');
    pill.textContent = label;
    pill.addEventListener('click', onClick);
    pill.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onClick(); }
    });
    return pill;
  }

  function findCategory(id) {
    for (var i = 0; i < MENU.length; i++) {
      if (MENU[i].id === id) return MENU[i];
    }
    return null;
  }

  /* ===========================
     Actions
     =========================== */

  function toggleChat() {
    isOpen = !isOpen;
    chatWindow.classList.toggle('open', isOpen);
    bubble.classList.toggle('hidden', isOpen);

    if (isOpen) {
      if (!hasShownWelcome) {
        showWelcome();
        hasShownWelcome = true;
      }
      inputEl.focus();
    }
  }

  function showWelcome() {
    addBotMessage(TEXT[lang].welcome);
    renderMainMenu();
  }

  function toggleLanguage() {
    lang = lang === 'EN' ? 'ES' : 'EN';
    langBtn.textContent = TEXT[lang].langButton;
    headerTitle.textContent = TEXT[lang].title;
    headerSubtitle.textContent = TEXT[lang].subtitle;
    inputEl.placeholder = TEXT[lang].placeholder;

    var msgs = messagesEl.querySelectorAll('.cps-msg-row');
    if (msgs.length <= 2) {
      doFullReset();
    }
  }

  function handleSend() {
    var text = inputEl.value.trim();
    if (!text || isSending) return;
    userActions.push(text.toLowerCase());
    /* FIX 4: remove all button groups before sending */
    var groups = messagesEl.querySelectorAll('.cps-button-group');
    for (var i = 0; i < groups.length; i++) {
      if (groups[i].parentNode) {
        groups[i].parentNode.removeChild(groups[i]);
      }
    }
    sendMessage(text);
  }

  /* ===========================
     Streaming Send
     =========================== */

  function sendMessage(text, skipUserMessage) {
    if (!skipUserMessage) addUserMessage(text);
    inputEl.value = '';
    inputEl.focus();
    sendBtn.disabled = true;
    isSending = true;

    conversationHistory.push({ role: 'user', content: text });
    showTyping(true);

    var myGen = chatGeneration;

    fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: text,
        history: conversationHistory.slice(0, -1)
      })
    })
      .then(function (res) {
        if (myGen !== chatGeneration) return;
        if (!res.ok) throw new Error('Server error');

        showTyping(false);
        var msgEl = createStreamingBotMessage();
        var fullText = '';
        var reader = res.body.getReader();
        var decoder = new TextDecoder();
        var buffer = '';

        function processChunk(result) {
          if (myGen !== chatGeneration) return;

          if (result.done) {
            var extracted = extractOptions(fullText);
            var parsed = parseMarkdown(extracted.cleanText);
            msgEl.innerHTML = parsed.html;

            /* FIX 2: filter out duplicate options via userActions */
            var dedupedChoices = filterDuplicateOptions(extracted.options);
            var hasChoices = dedupedChoices.length >= 2;
            var askingForInput = !hasChoices && needsTypedInput(fullText);

            conversationHistory.push({ role: 'assistant', content: fullText });

            if (hasChoices) {
              renderBracketOptions(dedupedChoices);
            } else if (askingForInput) {
              /* Bot asking for typed input — show Go Back + Main Menu */
              var group = document.createElement('div');
              group.className = 'cps-button-group';
              var pillsWrap = document.createElement('div');
              pillsWrap.className = 'cps-pills cps-fade-in';
              var goBackPill = createGoBackPill();
              pillsWrap.appendChild(goBackPill);
              group.appendChild(pillsWrap);
              var menuLink = createMainMenuLink();
              group.appendChild(menuLink);
              messagesEl.insertBefore(group, typingEl);
              inputEl.focus();
            } else {
              renderFollowUps();
            }

            isSending = false;
            sendBtn.disabled = false;
            scrollToBottom();
            return;
          }

          buffer += decoder.decode(result.value, { stream: true });
          var lines = buffer.split('\n');
          buffer = lines[lines.length - 1];

          for (var i = 0; i < lines.length - 1; i++) {
            var line = lines[i].trim();
            if (!line) continue;
            if (line.indexOf('data:') !== 0) continue;
            var payload = line.substring(5).trim();
            if (payload === '[DONE]') continue;

            try {
              var data = JSON.parse(payload);
              if (data.error) {
                fullText = TEXT[lang].error;
                msgEl.textContent = fullText;
                continue;
              }
              if (data.text) {
                fullText += data.text;
                var display = escapeHtml(fullText);
                display = display.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
                display = display.replace(/\n/g, '<br>');
                msgEl.innerHTML = display;
                scrollToBottom();
              }
            } catch (e) {
              /* skip malformed JSON */
            }
          }

          return reader.read().then(processChunk);
        }

        return reader.read().then(processChunk);
      })
      .catch(function () {
        if (myGen !== chatGeneration) return;
        showTyping(false);
        addBotMessage(TEXT[lang].error);
        renderFollowUps();
        isSending = false;
        sendBtn.disabled = false;
      });
  }

  /* ===========================
     Helpers
     =========================== */

  /* FIX 2: filter bracket options against userActions + current category */
  function filterDuplicateOptions(options) {
    if (!options || options.length === 0) return options;

    var blockList = [];

    /* 1) Every button the user has clicked */
    for (var a = 0; a < userActions.length; a++) {
      blockList.push(userActions[a]);
    }

    /* 2) Current category label */
    if (currentCategory) {
      for (var i = 0; i < MENU.length; i++) {
        if (MENU[i].id === currentCategory) {
          blockList.push(MENU[i].label.toLowerCase());
          if (MENU[i].es) blockList.push(MENU[i].es.toLowerCase());
          break;
        }
      }
    }

    /* Dedup blockList */
    var seen = {};
    var uniqueBlock = [];
    for (var d = 0; d < blockList.length; d++) {
      if (!seen[blockList[d]]) {
        seen[blockList[d]] = true;
        uniqueBlock.push(blockList[d]);
      }
    }

    var filtered = [];
    for (var j = 0; j < options.length; j++) {
      var optLower = options[j].toLowerCase();
      var isDupe = false;

      for (var k = 0; k < uniqueBlock.length; k++) {
        /* Exact match */
        if (optLower === uniqueBlock[k]) {
          isDupe = true;
          break;
        }

        /* Fuzzy match: compare significant words (3+ chars) */
        var blockedWords = uniqueBlock[k].split(/\s+/);
        var optWords = optLower.split(/\s+/);
        var matchCount = 0;
        var significantWords = 0;

        for (var w = 0; w < blockedWords.length; w++) {
          if (blockedWords[w].length < 3) continue;
          significantWords++;
          for (var v = 0; v < optWords.length; v++) {
            if (optWords[v].indexOf(blockedWords[w]) !== -1 || blockedWords[w].indexOf(optWords[v]) !== -1) {
              matchCount++;
              break;
            }
          }
        }

        if (significantWords > 0 && matchCount >= significantWords) {
          isDupe = true;
          break;
        }
      }

      if (!isDupe) {
        filtered.push(options[j]);
      }
    }

    return filtered;
  }

  function extractOptions(text) {
    var pattern = /\[([^\]]+)\]/g;
    var options = [];
    var match;
    while ((match = pattern.exec(text)) !== null) {
      options.push(match[1]);
    }
    if (options.length >= 2) {
      var cleanText = text.replace(/\s*\[([^\]]+)\]/g, '').trim();
      cleanText = cleanText.replace(/\n{3,}/g, '\n\n');
      return { options: options, cleanText: cleanText };
    }
    return { options: [], cleanText: text };
  }

  function needsTypedInput(text) {
    var trimmed = text.trim();
    if (trimmed.charAt(trimmed.length - 1) !== '?') return false;

    var lower = trimmed.toLowerCase();

    var wrapUp = [
      'anything else', 'help with anything', 'else i can help',
      'anything more', 'other questions', 'more questions',
      'would you like to know', 'want to know more',
      'does that help', 'is there anything', 'need anything',
      'have any other', 'any other question', 'further assistance',
      'would you like more', 'do you want more', 'want more details',
      'shall i explain', 'need more information', 'any questions',
      'does this answer', 'was this helpful', 'help with something',
      'want me to', 'like me to', 'need me to'
    ];

    for (var i = 0; i < wrapUp.length; i++) {
      if (lower.indexOf(wrapUp[i]) !== -1) return false;
    }

    return true;
  }

  function showTyping(show) {
    typingEl.classList.toggle('visible', show);
    scrollToBottom();
  }

  function showTypingThen(delayMs, callback) {
    showTyping(true);
    pendingTimer = setTimeout(function () {
      pendingTimer = null;
      showTyping(false);
      callback();
    }, delayMs);
  }

  function scrollToBottom() {
    requestAnimationFrame(function () {
      messagesEl.scrollTop = messagesEl.scrollHeight;
    });
  }

  /* ===========================
     Boot
     =========================== */

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
